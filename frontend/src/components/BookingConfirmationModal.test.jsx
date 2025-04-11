import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import format from 'date-fns/format';

import BookingConfirmationModal from './BookingConfirmationModal';

// Mock slot data
const mockSlot = {
  id: 5,
  start: new Date('2024-04-18T14:00:00Z'),
  end: new Date('2024-04-18T15:00:00Z'),
  // resource needed if component uses it
  resource: { category: { name: 'Modal Cat' } }
};

describe('BookingConfirmationModal', () => {
  it('does not render when open is false', () => {
    const { container } = render(
      <BookingConfirmationModal
        open={false}
        slot={mockSlot}
        loading={false}
        error={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    // Check for content visibility
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Check if container is empty
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when open is true with slot data', () => {
    render(
      <BookingConfirmationModal
        open={true}
        slot={mockSlot}
        loading={false}
        error={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/confirm booking/i)).toBeInTheDocument(); // Dialog title
    expect(screen.getByText(/do you want to book the following slot/i)).toBeInTheDocument();
    // Check formatted date/time
    expect(screen.getByText(format(mockSlot.start, 'EEE, MMM d, yyyy'))).toBeInTheDocument();
    expect(screen.getByText(`${format(mockSlot.start, 'p')} - ${format(mockSlot.end, 'p')}`)).toBeInTheDocument();
    // Check buttons
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument(); // No error initially
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument(); // No loader initially
  });

  it('displays error message when error prop is provided', () => {
    render(
      <BookingConfirmationModal
        open={true}
        slot={mockSlot}
        loading={false}
        error="Slot already taken!"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/slot already taken!/i)).toBeInTheDocument();
  });

  it('displays loading indicator and disables buttons when loading is true', () => {
    render(
      <BookingConfirmationModal
        open={true}
        slot={mockSlot}
        loading={true}
        error={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    const confirmButtonContainer = screen.getByRole('button', { name: '' }); // Find button with no accessible name (because spinner)
    expect(confirmButtonContainer).toBeDisabled();
    expect(within(confirmButtonContainer).getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    render(
      <BookingConfirmationModal
          open={true} slot={mockSlot} loading={false} error={null}
          onClose={mockOnClose} onConfirm={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Confirm button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnConfirm = vi.fn();
    render(
      <BookingConfirmationModal
          open={true} slot={mockSlot} loading={false} error={null}
          onClose={vi.fn()} onConfirm={mockOnConfirm}
      />
    );
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

});