import React from 'react';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './RequestPage.css';
import './RequestTable'
import RequestTable from './RequestTable';

export default function RequestPage() {
  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="page-content">
          <RequestTable />
        </div>
      </div>
    </div>
  );
}
