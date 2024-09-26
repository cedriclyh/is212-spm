import './App.css';
import { BrowserRouter, Routes, Route  } from 'react-router-dom';
import CalenderView from './component/CalendarView'
import Login from './component/login'

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">

        
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//         <br></br>
//         </a>
//       </header>
//     </div>
//   );
// }

const App = () => {
  return(
    <BrowserRouter>
      <Routes>
          <Route path="/" element={ <CalenderView /> } /> {/* Default path */}
          <Route path="/login" element={ <Login /> } />
          {/* <Route path="/manager-data" component={ Manager-Data } /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App;
