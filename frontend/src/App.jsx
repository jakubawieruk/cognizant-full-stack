import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Container } from '@mui/material';

// Import views
import LoginView from './views/LoginView';

import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <CssBaseline />  {/* Apply MUI's CSS reset globally */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginView />} />

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