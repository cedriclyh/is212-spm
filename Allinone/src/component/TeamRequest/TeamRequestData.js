const columns = [
    {name: "STAFF", uid: "staff"},
    {name: "REQUEST ID", uid: "request_id", sortable: true},
    {name: "REQUEST DATE", uid: "request_date", sortable: true},
    {name: "ARRANGEMENT DATE", uid: "arrangement_date", sortable: true},
    {name: "TIMESLOT", uid: "timeslot"},
    {name: "STATUS", uid: "status", sortable: true},
    {name: "ACTIONS", uid: "actions"},
  ];
  
const statusOptions = [
    {name: "approved", uid: "Approved"},
    {name: "rejected", uid: "Rejected"},
    {name: "pending", uid: "Pending"},
    {name: "withdrawn", uid: "Withdrawn"},
    {name: "cancelled", uid: "Cancelled"},
  ];

  const pulled_data = [
      {
        "arrangement_date": "2024-10-01",
        "arrangement_dates": [
          "2024-10-01"
        ],
        "manager_id": 140894,
        "reason": "Medical Appointment",
        "request_date": "2024-09-29",
        "request_id": 1,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Susan.Goh@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Susan",
          "staff_id": 140002,
          "staff_lname": "Goh"
        },
        "staff_id": 140002,
        "status": "Approved",
        "timeslot": "AM"
      },
      {
        "arrangement_date": "2024-10-01",
        "arrangement_dates": [
          "2024-10-01"
        ],
        "manager_id": 140894,
        "reason": "Lazy",
        "request_date": "2024-09-29",
        "request_id": 2,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Janice.Chan@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Janice",
          "staff_id": 140003,
          "staff_lname": "Chan"
        },
        "staff_id": 140003,
        "status": "Approved",
        "timeslot": "PM"
      },
      {
        "arrangement_date": "2024-10-01",
        "arrangement_dates": [
          "2024-10-01"
        ],
        "manager_id": 140894,
        "reason": "",
        "request_date": "2024-09-19",
        "request_id": 3,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Mary.Teo@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Mary",
          "staff_id": 140004,
          "staff_lname": "Teo"
        },
        "staff_id": 140004,
        "status": "Approved",
        "timeslot": "FULL"
      },
      {
        "arrangement_date": "2024-10-02",
        "arrangement_dates": [
          "2024-10-02"
        ],
        "manager_id": 140894,
        "reason": "",
        "request_date": "2024-08-09",
        "request_id": 4,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Mary.Teo@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Mary",
          "staff_id": 140004,
          "staff_lname": "Teo"
        },
        "staff_id": 140004,
        "status": "Pending",
        "timeslot": "FULL"
      },
      {
        "arrangement_date": "2024-10-03",
        "arrangement_dates": [
          "2024-10-03"
        ],
        "manager_id": 140894,
        "reason": "",
        "request_date": "2024-09-29",
        "request_id": 5,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Mary.Teo@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Mary",
          "staff_id": 140004,
          "staff_lname": "Teo"
        },
        "staff_id": 140004,
        "status": "Rejected",
        "timeslot": "PM"
      },
      {
        "arrangement_date": "2024-12-01",
        "arrangement_dates": [
          "2024-12-01"
        ],
        "manager_id": 140894,
        "reason": "",
        "request_date": "2024-07-09",
        "request_id": 6,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Mary.Teo@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Mary",
          "staff_id": 140004,
          "staff_lname": "Teo"
        },
        "staff_id": 140004,
        "status": "Pending",
        "timeslot": "AM"
      },
      {
        "arrangement_date": "2025-01-01",
        "arrangement_dates": [
          "2025-01-01"
        ],
        "manager_id": 140894,
        "reason": "",
        "request_date": "2024-09-10",
        "request_id": 7,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Mary.Teo@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Mary",
          "staff_id": 140004,
          "staff_lname": "Teo"
        },
        "staff_id": 140004,
        "status": "Approved",
        "timeslot": "FULL"
      },
      {
        "arrangement_date": "2024-10-11",
        "arrangement_dates": [
          "2024-10-11"
        ],
        "manager_id": 140894,
        "reason": "",
        "request_date": "2024-09-09",
        "request_id": 8,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Mary.Teo@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Mary",
          "staff_id": 140004,
          "staff_lname": "Teo"
        },
        "staff_id": 140004,
        "status": "Approved",
        "timeslot": "PM"
      },
      {
        "arrangement_date": "2024-10-12",
        "arrangement_dates": [
          "2024-10-12"
        ],
        "manager_id": 140894,
        "reason": "",
        "request_date": "2024-08-31",
        "request_id": 9,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Mary.Teo@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Mary",
          "staff_id": 140004,
          "staff_lname": "Teo"
        },
        "staff_id": 140004,
        "status": "Rejected",
        "timeslot": "PM"
      },
      {
        "arrangement_date": "2024-10-15",
        "arrangement_dates": [
          "2024-10-15"
        ],
        "manager_id": 140894,
        "reason": "",
        "request_date": "2024-08-30",
        "request_id": 10,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Mary.Teo@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Mary",
          "staff_id": 140004,
          "staff_lname": "Teo"
        },
        "staff_id": 140004,
        "status": "Pending",
        "timeslot": "FULL"
      },
      {
        "arrangement_date": "2024-10-15",
        "arrangement_dates": [
          "2024-10-15"
        ],
        "manager_id": 140894,
        "reason": "",
        "request_date": "2024-08-30",
        "request_id": 11,
        "staff_details": {
          "country": "Singapore",
          "dept": "Sales",
          "email": "Mary.Teo@allinone.com.sg",
          "position": "Account Manager",
          "reporting_manager": 140894,
          "role": 2,
          "staff_fname": "Mary",
          "staff_id": 140004,
          "staff_lname": "Teo"
        },
        "staff_id": 140004,
        "status": "Pending",
        "timeslot": "PM"
      }
    ];

  export {columns, statusOptions, pulled_data};
