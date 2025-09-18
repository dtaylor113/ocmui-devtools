import React from 'react';

interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  draft?: boolean;
  mergeable_state?: string;
  labels?: Array<{
    name: string;
    color: string;
  }>;
}

interface PRCardProps {
  pr: GitHubPR;
  onClick?: (pr: GitHubPR) => void;
}

const PRCard: React.FC<PRCardProps> = ({ pr, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(pr);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(pr.url, '_blank');
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

  return (
    <div 
      className="pr-card" 
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="pr-card-header">
        <div className="pr-card-info">
          <span className="pr-card-number">#{pr.number}</span>
          <span 
            className="pr-card-state" 
            style={{ backgroundColor: getStateColor(pr.state) }}
          >
            {pr.state}
          </span>
        </div>
        <button 
          className="pr-card-link" 
          onClick={handleLinkClick}
          title="Open on GitHub"
        >
          🔗
        </button>
      </div>
      
      <div className="pr-card-title">
        {pr.title}
      </div>
      
      <div className="pr-card-branches">
        <span className="pr-card-branch">{pr.head?.ref || 'unknown'}</span>
        <span className="pr-card-arrow">→</span>
        <span className="pr-card-branch">{pr.base?.ref || 'unknown'}</span>
      </div>
      
      <div className="pr-card-meta">
        <div className="pr-card-author">
          <img 
            src={pr.user?.avatar_url || '/default-avatar.png'} 
            alt={pr.user?.login || 'Unknown user'}
            className="pr-card-avatar"
          />
          <span>{pr.user?.login || 'Unknown user'}</span>
        </div>
        <span className="pr-card-date">{formatDate(pr.updated_at)}</span>
      </div>
    </div>
  );
};

export default PRCard;
