import React from 'react';
import ocmuiLogo from '../assets/icon48.png';

const Header: React.FC = () => {
  return (
    <div className="header">
      <div className="header-left">
        <div className="logo">
          <img src={ocmuiLogo} alt="OCMUI Logo" className="logo-icon" />
          <h1 className="logo-text">OCMUI Team Dashboard</h1>
        </div>
      </div>
      
      <div className="header-right">
        <button className="settings-btn" title="Settings">
          ⚙️
        </button>
        <button className="timeboard-btn" title="Timeboard">
          🕒
        </button>
      </div>
    </div>
  );
};

export default Header;
