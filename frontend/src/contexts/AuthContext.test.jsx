import {useState} from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';
import * as apiService from '../api/apiService';

vi.mock('../api/apiService');

const mockUserProfileData = {
  user: { id: 1, username: 'testuser' },
  interested_categories: [{ id: 1, name: 'Cat 1' }],
};
const mockLoginResponse = { key: 'valid-token-123' };

const TestConsumer = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [loginAttemptError, setLoginAttemptError] = useState(null);


  const handleLoginClick = async () => {
    setLoginAttemptError(null);
    try {
        console.log("TestConsumer: Calling login...");
        await login({ username: 'testuser', password: 'password' });
        console.log("TestConsumer: Login call finished (likely successfully).");
    } catch (error) {
        console.log("TestConsumer: Caught error from login:", error.message);
        setLoginAttemptError(error);
    }
};

const handleLogoutClick = async () => {
    // Logout doesn't re-throw in context, so no try/catch needed usually
    await logout();
};

if (isLoading) return <div>Auth Loading...</div>;

return (
  <div>
    <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
    <div data-testid="user-info">{user ? `User: ${user.username}` : 'User: null'}</div>
    {/* Display caught error */}
    {loginAttemptError && <div data-testid="login-error">Login Error: {loginAttemptError.message}</div>}
    <button onClick={handleLoginClick}>Login</button> {/* Use specific handler */}
    <button onClick={handleLogoutClick}>Logout</button> {/* Use specific handler */}
  </div>
);
};

// Helper to render consumer within provider
const renderAuthProvider = () => {
  render(
    <AuthProvider>
        <TestConsumer />
    </AuthProvider>
  );
};

describe('AuthContext', () => {

  beforeEach(() => {
    // Reset mocks and clear sessionStorage before each test
    vi.resetAllMocks();
    sessionStorage.clear();
  });

  it('initial state is loading, then not authenticated with no user', async () => {
    // Mock API call during initial load (if token doesn't exist, it shouldn't be called,
    // but if token DID exist and was invalid, it would be called)
    apiService.fetchUserProfile.mockRejectedValue(new Error('No profile'));

    renderAuthProvider();

    // Initially shows loading
    expect(await screen.findByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-info')).toHaveTextContent('User: null');

    expect(apiService.fetchUserProfile).not.toHaveBeenCalled();
  });

  it('login function calls API, updates state, sets token, and fetches profile', async () => {
    const user = userEvent.setup();
    // Mock API calls
    apiService.loginUser.mockResolvedValue({ data: mockLoginResponse });
    apiService.fetchUserProfile.mockResolvedValue({ data: mockUserProfileData });

    renderAuthProvider();

    // Wait for initial loading
    const loginButton = await screen.findByRole('button', { name: 'Login' });

    act(() => {
        user.click(loginButton);
    });

    // Check API calls
    await waitFor(() => expect(apiService.loginUser).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(apiService.loginUser).toHaveBeenCalledWith({ username: 'testuser', password: 'password' }));
    await waitFor(() => expect(apiService.fetchUserProfile).toHaveBeenCalledTimes(1));

    // Check final state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-info')).toHaveTextContent(`User: ${mockUserProfileData.user.username}`);
    expect(sessionStorage.getItem('authToken')).toBe(mockLoginResponse.key);
  });

  it('logout function calls API, updates state, and removes token', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('authToken', 'some-token');
    apiService.fetchUserProfile.mockResolvedValue({ data: mockUserProfileData });
    apiService.logoutUser.mockResolvedValue({});

    renderAuthProvider();
    const logoutButton = await screen.findByRole('button', { name: 'Logout' });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');

    // --- Use act for user interaction ---
    act(() => {
      user.click(logoutButton);
    });
    // --- End act ---

    await waitFor(() => expect(apiService.logoutUser).toHaveBeenCalledTimes(1));
    await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    expect(screen.getByTestId('user-info')).toHaveTextContent('User: null');
    expect(sessionStorage.getItem('authToken')).toBeNull();
  });

  it('handles login failure', async () => {
    const user = userEvent.setup();
    const loginErrorMessage = 'Invalid Credentials';
    const loginError = new Error(loginErrorMessage);
    loginError.response = { data: { non_field_errors: ['Unable to log in'] } };
    apiService.loginUser.mockRejectedValue(loginError);

    renderAuthProvider();
    const loginButton = await screen.findByRole('button', { name: 'Login' });
    
    await user.click(loginButton);

    // Check state remains logged out (might need waitFor if state update is delayed)
    await waitFor(() => {
      // Check that login API was called
      expect(apiService.loginUser).toHaveBeenCalledTimes(1);
      // Check that state reflects logged-out status
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('User: null');
      // Check storage is clear
      expect(sessionStorage.getItem('authToken')).toBeNull();
      // Check profile wasn't fetched
      expect(apiService.fetchUserProfile).not.toHaveBeenCalled();
    });
  });
});