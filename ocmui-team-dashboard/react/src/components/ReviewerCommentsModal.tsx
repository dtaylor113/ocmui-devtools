import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../contexts/SettingsContext';
import { parseGitHubMarkdown } from '../utils/formatting';

interface ReviewerComment {
  body: string;
  submitted_at: string;
  state: string;
  type: 'review' | 'comment';
}

interface ReviewerCommentsModalProps {
  reviewer: string;
  repoName: string;
  prNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

const ReviewerCommentsModal: React.FC<ReviewerCommentsModalProps> = ({
  reviewer,
  repoName,
  prNumber,
  isOpen,
  onClose
}) => {
  const [comments, setComments] = useState<ReviewerComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { apiTokens } = useSettings();

  useEffect(() => {
    if (!isOpen || !reviewer || !repoName || !prNumber) return;

    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const headers = {
          'Authorization': `Bearer ${apiTokens.github}`,
          'Accept': 'application/vnd.github.v3+json'
        };

        // Fetch both reviews and comments in parallel (same as old JS app)
        const [reviewsResponse, commentsResponse] = await Promise.all([
          fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}/reviews`, { headers }),
          fetch(`https://api.github.com/repos/${repoName}/issues/${prNumber}/comments`, { headers })
        ]);

        if (!reviewsResponse.ok || !commentsResponse.ok) {
          throw new Error(`GitHub API error: reviews=${reviewsResponse.status}, comments=${commentsResponse.status}`);
        }

        const [reviews, generalComments] = await Promise.all([
          reviewsResponse.json(),
          commentsResponse.json()
        ]);

        // Combine review comments and general comments for this reviewer
        const allComments: ReviewerComment[] = [];

        // Add review comments
        reviews
          .filter((review: any) => review.user?.login === reviewer && review.body && review.body.trim())
          .forEach((review: any) => {
            allComments.push({
              body: review.body,
              submitted_at: review.submitted_at,
              state: review.state,
              type: 'review'
            });
          });

        // Add general PR comments  
        generalComments
          .filter((comment: any) => comment.user?.login === reviewer && comment.body && comment.body.trim())
          .forEach((comment: any) => {
            allComments.push({
              body: comment.body,
              submitted_at: comment.created_at,
              state: 'commented', // General comments don't have review states
              type: 'comment'
            });
          });

        // Sort by date (newest first)
        allComments.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

        setComments(allComments);
        
      } catch (err) {
        console.error('Error fetching reviewer comments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [isOpen, reviewer, repoName, prNumber, apiTokens.github]);

  const getReviewerStateIcon = (state: string): string => {
    const stateIcons: Record<string, string> = {
      'approved': '✅',
      'changes_requested': '❌',
      'commented': '💬',
      'review_requested': '📝',
      'dismissed': '⏸️'
    };
    return stateIcons[state] || '💬';
  };

  const getReviewerStateText = (state: string): string => {
    const stateTexts: Record<string, string> = {
      'approved': 'Approved',
      'changes_requested': 'Changes Requested',
      'commented': 'Comment',
      'review_requested': 'Review Requested',
      'dismissed': 'Dismissed'
    };
    return stateTexts[state] || 'Comment';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // GitHub markdown parsing is now handled by the imported parseGitHubMarkdown function

  if (!isOpen) return null;

  return createPortal(
    <div className="reviewer-comments-modal">
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content reviewer-comments-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Comments by {reviewer}</h3>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          
          <div className="modal-body">
            {isLoading ? (
              <div className="loading">Loading comments...</div>
            ) : error ? (
              <div className="error">Failed to load comments: {error}</div>
            ) : comments.length === 0 ? (
              <div className="no-comments">No comments found for {reviewer}</div>
            ) : (
              <div className="comments-list">
                {comments.map((comment, index) => (
                  <div key={index} className="reviewer-comment">
                    <div className="comment-header">
                      <span className="comment-meta">
                        {getReviewerStateIcon(comment.state)} {getReviewerStateText(comment.state)} • {formatDate(comment.submitted_at)}
                      </span>
                    </div>
                    <div 
                      className="comment-body"
                      dangerouslySetInnerHTML={{ __html: parseGitHubMarkdown(comment.body || '') }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReviewerCommentsModal;
