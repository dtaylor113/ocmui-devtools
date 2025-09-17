/**
 * Shared Collapsible Section Component
 * 
 * Provides consistent collapsible "More Info" sections for both
 * JIRA tickets and GitHub PR cards with unified styling and behavior.
 */

/**
 * Generate a collapsible section HTML
 * @param {Object} options - Configuration options
 * @param {string} options.id - Unique identifier for the collapsible section
 * @param {string} options.title - Title text for the toggle button (default: "More Info")
 * @param {boolean} options.initiallyExpanded - Whether section starts expanded
 * @param {string} options.toggleFunction - JavaScript function name to call on toggle
 * @param {string} options.contentHtml - HTML content to display when expanded
 * @param {string} options.placeholderText - Placeholder text when content not loaded
 * @returns {string} HTML string for collapsible section
 */
export function generateCollapsibleSection(options = {}) {
    const {
        id,
        title = 'More Info',
        initiallyExpanded = false,
        toggleFunction = 'toggleCollapsibleSection',
        contentHtml = '',
        placeholderText = 'Click to load details...'
    } = options;
    
    if (!id) {
        console.error('Collapsible section requires an ID');
        return '';
    }
    
    const displayContent = contentHtml || `<div class="placeholder">${placeholderText}</div>`;
    
    return `
        <div class="collapsible-section">
            <button class="collapsible-toggle" onclick="${toggleFunction}('${id}')">
                <span class="toggle-icon">${initiallyExpanded ? '▼' : '▶'}</span>
                <span class="toggle-text">${title}</span>
            </button>
            <div class="collapsible-content ${initiallyExpanded ? 'expanded' : ''}" id="collapsible-${id}">
                <div class="collapsible-inner">
                    ${displayContent}
                </div>
            </div>
        </div>
    `;
}

/**
 * Universal toggle function for collapsible sections
 * @param {string} id - Unique identifier of the section to toggle
 */
window.toggleCollapsibleSection = function(id) {
    const content = document.getElementById(`collapsible-${id}`);
    const toggle = document.querySelector(`[onclick="toggleCollapsibleSection('${id}')"]`);

    if (!content || !toggle) {
        console.warn('Toggle elements not found for collapsible section:', id);
        return;
    }

    const isExpanded = content.classList.contains('expanded');

    // Toggle collapsible content

    const icon = toggle.querySelector('.toggle-icon');

    if (isExpanded) {
        // COLLAPSING
        content.classList.remove('expanded');
        if (icon) icon.textContent = '▶';
    } else {
        // EXPANDING  
        content.classList.add('expanded');
        if (icon) icon.textContent = '▼';

        // Emit custom event for lazy loading
        const event = new CustomEvent('collapsibleExpanded', {
            detail: { id, content }
        });
        document.dispatchEvent(event);
    }
};

/**
 * Generate collapsible section for JIRA tickets
 * @param {string} ticketKey - JIRA ticket key (e.g., "OCMUI-1234")
 * @param {boolean} initiallyExpanded - Whether section starts expanded
 * @param {string} descriptionHtml - HTML for ticket description
 * @param {string} commentsHtml - HTML for ticket comments
 * @param {string} toggleFunction - Function name for toggle handler
 * @returns {string} HTML string for JIRA collapsible section
 */
export function generateJiraCollapsible(ticketKey, initiallyExpanded = false, descriptionHtml = '', commentsHtml = '', toggleFunction = 'toggleCollapsibleSection', context = '') {
    const contentHtml = descriptionHtml || commentsHtml ? `
        <div class="jira-section">
            <label><strong>Description:</strong></label>
            <div class="jira-content">
                ${descriptionHtml || 'No description available'}
            </div>
        </div>
        ${commentsHtml}
    ` : '';
    
    // Generate unique ID per context to prevent collisions across tabs
    const uniqueId = context ? `jira-${context}-${ticketKey}` : `jira-${ticketKey}`;
    
    return generateCollapsibleSection({
        id: uniqueId,
        title: 'More Info',
        initiallyExpanded,
        toggleFunction,
        contentHtml,
        placeholderText: 'Click to load JIRA details...'
    });
}

/**
 * Generate collapsible section for GitHub PRs
 * @param {string} prId - Unique PR identifier
 * @param {boolean} initiallyExpanded - Whether section starts expanded
 * @param {string} descriptionHtml - HTML for PR description
 * @param {string} commentsHtml - HTML for PR comments
 * @returns {string} HTML string for PR collapsible section
 */
export function generatePRCollapsible(prId, initiallyExpanded = false, descriptionHtml = '', commentsHtml = '') {
    const contentHtml = descriptionHtml || commentsHtml ? `
        <div class="github-section">
            <label><strong>Description:</strong></label>
            <div class="github-content">
                ${descriptionHtml || 'No description available'}
            </div>
        </div>
        ${commentsHtml}
    ` : '';
    
    return generateCollapsibleSection({
        id: `pr-${prId}`,
        title: 'More Info',
        initiallyExpanded,
        toggleFunction: 'toggleCollapsibleSection',
        contentHtml,
        placeholderText: 'Click to load PR details...'
    });
}

/**
 * Legacy JIRA toggle function (maintains backward compatibility)
 * @param {string} ticketKey - JIRA ticket key
 */
window.toggleJiraMoreInfo = function(ticketKey) {
    window.toggleCollapsibleSection(`jira-${ticketKey}`);
};

/**
 * Legacy PR toggle function (maintains backward compatibility)
 * @param {string} prId - PR identifier
 */
window.togglePRMoreInfo = function(prId) {
    window.toggleCollapsibleSection(`pr-${prId}`);
};
