"use client"
import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import Link from "next/link";
import apiService from "@/components/apiService/apiService";

const RegisterForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ Username?: string; Password?: string }>({});

  const validateUsername = async (username: string) => {
    const response = await apiService.post('/api/check-username',{ username });
    if (!response.isUnique) {
      setErrors({ Username: 'Username already taken' });
      return false;
    }
    setErrors({});
    return true;
    
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    let hasErrors = false;

    if (!username || username === '') {
      setErrors(prevErrors => ({ ...prevErrors, Username: 'Username is required' }));
      hasErrors = true;
    }

    if (!password) {
      setErrors(prevErrors => ({ ...prevErrors, Password: 'Password is required' }));
      hasErrors = true;
    } else if (password.length < 8){
      setErrors(prevErrors => ({ ...prevErrors, Password: 'Password must be above 8 characters long'  }));
      hasErrors = true;
    }

    if(hasErrors) return

    const isUsernameValid = await validateUsername(username);
    if (!isUsernameValid) return;

    await apiService.post("/api/register", {username, password}); 

    alert("User registered successfully!");
    window.location.href = '/login'
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
        <Typography variant="h3" component="h2">Register</Typography>
        <form onSubmit={handleRegister}>
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
          </Box>
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Button variant="contained" type="submit">Register</Button>
            <Button variant="contained" color="warning"><Link href='/login' style={{textDecoration: 'none', color:'white'}}>Click here to Login</Link></Button>
          </Box>
        </form>
    </Box>
  </Box>
  );
};

export default RegisterForm;
