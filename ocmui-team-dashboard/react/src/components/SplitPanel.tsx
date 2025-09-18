import React, { useState, useCallback } from 'react';
import type { PrimaryTab, SecondaryTab } from '../App';
import jiraLogo from '../assets/jiraLogo.png';
import JiraPanel from './JiraPanel';
import PRPanel from './PRPanel';
import AssociatedPRsPanel from './AssociatedPRsPanel';

interface SplitPanelProps {
  primaryTab: PrimaryTab;
  secondaryTab: SecondaryTab;
}

const SplitPanel: React.FC<SplitPanelProps> = ({ primaryTab, secondaryTab }) => {
  const [leftWidth, setLeftWidth] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const [prStatus, setPrStatus] = useState<'open' | 'closed'>('open');
  const [selectedTicket, setSelectedTicket] = useState<string | undefined>();

  const handleTicketSelect = (ticketKey: string) => {
    setSelectedTicket(ticketKey);
  };

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
      return <JiraPanel onTicketSelect={handleTicketSelect} />;
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
      return <PRPanel tabType="my-code-reviews" />;
    }

    if (primaryTab === 'github' && secondaryTab === 'my-prs') {
      return (
        <PRPanel 
          tabType="my-prs" 
          prStatus={prStatus} 
          onPrStatusChange={setPrStatus} 
        />
      );
    }

    return <div className="content-placeholder">Select a tab to view content</div>;
  };

  const getRightPanelContent = () => {
    if (primaryTab === 'jira') {
      return <AssociatedPRsPanel selectedTicket={selectedTicket} />;
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
