import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import format from 'date-fns/format';

import UnsubscribeConfirmationModal from './UnsubscribeConfirmationModal';

const mockSlot = {
    id: 6,
    start: new Date('2024-04-19T09:00:00Z'),
    end: new Date('2024-04-19T10:00:00Z'),
    resource: { category: { name: 'Unsub Cat' } }
};

describe('UnsubscribeConfirmationModal', () => {
  it('does not render when open is false', () => {
    render( <UnsubscribeConfirmationModal open={false} slot={mockSlot} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders correctly when open is true with slot data', () => {
    render( <UnsubscribeConfirmationModal open={true} slot={mockSlot} loading={false} error={null} onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Check Title using heading role
    expect(screen.getByRole('heading', { name: /confirm unsubscribe/i })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to unsubscribe/i)).toBeInTheDocument();
    expect(screen.getByText(format(mockSlot.start, 'EEE, MMM d, yyyy'))).toBeInTheDocument();
    expect(screen.getByText(`${format(mockSlot.start, 'p')} - ${format(mockSlot.end, 'p')} (${mockSlot.resource?.category?.name})`)).toBeInTheDocument();
    // Check buttons using role
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm unsubscribe/i })).toBeInTheDocument();
  });

  it('displays error message', () => {
     render( <UnsubscribeConfirmationModal open={true} slot={mockSlot} loading={false} error="Unsubscribe failed!" onClose={vi.fn()} onConfirm={vi.fn()} />);
     expect(screen.getByRole('alert')).toBeInTheDocument();
     expect(screen.getByText(/unsubscribe failed!/i)).toBeInTheDocument();
  });

   it('displays loading indicator and disables buttons', () => {
     render( <UnsubscribeConfirmationModal open={true} slot={mockSlot} loading={true} error={null} onClose={vi.fn()} onConfirm={vi.fn()} />);

     expect(screen.getByRole('progressbar')).toBeInTheDocument();
     expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

     const actions = screen.getByRole('dialog');
     const buttons = within(actions).getAllByRole('button');
     expect(buttons).toHaveLength(2);
     expect(buttons[0]).toHaveTextContent(/cancel/i);
     expect(buttons[0]).toBeDisabled();
     // Assert the second button (Confirm/Loading) is disabled and contains the spinner
     expect(buttons[1]).toBeDisabled();
     expect(within(buttons[1]).getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    render( <UnsubscribeConfirmationModal open={true} slot={mockSlot} loading={false} error={null} onClose={mockOnClose} onConfirm={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

   it('calls onConfirm when Confirm Unsubscribe button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnConfirm = vi.fn();
    render( <UnsubscribeConfirmationModal open={true} slot={mockSlot} loading={false} error={null} onClose={vi.fn()} onConfirm={mockOnConfirm} />);
    await user.click(screen.getByRole('button', { name: /confirm unsubscribe/i }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});