package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
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

type Data struct {
	Firstname string
	Lastname  string
	Position  string
	Phone     string
	Email     string
}

type Claims struct {
	Username string
	jwt.StandardClaims
}
type cEmail struct {
	Email        string
	CurrentEmail string
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
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	var storedPassword string

	err = db.QueryRow("SELECT password FROM users WHERE username=$1", creds.Username).Scan(&storedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid username or password", http.StatusUnauthorized)
			return
		}
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(creds.Password))
	if err != nil {
		fmt.Println("Error comparing passwords:", err)
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
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
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}

func logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully. Please remove the token from your client."})
}

func home(w http.ResponseWriter, r *http.Request) {
	// tokenHeader := r.Header.Get("Authorization")
	// if tokenHeader == "" {
	// 	http.Error(w, "Missing token", http.StatusUnauthorized)
	// 	return
	// }

	// tokenStr := tokenHeader[len("Bearer "):]
	// claims := &Claims{}
	// token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
	// 	return jwtKey, nil
	// })

	// if err != nil {
	// 	if err == jwt.ErrSignatureInvalid {
	// 		http.Error(w, "Invalid token", http.StatusUnauthorized)
	// 		return
	// 	}
	// 	http.Error(w, "Bad request", http.StatusBadRequest)
	// 	return
	// }

	// if !token.Valid {
	// 	http.Error(w, "Invalid token", http.StatusUnauthorized)
	// 	return
	// }

	query := "SELECT * FROM data"
	rows, err := db.Query(query)
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
	mux.HandleFunc("/api/edit/", editData)

	corsMux := enableCors(mux)

	fmt.Println("Starting server on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", corsMux))
}
