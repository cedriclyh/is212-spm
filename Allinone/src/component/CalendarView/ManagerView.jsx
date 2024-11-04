import React, { useEffect, useState, useRef } from 'react';
import './CalendarView.css'; // Import the CSS file
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { getValidRange, getManagerTeamEvents, getPersonalEvents } from './CalendarUtils'; // Import utility functions
import Header from './Header';
import BasicEventFilter from './BasicEventFilter';
import LoadingSpinner from './LoadingSpinner';

export default function WFHcalendar() {
  const [view, setView] = useState('dayGridMonth');
  const calendarRef = useRef(null); 
  const [teamEvents, setTeamEvents] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showPersonal, setShowPersonal] = useState(true);
  const [showTeam, setShowTeam] = useState(true);
  const [loading, setLoading] = useState(false); // Loading state
  const userID = 140894; // Hardcoded for now

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true); // Start loading
      try {
        const teamEvents = await getManagerTeamEvents(userID); 
        setTeamEvents(teamEvents); 

        const personalEvents = await getPersonalEvents(userID); 
        setPersonalEvents(personalEvents);
      } finally {
        setLoading(false); // Stop loading once data is fetched
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const combinedEvents = [
      ...(showPersonal && personalEvents ? personalEvents : []),
      ...(showTeam && teamEvents ? teamEvents : []),
    ];
    setFilteredEvents(combinedEvents);
}, [showPersonal, showTeam,personalEvents, teamEvents]);

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
  const handleCheckboxChange = (values) => {
    setShowPersonal(values.includes('personal'));
    setShowTeam(values.includes('dept'));
  };
 
  // Render the calendar
  return (
    <div className="calendar-container">
      {loading ? (
        <LoadingSpinner /> // Show loading spinner while data is loading
      ) : (
        <>
        <Header view={view} toggleView={toggleView} userID={userID}/>
        <div className="calendar-box">
          <div style={{ flex: '0 0 200px', paddingRight: '10px', paddingLeft: '10px' }}>
          <BasicEventFilter showPersonal={showPersonal} showTeam={showTeam} handleCheckboxChange={handleCheckboxChange} userID={userID}/>
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
      </>
    )}
    </div>
  );
}
