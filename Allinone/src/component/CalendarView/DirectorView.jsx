import React, { useEffect, useState, useRef } from 'react';
import './CalendarView.css'; // Import the CSS file
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { getValidRange, getDirectorTeamEvents, getPersonalEvents } from './CalendarUtils'; // Import utility functions
import Header from './Header';
import HREventFilter from './AdvancedEventFilter';

export default function WFHcalendar() {
  const [view, setView] = useState('dayGridMonth');
  const calendarRef = useRef(null); 
  const [teamEvents, setTeamEvents] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showPersonal, setShowPersonal] = useState(true);
  const [showTeam, setShowTeam] = useState(true);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const userID = 140001; // Hardcoded user ID for now

  useEffect(() => {
    const fetchEvents = async () => {
      const personalEvents = await getPersonalEvents(userID); 
      setPersonalEvents(personalEvents);

      const teamEvents = await getDirectorTeamEvents(userID); 
      setTeamEvents(teamEvents); 
    };
    fetchEvents();
  }, []); // Run once on mount

  useEffect(() => {
    if (showPersonal || showTeam) {
      const departmentFilteredEvents = teamEvents.filter((event) => selectedDepartments.includes(event.teamName))
      console.log('Filtered by department:', selectedDepartments);
      console.log('Filtered team events:', departmentFilteredEvents);
  
      // Combine with personal events if `showPersonal` is true
      const combinedEvents = [
        ...(showPersonal && personalEvents ? personalEvents : []),
        ...(showTeam && teamEvents ? departmentFilteredEvents : []),
      ];
      setFilteredEvents(combinedEvents);
    }
  }, [showPersonal, showTeam, selectedDepartments,personalEvents, teamEvents]);

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
  const handleCheckboxChange = (value) => {
    
    if (value.includes('personal')) {
      setShowPersonal(true);
    }else{
      setShowPersonal(false);
    } 
    if (value.includes('team')) {
      setShowTeam(true);
    } 
    console.log("Selected values: ", value);  // Add this line for debugging
  };
  
  // Handle department-specific checkbox changes
  const handleDepartmentChange = (dept) => {
    setSelectedDepartments((prevSelected) =>
      prevSelected.includes(dept)
        ? prevSelected.filter((d) => d !== dept) // Remove if already selected
        : [...prevSelected, dept]               // Add if not selected

      );
    };

  // Render the calendar
  return (
    <div className="calendar-container">
      <Header view={view} toggleView={toggleView} userID={userID}/>
      <div className="calendar-box">
        <div style={{ flex: '0 0 200px', paddingRight: '10px', paddingLeft: '10px' }}>
        <HREventFilter showPersonal={showPersonal} showTeam={showTeam} handleCheckboxChange={handleCheckboxChange} 
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
            // height="100%"
          />
        </div>
      </div>
    </div>
  );
}
