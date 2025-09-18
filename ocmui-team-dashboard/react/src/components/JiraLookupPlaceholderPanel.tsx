import React from 'react';
import jiraLogo from '../assets/jiraLogo.png';

const JiraLookupPlaceholderPanel: React.FC = () => {
  return (
    <div className="panel-content">
      <div className="panel-header">
        <h3><img src={jiraLogo} alt="JIRA" className="panel-icon" /> JIRA Lookup</h3>
      </div>
      <div className="content-placeholder">
        <p>Enter a JIRA ID to view ticket details</p>
        <input 
          type="text" 
          placeholder="e.g. OCMUI-1234" 
          className="jira-search-input"
        />
      </div>
    </div>
  );
};

export default JiraLookupPlaceholderPanel;
