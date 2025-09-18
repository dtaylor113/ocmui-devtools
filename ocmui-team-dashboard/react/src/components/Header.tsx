import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import ocmuiLogo from '../assets/icon48.png';

const Header: React.FC = () => {
  const { openSettingsModal, isConfigured } = useSettings();

  return (
    <div className="header">
      <div className="header-left">
        <div className="logo">
          <img src={ocmuiLogo} alt="OCMUI Logo" className="logo-icon" />
          <h1 className="logo-text">OCMUI Team Dashboard</h1>
        </div>
      </div>
      
      <div className="header-right">
        <button 
          className={`settings-btn ${!isConfigured ? 'settings-alert-active' : ''}`}
          title="Settings"
          onClick={openSettingsModal}
        >
          ⚙️
          {!isConfigured && <span className="settings-alert">!</span>}
        </button>
        <button className="timeboard-btn" title="Timeboard">
          🕒
        </button>
      </div>
    </div>
  );
};

export default Header;
