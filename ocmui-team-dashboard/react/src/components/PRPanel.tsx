import React from 'react';
import { useMyCodeReviews, useMyPRs, useLastUpdatedFormat } from '../hooks/useApiQueries';
import { useSettings } from '../contexts/SettingsContext';
import PRCard from './PRCard';
import githubIcon from '../assets/githubIcon.png';

interface PRPanelProps {
  tabType: 'my-code-reviews' | 'my-prs';
  prStatus?: 'open' | 'closed';
  onPrStatusChange?: (status: 'open' | 'closed') => void;
}

const PRPanel: React.FC<PRPanelProps> = ({ tabType, prStatus = 'open', onPrStatusChange }) => {
  const { isConfigured } = useSettings();
  
  // Use the appropriate query based on tab type
  const codeReviewsQuery = useMyCodeReviews();
  const myPRsQuery = useMyPRs(prStatus);
  
  const query = tabType === 'my-code-reviews' ? codeReviewsQuery : myPRsQuery;
  const lastUpdated = useLastUpdatedFormat(query.dataUpdatedAt);
  
  const { data, isLoading, error } = query;

  const handlePRClick = (pr: any) => {
    // Could add PR selection logic here in the future
    console.log('PR clicked:', pr);
  };

  const getTitle = () => {
    return tabType === 'my-code-reviews' ? 'My Code Reviews' : 'My PRs';
  };

  const getUpdateInterval = () => {
    return tabType === 'my-code-reviews' ? '2 minutes' : '4 minutes';
  };

  const getEmptyMessage = () => {
    if (tabType === 'my-code-reviews') {
      return '✅ No PRs awaiting your review';
    }
    return `No ${prStatus} PRs found`;
  };

  const getLoadingMessage = () => {
    return tabType === 'my-code-reviews' ? 'Loading code reviews...' : 'Loading your PRs...';
  };

  const getErrorMessage = (error: Error) => {
    const type = tabType === 'my-code-reviews' ? 'code reviews' : 'your PRs';
    return `❌ Error loading ${type}: ${error.message}`;
  };

  return (
    <div className="panel-content">
      <div className="panel-header">
        <h3><img src={githubIcon} alt="GitHub" className="panel-icon" /> {getTitle()}</h3>
        {tabType === 'my-prs' && onPrStatusChange && (
          <div className="pr-status-toggle">
            <label>
              <input 
                type="radio" 
                name="pr-status" 
                value="open" 
                checked={prStatus === 'open'}
                onChange={() => onPrStatusChange('open')}
              /> 
              Open
            </label>
            <label>
              <input 
                type="radio" 
                name="pr-status" 
                value="closed" 
                checked={prStatus === 'closed'}
                onChange={() => onPrStatusChange('closed')}
              /> 
              Closed
            </label>
          </div>
        )}
        {tabType === 'my-code-reviews' && (
          <span className="last-updated">Last Updated: {lastUpdated} • updates every {getUpdateInterval()}</span>
        )}
      </div>
      
      {tabType === 'my-prs' && (
        <div className="last-updated-row">
          <span className="last-updated">Last Updated: {lastUpdated} • updates every {getUpdateInterval()}</span>
        </div>
      )}
      
      <div className="panel-body">
        {!isConfigured ? (
          <div className="empty-state">
            <p>⚙️ Configure GitHub and JIRA tokens in Settings to view data</p>
          </div>
        ) : isLoading ? (
          <div className="loading-state">
            <p>🔍 {getLoadingMessage()}</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{getErrorMessage(error)}</p>
          </div>
        ) : data?.pullRequests.length ? (
          <div className="pr-cards-container">
            {data.pullRequests.map((pr) => (
              <PRCard 
                key={pr.id} 
                pr={pr} 
                onClick={handlePRClick} 
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p><img src={githubIcon} alt="GitHub" className="inline-icon" /> {getEmptyMessage()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PRPanel;
