"use client"
import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import Link from "next/link";

const RegisterForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
    const handleRegister = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        const response = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
        // Registration was successful
        alert("User registered successfully!");
        } else {
        // Handle registration error
        alert("Failed to register user.");
        }
    };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        bgcolor: '#007FFF', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        padding: 0
      }}
    >
    <form onSubmit={handleRegister}>
        <Box
            sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-around',
            width: 500,
            height: 300,
            borderRadius: 2,
            bgcolor: 'lightblue', 
            
            }}
        >
            <Typography variant="h3" component="h2">Register</Typography>
            
            <TextField id="outlined-basic" label="Username" variant="outlined" onChange={(e) => setUsername(e.target.value)}/>
            
            <TextField id="outlined-basic" label="Password" variant="outlined" type="password" onChange={(e) => setPassword(e.target.value)}/>
                
            <Button variant="contained" type="submit">Register</Button>
            <Button><Link href='/login' style={{textDecoration: 'none'}}>Click here to Login</Link></Button>
        </Box>
    </form>

    </Box>
  );
};

export default RegisterForm;
