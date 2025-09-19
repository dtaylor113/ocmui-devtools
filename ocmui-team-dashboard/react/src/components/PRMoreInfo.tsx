import React, { useState, useEffect } from 'react';
import { usePRConversation } from '../hooks/useApiQueries';
import { parseGitHubMarkdownWithCaching, prepareGitHubComments } from '../utils/formatting';
import { useSettings } from '../contexts/SettingsContext';
import InfoSection from './InfoSection';

interface PRMoreInfoProps {
  repoName: string;
  prNumber: number;
}

const PRMoreInfo: React.FC<PRMoreInfoProps> = ({ repoName, prNumber }) => {
  const { data, isLoading, error } = usePRConversation(repoName, prNumber);
  const { apiTokens } = useSettings();
  const [parsedDescription, setParsedDescription] = useState<string>('');
  const [parsedComments, setParsedComments] = useState<Record<string, string>>({});
  const [parsingDescription, setParsingDescription] = useState(false);
  const [parsingComments, setParsingComments] = useState(false);

  // Parse description when data changes
  useEffect(() => {
    if (data?.description && apiTokens.github) {
      setParsingDescription(true);
      parseGitHubMarkdownWithCaching(data.description, apiTokens.github)
        .then(html => {
          setParsedDescription(html);
          setParsingDescription(false);
        })
        .catch(error => {
          console.error('Error parsing PR description:', error);
          setParsedDescription(data.description.replace(/\n/g, '<br>'));
          setParsingDescription(false);
        });
    } else if (data?.description) {
      // No token, use simple line break replacement
      setParsedDescription(data.description.replace(/\n/g, '<br>'));
    }
  }, [data?.description, apiTokens.github]);

  // Parse comments when data changes
  useEffect(() => {
    if (data?.comments && data.comments.length > 0) {
      setParsingComments(true);
      const parseCommentsAsync = async () => {
        const parsed: Record<string, string> = {};
        
        for (const comment of data.comments) {
          if (comment.body) {
            try {
              const html = await parseGitHubMarkdownWithCaching(comment.body, apiTokens.github);
              parsed[comment.id.toString()] = html;
            } catch (error) {
              console.error(`Error parsing comment ${comment.id}:`, error);
              parsed[comment.id.toString()] = comment.body.replace(/\n/g, '<br>');
            }
          }
        }
        
        setParsedComments(parsed);
        setParsingComments(false);
      };
      
      parseCommentsAsync();
    }
  }, [data?.comments, apiTokens.github]);

  if (isLoading) {
    return (
      <div className="more-info-container">
        <div className="loading-state">Loading PR conversation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="more-info-container">
        <div className="error-state">
          Failed to load PR conversation: {error.message}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="more-info-container">
        <div className="error-state">No PR conversation data available</div>
      </div>
    );
  }

  return (
    <div className="more-info-container">
      {/* Description content without title */}
      <div className="scrollable-content description-content" style={{ marginBottom: "16px" }}>
        {data.description ? (
          parsingDescription ? (
            <div className="loading-state">Parsing description...</div>
          ) : (
            <div 
              className="markdown-container pr-description"
              dangerouslySetInnerHTML={{ 
                __html: parsedDescription
              }}
            />
          )
        ) : (
          <div className="no-content">No description provided</div>
        )}
      </div>

      {/* Conversation Section */}
      <InfoSection title={`Conversation (${data.comments.length})`} maxHeight="250px">
        {data.comments.length > 0 ? (
          parsingComments ? (
            <div className="loading-state">Parsing comments...</div>
          ) : (
            <div className="comments-list conversation-timeline">
              {prepareGitHubComments(data.comments).map((comment) => (
                <div 
                  key={comment.id} 
                  className={`github-comment ${comment.comment_type ? `comment-${comment.comment_type}` : ''}`}
                >
                  <div className="comment-header">
                    <span className="comment-meta">
                      <span className="comment-author">{comment.user?.login || 'Unknown'}</span>
                      {comment.comment_type === 'review' && comment.state && (
                        <span className={`review-state review-state-${comment.state.toLowerCase().replace('_', '-')}`}>
                          {comment.state === 'approved' ? '✅' : 
                           comment.state === 'changes_requested' ? '❌' : 
                           comment.state === 'commented' ? '💬' : '📝'}
                        </span>
                      )}
                      {comment.comment_type === 'inline' && (
                        <span className="inline-comment-indicator">📄</span>
                      )}
                    </span>
                    <span className="comment-date">
                      {new Date(comment.created_at || comment.submitted_at || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div 
                    className="markdown-container comment-body"
                    dangerouslySetInnerHTML={{ 
                      __html: parsedComments[comment.id.toString()] || comment.body?.replace(/\n/g, '<br>') || ''
                    }}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="no-content">No comments yet</div>
        )}
      </InfoSection>
    </div>
  );
};

export default PRMoreInfo;
