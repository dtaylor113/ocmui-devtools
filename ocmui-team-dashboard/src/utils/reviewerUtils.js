/**
 * Shared Reviewer Utilities
 * 
 * Provides consistent reviewer state handling across all components.
 * Used by both the Reviews tab and JIRA tab's GitHub PR display.
 */

/**
 * Get CSS class for reviewer state
 * @param {string} state - The review state
 * @returns {string} CSS class name
 */
export function getReviewerStateClass(state) {
    const classMap = {
        'approved': 'reviewer-approved',
        'changes_requested': 'reviewer-changes-requested',
        'commented': 'reviewer-commented',
        'review_requested': 'reviewer-pending',
        'dismissed': 'reviewer-dismissed'
    };
    
    return classMap[state] || 'reviewer-pending';
}

/**
 * Get display text for reviewer state
 * @param {string} state - The review state
 * @returns {string} Human readable text
 */
export function getReviewerStateText(state) {
    const textMap = {
        'approved': 'Approved',
        'changes_requested': 'Requested Changes',
        'commented': 'Commented',
        'review_requested': 'Review Requested',
        'dismissed': 'Dismissed'
    };
    
    return textMap[state] || 'Pending';
}

/**
 * Get icon for reviewer state
 * @param {string} state - The review state
 * @returns {string} Emoji icon
 */
export function getReviewerStateIcon(state) {
    const iconMap = {
        'approved': '✅',
        'changes_requested': '❌', 
        'commented': '💬',
        'review_requested': '⏳',  // Updated to hourglass for consistency
        'dismissed': '🚫'
    };
    
    return iconMap[state] || '⏳';
}

/**
 * Process reviewer information for a PR
 * @param {Array} reviews - Array of review objects
 * @param {Array} requestedReviewers - Array of requested reviewer objects
 * @param {string} currentUser - Current user's GitHub username (optional)
 * @param {Object} prInfo - PR information for comment popup context
 * @returns {Object} Object with processed reviewer HTML and data
 */
