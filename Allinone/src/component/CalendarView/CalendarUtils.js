import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'; // For date manipulation

export const getValidRange = (today) => {
    const startOfCurrentMonth = startOfMonth(today);
  
    return {
    start: format(subMonths(startOfCurrentMonth, 2), 'yyyy-MM-dd'), // 2 months back from current month
    end: format(addMonths(endOfMonth(today), 3), 'yyyy-MM-dd')    // 3 months forward from current month
    };
}

// All functions from here are used for fetching events
const userId = 140004; // Hardcoded user ID for demo purposes

// Calculate start and end times based on timeslot
function getTimeRange(timeslot, date) {
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
  
      console.log(`User Data: ${userData}`);
      return userData.data;
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      return null; 
    }
}

async function getArrangementName(userId) {
  const employee_data = await getEmployeeInfo(userId)
  const staff_fname= employee_data.staff_fname;
  const staff_lname= employee_data.staff_lname;

  const arrangementName = `${staff_fname} ${staff_lname} WFH`;
  return arrangementName;
}

async function getReportingManagerID(userID){
  const employee_data = await getEmployeeInfo(userID)
  const manager_id= employee_data.reporting_manager;
  return manager_id;
}

async function getRoleNum (userID){
  const employee_data = await getEmployeeInfo(userID)
  const role_num= employee_data.role_num;
  return role_num;
}

async function getDeptDetails(userID){
  const employee_data = await getEmployeeInfo(userID)
  const dept= employee_data.dept;
  const country= employee_data.country;
  const position= employee_data.position;
  return {dept, position, country};
}
  
