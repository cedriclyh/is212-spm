// EventFilter.jsx
import React, { useEffect, useState } from 'react';

export const getDeptName = async (userId) => {
  const apiUrl = `http://127.0.0.1:5002/user/${userId}`;
    try {
      // Fetch user data from the API
      const response = await fetch(apiUrl);
      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`Error fetching user data: ${response.status}`);
      }
      // Parse the JSON response
      const userData = await response.json();
      // console.log("User Data:", userData);
      
      // Extract first name and last name
      const staff_dept= userData.data.dept;

      return staff_dept;
    } catch (error) {
      console.error("Failed to fetch department name:", error);
      return null; // Return null or handle error appropriately
    }
}

export default function EventFilter({ showPersonal, showTeam, handleCheckboxChange }) {
  const [deptName, setDeptName] = useState('Loading...');

  useEffect(() => {
    const fetchDeptName = async () => {
      const name = await getDeptName(140004); // Fetch the staff name asynchronously
      if (name) {
        setDeptName(name);
      } else {
        setDeptName('Unknown Dept'); // Handle case when name is null
      }
    };

    fetchDeptName(); // Call the async function
  }, []); // Run once on mount

  return (
    <div>
      <h2>My Department <br /> Calendar</h2>

      <input
        type="checkbox"
        name="personal"
        id="personal"
        style={{ transform: 'scale(1.5)' }}
        onChange={handleCheckboxChange}
        checked={showPersonal}
      />
      <label htmlFor="personal" style={{ fontSize: '20px' }}> Personal</label>
      <br />

      <input
        type="checkbox"
        name="team"
        id="team"
        style={{ transform: 'scale(1.5)' }}
        onChange={handleCheckboxChange}
        checked={showTeam}
      />
      <label htmlFor="team" style={{ fontSize: '20px' }}> {deptName}</label>
    </div>
  );
}