export function processReviewers(reviews, requestedReviewers, currentUser = null, prInfo = null, prComments = []) {
    const reviewerMap = new Map();
    const reviewerComments = new Map();
    
    // Ensure all parameters are arrays to prevent forEach errors
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const safeRequestedReviewers = Array.isArray(requestedReviewers) ? requestedReviewers : [];
    const safePrComments = Array.isArray(prComments) ? prComments : [];
    
    // Process reviewers and comments
    
    // Process completed reviews and track review comments
    safeReviews.forEach(review => {
        const reviewer = review.user?.login;
        if (!reviewer) return;
        
        const reviewState = review.state?.toLowerCase();
        const hasCommentBody = review.body && review.body.trim().length > 0;
        
        // Track review comments for this reviewer
        if (hasCommentBody) {
            if (!reviewerComments.has(reviewer)) {
                reviewerComments.set(reviewer, []);
            }
            reviewerComments.get(reviewer).push({
                body: review.body,
                submitted_at: review.submitted_at,
                state: reviewState,
                type: 'review'
            });
        }
        
        // Track the most recent review state for each reviewer
        if (!reviewerMap.has(reviewer) || 
            new Date(review.submitted_at) > new Date(reviewerMap.get(reviewer).date)) {
            reviewerMap.set(reviewer, {
                state: reviewState,
                date: review.submitted_at,
                hasComments: false // Will be set properly later after processing all comments
            });
        }
    });
    
    // Process general PR comments (not tied to formal reviews)
    safePrComments.forEach(comment => {
        const commenter = comment.user?.login;
        if (!commenter) return;
        
        const hasCommentBody = comment.body && comment.body.trim().length > 0;
        if (!hasCommentBody) return;
        
        // Track general comments for this user
        if (!reviewerComments.has(commenter)) {
            reviewerComments.set(commenter, []);
        }
        reviewerComments.get(commenter).push({
            body: comment.body,
            submitted_at: comment.created_at,
            state: 'commented', // General comments don't have review states
            type: 'comment'
        });
        
        // If this user isn't already tracked as a reviewer, add them as a commenter
        if (!reviewerMap.has(commenter)) {
            reviewerMap.set(commenter, {
                state: 'commented',
                date: comment.created_at,
                hasComments: true
            });
        } else {
            // Update hasComments flag for existing reviewers
            const existing = reviewerMap.get(commenter);
            existing.hasComments = true;
            reviewerMap.set(commenter, existing);
        }
    });
    
    // Now update hasComments flag for all reviewers who have comments
    reviewerComments.forEach((comments, reviewer) => {
        if (reviewerMap.has(reviewer)) {
            const existing = reviewerMap.get(reviewer);
            existing.hasComments = true;
            reviewerMap.set(reviewer, existing);
        }
    });
    
    // Generate reviewer badges with comment information
    
    // Add requested reviewers who haven't reviewed yet
    safeRequestedReviewers.forEach(reviewer => {
        const username = reviewer.login;
        if (username && !reviewerMap.has(username)) {
            reviewerMap.set(username, {
                state: 'review_requested',
                date: null,
                hasComments: false
            });
        }
    });
    
    if (reviewerMap.size === 0) {
        return { html: '', data: [] };
    }
    
    // Sort reviewers to put current user first (if provided)
    const sortedReviewers = Array.from(reviewerMap.entries()).sort(([usernameA], [usernameB]) => {
        if (currentUser) {
            if (usernameA === currentUser) return -1;
            if (usernameB === currentUser) return 1;
        }
        return usernameA.localeCompare(usernameB);
    });
    
    // Generate reviewer badges HTML
    const reviewerBadges = sortedReviewers.map(([username, info]) => {
        const stateClass = getReviewerStateClass(info.state);
        const stateText = getReviewerStateText(info.state);
        const stateIcon = getReviewerStateIcon(info.state);
        const isCurrentUser = currentUser && username === currentUser;
        const hasComments = info.hasComments;
        
        // Make clickable if reviewer has comments (but don't add duplicate comment icon)
        // The stateIcon already includes a comment icon if state is 'commented'
        const clickHandler = hasComments && prInfo ? 
            `onclick="event.stopPropagation(); showReviewerComments('${username}', '${prInfo.repoName}', ${prInfo.number})"` : '';
        const clickableClass = hasComments ? 'clickable-reviewer' : '';
        
        // Only add comment icon if reviewer has comments but no formal review state
        const needsCommentIcon = hasComments && info.state === 'review_requested';
        const commentIcon = needsCommentIcon ? ' 💬' : '';
        
        // Generate reviewer badge HTML
        
        const generatedHtml = `<span class="reviewer-item ${stateClass} ${isCurrentUser ? 'current-user' : ''} ${clickableClass}" 
                      title="${username}: ${stateText}${hasComments ? ' (Click to view comments)' : ''}${isCurrentUser ? ' (You)' : ''}"
                      ${clickHandler}>
                    ${stateIcon} ${username}${isCurrentUser ? ' (You)' : ''}${commentIcon}
                </span>`;
        
        // Debug HTML output for reviewers with comments
        // HTML generated for reviewer with comments
        
        return generatedHtml;
    }).join('');
    
    return {
        html: `<div class="reviewer-list">${reviewerBadges}</div>`,
        data: Array.from(reviewerMap.entries()).map(([reviewer, data]) => ({
            reviewer,
            state: data.state,
            date: data.date,
            hasComments: data.hasComments
        })),
        reviewerComments: reviewerComments
    };
}

/**
 * Show reviewer comments popup
 * @param {string} reviewer - Reviewer's GitHub username
 * @param {string} repoName - Repository name
 * @param {number} prNumber - PR number
 */
