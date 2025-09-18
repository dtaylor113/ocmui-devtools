import { useState } from 'react';
import { QueryProvider } from './contexts/QueryProvider';
import { SettingsProvider } from './contexts/SettingsContext';
import Header from './components/Header';
import NavigationTabs from './components/NavigationTabs';
import SplitPanel from './components/SplitPanel';
import SettingsModal from './components/SettingsModal';
import jiraLogo from './assets/jiraLogo.png';
import githubIcon from './assets/githubIcon.png';
import './styles/App.css';

// Define our main navigation structure
export type PrimaryTab = 'jira' | 'github';
export type SecondaryTab = 'my-sprint-jiras' | 'jira-lookup' | 'my-code-reviews' | 'my-prs';

interface AppState {
  primaryTab: PrimaryTab;
  secondaryTab: SecondaryTab;
}

const tabConfig = {
  jira: {
    label: 'JIRA',
    icon: jiraLogo,
    secondaryTabs: [
      { id: 'my-sprint-jiras', label: 'My Sprint JIRAs' },
      { id: 'jira-lookup', label: 'JIRA Lookup' }
    ]
  },
  github: {
    label: 'GitHub', 
    icon: githubIcon,
    secondaryTabs: [
      { id: 'my-code-reviews', label: 'My Code Reviews' },
      { id: 'my-prs', label: 'My PRs' }
    ]
  }
};

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    primaryTab: 'jira',
    secondaryTab: 'my-sprint-jiras'
  });

  const handlePrimaryTabChange = (tab: PrimaryTab) => {
    // Auto-select first secondary tab when switching primary tabs
    const firstSecondaryTab = tabConfig[tab].secondaryTabs[0].id as SecondaryTab;
    setAppState({
      primaryTab: tab,
      secondaryTab: firstSecondaryTab
    });
  };

  const handleSecondaryTabChange = (tab: SecondaryTab) => {
    setAppState(prev => ({
      ...prev,
      secondaryTab: tab
    }));
  };

  return (
    <QueryProvider>
      <SettingsProvider>
        <div className="app">
          <Header />
          
          <NavigationTabs
            tabConfig={tabConfig}
            primaryTab={appState.primaryTab}
            secondaryTab={appState.secondaryTab}
            onPrimaryTabChange={handlePrimaryTabChange}
            onSecondaryTabChange={handleSecondaryTabChange}
          />
          
          <SplitPanel
            primaryTab={appState.primaryTab}
            secondaryTab={appState.secondaryTab}
          />
          
          <SettingsModal />
        </div>
      </SettingsProvider>
    </QueryProvider>
  );
}
