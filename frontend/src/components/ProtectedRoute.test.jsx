import { render, screen } from '@testing-library/react';
import { describe, it, expect} from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom'; // Need Router context

import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../contexts/AuthContext';

// Helper to render with context and routes
const renderWithRouterAndAuth = (ui, { providerProps, initialEntries = ['/protected'] }) => {
  return render(
    <AuthContext.Provider value={providerProps.value}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={ui} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute', () => {
  it('renders loading state when isLoading is true', () => {
    const providerProps = {
      value: { user: null, isAuthenticated: false, isLoading: true } // isLoading true
    };
    renderWithRouterAndAuth(
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
        { providerProps }
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // Assuming loading uses CircularProgress
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    const providerProps = {
      value: { user: {username: 'test'}, isAuthenticated: true, isLoading: false } // Authenticated
    };
    renderWithRouterAndAuth(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
      { providerProps }
    );
    // Check that the children are rendered
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    // Check that we are NOT redirected to login
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    const providerProps = {
      value: { user: null, isAuthenticated: false, isLoading: false } // Not authenticated
    };
    renderWithRouterAndAuth(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
      { providerProps }
    );
    // Check that children are NOT rendered
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    // Check that we ARE redirected to login
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});