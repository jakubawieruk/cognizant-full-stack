import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { registerUser } from '../api/apiService';

import {
  Container, Box, Typography, TextField, Button, CircularProgress, Alert, Grid, Snackbar
} from '@mui/material';
import logoImage from '../assets/logo.png';

function RegisterView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState(''); // Password confirmation
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); 

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');

    // Basic frontend validation
    if (password !== passwordConfirmation) {
      setErrors({ password2: ["Passwords do not match."] });
      return;
    }

    setLoading(true);
    try {
      const userData = { username, password1: password, password2: passwordConfirmation };
      await registerUser(userData); // Call the API function

      // Handle Success
      setSuccessMessage('Registration successful! Please log in.');
      // Clear the form fields
      setUsername(''); 
      setPassword('');
      setPasswordConfirmation('');

      // Redirect to login after a short delay
      setTimeout(() => {
          navigate('/login');
      }, 1000); 

    } catch (err) {
      console.error("Registration failed:", err.response?.data || err.message);
      if (err.response && err.response.data) {
        // dj-rest-auth usually returns errors keyed by field name
        // e.g., { username: ["already exists"], email: ["Enter a valid email"] }
        setErrors(err.response.data);
      } else {
        setGeneralError('Registration failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box component="img" sx={{ width: '70%', maxWidth: 250, height: 'auto', mb: 3 }} alt="Logo" src={logoImage} />
        <Typography component="h1" variant="h5"> Sign Up </Typography>

        {generalError && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{generalError}</Alert>}
        {successMessage && <Alert severity="success" sx={{ width: '100%', mt: 2 }}>{successMessage}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal" required fullWidth id="username" label="Username" name="username"
            autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)}
            disabled={loading} error={!!errors.username} helperText={errors.username?.[0]} // Display first username error
          />
          <TextField
            margin="normal" required fullWidth name="password" label="Password" type="password" id="password"
            autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
            disabled={loading} error={!!errors.password || !!errors.password1} helperText={errors.password?.[0] || errors.password1?.[0]}
          />
          <TextField
            margin="normal" required fullWidth name="password2" label="Confirm Password" type="password" id="password2"
            autoComplete="new-password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
            disabled={loading} error={!!errors.password2} helperText={errors.password2?.[0]} // Display first password2 error
          />

          {/* Display non_field_errors if backend sends them */}
          {errors.non_field_errors && (
              <Alert severity="error" sx={{ width: '100%', mt: 1 }}>
                  {errors.non_field_errors.join(' ')}
              </Alert>
          )}

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading} >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>

          <Grid container justifyContent="flex-end">
            <Grid>
              <RouterLink to="/login" variant="body2">
                {"Already have an account? Sign In"}
              </RouterLink>
            </Grid>
          </Grid>
        </Box>
      </Box>
      {/* Optional: Snackbar for success instead of Alert */}
      {/* <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage('')} message={successMessage} /> */}
    </Container>
  );
}

export default RegisterView;