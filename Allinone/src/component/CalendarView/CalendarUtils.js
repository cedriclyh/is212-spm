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
    case 'AM':
      return { start: `${date}T09:00:00`, end: `${date}T13:00:00` };
    case 'PM':
      return { start: `${date}T14:00:00`, end: `${date}T18:00:00` };
    case "FULL":
      return { start: `${date}T09:00:00`, end: `${date}T18:00:00` };
    default:
      return { start: date, end: date }; // Fallback to all-day event if timeslot is unknown
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
    const response = await fetch('http://localhost:5003/get_requests/staff/'+userId,{
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
    // Map the requests into event categories 
    const personalEvents = await Promise.all(
    requests.map(async (req) => {
      if (!req.timeslot || !req.arrangement_date) {
        console.warn("Missing timeslot or arrangement_date in request:", req);
        return null; // Skip this request if data is missing
      }

      const { start, end } = getTimeRange(req.timeslot, req.arrangement_date);
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
    const response = await fetch('http://localhost:5003/get_all_requests',{
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
      console.error('Failed to fetch staff team events:', error);
  }; }

    // Map the requests into event categories 
  //   const staffTeamEvents = await Promise.all(
  //   requests.map(async (req) => {
  //     // Check for manager_id condition
  //     if (req.staff_id === userId) {
  //       return null; // Skip this request if staff_id is the same as the staff in personal events
  //     }
  //     if (req.manager_id !== manager_id) {
  //       return null; // Skip this request if manager_id doesn't match
  //     }
  //     if (!req.timeslot || !req.arrangement_date) {
  //       console.warn("Missing timeslot or arrangement_date in request:", req);
  //       return null; // Skip this request if data is missing
  //     }
  //     const { start, end } = getTimeRange(req.timeslot, req.arrangement_date);
  //     const title = await getArrangementName(req.staff_id) || 'Team Event';
  //     return {
  //       id: req.staff_id,
  //       title,  
  //       start,
  //       end,
  //       allDay: false,
  //       backgroundColor: getBackgroundColor(req.status),
  //     };
  //   })
  // );

  // console.log("Staff's Team Events:", staffTeamEvents); // Log team events for debugging
  // return staffTeamEvents.filter(event=>event !=null);
  // } catch (error) {
  //   console.error('Failed to fetch staff team events:', error);
  

async function getListofStaffInMyDept(managerID){
  const apiUrl = `http://127.0.0.1:5002/users`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error fetching user data: ${response.status}`);
      }
      const userData = await response.json();
      const staffList = userData.data.filter(user => user.reporting_manager === managerID);

      return staffList;
    } catch (error) {
      console.error("Failed to fetch list of staff in the department:", error);
      return null; 
    }
}