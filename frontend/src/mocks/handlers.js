import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:8000/api';
// Define mock data
const mockCategories = [
  { id: 1, name: 'Mock Cat 1' },
  { id: 2, name: 'Mock Cat 2' },
];
const mockUserProfile = {
  user: { id: 1, username: 'mockuser' },
  interested_categories: [{ id: 1, name: 'Mock Cat 1' }],
};

export const handlers = [
  http.options(`${API_BASE_URL}/categories/`, () => {
    console.log('MSW: Handling OPTIONS /api/categories/');
    return new HttpResponse(null, {
      status: 204, 
      headers: {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }),
  
  // Mock fetching categories
  http.get(`${API_BASE_URL}/categories/`, () => {
    console.log('MSW: Intercepting GET /api/categories/');
    return HttpResponse.json(mockCategories)
  }),

  http.options(`${API_BASE_URL}/user/preferences/`, () => {
    console.log('MSW: Handling OPTIONS /api/user/preferences/');
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }),

  // Mock fetching user profile
  http.get(`${API_BASE_URL}/user/preferences/`, () => {
    console.log('MSW: Intercepting GET /api/user/preferences/');
    return HttpResponse.json(mockUserProfile)
  }),

  // Mock updating preferences
  http.put(`${API_BASE_URL}/user/preferences/`, async () => {
    console.log('MSW: Mocking PUT /user/preferences/');
    return HttpResponse.json({ success: true }, { status: 200 })
  }),

  // Mock fetching timeslots (return empty array initially)
  http.get(`${API_BASE_URL}/timeslots/`, ({ request }) => {
    const url = new URL(request.url);
    const categoryIds = url.searchParams.getAll('category_id[]');
    console.log('MSW: Mocking GET /timeslots/ with categories:', categoryIds);
    return HttpResponse.json([]) // Return empty array for simplicity
  }),
]