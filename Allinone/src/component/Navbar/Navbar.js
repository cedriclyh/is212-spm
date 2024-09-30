import React, { useState } from "react";
import { Link, useMatch, useResolvedPath } from "react-router-dom";
import "./Navbar.css";

// icons
// import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';  
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material"; // MUI button for the icons

export default function Navbar() {
    const [isSidebarOpen, setisSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setisSidebarOpen(!isSidebarOpen);
    }

    return (
    <nav className="nav"> 
        
        
        <div className="navbar-container">
            <IconButton onClick={toggleSidebar} className="hamburger">
                {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
            <Link to="/" className="site-title">Allinone</Link>
        </div>
        
        <ul>
           <CustomLink to="/search">
                <SearchIcon />
            </CustomLink>

            <li>
                <NotificationsIcon />
            </li>
        
            <li>
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
            </li>
        </ul>
    </nav>
    )
}

function CustomLink({ to, children, ...props}) {
    const resolvedPath = useResolvedPath(to)
    const isActive = useMatch({ path: resolvedPath.pathname, end: true })
    return (
        <li className={isActive ? "active" : ""}>
            <Link to={to} {...props}>
                {children}
            </Link>
        </li>
    )
}