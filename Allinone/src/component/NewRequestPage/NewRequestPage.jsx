import React from 'react';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './NewRequestPage.css';
import NewRequest from './NewRequest';

export default function NewRequestPage() {
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
          <NewRequest />
        </div>
      </div>
</div>

  );
}
