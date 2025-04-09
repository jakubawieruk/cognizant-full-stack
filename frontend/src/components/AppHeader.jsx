import React from 'react';
// import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook

import logoImage from '../assets/logo.png';

function AppHeader() {
  const { user, logout } = useAuth();
//   const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
      <Box sx={{ flexGrow: 1 }}>
        <Box
          component="img"
          sx={{
            height: 50,
            width: 'auto',
            display: 'block',
          }}
          alt="Event Booker Logo" // Descriptive alt text
          src={logoImage}
        />
      </Box>
        {/* Conditionally render user info and logout button */}
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}> {/* Margin right */}
              Welcome, {user.username || 'User'}! {/* Display username, fallback to 'User' */}
            </Typography>
            <Button color="inherit" variant="outlined" onClick={handleLogout}>
              Sign Out
            </Button>
          </Box>
        ) : (
          // Optionally show something else if user isn't loaded (though this header likely only shows when logged in)
          <Typography variant="body1">Loading...</Typography>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default AppHeader;