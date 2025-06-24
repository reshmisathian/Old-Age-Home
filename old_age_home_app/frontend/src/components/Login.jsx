import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Link, Paper } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew'; 
import LockIcon from '@mui/icons-material/Lock';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Login = ({ setIsLoggedIn }) => {
    const [input, setInput] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const inputHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const loginHandler = () => {
        axios.post('http://localhost:3000/login', input)
            .then((res) => {
                localStorage.setItem("token", res.data.token);
                setMessage("Login successful");

                
                if (input.username === "admin") {
                    localStorage.setItem("isAdmin", "true");
                } else {
                    localStorage.setItem("isAdmin", "false");
                }

                setIsLoggedIn(true);
                navigate('/residents'); 
            })
            .catch((err) => {
                setMessage(err.response?.data?.message || "Login failed");
            });
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh" 
        >
            <Paper elevation={3} sx={{
                padding: 4,
                maxWidth: 400,
                borderRadius: 3, 
                textAlign: 'center',
            }}>
                <Box color="#1A237E" mb={2}>
                    {/* Caring for Elderly Icon */}
                    <AccessibilityNewIcon sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" mb={3} color="#1A237E">
                    Login
                </Typography>

                <TextField
                    label="Username"
                    name="username"
                    value={input.username}
                    onChange={inputHandler}
                    margin="normal"
                    fullWidth
                    variant="outlined"
                    InputProps={{
                        startAdornment: (
                            <AccountCircleIcon sx={{ color: '#7986CB', mr: 1 }} />
                        ),
                    }}
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={input.password}
                    onChange={inputHandler}
                    margin="normal"
                    fullWidth
                    variant="outlined"
                    InputProps={{
                        startAdornment: (
                            <LockIcon sx={{ color: '#7986CB', mr: 1 }} />
                        ),
                    }}
                />

                <Button
                    variant="contained"
                    onClick={loginHandler}
                    fullWidth
                    sx={{ mt: 3, backgroundColor: '#3F51B5', '&:hover': { backgroundColor: '#303F9F' } }} 
                >
                    Login
                </Button>
                <Typography variant="body2" mt={2} color="error">
                    {message}
                </Typography>
                {/* <Box mt={2}>
                    <Link href="#" variant="body2" color="#1A237E">
                        Forgot password?
                    </Link>
                </Box> */}
            </Paper>
        </Box>
    );
};

export default Login;
