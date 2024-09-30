import './App.css';
import React from "react";
import { BrowserRouter, Routes, Route  } from 'react-router-dom';
import CalenderView from './component/CalendarView'
import Login from './component/login'
import NavBar from './component/NavBar'

const App = () => {
  return(
    <BrowserRouter>
      <NavBar />
      <Routes>
          <Route path="/" element={ <CalenderView /> } /> {/* Default path */}
          <Route path="/login" element={ <Login /> } />
          {/* <Route path="/manager-data" component={ Manager-Data } /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App;
