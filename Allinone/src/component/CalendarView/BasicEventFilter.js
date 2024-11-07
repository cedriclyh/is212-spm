// EventFilter.jsx
import React, { useEffect, useState }  from 'react';
import {CheckboxGroup, Checkbox} from "@nextui-org/react";
import { getDeptName } from './CalendarUtils';

export default function EventFilter({ showPersonal, showTeam, handleCheckboxChange, userID}) {
  const [deptName, setDeptName] = useState('');

  useEffect(() => {
    const fetchDeptName = async () => {
      const name = await getDeptName(userID);  
      setDeptName(name || 'Unknown Dept');
    };

    fetchDeptName();
  });

  return (
    <div>
      <CheckboxGroup
        label="My Department"
        value={[showPersonal ? 'personal' : '', showTeam ? 'dept' : ''].filter(Boolean)}
        onChange={handleCheckboxChange}
      >
        <Checkbox name="personal" id="personal" value="personal" >
          Personal
        </Checkbox>

        <Checkbox name="dept" id="dept" value="dept">
          {deptName}
        </Checkbox>
      </CheckboxGroup>
  </div>
);}


