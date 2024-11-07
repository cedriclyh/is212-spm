import React, { useEffect, useState, useRef } from 'react';
import './CalendarView.css'; 
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { getBlockoutDates, getValidRange, getManagerTeamEvents, getPersonalEvents } from './CalendarUtils'; 
import Header from './Header';
import BasicEventFilter from './BasicEventFilter';
import Dashboard from './BasicDashboard';
import LoadingSpinner from './LoadingSpinner';

export default function WFHcalendar() {
  const [view, setView] = useState('dayGridMonth');
  const calendarRef = useRef(null); 
  const [teamEvents, setTeamEvents] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showPersonal, setShowPersonal] = useState(true);
  const [showTeam, setShowTeam] = useState(false);
  const [blockoutEvents, setBlockoutEvents] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state
  const userID = 140894; // Hardcoded for now

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true); 
      try {
        const teamEvents = await getManagerTeamEvents(userID); 
        setTeamEvents(teamEvents); 

        const personalEvents = await getPersonalEvents(userID); 
        setPersonalEvents(personalEvents);

        const blockouts = await getBlockoutDates(view);
          setBlockoutEvents(blockouts);
      } finally {
        setLoading(false); 
      }
    };
    fetchEvents();
  }, [view]);

  useEffect(() => {
    const combinedEvents = [
      ...(showPersonal && personalEvents ? personalEvents : []),
      ...(showTeam && teamEvents ? teamEvents : []),
      ... blockoutEvents
    ];
    setFilteredEvents(combinedEvents);
}, [showPersonal, showTeam,personalEvents, teamEvents]);

  const today = new Date();
  const validRange = getValidRange(today);

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

  const handleCheckboxChange = (values) => {
    setShowPersonal(values.includes('personal'));
    setShowTeam(values.includes('dept'));
  };
 
  return (
    <div className="calendar-container">
      {loading ? (
        <LoadingSpinner /> 
      ) : (
        <>
        <Dashboard events={filteredEvents}/>
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
            />
          </div>
        </div>
      </>
    )}
    </div>
  );
}
