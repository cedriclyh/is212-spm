import React, { useEffect, useState, useRef } from 'react';
import './CalendarView.css'; // Import the CSS file
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { getValidRange, getStaffTeamEvents, getPersonalEvents } from './CalendarUtils'; // Import utility functions
import Header from './Header';
import EventFilter from './EventFilter';

export default function GoogleCalendarClone() {
  const [view, setView] = useState('dayGridMonth');
  const calendarRef = useRef(null); 
  const [teamEvents, setTeamEvents] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [showPersonal, setShowPersonal] = useState(true);
  const [showTeam, setShowTeam] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const teamEvents = await getStaffTeamEvents(); // Fetch the team events
      setTeamEvents(teamEvents); // Update state with fetched events

      const personalEvents = await getPersonalEvents(); // Fetch the personal events
      setPersonalEvents(personalEvents); // Update state with fetched events
    };
    fetchEvents();
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
      <Header view={view} toggleView={toggleView} />
      <div className="calendar-box">
        <div>
          <EventFilter showPersonal={showPersonal} showTeam={showTeam} handleCheckboxChange={handleCheckboxChange}/>
        </div>
        <div style={{flex:'1'}}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView={view}
            events={filteredEvents}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            validRange={validRange}
            fontSize={16}
          />
        </div>
      </div>
    </div>
  );
}
