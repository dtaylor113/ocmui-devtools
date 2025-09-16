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
 * Sets up split panes for both JIRA and Reviews tabs
 */
export function initializeSplitPanes() {
    // Small delay to ensure DOM elements are fully rendered
    setTimeout(() => {
        initializeJiraSplitPanes();
        initializeReviewsSplitPanes();
    }, 100);
}

/**
 * Initialize split panes for JIRA tab
 */
function initializeJiraSplitPanes() {
    const jiraColumn = document.getElementById('jira-column');
    const githubColumn = document.getElementById('github-column');
    
    console.log('🔧 Initializing JIRA split panes:', {
        jiraColumn: !!jiraColumn,
        githubColumn: !!githubColumn
    });
    
    if (!jiraColumn || !githubColumn) {
        console.error('❌ JIRA split pane elements not found in DOM');
        return;
    }
    
    // Load saved split sizes or use defaults (60% JIRA, 40% GitHub)
    let initialSizes = [60, 40];
    try {
        const savedSizes = localStorage.getItem('ocmui_jira_split_sizes');
        if (savedSizes) {
            const parsedSizes = JSON.parse(savedSizes);
            if (Array.isArray(parsedSizes) && parsedSizes.length === 2) {
                initialSizes = parsedSizes;
                console.log('🔧 Restored JIRA split sizes:', initialSizes);
            }
        }
    } catch (error) {
        console.warn('🔧 Could not restore JIRA split sizes, using defaults:', error);
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
                console.log('🔧 Dragging JIRA split panes:', sizes);
            },
            
            onDragEnd: function(sizes) {
                // Save user's preferred sizes to localStorage
                try {
                    localStorage.setItem('ocmui_jira_split_sizes', JSON.stringify(sizes));
                    console.log('🔧 JIRA split sizes saved:', sizes);
                } catch (error) {
                    console.warn('🔧 Could not save JIRA split sizes:', error);
                }
            }
        });
        
        console.log('✅ JIRA Split.js initialized successfully');
        return splitInstance;
        
    } catch (error) {
        console.error('❌ JIRA Split.js initialization failed:', error);
    }
}

/**
 * Initialize split panes for Reviews tab
 */
function initializeReviewsSplitPanes() {
    const reviewsPrsColumn = document.getElementById('reviews-prs-column');
    const reviewsJiraColumn = document.getElementById('reviews-jira-column');
    
    console.log('🔧 Initializing Reviews split panes:', {
        reviewsPrsColumn: !!reviewsPrsColumn,
        reviewsJiraColumn: !!reviewsJiraColumn
    });
    
    if (!reviewsPrsColumn || !reviewsJiraColumn) {
        console.error('❌ Reviews split pane elements not found in DOM');
        return;
    }
    
    // Load saved split sizes or use defaults (50% PRs, 50% JIRAs)
    let initialSizes = [50, 50];
    try {
        const savedSizes = localStorage.getItem('ocmui_reviews_split_sizes');
        if (savedSizes) {
            const parsedSizes = JSON.parse(savedSizes);
            if (Array.isArray(parsedSizes) && parsedSizes.length === 2) {
                initialSizes = parsedSizes;
                console.log('🔧 Restored Reviews split sizes:', initialSizes);
            }
        }
    } catch (error) {
        console.warn('🔧 Could not restore Reviews split sizes, using defaults:', error);
    }
    
    try {
        // Initialize Split.js with configuration
        const splitInstance = Split(['#reviews-prs-column', '#reviews-jira-column'], {
            sizes: initialSizes,
            minSize: 300,           // Minimum 300px for each pane
            gutterSize: 8,          // 8px drag handle width
            cursor: 'col-resize',   // Cursor style when hovering gutter
            direction: 'horizontal',
            snapOffset: 30,         // Snap to edges within 30px
            dragInterval: 1,        // Update every 1px for smooth dragging
            
            // Event handlers
            onDrag: function(sizes) {
                console.log('🔧 Dragging Reviews split panes:', sizes);
            },
            
            onDragEnd: function(sizes) {
                // Save user's preferred sizes to localStorage
                try {
                    localStorage.setItem('ocmui_reviews_split_sizes', JSON.stringify(sizes));
                    console.log('🔧 Reviews split sizes saved:', sizes);
                } catch (error) {
                    console.warn('🔧 Could not save Reviews split sizes:', error);
                }
            }
        });
        
        console.log('✅ Reviews Split.js initialized successfully');
        return splitInstance;
        
    } catch (error) {
        console.error('❌ Reviews Split.js initialization failed:', error);
    }
}

/**
 * Initialize Split.js for My PRs tab
 * Sets up the resizable split pane layout for My PRs
 * @returns {object} Split.js instance or null if failed
 */
