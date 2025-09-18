import React from 'react';
import type { PrimaryTab, SecondaryTab } from '../App';

interface TabConfig {
  [key: string]: {
    label: string;
    icon: string; // Now a URL/path to image
    secondaryTabs: Array<{
      id: string;
      label: string;
    }>;
  };
}

interface NavigationTabsProps {
  tabConfig: TabConfig;
  primaryTab: PrimaryTab;
  secondaryTab: SecondaryTab;
  onPrimaryTabChange: (tab: PrimaryTab) => void;
  onSecondaryTabChange: (tab: SecondaryTab) => void;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({
  tabConfig,
  primaryTab,
  secondaryTab,
  onPrimaryTabChange,
  onSecondaryTabChange
}) => {
  return (
    <nav className="navigation">
      {/* Primary Navigation */}
      <div className="primary-tabs">
        {Object.entries(tabConfig).map(([key, config]) => (
          <button
            key={key}
            className={`primary-tab ${primaryTab === key ? 'active' : ''}`}
            onClick={() => onPrimaryTabChange(key as PrimaryTab)}
          >
            <img src={config.icon} alt={config.label} className="tab-icon" />
            <span className="tab-label">{config.label}</span>
          </button>
        ))}
      </div>

      {/* Secondary Navigation */}
      <div className="secondary-tabs">
        {tabConfig[primaryTab]?.secondaryTabs.map((tab) => (
          <button
            key={tab.id}
            className={`secondary-tab ${secondaryTab === tab.id ? 'active' : ''}`}
            onClick={() => onSecondaryTabChange(tab.id as SecondaryTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavigationTabs;
