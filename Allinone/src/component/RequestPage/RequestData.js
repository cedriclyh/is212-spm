const columns = [
  { name: "ARRANGEMENT DATE", uid: "arrangement_date", sortable: true },
  { name: "REQUEST ID", uid: "request_id", sortable: true },
  { name: "REQUEST DATE", uid: "request_date", sortable: true },
  { name: "TIMESLOT", uid: "timeslot" },
  { name: "STATUS", uid: "status", sortable: true },
  { name: "MANAGER", uid: "manager" },
  { name: "RECURRING", uid: "is_recurring" },
  { name: "ACTIONS", uid: "actions" },
];

const statusOptions = [
  { name: "approved", uid: "Approved" },
  { name: "rejected", uid: "Rejected" },
  { name: "pending", uid: "Pending" },
  { name: "withdrawn", uid: "Withdrawn" },
  { name: "cancelled", uid: "Cancelled" },
];

export { columns, statusOptions };