// Ensure the global function is available (with debug)
window.showReviewerComments = async function(reviewer, repoName, prNumber) {
    console.log(`🔍 Loading comments for reviewer ${reviewer} on ${repoName}#${prNumber}`);
    
    try {
        console.log('🔍 Step 1: Creating modal...');
        // Create modal backdrop
        const modal = document.createElement('div');
        modal.className = 'reviewer-comments-modal';
        modal.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content reviewer-comments-content">
                    <div class="modal-header">
                        <h3>Comments by ${reviewer}</h3>
                        <button class="modal-close" onclick="this.closest('.reviewer-comments-modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="loading">Loading comments...</div>
                    </div>
                </div>
            </div>
        `;
        
        console.log('🔍 Step 2: Appending modal to body...');
        document.body.appendChild(modal);
        console.log('✅ Modal created and added to DOM');
        
        // Fetch GitHub token
        console.log('🔍 Step 3: Getting GitHub token...');
        const token = window.OCMUIDebug?.appState?.apiTokens?.github;
        console.log('🔍 Token check:', token ? 'Found' : 'Missing');
        if (!token) {
            throw new Error('GitHub token not available');
        }
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };
        
        console.log('🔍 Step 4: Fetching GitHub API data...');
        // Fetch both review comments AND general PR comments
        const [reviewsResponse, commentsResponse] = await Promise.all([
            fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}/reviews`, { headers }),
            fetch(`https://api.github.com/repos/${repoName}/issues/${prNumber}/comments`, { headers })
        ]);
        
        console.log('🔍 API responses:', {
            reviewsOk: reviewsResponse.ok, 
            reviewsStatus: reviewsResponse.status,
            commentsOk: commentsResponse.ok,
            commentsStatus: commentsResponse.status
        });
        
        if (!reviewsResponse.ok) {
            throw new Error(`Failed to fetch reviews: ${reviewsResponse.status}`);
        }
        if (!commentsResponse.ok) {
            throw new Error(`Failed to fetch comments: ${commentsResponse.status}`);
        }
        
        const [reviews, generalComments] = await Promise.all([
            reviewsResponse.json(),
            commentsResponse.json()
        ]);
        
        console.log('🔍 Step 5: Fetched data:', {
            reviewsCount: reviews.length,
            commentsCount: generalComments.length
        });
        
        // Combine review comments and general comments
        const allComments = [];
        
        // Add review comments
        reviews
            .filter(review => review.user?.login === reviewer && review.body && review.body.trim())
            .forEach(review => {
                allComments.push({
                    body: review.body,
                    submitted_at: review.submitted_at,
                    state: review.state,
                    type: 'review'
                });
            });
        
        // Add general PR comments
        generalComments
            .filter(comment => comment.user?.login === reviewer && comment.body && comment.body.trim())
            .forEach(comment => {
                allComments.push({
                    body: comment.body,
                    submitted_at: comment.created_at,
                    state: 'commented',
                    type: 'comment'
                });
            });
        
        // Sort all comments by most recent first
        allComments.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        
        console.log('🔍 Step 6: Filtered comments for', reviewer, ':', allComments.length);
        
        if (allComments.length === 0) {
            console.log('⚠️ No comments found for', reviewer);
            modal.querySelector('.modal-body').innerHTML = `
                <div class="no-comments">No comments found for ${reviewer}</div>
            `;
            return;
        }
        
        // Render all comments
        const commentsHtml = allComments.map(comment => {
            const date = new Date(comment.submitted_at).toLocaleDateString();
            const time = new Date(comment.submitted_at).toLocaleTimeString();
            const stateIcon = getReviewerStateIcon(comment.state.toLowerCase());
            const stateText = comment.type === 'review' ? getReviewerStateText(comment.state.toLowerCase()) : 'Comment';
            
            // Use GitHub markdown parsing if available
            const bodyHtml = window.parseGitHubMarkdown ? 
                window.parseGitHubMarkdown(comment.body) : 
                comment.body.replace(/\n/g, '<br>');
            
            return `
                <div class="reviewer-comment">
                    <div class="comment-header">
                        <span class="comment-meta">${stateIcon} ${stateText} • ${date} ${time}</span>
                    </div>
                    <div class="comment-body">${bodyHtml}</div>
                </div>
            `;
        }).join('');
        
        console.log('🔍 Step 7: Updating modal with', allComments.length, 'comments');
        modal.querySelector('.modal-body').innerHTML = `
            <div class="comments-list">
                ${commentsHtml}
            </div>
        `;
        
        console.log('✅ Successfully displayed comments for', reviewer);
        
    } catch (error) {
        console.error('❌ Error loading reviewer comments:', error);
        const modal = document.querySelector('.reviewer-comments-modal');
        if (modal) {
            modal.querySelector('.modal-body').innerHTML = `
                <div class="error">Failed to load comments: ${error.message}</div>
            `;
        }
    }
};

// Debug: Verify the global function is registered
console.log('✅ showReviewerComments global function registered:', typeof window.showReviewerComments);
