// CalendarHeader.jsx
import React, {useEffect, useState} from 'react';
import { Button } from '@mui/material';
import { CalendarToday, ViewAgenda } from '@mui/icons-material';
import BlockoutPopup from './BlockoutPopup';

export default function CalendarHeader({ view, toggleView, userID }) {
  const [roleNum, setRoleNum] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const checkRoleNum = async (userID) => {
    const apiUrl = `http://employee:5002/user/${userID}`; 
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error fetching user data: ${response.status}`);
      }
      const userData = await response.json();
      return userData.data.role; 
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      return null; 
    }
  };

  useEffect(() => {
    const fetchRole = async () => {
      const role = await checkRoleNum(userID);
      setRoleNum(role);
      console.log("Role Number:", role);
      
      if (role === 1 || role === 3) {
        setShowPopup(true);
      }
    };
    
    fetchRole(); 
  }, [userID]);
  

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
        {showPopup && <BlockoutPopup />}
      </div>
    </div>
  );
}