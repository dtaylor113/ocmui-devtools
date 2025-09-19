import React from 'react';
import { useJiraTicket } from '../hooks/useApiQueries';
import { parseJiraMarkdown } from '../utils/formatting';

interface JiraComment {
  author: string;
  body: string;
  created: string;
}

interface JiraTicketDetail {
  key: string;
  summary: string;
  description: string;
  status: string;
  type: string;
  priority: string;
  assignee: string;
  reporter: string;
  created: string;
  comments: JiraComment[];
}

interface JiraMoreInfoProps {
  jiraKey: string;
}

const JiraMoreInfo: React.FC<JiraMoreInfoProps> = ({ jiraKey }) => {
  const { data, isLoading, error } = useJiraTicket(jiraKey);

  if (isLoading) {
    return (
      <div className="more-info-container">
        <div className="loading-state">Loading JIRA details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="more-info-container">
        <div className="error-state">Failed to load JIRA details: {error.message}</div>
      </div>
    );
  }

  if (!data || !data.success || !data.ticket) {
    return (
      <div className="more-info-container">
        <div className="error-state">No JIRA details available</div>
      </div>
    );
  }

  const ticket: JiraTicketDetail = data.ticket;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort comments by most recent first
  const sortedComments = [...(ticket.comments || [])].sort((a, b) => 
    new Date(b.created).getTime() - new Date(a.created).getTime()
  );

  return (
    <div className="more-info-container">
      {/* Description Section */}
      <div className="more-info-section">
        <h4 className="more-info-section-title">Description</h4>
        <div className="scrollable-content description-content">
          {ticket.description ? (
            (() => {
              const parsedHtml = parseJiraMarkdown(ticket.description);
              // Debug list processing
              if (ticket.description.includes('# ')) {
                console.log('📋 Original description with lists:', ticket.description.substring(0, 400));
                console.log('🔄 Parsed HTML result:', parsedHtml.substring(0, 400));
              }
              return (
                <div 
                  className="markdown-container jira-description"
                  dangerouslySetInnerHTML={{ __html: parsedHtml }}
                />
              );
            })()
          ) : (
            <div className="no-content">No description provided</div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="more-info-section">
        <h4 className="more-info-section-title">Comments ({sortedComments.length})</h4>
        <div className="scrollable-content comments-content">
          {sortedComments.length > 0 ? (
            <div className="comments-list">
              {sortedComments.map((comment, index) => (
                <div key={index} className="jira-comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author}</span>
                    <span className="comment-date">{formatDate(comment.created)}</span>
                  </div>
                  <div 
                    className="markdown-container comment-body"
                    dangerouslySetInnerHTML={{ 
                      __html: (() => {
                        const parsedHtml = parseJiraMarkdown(comment.body || '');
                        // Debug: Rendering comment with markdown-container 
                        console.log('💬 Rendering JIRA comment with markdown-container class');
                        return parsedHtml;
                      })()
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-content">No comments available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JiraMoreInfo;
