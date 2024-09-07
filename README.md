**Frontend Setup**<br />
go to the project file and open a terminal on the frontend section and run the command "npm install"<br />
run the project using 'npm run dev"<br />

**Database Setup**<br />
Register a new localhost server on pgadmin with your superuser credentials: <br />
hostname/address: localhost<br />
Username: postgres<br />
Password: {your super user password}<br />
you can put the server name whatever you like<br />
create a new DB on the new server with dbname go_auth_app
**Queries**

CREATE USER go_user WITH PASSWORD '12345678';
GRANT ALL PRIVILEGES ON DATABASE go_auth_app TO go_user;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    email VARCHAR(255) NOT NULL,
);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO go_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE data TO go_user;
GRANT USAGE, SELECT ON SEQUENCE data_id_seq TO go_user;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO go_user;



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
