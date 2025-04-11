import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

import logoImage from '../assets/logo.png';

function AppHeader() {
  const { user, logout } = useAuth();

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
          alt="Event Booker Logo"
          src={logoImage}
        />
      </Box>
        {/* Conditionally render user info and logout button */}
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Welcome, {user.username || 'User'}!
            </Typography>
            <Button color="inherit" variant="outlined" onClick={handleLogout}>
              Sign Out
            </Button>
          </Box>
        ) : (
          // If user is not logged in, show loading text
          <Typography variant="body1">Loading...</Typography>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default AppHeader;