"use client"
import React, { useState } from "react";
import { redirect } from 'next/navigation';
import { Box, Button, TextField, Typography } from "@mui/material";
import Link from "next/link";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<{ Username?: string; Password?: string }>({});


  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError("");
    setErrors({})
    let hasErrors = false;

    if (!username) {
      setErrors(prevErrors => ({ ...prevErrors, Username: 'Username is required' }));
      hasErrors = true;
    }

    if (!password) {
      setErrors(prevErrors => ({ ...prevErrors, Password: 'Password is required' }));
      hasErrors = true;

    } 
    
    if(hasErrors) return

    const response = await fetch("http://localhost:8080/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    if (response.ok) {
      const result = await response.json();
      localStorage.setItem('token', result.token);
      localStorage.setItem('userId', result.userId);
      window.location.href = '/home'
    } else {
      const errorData = await response.json();
      setError(errorData.error || 'An unknown error occurred');
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        padding: 0
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          width: 500,
          height: 400,
          borderRadius: 2,
          bgcolor: 'lightblue',
        }}
      >
        <Typography variant="h3" component="h2">Login</Typography>
        <form onSubmit={handleLogin}>
          <Box sx={{ position: 'relative', width: '100%' , display: 'flex', flexDirection:"column" , alignItems:"center"}}>
            <TextField
              margin="normal"
              label="username"
              onChange={(e) => setUsername(e.target.value)}
              error={!!errors.Username}
              helperText={errors.Username}
              sx={{ 
                minWidth: 250,
              }}
              />
            <TextField
              margin="normal"
              label="Password"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.Password}
              helperText={errors.Password}
              sx={{ 
                minWidth: 250, 
              }}
            />
            {error && (  
              <Typography color="error" sx={{
                fontSize: '14px',  
                fontWeight: 400,
              }}>
                {error}
              </Typography>
            )}
          </Box>
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Button variant="contained" type="submit">Login</Button>
            <Button variant="contained" color="warning">
              <Link href='/register' style={{ textDecoration: 'none', color: 'white' }}>Click here to Register</Link>
            </Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default LoginForm;
