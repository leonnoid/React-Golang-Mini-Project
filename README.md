**Frontend Setup**<br />
go to the project file and open a terminal on the frontend section and run the command "npm install"<br />
run the project using 'npm run dev"<br />

**Database Setup**<br />
Register a new server on pg admin with: <br />
hostname/address: localhost<br />
Username: go_user<br />
Password: 12345678<br />
you can put the server name whatever you like<br />


**Backend Setup**<br />
on the backend part of the project, install packages used (if you haven't) by using these command<br />
"go get github.com/dgrijalva/jwt-go"<br />
"go get golang.org/x/crypto/bcrypt"<br />
"go get github.com/lib/pq"<br />
run the project by using "go run main.go"<br />

**Features**<br />
Register<br />
Login<br />
Authenticated page (verification by jwt in local storage)<br />
Add New data<br />
Delete Data<br />
Edit Data<br />
Sorting<br />
Pagination<br />
Change Profile data (jwt is created by username(uniique when registering), when there is a change on username, jwt will also be updated)<br />
Logout (removing jwt from localstorage)<br />
