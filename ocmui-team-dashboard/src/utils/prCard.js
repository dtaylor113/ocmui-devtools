/**
 * Shared PR Card Component
 * 
 * Provides consistent PR display formatting across all components.
 * Used by both the Reviews tab and JIRA tab's GitHub PR display.
 */

import { processReviewers } from './reviewerUtils.js';

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
 * @returns {string} HTML string for PR card
 */
export function generatePRCardHTML(pr, options = {}) {
    const {
        clickableTitle = true,
        showLinkIcon = false,
        clickHandler = null,
        currentUser = null
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
        currentUser
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
        </div>
    `;
}

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
