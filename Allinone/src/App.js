import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout'; // Import Layout
import CalenderView from './component/CalendarView/CalendarView';
import Login from './component/Login/login';
import RequestTable from './component/RequestPage/RequestTable';
import NewRequest from './component/NewRequestPage/NewRequest';
import TeamRequest from './component/TeamRequest/TeamRequest';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          element={<Layout />}
        >
          <Route path="/" element={< CalenderView />} />
          <Route path="/requests" element={< RequestTable />} />
          <Route path="/new_request" element={< NewRequest />} />
          <Route path="/team_request" element={< TeamRequest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
