import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import CalendarToolbar from './CalendarToolbar';

describe('CalendarToolbar', () => {
  it('renders the label and navigation buttons', () => {
    const mockNavigate = vi.fn();

    render(
      <CalendarToolbar
        label="Apr 10 – Apr 16, 2025"
        onNavigate={mockNavigate}
      />
    );

    // Check if label is displayed
    expect(screen.getByText('Apr 10 – Apr 16, 2025')).toBeInTheDocument();

    // Check if buttons are present (using aria-label)
    expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument();
  });
});