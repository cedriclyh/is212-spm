// EventFilter.jsx
import React, { useEffect, useState }  from 'react';
import {CheckboxGroup, Checkbox} from "@nextui-org/react";
import { getDeptName, getDirectorTeamEvents, getHRTeamEvents } from './CalendarUtils';

export default function EventFilter({ showPersonal, showTeam, handleCheckboxChange, selectedDepartments, handleDepartmentChange, userID }) {
  const [deptName, setDeptName] = useState('');
  const [teamNamesByDept, setTeamNamesByDept] = useState([]);
  // const userID = 140001; // Hardcoded user ID for now

  useEffect(() => {
    const fetchDeptName = async () => {
      const name = await getDeptName(userID);  // Replace 140004 with a dynamic ID if needed
      setDeptName(name || 'Unknown Dept');
    };
    fetchDeptName();
  }, [userID]);

  useEffect(()=>{
    const fetchTeamNameAndDept = async () => {
      const retrieveAllEvents = (deptName === 'HR' || deptName === 'CEO')
      ? await getHRTeamEvents(userID) 
      : await getDirectorTeamEvents(userID);

      const groupedByDept = retrieveAllEvents.reduce((acc, event) => {
        const { dept, teamName } = event;
        if (!acc[dept]) {
          acc[dept] = [];
        }
        if (!acc[dept].includes(teamName)){
          acc[dept].push(teamName);
        }
        return acc;
      }, {});
      setTeamNamesByDept(groupedByDept);
    };
    if (deptName) { // Ensure deptName is available before fetching team events
      fetchTeamNameAndDept();
    }}, [deptName, userID]); 
    
  
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
        
       {Object.entries(teamNamesByDept).map(([dept, teams]) => (
        <div key={dept}>
          <p>{dept}</p>
          {teams.map((teamName) => (
            <Checkbox
              key={teamName}
              name={teamName}
              id={teamName}
              value={teamName}
              onChange={() => handleDepartmentChange(teamName)}
              checked={selectedDepartments.includes(teamName)}
            >
              {teamName}
            </Checkbox>
          ))}
        </div>
      ))}
       
      </CheckboxGroup>
  </div>
);}


