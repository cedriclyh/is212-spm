import React from "react";

import * as FaIcons from "react-icons/fa";
import * as IoIcons from "react-icons/io";

export const SidebarData = [
  {
    title: "Calendar",
    path: "/",
    icon: <FaIcons.FaRegCalendarAlt />,
    cName: "nav-text"
  },
  {
    title: "Requests",
    path: "/reports",
    icon: <FaIcons.FaTable />,
    cName: "nav-text"
  },
  {
    title: "Users",
    path: "/products",
    icon: <FaIcons.FaUsers />,
    cName: "nav-text"
  },
  {
    title: "Settings",
    path: "/team",
    icon: <IoIcons.IoMdSettings />,
    cName: "nav-text"
  },
  {
    title: "Availability",
    path: "/",
    icon: <FaIcons.FaLocation />,
    cName: "nav-text"
  },
];