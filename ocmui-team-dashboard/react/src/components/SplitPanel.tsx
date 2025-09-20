import React, { useState, useCallback, useEffect } from 'react';
import type { PrimaryTab, SecondaryTab } from '../App';
import JiraPanel from './JiraPanel';
import PRPanel from './PRPanel';
import AssociatedPRsPanel from './AssociatedPRsPanel';
import EmptyState from './EmptyState';
import JiraLookupPlaceholderPanel from './JiraLookupPlaceholderPanel';
import AssociatedJirasPanel from './AssociatedJirasPanel';

interface SplitPanelProps {
  primaryTab: PrimaryTab;
  secondaryTab: SecondaryTab;
}

const SplitPanel: React.FC<SplitPanelProps> = ({ primaryTab, secondaryTab }) => {
  const [leftWidth, setLeftWidth] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const [prStatus, setPrStatus] = useState<'open' | 'closed'>('open');
  const [selectedTicket, setSelectedTicket] = useState<string | undefined>();
  const [selectedPR, setSelectedPR] = useState<any | undefined>();
  const [invalidJiraIds, setInvalidJiraIds] = useState<string[]>([]);

  const handleTicketSelect = (ticketKey: string) => {
    setSelectedTicket(ticketKey);
  };

  const handlePRSelect = (pr: any) => {
    console.log(`🔥 SplitPanel: PR selected #${pr.number}: ${pr.title}`);
    setSelectedPR(pr);
    setInvalidJiraIds([]); // Clear invalid JIRA IDs when selecting new PR
  };

  const handleInvalidJiraIds = (invalidIds: string[]) => {
    console.log(`⚠️ SplitPanel: Invalid JIRA IDs detected:`, invalidIds);
    setInvalidJiraIds(invalidIds);
  };

  // Clear selected PR when switching between GitHub tabs
  useEffect(() => {
    if (primaryTab === 'github') {
      setSelectedPR(undefined);
      setInvalidJiraIds([]); // Clear invalid JIRA IDs when switching tabs
    }
  }, [primaryTab, secondaryTab]);

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
      return <JiraPanel onTicketSelect={handleTicketSelect} selectedTicket={selectedTicket} />;
    }

    if (primaryTab === 'jira' && secondaryTab === 'jira-lookup') {
      return <JiraLookupPlaceholderPanel />;
    }

    if (primaryTab === 'github' && secondaryTab === 'my-code-reviews') {
      return <PRPanel tabType="my-code-reviews" onPRSelect={handlePRSelect} selectedPR={selectedPR} invalidJiraIds={invalidJiraIds} />;
    }

    if (primaryTab === 'github' && secondaryTab === 'my-prs') {
      return (
        <PRPanel 
          tabType="my-prs" 
          prStatus={prStatus} 
          onPrStatusChange={setPrStatus} 
          onPRSelect={handlePRSelect}
          selectedPR={selectedPR}
          invalidJiraIds={invalidJiraIds}
        />
      );
    }

    return <EmptyState message="Select a tab to view content" />;
  };

  const getRightPanelContent = () => {
    if (primaryTab === 'jira') {
      return <AssociatedPRsPanel selectedTicket={selectedTicket} />;
    }

    if (primaryTab === 'github') {
      return <AssociatedJirasPanel selectedPR={selectedPR} onInvalidJiraIds={handleInvalidJiraIds} />;
    }

    return <EmptyState message="Right panel content" />;
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
