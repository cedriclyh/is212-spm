import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'; 

const BLOCKOUT_URL = "http://54.84.53.208:5014/blockout"

export const getValidRange = (today) => {
    const startOfCurrentMonth = startOfMonth(today);

    return {
    start: format(subMonths(startOfCurrentMonth, 2), 'yyyy-MM-dd'), // 2 months back from current month
    end: format(addMonths(endOfMonth(today), 3), 'yyyy-MM-dd')    // 3 months forward from current month
    };
}

function getTimeRange(timeslot, startDate, endDate) {
  switch (timeslot) {
    case "AM":
      return { start: `${startDate}T09:00:00`, end: `${endDate}T13:00:00` };
    case "PM":
      return { start: `${startDate}T14:00:00`, end: `${endDate}T18:00:00` };
    case "FULL":
      return { start: `${startDate}T09:00:00`, end: `${endDate}T18:00:00` };
    default:
      return { start: startDate, end: endDate };  
  }
};

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

export const getDeptName = async (userId) => {
  const apiUrl = `http://54.84.53.208:5002/user/${userId}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error fetching user data: ${response.status}`);
      }
      const userData = await response.json();
      const staff_dept= userData.data.dept;
      return staff_dept;
    } catch (error) {
      console.error("Failed to fetch department name:", error);
      return null;
    }
}

async function getEmployeeInfo(userId) {
  const apiUrl = `http://54.84.53.208:5002/user/${userId}`;
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

  const arrangementName = `${staff_fname} ${staff_lname} WFH`;
  return arrangementName;
}

