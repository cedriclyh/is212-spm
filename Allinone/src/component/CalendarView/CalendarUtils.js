import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'; // For date manipulation

// Define valid range (2 months back, 3 months forward)
export const getValidRange = (today) => {
    const startOfCurrentMonth = startOfMonth(today);
  
    return {
    start: format(subMonths(startOfCurrentMonth, 2), 'yyyy-MM-dd'), // 2 months back from current month
    end: format(addMonths(endOfMonth(today), 3), 'yyyy-MM-dd')    // 3 months forward from current month
    };
}

// Retrieve TeamEvents for CalendarView
export const getTeamEvents = async () => {
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
    console.log("API Response:", data);

    // Helper function to calculate start and end times based on timeslot
    const getTimeRange = (timeslot, date) => {
      switch (timeslot) {
        case 1:
          return { start: `${date}T09:00:00`, end: `${date}T13:00:00` };
        case 2:
          return { start: `${date}T14:00:00`, end: `${date}T18:00:00` };
        case 3:
          return { start: `${date}T09:00:00`, end: `${date}T18:00:00` };
        default:
          return { start: date, end: date }; // Fallback to all-day event if timeslot is unknown
      }
    };

    const requests = data.data;

   // Map the requests into event categories 
   const teamEvents = requests.map(req => {
    if (!req.timeslot || !req.arrangement_date) {
      console.warn("Missing timeslot or arrangement_date in request:", req);
      return null; // Skip this request if data is missing
    }

    const { start, end } = getTimeRange(req.timeslot, req.arrangement_date);
    
    return {
      id: req.staff_id,
      title: req.reason || 'Team Event',
      start,
      end,
      allDay: false,
      backgroundColor: '#4caf50',
    };
  }).filter(event=>event !=null)

  console.log("Team Events:", teamEvents); // Log team events for debugging
  return {teamEvents};
  } catch (error) {
    console.error('Failed to fetch team events:', error);
  }
};    

// Retrieve personalEvents for CalendarView
export const getPersonalEvents = async () => {
  try{
    const response = await fetch('http://localhost:5003/requests/staff/140003',{
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    console.log("API Response:", data);

    // Helper function to calculate start and end times based on timeslot
    const getTimeRange = (timeslot, date) => {
      switch (timeslot) {
        case 1:
          return { start: `${date}T09:00:00`, end: `${date}T13:00:00` };
        case 2:
          return { start: `${date}T14:00:00`, end: `${date}T18:00:00` };
        case 3:
          return { start: `${date}T09:00:00`, end: `${date}T18:00:00` };
        default:
          return { start: date, end: date }; // Fallback to all-day event if timeslot is unknown
      }
    };

    const requests = data.data;

   // Map the requests into event categories 
   const personalEvents = requests.map(req => {
    if (!req.timeslot || !req.arrangement_date) {
      console.warn("Missing timeslot or arrangement_date in request:", req);
      return null; // Skip this request if data is missing
    }

    const { start, end } = getTimeRange(req.timeslot, req.arrangement_date);
    
    return {
      id: req.staff_id,
      title: req.reason || 'Team Event',
      start,
      end,
      allDay: false,
      backgroundColor: '#4caf50',
    };
  }).filter(event=>event !=null)

  console.log("Personal Events:", personalEvents); // Log team events for debugging
  return {personalEvents};
  } catch (error) {
    console.error('Failed to fetch personal events:', error);
  }
};    
