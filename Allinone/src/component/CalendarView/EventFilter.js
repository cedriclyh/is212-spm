// EventFilter.jsx
import React, { useEffect, useState }  from 'react';
import {CheckboxGroup, Checkbox} from "@nextui-org/react";

export default function EventFilter({ showPersonal, showTeam, handleCheckboxChange }) {
  const [deptName, setDeptName] = useState([]);

  useEffect(() => {
    const fetchDeptName = async () => {
      const name = await getDeptName(140004); 
      if (name) {
        setDeptName(name);
      } else {
        setDeptName('Unknown Dept');
      }
    };

    fetchDeptName();
  }, []); 

  return (
    <div>
      <CheckboxGroup
      label="My Department"
      defaultValue={['personal']}>
        <Checkbox 
          type="checkbox"
          name="personal"
          id="personal"
          value="personal"
          onChange={handleCheckboxChange}
          checked={showPersonal}>
            Personal
        </Checkbox>
        <Checkbox 
          name="team"
          id="team"
          onChange={handleCheckboxChange}
          checked={showTeam}>
            {deptName}
        </Checkbox>
    </CheckboxGroup>
  </div>
      /* <input
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
    </div> */
);}

//Fetch Department Name
export const getDeptName = async (userId) => {
  const apiUrl = `http://127.0.0.1:5002/user/${userId}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error fetching user data: ${response.status}`);
      }

      const userData = await response.json();
      
      const staff_dept= userData.data.dept;

      return staff_dept;
    } catch (error) {
      console.error("Failed to fetch department name:", error);
      return null;
    }
}