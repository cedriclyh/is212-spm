function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

function formatDate(dateStr) {
  const date = new Date(dateStr);

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

  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);

  const formattedDateWithoutWeekday = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(date);
  const dateWithSuffix = `${day}${daySuffix(day)} ${formattedDateWithoutWeekday}`;

  // Return as [DAY, DATE]
  return [weekday, dateWithSuffix];
}

function formatTimeslot(timeslot_num) {
  if (timeslot_num==="AM"){
    return ["Morning Shift", "9AM - 1PM"];
  }
  if (timeslot_num==="PM"){
    return ["Afternoon Shift", "2PM - 6PM"];
  }
  if (timeslot_num==="FULL"){
    return ["Full Day", "9AM - 6PM"];
  }
}

export {capitalize, formatDate, formatTimeslot};