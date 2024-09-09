package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"go-auth-app/database"
	"go-auth-app/models"
	"net/http"
	"os"
	"time"

	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte(os.Getenv("JWT_SECRET_KEY"))

func Login(w http.ResponseWriter, r *http.Request) {
	var creds models.Credentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	var storedPassword string
	var userID int
	dbConn := database.GetDB()
	err = dbConn.QueryRow("SELECT id, password FROM users WHERE username=$1", creds.Username).Scan(&userID, &storedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, `{"error": "Invalid username or password"}`, http.StatusUnauthorized)
			return
		}
		http.Error(w, `{"error": "Server error"}`, http.StatusInternalServerError)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(creds.Password))
	if err != nil {
		fmt.Println("Error comparing passwords:", err)
		http.Error(w, `{"error": "Invalid username or password"}`, http.StatusUnauthorized)
		return
	}

	expirationTime := time.Now().Add(15 * time.Minute)
	claims := &models.Claims{
		Username: creds.Username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		http.Error(w, `{"error": "Failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":  tokenString,
		"userId": userID,
	})
}

func EditProfile(w http.ResponseWriter, r *http.Request) {
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, `{"error": "Missing token"}`, http.StatusUnauthorized)
		return
	}
	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	} else {
		http.Error(w, `{"error": "Invalid token format"}`, http.StatusUnauthorized)
		return
	}

	token, err := jwt.ParseWithClaims(tokenString, &models.Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		http.Error(w, `{"error": "Invalid token"}`, http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(*models.Claims)
	if !ok || !token.Valid {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}
	username := claims.Username
	var currentPassword, currentUsername string
	var creds models.EditCredentials

	err = json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		fmt.Print(err)
		http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}
	dbConn := database.GetDB()
	err = dbConn.QueryRow("SELECT username, password FROM users WHERE username = $1", username).Scan(&currentUsername, &currentPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, `{"error": "User not found"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error": "Server error"}`, http.StatusInternalServerError)
		return
	}

	if creds.Newpassword != "" {
		err = bcrypt.CompareHashAndPassword([]byte(currentPassword), []byte(creds.Password))
		if err != nil {
			http.Error(w, `{"error":"Old password is incorrect"}`, http.StatusUnauthorized)
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Newpassword), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, `{"error":"Failed to hash password"}`, http.StatusInternalServerError)
			return
		}
		dbConn := database.GetDB()
		_, err = dbConn.Exec("UPDATE users SET password = $1 WHERE username = $2", hashedPassword, username)
		if err != nil {
			http.Error(w, `{"error": "Failed to update password"}`, http.StatusInternalServerError)
			return
		}
	}

	newUsername := username
	if creds.Username != currentUsername {
		if creds.Password == "" {
			http.Error(w, `{"error": "Old password is required to change username"}`, http.StatusBadRequest)
			return
		}
		err = bcrypt.CompareHashAndPassword([]byte(currentPassword), []byte(creds.Password))
		if err != nil {
			http.Error(w, `{"error": "Old password is incorrect"}`, http.StatusUnauthorized)
			return
		}

		dbConn := database.GetDB()
		_, err = dbConn.Exec("UPDATE users SET username = $1 WHERE username = $2", creds.Username, username)
		if err != nil {
			http.Error(w, `{"error": "Failed to update username"}`, http.StatusInternalServerError)
			return
		}

		newUsername = creds.Username
	}

	expirationTime := time.Now().Add(15 * time.Minute)
	newClaims := &models.Claims{
		Username: newUsername,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
	newTokenString, err := newToken.SignedString(jwtKey)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": newTokenString})
}
