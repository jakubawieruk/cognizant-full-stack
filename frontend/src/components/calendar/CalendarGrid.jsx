import { useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';

import CalendarEvent from './CalendarEvent';

// --- Localizer Setup ---
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarGrid = ({ events, defaultDate, onBook, onUnsubscribe }) => {

  const eventStyleGetter = useCallback((event) => {
    let className = 'rbc-event';
    if (event.isBooked) className += ' rbc-event-booked';
    if (event.bookedByUser) className += ' rbc-event-booked-user';
    const style = {
      border: '1px solid #b3b3b3',
      // Background will be handled by the event component or specific CSS overrides
      backgroundColor: event.isBooked ? (event.bookedByUser ? '#ffe0b2' : '#e0e0e0') : '#e3f2fd',
      borderRadius: '4px',
      opacity: 0.9,
      color: '#000',
      boxShadow: 'none',
    };
    return {
        className: className,
        style: style,
    };
  }, []);

  const components = useMemo(() => ({
      toolbar: () => null,
      event: (props) => (
          <CalendarEvent
              {...props}
              onBook={onBook}
              onUnsubscribe={onUnsubscribe}
          />
      ),
  }), [onBook, onUnsubscribe]); // Recreate if handlers change

  // Memoized formats object
  const formats = useMemo(() => ({
      dayFormat: (date, culture, localizer) => localizer.format(date, 'EEE d', culture),
      timeGutterFormat: (date, culture, localizer) => localizer.format(date, 'ha', culture),
  }), []);

  return (
      <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={[Views.WEEK]}
          defaultView={Views.WEEK}
          defaultDate={defaultDate}
          components={components}
          // Prevent internal navigation handling as parent's toolbar does it
          onNavigate={() => {}}
          // Click/Select is handled inside CalendarEvent now
          eventPropGetter={eventStyleGetter}
          culture='en-US'
          formats={formats}
      />
  );
};

export default CalendarGrid;