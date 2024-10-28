import React from 'react';
import Navbar from './component/Navbar/Navbar';
import Sidebar from './component/Sidebar/Sidebar';
import { Outlet } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
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
          <Outlet /> {/* This renders the routed content */}
        </div>
      </div>
    </div>
  );
};

export default Layout;
