function extractWeekdays(startDateStr, endDateStr, weekdayStr) {
  const weekdaysMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const weekday = weekdaysMap[weekdayStr];

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }

  const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

  const startDate = new Date(startYear, startMonth - 1, startDay);
  const endDate = new Date(endYear, endMonth - 1, endDay);

  let dates = [];

  let currentDate = startDate;

  const currentWeekday = currentDate.getDay();
  const targetWeekday = weekday % 7; 

  if (currentWeekday !== targetWeekday) {
    const daysUntilTarget = (targetWeekday - currentWeekday + 7) % 7;
    currentDate.setDate(currentDate.getDate() + daysUntilTarget);
  }

  while (currentDate <= endDate) {
    if (currentDate.getDay() === targetWeekday) {
      dates.push(formatDate(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 7);
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