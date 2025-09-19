import React from 'react';
import CollapsibleSection from './CollapsibleSection';

interface MoreInfoSectionProps {
  title: string;
  isExpandedByDefault?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Shared More Info Section Component
 * Provides consistent styling and behavior for expandable "More Info" sections
 * Used by both JIRA cards and PR cards to maintain DRY principles
 */
const MoreInfoSection: React.FC<MoreInfoSectionProps> = ({ 
  title, 
  isExpandedByDefault = false, 
  className = '',
  children 
}) => {
  return (
    <CollapsibleSection 
      title={title}
      isExpandedByDefault={isExpandedByDefault}
      className={`more-info ${className}`}
    >
      <div className="more-info-container">
        {children}
      </div>
    </CollapsibleSection>
  );
};

export default MoreInfoSection;
