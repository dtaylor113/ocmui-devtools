import React from 'react';
import { useMySprintJiras, useLastUpdatedFormat } from '../hooks/useApiQueries';
import { useSettings } from '../contexts/SettingsContext';
import JiraCard from './JiraCard';
import jiraLogo from '../assets/jiraLogo.png';

interface JiraPanelProps {
  onTicketSelect?: (ticketKey: string) => void;
}

const JiraPanel: React.FC<JiraPanelProps> = ({ onTicketSelect }) => {
  const { isConfigured } = useSettings();
  const sprintJirasQuery = useMySprintJiras();
  const { data, isLoading, error } = sprintJirasQuery;
  const lastUpdated = useLastUpdatedFormat(sprintJirasQuery.dataUpdatedAt);

  const handleTicketClick = (ticket: any) => {
    if (onTicketSelect) {
      onTicketSelect(ticket.key);
    }
  };

  return (
    <div className="panel-content">
      <div className="panel-header">
        <h3><img src={jiraLogo} alt="JIRA" className="panel-icon" /> My Sprint JIRAs</h3>
        <span className="last-updated">Last Updated: {lastUpdated} • updates every 5 minutes</span>
      </div>
      
      <div className="panel-body">
        {!isConfigured ? (
          <div className="empty-state">
            <p>⚙️ Configure GitHub and JIRA tokens in Settings to view data</p>
          </div>
        ) : isLoading ? (
          <div className="loading-state">
            <p>🔍 Loading sprint JIRAs...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ Error loading sprint JIRAs: {error.message}</p>
          </div>
        ) : data?.tickets.length ? (
          <div className="jira-cards-container">
            {data.tickets.map((ticket) => (
              <JiraCard
                key={ticket.key}
                ticket={ticket}
                onClick={handleTicketClick}
              />
            ))}
            {data.sprintName && (
              <div className="sprint-info">
                🎯 Sprint: {data.sprintName} ({data.tickets.length} tickets)
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p><img src={jiraLogo} alt="JIRA" className="inline-icon" /> No JIRA tickets found in active sprints</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JiraPanel;
