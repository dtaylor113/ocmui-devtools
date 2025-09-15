/**
 * Formatting and Text Processing Utilities
 * 
 * Provides text formatting, markdown parsing, and styling utilities
 * for consistent display of content throughout the application.
 */

/**
 * Parse JIRA wiki markup into HTML
 * Converts JIRA's specific markup syntax to HTML for proper display
 * 
 * @param {string} text - Raw JIRA wiki markup text
 * @returns {string} HTML-formatted text
 */
export function parseJiraMarkdown(text) {
    if (!text) return '';
    
    let html = text;
    
    // Convert JIRA-style headers (h1. h2. h3. etc.)
    html = html.replace(/^h([1-6])\.\s*(.+)$/gm, '<h$1>$2</h$1>');
    
    // Convert JIRA color tags: {color:#hexcode}text{color}
    html = html.replace(/\{color:(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|[a-zA-Z]+)\}([^{}]*?)\{color\}/g, 
        '<span style="color: $1">$2</span>');
    
    // Convert text formatting
    html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');  // Bold: *text*
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');            // Italic: _text_
    html = html.replace(/\+([^+]+)\+/g, '<u>$1</u>');           // Underline: +text+
    html = html.replace(/-([^-]+)-/g, '<del>$1</del>');         // Strikethrough: -text-
    
    // Convert links: [text|url] or [url]
    html = html.replace(/\[([^|\]]+)\|([^\]]+)\]/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/\[([^\]]+)\]/g, '<a href="$1" target="_blank">$1</a>');
    
    // Convert lists
    html = html.replace(/^(\*+)\s*(.+)$/gm, (match, bullets, text) => {
        const level = bullets.length;
        return `<ul><li style="margin-left: ${(level-1) * 20}px">${text}</li></ul>`;
    });
    
    html = html.replace(/^(#+)\s*(.+)$/gm, (match, numbers, text) => {
        const level = numbers.length;
        return `<ol><li style="margin-left: ${(level-1) * 20}px">${text}</li></ol>`;
    });
    
    // Convert code blocks: {code}...{code}
    html = html.replace(/\{code(?:[^}]*)?\}([\s\S]*?)\{code\}/g, '<pre><code>$1</code></pre>');
    
    // Convert inline code: {{text}}
    html = html.replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>');
    
    // Convert line breaks
    html = html.replace(/\r?\n/g, '<br>');
    
    // Clean up consecutive list items
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    html = html.replace(/<\/ol>\s*<ol>/g, '');
    
    return html;
}

/**
 * Get appropriate CSS badge class for JIRA field types
 * Provides consistent styling for JIRA issue types, priorities, and statuses
 * 
 * @param {string} type - The field type ('type', 'priority', 'status')
 * @param {string} value - The field value to get class for
 * @returns {string} CSS class name for styling
 */
export function getBadgeClass(type, value) {
    if (!value) return '';
    
    const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    switch (type) {
        case 'type':
            return getIssueTypeBadgeClass(normalizedValue);
        case 'priority':
            return getPriorityBadgeClass(normalizedValue);
        case 'status':
            return getStatusBadgeClass(normalizedValue);
        default:
            return '';
    }
}

/**
 * Get badge class for JIRA issue types
 * @param {string} issueType - Normalized issue type string
 * @returns {string} CSS class for issue type styling
 */
function getIssueTypeBadgeClass(issueType) {
    const typeMap = {
        'story': 'story',
        'feature': 'feature', 
        'bug': 'bug',
        'task': 'task',
        'outcome': 'outcome',
        'epic': 'epic',
        'subtask': 'task'
    };
    
    return typeMap[issueType] || 'task';
}

/**
 * Get badge class for JIRA priorities
 * @param {string} priority - Normalized priority string
 * @returns {string} CSS class for priority styling
 */
function getPriorityBadgeClass(priority) {
    const priorityMap = {
        'blocker': 'blocker',
        'critical': 'critical',
        'major': 'major',
        'normal': 'normal',
        'minor': 'minor',
        'trivial': 'trivial',
        'undefined': 'normal'
    };
    
    return priorityMap[priority] || 'normal';
}

/**
 * Get badge class for JIRA statuses
 * @param {string} status - Normalized status string
 * @returns {string} CSS class for status styling
 */
function getStatusBadgeClass(status) {
    const statusMap = {
        'todo': 'todo',
        'open': 'todo',
        'new': 'todo',
        'inprogress': 'inprogress',
        'indevelopment': 'inprogress',
        'codereview': 'codereview',
        'review': 'review',
        'testing': 'review',
        'closed': 'closed',
        'done': 'closed',
        'resolved': 'closed'
    };
    
    return statusMap[status] || 'todo';
}

/**
 * Format a date string for consistent display
 * @param {string|Date} dateInput - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(dateInput) {
    if (!dateInput) return 'Unknown';
    
    try {
        const date = new Date(dateInput);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short', 
            day: 'numeric'
        });
    } catch (error) {
        console.warn('Date formatting error:', error);
        return 'Invalid Date';
    }
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text || '';
    
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Extract JIRA ID components (prefix and number)
 * @param {string} jiraId - Full JIRA ID (e.g., "OCMUI-1234")
 * @returns {Object|null} Object with prefix and number, or null if invalid
 */
export function parseJiraId(jiraId) {
    if (!jiraId || typeof jiraId !== 'string') return null;
    
    const match = jiraId.match(/^([A-Z]+-)(\d+)$/);
    if (!match) return null;
    
    return {
        prefix: match[1],
        number: match[2],
        full: jiraId
    };
}

/**
 * Validate JIRA ID format
 * @param {string} jiraId - JIRA ID to validate
 * @returns {boolean} True if valid JIRA ID format
 */
export function isValidJiraId(jiraId) {
    return parseJiraId(jiraId) !== null;
}

/**
 * Format GitHub username for display
 * @param {string} username - GitHub username
 * @returns {string} Formatted username with @ prefix
 */
export function formatGithubUsername(username) {
    if (!username) return 'Unknown';
    return username.startsWith('@') ? username : `@${username}`;
}

/**
 * Get relative time string (e.g., "2 days ago")
 * @param {string|Date} dateInput - Date to calculate relative time for
 * @returns {string} Relative time string
 */
export function getRelativeTime(dateInput) {
    if (!dateInput) return 'Unknown';
    
    try {
        const date = new Date(dateInput);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        if (diffDays > 7) {
            return formatDate(date);
        } else if (diffDays > 0) {
            return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        } else {
            return 'Just now';
        }
    } catch (error) {
        console.warn('Relative time calculation error:', error);
        return 'Unknown';
    }
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Basic sanitization for user-generated content
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
    if (!html) return '';
    
    // Basic XSS prevention - remove script tags and javascript: protocols
    let sanitized = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // Remove event handlers
    
    return sanitized;
}
