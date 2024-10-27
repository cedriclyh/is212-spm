import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'; // For date manipulation

export const getValidRange = (today) => {
    const startOfCurrentMonth = startOfMonth(today);
  
    return {
    start: format(subMonths(startOfCurrentMonth, 2), 'yyyy-MM-dd'), // 2 months back from current month
    end: format(addMonths(endOfMonth(today), 3), 'yyyy-MM-dd')    // 3 months forward from current month
    };
}

// All functions from here are used for fetching events
const userId = 140894; // Hardcoded user ID for demo purposes

// Calculate start and end times based on timeslot
function getTimeRange(timeslot, startDate, endDate) {
  switch (timeslot) {
    case "AM":
      return { start: `${startDate}T09:00:00`, end: `${endDate}T13:00:00` };
    case "PM":
      return { start: `${startDate}T14:00:00`, end: `${endDate}T18:00:00` };
    case "FULL":
      return { start: `${startDate}T09:00:00`, end: `${endDate}T18:00:00` };
    default:
      return { start: startDate, end: endDate };  // Fallback to all-day event if timeslot is unknown
  }
};

// Get background color based on status
function getBackgroundColor(status) {
  switch (status) {
    case 'Approved':
      return '#4caf50'; // Green for approved
    case 'Pending':
      return '#ff9800'; // Orange for pending
    case 'Rejected':
      return '#f44336'; // Red for rejected
    default:
      return '#9e9e9e'; // Grey for unknown status
  }
}

// Retrieve all relevant information of the employee
async function getEmployeeInfo(userId) {
  const apiUrl = `http://127.0.0.1:5002/user/${userId}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error fetching user data: ${response.status}`);
      }
      const userData = await response.json();
      const staffInformation = getStaffInformation(userData.data);
      return staffInformation;
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      return null; 
    }
}

async function getArrangementName(userId) {
  const {staff_lname} = await getEmployeeInfo(userId)
  const {staff_fname}= await getEmployeeInfo(userId);

  // const fullName = `${staff_fname} ${staff_lname} Team`;
  const arrangementName = `${staff_fname} ${staff_lname} WFH`;
  return arrangementName;
}

export const getStaffInformation = (data) => {
  if (!data) {
    throw new Error("Invalid data object");
  }

  const manager_id = data.reporting_manager;
  const role_num = data.role;
  const dept = data.dept;
  const position = data.position;
  const staff_fname = data.staff_fname;
  const staff_lname = data.staff_lname;
  const staff_id = data.staff_id;

  return { manager_id, role_num, dept, position, staff_fname, staff_lname, staff_id };
};
  
