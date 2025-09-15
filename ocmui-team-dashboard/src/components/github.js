/**
 * GitHub Integration Module
 * 
 * Handles GitHub PR fetching, processing, and display functionality.
 * Provides comprehensive GitHub API integration for pull request
 * management and review tracking.
 */

import { appState } from '../core/appState.js';

/**
 * Fetch and display GitHub PRs related to a JIRA ticket
 * @param {string} jiraId - The JIRA ticket ID to search PRs for
 */
export async function fetchAndDisplayGitHubPRs(jiraId) {
    console.log('🐙 Fetching GitHub PRs for JIRA:', jiraId);
    
    const githubContent = document.getElementById('github-content');
    if (!githubContent) return;
    
    // Check if GitHub token is configured
    if (!appState.apiTokens.github || !appState.apiTokens.githubUsername) {
        githubContent.innerHTML = '<div class="placeholder">Configure GitHub token in Settings to view related PRs</div>';
        return;
    }
    
    try {
        githubContent.innerHTML = '<div class="loading">🔍 Searching for related PRs...</div>';
        
        // Search for PRs mentioning the JIRA ID
        const searchResults = await searchGithubPRs(jiraId);
        
        if (searchResults.length === 0) {
            githubContent.innerHTML = '<div class="placeholder">No related PRs found</div>';
            return;
        }
        
        // Fetch detailed information for each PR
        const detailedPRs = await fetchDetailedPRInfo(searchResults, jiraId);
        
        // Display PRs with full details
        displayGitHubPRsWithDetails(detailedPRs, jiraId);
        
    } catch (error) {
        console.error('❌ GitHub PR fetch error:', error);
        githubContent.innerHTML = `<div class="error">Error loading GitHub PRs: ${error.message}</div>`;
    }
}

/**
 * Search GitHub for PRs mentioning a JIRA ID
 * @param {string} jiraId - The JIRA ticket ID to search for
 * @returns {Promise<Array>} Array of PR search results
 */