// Retrieve employee's Personal Events
export const getPersonalEvents = async () => {
  try{
    const response = await fetch('http://localhost:5005/get_all_arrangements',{
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      console.log(response);
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    const requests = data.data;
    // Map the requests into event categories 
    const personalEvents = await Promise.all(
    requests.map(async (req) => {
      if (!req.timeslot || !req.arrangement_date) {
        console.warn("Missing timeslot or arrangement_date in request:", req);
        return null; // Skip this request if data is missing
      }

      const { start, end } = getTimeRange(req.timeslot, req.arrangement_date, req.arrangement_date);
      
      // Wait for the arrangement name to be fetched
      const title = await getArrangementName(req.staff_id) || 'Team Event';
      return {
        id: req.staff_id,
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

// Retrieve employee's TeamEvents
export const getStaffTeamEvents = async () => {
  try{
    const response = await fetch('http://localhost:5005/get_arrangement/staff/140003',{
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    const requests = data.data;

    const role_num = await getRoleNum(userId); 
    const manager_id = await getReportingManagerID(userId); // used for "Staff"
    const staffList = await getListofStaffInMyDept(manager_id); // used for "Manager"
    const {staffDept, staffPosition, staffCountry} = await getEmployeeInfo(userId);
    const groupedEvents = {};

    if (role_num === '2'){
      const staffTeamEvents = await Promise.all(
        requests.map(async (req) => {
          if (req.staff_id === userId || //do not display your own events
            req.manager_id !== manager_id || //do not display if the manager is not your expected team manager
            req.staff_id !== manager_id || //do not display if staff is the manager
            !req.timeslot || 
            !req.arrangement_date
          ) {
            return null; 
          }
          const { start, end } = getTimeRange(req.timeslot, req.arrangement_date);
          const title = await getArrangementName(req.staff_id) || 'Team Event';
          const {staffDept, staffPosition, staffCountry} = await getEmployeeInfo(req.staff_id);
          const event = {
            id: req.staff_id,
            title,  
            start,
            end,
            allDay: false,
            backgroundColor: getBackgroundColor(req.status),
            dept: staffDept,
            position: staffPosition,
            country: staffCountry,
          };
          // Group events based on Dept + Position + Country
          const groupKey = `${req.dept}_${req.position}_${req.country}`;
          if (!groupedEvents[groupKey]) {
            groupedEvents[groupKey] = [];
          }
          groupedEvents[groupKey].push(event);

          return event;
          })
        );
      console.log("Grouped Events by Dept + Position + Country:", groupedEvents); // Log for debugging
      return staffTeamEvents.filter(event => event != null);
    }

    else if (role_num === '3'){
      const staffTeamEvents = await Promise.all(
        requests.map(async (req) => {
          if (req.staff_id === userId || //do not display your own events
            !staffList.some(staff => staff.staff_id === req.staff_id) || // if staff does not work under you as a manager
            !req.timeslot || 
            !req.arrangement_date
          ) {
            return null; 
          }
          const { start, end } = getTimeRange(req.timeslot, req.arrangement_date);
          const title = await getArrangementName(req.staff_id) || 'Team Event';
          const {staffDept, staffPosition, staffCountry} = await getEmployeeInfo(req.staff_id);
          const event = {
            id: req.staff_id,
            title,  
            start,
            end,
            allDay: false,
            backgroundColor: getBackgroundColor(req.status),
            dept: staffDept,
            position: staffPosition,
            country: staffCountry,
          };
          // Group events based on Dept + Position + Country
          const groupKey = `${req.dept}_${req.position}_${req.country}`;
          if (!groupedEvents[groupKey]) {
            groupedEvents[groupKey] = [];
          }
          groupedEvents[groupKey].push(event);

          return event;
          })
        );
      console.log("Grouped Events by Dept + Position + Country:", groupedEvents); // Log for debugging
      return staffTeamEvents.filter(event => event != null);
    }
    
    else if (role_num === '1'){
      if (staffDept === 'HR' || userId === 130002){ {
        const groupedEvents = {}; // Initialize the grouped events object
      
        const staffTeamEvents = await Promise.all(
          requests.map(async (req) => {
            if (
              req.staff_id === userId || // Do not display your own events
              !req.timeslot || 
              !req.arrangement_date
            ) {
              return null; 
            }
      
            const { start, end } = getTimeRange(req.timeslot, req.arrangement_date);
            const title = await getArrangementName(req.staff_id) || 'Team Event';
      
            const event = {
              id: req.staff_id,
              title,  
              start,
              end,
              allDay: false,
              backgroundColor: getBackgroundColor(req.status),
              reporting_manager: req.manager_id
            };
      
            // Group events based on manager_id
            const groupKey = req.manager_id;
            if (!groupedEvents[groupKey]) {
              groupedEvents[groupKey] = [];
            }
            groupedEvents[groupKey].push(event);
      
            return event;
          })
        );
      
        console.log("Grouped Events by Manager ID for HR:", groupedEvents); // Log for debugging
      
        // Optionally, return the grouped events instead of flat events
        return groupedEvents; // Return grouped events instead of filtering for null
      }
      }
      else {
        const staffTeamEvents = await Promise.all(
          requests.map(async (req) => {
            const staffList = await getListofStaffInMyDept(userId); //retrieves List of Managers/Staff under Director
             // Extract staff IDs from the staffList for easier reference
            if (staffDept === "Sales" || staffDept === 'Finance'){
              const staffIds = staffList.map(staff => staff.staff_id);
              for (staff in staffIds){
                staffList.append(getListofStaffInMyDept(staff));
              }
            }
            
            if (req.staff_id === userId || //do not display your own events
              !staffList.some(staff => staff.staff_id === req.staff_id) || // if staff does not work under you as a manager
              !req.timeslot || 
              !req.arrangement_date
            ) {
              return null; 
            }
            const { start, end } = getTimeRange(req.timeslot, req.arrangement_date);
            const title = await getArrangementName(req.staff_id) || 'Team Event';
            const {staffDept, staffPosition, staffCountry} = await getEmployeeInfo(req.staff_id);
            const event = {
              id: req.staff_id,
              title,  
              start,
              end,
              allDay: false,
              backgroundColor: getBackgroundColor(req.status),
              dept: staffDept,
              position: staffPosition,
              country: staffCountry,
            };
            // Group events based on Dept + Position + Country
            const groupKey = `${req.dept}_${req.position}_${req.country}`;
            if (!groupedEvents[groupKey]) {
              groupedEvents[groupKey] = [];
            }
            groupedEvents[groupKey].push(event);
  
            return event;
            })
          );
        console.log("Grouped Events by Dept + Position + Country:", groupedEvents); // Log for debugging
        return staffTeamEvents.filter(event => event != null);
      }
    }
  } catch (error) {
    console.error('Failed to fetch personal events:', error);
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
