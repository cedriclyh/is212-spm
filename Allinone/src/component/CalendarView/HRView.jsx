import React, { useEffect, useState, useRef } from 'react';
import './CalendarView.css'; // Import the CSS file
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { getValidRange, getHRTeamEvents, getPersonalEvents, getBlockoutDates } from './CalendarUtils'; 
import Header from './Header';
import Dashboard from './Dashboard';
import EventFilter from './AdvancedEventFilter';
import LoadingSpinner from './LoadingSpinner';

export default function WFHcalendar() {
  const [view, setView] = useState('dayGridMonth');
  const calendarRef = useRef(null); 
  const [teamEvents, setTeamEvents] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showPersonal, setShowPersonal] = useState(true);
  const [showTeam, setShowTeam] = useState(true);
  const [blockoutEvents, setBlockoutEvents] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state
  const userID = 130002; // Hardcoded user ID for now

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(false)
      try{
        const teamEvents = await getHRTeamEvents(userID); 
        setTeamEvents(teamEvents); 

        const personalEvents = await getPersonalEvents(userID); 
        setPersonalEvents(personalEvents);

        const blockouts = await getBlockoutDates(view);
        setBlockoutEvents(blockouts);
      }finally{
        setLoading(false)
      }
    };
    fetchEvents();
  }, []); 

  useEffect(() => {
    if (showPersonal || showTeam) {
      const departmentFilteredEvents = teamEvents.filter((event) => selectedDepartments.includes(event.teamName))

      const combinedEvents = [
        ...(showPersonal ? personalEvents : []),
        ...(showTeam ? departmentFilteredEvents : []),
        ... blockoutEvents
      ];
      setFilteredEvents(combinedEvents);
    }
  }, [showPersonal, showTeam, selectedDepartments,personalEvents, teamEvents]);

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

  const handleCheckboxChange = (value) => {
    if (value.includes('personal')) {
      setShowPersonal(true);
    }else{
      setShowPersonal(false);
    } 
    if (value.includes('team')) {
      setShowTeam(true);
    } 
  };

  // Handle department-specific checkbox changes
  const handleDepartmentChange = (dept) => {
    setSelectedDepartments((prevSelected) =>
      prevSelected.includes(dept)
        ? prevSelected.filter((d) => d !== dept) // Remove if already selected
        : [...prevSelected, dept]               // Add if not selected

      );
    };

  return (
    <div className="calendar-container">
      {loading ? (
        <LoadingSpinner /> 
      ) : (
        <>
        <Dashboard events={filteredEvents} role="HR"/>
        <Header view={view} toggleView={toggleView} userID={userID} />
        <div className="calendar-box">
          <div style={{ flex: '0 0 200px', paddingRight: '10px', paddingLeft: '10px' }}>
            <EventFilter showPersonal={showPersonal} showTeam={showTeam} handleCheckboxChange={handleCheckboxChange} 
            selectedDepartments={selectedDepartments} handleDepartmentChange={handleDepartmentChange} userID={userID}/>
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