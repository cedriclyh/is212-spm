import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'; // For date manipulation

const userId = 140004; // Hardcoded user ID for demo purposes

export const getValidRange = (today) => {
    const startOfCurrentMonth = startOfMonth(today);
  
    return {
    start: format(subMonths(startOfCurrentMonth, 2), 'yyyy-MM-dd'), // 2 months back from current month
    end: format(addMonths(endOfMonth(today), 3), 'yyyy-MM-dd')    // 3 months forward from current month
    };
}

// Helper function to calculate start and end times based on timeslot
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

export async function getArrangementName(userId) {
  const apiUrl = `http://127.0.0.1:5002/user/${userId}`;
  try {
    // Fetch user data from the API
    const response = await fetch(apiUrl);
    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`Error fetching user data: ${response.status}`);
    }
    // Parse the JSON response
    const userData = await response.json();
    // console.log("User Data:", userData);

    // Extract first name and last name
    const staff_fname= userData.data.staff_fname;
    const staff_lname= userData.data.staff_lname;

    // Combine first and last name
    const arrangementName = `${staff_fname} ${staff_lname} WFH`;
    // console.log("Arrangement Name:", arrangementName);
    return arrangementName;
  } catch (error) {
    console.error("Failed to fetch arrangement name:", error);
    return null; // Return null or handle error appropriately
  }
}

export async function getStaffName(userId) {
  const apiUrl = `http://127.0.0.1:5002/user/${userId}`;

  try {
    // Fetch user data from the API
    const response = await fetch(apiUrl);

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`Error fetching user data: ${response.status}`);
    }

    // Parse the JSON response
    const userData = await response.json();
    console.log("User Data:", userData);

    // Extract first name and last name
    const staff_fname = userData.data.staff_fname;
    const staff_lname = userData.data.staff_lname;

    // Combine first and last name
    const staffName = `${staff_fname} ${staff_lname}`;
    return staffName;
  } catch (error) {
    console.error("Failed to fetch staff name:", error);
    return null; // Return null or handle error appropriately
  }
}

// Retrieve personalEvents for CalendarView
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
    // console.log("API Response:", data);

    const requests = data.data;

   // Map the requests into event categories 
   const personalEvents = await Promise.all(
    requests.map(async (req) => {
      if (!req.timeslot || !req.arrangement_date) {
        console.warn("Missing timeslot or arrangement_date in request:", req);
        return null; // Skip this request if data is missing
      }

      const { start, end } = getTimeRange(req.timeslot, req.arrangement_date);

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

// Retrieve staffTeamEvents for CalendarView
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
    // console.log("API Response:", data);

    const requests = data.data;

   // Map the requests into event categories 
   const staffTeamEvents = await Promise.all(
    requests.map(async (req) => {
      // Check for manager_id condition
      if (req.staff_id === userId) {
        return null; // Skip this request if staff_id is the same as the staff in personal events
      }
      if (req.manager_id !== 140894) {
        return null; // Skip this request if manager_id doesn't match
      }
      
      if (!req.timeslot || !req.arrangement_date) {
        console.warn("Missing timeslot or arrangement_date in request:", req);
        return null; // Skip this request if data is missing
      }

      const { start, end } = getTimeRange(req.timeslot, req.arrangement_date);

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

  console.log("Staff's Team Events:", staffTeamEvents); // Log team events for debugging
  return staffTeamEvents.filter(event=>event !=null);
  } catch (error) {
    console.error('Failed to fetch staff team events:', error);
  }
}; 