import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ApiTokens } from '../types/settings';

interface SettingsContextType {
  apiTokens: ApiTokens;
  isSettingsModalOpen: boolean;
  isConfigured: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  saveSettings: (tokens: ApiTokens) => void;
  testGithubToken: (token: string) => Promise<{ success: boolean; message: string }>;
  testJiraToken: (token: string) => Promise<{ success: boolean; message: string }>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [apiTokens, setApiTokens] = useState<ApiTokens>({
    github: '',
    githubUsername: '',
    jira: '',
    jiraUsername: ''
  });
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Check if all required tokens are configured
  const isConfigured = !!(apiTokens.github && 
                         apiTokens.githubUsername && 
                         apiTokens.jira && 
                         apiTokens.jiraUsername);

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettingsFromStorage();
  }, []);

  const loadSettingsFromStorage = () => {
    try {
      const stored = localStorage.getItem('ocmui_api_tokens');
      if (stored) {
        const parsedTokens = JSON.parse(stored);
        setApiTokens(prev => ({ ...prev, ...parsedTokens }));
        console.log('📱 Settings loaded from localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    }
  };

  const saveSettingsToStorage = (tokens: ApiTokens) => {
    try {
      localStorage.setItem('ocmui_api_tokens', JSON.stringify(tokens));
      console.log('💾 Settings saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    }
  };

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const saveSettings = (newTokens: ApiTokens) => {
    setApiTokens(newTokens);
    saveSettingsToStorage(newTokens);
    closeSettingsModal();
    console.log('✅ Settings saved successfully');
  };

  const testGithubToken = async (token: string): Promise<{ success: boolean; message: string }> => {
    if (!token) {
      return { success: false, message: 'Token is required' };
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        return { success: true, message: `Connected as ${userData.login}` };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message || 'Invalid token' };
      }
    } catch (error) {
      console.error('GitHub token test error:', error);
      return { success: false, message: 'Network error or invalid token' };
    }
  };

  const testJiraToken = async (token: string): Promise<{ success: boolean; message: string }> => {
    if (!token) {
      return { success: false, message: 'Token is required' };
    }

    try {
      // Try to connect to the legacy app's backend server for JIRA testing
      const response = await fetch('http://localhost:3017/api/test-jira', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return { success: true, message: 'JIRA connection successful' };
        } else {
          return { success: false, message: result.error || 'Authentication failed' };
        }
      } else {
        return { success: false, message: 'Server error - please try again' };
      }
    } catch (error) {
      console.error('JIRA token test error:', error);
      return { success: false, message: 'Backend server not running - start legacy app for JIRA testing' };
    }
  };

  const value: SettingsContextType = {
    apiTokens,
    isSettingsModalOpen,
    isConfigured,
    openSettingsModal,
    closeSettingsModal,
    saveSettings,
    testGithubToken,
    testJiraToken
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
