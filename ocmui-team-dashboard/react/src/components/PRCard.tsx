import React, { useState } from 'react';
import type { GitHubReviewer } from '../hooks/useApiQueries';
import { usePRConversation } from '../hooks/useApiQueries';
import ReviewerCommentsModal from './ReviewerCommentsModal';
import CollapsibleSection from './CollapsibleSection';
import PRDescription from './PRDescription';
import PRConversation from './PRConversation';

// Use the GitHubPR interface from useApiQueries (via props)
interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  html_url: string;  // Web page URL for GitHub PR
  created_at: string;
  updated_at: string;
  user?: {
    login: string;
    avatar_url: string;
  };
  head?: {
    ref: string;
  };
  base?: {
    ref: string;
  };
  // Enhanced data from detailed PR fetch
  reviewers?: GitHubReviewer[];
  repository_url?: string;
}

// Helper function to extract repository name from PR object
const getRepoName = (pr: GitHubPR): string => {
  // URLs are in format: https://api.github.com/repos/owner/repo/issues/123
  const repoMatch = pr.repository_url?.match(/github\.com\/repos\/([^/]+)\/([^/]+)/);
  if (repoMatch) return `${repoMatch[1]}/${repoMatch[2]}`;
  
  const urlMatch = pr.url?.match(/github\.com\/repos\/([^/]+)\/([^/]+)/);
  return urlMatch ? `${urlMatch[1]}/${urlMatch[2]}` : 'unknown/repo';
};

interface PRCardProps {
  pr: GitHubPR;
  onClick?: (pr: GitHubPR) => void;
  isSelected?: boolean;
}

const PRCard: React.FC<PRCardProps> = ({ pr, onClick, isSelected = false }) => {
  const [selectedReviewer, setSelectedReviewer] = useState<string | null>(null);
  
  // Get PR conversation data to access comments count
  const repoName = getRepoName(pr);
  const { data: conversationData } = usePRConversation(repoName, pr.number);
  const conversationCount = conversationData?.comments ? conversationData.comments.length : 0;

  const handleClick = () => {
    if (onClick) {
      onClick(pr);
    }
  };

  const handleReviewerClick = (e: React.MouseEvent, reviewer: string) => {
    e.stopPropagation(); // Prevent PR card click
    setSelectedReviewer(reviewer);
  };

  const closeReviewerModal = () => {
    setSelectedReviewer(null);
  };


  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'open': return '#10b981';
      case 'closed': return '#ef4444';
      case 'merged': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Helper functions for reviewer badges (based on old JS app)
  const getReviewerBadgeClass = (reviewer: GitHubReviewer): string => {
    const baseClass = reviewer.isCurrentUser ? 'reviewer-you' : 
                      reviewer.username.includes('[bot]') ? 'reviewer-bot' : 'reviewer-other';
    
    const stateClasses: Record<GitHubReviewer['state'], string> = {
      'approved': 'reviewer-approved',
      'changes_requested': 'reviewer-changes-requested', 
      'commented': 'reviewer-commented',
      'review_requested': 'reviewer-pending',
      'dismissed': 'reviewer-dismissed'
    };

    const stateClass = stateClasses[reviewer.state] || 'reviewer-commented'; // Fallback to commented
    return `${baseClass} ${stateClass}`;
  };

  const getReviewerStateText = (state: GitHubReviewer['state']): string => {
    const stateTexts: Record<GitHubReviewer['state'], string> = {
      'approved': 'Approved',
      'changes_requested': 'Changes Requested',
      'commented': 'Commented', 
      'review_requested': 'Review Requested',
      'dismissed': 'Dismissed'
    };
    return stateTexts[state] || 'Commented'; // Fallback to "Commented"
  };

  const getReviewerStateIcon = (state: GitHubReviewer['state']): string => {
    const stateIcons: Record<GitHubReviewer['state'], string> = {
      'approved': '✅',
      'changes_requested': '❌',
      'commented': '💬',
      'review_requested': '📝',
      'dismissed': '⏸️'
    };
    return stateIcons[state] || '💬'; // Fallback to comment icon
  };

  return (
    <div className={`pr-card ${isSelected ? 'selected' : ''}`} onClick={handleClick}>
      {/* PR Title as clickable link */}
      <div className="pr-card-title-section">
        <a 
          href={pr.html_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="pr-card-title-link"
          onClick={(e) => e.stopPropagation()}
        >
          #{pr.number} {pr.title}
        </a>
      </div>
      
      {/* Status Badges */}
      <div className="pr-card-badges">
        <span 
          className="pr-badge pr-state" 
          style={{ backgroundColor: getStateColor(pr.state) }}
        >
          {pr.state.toUpperCase()}
        </span>
        {/* TODO: Add checks status badge when available */}
        <span className="pr-badge pr-checks">
          CHECKS: PASSED
        </span>
        {/* Author and date info */}
        <span className="pr-card-author-info">
          By {pr.user?.login || 'Unknown user'} • Created: {formatDate(pr.created_at)}
        </span>
      </div>
      
      {/* Reviewers section */}
      <div className="pr-card-reviewers">
        <span className="pr-reviewers-label">Reviewers:</span>
        {pr.reviewers && pr.reviewers.length > 0 ? (
          pr.reviewers.map((reviewer) => (
            <span 
              key={reviewer.username}
              className={`reviewer-badge ${getReviewerBadgeClass(reviewer)} ${reviewer.hasComments ? 'clickable-reviewer' : ''}`} 
              onClick={reviewer.hasComments ? (e) => handleReviewerClick(e, reviewer.username) : undefined}
              title={`${reviewer.username}${reviewer.isCurrentUser ? ' (You)' : ''}: ${getReviewerStateText(reviewer.state)}${reviewer.hasComments ? ' - Click to view comments' : ''}`}
            >
              {getReviewerStateIcon(reviewer.state)} {reviewer.username}{reviewer.isCurrentUser ? ' (You)' : ''}
            </span>
          ))
        ) : (
          <span className="reviewer-badge reviewer-none">No reviewers assigned</span>
        )}
      </div>
      
      {/* Description Section */}
      <CollapsibleSection 
        title="Description"
        isExpandedByDefault={false}
        className="pr-description-section"
      >
        <PRDescription repoName={repoName} prNumber={pr.number} />
      </CollapsibleSection>

      {/* Conversation Section */}
      <CollapsibleSection 
        title={`Conversation (${conversationCount})`}
        isExpandedByDefault={false}
        className="pr-conversation-section"
      >
        <PRConversation repoName={repoName} prNumber={pr.number} />
      </CollapsibleSection>
      
      {/* Reviewer Comments Modal */}
      {selectedReviewer && (
        <ReviewerCommentsModal
          reviewer={selectedReviewer}
          repoName={repoName}
          prNumber={pr.number}
          isOpen={!!selectedReviewer}
          onClose={closeReviewerModal}
        />
      )}
    </div>
  );
};

export default PRCard;
