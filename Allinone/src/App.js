import './App.css';
import React from "react";
import { BrowserRouter, Routes, Route  } from 'react-router-dom';
import CalenderView from './component/CalendarView'
import Login from './component/login'
import RequestPage  from './component/RequestPage/RequestPage';
import Navbar from './component/Navbar/Navbar';


const App = () => {
  return(
    <BrowserRouter>
      <Navbar />
      <Routes>
          <Route path="/" element={ <CalenderView /> } /> {/* Default path */}
          <Route path="/login" element={ <Login /> } />
          {/* <Route path="/manager-data" component={ Manager-Data } /> */}
          <Route path="/requests" element={ <RequestPage /> } />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
