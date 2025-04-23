import React from 'react';
import { UilEstate, UilFilesLandscapes, UilChart, UilThumbsUp, UilComments, UilShare, UilSignout, UilMoon } from '@iconscout/react-unicons';

function Sidebar({ isOpen }) {
  return (
    <nav className={isOpen ? '' : 'close'}>
      <div className="logo-name">
        <div className="logo-image">
          <img src="images/logo.png" alt="Logo" />
        </div>
        <span className="logo_name">CodingLab</span>
      </div>

      <div className="menu-items">
        <ul className="nav-links">
          <li><a href="#"><UilEstate /> <span className="link-name">Dashboard</span></a></li>
          <li><a href="#"> <span className="link-name">Content</span></a></li>
         
        </ul>

        <ul className="logout-mode">
          <li><a href="#"><UilSignout /> <span className="link-name">Logout</span></a></li>
          <li className="mode">
            <a href="#"><UilMoon /> <span className="link-name">Dark Mode</span></a>
            <div className="mode-toggle">
              <span className="switch"></span>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Sidebar;
