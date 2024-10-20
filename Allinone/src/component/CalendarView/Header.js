// CalendarHeader.jsx
import React from 'react';
import { Button } from '@mui/material';
import { CalendarToday, ViewAgenda } from '@mui/icons-material';

export default function CalendarHeader({ view, toggleView }) {

  return (
    <div className="calendar-header">
      <div style={{display: "flex", justifyContent: "flex-end"}}> 
        <Button
          variant="contained"
          onClick={toggleView}
          startIcon={view === 'dayGridMonth' ? <ViewAgenda /> : <CalendarToday />}
          sx={{ padding: '4px 8px', fontSize: '0.8rem', minWidth: 'auto' }}
        >
          {view === 'dayGridMonth' ? 'Week View' : 'Month View'}
        </Button>
      </div>
    </div>
  );
}