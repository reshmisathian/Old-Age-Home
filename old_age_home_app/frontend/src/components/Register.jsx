import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Paper, Link } from '@mui/material';
import axios from 'axios';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import LockIcon from '@mui/icons-material/Lock';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Register = () => {
    const [input, setInput] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');

    const inputHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const registerHandler = () => {
        axios.post('http://localhost:3000/register', input)
            .then((res) => {
                setMessage(res.data.message);
            })
            .catch((err) => {
                setMessage(err.response?.data?.message || "Registration failed");
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
                    <AccessibilityNewIcon sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" mb={3} color="#1A237E">
                    Register
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
                    onClick={registerHandler}
                    fullWidth
                    sx={{ mt: 3, backgroundColor: '#3F51B5', '&:hover': { backgroundColor: '#303F9F' } }}
                >
                    Submit
                </Button>
                <Typography variant="body2" mt={2} color="error">
                    {message}
                </Typography>
                  {/* <Box mt={2}>
                    <Link href="/login" variant="body2" color="#1A237E">
                        Already have an account? Login
                    </Link> 
                </Box>  */}
            </Paper>
        </Box>
    );
};

export default Register;
