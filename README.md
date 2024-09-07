**Frontend Setup**
go to the project file and open a terminal on the frontend section and run the command "npm install"
run the project using 'npm run dev"

**Database Setup**
Register a new server on pg admin with: 
hostname/address: localhost
Username: go_user
Password: 12345678
you can put the server name whatever you like


**Backend Setup**
on the backend part of the project, install packages used (if you haven't) by using these command
"go get github.com/dgrijalva/jwt-go"
"go get golang.org/x/crypto/bcrypt"
"go get github.com/lib/pq"
run the project by using "go run main.go"

**Features**
Register
Login
Authenticated page (verification by jwt in local storage)
Add New data
Delete Data
Edit Data
Sorting
Pagination
Change Profile data (jwt is created by username(uniique when registering), when there is a change on username, jwt will also be updated)
Logout (removing jwt from localstorage)
