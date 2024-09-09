package models

import "github.com/dgrijalva/jwt-go"

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
type Email struct {
	Email        string
	CurrentEmail string
}
type UserName struct {
	Username string
}
