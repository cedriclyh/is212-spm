import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, getKeyValue, DatePicker } from "@nextui-org/react";
import React, { useState } from "react";

const columns = [
  { key: "date", label: "DATE" },
  { key: "department", label: "DEPARTMENT" },
  { key: "team", label: "TEAM" },
  { key: "manpower", label: "MANPOWER AT OFFICE" },
];

export const getTotalCount = async (userId) => {
  try {
    const response = await fetch(`http://localhost:5002/users/team/${userId}`, {
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
    };
  });

  const groupedData = dashboardData.reduce((acc, item) => {
    const { date } = item; // Get the date directly from item
    if (!acc[date]) {
      acc[date] = []; // Initialize the array if it doesn't exist
    }
    acc[date].push(item); // Push the entire item to the date array
    return acc;
  }, {});
  
  // Logging the results
  console.log('Dashboard Data:', dashboardData);
  console.log('Grouped Data:', groupedData);

  // const handleClick = (index) => {
  //   const updatedState = { ...rows[index] }; // Clone the row object

  //   if (updatedState.other) {
  //     delete updatedState.other; // Remove the additional information
  //     setState((pre) => pre + 1);
  //   } else {
  //     updatedState.other = "Hello there" ;
  //     setState((pre) => pre + 1);
  //   }

  //   console.log("Updated row:", updatedState);
  //   rows[index] = updatedState; // Update the row in the array directly
  // };

  return (
    <>
    <DatePicker label="Select Date" className="max-w-[284px]" />
    <Table aria-label="Example table with dynamic content">
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      {/* <TableBody>
        {rows.map((item) => (
          <TableRow key={item.key} onClick={() => handleClick(item.key - 1)} style={{ cursor: "pointer" }}>
            {columns.map((column) => {
              const value = getKeyValue(item, column.key);
              if (typeof value === "symbol") {
                console.warn("Found a symbol value:", value);
              }
              return <TableCell key={column.key}>{value}</TableCell>;
            })}
          </TableRow>
        ))}
      </TableBody> */}
       <TableBody>
        {Object.entries(dashboardData).map(([date, entries]) => {
          console.log(`Entries for ${date}:`, entries)
          
          if (!Array.isArray(entries)) {
            console.error(`Entries for ${date} is not an array:`, entries);
            return null;
          }

          return (
            <>
              <TableRow key={`header-${date}`}>
                <TableCell colSpan={3} style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                  {date}
                </TableCell>
              </TableRow>
              {entries.map((item) => (
                <TableRow key={item.key} onClick={() => handleClick(item.key)} style={{ cursor: "pointer" }}>
                  {columns.map((column) => {
                    const value = item[column.key];
                    return <TableCell key={column.key}>{value}</TableCell>;
                  })}
                </TableRow>
              ))}
            </>
          );
        })}
      </TableBody>

    </Table>
    </>
  );
}