async function searchGithubPRs(jiraId) {
    const searchQuery = `${jiraId} type:pr`;
    const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc`;
    
    const response = await fetch(searchUrl, {
        headers: {
            'Authorization': `Bearer ${appState.apiTokens.github}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`GitHub search failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items || [];
}

/**
 * Fetch detailed information for GitHub PRs
 * @param {Array} prs - Array of basic PR objects from search
 * @param {string} jiraId - The related JIRA ticket ID
 * @returns {Promise<Array>} Array of PRs with detailed information
 */
async function fetchDetailedPRInfo(prs, jiraId) {
    console.log('🔍 Fetching detailed PR info for', prs.length, 'PRs');
    
    const detailedPromises = prs.map(async (pr) => {
        try {
            // Get detailed PR information
            const prResponse = await fetch(pr.pull_request.url, {
                headers: {
                    'Authorization': `Bearer ${appState.apiTokens.github}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (prResponse.ok) {
                pr.prDetails = await prResponse.json();
            }
            
            // Get PR reviews
            const reviewsResponse = await fetch(`${pr.pull_request.url}/reviews`, {
                headers: {
                    'Authorization': `Bearer ${appState.apiTokens.github}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (reviewsResponse.ok) {
                pr.reviews = await reviewsResponse.json();
            }
            
            // Get check runs for the latest commit
            if (pr.prDetails && pr.prDetails.head && pr.prDetails.head.sha) {
                const checksResponse = await fetch(
                    `https://api.github.com/repos/${pr.prDetails.base.repo.full_name}/commits/${pr.prDetails.head.sha}/check-runs`,
                    {
                        headers: {
                            'Authorization': `Bearer ${appState.apiTokens.github}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (checksResponse.ok) {
                    const checksData = await checksResponse.json();
                    pr.checkRuns = checksData.check_runs || [];
                }
            }
            
            return pr;
        } catch (error) {
            console.error('❌ Error fetching details for PR:', pr.html_url, error);
            return pr; // Return basic PR info even if detailed fetch fails
        }
    });
    
    return Promise.all(detailedPromises);
}

/**
 * Display GitHub PRs with detailed information
 * @param {Array} prs - Array of detailed PR objects
 * @param {string} jiraId - The related JIRA ticket ID
 */
function displayGitHubPRsWithDetails(prs, jiraId) {
    console.log('📊 Displaying', prs.length, 'PRs with details');
    
    const githubContent = document.getElementById('github-content');
    if (!githubContent) return;
    
    if (!prs || prs.length === 0) {
        githubContent.innerHTML = '<div class="placeholder">No related PRs found</div>';
        return;
    }
    
    let html = '<div class="github-pr-list">';
    
    prs.forEach(pr => {
        // Determine PR state and styling
        const prState = pr.state === 'closed' ? 
            (pr.pull_request?.merged_at ? 'merged' : 'closed') : 'open';
        const stateClass = `pr-status-${prState}`;
        const stateText = prState.charAt(0).toUpperCase() + prState.slice(1);
        
        // Extract basic PR info
        const createdDate = new Date(pr.created_at).toLocaleDateString();
        const author = pr.user?.login || 'Unknown';
        const title = pr.title || 'No title';
        const url = pr.html_url;
        
        // Process reviewers information
        const reviewerInfo = processReviewers(pr.reviews || [], pr.prDetails?.requested_reviewers || []);
        
        // Process checks information
        const checkStatus = processChecks(pr.checkRuns || []);
        
        // Check if PR needs rebase
        const needsRebase = pr.prDetails?.mergeable_state === 'dirty' || pr.prDetails?.mergeable === false;
        
        html += `
            <div class="github-pr-item">
                <div class="github-pr-header-row">
                    <a href="${url}" target="_blank" class="github-pr-title-link">${title}</a>
                    <div class="github-pr-status-row">
                        <span class="github-pr-status ${stateClass}">${stateText}</span>
                    </div>
                </div>
                <div class="github-pr-meta">
                    <span>By <span class="github-pr-author">${author}</span></span>
                    <span>•</span>
                    <span class="github-pr-date">${createdDate}</span>
                </div>
                <div class="github-pr-badges">
                    ${checkStatus.html}
                    ${needsRebase ? '<span class="pr-badge pr-badge-needs-rebase">Needs Rebase</span>' : ''}
                </div>
                ${reviewerInfo.html ? `
                    <div class="github-pr-reviewers">
                        <span>Reviewers:</span>
                        ${reviewerInfo.html}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    githubContent.innerHTML = html;
}

/**
 * Process reviewer information for a PR
 * @param {Array} reviews - Array of review objects
 * @param {Array} requestedReviewers - Array of requested reviewer objects
 * @returns {Object} Object with processed reviewer HTML and data
 */
function processReviewers(reviews, requestedReviewers) {
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
    
    // Generate reviewer badges HTML
    const reviewerBadges = Array.from(reviewerMap.entries()).map(([username, info]) => {
        const stateClass = getReviewerStateClass(info.state);
        const stateText = getReviewerStateText(info.state);
        const stateIcon = getReviewerStateIcon(info.state);
        
        return `<span class="reviewer-item ${stateClass}" title="${username}: ${stateText}">${stateIcon} ${username}</span>`;
    }).join('');
    
    return {
        html: `<div class="reviewer-list">${reviewerBadges}</div>`,
        data: Array.from(reviewerMap.entries())
    };
}

/**
 * Get CSS class for reviewer state
 * @param {string} state - The review state
 * @returns {string} CSS class name
 */
function getReviewerStateClass(state) {
    const stateMap = {
        'approved': 'reviewer-approved',
        'changes_requested': 'reviewer-changes-requested',
        'review_requested': 'reviewer-review-requested',
        'commented': 'reviewer-commented',
        'dismissed': 'reviewer-dismissed'
    };
    
    return stateMap[state] || 'reviewer-review-requested';
}

/**
 * Get human-readable text for reviewer state
 * @param {string} state - The review state
 * @returns {string} Human-readable state text
 */
function getReviewerStateText(state) {
    const stateMap = {
        'approved': 'Approved',
        'changes_requested': 'Changes Requested',
        'review_requested': 'Review Requested',
        'commented': 'Commented',
        'dismissed': 'Dismissed'
    };
    
    return stateMap[state] || 'Review Requested';
}

/**
 * Get icon for reviewer state
 * @param {string} state - The review state
 * @returns {string} Icon character for the state
 */
function getReviewerStateIcon(state) {
    const iconMap = {
        'approved': '✅',
        'changes_requested': '❌',
        'review_requested': '👁',
        'commented': '💬',
        'dismissed': '🚫'
    };
    
    return iconMap[state] || '👁';
}

/**
 * Process check run information for a PR
 * @param {Array} checkRuns - Array of check run objects
 * @returns {Object} Object with processed check HTML and summary
 */
function processChecks(checkRuns) {
    if (!checkRuns || checkRuns.length === 0) {
        return { html: '', summary: 'no-checks' };
    }
    
    // Count check states
    const checkCounts = {
        success: 0,
        failure: 0,
        pending: 0,
        skipped: 0
    };
    
    checkRuns.forEach(check => {
        const conclusion = check.conclusion;
        const status = check.status;
        
        if (status === 'completed') {
            if (conclusion === 'success') {
                checkCounts.success++;
            } else if (conclusion === 'failure' || conclusion === 'cancelled' || conclusion === 'timed_out') {
                checkCounts.failure++;
            } else if (conclusion === 'skipped' || conclusion === 'neutral') {
                checkCounts.skipped++;
            }
        } else {
            checkCounts.pending++;
        }
    });
    
    // Determine overall status and generate badge
    let badgeClass, badgeText, summary;
    
    if (checkCounts.failure > 0) {
        badgeClass = 'pr-badge-checks-fail';
        badgeText = `✗ ${checkCounts.failure} failed`;
        summary = 'failure';
    } else if (checkCounts.pending > 0) {
        badgeClass = 'pr-badge-checks-pending';
        badgeText = `⏳ ${checkCounts.pending} pending`;
        summary = 'pending';
    } else if (checkCounts.success > 0) {
        badgeClass = 'pr-badge-checks-pass';
        badgeText = `✓ ${checkCounts.success} passed`;
        summary = 'success';
    } else {
        // Only skipped checks
        return { html: '', summary: 'no-checks' };
    }
    
    const html = `<span class="pr-badge ${badgeClass}" title="${badgeText}">${badgeText}</span>`;
    
    return { html, summary };
}
