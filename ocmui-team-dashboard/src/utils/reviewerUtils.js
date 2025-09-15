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
 * @returns {Object} Object with processed reviewer HTML and data
 */
export function processReviewers(reviews, requestedReviewers, currentUser = null) {
    const reviewerMap = new Map();
    
    // Process completed reviews
    reviews.forEach(review => {
        const reviewer = review.user?.login;
        if (!reviewer) return;
        
        const reviewState = review.state?.toLowerCase();
        
        // Track the most recent review state for each reviewer
        if (!reviewerMap.has(reviewer) || 
            new Date(review.submitted_at) > new Date(reviewerMap.get(reviewer).date)) {
            reviewerMap.set(reviewer, {
                state: reviewState,
                date: review.submitted_at
            });
        }
    });
    
    // Add requested reviewers who haven't reviewed yet
    requestedReviewers.forEach(reviewer => {
        const username = reviewer.login;
        if (username && !reviewerMap.has(username)) {
            reviewerMap.set(username, {
                state: 'review_requested',
                date: null
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
        
        return `<span class="reviewer-item ${stateClass} ${isCurrentUser ? 'current-user' : ''}" 
                      title="${username}: ${stateText}${isCurrentUser ? ' (You)' : ''}">${stateIcon} ${username}${isCurrentUser ? ' (You)' : ''}</span>`;
    }).join('');
    
    return {
        html: `<div class="reviewer-list">${reviewerBadges}</div>`,
        data: sortedReviewers
    };
}
