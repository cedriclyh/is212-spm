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
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showPersonal, setShowPersonal] = useState(true);
  const [showTeam, setShowTeam] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const teamEvents = await getStaffTeamEvents(); 
      setTeamEvents(teamEvents); 

      const personalEvents = await getPersonalEvents(); 
      setPersonalEvents(personalEvents);
    };
    fetchEvents();
  }, []); // Run once on mount

  useEffect(() => {
    if (personalEvents && teamEvents) {
      const combinedEvents = [
          ...(showPersonal ? personalEvents : []),
          ...(showTeam ? teamEvents : []),
      ];
      setFilteredEvents(combinedEvents); // Update filtered events based on states
  }
}, [showPersonal, showTeam, personalEvents, teamEvents]);

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
    } 
    else if (name === 'team') {
      setShowTeam(checked);
    }
  };

  // Render the calendar
  return (
    <div className="calendar-container">
      <Header view={view} toggleView={toggleView} />
      <div className="calendar-box">
        <div style={{ flex: '0 0 200px', paddingRight: '10px', paddingLeft: '10px' }}>
          <EventFilter showPersonal={showPersonal} showTeam={showTeam} handleCheckboxChange={handleCheckboxChange}/>
        </div>
        <div style={{flex:'1', minHeight: '0' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView={view}
            events={filteredEvents}
            slotEventOverlap = {false}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            validRange={validRange}
            fontSize={16}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
