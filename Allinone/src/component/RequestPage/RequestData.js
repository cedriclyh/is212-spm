// import axios from 'axios';

const columns = [
  {name: "ARRANGEMENT DATE", uid: "arrangement_date", sortable: true},
  {name: "REQUEST ID", uid: "request_id", sortable: true},
  {name: "REQUEST DATE", uid: "request_date", sortable: true},
  {name: "TIMESLOT", uid: "timeslot"},
  {name: "STATUS", uid: "status", sortable: true},
  {name: "MANAGER", uid: "manager"},
  {name: "RECURRING", uid: "is_recurring"},
  {name: "ACTIONS", uid: "actions"},
];

const statusOptions = [
  {name: "approved", uid: "Approved"},
  {name: "rejected", uid: "Rejected"},
  {name: "pending", uid: "Pending"},
  {name: "withdrawn", uid: "Withdrawn"},
  {name: "cancelled", uid: "Cancelled"},
];

// for axios
// const requestData = async () => {
//   try {
//     const response = await axios.get('http://localhost:5010/employees/140004/requests');
    
//     if (response.status === 200) {
//       return response.data.data;
//     } else {
//       return [];
//     }
//   } catch (error) {
//     if (error.response && error.response.status === 404) {
//       return [];
//     } else {
//       console.error("An error occurred:", error);
//       return [];
//     }
//   }
// };


const pulled_data = [
  {
    "arrangement_date": "2024-10-01",
    "arrangement_dates": [
      "2024-10-01"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-09-19",
    "request_id": 3,
    "staff_id": 140004,
    "start_date": "",
    "status": "Approved",
    "timeslot": "FULL"
  },
  {
    "arrangement_date": "2024-10-02",
    "arrangement_dates": [
      "2024-10-02"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-08-09",
    "request_id": 4,
    "staff_id": 140004,
    "start_date": "",
    "status": "Pending",
    "timeslot": "FULL"
  },
  {
    "arrangement_date": "2024-10-03",
    "arrangement_dates": [
      "2024-10-03"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-09-29",
    "request_id": 5,
    "staff_id": 140004,
    "start_date": "",
    "status": "Rejected",
    "timeslot": "PM"
  },
  {
    "arrangement_date": "2024-12-01",
    "arrangement_dates": [
      "2024-12-01"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-07-09",
    "request_id": 6,
    "staff_id": 140004,
    "start_date": "",
    "status": "Pending",
    "timeslot": "AM"
  },
  {
    "arrangement_date": "2025-01-01",
    "arrangement_dates": [
      "2025-01-01"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-09-10",
    "request_id": 7,
    "staff_id": 140004,
    "start_date": "",
    "status": "Approved",
    "timeslot": "FULL"
  },
  {
    "arrangement_date": "2024-10-11",
    "arrangement_dates": [
      "2024-10-11"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-09-09",
    "request_id": 8,
    "staff_id": 140004,
    "start_date": "",
    "status": "Approved",
    "timeslot": "PM"
  },
  {
    "arrangement_date": "2024-10-12",
    "arrangement_dates": [
      "2024-10-12"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-08-31",
    "request_id": 9,
    "staff_id": 140004,
    "start_date": "",
    "status": "Rejected",
    "timeslot": "PM"
  },
  {
    "arrangement_date": "2024-10-15",
    "arrangement_dates": [
      "2024-10-15"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-08-30",
    "request_id": 10,
    "staff_id": 140004,
    "start_date": "",
    "status": "Pending",
    "timeslot": "FULL"
  },
  {
    "arrangement_date": "2024-10-15",
    "arrangement_dates": [
      "2024-10-15"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-08-30",
    "request_id": 11,
    "staff_id": 140004,
    "start_date": "",
    "status": "Pending",
    "timeslot": "PM"
  },
  {
    "arrangement_date": "2024-10-02",
    "arrangement_dates": [
      "2024-10-02"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-10-01",
    "request_id": 14,
    "staff_id": 140004,
    "start_date": "",
    "status": "Approved",
    "timeslot": "FULL"
  },
  {
    "arrangement_date": "2024-10-04",
    "arrangement_dates": [
      "2024-10-04"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-10-02",
    "request_id": 15,
    "staff_id": 140004,
    "start_date": "",
    "status": "Approved",
    "timeslot": "FULL"
  },
  {
    "arrangement_date": "2024-10-21",
    "arrangement_dates": [
      "2024-10-21"
    ],
    "end_date": "",
    "is_recurring": false,
    "manager_details": {
      "country": "Singapore",
      "dept": "Sales",
      "email": "Rahim.Khalid@allinone.com.sg",
      "position": "Sales Manager",
      "reporting_manager": 140001,
      "role": 3,
      "staff_fname": "Rahim",
      "staff_id": 140894,
      "staff_lname": "Khalid"
    },
    "manager_id": 140894,
    "reason": "",
    "recurring_day": "",
    "remark": "",
    "request_date": "2024-10-03",
    "request_id": 16,
    "staff_id": 140004,
    "start_date": "",
    "status": "Approved",
    "timeslot": "FULL"
  }
];

export {columns, statusOptions, pulled_data};
