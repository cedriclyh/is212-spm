import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, DatePicker, Button, Tooltip } from "@nextui-org/react";
import React, { useState, useEffect } from "react";
import { createRoot } from 'react-dom/client';  // Import createRoot
// import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter

const columns = [
  { key: "date", label: "DATE" },
  { key: "department", label: "DEPARTMENT" },
  { key: "team", label: "TEAM" },
  { key: "manpower", label: "MANPOWER AT OFFICE" },
  { key: "toggle", label: "" },
];

/**
 * @typedef {Object} ToggleSubRowButtonProps
 * @property {number} rowId - The ID of the row to toggle the sub-row for.
 * @property {Object} rowData - The data object for the row to display in the sub-row.
 */

/**
 * ToggleSubRowButton component for expanding/collapsing sub-rows.
 * @param {ToggleSubRowButtonProps} props - The props for the button component.
 * @returns {JSX.Element} The button with expand/collapse functionality.
 */
export const ToggleSubRowButton = ({ rowId, rowData, managerID }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    // Fetch other staff members if there are no entries
      const fetchStaffList = async () => {
        const staffMembers = await getListofStaffs(managerID);
        setStaffList(staffMembers);
        console.log("Staff list fetched:", staffMembers);
      };
      fetchStaffList();
  }, [rowData.entries, managerID]);

  useEffect(() => {
    console.log("Updated staff list:", staffList);
  }, [staffList]);

  const toggleSubRow = () => {
    const rowToInsertAfter = document.getElementById(`row-${rowId}`);

    if (rowToInsertAfter) {
      if (isExpanded) {
        const existingRow = document.getElementById(`subrow-${rowId}`);
        if (existingRow) {
          existingRow.remove();
        }
      } else {
        const newRow = document.createElement("tr");
        newRow.id = `subrow-${rowId}`;
        const newCell = document.createElement("td");
        newCell.colSpan = 100;
        newCell.className = "px-4 py-4";

        const root = createRoot(newCell);
        root.render(
          <div>
              <table style={{width:'100%'}}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Place</th>
                  </tr>
                </thead>
                <tbody>
                {rowData.entries && rowData.entries.length > 0 ? (
                  <>
                    {rowData.entries.map((entry) => (
                      <tr key={entry.key}>
                        <td>{entry.name}</td>
                        <td>{entry.position}</td>
                        <td>Home</td>
                      </tr>
                    ))}
                    {staffList.map((staff) => {                    
                      const isInEntries = rowData.entries.some(
                        (entry) => entry.name === staff.fullName
                      );
                      // If the staff is not in entries, add them to the table with "Office" as the place
                      if (!isInEntries) {
                        return(
                          <tr key={staff.fullName}>
                            <td>{staff.fullName}</td>
                            <td>{staff.position}</td>
                            <td>Office</td>
                          </tr>
                        )
                      }
                      return null; // Don't render anything for staff already in entries
                    })}
                   </>
            ) : (
              staffList.length > 0 ? (
                staffList.map((staff, index) => (
                  <tr key={staff.fullName}>
                    <td>{staff.fullName}</td>
                    <td>{staff.position}</td>
                    <td>Office</td> 
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No staff found</td>
                </tr>
              )
            )}
          </tbody>
          </table>
          </div>
        );

        newRow.appendChild(newCell);
        rowToInsertAfter.insertAdjacentElement("afterend", newRow);
      }

      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Tooltip content={isExpanded ? "Collapse" : "Expand"}>
      <Button onClick={toggleSubRow} size="sm" variant="light" isIconOnly>
        {isExpanded ? "-" : "+"}
      </Button>
    </Tooltip>
  );
};

// const IDEALROWS = [{key: 1, date:'2024-11-01', department: 'HR', team: 'Manager', entries: [{name: 'John Doe'}, {name: 'Jane Doe'}]}];

export default function Dashboard(inputEvents) {
  // const [state, setState] = useState(0);
  const events = inputEvents.events;
  console.log(events);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [rawDate, setRawDate] = useState(null);
  console.log(events)

  useEffect(() =>{
    const processData = async () => {
      const dashboardData = events
        .filter(item => item.backgroundColor === "#4caf50")
        .map(item => {
          const name = item.title.split(" ").slice(0, -1).join(" ");
          return {
            dept: item.dept,
            teamName: item.teamName,
            date: item.start.substring(0, 10),
            name: name,
            key: item.id,
            managerID: item.managerID,
            position: item.position,
          };
        }
      );
    
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
          position: item.position,
        });
        return acc;
      }, {});

      // Pre-fetch manpower counts for each unique managerID
      const uniqueManagerIDs = [...new Set(dashboardData.map(item => item.managerID))];
      const totalCounts = {};

      await Promise.all(
        uniqueManagerIDs.map(async (managerID) => {
          const count = await getTotalCount(managerID);
          totalCounts[managerID] = count;
        })
      );

      function convertDateFormat(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
      }
      
      const generatedRows = (
        Object.keys(groupedData).flatMap(date => {
          return Object.keys(groupedData[date]).flatMap(dept => {
            return Object.keys(groupedData[date][dept]).map(teamName => {
              const entries = groupedData[date][dept][teamName];
              const totalCount = totalCounts[entries[0].managerID];
              const manpowerInOffice = `${totalCount - entries.length}/${totalCount}`;
              return {
                key: `${date}-${dept}-${teamName}}`, // Or generate a unique key if necessary
                date: convertDateFormat(date),
                department: dept,
                team: teamName,
                entries: entries.map(entry => ({
                  key: entry.key,
                  name: entry.name,
                  managerID: entry.managerID,
                  position: entry.position,  // Add position here
                })),
                manpower: manpowerInOffice,
                managerID: entries[0].managerID,
              };
            });
          });
        })
      )
        setRows(generatedRows.flat());
        setLoading(false); 
        // Logging 
        console.log('Dashboard Data:', dashboardData);
        console.log('Grouped Data:', groupedData);
        console.log('Rows:', generatedRows);
      };
      processData();
    }, [events]);

    if (loading) return <div>Loading...</div>;  

    // Handle date change
    const handleDateChange = (date) => {
      setRawDate(date); // Store the raw date
      const formattedDate = `${String(date.day).padStart(2, '0')}-${String(date.month).padStart(2, '0')}-${date.year}`; //convert date to DD-MM-YYYY
      setSelectedDate(formattedDate);
      console.log("Selected Date:", formattedDate);
    };

    const clearDateSelection = () => {
      setSelectedDate(null); // Reset the selected date
      setRawDate(null); // Reset the raw date
    };

    // Filter rows based on selected date
    const filteredRows = selectedDate 
      ? rows.filter((row) => row.date === selectedDate) 
      : [];

  return (
    <div className="card-container shadow-lg rounded-lg p-4 bg-white" style={{marginBottom: '10px', borderRadius: '25px'}}>
      <div style={{ display: 'flex', alignItems: "center", justifyContent: "space-between"}}>
        <h1 class="card-title">Dashboard</h1>
        <div style={{ display: 'flex', alignItems: "right", gap:'1rem'}}>
          <DatePicker label="Select Date" style={{ maxWidth: '284px', width: 'auto' }} value={rawDate} onChange={handleDateChange}/>
          <Button color="warning" onClick={clearDateSelection}>Clear</Button>
        </div>
      </div>
        <br/>

      <Table aria-label="Example table with dynamic content">
        <TableHeader columns={columns}>
          {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>

        <TableBody items={filteredRows}>
          {(item) => (
            <TableRow key={item.key} id={`row-${item.key}`}>
              <TableCell>{item.date}</TableCell>
              <TableCell>{item.department}</TableCell>
              <TableCell>{item.team}</TableCell>
              <TableCell>{item.manpower}</TableCell>
              <TableCell>
                <ToggleSubRowButton rowId={item.key} rowData={item} managerID={item.managerID}/>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}



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
    console.log("Total Count of Staffs under the Manager:", requests); // Log team events for debugging
    return requests;
  } catch (error) {
    console.error('Failed to fetch list of staffs under the manager:', error);
  }
};    


// export default function Dashboard(inputEvents) {
//   const [state, setState] = useState(0);
//   const events = inputEvents.events;
//   console.log("Events inserted into DashBoard:", events);

//   const dashboardData = events.map(item => {
//     const name = item.title.split(" ").slice(0, -1).join(" ");
//     return {
//       dept: item.dept,
//       teamName: item.teamName,
//       date: item.start.substring(0, 10),
//       name: name,
//       key: item.id,
//     };
//   });

//   const groupedData = dashboardData.reduce((acc, item) => {
//     const { date } = item; // Get the date directly from item
//     if (!acc[date]) {
//       acc[date] = []; // Initialize the array if it doesn't exist
//     }
//     acc[date].push(item); // Push the entire item to the date array
//     return acc;
//   }, {});
  
//   // Logging the results
//   console.log('Dashboard Data:', dashboardData);
//   console.log('Grouped Data:', groupedData);

//   // const handleClick = (index) => {
//   //   const updatedState = { ...rows[index] }; // Clone the row object

//   //   if (updatedState.other) {
//   //     delete updatedState.other; // Remove the additional information
//   //     setState((pre) => pre + 1);
//   //   } else {
//   //     updatedState.other = "Hello there" ;
//   //     setState((pre) => pre + 1);
//   //   }

//   //   console.log("Updated row:", updatedState);
//   //   rows[index] = updatedState; // Update the row in the array directly
//   // };

//   return (
//     <>
//     <DatePicker label="Select Date" className="max-w-[284px]" />
//     <Table aria-label="Example table with dynamic content">
//       <TableHeader columns={columns}>
//         {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
//       </TableHeader>
//       {/* <TableBody>
//         {rows.map((item) => (
//           <TableRow key={item.key} onClick={() => handleClick(item.key - 1)} style={{ cursor: "pointer" }}>
//             {columns.map((column) => {
//               const value = getKeyValue(item, column.key);
//               if (typeof value === "symbol") {
//                 console.warn("Found a symbol value:", value);
//               }
//               return <TableCell key={column.key}>{value}</TableCell>;
//             })}
//           </TableRow>
//         ))}
//       </TableBody> */}
//        <TableBody>
//         {Object.entries(dashboardData).map(([date, entries]) => {
//           console.log(`Entries for ${date}:`, entries)
          
//           if (!Array.isArray(entries)) {
//             console.error(`Entries for ${date} is not an array:`, entries);
//             return null;
//           }

//           return (
//             <>
//               <TableRow key={`header-${date}`}>
//                 <TableCell colSpan={3} style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
//                   {date}
//                 </TableCell>
//               </TableRow>
//               {entries.map((item) => (
//                 <TableRow key={item.key} style={{ cursor: "pointer" }}>
//                   {columns.map((column) => {
//                     const value = item[column.key];
//                     return <TableCell key={column.key}>{value}</TableCell>;
//                   })}
//                 </TableRow>
//               ))}
//             </>
//           );
//         })}
//       </TableBody>

//     </Table>
//     </>
//   );
// }
