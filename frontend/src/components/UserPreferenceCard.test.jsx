import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw'; 

import UserPreferencesCard from './UserPreferencesCard';
import { server } from '../mocks/server';

vi.mock('../api/apiService');

describe('UserPreferencesCard', () => {
  const setup = () => {
    const user = userEvent.setup();
    
    const mockOnSelectionChange = vi.fn();
    const mockOnSaveSuccess = vi.fn();
    
    render(
        <UserPreferencesCard
            onSelectionChange={mockOnSelectionChange}
            onSaveSuccess={mockOnSaveSuccess}
        />
    );
    return { user, mockOnSelectionChange, mockOnSaveSuccess };
  };

  it('loads categories and user preferences correctly', async () => {
    setup();

    // Wait for loading to finish and check if categories from MSW handlers are rendered
    expect(await screen.findByText('Mock Cat 1')).toBeInTheDocument();
    expect(screen.getByText('Mock Cat 2')).toBeInTheDocument();

    // Check if initially selected checkbox (from mock profile) is checked
    const checkbox1 = screen.getByRole('checkbox', { name: 'Mock Cat 1' });
    expect(checkbox1).toBeChecked();

    // Check if initially unselected checkbox is not checked
    const checkbox2 = screen.getByRole('checkbox', { name: 'Mock Cat 2' });
    expect(checkbox2).not.toBeChecked();
  });

  it('calls onSelectionChange when a checkbox is clicked', async () => {
    const { user, mockOnSelectionChange } = setup();

    // Wait for initial load
    const checkbox2 = await screen.findByRole('checkbox', { name: 'Mock Cat 2' });
    expect(checkbox2).not.toBeChecked(); // Verify initial state

    // Simulate user clicking the second checkbox
    await user.click(checkbox2);

    // Check if checkbox state changed in the DOM
    expect(checkbox2).toBeChecked();

    // Check if the callback was called with the new Set of IDs
    // The mock profile had Cat 1 initially selected (ID 1)
    // We clicked Cat 2 (ID 2)
    expect(mockOnSelectionChange).toHaveBeenCalledTimes(1); // Might be called once on load too, check mock
    // Get the arguments of the last call
    const lastCallArgs = mockOnSelectionChange.mock.calls[mockOnSelectionChange.mock.calls.length - 1][0];
    expect(lastCallArgs).toBeInstanceOf(Set);
    expect(lastCallArgs.size).toBe(2);
    expect(lastCallArgs.has(1)).toBe(true);
    expect(lastCallArgs.has(2)).toBe(true);
  });

 it('calls save preferences API when save button is clicked', async () => {
    const { user, mockOnSaveSuccess } = setup();

    expect(await screen.findByText('Mock Cat 1')).toBeInTheDocument();
    console.log("DOM after waiting for initial load:");
    screen.debug();

    // Wait for initial load
    const checkbox2 = await screen.findByRole('checkbox', { name: 'Mock Cat 2' });
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    // Initially button might be disabled if no changes
    expect(saveButton).toBeDisabled();

    // Click a checkbox to enable save
    await user.click(checkbox2);
    // await waitFor(() => expect(saveButton).toBeEnabled()); // Wait for button to be enabled

    // Spy on the specific API endpoint via MSW
    let updateCalled = false;
    server.use(
        http.put('/user/preferences/', async ({request}) => {
            updateCalled = true;
            const body = await request.json();
            expect(body.interested_category_ids).toEqual([1, 2]); // Expect sorted IDs perhaps
            return HttpResponse.json({ success: true }); // Mock success
        })
    );

    // Click the save button
    await user.click(saveButton);

    // Wait for loading indicator to disappear and check if API was called
    await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(updateCalled).toBe(true); // Verify MSW handler was hit
    expect(mockOnSaveSuccess).toHaveBeenCalled(); // Verify parent callback called
    expect(await screen.findByText(/preferences saved successfully/i)).toBeInTheDocument(); // Check snackbar
  });

});