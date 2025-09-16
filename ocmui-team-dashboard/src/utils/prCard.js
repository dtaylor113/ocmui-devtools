/**
 * Shared PR Card Component
 * 
 * Provides consistent PR display formatting across all components.
 * Used by both the Reviews tab and JIRA tab's GitHub PR display.
 */

import { processReviewers } from './reviewerUtils.js';
import { parseGitHubMarkdown, formatGitHubCommentsHtml } from './formatting.js';
import { appState } from '../core/appState.js';
import { generatePRCollapsible } from './collapsibleSection.js';

/**
 * Process check run information for a PR
 * @param {Array} checkRuns - Array of check run objects
 * @returns {Object} Object with processed check HTML and summary
 */
export function processChecks(checkRuns) {
    if (!checkRuns || checkRuns.length === 0) {
        return { html: '', summary: 'no-checks' };
    }
    
    // Debug logging to help troubleshoot check statuses
    console.log('🔍 Processing check runs:', checkRuns.map(check => ({
        name: check.name,
        status: check.status,
        conclusion: check.conclusion,
        started_at: check.started_at,
        completed_at: check.completed_at
    })));
    
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
    let badgeClass, badgeText, summary, tooltipText;
    
    if (checkCounts.failure > 0) {
        badgeClass = 'pr-badge pr-badge-checks-fail';
        badgeText = 'Failed';
        summary = 'failure';
        tooltipText = `${checkCounts.failure} failed${checkCounts.success > 0 ? `, ${checkCounts.success} passed` : ''}${checkCounts.pending > 0 ? `, ${checkCounts.pending} pending` : ''}`;
    } else if (checkCounts.pending > 0) {
        badgeClass = 'pr-badge pr-badge-checks-pending';
        badgeText = 'Pending';
        summary = 'pending';
        tooltipText = `${checkCounts.pending} pending${checkCounts.success > 0 ? `, ${checkCounts.success} passed` : ''}`;
    } else if (checkCounts.success > 0) {
        badgeClass = 'pr-badge pr-badge-checks-pass';
        badgeText = 'Passed';
        summary = 'success';
        tooltipText = `${checkCounts.success} passed${checkCounts.skipped > 0 ? `, ${checkCounts.skipped} skipped` : ''}`;
    } else {
        // Only skipped checks
        return { html: '', summary: 'no-checks' };
    }
    
    const html = `<span class="${badgeClass}" title="${tooltipText}">Checks: ${badgeText}</span>`;
    
    return { html, summary };
}

/**
 * Generate PR card HTML
 * @param {Object} pr - PR data object
 * @param {Object} options - Configuration options
 * @param {boolean} options.clickableTitle - Whether PR title should be clickable
 * @param {boolean} options.showLinkIcon - Whether to show separate link icon
 * @param {string} options.clickHandler - Click handler for PR card (if clickableTitle is false)
 * @param {string} options.currentUser - Current user's GitHub username (for highlighting)
 * @param {boolean} options.showMoreInfo - Whether to include More Info expandable section
 * @param {boolean} options.initiallyExpanded - Whether More Info section starts expanded
 * @returns {string} HTML string for PR card
 */
export function generatePRCardHTML(pr, options = {}) {
    const {
        clickableTitle = true,
        showLinkIcon = false,
        clickHandler = null,
        currentUser = null,
        showMoreInfo = false,
        initiallyExpanded = false
    } = options;
    
    // Extract basic PR info
    const createdDate = new Date(pr.created_at).toLocaleDateString();
    const author = pr.user?.login || 'Unknown';
    const title = pr.title || 'No title';
    const url = pr.html_url;
    const prNumber = pr.number;
    const repoName = pr.repository_url ? pr.repository_url.split('/').slice(-2).join('/') : '';
    
    // Determine PR state and styling
    const prState = pr.state === 'closed' ? 
        (pr.merged ? 'merged' : 'closed') : 'open';
    const stateClass = `pr-status-${prState}`;
    const stateText = prState.charAt(0).toUpperCase() + prState.slice(1);
    
    // Process reviewers information
    const reviewerInfo = processReviewers(
        pr.reviews || [], 
        pr.prDetails?.requested_reviewers || pr.requested_reviewers || [], 
        currentUser,
        { repoName, number: prNumber },
        pr.comments || pr.prDetails?.comments || []
    );
    
    // Process checks information
    const checkStatus = processChecks(pr.checkRuns || pr.prDetails?.check_runs || []);
    
    // Check if PR needs rebase
    const needsRebase = pr.prDetails?.mergeable_state === 'dirty' || 
                       pr.prDetails?.mergeable === false ||
                       pr.needsRebase;
    
    // Check if PR is in draft mode
    const isDraft = pr.draft === true || pr.prDetails?.draft === true;
    const draftBadge = isDraft ? '<span class="pr-badge pr-badge-draft">[Draft]</span>' : '';
    
    // Generate title section
    let titleSection;
    if (clickableTitle) {
        titleSection = `<a href="${url}" target="_blank" class="github-pr-title-link">${draftBadge}#${prNumber} ${title}</a>`;
    } else {
        titleSection = `
            <div class="github-pr-title-text">${draftBadge}#${prNumber} ${title}</div>
            ${showLinkIcon ? `
                <a href="${url}" target="_blank" rel="noopener noreferrer" class="pr-external-link" title="Open PR in GitHub">
                    <span>🔗</span>
                </a>
            ` : ''}
        `;
    }
    
    // Filter out repository-specific labels
    const filteredLabels = (pr.labels || [])
        .filter(label => !label.name.includes('RedHatInsights/') && !label.name.includes('uhc-portal'));
    
    // Create unique PR identifier for More Info toggle  
    // Use base64 encoding to avoid parsing issues with repo names containing dashes
    const prId = btoa(`${repoName}:${prNumber}`).replace(/[^a-zA-Z0-9]/g, '');
    
    // Generate card HTML
    const cardClasses = `github-pr-item ${clickHandler ? 'clickable-pr' : ''}`;
    const clickAttributes = clickHandler ? `onclick="${clickHandler}" style="cursor: pointer;"` : '';
    
    return `
        <div class="${cardClasses}" ${clickAttributes}>
            <div class="github-pr-header-row">
                ${titleSection}
                <div class="github-pr-status-row">
                    <span class="github-pr-status ${stateClass}">${stateText}</span>
                </div>
            </div>
            <div class="github-pr-meta">
                <div class="github-pr-meta-left">
                    ${checkStatus.html}
                    ${needsRebase ? '<span class="pr-badge pr-badge-needs-rebase">Needs Rebase</span>' : ''}
                </div>
                <div class="github-pr-meta-right">
                    <span>By <span class="github-pr-author">${author}</span></span>
                    <span>•</span>
                    <span class="github-pr-date">Created: ${createdDate}</span>
                </div>
            </div>
            ${reviewerInfo.html ? `
                <div class="github-pr-reviewers">
                    <span>Reviewers:</span>
                    ${reviewerInfo.html}
                </div>
            ` : ''}
            ${showMoreInfo ? generatePRCollapsible(prId, initiallyExpanded) : ''}
        </div>
    `;
}

