/* eslint-disable no-unused-vars */
import { render, screen} from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock child components to isolate MainLayout
vi.mock('../components/AppHeader', () => ({ default: () => <div data-testid="mock-app-header">App Header</div> }));
vi.mock('../components/UserPreferencesCard', () => ({ default: ({onSaveSuccess}) => <div data-testid="mock-prefs-card">Prefs Card</div> }));
vi.mock('../views/CalendarView', () => ({ default: ({categoryFilterIds, categoryFilterKey}) => <div data-testid="mock-calendar-view">Calendar View</div> }));

// Mock API service used by MainLayout itself (only fetchUserProfile)
vi.mock('../api/apiService');
import { fetchUserProfile } from '../api/apiService';

// Import the REAL AuthContext to provide it
import { AuthContext } from '../contexts/AuthContext';
import MainLayout from './MainLayout';

// Mock data for initial load
const mockUserProfileData = {
    user: { id: 1, username: 'mainlayoutuser' },
    interested_categories: [{ id: 2, name: 'Cat 2' }],
};

// Helper to render with required contexts
const renderMainLayout = (authContextValue) => {
  fetchUserProfile.mockResolvedValue({ data: mockUserProfileData }); // Mock API call for initial load
  return render(
    <AuthContext.Provider value={authContextValue}>
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('MainLayout', () => {
  
  // Provide a mock auth context value, similar to what AppHeader needs
  const mockAuthContext = {
      user: { username: 'testuser' },
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
  };

  it('renders header, preferences card, and calendar view after loading prefs', async () => {
    renderMainLayout(mockAuthContext);

    // Check if loading state is rendered
    expect(screen.getByText(/loading preferences/i)).toBeInTheDocument(); 

    // Wait for components rendered by mocks to appear
    expect(await screen.findByTestId('mock-app-header')).toBeInTheDocument();
    expect(await screen.findByTestId('mock-prefs-card')).toBeInTheDocument();
    expect(await screen.findByTestId('mock-calendar-view')).toBeInTheDocument();

    // Verify the fetchUserProfile was called for initial load
    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });
});