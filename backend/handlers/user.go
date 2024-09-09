package handlers

import (
	"database/sql"
	"encoding/json"
	"go-auth-app/database"
	"go-auth-app/models"
	"net/http"
	"strconv"

	"golang.org/x/crypto/bcrypt"
)

func GetData(w http.ResponseWriter, r *http.Request) {
	dbConn := database.GetDB()
	rows, err := dbConn.Query("SELECT * FROM data")
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

func AddData(w http.ResponseWriter, r *http.Request) {
	var data models.Data
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	dbConn := database.GetDB()
	_, err = dbConn.Exec("INSERT INTO data (firstname, lastname, position, phone, email) VALUES ($1, $2, $3, $4, $5)", data.Firstname, data.Lastname, data.Position, data.Phone, data.Email)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(data)
}

func CheckEmail(w http.ResponseWriter, r *http.Request) {
	var email models.Email
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
	dbConn := database.GetDB()
	err = dbConn.QueryRow("SELECT EXISTS(SELECT 1 FROM data WHERE email = $1)", email.Email).Scan(&exists)
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

func CheckUsername(w http.ResponseWriter, r *http.Request) {
	var username models.UserName
	err := json.NewDecoder(r.Body).Decode(&username)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	var exists bool
	dbConn := database.GetDB()
	err = dbConn.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", username.Username).Scan(&exists)
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

func EditData(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/edit/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}
	var data models.Data
	err = json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	dbConn := database.GetDB()
	_, err = dbConn.Exec("UPDATE data SET firstname = $1, lastname = $2, position = $3, phone = $4, email = $5 WHERE id = $6", data.Firstname, data.Lastname, data.Position, data.Phone, data.Email, id)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(data)
}

func DeleteData(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/delete/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	dbConn := database.GetDB()
	_, err = dbConn.Exec("DELETE FROM data WHERE id = $1", id)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Record deleted successfully"})
}
func GetProfile(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/get-profile/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}
	var user models.User
	dbConn := database.GetDB()
	err = dbConn.QueryRow("SELECT id, username FROM users WHERE id = $1", id).Scan(&user.Id, &user.Username)
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

func Register(w http.ResponseWriter, r *http.Request) {
	var creds models.Credentials
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
	dbConn := database.GetDB()

	_, err = dbConn.Exec("INSERT INTO users (username, password) VALUES ($1, $2)", creds.Username, string(hashedPassword))
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func Logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}
