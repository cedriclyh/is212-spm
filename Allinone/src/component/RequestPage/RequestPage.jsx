import React from 'react';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './RequestPage.css';
import './RequestTable'
import RequestTable from './RequestTable';

export default function RequestPage() {
  return (
    <div className="layout">
      <div className="sidebar">
        <Sidebar />
      </div>

      <div className="main-content">
        <div className="navbar">
          <Navbar />
        </div>

        <div className="page-content">
          <RequestTable />
        </div>
      </div>
</div>

  );
}
