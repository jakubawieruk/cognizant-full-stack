import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

import logoImage from '../assets/logo.png';

function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth(); // Get the login function from context
  const navigate = useNavigate(); // Hook to navigate programmatically after login

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default HTML form submission
    setError(''); // Clear previous errors
    setLoading(true);

    try {
      // Call the login function from AuthContext
      await login({ username, password });

      navigate('/'); // Redirect to the main page upon successful login

    } catch (err) {
      console.error("Login failed:", err);
      setError('Login failed. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >

      <Box
        component="img"
        sx={{
          height: "auto",
          width: "70%",
          maxWidth: 250,
          mb: 3,
        }}
        alt="Bookking logo"
        src={logoImage}
      />
      <Typography component="h1" variant="h5">
        Sign in
      </Typography>

      {/* Show error message if login failed */}
      {error && (
        <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username"
          name="username"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading} // Disable input while loading
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading} // Disable input while loading
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 1, mb: 2 }}
          onClick={() => navigate('/register')}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign Up'}
        </Button>
      </Box>
      </Box>
    </Container>
  );
}

export default LoginView;