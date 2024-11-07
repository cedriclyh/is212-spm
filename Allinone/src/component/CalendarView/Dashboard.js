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

const allDepts = [
  {
    dept: 'Consultancy',
    teams: [
      { teamName: "Ernst Sim's Team", managerID: '180001' }
    ]
  },
  {
    dept: 'Sales',
    teams: [
      { teamName: "Derrick Tan's Team", managerID: '140001' },
      { teamName: "Rahim Khalid's Team", managerID: '140894' },
      { teamName: "Jaclyn Lee's Team", managerID: '140008' },
      { teamName: "Sophia Toh's Team", managerID: '140103' },
      { teamName: "Siti Abdullah's Team", managerID: '140874' },
      { teamName: "Yee Lim's Team", managerID: '140944' }
    ]
  },
  {
    dept: 'Solutioning',
    teams: [
      { teamName: "Eric Loh's Team", managerID: '150008' }
    ]
  },
  {
    dept: 'Engineering',
    teams: [
      { teamName: "Philip Lee's Team", managerID: '151408' }
    ]
  },
  {
    dept: 'HR',
    teams: [
      { teamName: "Sally Loh's Team", managerID: '160008' }
    ]
  },
  {
    dept: 'Finance',
    teams: [
      { teamName: "David Yap's Team", managerID: '170166' },
      { teamName: "Narong Pillai's Team", managerID: '171014' },
      { teamName: "Ji Truong's Team", managerID: '171018' },
      { teamName: "Chandra Kong's Team", managerID: '171029' },
      { teamName: "Rithy Luong's Team", managerID: '171043' }
    ]
  }
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
      };
      fetchStaffList();
  }, [rowData.entries, managerID]);

  useEffect(() => {
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
        
        // Get today's date
        const today = new Date();

        // Calculate the start and end of the range
        const startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 2); // 2 months back

        const endDate = new Date(today);
        endDate.setMonth(today.getMonth() + 3); // 3 months forward

        // Helper function to convert a date to DD-MM-YYYY format
        function formatDate(date) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }

        // Generate list of all dates between startDate and endDate
        const allDates = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          allDates.push(formatDate(currentDate));
          currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        }

        allDates.forEach(date => {
          allDepts.forEach(({ dept, teams }) => {
            teams.forEach(({ teamName, managerID }) => {
              let entries = groupedData[date]?.[dept]?.[teamName] || [];
        
              // Determine manpower display
              let manpowerInOffice = "FULL";
        
              // Push row data to generatedRows
              generatedRows.push({
                key: `${date}-${dept}-${teamName}`,
                date: date,
                department: dept,
                team: teamName,
                entries: entries,
                manpower: manpowerInOffice,
                managerID: managerID
              });
            });
          });
        });
        
        setRows(generatedRows);
        setLoading(false); 
      };
      processData();
    }, [events]);

    if (loading) return <div>Loading...</div>;  

    const handleDateChange = (date) => {
      setRawDate(date); 
      const formattedDate = `${String(date.day).padStart(2, '0')}-${String(date.month).padStart(2, '0')}-${date.year}`; //convert date to DD-MM-YYYY
      setSelectedDate(formattedDate);
      console.log("Selected Date:", formattedDate);
    };

    const clearDateSelection = () => {
      setSelectedDate(null); 
      setRawDate(null); 
    };

    const filteredRows = selectedDate 
      ? rows.filter((row) => row.date === selectedDate) 
      : [];

  return (
    <div className="card-container shadow-lg rounded-lg p-4 bg-white" style={{marginBottom: '10px', borderRadius: '25px'}}>
      <div style={{ display: 'flex', alignItems: "center", justifyContent: "space-between"}}>
        <h1 className="card-title">Dashboard</h1>
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
    return requests;
  } catch (error) {
    console.error('Failed to fetch list of staffs under the manager:', error);
  }
};    

export const getListofStaffs  = async (managerId) => {
  try {
    const response = await fetch(`http://employee:5002/users/team/${managerId}`, {
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


