// RequestPage.jsx
import React from "react";
import Navbar from '../Navbar'
import RequestTable from "./RequestTable"; // Assuming RequestTable is another component

export default function RequestPage() {
  return (
    <div>
        <Navbar />
      <h1>Requests</h1>
      <RequestTable />
    </div>
  );
}
