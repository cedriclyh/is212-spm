function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

function formatDate(dateStr) {
  const date = new Date(dateStr);

  // Get day of the month and determine ordinal suffix
  const day = date.getDate();
  const daySuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Format the day of the week
  // const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  // const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);

  // Extract the weekday
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);

  // Format the day + month + year part
  const formattedDateWithoutWeekday = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(date);
  const dateWithSuffix = `${day}${daySuffix(day)} ${formattedDateWithoutWeekday}`;

  // Return as [DAY, DATE]
  return [weekday, dateWithSuffix];
}

function formatTimeslot(timeslot_num) {
  if (timeslot_num===1){
    return ["Morning Shift", "8AM - 12PM"];
  }
  if (timeslot_num===2){
    return ["Afternoon Shift", "12PM - 6PM"];
  }
  if (timeslot_num===3){
    return ["Full Day", "8AM - 6PM"];
  }
}

export {capitalize, formatDate, formatTimeslot};