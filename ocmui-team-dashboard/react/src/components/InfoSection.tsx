import React from 'react';

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

/**
 * Shared Info Section Component
 * Provides consistent styling for individual sections within More Info areas
 * Used for Description, Comments, etc. sections with scrollable content
 */
const InfoSection: React.FC<InfoSectionProps> = ({ 
  title, 
  children, 
  className = '',
  maxHeight = '200px'
}) => {
  return (
    <div className={`more-info-section ${className}`}>
      <h4 className="more-info-section-title">{title}</h4>
      <div 
        className="scrollable-content"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>
  );
};

export default InfoSection;
