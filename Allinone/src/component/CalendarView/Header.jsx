// CalendarHeader.jsx
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { CalendarToday, ViewAgenda } from '@mui/icons-material';
import { getStaffName } from './CalendarUtils';

export default function CalendarHeader({ view, toggleView }) {
  const [staffName, setStaffName] = useState([]);

  useEffect(() => {
    const fetchStaffName = async () => {
      const name = await getStaffName(140004); // Fetch the staff name asynchronously
      if (name) {
        setStaffName(name);
      } else {
        setStaffName('Unknown User'); // Handle case when name is null
      }
    };

    fetchStaffName(); // Call the async function
  }, []); // Run once on mount

  return (
    <div className="calendar-header">
      <div style={{flex: 1}}>
      <h1 className="calendar-title">Welcome {staffName}!</h1>
        <div style={{display: "flex", justifyContent: "flex-end"}}> 
          <Button
            variant="contained"
            onClick={toggleView}
            startIcon={view === 'dayGridMonth' ? <ViewAgenda /> : <CalendarToday />}
          >
            {view === 'dayGridMonth' ? 'Week View' : 'Month View'}
          </Button>
        </div>
    </div>
  </div>
  );
}