import { expect, afterEach, beforeAll, afterAll } from 'vitest'; // Add imports
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server.js'; // Import mock server

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' })); // Error on unhandled requests

expect.extend(matchers);

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
// Clean up after each test case (e.g. clearing jsdom).
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after the tests are finished.
afterAll(() => server.close());