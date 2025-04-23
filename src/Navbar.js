import React from 'react';
import { UilBars, UilSearch } from '@iconscout/react-unicons';

function Navbar({ toggleSidebar }) {
  return (
    <div className="top">
      <i className="uil uil-bars sidebar-toggle" onClick={toggleSidebar}></i>

      <div className="search-box">
        <i className="uil uil-search"></i>
        <input type="text" placeholder="Search here..." />
      </div>

      <img src="images/profile.jpg" alt="Profile" />
    </div>
  );
}

export default Navbar;