/**
 * Fetch PR details including description and comments from GitHub API
 * @param {string} repoName - Repository name in format "owner/repo"
 * @param {number} prNumber - PR number
 * @returns {Promise<Object>} Object containing PR description and comments
 */
export async function fetchPRDetails(repoName, prNumber) {
    const token = appState.apiTokens.github;
    if (!token || !repoName || !prNumber) {
        throw new Error('Missing required parameters for PR details fetch');
    }
    
    try {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };
        
        // Fetch PR details and comments in parallel
        const [prResponse, commentsResponse] = await Promise.all([
            fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}`, { headers }),
            fetch(`https://api.github.com/repos/${repoName}/issues/${prNumber}/comments`, { headers })
        ]);
        
        if (!prResponse.ok || !commentsResponse.ok) {
            throw new Error(`Failed to fetch PR details: ${prResponse.status}/${commentsResponse.status}`);
        }
        
        const prData = await prResponse.json();
        const comments = await commentsResponse.json();
        
        return {
            description: prData.body || '',
            comments: comments || []
        };
        
    } catch (error) {
        console.error('❌ Error fetching PR details:', error);
        throw error;
    }
}

/**
 * Toggle the "More Info" collapsible section for a PR (legacy support)
 * @param {string} prId - Unique PR identifier for the toggle
 */
window.togglePRMoreInfo = function(prId) {
    // Use the shared toggle function
    window.toggleCollapsibleSection(`pr-${prId}`);
};

/**
 * Load PR details (description and comments) into the More Info section
 * @param {string} prId - Unique PR identifier (without "pr-" prefix) 
 * @param {HTMLElement} container - Container element to populate with details
 */
async function loadPRDetails(prId, container) {
    try {
        // Decode the base64 encoded repo:prNumber string
        const decoded = atob(prId);
        const [repoName, prNumberStr] = decoded.split(':');
        const prNumber = parseInt(prNumberStr, 10);
        
        if (!repoName || !prNumber) {
            throw new Error(`Invalid PR ID format: ${prId}`);
        }
    
        console.log(`🔍 Loading PR details for ${repoName}#${prNumber}`);
        container.innerHTML = '<div class="loading">Loading PR details...</div>';
        
        const { description, comments } = await fetchPRDetails(repoName, prNumber);
        
        // Note: GitHub PR "description" is the PR body (what shows as the initial comment)
        // Additional comments are separate from the body
        const descriptionHtml = parseGitHubMarkdown(description || 'No description provided');
        const commentsHtml = formatGitHubCommentsHtml(comments, false);
        
        container.innerHTML = `
            <div class="github-section">
                <label><strong>Description:</strong></label>
                <div class="github-content">
                    ${descriptionHtml}
                </div>
            </div>
            ${commentsHtml}
        `;
        
        container.setAttribute('data-loaded', 'true');
        console.log(`✅ Loaded PR details for ${repoName}#${prNumber}: ${description?.length || 0} chars description, ${comments?.length || 0} comments`);
        
    } catch (error) {
        console.error('❌ Error loading PR details for', repoName, prNumber, ':', error);
        container.innerHTML = `<div class="error">Failed to load PR details: ${error.message}</div>`;
    }
}

// Listen for collapsible section expansion events to load PR details
document.addEventListener('collapsibleExpanded', function(event) {
    const { id, content } = event.detail;
    
    // Only handle PR collapsibles
    if (id.startsWith('pr-')) {
        const prId = id.substring(3); // Remove "pr-" prefix
        const detailsContainer = content.querySelector('.collapsible-inner');
        
        if (detailsContainer && !detailsContainer.hasAttribute('data-loaded')) {
            loadPRDetails(prId, detailsContainer);
        }
    }
});

/**
 * Generate multiple PR cards
 * @param {Array} prs - Array of PR data objects
 * @param {Object} options - Configuration options (same as generatePRCardHTML)
 * @returns {string} HTML string for all PR cards
 */
export function generatePRCardsHTML(prs, options = {}) {
    if (!prs || prs.length === 0) {
        return '<div class="placeholder">No PRs found</div>';
    }
    
    return prs.map(pr => generatePRCardHTML(pr, options)).join('');
}
