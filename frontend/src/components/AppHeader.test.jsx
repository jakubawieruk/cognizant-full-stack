import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import AppHeader from './AppHeader';
import { AuthContext } from '../contexts/AuthContext';

const mockLogout = vi.fn();

// Helper to render with context provider
const renderWithAuth = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <AuthContext.Provider value={providerProps.value}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </AuthContext.Provider>,
    renderOptions
  );
};

describe('AppHeader', () => {

  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('renders logo and loading state when user is null initially', () => {
    const providerProps = {
      value: { user: null, logout: mockLogout, isAuthenticated: false, isLoading: true }
    };
    renderWithAuth(<AppHeader />, { providerProps });

    // Check for logo (using alt text)
    expect(screen.getByAltText(/event booker logo/i)).toBeInTheDocument();
    // Check for loading text (or whatever is shown when user is null)
    expect(screen.getByText(/loading.../i)).toBeInTheDocument();
    // Check Sign Out button is NOT present
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });

  it('renders logo, welcome message, and sign out button when user is authenticated', () => {
    const testUser = { username: 'testUser123' };
    const providerProps = {
      value: { user: testUser, logout: mockLogout, isAuthenticated: true, isLoading: false }
    };
    renderWithAuth(<AppHeader />, { providerProps });

    // Check for logo
    expect(screen.getByAltText(/event booker logo/i)).toBeInTheDocument();
    // Check for welcome message
    expect(screen.getByText(`Welcome, ${testUser.username}!`)).toBeInTheDocument();
    // Check Sign Out button IS present
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
     // Check Loading text is NOT present
    expect(screen.queryByText(/loading.../i)).not.toBeInTheDocument();
  });

  it('calls logout function when Sign Out button is clicked', async () => {
    const user = userEvent.setup();
    const testUser = { username: 'testUser123' };
    const providerProps = {
      value: { user: testUser, logout: mockLogout, isAuthenticated: true, isLoading: false }
    };
    renderWithAuth(<AppHeader />, { providerProps });

    const logoutButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});