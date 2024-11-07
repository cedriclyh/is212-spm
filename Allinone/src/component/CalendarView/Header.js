// CalendarHeader.jsx
import React, {useEffect, useState} from 'react';
import { Button } from '@mui/material';
import { CalendarToday, ViewAgenda } from '@mui/icons-material';
import BlockoutPopup from './BlockoutPopup';

export default function CalendarHeader({ view, toggleView, userID }) {
  const [roleNum, setRoleNum] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  // const userID = 140001; // Replace with dynamic user ID

  const checkRoleNum = async (userID) => {
    const apiUrl = `http://127.0.0.1:5002/user/${userID}`; // Replace with ${userID}
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error fetching user data: ${response.status}`);
      }
      const userData = await response.json();
      return userData.data.role; 
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      return null; // Return null or handle the error as needed
    }
  };

  useEffect(() => {
    const fetchRole = async (userID) => {
      const role = await checkRoleNum(userID);
      setRoleNum(role);
      
      // Show BlockoutPopup if role_num is 1 or 3
      if (role === 1 || role === 3) {
        setShowPopup(true);
      }
    };
    
    fetchRole(); // Call the async function to fetch the role number
  }, []);
  

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