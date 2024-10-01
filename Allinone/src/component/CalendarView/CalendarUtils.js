import { addMonths, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'; // For date manipulation

// Define valid range (2 months back, 3 months forward)
export const getValidRange = (today) => {
    const startOfCurrentMonth = startOfMonth(today);
  
    return {
    start: format(subMonths(startOfCurrentMonth, 2), 'yyyy-MM-dd'), // 2 months back from current month
    end: format(addMonths(endOfMonth(today), 3), 'yyyy-MM-dd')    // 3 months forward from current month
    };
}

// Retrieve events for CalendarView
export const getEvents = () => {
    // Dummy events
    const personalEvents = [
      { id: 1, title: 'Personal Meeting', start: '2024-10-01T10:00:00', end: '2024-10-01T11:00:00' },
      { id: 2, title: 'Doctor Appointment', date: '2024-09-30', allDay: true, backgroundColor: '#4caf50', }
    ];
    
    const teamEvents = [
      { id: 3, title: 'Team Standup', start: '2024-09-29', end: '2024-10-03' },
      { id: 4, title: 'Project Demo', start: '2024-09-30', end: '2024-09-30' }
    ];

    const blockoutEvents = [
        { id: 'grey1', start: '2024-10-04', allDay: true, display: 'background', title:'Blocked', color: '#818589', classNames: ['blocked-event'], },
        { id: 'grey2', start: '2024-10-10', allDay: true, display: 'background', title:'Blocked', color: '#818589', classNames: ['blocked-event'], }
      ];

    return { personalEvents, teamEvents, blockoutEvents};
  }; 
