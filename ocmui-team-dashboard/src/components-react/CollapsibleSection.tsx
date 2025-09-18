import React, { useState } from 'react';

interface CollapsibleSectionProps {
  id: string;
  title?: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  maxHeight?: number;
  onToggle?: (expanded: boolean) => void;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title = 'More Info',
  children,
  initiallyExpanded = false,
  maxHeight = 300,
  onToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <div className="collapsible-section" data-component="react">
      <button 
        className="collapsible-toggle" 
        onClick={handleToggle}
        type="button"
      >
        <span className="toggle-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="toggle-text">{title}</span>
      </button>
      
      <div 
        className={`collapsible-content ${isExpanded ? 'expanded' : ''}`}
        id={`collapsible-${id}`}
      >
        <div className="collapsible-inner">
          {isExpanded && (
            <div
              style={{
                maxHeight: `${maxHeight}px`,
                overflowY: 'auto',
                overflowX: 'hidden',
                wordWrap: 'break-word',
                paddingRight: '8px'
              }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for content sections
interface ContentSectionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  label,
  children,
  className = 'github-section'
}) => (
  <div className={className}>
    <label><strong>{label}</strong></label>
    <div className="github-content">
      {children}
    </div>
  </div>
);

// Component to render HTML content safely
interface HTMLContentProps {
  html: string;
}

export const HTMLContent: React.FC<HTMLContentProps> = ({ html }) => (
  <div dangerouslySetInnerHTML={{ __html: html }} />
);
