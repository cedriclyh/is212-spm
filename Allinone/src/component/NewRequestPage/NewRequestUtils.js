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
      return `${day}-${month}-${year}`;
    }
  
    const [startDay, startMonth, startYear] = startDateStr.split('-').map(Number);
    const [endDay, endMonth, endYear] = endDateStr.split('-').map(Number);
  
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
   const availabilityStatus = {};

    dates.forEach((date) => {
        if (blockedOutDates.includes(date)) {
        availabilityStatus[date] = "Blocked"; 
        } else {
        availabilityStatus[date] = "Available";
        }
    });

    return availabilityStatus;
    }
  
export {extractWeekdays, checkAvailability};