import { Dialog as MuiDialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Typography, CircularProgress, Alert } from '@mui/material';
import format from 'date-fns/format';

function BookingConfirmationModal({ open, slot, loading, error, onClose, onConfirm }) {
  if (!slot) return null; // Don't render if no slot selected

  return (
    <MuiDialog open={open} onClose={onClose}>
    <DialogTitle>Confirm Booking</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Do you want to book the following slot?
      </DialogContentText>
      <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
        {format(slot.start, 'EEE, MMM d, yyyy')}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
        {format(slot.start, 'p')} - {format(slot.end, 'p')}
      </Typography>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Confirm'}
      </Button>
    </DialogActions>
    </MuiDialog>
  );
}

export default BookingConfirmationModal;
