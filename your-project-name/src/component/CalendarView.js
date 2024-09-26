import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
// import { Button } from '@mui/material'; // You can use any button component you prefer
// import { CalendarToday, ViewAgenda } from '@mui/icons-material'; // Material icons for view switching

export default function GoogleCalendarClone() {
  // State to toggle between day and month views
  const [view, setView] = useState('dayGridMonth');

  // Example events
  const events = [
    {
      title: 'Team Meeting',
      start: new Date(), // Today
      end: new Date(new Date().setHours(new Date().getHours() + 1)), // 1 hour event
    },
    {
      title: 'Client Meeting',
      start: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
      end: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(new Date().getHours() + 2)),
    },
    {
      title: 'Project Deadline',
      start: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 days from now
      allDay: true,
    },
  ];

  // Toggle between day and month views
  const toggleView = () => {
    setView(view === 'dayGridMonth' ? 'timeGridDay' : 'dayGridMonth');
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1 className="calendar-title">Calendar</h1>
        {/* <Button variant="contained" onClick={toggleView} startIcon={view === 'dayGridMonth' ? <ViewAgenda /> : <CalendarToday />}>
          {view === 'dayGridMonth' ? 'Day View' : 'Month View'}
        </Button> */}
      </div>
      <div className="calendar-body">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView={view} // Start with the current view (month or day)
          events={events} // List of events
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '' // Hide the default view buttons (since we're using custom toggle buttons)
          }}
          eventColor="blue" // Event styling
        />
      </div>
    </div>
  );
}
