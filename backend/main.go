package main

import (
	"fmt"
	"go-auth-app/database"
	"go-auth-app/routes"
	"go-auth-app/server"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSSLMode := os.Getenv("DB_SSLMODE")

	connStr := fmt.Sprintf("user=%s password=%s dbname=%s sslmode=%s",
		dbUser, dbPassword, dbName, dbSSLMode)
	database.ConnectDB(connStr)

	router := routes.InitializeRoutes()

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	server.StartServer(port, router)
}
