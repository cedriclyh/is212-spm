import axios from 'axios';

const columns = [
    {name: "ID", uid: "id", sortable: true},
    {name: "NAME", uid: "name", sortable: true},
    {name: "AGE", uid: "age", sortable: true},
    {name: "ROLE", uid: "role", sortable: true},
    {name: "TEAM", uid: "team"},
    {name: "EMAIL", uid: "email"},
    {name: "STATUS", uid: "status", sortable: true},
    {name: "MANAGER", uid: "manager"},
    {name: "ACTIONS", uid: "actions"},
  ];
  
  const statusOptions = [
    {name: "approved", uid: "approved"},
    {name: "rejected", uid: "rejected"},
    {name: "pending", uid: "pending"},
  ];
  
  const users = [
    {
      id: 1,
      name: "Tony Reichert",
      role: "CEO",
      team: "Management",
      status: "approved",
      age: "29",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
      email: "tony.reichert@example.com",
    },
    {
      id: 2,
      name: "Zoey Lang",
      role: "Tech Lead",
      team: "Development",
      status: "rejected",
      age: "25",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      email: "zoey.lang@example.com",
    },
    {
      id: 3,
      name: "Jane Fisher",
      role: "Sr. Dev",
      team: "Development",
      status: "approved",
      age: "22",
      avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
      email: "jane.fisher@example.com",
    },
    {
      id: 4,
      name: "William Howard",
      role: "C.M.",
      team: "Marketing",
      status: "pending",
      age: "28",
      avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
      email: "william.howard@example.com",
    },
    {
      id: 5,
      name: "Kristen Copper",
      role: "S. Manager",
      team: "Sales",
      status: "approved",
      age: "24",
      avatar: "https://i.pravatar.cc/150?u=a092581d4ef9026700d",
      email: "kristen.cooper@example.com",
    },
    {
      id: 6,
      name: "Brian Kim",
      role: "P. Manager",
      team: "Management",
      age: "29",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
      email: "brian.kim@example.com",
      status: "approved",
    },
    {
      id: 7,
      name: "Michael Hunt",
      role: "Designer",
      team: "Design",
      status: "rejected",
      age: "27",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29027007d",
      email: "michael.hunt@example.com",
    },
    {
      id: 8,
      name: "Samantha Brooks",
      role: "HR Manager",
      team: "HR",
      status: "approved",
      age: "31",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e27027008d",
      email: "samantha.brooks@example.com",
    },
    {
      id: 9,
      name: "Frank Harrison",
      role: "F. Manager",
      team: "Finance",
      status: "pending",
      age: "33",
      avatar: "https://i.pravatar.cc/150?img=4",
      email: "frank.harrison@example.com",
    },
    {
      id: 10,
      name: "Emma Adams",
      role: "Ops Manager",
      team: "Operations",
      status: "approved",
      age: "35",
      avatar: "https://i.pravatar.cc/150?img=5",
      email: "emma.adams@example.com",
    },
    {
      id: 11,
      name: "Brandon Stevens",
      role: "Jr. Dev",
      team: "Development",
      status: "approved",
      age: "22",
      avatar: "https://i.pravatar.cc/150?img=8",
      email: "brandon.stevens@example.com",
    },
    {
      id: 12,
      name: "Megan Richards",
      role: "P. Manager",
      team: "Product",
      status: "rejected",
      age: "28",
      avatar: "https://i.pravatar.cc/150?img=10",
      email: "megan.richards@example.com",
    },
    {
      id: 13,
      name: "Oliver Scott",
      role: "S. Manager",
      team: "Security",
      status: "approved",
      age: "37",
      avatar: "https://i.pravatar.cc/150?img=12",
      email: "oliver.scott@example.com",
    },
    {
      id: 14,
      name: "Grace Allen",
      role: "M. Specialist",
      team: "Marketing",
      status: "approved",
      age: "30",
      avatar: "https://i.pravatar.cc/150?img=16",
      email: "grace.allen@example.com",
    },
    {
      id: 15,
      name: "Noah Carter",
      role: "IT Specialist",
      team: "I. Technology",
      status: "rejected",
      age: "31",
      avatar: "https://i.pravatar.cc/150?img=15",
      email: "noah.carter@example.com",
    },
    {
      id: 16,
      name: "Ava Perez",
      role: "Manager",
      team: "Sales",
      status: "approved",
      age: "29",
      avatar: "https://i.pravatar.cc/150?img=20",
      email: "ava.perez@example.com",
    },
    {
      id: 17,
      name: "Liam Johnson",
      role: "Data Analyst",
      team: "Analysis",
      status: "approved",
      age: "28",
      avatar: "https://i.pravatar.cc/150?img=33",
      email: "liam.johnson@example.com",
    },
    {
      id: 18,
      name: "Sophia Taylor",
      role: "QA Analyst",
      team: "Testing",
      status: "approved",
      age: "27",
      avatar: "https://i.pravatar.cc/150?img=29",
      email: "sophia.taylor@example.com",
    },
    {
      id: 19,
      name: "Lucas Harris",
      role: "Administrator",
      team: "Information Technology",
      status: "rejected",
      age: "32",
      avatar: "https://i.pravatar.cc/150?img=50",
      email: "lucas.harris@example.com",
    },
    {
      id: 20,
      name: "Mia Robinson",
      role: "Coordinator",
      team: "Operations",
      status: "approved",
      age: "26",
      avatar: "https://i.pravatar.cc/150?img=45",
      email: "mia.robinson@example.com",
    },
  ];
  
  export {columns, users, statusOptions};

  const requestData = async () => {
    try {
      const response = await axios.get('http://localhost:5003/requests/staff/140004');
      
      if (response.status === 200) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      } else {
        console.error("An error occurred:", error);
        return [];
      }
    }
  };

  const request_columns = [
    {name: "Request ID", uid: "request_id"},
    {name: "Arrangment Date", uid: "arrangement_date"},
    {name: "Request Date", uid: "request_id"},
    {name: "Timeslot", uid: "timeslot"},
    {name: "Status", uid: "status"},
    {name: "Manager", uid: "manager"},
    {name: "Actions", uid: "actions"}
  ];

  const pulled_data = {
    "code": 200,
    "data": [
      {
        "arrangement_date": "2024-10-01",
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
        "manager_id": 140894,
        "reason": "",
        "request_date": "2024-08-30",
        "request_id": 10,
        "staff_id": 140004,
        "status": "Pending",
        "timeslot": 3
      }
    ],
    "message": "Requests from staff 140004 found"
  };