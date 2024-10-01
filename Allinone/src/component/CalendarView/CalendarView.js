import React, { useState, useRef } from 'react';
import './CalendarView.css'; // Import the CSS file
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Button } from '@mui/material'; // You can use any button component you prefer
import { CalendarToday, ViewAgenda } from '@mui/icons-material'; // Material icons for view switching
import { getValidRange, getEvents } from './CalendarUtils'; // Import utility functions

export default function GoogleCalendarClone() {
  const [view, setView] = useState('dayGridMonth');
  const calendarRef = useRef(null); 

  // Get the current month
  const today = new Date();
  const validRange = getValidRange(today);

  // Toggle between day and month views
  const toggleView = () => {
    const calendarApi = calendarRef.current.getApi(); 
    if (view === 'dayGridMonth') {
      calendarApi.changeView('timeGridWeek'); // Switch to week view
      setView('timeGridWeek');
    } else {
      calendarApi.changeView('dayGridMonth'); // Switch to month view
      setView('dayGridMonth');
    }
  };

  // Destructure the events from the function
  const { personalEvents, teamEvents, blockoutEvents } = getEvents();

  // State to manage which checkboxes are selected
  const [showPersonal, setShowPersonal] = useState(true); //Set to be checked by default
  const [showTeam, setShowTeam] = useState(false);

  // Handler for checkbox change
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    if (name === 'personal') {
      setShowPersonal(checked);
    } else if (name === 'team') {
      setShowTeam(checked);
    }
  };
  // Combine personal and team events based on checkbox states
  const filteredEvents = [
    ...(showPersonal ? personalEvents : []),
    ...(showTeam ? teamEvents : []),
    ...blockoutEvents
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
              <h2>My Department <br/> Calendar</h2>
              
              {/* to fetch team/department name from API */}
              <input type="checkbox" name='personal' id='personal' style={{ transform: 'scale(1.5)' }} onChange={handleCheckboxChange} checked={showPersonal}/>
              <label htmlFor="personal" style={{fontSize: '20px'}}> Personal</label>
              <br/>

              <input type="checkbox" name='team' id='team' style={{ transform: 'scale(1.5)' }} onChange={handleCheckboxChange} checked={showTeam}/>
              <label htmlFor="team" style={{fontSize: '20px'}}> Team</label>
            </div>
            
          <div style={{flex: 1, marginLeft: '10px' }}>
            <div style={{display: "flex", justifyContent: "flex-end", marginBottom: '10px' }}> 
            <Button variant="contained" onClick={toggleView} startIcon={view === 'dayGridMonth' ? <ViewAgenda /> : <CalendarToday />}>
              {view === 'dayGridMonth' ? 'Week View' : 'Month View'}
            </Button> 
          </div>
            <FullCalendar
              ref={calendarRef} // Reference to the FullCalendar component
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView={view} // Start with the current view (month or day)
              events={filteredEvents} // Filtered events
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: '' // Hide the default view buttons (since we're using custom toggle buttons)
              }}
              validRange={validRange} // Limit navigation range
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
