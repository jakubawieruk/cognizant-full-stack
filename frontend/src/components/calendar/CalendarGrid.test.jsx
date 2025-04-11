import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import CalendarGrid from './CalendarGrid';

describe('CalendarGrid', () => {
  const mockOnBook = vi.fn();
  const mockOnUnsubscribe = vi.fn();
  const defaultDate = new Date('2024-04-10T12:00:00Z');

  it('renders the day headers without crashing', async () => {
    render(
      <CalendarGrid
        events={[]} // Pass empty array for structural test
        defaultDate={defaultDate}
        onBook={mockOnBook}
        onUnsubscribe={mockOnUnsubscribe}
      />
    );
    // Verify basic structure rendering
    expect(await screen.findByRole('columnheader', { name: /mon/i })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: /tue/i })).toBeInTheDocument();
  });
});