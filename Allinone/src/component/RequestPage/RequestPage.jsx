// RequestPage.jsx
import React from "react";
import Navbar from '../Navbar/Navbar'
import RequestTable from "./RequestTable"; // Assuming RequestTable is another component

export default function RequestPage() {
  return (
    <div>
      <Navbar />
      <br></br>
      <div className="container mx-auto">
        <RequestTable />
      </div>
      
    </div>
  );
}
