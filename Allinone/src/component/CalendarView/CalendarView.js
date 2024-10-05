import React, { useEffect, useState, useRef } from 'react';
import './CalendarView.css'; // Import the CSS file
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Button } from '@mui/material'; // You can use any button component you prefer
import { CalendarToday, ViewAgenda } from '@mui/icons-material'; // Material icons for view switching
import { getValidRange, getTeamEvents, getPersonalEvents } from './CalendarUtils'; // Import utility functions

export default function GoogleCalendarClone() {
  const [view, setView] = useState('dayGridMonth');
  const calendarRef = useRef(null); 
  const [teamEvents, setTeamEvents] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const teamEvents = await getTeamEvents(); // Fetch the team events
      // console.log("Fetched Events:", teamEvents.teamEvents); 
      setTeamEvents(teamEvents.teamEvents); // Update state with fetched events

      const personalEvents = await getPersonalEvents(); // Fetch the personal events
      // console.log("Fetched Personal Events:", personalEvents.personalEvents); 
      setPersonalEvents(personalEvents.personalEvents); // Update state with fetched events
    };
    fetchEvents(); // Call the fetch function
  }, []); // Run once on mount

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


  // State to manage which checkboxes are selected
  const [showPersonal, setShowPersonal] = useState(true); //Set to be checked by default
  const [showTeam, setShowTeam] = useState(true);

  // Handler for checkbox change
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    if (name === 'personal') {
      setShowPersonal(checked);
    } else if (name === 'team') {
      setShowTeam(checked);
    }
  };

  const blockedEvents = [
    { id: 'grey1', start: '2024-10-04', end: '2024-10-05', allDay: true, display: 'background', title:'Blocked', classNames:['blocked-event'], color: '#808080' }, // Darker grey
    { id: 'grey2', start: '2024-10-10', end: '2024-10-12', allDay: true, display: 'background', title:'Blocked',classNames:['blocked-event'], color: '#808080' }  // Darker grey
  ];

  // Combine personal and team events based on checkbox states
  const filteredEvents = [
    ...(showPersonal ? personalEvents : []),
    ...(showTeam ? teamEvents : []),
    ...blockedEvents // Add blocked events
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