import React, { useState, useCallback } from 'react';
import type { PrimaryTab, SecondaryTab } from '../App';
import jiraLogo from '../assets/jiraLogo.png';
import githubIcon from '../assets/githubIcon.png';

interface SplitPanelProps {
  primaryTab: PrimaryTab;
  secondaryTab: SecondaryTab;
}

const SplitPanel: React.FC<SplitPanelProps> = ({ primaryTab, secondaryTab }) => {
  const [leftWidth, setLeftWidth] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);

  // Debug: Check if icons are loading
  console.log('SplitPanel - jiraLogo:', jiraLogo);
  console.log('SplitPanel - githubIcon:', githubIcon);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Constrain between 20% and 80%
    const constrainedWidth = Math.min(Math.max(newLeftWidth, 20), 80);
    setLeftWidth(constrainedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Get content for current tab combination
  const getLeftPanelContent = () => {
    if (primaryTab === 'jira' && secondaryTab === 'my-sprint-jiras') {
      return (
        <div className="panel-content">
          <div className="panel-header">
            <h3><img src={jiraLogo} alt="JIRA" className="panel-icon" /> My Sprint JIRAs</h3>
            <span className="last-updated">Last Updated: 1s ago</span>
          </div>
          <div className="content-placeholder">
            <p><img src={jiraLogo} alt="JIRA" className="inline-icon" /> JIRA tickets assigned to you in active sprints will appear here</p>
            <div className="placeholder-box">
              <div className="placeholder-item">OCMUI-2460: ROSA and OSD wizards...</div>
              <div className="placeholder-item">OCMUI-3196: Consolidate all access.redhat.com links...</div>
              <div className="placeholder-item">OCMUI-3744: Move support and doc links...</div>
            </div>
          </div>
        </div>
      );
    }

    if (primaryTab === 'jira' && secondaryTab === 'jira-lookup') {
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
    }

    if (primaryTab === 'github' && secondaryTab === 'my-code-reviews') {
      return (
        <div className="panel-content">
          <div className="panel-header">
            <h3><img src={githubIcon} alt="GitHub" className="panel-icon" /> My Code Reviews</h3>
            <span className="last-updated">Last Updated: 1s ago</span>
          </div>
          <div className="content-placeholder">
            <p>PRs awaiting your review will appear here</p>
          </div>
        </div>
      );
    }

    if (primaryTab === 'github' && secondaryTab === 'my-prs') {
      return (
        <div className="panel-content">
          <div className="panel-header">
            <h3><img src={githubIcon} alt="GitHub" className="panel-icon" /> My PRs</h3>
            <div className="pr-status-toggle">
              <label><input type="radio" name="pr-status" value="open" defaultChecked /> Open</label>
              <label><input type="radio" name="pr-status" value="closed" /> Closed</label>
            </div>
          </div>
          <div className="content-placeholder">
            <p>Your pull requests will appear here</p>
          </div>
        </div>
      );
    }

    return <div className="content-placeholder">Select a tab to view content</div>;
  };

  const getRightPanelContent = () => {
    if (primaryTab === 'jira') {
      return (
        <div className="panel-content">
          <div className="panel-header">
            <h3><img src={githubIcon} alt="GitHub" className="panel-icon" /> Associated PRs</h3>
          </div>
          <div className="content-placeholder">
            <p>Click on a JIRA ticket to see related PRs</p>
          </div>
        </div>
      );
    }

    if (primaryTab === 'github') {
      return (
        <div className="panel-content">
          <div className="panel-header">
            <h3><img src={jiraLogo} alt="JIRA" className="panel-icon" /> Associated JIRAs</h3>
          </div>
          <div className="content-placeholder">
            <p>Click on a PR to see related JIRA tickets</p>
          </div>
        </div>
      );
    }

    return <div className="content-placeholder">Right panel content</div>;
  };

  return (
    <div 
      className={`split-panel ${isDragging ? 'dragging' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left Panel */}
      <div 
        className="panel left-panel"
        style={{ width: `${leftWidth}%` }}
      >
        {getLeftPanelContent()}
      </div>

      {/* Resize Handle */}
      <div 
        className="resize-handle"
        onMouseDown={handleMouseDown}
      >
        <div className="resize-handle-line"></div>
      </div>

      {/* Right Panel */}
      <div 
        className="panel right-panel"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {getRightPanelContent()}
      </div>
    </div>
  );
};

export default SplitPanel;
