/**
 * UI Utilities and Components
 * 
 * Provides reusable UI functionality including loading states,
 * split panes, and other interactive components used throughout
 * the application.
 */

import Split from 'split.js';

/**
 * Initialize split panes for resizable columns
 * Sets up the JIRA/GitHub column splitter with persistent sizing
 */
export function initializeSplitPanes() {
    // Small delay to ensure DOM elements are fully rendered
    setTimeout(() => {
        const jiraColumn = document.getElementById('jira-column');
        const githubColumn = document.getElementById('github-column');
        
        console.log('🔧 Initializing split panes:', {
            jiraColumn: !!jiraColumn,
            githubColumn: !!githubColumn
        });
        
        if (!jiraColumn || !githubColumn) {
            console.error('❌ Split pane elements not found in DOM');
            return;
        }
        
        // Load saved split sizes or use defaults (60% JIRA, 40% GitHub)
        let initialSizes = [60, 40];
        try {
            const savedSizes = localStorage.getItem('ocmui_split_sizes');
            if (savedSizes) {
                const parsedSizes = JSON.parse(savedSizes);
                if (Array.isArray(parsedSizes) && parsedSizes.length === 2) {
                    initialSizes = parsedSizes;
                    console.log('🔧 Restored saved split sizes:', initialSizes);
                }
            }
        } catch (error) {
            console.warn('🔧 Could not restore split sizes, using defaults:', error);
        }
        
        try {
            // Initialize Split.js with configuration
            const splitInstance = Split(['#jira-column', '#github-column'], {
                sizes: initialSizes,
                minSize: 300,           // Minimum 300px for each pane
                gutterSize: 8,          // 8px drag handle width
                cursor: 'col-resize',   // Cursor style when hovering gutter
                direction: 'horizontal',
                snapOffset: 30,         // Snap to edges within 30px
                dragInterval: 1,        // Update every 1px for smooth dragging
                
                // Event handlers
                onDrag: function(sizes) {
                    // Optional: Add real-time feedback during drag
                    console.log('🔧 Dragging split panes:', sizes);
                },
                
                onDragEnd: function(sizes) {
                    // Save user's preferred sizes to localStorage
                    try {
                        localStorage.setItem('ocmui_split_sizes', JSON.stringify(sizes));
                        console.log('🔧 Split sizes saved:', sizes);
                    } catch (error) {
                        console.warn('🔧 Could not save split sizes:', error);
                    }
                }
            });
            
            console.log('✅ Split.js initialized successfully');
            return splitInstance;
            
        } catch (error) {
            console.error('❌ Split.js initialization failed:', error);
        }
    }, 100);
}

/**
 * Show loading state in the JIRA display area
 * @param {string} message - Loading message to display
 */
export function showLoadingState(message = 'Loading...') {
    const jiraDisplay = document.getElementById('jiraTicketDisplay');
    if (jiraDisplay) {
        jiraDisplay.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <span>${message}</span>
            </div>
        `;
    }
}

/**
 * Show error state in a specified container
 * @param {string} containerId - ID of container element
 * @param {string} message - Error message to display
 * @param {string} details - Optional error details
 */
export function showErrorState(containerId, message, details = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const detailsHtml = details ? `<div class="error-details">${details}</div>` : '';
    container.innerHTML = `
        <div class="error">
            <div class="error-message">${message}</div>
            ${detailsHtml}
        </div>
    `;
}

/**
 * Show placeholder state in a container
 * @param {string} containerId - ID of container element  
 * @param {string} message - Placeholder message to display
 * @param {string} icon - Optional icon to display
 */
export function showPlaceholderState(containerId, message, icon = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const iconHtml = icon ? `<div class="placeholder-icon">${icon}</div>` : '';
    container.innerHTML = `
        <div class="placeholder">
            ${iconHtml}
            <div class="placeholder-message">${message}</div>
        </div>
    `;
}

/**
 * Initialize tab navigation functionality
 * Sets up tab switching and maintains active state
 */
export function initializeTabNavigation() {
    const tabButtons = document.querySelectorAll('.nav-tab');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

/**
 * Switch to a specific tab
 * @param {string} tabName - Name of tab to switch to ('jira', 'reviews', 'my-prs')
 */
export function switchTab(tabName) {
    // Update tab button states
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    
    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`)?.classList.add('active');
    
    console.log('📑 Switched to tab:', tabName);
}

/**
 * Create a notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
 * @param {number} duration - Display duration in milliseconds
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
    
    console.log(`📢 Notification [${type}]: ${message}`);
}

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Throttle function to limit function call frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showNotification('Copied to clipboard!', 'success', 2000);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (success) {
                showNotification('Copied to clipboard!', 'success', 2000);
            } else {
                showNotification('Copy failed - please copy manually', 'error');
            }
            return success;
        }
    } catch (error) {
        console.error('Copy to clipboard failed:', error);
        showNotification('Copy failed - please copy manually', 'error');
        return false;
    }
}

/**
 * Format and highlight search terms in text
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Term to highlight
 * @returns {string} HTML with highlighted search terms
 */
export function highlightSearchTerm(text, searchTerm) {
    if (!text || !searchTerm) return text || '';
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Smooth scroll to element
 * @param {string|Element} target - Element or selector to scroll to
 * @param {number} offset - Offset from top in pixels
 */
export function smoothScrollTo(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;
    
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetTop = elementTop - offset;
    
    window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
    });
}

/**
 * Check if element is visible in viewport
 * @param {Element} element - Element to check
 * @param {number} threshold - Percentage of element that must be visible (0-1)
 * @returns {boolean} True if element is visible
 */
export function isElementVisible(element, threshold = 0.1) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const elementHeight = rect.bottom - rect.top;
    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    
    return visibleHeight >= elementHeight * threshold;
}
