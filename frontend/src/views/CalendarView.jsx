import { useState, useEffect, useCallback, useMemo } from 'react';
import format from 'date-fns/format';
import startOfWeek from 'date-fns/startOfWeek';
import addWeeks from 'date-fns/addWeeks';

import { Box, CircularProgress, Alert, Card, CardContent } from '@mui/material';

import CalendarToolbar from '../components/calendar/CalendarToolbar';
import CalendarGrid from '../components/calendar/CalendarGrid';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import UnsubscribeConfirmationModal from '../components/UnsubscribeConfirmationModal';

import { fetchTimeSlots, bookTimeSlot, unbookTimeSlot } from '../api/apiService';

// Constants
const formatDateForAPI = (date) => format(date, 'yyyy-MM-dd');
const weekStartsOn = 1; // Monday

function CalendarView({ categoryFilterIds, categoryFilterKey}) {
  // --- State ---
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [viewedWeekStart, setViewedWeekStart] = useState(
      () => startOfWeek(new Date(), { weekStartsOn })
  );
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [unsubscribeModalOpen, setUnsubscribeModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const loadEvents = useCallback(async (weekStartDate, currentCategoryFilters) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    console.log(`CalendarView: loadEvents called with filters: ${JSON.stringify(currentCategoryFilters)}`);
    try {
      const apiStartDate = formatDateForAPI(weekStartDate);
      console.log("CalendarView: Calling fetchTimeSlots with startDate:", apiStartDate, "and categoryId:", currentCategoryFilters);
      // Fetch using adjusted apiService call
      const response = await fetchTimeSlots(apiStartDate, currentCategoryFilters);
      const fetchedSlots = response.data || [];
      console.log("Fetched time slots:", fetchedSlots);

      if (!Array.isArray(fetchedSlots)) {
        console.error("Unexpected response format:", fetchedSlots);
        setError('Unexpected response format from server.');
        setEvents([]);
        setLoading(false);
        return;
      }
      // Transform (Keep existing transformation logic)
      const calendarEvents = fetchedSlots.map(slot => ({
        id: slot.id,
        title: slot.is_booked ? `Booked (${slot.booked_by_user ? 'You' : 'Other'})` : `Available`,
        start: new Date(slot.start_time),
        end: new Date(slot.end_time),
        isBooked: slot.is_booked,
        bookedByUser: slot.booked_by_user || false,
        resource: slot,
      })).filter(event => event !== null);
      setEvents(calendarEvents);

    } catch (err) {
      console.error("Error fetching time slots:", err);
      setError('Failed to load time slots.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to load events when week or CATEGORY FILTERS change
  useEffect(() => {
    if (categoryFilterIds !== undefined) {
      console.log(`CalendarView: useEffect trigger. Fetching for week ${viewedWeekStart} with filters ${JSON.stringify(categoryFilterIds)}`);
      loadEvents(viewedWeekStart, categoryFilterIds);
    } else {
      console.log("CalendarView: useEffect trigger. Waiting for initial filters.");
    }
  }, [viewedWeekStart, categoryFilterKey, loadEvents]);

  // --- Handlers ---
  const handleNavigate = useCallback((action) => {
    setViewedWeekStart(current => {
      if (action === 'PREV') return addWeeks(current, -1);
      if (action === 'NEXT') return addWeeks(current, 1);
      if (action instanceof Date) return startOfWeek(action, { weekStartsOn });
      return current;
    });
  }, []);

  const handleBookClick = useCallback((event) => {
    // (Keep the existing handleBookClick implementation)
    setSelectedSlot(event);
    setBookingModalOpen(true);
    setError(''); // Clear previous errors when opening modal
  }, []);

  const handleUnsubscribeClick = useCallback((event) => {
    // (Keep the existing handleUnsubscribeClick implementation)
    setSelectedSlot(event);
    setUnsubscribeModalOpen(true);
    setError(''); // Clear previous errors when opening modal
  }, []);

  const handleConfirmBooking = useCallback(async () => {
    if (!selectedSlot || actionInProgress) return;
    setActionInProgress(true);
    setError(''); setSuccessMessage('');
    try {
        await bookTimeSlot(selectedSlot.id);
        setSuccessMessage(`Successfully booked: ${format(selectedSlot.start, 'Pp')}`);
        setBookingModalOpen(false);
        setSelectedSlot(null);
        loadEvents(viewedWeekStart, categoryFilterIds);
    } catch (err) {
        console.error("Booking failed:", err);
        setError(err.response?.data?.detail || 'Booking failed.');
    } finally {
        setActionInProgress(false);
    }
  }, [selectedSlot, actionInProgress, viewedWeekStart, categoryFilterIds, loadEvents]);

  const handleConfirmUnsubscribe = useCallback(async () => {
    // (Keep the existing handleConfirmUnsubscribe implementation)
    if (!selectedSlot || actionInProgress) return;
    setActionInProgress(true);
    setError(''); setSuccessMessage('');
    try {
        await unbookTimeSlot(selectedSlot.id);
        setSuccessMessage(`Successfully unsubscribed: ${format(selectedSlot.start, 'Pp')}`);
        setUnsubscribeModalOpen(false);
        setSelectedSlot(null); // Clear selection
        loadEvents(viewedWeekStart, categoryFilterIds); // Refresh
    } catch (err) {
        console.error("Unsubscribe failed:", err);
        setError(err.response?.data?.detail || 'Unsubscribe failed.');
    } finally {
        setActionInProgress(false);
    }
  }, [selectedSlot, actionInProgress, viewedWeekStart, categoryFilterIds, loadEvents]);

  // --- Memoized Values ---
  const defaultDate = useMemo(() => new Date(), []);
  const weekEnd = useMemo(() => addWeeks(viewedWeekStart, 1), [viewedWeekStart]);
  const toolbarLabel = useMemo(() => `${format(viewedWeekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`, [viewedWeekStart, weekEnd]);


  // --- Render Logic ---
  return (
    <Card>
      <CardContent sx={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
        <CalendarToolbar
          label={toolbarLabel}
          onNavigate={handleNavigate}
        />
        {/* Display loading/error/success messages */}
        {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
        {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        {/* Calendar Grid */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}> 
          {!loading && (
            <CalendarGrid
              events={events}
              defaultDate={defaultDate}
              onBook={handleBookClick}
              onUnsubscribe={handleUnsubscribeClick}
            />
          )}
        </Box>

        {/* Modals (Render logic remains the same) */}
        {selectedSlot && (
          <BookingConfirmationModal
            open={bookingModalOpen}
            slot={selectedSlot}
            loading={actionInProgress}
            error={bookingModalOpen ? error : ''}
            onClose={() => setBookingModalOpen(false)}
            onConfirm={handleConfirmBooking}
          />
        )}
        {selectedSlot && (
          <UnsubscribeConfirmationModal
            open={unsubscribeModalOpen}
            slot={selectedSlot}
            loading={actionInProgress}
            error={unsubscribeModalOpen ? error : ''}
            onClose={() => setUnsubscribeModalOpen(false)}
            onConfirm={handleConfirmUnsubscribe}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default CalendarView;