import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import NavigationTabs from './NavigationTabs';
import type { TabType } from '../App';
import ocmuiLogo from '../assets/icon48.png';

interface HeaderProps {
  tabConfig: Array<{
    id: TabType;
    label: string;
    icon: string;
  }>;
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Header: React.FC<HeaderProps> = ({ tabConfig, currentTab, onTabChange }) => {
  const { openSettingsModal, isConfigured } = useSettings();

  return (
    <div className="header">
      <div className="header-left">
        <div className="logo">
          <img src={ocmuiLogo} alt="OCMUI Logo" className="logo-icon" />
          <h1 className="logo-text">My OCMUI Dashboard</h1>
        </div>
      </div>
      
      <div className="header-center">
        <NavigationTabs
          tabConfig={tabConfig}
          currentTab={currentTab}
          onTabChange={onTabChange}
        />
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
