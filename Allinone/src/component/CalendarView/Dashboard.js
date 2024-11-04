import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, getKeyValue, DatePicker } from "@nextui-org/react";
import React, { Fragment, useState } from "react";

const columns = [
  { key: "date", label: "DATE" },
  { key: "department", label: "DEPARTMENT" },
  { key: "team", label: "TEAM" },
  { key: "manpower", label: "MANPOWER AT OFFICE" },
];

export const getTotalCount = async (managerId) => {
  try {
    const response = await fetch(`http://localhost:5002/users/team/${managerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    const requests = data.team_count;
    console.log("Total Staffs under the Manager:", requests); // Log team events for debugging
    return requests;
  } catch (error) {
    console.error('Failed to fetch list of staffs under the manager:', error);
  }
};    

async function getManpowerCount(count, managerID) {
  const totalCount = await getTotalCount(managerID);
  const numOfOfficeSlaves = totalCount - count;
  return `${numOfOfficeSlaves}/${totalCount}`;
}

export default function Dashboard(inputEvents) {
  const [state, setState] = useState(0);
  const events = inputEvents.events;
  console.log("Events inserted into DashBoard:", events);
  

  const dashboardData = events.map(item => {
    const name = item.title.split(" ").slice(0, -1).join(" ");
    return {
      dept: item.dept,
      teamName: item.teamName,
      date: item.start.substring(0, 10),
      name: name,
      key: item.id,
      managerID: item.managerID,
    };
  });

  const groupedData = dashboardData.reduce((acc, item) => {
    const { date, dept, teamName } = item;
    if (!acc[date]) {
      acc[date] = {};
    }
    if (!acc[date][dept]) {
      acc[date][dept] = {};
    }
    if (!acc[date][dept][teamName]) {
      acc[date][dept][teamName] = [];
    }

    acc[date][dept][teamName].push({
      key: item.key,
      name: item.name,
      managerID: item.managerID,
    });
    return acc;
  }, {});
  
  // Transform groupedData to rows
  const rows = Object.keys(groupedData).flatMap(date => {
    return Object.keys(groupedData[date]).flatMap(dept => {
      return Object.keys(groupedData[date][dept]).map(teamName => {
        const entries = groupedData[date][dept][teamName];
        const manpowerInOffice = getManpowerCount(entries.length, entries[0].managerID);
        console.log("Manpower in Office:", manpowerInOffice);
        return {
          key: `${date}-${dept}-${teamName}}`, // Or generate a unique key if necessary
          date: date,
          department: dept,
          team: teamName,
          manpower: manpowerInOffice
        };
      });
    });
  });

  // const IDEALROWS = [{key: 1, date:'2024-11-01', department: 'HR', team: 'Manager', entries: [{name: 'John Doe'}, {name: 'Jane Doe'}]}];

  // Logging the results
  console.log('Dashboard Data:', dashboardData);
  console.log('Grouped Data:', groupedData);
  console.log('Rows:', rows);

  const handleClick = (index) => {
    const updatedState = { ...rows[index] }; // Clone the row object

    if (updatedState.other) {
      delete updatedState.other; // Remove the additional information
      setState((pre) => pre + 1);
    } else {
      updatedState.other = "Hello there" ;
      setState((pre) => pre + 1);
    }

    console.log("Updated row:", updatedState);
    rows[index] = updatedState; // Update the row in the array directly
  };

  return (
    <>
    <DatePicker label="Select Date" className="max-w-[284px]" />
    <Table aria-label="Example table with dynamic content">
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>

      <TableBody items={rows}>
        {(item) => (
          <TableRow onclick={handleClick} key={item.key}>
            <TableCell>{item.date}</TableCell>
            <TableCell>{item.department}</TableCell>
            <TableCell>{item.team}</TableCell>
            <TableCell>{item.manpower}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    </>
  );
}