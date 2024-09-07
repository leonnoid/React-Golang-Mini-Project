package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte("your_secret_key")

type Credentials struct {
	Username string
	Password string
}

type EditCredentials struct {
	Username    string
	Password    string
	Newpassword string
}

type Data struct {
	Firstname string
	Lastname  string
	Position  string
	Phone     string
	Email     string
}

type User struct {
	Id       int
	Username string
}

type Claims struct {
	Username string
	jwt.StandardClaims
}
type cEmail struct {
	Email        string
	CurrentEmail string
}
type userName struct {
	Username string
}

var db *sql.DB

func initDB() {
	var err error
	connStr := "user=go_user password=12345678 dbname=go_auth_app sslmode=disable"
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}
}

func enableCors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func register(w http.ResponseWriter, r *http.Request) {
	var creds Credentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	_, err = db.Exec("INSERT INTO users (username, password) VALUES ($1, $2)", creds.Username, string(hashedPassword))
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func login(w http.ResponseWriter, r *http.Request) {
	var creds Credentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	var storedPassword string
	var userID int
	err = db.QueryRow("SELECT id, password FROM users WHERE username=$1", creds.Username).Scan(&userID, &storedPassword)
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
	claims := &Claims{
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

func logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}
func jwtMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/register" || r.URL.Path == "/api/login" || r.URL.Path == "/api/check-username" {
			next.ServeHTTP(w, r)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header missing", http.StatusUnauthorized)
			return
		}

		tokenString := strings.Split(authHeader, "Bearer ")[1]
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func home(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT * FROM data")
	if err != nil {
		http.Error(w, "Query execution error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		http.Error(w, "Failed to get columns", http.StatusInternalServerError)
		return
	}

	var tableRows []map[string]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))

		for i := range values {
			valuePtrs[i] = &values[i]
		}

		err := rows.Scan(valuePtrs...)
		if err != nil {
			http.Error(w, "Failed to scan row", http.StatusInternalServerError)
			return
		}

		rowMap := make(map[string]interface{})
		for i, col := range columns {
			rowMap[col] = values[i]
		}
		tableRows = append(tableRows, rowMap)
	}

	response := map[string]interface{}{
		"rows": tableRows,
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func addData(w http.ResponseWriter, r *http.Request) {
	var data Data
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("INSERT INTO data (firstname, lastname, position, phone, email) VALUES ($1, $2, $3, $4, $5)", data.Firstname, data.Lastname, data.Position, data.Phone, data.Email)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(data)
}

func checkEmail(w http.ResponseWriter, r *http.Request) {
	var email cEmail
	err := json.NewDecoder(r.Body).Decode(&email)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	if email.Email == email.CurrentEmail {
		response := struct {
			IsUnique bool `json:"isUnique"`
		}{
			IsUnique: true,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	var exists bool
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM data WHERE email = $1)", email.Email).Scan(&exists)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	response := struct {
		IsUnique bool `json:"isUnique"`
	}{
		IsUnique: !exists,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func checkUsername(w http.ResponseWriter, r *http.Request) {
	var username userName
	err := json.NewDecoder(r.Body).Decode(&username)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	var exists bool
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", username.Username).Scan(&exists)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	response := struct {
		IsUnique bool `json:"isUnique"`
	}{
		IsUnique: !exists,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func editData(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/edit/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}
	var data Data
	err = json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	_, err = db.Exec("UPDATE data SET firstname = $1, lastname = $2, position = $3, phone = $4, email = $5 WHERE id = $6", data.Firstname, data.Lastname, data.Position, data.Phone, data.Email, id)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(data)
}

func deleteData(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/delete/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM data WHERE id = $1", id)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Record deleted successfully"})
}
func getProfile(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/get-profile/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}
	var user User
	err = db.QueryRow("SELECT id, username FROM users WHERE id = $1", id).Scan(&user.Id, &user.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
func editProfile(w http.ResponseWriter, r *http.Request) {
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

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		http.Error(w, `{"error": "Invalid token"}`, http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}
	username := claims.Username
	var currentPassword, currentUsername string
	var creds EditCredentials

	err = json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		fmt.Print(err)
		http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	err = db.QueryRow("SELECT username, password FROM users WHERE username = $1", username).Scan(&currentUsername, &currentPassword)
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

		_, err = db.Exec("UPDATE users SET password = $1 WHERE username = $2", hashedPassword, username)
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

		_, err = db.Exec("UPDATE users SET username = $1 WHERE username = $2", creds.Username, username)
		if err != nil {
			http.Error(w, `{"error": "Failed to update username"}`, http.StatusInternalServerError)
			return
		}

		newUsername = creds.Username
	}

	expirationTime := time.Now().Add(15 * time.Minute)
	newClaims := &Claims{
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

func main() {
	initDB()
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/register", register)
	mux.HandleFunc("/api/login", login)
	mux.HandleFunc("/api/home", home)
	mux.HandleFunc("/api/logout", logout)
	mux.HandleFunc("/api/add", addData)
	mux.HandleFunc("/api/check-email", checkEmail)
	mux.HandleFunc("/api/check-username", checkUsername)
	mux.HandleFunc("/api/edit/", editData)
	mux.HandleFunc("/api/delete/", deleteData)
	mux.HandleFunc("/api/get-profile/", getProfile)
	mux.HandleFunc("/api/edit-profile", editProfile)

	muxWithMiddleware := jwtMiddleware(mux)
	corsMux := enableCors(muxWithMiddleware)

	fmt.Println("Starting server on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", corsMux))
}
