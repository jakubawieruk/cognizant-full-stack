import { Box, Button, Typography } from '@mui/material';
import format from 'date-fns/format';

const CalendarEvent = ({ event, onBook, onUnsubscribe }) => {
  const { start, isBooked, bookedByUser, resource } = event;

  // Extract details from the resource
  const eventTitle = resource?.title || "Event";
  const categoryName = resource?.category?.name || "Unknown Category";

  return (
    <Box sx={{ fontSize: '0.75em', lineHeight: 1.3, position: 'relative', height: '100%', p: 0.5 }}>
      <Typography variant="body2" component="div" sx={{fontWeight: 'bold'}}>
        {format(start, 'p')}
      </Typography>
      <Typography variant="body2" component="div" noWrap title={eventTitle}>
        {eventTitle}
      </Typography>
      <Typography variant="caption" component="div" sx={{ color: 'inherit', opacity: 0.8 }}>
        {categoryName}
      </Typography>

      <Box sx={{ position: 'absolute', bottom: 2, right: 2 }}>
        {!isBooked && (
          <Button
              size="small"
              variant="contained"
              onClick={(e) => { e.stopPropagation(); onBook(event); }}
              sx={{ py: 0.2, px: 0.8, fontSize: '0.65rem', minWidth: 'auto' }} // Ensure button doesn't get too wide
          >
              Sign Up
          </Button>
        )}
        {isBooked && bookedByUser && (
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={(e) => { e.stopPropagation(); onUnsubscribe(event); }}
            sx={{ py: 0.2, px: 0.8, fontSize: '0.65rem', minWidth: 'auto' }}
          >
            Unsubscribe
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CalendarEvent;