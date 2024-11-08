import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, DatePicker, Button, Tooltip } from "@nextui-org/react";
import React, { useState, useEffect } from "react";
import { createRoot } from 'react-dom/client';  

const columns = [
  { key: "date", label: "DATE" },
  { key: "department", label: "DEPARTMENT" },
  { key: "team", label: "TEAM" },
  { key: "manpower", label: "MANPOWER AT OFFICE" },
  { key: "toggle", label: "" },
];


/**
 * @typedef {Object} ToggleSubRowButtonProps
 * @property {number} rowId 
 * @property {Object} rowData 
 */

/**
 * ToggleSubRowButton component for expanding/collapsing sub-rows.
 * @param {ToggleSubRowButtonProps} props 
 * @returns {JSX.Element} 
 */
export const ToggleSubRowButton = ({ rowId, rowData, managerID }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
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
                        (entry) => entry.name.includes(staff.fullName)
                      );
                      if (!isInEntries) {
                        return(
                          <tr key={staff.fullName}>
                            <td>{staff.fullName}</td>
                            <td>{staff.position}</td>
                            <td>Office</td>
                          </tr>
                        )
                      }
                      return null; 
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

export default function Dashboard(inputEvents) {
  const events = inputEvents.events;
  console.log(events);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [rawDate, setRawDate] = useState(null);

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
                key: `${date}-${dept}-${teamName}}`, 
                date: convertDateFormat(date),
                department: dept,
                team: teamName,
                entries: entries.map(entry => ({
                  key: entry.key,
                  name: entry.name,
                  managerID: entry.managerID,
                  position: entry.position, 
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
      };
      processData();
    }, [events]);

    if (loading) return <div>Loading...</div>;  

    // Handle date change
    const handleDateChange = (date) => {
      setRawDate(date); 
      const formattedDate = `${String(date.day).padStart(2, '0')}-${String(date.month).padStart(2, '0')}-${date.year}`; 
      setSelectedDate(formattedDate);
      console.log("Selected Date:", formattedDate);
    };

    const clearDateSelection = () => {
      setSelectedDate(null); 
      setRawDate(null); 
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
    const response = await fetch(`http://54.84.53.208:5002/users/team/${managerId}`, {
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
    return requests;
  } catch (error) {
    console.error('Failed to fetch list of staffs under the manager:', error);
  }
};    

export const getListofStaffs  = async (managerId) => {
  try {
    const response = await fetch(`http://54.84.53.208:5002/users/team/${managerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    const requests = data.data;
    const ListOfStaffs = requests.map(item => ({
      fullName: `${item.staff_fname} ${item.staff_lname}`,
      position: item.position
    }));
    return ListOfStaffs;
  } catch (error) {
    console.error('Failed to fetch list of staffs under the manager:', error);
  }
}; 


