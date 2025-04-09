import axios from 'axios';

// Get the base URL from environment variables, fallback for local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// --- Interceptor for adding Auth Token ---
// It automatically adds the 'Authorization' header to requests if a token is found.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// --- Authentication ---
export const loginUser = (credentials) => apiClient.post('/auth/login/', credentials); // {username, password}
export const logoutUser = () => apiClient.post('/auth/logout/');

// --- User Preferences ---
export const fetchUserProfile = () => apiClient.get('/user/preferences/');
export const updateUserPreferences = (categoryIds) => apiClient.put('/user/preferences/', { interested_category_ids: categoryIds });

// --- Categories ---
export const fetchCategories = () => apiClient.get('/categories/');

// --- Time Slots ---
// startDate should be 'YYYY-MM-DD'
export const fetchTimeSlots = (startDate, categoryIds = null) => {
  console.log(`API Call: fetchTimeSlots triggered with startDate=${startDate}, categoryIds=${JSON.stringify(categoryIds)}`);
  const params = {
    start_date: startDate,
    // Axios will automatically format this as category_id=1&category_id=3 etc. if categoryIds is [1, 3]
    category_id: categoryIds
  };

  // Remove category_id param if the array is empty, otherwise backend might try to filter by empty list
  if (!categoryIds || categoryIds.length === 0) {
    console.log("API Call: categoryIds is empty, deleting param");
    delete params.category_id;
  } else {
    console.log("API Call: categoryIds has value, keeping param:", params.category_id);
  }
  console.log("API Call: Sending params:", params); // Log final params
  return apiClient.get('/timeslots/', { params });
};
export const bookTimeSlot = (slotId) => {
  if (!slotId) return Promise.reject(new Error("Slot ID is required for booking."));
  return apiClient.post(`/timeslots/${slotId}/book/`);
}
export const unbookTimeSlot = (slotId) => {
  if (!slotId) return Promise.reject(new Error("Slot ID is required for unbooking."));
  return apiClient.post(`/timeslots/${slotId}/unbook/`);
}

export default apiClient;