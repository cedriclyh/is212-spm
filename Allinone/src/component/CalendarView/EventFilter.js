// EventFilter.jsx
import React, { useEffect, useState }  from 'react';
import {CheckboxGroup, Checkbox} from "@nextui-org/react";
import { getDeptName, getManagerTeamEvents, getDirectorTeamEvents, getStaffTeamEvents,checkRoleNum } from './CalendarUtils';

export default function EventFilter({ showPersonal, showTeam, handleCheckboxChange, selectedDepartments, handleDepartmentChange }) {
  const [deptName, setDeptName] = useState('');
  const [teamNames, setTeamName] = useState([]);
  const userID = 140004; // Hardcoded user ID for now

  
  const roleNum =  checkRoleNum(userID);
  useEffect(() => {

    const fetchDeptName = async () => {
      const name = await getDeptName(userID);  // Replace 140004 with a dynamic ID if needed
      setDeptName(name || 'Unknown Dept');
    };

    const fetchTeamName = async () => {
      let retrieveAllEvents;

      // Call the appropriate function based on the role number
      if (roleNum === '3') {
        retrieveAllEvents = await getManagerTeamEvents(userID);
      } else if (roleNum === '2') {
        retrieveAllEvents = await getStaffTeamEvents(userID);
      } else if (roleNum === '1') {
        retrieveAllEvents = await getDirectorTeamEvents(userID);
      } else {
        console.warn('Invalid role number:', roleNum);
        return;
      }

      // Ensure retrieveAllEvents is defined and an array
      if (!Array.isArray(retrieveAllEvents)) {
        console.error('Expected retrieveAllEvents to be an array, but got:', retrieveAllEvents);
        return;
      }

      const allTeamNames = [
        ...new Set(
          retrieveAllEvents.map(event => event.teamName)
        )
      ];

      setTeamName(allTeamNames || []);
      console.log(allTeamNames);
    };
    
    fetchDeptName();
    fetchTeamName();
  });
  console.log(roleNum);
  return (
    <div>
      <CheckboxGroup
        label="My Department"
        defaultValue={['personal']}
        onChange={handleCheckboxChange}
      >
        <Checkbox name="personal" id="personal" value="personal" checked={showPersonal}>
          Personal
        </Checkbox>
        
        <p>{deptName}</p>
        {teamNames.map((team) => (
          <div key={team}>
            <Checkbox
              name={team}
              id={team}
              value={team}
              onChange={() => handleDepartmentChange(team)}
              checked={selectedDepartments.includes(team)}
            >
              {team}
            </Checkbox> 
         </div> 
       ))}
       
      </CheckboxGroup>
  </div>
);}


