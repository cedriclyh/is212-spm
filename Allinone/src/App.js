import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout'; // Import Layout
import StaffView from './component/CalendarView/StaffView'
import ManagerView from './component/CalendarView/ManagerView'
import HRView from './component/CalendarView/HRView'
import DirectorView from './component/CalendarView/DirectorView';
import Login from './component/Login/login';
import RequestTable from './component/RequestPage/RequestTable';
import NewRequest from './component/NewRequestPage/NewRequest';
import TeamRequest from './component/TeamRequest/TeamRequest';
import EditRequestPage from './component/EditRequestPage/EditRequest';
import ViewRequest from './component/ViewRequest/ViewRequest';
import AvailabilityTable from './component/CalendarView/Dashboard';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          element={<Layout />}
        >
          <Route path="/requests" element={< RequestTable />} />
          <Route path="/new_request" element={< NewRequest />} />
          <Route path="/team_request" element={< TeamRequest />} />
          <Route path="/edit_request/:uid" element={<EditRequestPage />} />
          {/* <Route path="/" element={ <HRView /> } /> Default path dept = 'HR' or 'CEO' */}
          <Route path="/director" element={ <DirectorView /> } /> {/* Default path */} {/* role num = 1*/}
          <Route path="/staff" element={ <StaffView /> } /> {/* role num = 2*/}
          <Route path="/manager" element={ <ManagerView /> } /> {/* role num = 3*/}
          <Route path="/login" element={ <Login /> } />
          <Route path="/tabletest" element={ <AvailabilityTable /> } /> {/* role num = 4*/}
          {/* <Route path="/manager-data" component={ Manager-Data } /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