export function initializeMyPrsSplitPanes() {
    console.log('🔧 Initializing My PRs Split.js...');
    
    try {
        const container = document.getElementById('my-prs-split-container');
        if (!container) {
            console.warn('🔧 My PRs split container not found');
            return null;
        }
        
        // Get the split pane elements
        const myPrsColumn = document.getElementById('my-prs-column');
        const myPrsJiraColumn = document.getElementById('my-prs-jira-column');
        
        if (!myPrsColumn || !myPrsJiraColumn) {
            console.warn('🔧 My PRs split pane elements not found');
            return null;
        }
        
        // Try to load saved sizes from localStorage
        let sizes = [50, 50]; // Default 50/50 split
        try {
            const savedSizes = localStorage.getItem('ocmui_my_prs_split_sizes');
            if (savedSizes) {
                sizes = JSON.parse(savedSizes);
                console.log('🔧 Loaded My PRs split sizes from storage:', sizes);
            }
        } catch (error) {
            console.warn('🔧 Could not load My PRs split sizes:', error);
        }
        
        // Initialize Split.js
        const splitInstance = Split(['#my-prs-column', '#my-prs-jira-column'], {
            sizes: sizes,              // Use saved or default sizes
            minSize: 300,              // Minimum width for each pane
            gutterSize: 8,             // Width of the drag handle
            cursor: 'col-resize',      // Cursor when hovering over gutter
            direction: 'horizontal',   // Split horizontally (left/right)
            
            // Snap settings for better UX
            snapOffset: 30,         // Snap to edges within 30px
            dragInterval: 1,        // Update every 1px for smooth dragging
            
            // Event handlers
            onDrag: function(sizes) {
                console.log('🔧 Dragging My PRs split panes:', sizes);
            },
            
            onDragEnd: function(sizes) {
                // Save user's preferred sizes to localStorage
                try {
                    localStorage.setItem('ocmui_my_prs_split_sizes', JSON.stringify(sizes));
                    console.log('🔧 My PRs split sizes saved:', sizes);
                } catch (error) {
                    console.warn('🔧 Could not save My PRs split sizes:', error);
                }
            }
        });
        
        console.log('✅ My PRs Split.js initialized successfully');
        return splitInstance;
        
    } catch (error) {
        console.error('❌ My PRs Split.js initialization failed:', error);
    }
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
    
    // Reset right panel when switching to My Code Reviews tab
    if (tabName === 'reviews') {
        const reviewsJiraContent = document.getElementById('reviews-jira-content');
        if (reviewsJiraContent) {
            showPlaceholderState('reviews-jira-content', 
                'Associated JIRAs will be loaded here...', 
                '📝');
        }
    }
    
    // Reset right panel when switching to My PRs tab
    if (tabName === 'my-prs') {
        const myPrsJiraContent = document.getElementById('my-prs-jira-content');
        if (myPrsJiraContent) {
            showPlaceholderState('my-prs-jira-content', 
                'Associated JIRAs will be loaded here...', 
                '📝');
        }
    }
    
    // Cancel any ongoing My PRs API calls when navigating away
    if (tabName !== 'my-prs' && window.cancelMyPRsRequests) {
        window.cancelMyPRsRequests();
    }
    
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

/**
 * Update column titles with GitHub username
 * Personalizes column titles to show the actual GitHub username (keeps nav tabs unchanged)
 */
export function updateTabTitlesWithUsername() {
    // Get username from app state via the debug interface
    let username = null;
    
    // Try to get username from debug interface first
    if (window.OCMUIDebug?.appState?.apiTokens?.githubUsername) {
        username = window.OCMUIDebug.appState.apiTokens.githubUsername;
    } else {
        // Fallback: try to import and access directly
        try {
            // Since this might run before app state is available on debug interface,
            // we can try accessing localStorage directly as a fallback
            const storedTokens = localStorage.getItem('ocmui_api_tokens');
            if (storedTokens) {
                const tokens = JSON.parse(storedTokens);
                username = tokens.githubUsername;
            }
        } catch (error) {
            console.warn('⚠️ Could not access GitHub username for title update:', error);
        }
    }
    
    if (!username) {
        console.log('🔄 No GitHub username configured, keeping default titles');
        return;
    }
    
    console.log(`🔄 Updating column titles with username: ${username}`);
    
    // Keep nav tabs as-is, only update column titles
    
    // Update "PRs I'm Reviewing" column title
    const reviewingTitle = document.querySelector('#reviews-prs-column .column-title');
    if (reviewingTitle) {
        const icon = reviewingTitle.querySelector('img');
        reviewingTitle.innerHTML = '';
        if (icon) {
            reviewingTitle.appendChild(icon);
        }
        reviewingTitle.appendChild(document.createTextNode(`PRs ${username} is Reviewing`));
        console.log('✅ Updated My Code Reviews column title');
    }
    
    // Update "My PRs" column title
    const myPrsTitle = document.querySelector('#my-prs-column .column-title');
    if (myPrsTitle) {
        const icon = myPrsTitle.querySelector('img');
        myPrsTitle.innerHTML = '';
        if (icon) {
            myPrsTitle.appendChild(icon);
        }
        myPrsTitle.appendChild(document.createTextNode(`PRs created by ${username}`));
        console.log('✅ Updated My PRs column title');
    }
    
    console.log('✅ Column titles updated successfully');
}
