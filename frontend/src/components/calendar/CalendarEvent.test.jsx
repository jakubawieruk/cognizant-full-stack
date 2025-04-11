import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import format from 'date-fns/format';

import CalendarEvent from './CalendarEvent';

// Helper to create mock event data
const createMockEvent = (overrides = {}) => ({
  id: 1,
  title: 'Test Event Title',
  start: new Date('2024-04-15T10:00:00Z'),
  end: new Date('2024-04-15T11:00:00Z'),
  isBooked: false,
  bookedByUser: false,
  resource: {
    id: 1,
    category: { id: 1, name: 'Test Category Name' },
    start_time: '2024-04-15T10:00:00Z',
    end_time: '2024-04-15T11:00:00Z',
    is_booked: false,
    booked_by_user: false,
    title: 'Test Event Title'
  },
  ...overrides,
});

describe('CalendarEvent', () => {
  it('renders event details correctly for an available slot', () => {
    const mockEvent = createMockEvent();
    const mockOnBook = vi.fn();
    const mockOnUnsubscribe = vi.fn();

    render(<CalendarEvent event={mockEvent} onBook={mockOnBook} onUnsubscribe={mockOnUnsubscribe} />);

    // Check for time
    expect(screen.getByText(format(mockEvent.start, 'p'))).toBeInTheDocument();
    // Check for title
    expect(screen.getByText(mockEvent.resource.title)).toBeInTheDocument();
    // Check for category name
    expect(screen.getByText(mockEvent.resource.category.name)).toBeInTheDocument();
    // Check for "Sign Up" button presence
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    // Check "Unsubscribe" button is NOT present
    expect(screen.queryByRole('button', { name: /unsubscribe/i })).not.toBeInTheDocument();
  });

  it('renders event details correctly for a slot booked by the user', () => {
    const mockEvent = createMockEvent({
      isBooked: true,
      bookedByUser: true,
      resource: {
        ...createMockEvent().resource,
        is_booked: true,
        booked_by_user: true,
      }
    });
    const mockOnBook = vi.fn();
    const mockOnUnsubscribe = vi.fn();

    render(<CalendarEvent event={mockEvent} onBook={mockOnBook} onUnsubscribe={mockOnUnsubscribe} />);

    // Check details
    expect(screen.getByText(format(mockEvent.start, 'p'))).toBeInTheDocument();
    expect(screen.getByText(mockEvent.resource.title)).toBeInTheDocument();
    expect(screen.getByText(mockEvent.resource.category.name)).toBeInTheDocument();
    // Check "Sign Up" button is NOT present
    expect(screen.queryByRole('button', { name: /sign up/i })).not.toBeInTheDocument();
    // Check "Unsubscribe" button IS present
    expect(screen.getByRole('button', { name: /unsubscribe/i })).toBeInTheDocument();
  });

  it('renders event details correctly for a slot booked by another user', () => {
    const mockEvent = createMockEvent({
      isBooked: true,
      bookedByUser: false, // Booked, but not by current user
        resource: {
          ...createMockEvent().resource,
          is_booked: true,
          booked_by_user: false, // Backend field indicating not booked by request.user
        }
    });
    const mockOnBook = vi.fn();
    const mockOnUnsubscribe = vi.fn();

    render(<CalendarEvent event={mockEvent} onBook={mockOnBook} onUnsubscribe={mockOnUnsubscribe} />);

    // Check details
    expect(screen.getByText(format(mockEvent.start, 'p'))).toBeInTheDocument();
    // Check NO buttons are present
    expect(screen.queryByRole('button', { name: /sign up/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /unsubscribe/i })).not.toBeInTheDocument();
  });


  it('calls onBook with event data when Sign Up button is clicked', async () => {
    const user = userEvent.setup();
    const mockEvent = createMockEvent({ isBooked: false });
    const mockOnBook = vi.fn();
    const mockOnUnsubscribe = vi.fn();

    render(<CalendarEvent event={mockEvent} onBook={mockOnBook} onUnsubscribe={mockOnUnsubscribe} />);

    const signUpButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(signUpButton);

    expect(mockOnBook).toHaveBeenCalledTimes(1);
    expect(mockOnBook).toHaveBeenCalledWith(mockEvent); // Verify correct event passed
    expect(mockOnUnsubscribe).not.toHaveBeenCalled();
  });

  it('calls onUnsubscribe with event data when Unsubscribe button is clicked', async () => {
    const user = userEvent.setup();
    const mockEvent = createMockEvent({ isBooked: true, bookedByUser: true }); // Ensure user booked it
    const mockOnBook = vi.fn();
    const mockOnUnsubscribe = vi.fn();

    render(<CalendarEvent event={mockEvent} onBook={mockOnBook} onUnsubscribe={mockOnUnsubscribe} />);

    const unsubscribeButton = screen.getByRole('button', { name: /unsubscribe/i });
    await user.click(unsubscribeButton);

    expect(mockOnUnsubscribe).toHaveBeenCalledTimes(1);
    expect(mockOnUnsubscribe).toHaveBeenCalledWith(mockEvent);
    expect(mockOnBook).not.toHaveBeenCalled();
  });
});