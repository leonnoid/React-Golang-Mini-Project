"use client"
import React, { useState } from "react";
import { redirect } from 'next/navigation';
import { Box, Button, TextField, Typography } from "@mui/material";
import Link from "next/link";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");

  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError("");
    console.log(1)
    const response = await fetch("http://localhost:8080/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    console.log(2)
    console.log(3)
    if (response.ok) {
      const result = await response.json();
      setToken(result.token);
      window.location.href = '/home'
    } else {
      if(response.statusText == "Unauthorized") {
        setError("Wrong Credentials");
      } else{
        setError(response.statusText)
      }
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
      <form onSubmit={handleLogin}>
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
          <Typography variant="h3" component="h2">Login</Typography>
          
          <TextField id="outlined-basic" label="Username" variant="outlined" onChange={(e) => setUsername(e.target.value)}/>
          
          <TextField id="outlined-basic" label="Password" variant="outlined" type="password" onChange={(e) => setPassword(e.target.value)}/>
            
          <Button variant="contained" type="submit">Login</Button>
          <Button><Link href='/register' style={{textDecoration: 'none'}}>Click here to Register</Link></Button>
          {error && (  
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </form>
    </Box>
  );
};

export default LoginForm;
