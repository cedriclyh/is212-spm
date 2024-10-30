// EventFilter.jsx
import React, { useEffect, useState }  from 'react';
import {CheckboxGroup, Checkbox} from "@nextui-org/react";
import { getDeptName, getHRTeamEvents } from './CalendarUtils';

export default function EventFilter({ showPersonal, showTeam, handleCheckboxChange, selectedDepartments, handleDepartmentChange }) {
  const [deptName, setDeptName] = useState('');
  const [teamNamesByDept, setTeamNamesByDept] = useState([]);
  const userID = 130002; // Hardcoded user ID for now

  useEffect(() => {
    const fetchDeptName = async () => {
      const name = await getDeptName(userID);  // Replace 140004 with a dynamic ID if needed
      setDeptName(name || 'Unknown Dept');
    };

    const fetchTeamNameAndDept = async () => {
      const retrieveAllEvents = await getHRTeamEvents(userID);
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
    fetchDeptName();
    fetchTeamNameAndDept();
  });
  
  console.log('teamNamesByDept:', teamNamesByDept);
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


