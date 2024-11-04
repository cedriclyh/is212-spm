const columns = [
    {name: "STAFF", uid: "staff"},
    {name: "REQUEST ID", uid: "request_id", sortable: true},
    {name: "REQUEST DATE", uid: "request_date", sortable: true},
    {name: "ARRANGEMENT DATE", uid: "arrangement_date", sortable: true},
    {name: "TIMESLOT", uid: "timeslot"},
    {name: "STATUS", uid: "status", sortable: true},
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

  const pulled_data = [
    {
      "arrangement_date": "2024-10-01",
      "arrangement_dates": [
        "2024-10-01"
      ],
      "end_date": "",
      "is_recurring": false,
      "manager_id": 140894,
      "reason": "Medical Appointment",
      "recurring_day": "",
      "remark": "",
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
      "start_date": "",
      "status": "Approved",
      "timeslot": "AM"
    },
    {
      "arrangement_date": "2024-10-01",
      "arrangement_dates": [
        "2024-10-01"
      ],
      "end_date": "",
      "is_recurring": false,
      "manager_id": 140894,
      "reason": "Lazy",
      "recurring_day": "",
      "remark": "",
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
      "start_date": "",
      "status": "Approved",
      "timeslot": "PM"
    },
    {
      "arrangement_date": "2024-10-01",
      "arrangement_dates": [
        "2024-10-01"
      ],
      "end_date": "",
      "is_recurring": false,
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
      "request_date": "2024-10-01",
      "request_id": 14,
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
      "request_date": "2024-10-02",
      "request_id": 15,
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
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
      "request_date": "2024-10-03",
      "request_id": 16,
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
      "start_date": "",
      "status": "Approved",
      "timeslot": "FULL"
    },
    {
      "arrangement_date": "2024-11-01",
      "arrangement_dates": [
        "2024-11-01"
      ],
      "end_date": "",
      "is_recurring": false,
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
      "request_date": "2024-10-28",
      "request_id": 17,
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
      "start_date": "",
      "status": "Approved",
      "timeslot": "AM"
    },
    {
      "arrangement_date": "2024-11-01",
      "arrangement_dates": [
        "2024-11-01"
      ],
      "end_date": "",
      "is_recurring": false,
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "",
      "remark": "",
      "request_date": "2024-10-28",
      "request_id": 18,
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
      "start_date": "",
      "status": "Rejected",
      "timeslot": "PM"
    },
    {
      "arrangement_date": "",
      "arrangement_dates": [
        "2024-11-04",
        "2024-11-11",
        "2024-11-18",
        "2024-11-25",
        "2024-12-02",
        "2024-12-09",
        "2024-12-16",
        "2024-12-23",
        "2024-12-30"
      ],
      "end_date": "2024-12-31",
      "is_recurring": true,
      "manager_id": 140894,
      "reason": "",
      "recurring_day": "Monday",
      "remark": "",
      "request_date": "2024-10-30",
      "request_id": 19,
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
      "start_date": "2024-11-01",
      "status": "Pending",
      "timeslot": "FULL"
    }
    ];

  export {columns, statusOptions, pulled_data};
