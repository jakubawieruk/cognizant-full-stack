import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import UserPreferencesCard from './UserPreferencesCard';

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
});