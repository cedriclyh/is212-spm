function extractWeekdays(startDateStr, endDateStr, dayOfWeek) {
  const startDate = (typeof startDateStr === 'string' ? startDateStr 
                   : startDateStr instanceof Date ? startDateStr.toISOString().split("T")[0] 
                   : null);
  
  const endDate = (typeof endDateStr === 'string' ? endDateStr 
                 : endDateStr instanceof Date ? endDateStr.toISOString().split("T")[0] 
                 : null);

  if (!startDate || !endDate) {
    console.error("Invalid start or end date.", { startDate, endDate });
    return [];
  }

  const dates = [];
  let current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    if (current.toLocaleDateString('en-US', { weekday: 'long' }) === dayOfWeek) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function checkAvailability(dates, blockedOutDates) {
const availability = {};

dates.forEach((date) => {
  availability[date] = blockedOutDates.includes(date) ? "Blocked" : "Available";
});

return availability;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Function to format Date object to "YYYY-MM-DD" string
function changeFormat(date) {
  return date.toISOString().split('T')[0];
}

function getAllDates(data) {
  const allDates = [];

  data.forEach(item => {
    const startDate = new Date(item.start_date);
    const endDate = new Date(item.end_date);

    for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
      allDates.push(changeFormat(d));
    }
  });

  return allDates;
}


export {extractWeekdays, checkAvailability, getAllDates};