import './App.css';
import React from "react";
import { BrowserRouter, Routes, Route  } from 'react-router-dom';
import CalenderView from './component/CalendarView/CalendarView'
import Login from './component/login'
import RequestPage  from './component/RequestPage/RequestPage';
import Sidebar from './component/Sidebar/Sidebar';



const App = () => {
  return(
    <BrowserRouter>
      <Routes>
          <Route path="/" element={ <CalenderView /> } /> {/* Default path */}
          <Route path="/login" element={ <Login /> } />
          {/* <Route path="/manager-data" component={ Manager-Data } /> */}
          <Route path="/requests" element={ <RequestPage /> } />
          <Route path="/test" element={ <Sidebar /> } />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
