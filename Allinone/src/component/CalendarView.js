import React, { useState, useRef } from 'react';
import './CalendarView.css'; // Import the CSS file

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

import { Button } from '@mui/material'; // You can use any button component you prefer
import { CalendarToday, ViewAgenda } from '@mui/icons-material'; // Material icons for view switching
import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'; // For date manipulation

export default function GoogleCalendarClone() {
  // State to toggle between day and month views
  const [view, setView] = useState('dayGridMonth');
  const calendarRef = useRef(null); // Ref for FullCalendar instance

  // Get the current month
  const today = new Date();
  const startOfCurrentMonth = startOfMonth(today);
  
  // Define valid range (2 months back, 3 months forward)
  const validRange = {
    start: format(subMonths(startOfCurrentMonth, 2), 'yyyy-MM-dd'), // 2 months back from current month
    end: format(addMonths(endOfMonth(today), 3), 'yyyy-MM-dd')    // 3 months forward from current month
  };

  // Toggle between day and month views
  const toggleView = () => {
    const calendarApi = calendarRef.current.getApi(); // Get FullCalendar API
    if (view === 'dayGridMonth') {
      calendarApi.changeView('timeGridDay'); // Switch to day view
      setView('timeGridDay');
    } else {
      calendarApi.changeView('dayGridMonth'); // Switch to month view
      setView('dayGridMonth');
    }
  };

  // Example events
  const events = [
    {
      title: 'Team Meeting',
      start: '2024-10-01T10:00:00', // Starts on 1 October 10:00 AM
      duration: '6:00' // Duration of 6 hours
    },
    {
      title: 'Client Meeting',
      start: new Date(new Date().setDate(new Date().getDate())), // Today
      end: new Date(new Date(new Date().setDate(new Date().getDate())).setHours(new Date().getHours() + 2)), // 2 hours from now
    },
    {
      title: 'Project Deadline',
      start: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 days from now
      allDay: true,
    },
  ];

  // Render the calendar
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1 className="calendar-title">Welcome John!</h1>
        <div>
          <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
          >
            <div>
              <h2>My Calendar</h2>
              
              {/* to fetch team/department name from API */}
              <label>
                <p> Personal<input type="checkbox" checked="True" /> </p> 
            </label>
            </div>
            
          <div style={{flex: 1, marginLeft: '10px' }}>
            <div style={{display: "flex", justifyContent: "flex-end", marginBottom: '10px' }}> 
            <Button variant="contained" onClick={toggleView} startIcon={view === 'dayGridMonth' ? <ViewAgenda /> : <CalendarToday />}>
              {view === 'dayGridMonth' ? 'Day View' : 'Month View'}
            </Button> 
          </div>
            <FullCalendar
              ref={calendarRef} // Reference to the FullCalendar component
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView={view} // Start with the current view (month or day)
              events={events} // List of events
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: '' // Hide the default view buttons (since we're using custom toggle buttons)
              }}
              validRange={validRange} // Limit navigation range
              eventColor="blue" // Event styling
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
