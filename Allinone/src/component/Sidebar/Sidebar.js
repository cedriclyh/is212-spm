import React, { useState } from "react";
import './Sidebar'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import MenuIcon from '@mui/icons-material/Menu';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to toggle sidebar expansion
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside className={`flex flex-col h-screen px-1 py-8 bg-white border-r border-gray-300 dark:bg-gray-900 dark:border-gray-700 transition-width duration-300 shadow-lg ${isExpanded ? "w-32" : "w-16"}`}>
      
      {/* Toggle Button */}
      <div className="flex justify-between pb-2 -mx-3 space-y-3 mt-2">
        <button onClick={toggleSidebar} className="text-gray-600 dark:text-gray-300 hover:text-gray-700 px-3 py-2 mt-1">
          <MenuIcon />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col justify-between flex-1 mt-2">
        <nav className="-mx-3 space-y-3">
          {/* Calendar Link */}
          <a href="/" className="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700" title="Calendar">
            <CalendarMonthOutlinedIcon />
            {isExpanded && <span className="mx-2 ml-1 text-xxs font-medium"> Calendar</span>}
          </a>

          {/* New Request Link */}
          <a href="/new_request" className="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 mt-1" title="New Request">
            <NoteAddOutlinedIcon />
            {isExpanded && <span className="mx-2 ml-1 text-xxs font-medium"> New Request</span>}
          </a>

          {/* My Requests Link */}
          <a href="/requests" className="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 mt-1" title="My Requests">
            <TaskOutlinedIcon />
            {isExpanded && <span className="mx-2 ml-1 text-xxs font-medium"> My Requests</span>}
          </a>

          {/* Team Requests Link */}
          <a href="/team_request" className="flex items-center px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 mt-1" title="Team Requests">
            <PeopleAltOutlinedIcon />
            {isExpanded && <span className="mx-2 ml-1 text-xxs font-medium"> Team Requests</span>}
          </a>
        </nav>
      </div>
    </aside>
  );
}
