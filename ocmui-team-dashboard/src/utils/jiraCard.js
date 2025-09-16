/**
 * Shared JIRA Card Component
 * 
 * Provides consistent JIRA ticket display formatting across all components.
 * Used by both the JIRA tab and Reviews tab's associated JIRA display.
 */

import { parseJiraMarkdown, getBadgeClass } from './formatting.js';
import { generateJiraCollapsible } from './collapsibleSection.js';

/**
 * Format JIRA comments for HTML display
 * @param {Array} comments - Array of comment objects
 * @param {boolean} showEmptyState - Whether to show empty state message when no comments
 * @returns {string} HTML string for comments display
 */
export function formatCommentsHtml(comments, showEmptyState = true) {
    if (!comments || comments.length === 0) {
        if (showEmptyState) {
            return '<div class="jira-section"><label><strong>Comments:</strong></label><div class="jira-content"><div class="no-comments">No comments yet</div></div></div>';
        } else {
            return '';
        }
    }
    
    const commentsHtml = comments.map(comment => {
        const date = new Date(comment.created).toLocaleDateString();
        const author = comment.author || 'Unknown';
        const body = parseJiraMarkdown(comment.body || '');
        
        return `
            <div class="comment">
                <div class="comment-header">${author} - ${date}</div>
                <div class="comment-body">${body}</div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="jira-section">
            <label><strong>Comments:</strong></label>
            <div class="jira-content">
                ${commentsHtml}
            </div>
        </div>
    `;
}

/**
 * Generate JIRA ticket card HTML
 * @param {Object} ticket - JIRA ticket data object
 * @param {Object} options - Configuration options
 * @param {boolean} options.collapsible - Whether description/comments should be collapsible
 * @param {boolean} options.wrapInSection - Whether to wrap in jira-ticket-section div
 * @param {boolean} options.initiallyExpanded - Whether collapsible section starts expanded (if collapsible)
 * @param {string} options.toggleFunction - Function name for collapsible toggle (if collapsible)
 * @returns {string} HTML string for JIRA ticket card
 */
export function generateJiraCardHTML(ticket, options = {}) {
    const {
        collapsible = false,
        wrapInSection = false,
        initiallyExpanded = false,
        toggleFunction = 'toggleJiraMoreInfo'
    } = options;
    
    if (!ticket || !ticket.key) {
        return '<div class="jira-error">Invalid ticket data</div>';
    }
    
    // Generate badge classes for styling
    const typeClass = getBadgeClass('type', ticket.type);
    const priorityClass = getBadgeClass('priority', ticket.priority);  
    const statusClass = getBadgeClass('status', ticket.status);
    
    // Format comments for display
    const commentsHtml = formatCommentsHtml(ticket.comments, !collapsible);
    
    // Generate the core ticket HTML
    const ticketContent = `
        <div class="jira-ticket">
            <div class="jira-header">
                <h3>
                    <a href="https://issues.redhat.com/browse/${ticket.key}" target="_blank" 
                       style="color: white; text-decoration: underline;">
                        ${ticket.key}: ${ticket.summary || 'No summary available'}
                    </a>
                </h3>
            </div>
            <div class="jira-details-grid">
                <div class="detail-left">
                    <p><strong>Type:</strong><span class="badge badge-type ${typeClass}">${ticket.type || 'Unknown'}</span></p>
                    <p><strong>Priority:</strong><span class="badge badge-priority badge-priority-${priorityClass}">${ticket.priority || 'Unknown'}</span></p>
                    <p><strong>Status:</strong><span class="badge badge-status ${statusClass}">${ticket.status || 'Unknown'}</span></p>
                </div>
                <div class="detail-right">
                    <p><strong>Assignee:</strong><span>${ticket.assignee || 'Unassigned'}</span></p>
                    <p><strong>Reporter:</strong><span>${ticket.reporter || 'Unknown'}</span></p>
                    <p><strong>Created:</strong><span>${ticket.created ? new Date(ticket.created).toLocaleDateString() : 'Unknown'}</span></p>
                </div>
            </div>
            ${collapsible ? generateJiraCollapsible(
                ticket.key,
                initiallyExpanded,
                parseJiraMarkdown(ticket.description || 'No description available'),
                commentsHtml
            ) : `
                <div class="jira-section">
                    <label><strong>Description:</strong></label>
                    <div class="jira-content">${parseJiraMarkdown(ticket.description || 'No description available')}</div>
                </div>
                ${commentsHtml}
            `}
        </div>
    `;
    
    // Wrap in section if requested
    if (wrapInSection) {
        return `
            <div class="jira-ticket-section" data-jira-id="${ticket.key}">
                ${ticketContent}
            </div>
        `;
    }
    
    return ticketContent;
}

/**
 * Generate multiple JIRA ticket cards
 * @param {Array} tickets - Array of JIRA ticket data objects  
 * @param {Object} options - Configuration options (same as generateJiraCardHTML)
 * @returns {string} HTML string for all JIRA ticket cards
 */
export function generateJiraCardsHTML(tickets, options = {}) {
    if (!tickets || tickets.length === 0) {
        return '<div class="placeholder">No JIRA tickets found</div>';
    }
    
    return tickets.map(ticket => generateJiraCardHTML(ticket, options)).join('');
}

/**
 * Generate JIRA cards from result objects (with ticket property)
 * @param {Array} results - Array of result objects with ticket property
 * @param {Object} options - Configuration options (same as generateJiraCardHTML)
 * @returns {string} HTML string for all JIRA ticket cards
 */
export function generateJiraCardsFromResults(results, options = {}) {
    if (!results || results.length === 0) {
        return '<div class="placeholder">No JIRA tickets found</div>';
    }
    
    const tickets = results.map(result => result.ticket).filter(ticket => ticket);
    return generateJiraCardsHTML(tickets, options);
}
