import { Dialog as MuiDialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Typography, CircularProgress, Alert } from '@mui/material';
import format from 'date-fns/format';

function UnsubscribeConfirmationModal({ open, slot, loading, error, onClose, onConfirm }) {
  if (!slot) return null;

  return (
    <MuiDialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Unsubscribe</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to unsubscribe from the following slot?
        </DialogContentText>
        <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
          {format(slot.start, 'EEE, MMM d, yyyy')}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {format(slot.start, 'p')} - {format(slot.end, 'p')} ({slot.resource?.category?.name})
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="secondary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Confirm Unsubscribe'}
        </Button>
      </DialogActions>
    </MuiDialog>
  );
}
export default UnsubscribeConfirmationModal;
