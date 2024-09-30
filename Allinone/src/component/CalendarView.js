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
      calendarApi.changeView('timeGridWeek'); // Switch to week view
      setView('timeGridWeek');
    } else {
      calendarApi.changeView('dayGridMonth'); // Switch to month view
      setView('dayGridMonth');
    }
  };

  const getEvents = () => {
    // Dummy events
    const personalEvents = [
      { id: 1, title: 'Personal Meeting', start: '2024-10-01T10:00:00', end: '2024-10-01T11:00:00' },
      { id: 2, title: 'Doctor Appointment', date: '2024-09-30', allDay: true, backgroundColor: '#4caf50', }
    ];
    
    const teamEvents = [
      { id: 3, title: 'Team Standup', start: '2024-09-29', end: '2024-10-03' },
      { id: 4, title: 'Project Demo', start: '2024-09-30', end: '2024-09-30' }
    ];

    return { personalEvents, teamEvents };
  }; 

  // Destructure the events from the function
  const { personalEvents, teamEvents } = getEvents();

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
