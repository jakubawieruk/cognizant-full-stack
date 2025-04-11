import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { CssBaseline, Container } from '@mui/material';

import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';

import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <CssBaseline />  {/* MUI's CSS global reset */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout/>
              </ProtectedRoute>
            }
          />

          {/* Fallback or Redirect for unknown paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;