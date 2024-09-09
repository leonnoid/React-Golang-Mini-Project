package server

import (
	"log"
	"net/http"
)

func StartServer(port string, handler http.Handler) {
	log.Printf("Starting server on port %s...", port)
	err := http.ListenAndServe(":"+port, handler)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
