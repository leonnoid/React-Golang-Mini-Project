package routes

import (
	"go-auth-app/handlers"
	"go-auth-app/middleware"
	"net/http"

	"github.com/gorilla/mux"
)

func InitializeRoutes() *mux.Router {
	router := mux.NewRouter()
	router.Methods("OPTIONS").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.WriteHeader(http.StatusOK)
	})
	router.Use(middleware.EnableCors)
	router.Use(middleware.JwtMiddleware)

	router.HandleFunc("/api/login", handlers.Login).Methods("POST")
	router.HandleFunc("/api/edit-profile", handlers.EditProfile).Methods("PUT")

	router.HandleFunc("/api/register", handlers.Register).Methods("POST")
	router.HandleFunc("/api/logout", handlers.Logout).Methods("POST")
	router.HandleFunc("/api/get", handlers.GetData).Methods("GET")
	router.HandleFunc("/api/add", handlers.AddData).Methods("POST")
	router.HandleFunc("/api/edit/{id}", handlers.EditData).Methods("PUT")
	router.HandleFunc("/api/check-email", handlers.CheckEmail).Methods("POST")
	router.HandleFunc("/api/delete", handlers.DeleteData).Methods("DELETE")
	router.HandleFunc("/api/get-profile/{id}", handlers.GetProfile).Methods("GET")
	router.HandleFunc("/api/check-username", handlers.CheckUsername).Methods("POST")

	return router
}
