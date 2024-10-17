import axios from 'axios';

const columns = [
    {name: "ARRANGEMENT DATE", uid: "arrangement_date", sortable: true},
    {name: "REQUEST ID", uid: "request_id", sortable: true},
    {name: "REQUEST DATE", uid: "request_date", sortable: true},
    {name: "TIMESLOT", uid: "timeslot"},
    {name: "STATUS", uid: "status", sortable: true},
    {name: "MANAGER", uid: "manager"},
    {name: "ACTIONS", uid: "actions"},
  ];
  
  const statusOptions = [
    {name: "approved", uid: "Approved"},
    {name: "rejected", uid: "Rejected"},
    {name: "pending", uid: "Pending"},
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
      "request_date": "2024-09-19",
      "request_id": 3,
      "staff_id": 140004,
      "status": "Pending",
      "timeslot": 3
    },
    {
      "arrangement_date": "2024-10-02",
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
      "request_date": "2024-08-09",
      "request_id": 4,
      "staff_id": 140004,
      "status": "Pending",
      "timeslot": 3
    },
    {
      "arrangement_date": "2024-10-03",
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
      "request_date": "2024-09-29",
      "request_id": 5,
      "staff_id": 140004,
      "status": "Rejected",
      "timeslot": 2
    },
    {
      "arrangement_date": "2024-12-01",
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
      "request_date": "2024-07-09",
      "request_id": 6,
      "staff_id": 140004,
      "status": "Pending",
      "timeslot": 1
    },
    {
      "arrangement_date": "2025-01-01",
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
      "request_date": "2024-09-10",
      "request_id": 7,
      "staff_id": 140004,
      "status": "Approved",
      "timeslot": 3
    },
    {
      "arrangement_date": "2024-10-11",
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
      "request_date": "2024-09-09",
      "request_id": 8,
      "staff_id": 140004,
      "status": "Approved",
      "timeslot": 2
    },
    {
      "arrangement_date": "2024-10-12",
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
      "request_date": "2024-08-31",
      "request_id": 9,
      "staff_id": 140004,
      "status": "Rejected",
      "timeslot": 2
    },
    {
      "arrangement_date": "2024-10-15",
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
      "request_date": "2024-08-30",
      "request_id": 10,
      "staff_id": 140004,
      "status": "Pending",
      "timeslot": 3
    }
  ];

  export {columns, statusOptions, pulled_data};