async function getTeamName(userId) {
  const {staff_lname} = await getEmployeeInfo(userId)
  const {staff_fname}= await getEmployeeInfo(userId);

  const arrangementName = `${staff_fname} ${staff_lname}'s Team`;
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


export const getApprovedandPendingandCancelledEvents = async (userId) => {
  try{
    const response = await fetch(`http://54.84.53.208:5003/get_requests/staff/${userId}`,{
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
    const personalEvents = await Promise.all(
      requests.map(async (req) => {
        const { start, end } = getTimeRange(req.timeslot, req.arrangement_date, req.arrangement_date);
        const title = await getArrangementName(req.staff_id);
        const teamName = await getTeamName(req.manager_id)
        const {dept, position} = await getEmployeeInfo(req.staff_id);
        return {
          id: req.request_id + req.arrangement_date,
          title,  
          start,
          end,
          allDay: false,
          backgroundColor: getBackgroundColor(req.status),
          teamName: teamName,
          dept: dept,
          managerID : req.manager_id,
          position: position, 
        };
      })
    );

  return personalEvents.filter(event=>event !=null);
  } catch (error) {
    console.error("Failed to fetch employee's own events:", error);
  }
};    

export const getApprovedandPendingEvents = async (userId) => {
  try{
    const response = await fetch(`http://54.84.53.208:5003/get_requests/staff/${userId}`,{
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
    const personalEvents = await Promise.all(
      requests.flatMap(async (req) => {
        if (req.status === 'Rejected') {
          return null; 
        }

        const arrangementDates = req.arrangement_dates; 
        return await Promise.all(arrangementDates.map(async (date) => {
          const { start, end } = getTimeRange(req.timeslot, date, date);
          const title = await getArrangementName(req.staff_id);
          const teamName = await getTeamName(req.manager_id)
          const {dept, position} = await getEmployeeInfo(req.staff_id);

          return {
            id: req.request_id + req.arrangement_date,
            title,  
            start,
            end,
            allDay: false,
            backgroundColor: getBackgroundColor(req.status),
            teamName: teamName,
            dept: dept,
            managerID : req.manager_id,
            position: position,
          };
      })); 
    })
  ); 
  const flatEvents = personalEvents.flat();
  return flatEvents.filter(event=>event !=null);
  } catch (error) {
    console.warn("Failed to fetch employee's own events:", error);
  }
};    

export const getApprovedEventsOnly = async (userId) => {
  try {
    const response = await fetch('http://54.84.53.208:5005/get_all_arrangements', {
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
    const listofStaffs = await getListofStaffUnderManager(manager_id);

    const staffTeamEvents = await Promise.all(
    requests.map(async (req) => {
      if (req.staff_id === userId) {
        return null; 
      }
      if (!listofStaffs.includes(req.staff_id)) {
        return null; 
      }
      if (!req.timeslot || !req.arrangement_date) {
        console.warn("Missing timeslot or arrangement_date in request:", req);
        return null; 
      }
      const { start, end } = getTimeRange(req.timeslot, req.arrangement_date, req.arrangement_date);
      const title = await getArrangementName(req.staff_id) ;
      const teamName = await getTeamName(manager_id)
      const {dept, position} = await getEmployeeInfo(req.staff_id);
      return {
        id: `${req.staff_id}-${req.arrangement_date}`, 
        title,  
        start,
        end,
        allDay: false,
        backgroundColor: '#4caf50',
        teamName: teamName,
        dept: dept,
        managerID : manager_id, 
        position: position,
      };
    })
  );
  return staffTeamEvents.filter(event=>event !=null);
  } catch (error) {
    console.warn('Failed to fetch other team events:', error);
  }
};

export const getListofStaffUnderManager = async (userId) => {
  try {
    const response = await fetch(`http://54.84.53.208:5002/users/team/${userId}`, {
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
    const ListOfStaffIds = requests.map(req => req.staff_id);
    return ListOfStaffIds;
  } catch (error) {
    console.warn('Failed to fetch list of staffs under the manager:', error);
  }
};    


export const getPersonalEvents = async (userId) => {
  let events = await getApprovedandPendingEvents(userId);
  return events
};  

export const getStaffTeamEvents = async (userId) => {
  let events = await getApprovedEventsOnly(userId);
  return events
};    

export const getManagerTeamEvents = async (userId) => {
  let ListOfStaffIds = await getListofStaffUnderManager(userId);
  const StaffIdsInRequests = await getAllStaffinRequests();
  const StaffIdsSet = new Set(StaffIdsInRequests);
  const matchingStaffIds = ListOfStaffIds.filter(staffId => StaffIdsSet.has(staffId));
  const allStaffTeamEvents = []; 

  for (const staffId of matchingStaffIds){
    try{
      const staffTeamEvents = await getApprovedandPendingEvents(staffId);
      allStaffTeamEvents.push(...staffTeamEvents);
    }catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn(`Skipping staffId ${staffId} due to no events found.`);
      } 
    }
  } 
  return allStaffTeamEvents;
};    

export const getAllStaffinRequests = async () => {
  try {
    const response = await fetch('http://54.84.53.208:5003/get_all_requests', {
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
    const uniqueStaffIds = [...new Set(requests.map(entry => entry.staff_id))];
    return uniqueStaffIds;
  }catch (error) {
    console.error("Failed to get the list of staffs present in requests log:", error);
  }
}
export const getDirectorTeamEvents = async (userId) => {
  const ListOfManagerIds = await getListofStaffUnderManager(userId);
  const allDirectorsTeamEvents = []; 

  for (const managerId of ListOfManagerIds){
    try {
      let events = await getManagerTeamEvents(managerId);
      if (events && events.length > 0) {
        allDirectorsTeamEvents.push(...events);  
      }
    } catch (error) {
      console.warn(`No events found for manager ID ${managerId}:`, error.message);
    }
  }
  return allDirectorsTeamEvents;
};    

export const getHRTeamEvents = async (userId) => {
  try {
    const response = await fetch('http://54.84.53.208:5003/get_all_requests', {
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

    // Map the requests into event categories 
    const HRTeamEvents = await Promise.all(
    requests.flatMap(async (req) => {
      if (req.status === 'Rejected') {
        return null; 
      }
      if (req.staff_id === userId) {
        return null;
      }

      const arrangementDates = req.arrangement_dates;
      return await Promise.all (arrangementDates.map(async (date) => {
        const { start, end } = getTimeRange(req.timeslot, date, date);
        const staffName = await getArrangementName(req.staff_id);
        const teamName = await getTeamName(req.manager_id)
        const manager_id = req.manager_id
        const title = `[${teamName}] ${staffName}`;
        const {dept, position} = await getEmployeeInfo(req.staff_id);

        return {
          id: `${req.staff_id}-${req.arrangement_date}`, 
          title,  
          start,
          end,
          allDay: false,
          backgroundColor: getBackgroundColor(req.status),
          teamName: teamName,
          dept: dept,
          managerID : manager_id,
          position: position,
        };
      })); 
    })
  ); 
  const flatEvents = HRTeamEvents.flat();
  return flatEvents.filter(event=>event !=null);
  } catch (error) {
    console.error("Failed to fetch team events that HR/CEO can view::", error);
  }
};    


// Retrieve all blockout dates
export const getBlockoutDates = async (currentView) => {
  try {
    const response = await fetch(`${BLOCKOUT_URL}/get_blockouts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if(!response.ok){
      throw new Error('Failed to fetch blockout dates');
    }

    const data = await response.json();

    const request = data.data;


    const blockouts = await Promise.all(
      request.map(async (req) => {

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

    return blockouts;
  } catch(error) {    
      console.error("Failed to fetch arrangement name:", error);
      return null; // Return null or handle error appropriately
  }
}

export const checkRoleNum = async (userId) => {
  const {roleNum} = await getEmployeeInfo(userId);
  return roleNum;
}