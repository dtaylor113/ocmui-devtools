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
    
    // First, preserve code blocks to prevent them from being processed
    const codeBlocks = [];
    html = html.replace(/\{code(?:[^}]*)?\}([\s\S]*?)\{code\}/g, (match, code) => {
        codeBlocks.push(code);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    
    // Preserve inline code
    const inlineCodes = [];
    html = html.replace(/\{\{([^}]+)\}\}/g, (match, code) => {
        inlineCodes.push(code);
        return `__INLINE_CODE_${inlineCodes.length - 1}__`;
    });
    
    // Convert JIRA-style headers (h1. h2. h3. etc.)
    html = html.replace(/^h([1-6])\.\s*(.+)$/gm, '<h$1>$2</h$1>');
    
    // Convert JIRA color tags: {color:#hexcode}text{color} - more careful matching
    html = html.replace(/\{color:(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|[a-zA-Z]+)\}([^{}]*?)\{color\}/g, 
        '<span style="color: $1">$2</span>');
    
    // Remove any remaining empty JIRA tags
    html = html.replace(/\{[^}]*\}/g, '');
    
    // Convert text formatting - be more careful with delimiters
    html = html.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');  // Bold: *text*
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');            // Italic: _text_
    html = html.replace(/\+([^+\n]+)\+/g, '<u>$1</u>');           // Underline: +text+
    
    // More careful strikethrough - only if surrounded by spaces or at start/end
    html = html.replace(/(?:^|[\s])-([^-\n]+)-(?=[\s]|$)/g, (match, text) => {
        return match.replace(`-${text}-`, `<del>${text}</del>`);
    });
    
    // Convert links: [text|url] or [url] - but not if they look like invalid brackets
    html = html.replace(/\[([^|\]]+)\|([^\]]+)\]/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/\[([^\]]+)\]/g, (match, content) => {
        // Only convert if it looks like a URL or valid link
        if (content.includes('http') || content.includes('.com') || content.includes('.org')) {
            return `<a href="${content}" target="_blank">${content}</a>`;
        }
        return match; // Leave as is if not URL-like
    });
    
    // Convert lists
    html = html.replace(/^(\*+)\s*(.+)$/gm, (match, bullets, text) => {
        const level = bullets.length;
        return `<ul><li style="margin-left: ${(level-1) * 20}px">${text}</li></ul>`;
    });
    
    html = html.replace(/^(#+)\s*(.+)$/gm, (match, numbers, text) => {
        const level = numbers.length;
        return `<ol><li style="margin-left: ${(level-1) * 20}px">${text}</li></ol>`;
    });
    
    // Restore code blocks
    codeBlocks.forEach((code, index) => {
        html = html.replace(`__CODE_BLOCK_${index}__`, `<pre><code>${code}</code></pre>`);
    });
    
    // Restore inline code
    inlineCodes.forEach((code, index) => {
        html = html.replace(`__INLINE_CODE_${index}__`, `<code>${code}</code>`);
    });
    
    // Convert line breaks
    html = html.replace(/\r?\n/g, '<br>');
    
    // Clean up consecutive list items
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    html = html.replace(/<\/ol>\s*<ol>/g, '');
    
    // Clean up any remaining empty brackets
    html = html.replace(/\[\s*\]/g, '');
    html = html.replace(/\{\s*\}/g, '');
    
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

/**
 * Parse GitHub markdown to HTML
 * Uses the marked library to convert GitHub Flavored Markdown to HTML
 * @param {string} markdown - Raw markdown text
 * @returns {string} HTML string
 */
export function parseGitHubMarkdown(markdown) {
    if (!markdown) return '';
    
    try {
        // Import marked dynamically to handle ES modules in browser environment
        if (typeof window !== 'undefined' && window.marked) {
            const marked = window.marked;
            
            // Configure marked for GitHub Flavored Markdown
            marked.setOptions({
                breaks: true,          // Convert line breaks to <br>
                gfm: true,            // GitHub Flavored Markdown
                sanitize: false,      // Don't sanitize HTML (we trust GitHub content)
                smartLists: true,     // Better list handling
                smartypants: false    // Don't convert quotes/dashes
            });
            
            return marked(markdown);
        } else {
            // Fallback: basic markdown-like parsing
            return parseBasicMarkdown(markdown);
        }
    } catch (error) {
        console.error('❌ GitHub markdown parsing error:', error);
        return parseBasicMarkdown(markdown);
    }
}

// Make parseGitHubMarkdown available globally for reviewer comments popup  
if (typeof window !== 'undefined') {
    window.parseGitHubMarkdown = parseGitHubMarkdown;
}

/**
 * Basic markdown parser as fallback when marked library is not available
 * @param {string} markdown - Raw markdown text
 * @returns {string} HTML string
 */
function parseBasicMarkdown(markdown) {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Code blocks
    html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Line breaks
    html = html.replace(/\r?\n/g, '<br>');
    
    return html;
}

/**
 * Format GitHub comments for HTML display
 * @param {Array} comments - Array of GitHub comment objects
 * @param {boolean} showEmptyState - Whether to show empty state message when no comments
 * @returns {string} HTML string for comments display
 */
export function formatGitHubCommentsHtml(comments, showEmptyState = true) {
    if (!comments || comments.length === 0) {
        if (showEmptyState) {
            return '<div class="github-section"><label><strong>Comments:</strong></label><div class="github-content"><div class="no-comments">No comments yet</div></div></div>';
        } else {
            return '';
        }
    }
    
    // Sort comments by creation date (most recent first)
    const sortedComments = [...comments].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
    );
    
    const commentsHtml = sortedComments.map(comment => {
        const date = new Date(comment.created_at).toLocaleDateString();
        const author = comment.user?.login || 'Unknown';
        const body = parseGitHubMarkdown(comment.body || '');
        
        return `
            <div class="comment">
                <div class="comment-header">${author} - ${date}</div>
                <div class="comment-body">${body}</div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="github-section">
            <label><strong>Comments:</strong></label>
            <div class="github-content">
                ${commentsHtml}
            </div>
        </div>
    `;
}
