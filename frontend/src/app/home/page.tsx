'use client'
import { Box, Button, Typography } from "@mui/material";

const HomePage = () => {
    const handleLogout = async () => {
        try {
            // Call the logout API endpoint
            const response = await fetch('http://localhost:8080/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            
            localStorage.removeItem('token');
            if(response.ok){
                window.location.href = '/login'
            }
        } catch (error) {
            console.error('Logout failed', error);
        }
    };
    
    return (
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
            <Typography variant="h3" component="h2">Home Page</Typography>
            <Button onClick={handleLogout} variant="contained" color="primary">
                Logout
            </Button>
        </Box>
    );
  };
  
  export default HomePage;