// Retrieve employee's Personal Events
export const getPersonalEvents = async () => {
  try{
    const response = await fetch(`http://localhost:5003/get_requests/staff/${userId}`,{
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    const requests = data.data;
    // Map the requests into event categories 
    const personalEvents = await Promise.all(
      requests.map(async (req) => {
        const { start, end } = getTimeRange(req.timeslot, req.arrangement_date, req.arrangement_date);
        const title = await getArrangementName(req.staff_id);
        return {
          title,  
          start,
          end,
          allDay: false,
          backgroundColor: getBackgroundColor(req.status),
        };
      })
    );

  console.log("Personal Events:", personalEvents); // Log team events for debugging
  return personalEvents.filter(event=>event !=null);
  } catch (error) {
    console.error('Failed to fetch personal events:', error);
  }
};    

// Retrieve staff's TeamEvents
export const getStaffTeamEvents = async () => {
  try {
    const response = await fetch('http://localhost:5005/get_all_arrangements', {
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
    const {manager_id} = await getEmployeeInfo(userId);

    // Map the requests into event categories 
    const staffTeamEvents = await Promise.all(
    requests.map(async (req) => {
      if (req.staff_id === userId) {
        return null; // Skip this request if staff_id is the same as the staff in personal events
      }
      if (req.manager_id !== manager_id) {
        return null; // Skip this request if manager_id doesn't match
      }
      if (!req.timeslot || !req.arrangement_date) {
        console.warn("Missing timeslot or arrangement_date in request:", req);
        return null; // Skip this request if data is missing
      }
      const { start, end } = getTimeRange(req.timeslot, req.arrangement_date, req.arrangement_date);
      const title = await getArrangementName(req.staff_id) || 'Team Event';
      return {
        title,  
        start,
        end,
        allDay: false,
        backgroundColor: '#4caf50',
      };
    })
  );

  console.log("Staff's Team Events:", staffTeamEvents); // Log team events for debugging
  return staffTeamEvents.filter(event=>event !=null);
  } catch (error) {
    console.error('Failed to fetch staff events:', error);
  }
};    

// Retrieve reporting Manager's TeamEvents
export const getManagerTeamEvents = async () => {
  try {
    const response = await fetch('http://localhost:5003/get_all_requests', {
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
    const {staff_id} = await getEmployeeInfo(userId);

    // Map the requests into event categories 
    const staffTeamEvents = await Promise.all(
    requests.map(async (req) => {
      if (req.staff_id === userId) {
        return null; // remove any requests made by the manager himself
      }
      if (staff_id !== req.manager_id) {
        return null; // Skip this request if manager_id doesn't match with the manager himself
      }
      if (!req.timeslot || !req.arrangement_date) {
        console.warn("Missing timeslot or arrangement_date in request:", req);
        return null; // Skip this request if data is missing
      }
      const { start, end } = getTimeRange(req.timeslot, req.arrangement_date, req.arrangement_date);
      const title = await getArrangementName(req.staff_id) || 'Team Event';
      return {
        title,  
        start,
        end,
        allDay: false,
        backgroundColor: getBackgroundColor(req.status),
      };
    })
  );

  console.log("Staff's Team Events:", staffTeamEvents); // Log team events for debugging
  return staffTeamEvents.filter(event=>event !=null);
  } catch (error) {
    console.error('Failed to fetch staff events:', error);
  }
};    

// Retrieve all blockout dates
export const getBlockoutDates = async (currentView) => {
  try {
    const response = await fetch('http://localhost:5005/get_blockouts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if(!response.ok){
      throw new Error('Failed to fetch blockout dates');
    }

    const data = await response.json();
    console.log("API Response (blockout date):", data);

    const request = data.data;
    

    const blockouts = await Promise.all(
      request.map(async (req) => {
        console.log("Blockouts: " + req);
        console.log("Blockout timeslot: " + req.timeslot);
        // const { start, end, } = getTimeRange(req.timeslot, req.start_date, req.end_date);

        const { start_date, end_date, timeslot } = req;
        let start, end, allDay;
        let classNames = ['blocked-event']; // Base Class

        // Determine start and end based on timeslot
        if (timeslot === "FULL") {
          start = `${start_date}T09:00:00`; // Full day blockout starts at midnight
          end = `${end_date}T18:00:00`; // Ends at the end of the day
          allDay = true;
          classNames.push('full-day'); // Additional class for full-day
        } else if (timeslot === "AM") {
          start = `${start_date}T09:00:00`; // AM blockout starts at 9 AM
          end = `${start_date}T13:00:00`; // Ends at 1 PM
          allDay = false;
          classNames.push('am-blockout'); // Additional class for AM
        } else if (timeslot === "PM") {
          start = `${start_date}T14:00:00`; // PM blockout starts at 2 PM
          end = `${start_date}T18:00:00`; // Ends at 6 PM
          allDay = false;
          classNames.push('pm-blockout'); // Additional class for PM
        } else {
          // Fallback if the timeslot is unknown
          start = start_date;
          end = end_date;
          allDay = true; // Treat it as all-day by default
        }

        return {
          id: req.blockout_id,
          title: req.title,
          start,
          end,
          classNames,
          // display: 'background',
          allDay: currentView === 'dayGridMonth', // Set allDay based on the current view
        }
      })
    );  
    
    console.log("Blockouts:", blockouts);
    return blockouts;
  } catch(error) {    
      console.error("Failed to fetch arrangement name:", error);
      return null; // Return null or handle error appropriately
  }
}

// TO FIX: create a loop to check the list of staff_id under manager_id until it hits dead end.
// async function getListofStaffInMyDept(managerID){
//   const apiUrl = `http://127.0.0.1:5002/users/team/${managerID}`;
//     try {
//       const response = await fetch(apiUrl);
//       if (!response.ok) {
//         throw new Error(`Error fetching user data: ${response.status}`);
//       }
//       const data = await response.json(); 
//       const unfilteredData = data.data;
//       const staffList = []; 
//       for (i in unfilteredData){
//         staffList.append(unfilteredData[i].staff_id);
//       }
//       return staffList;
//     } catch (error) {
//       console.error("Failed to fetch list of staff in the department:", error);
//       return null; 
//     }
// }