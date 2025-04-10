import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest'; // vi for mocking functions
import CalendarToolbar from './CalendarToolbar';

describe('CalendarToolbar', () => {
  it('renders the label and navigation buttons', () => {
    const mockNavigate = vi.fn();
    const mockCategories = [{ id: 1, name: 'Test' }];
    const mockFilterChange = vi.fn();

    render(
      <CalendarToolbar
        label="Apr 10 – Apr 16, 2025"
        onNavigate={mockNavigate}
        categories={mockCategories}
        categoryFilter=""
        onCategoryFilterChange={mockFilterChange}
      />
    );

    // Check if label is displayed
    expect(screen.getByText('Apr 10 – Apr 16, 2025')).toBeInTheDocument();

    // Check if buttons are present (using aria-label)
    expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument();

    // Check if category dropdown is present (might need adjustment based on MUI structure)
    expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
  });

  // Add tests for clicking buttons, changing dropdown etc. using userEvent
});