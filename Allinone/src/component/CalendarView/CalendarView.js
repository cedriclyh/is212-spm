import React, { useEffect, useState, useRef } from 'react';
import './CalendarView.css'; // Import the CSS file
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Button } from '@mui/material'; // You can use any button component you prefer
import { Block, CalendarToday, ViewAgenda } from '@mui/icons-material'; // Material icons for view switching
import { getValidRange, getTeamEvents, getPersonalEvents, getBlockoutDates } from './CalendarUtils'; // Import utility functions
import BlockoutPopup from './BlockoutPopup';

export default function GoogleCalendarClone() {
  const [view, setView] = useState('dayGridMonth');
  const calendarRef = useRef(null); 
  const [teamEvents, setTeamEvents] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [blockouts, setBlockouts] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      console.log("Fetching team events..."); // Debugging log
      const teamEvents = await getTeamEvents(); // Fetch the team events
      console.log("Fetched Team Events:", teamEvents); 
      setTeamEvents(teamEvents); // Update state with fetched events
    
      console.log("Fetching personal events..."); // Debugging log
      const personalEvents = await getPersonalEvents(); // Fetch the personal events
      console.log("Fetched Personal Events:", personalEvents); 
      setPersonalEvents(personalEvents); // Update state with fetched events
    };

    const fetchBlockoutDates = async () => {
      const blockouts = await getBlockoutDates(); // Fetch blockout dates
      console.log("Fetched Blockouts:", blockouts);
      setBlockouts(blockouts || []); // Update state with fetched blockout events
    };

    fetchBlockoutDates();
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
  
  // const blockedEvents = [
    // { id: 'grey1', start: '2024-10-04', end: '2024-10-05', allDay: true, display: 'background', title:'Blocked', classNames:['blocked-event'], color: '#808080' }, // Darker grey
    // { id: 'grey2', start: '2024-10-10', end: '2024-10-12', allDay: true, display: 'background', title:'Blocked',classNames:['blocked-event'], color: '#808080' }  // Darker grey
  // ];

  // Combine personal and team events based on checkbox states
  const filteredEvents = [
    ...(showPersonal ? personalEvents : []),
    ...(showTeam ? teamEvents : []),
    ...blockouts // Add blocked events
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
            <BlockoutPopup/>
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
