import React from 'react';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './TeamRequestPage.css';
import TeamRequestTable from './TeamRequest';


export default function TeamRequestPage() {
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
          <TeamRequestTable />
        </div>
      </div>
</div>

  );
}
