/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import apiClient, { loginUser as apiLogin, logoutUser as apiLogout, fetchUserProfile } from '../api/apiService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Initialize token from sessionStorage FIRST
  const [token, setToken] = useState(() => sessionStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  // Centralized function to fetch profile and set user
  const loadUserProfile = async () => {
    try {
      console.log("Attempting to load user profile...");
      const profileResponse = await fetchUserProfile();
      setUser(profileResponse.data.user);
      console.log("User profile loaded:", profileResponse.data.user);
      return true;
    } catch (error) {
      console.error("Failed to load user profile", error);
      // Clear potentially invalid token/user state if profile fetch fails
      setToken(null);
      sessionStorage.removeItem('authToken');
      setUser(null);
      return false;
    }
  };

  // Effect to manage interceptor and load user profile based on token presence
  useEffect(() => {
    console.log("AuthContext useEffect running, token:", token);

    // --- Setup Interceptor ---
    const interceptor = apiClient.interceptors.request.use(
      (config) => {
        // Get token directly from state for the interceptor logic
        if (token) {
          config.headers['Authorization'] = `Token ${token}`;
        } else {
          delete config.headers['Authorization'];
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // --- Check Auth / Load Profile ---
    let isMounted = true; // Prevent state updates on unmounted component

    const checkAuthAndLoadProfile = async () => {
      setIsLoading(true);
      if (token) {
        const profileLoaded = await loadUserProfile();
        if (isMounted && !profileLoaded) {
          // If loading failed (invalid token), ensure state is cleared
          setToken(null);
          sessionStorage.removeItem('authToken');
          setUser(null);
        }
      } else {
        // No token, ensure user is null
        setUser(null);
      }
      // Finish loading ONLY after checks/fetches are done
      if (isMounted) {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadProfile();

    // Cleanup function
    return () => {
      isMounted = false;
      // Eject interceptor on component unmount or token change before re-adding
      apiClient.interceptors.request.eject(interceptor);
      console.log("AuthContext interceptor ejected.");
    };
  }, [token]); // Re-run ONLY when token changes

  const login = async (credentials) => {
    console.log("AuthContext: Attempting login with credentials:", credentials);
    try {
      const response = await apiLogin(credentials);
      const newToken = response.data.key;
      sessionStorage.setItem('authToken', newToken); 
      setToken(newToken);
      console.log("Login successful, token set.");
    } catch (error) {
      console.error("Login failed:", error);
      // Clear any potentially stale token/user info on login failure
      setToken(null);
      sessionStorage.removeItem('authToken');
      setUser(null);
      throw error; // Re-throw error for the LoginView component
    }
  };

  const logout = async () => {
    try {
      // Only call API if token exists
      if (sessionStorage.getItem('authToken')) {
        await apiLogout();
        console.log("Logout API call successful.");
      }
    } catch (error) {
        console.error("Logout API call failed (might be okay if token already invalid):", error);
    } finally {
      // Always clear frontend state
      sessionStorage.removeItem('authToken');
      setToken(null);
      console.log("Frontend state cleared on logout.");
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};