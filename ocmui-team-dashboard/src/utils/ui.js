/**
 * UI Utilities and Components
 * 
 * Provides reusable UI functionality including loading states,
 * split panes, and other interactive components used throughout
 * the application.
 */

import Split from 'split.js';
import { formatLastUpdated } from './formatting.js';

/**
 * Initialize split panes for resizable columns
 * Sets up split panes for both legacy and new navigation structures
 */
export function initializeSplitPanes() {
    // Small delay to ensure DOM elements are fully rendered
    setTimeout(() => {
        // Initialize legacy split panes
        initializeJiraSplitPanes();
        initializeReviewsSplitPanes();
        
        // Initialize new structure split panes
        initializeNewJiraSplitPanes();
        initializeNewReviewsSplitPanes();
        initializeNewMyPrsSplitPanes();
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
 * NEW: Initialize split panes for new JIRA structure
 */
function initializeNewJiraSplitPanes() {
    const jiraColumn = document.getElementById('new-jira-column');
    const githubColumn = document.getElementById('new-github-column');
    
    if (!jiraColumn || !githubColumn) return;
    
    console.log('🔧 Initializing NEW JIRA split panes');
    
    // Load saved split sizes or use defaults
    let initialSizes = [60, 40];
    try {
        const savedSizes = localStorage.getItem('ocmui_new_jira_split_sizes');
        if (savedSizes) {
            const parsedSizes = JSON.parse(savedSizes);
            if (Array.isArray(parsedSizes) && parsedSizes.length === 2) {
                initialSizes = parsedSizes;
            }
        }
    } catch (error) {
        console.warn('🔧 Could not restore NEW JIRA split sizes, using defaults:', error);
    }
    
    try {
        const splitInstance = Split(['#new-jira-column', '#new-github-column'], {
            sizes: initialSizes,
            minSize: 300,
            gutterSize: 8,
            cursor: 'col-resize',
            direction: 'horizontal',
            snapOffset: 30,
            dragInterval: 1,
            
            onDragEnd: function(sizes) {
                try {
                    localStorage.setItem('ocmui_new_jira_split_sizes', JSON.stringify(sizes));
                    console.log('🔧 NEW JIRA split sizes saved:', sizes);
                } catch (error) {
                    console.warn('🔧 Could not save NEW JIRA split sizes:', error);
                }
            }
        });
        
        console.log('✅ NEW JIRA Split.js initialized successfully');
        return splitInstance;
        
    } catch (error) {
        console.error('❌ NEW JIRA Split.js initialization failed:', error);
    }
}

/**
 * NEW: Initialize split panes for new Reviews structure
 */
function initializeNewReviewsSplitPanes() {
    const reviewsPrsColumn = document.getElementById('new-reviews-prs-column');
    const reviewsJiraColumn = document.getElementById('new-reviews-jira-column');
    
    if (!reviewsPrsColumn || !reviewsJiraColumn) return;
    
    console.log('🔧 Initializing NEW Reviews split panes');
    
    // Load saved split sizes or use defaults
    let initialSizes = [50, 50];
    try {
        const savedSizes = localStorage.getItem('ocmui_new_reviews_split_sizes');
        if (savedSizes) {
            const parsedSizes = JSON.parse(savedSizes);
            if (Array.isArray(parsedSizes) && parsedSizes.length === 2) {
                initialSizes = parsedSizes;
            }
        }
    } catch (error) {
        console.warn('🔧 Could not restore NEW Reviews split sizes, using defaults:', error);
    }
    
    try {
        const splitInstance = Split(['#new-reviews-prs-column', '#new-reviews-jira-column'], {
            sizes: initialSizes,
            minSize: 300,
            gutterSize: 8,
            cursor: 'col-resize',
            direction: 'horizontal',
            snapOffset: 30,
            dragInterval: 1,
            
            onDragEnd: function(sizes) {
                try {
                    localStorage.setItem('ocmui_new_reviews_split_sizes', JSON.stringify(sizes));
                    console.log('🔧 NEW Reviews split sizes saved:', sizes);
                } catch (error) {
                    console.warn('🔧 Could not save NEW Reviews split sizes:', error);
                }
            }
        });
        
        console.log('✅ NEW Reviews Split.js initialized successfully');
        return splitInstance;
        
    } catch (error) {
        console.error('❌ NEW Reviews Split.js initialization failed:', error);
    }
}

/**
 * NEW: Initialize split panes for new My PRs structure
 */
function initializeNewMyPrsSplitPanes() {
    const myPrsColumn = document.getElementById('new-my-prs-column');
    const myPrsJiraColumn = document.getElementById('new-my-prs-jira-column');
    
    if (!myPrsColumn || !myPrsJiraColumn) return;
    
    console.log('🔧 Initializing NEW My PRs split panes');
    
    // Load saved split sizes or use defaults
    let initialSizes = [50, 50];
    try {
        const savedSizes = localStorage.getItem('ocmui_new_my_prs_split_sizes');
        if (savedSizes) {
            const parsedSizes = JSON.parse(savedSizes);
            if (Array.isArray(parsedSizes) && parsedSizes.length === 2) {
                initialSizes = parsedSizes;
            }
        }
    } catch (error) {
        console.warn('🔧 Could not restore NEW My PRs split sizes, using defaults:', error);
    }
    
    try {
        const splitInstance = Split(['#new-my-prs-column', '#new-my-prs-jira-column'], {
            sizes: initialSizes,
            minSize: 300,
            gutterSize: 8,
            cursor: 'col-resize',
            direction: 'horizontal',
            snapOffset: 30,
            dragInterval: 1,
            
            onDragEnd: function(sizes) {
                try {
                    localStorage.setItem('ocmui_new_my_prs_split_sizes', JSON.stringify(sizes));
                    console.log('🔧 NEW My PRs split sizes saved:', sizes);
                } catch (error) {
                    console.warn('🔧 Could not save NEW My PRs split sizes:', error);
                }
            }
        });
        
        console.log('✅ NEW My PRs Split.js initialized successfully');
        return splitInstance;
        
    } catch (error) {
        console.error('❌ NEW My PRs Split.js initialization failed:', error);
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
    console.log('🔧 Initializing navigation...');
    // Initialize the two-level navigation system only
    initializeTwoLevelNavigation();
}

/**
 * Initialize two-level navigation functionality
 * Sets up primary and secondary tab switching with state management
 */
export function initializeTwoLevelNavigation() {
    console.log('🔧 Initializing two-level navigation...');
    
    // Initialize primary tab navigation (JIRA | GitHub)
    const primaryTabButtons = document.querySelectorAll('.primary-nav-tab');
    primaryTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const primaryTabName = this.getAttribute('data-primary-tab');
            switchPrimaryTab(primaryTabName);
        });
    });
    
    // Initialize secondary tab navigation for JIRA
    const jiraSecondaryButtons = document.querySelectorAll('#jira-secondary-nav .secondary-nav-tab');
    jiraSecondaryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const secondaryTabName = this.getAttribute('data-secondary-tab');
            switchSecondaryTab('jira', secondaryTabName);
        });
    });
    
    // Initialize secondary tab navigation for GitHub  
    const githubSecondaryButtons = document.querySelectorAll('#github-secondary-nav .secondary-nav-tab');
    githubSecondaryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const secondaryTabName = this.getAttribute('data-secondary-tab');
            switchSecondaryTab('github', secondaryTabName);
        });
        
        // Double-click handler removed to prevent GitHub API rate limiting
    });
    
    console.log('✅ Two-level navigation initialized with 5-minute caching to prevent GitHub rate limiting');
}

/**
 * Switch primary tab (JIRA | GitHub)
 * @param {string} primaryTabName - Primary tab name ('jira' or 'github')
 */
export function switchPrimaryTab(primaryTabName) {
    console.log(`🔄 Switching to primary tab: ${primaryTabName}`);
    
    // Update primary tab button states
    document.querySelectorAll('.primary-nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-primary-tab="${primaryTabName}"]`)?.classList.add('active');
    
    // Show/hide appropriate secondary navigation
    const jiraSecondaryNav = document.getElementById('jira-secondary-nav');
    const githubSecondaryNav = document.getElementById('github-secondary-nav');
    
    if (primaryTabName === 'jira') {
        jiraSecondaryNav.style.display = 'flex';
        githubSecondaryNav.style.display = 'none';
    } else if (primaryTabName === 'github') {
        jiraSecondaryNav.style.display = 'none';
        githubSecondaryNav.style.display = 'flex';
    }
    
    // Show/hide primary content areas
    showPrimaryContent(primaryTabName);
    
    // Trigger secondary tab based on current state or default
    const activeSecondaryTab = getActiveSecondaryTab(primaryTabName);
    switchSecondaryTab(primaryTabName, activeSecondaryTab);
}

/**
 * Switch secondary tab within a primary section
 * @param {string} primaryTabName - Primary tab name ('jira' or 'github')
 * @param {string} secondaryTabName - Secondary tab name
 */
export function switchSecondaryTab(primaryTabName, secondaryTabName) {
    console.log(`🔄 Switching to secondary tab: ${primaryTabName} > ${secondaryTabName}`);
    
    // Update secondary tab button states within the active primary section
    const secondaryNavId = `${primaryTabName}-secondary-nav`;
    const secondaryNav = document.getElementById(secondaryNavId);
    if (secondaryNav) {
        secondaryNav.querySelectorAll('.secondary-nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        secondaryNav.querySelector(`[data-secondary-tab="${secondaryTabName}"]`)?.classList.add('active');
    }
    
    // Show appropriate secondary content
    showSecondaryContent(primaryTabName, secondaryTabName);
    
    // Trigger component activation for specific tabs
    triggerComponentActivation(primaryTabName, secondaryTabName);
}

/**
 * Show/hide primary content areas
 * @param {string} primaryTabName - Primary tab name ('jira' or 'github')
 */
function showPrimaryContent(primaryTabName) {
    // Ensure main content area is visible
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
    
    // Update primary content visibility
    document.querySelectorAll('.primary-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${primaryTabName}-primary-content`)?.classList.add('active');
}

/**
 * Show/hide secondary content within primary content
 * @param {string} primaryTabName - Primary tab name ('jira' or 'github')
 * @param {string} secondaryTabName - Secondary tab name
 */
function showSecondaryContent(primaryTabName, secondaryTabName) {
    const primaryContent = document.getElementById(`${primaryTabName}-primary-content`);
    if (!primaryContent) return;
    
    // Hide all secondary content within this primary section
    primaryContent.querySelectorAll('.secondary-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Map secondary tab names to content IDs
    const contentMapping = {
        'jira': {
            'my-sprint-jiras': 'my-sprint-jiras-content',
            'jira-lookup': 'jira-lookup-content'
        },
        'github': {
            'my-code-reviews': 'my-code-reviews-content',
            'my-prs': 'my-prs-content-tab',
            'github-lookup': 'github-lookup-content'
        }
    };
    
    const contentId = contentMapping[primaryTabName]?.[secondaryTabName];
    if (contentId) {
        document.getElementById(contentId)?.classList.add('active');
    }
}

/**
 * NEW: Get the active secondary tab for a primary section, or return default
 * @param {string} primaryTabName - Primary tab name
 * @returns {string} Active or default secondary tab name
 */
function getActiveSecondaryTab(primaryTabName) {
    const secondaryNavId = `${primaryTabName}-secondary-nav`;
    const secondaryNav = document.getElementById(secondaryNavId);
    if (!secondaryNav) return getDefaultSecondaryTab(primaryTabName);
    
    const activeButton = secondaryNav.querySelector('.secondary-nav-tab.active');
    if (activeButton) {
        return activeButton.getAttribute('data-secondary-tab');
    }
    
    return getDefaultSecondaryTab(primaryTabName);
}

/**
 * NEW: Get default secondary tab for a primary section
 * @param {string} primaryTabName - Primary tab name
 * @returns {string} Default secondary tab name
 */
function getDefaultSecondaryTab(primaryTabName) {
    const defaults = {
        'jira': 'my-sprint-jiras',
        'github': 'my-code-reviews'
    };
    return defaults[primaryTabName] || 'my-sprint-jiras';
}

/**
 * NEW: Set initial state for two-level navigation
 * Call this after DOM is loaded to set up proper default state
 */
export function initializeTwoLevelNavigationState() {
    console.log('🔧 Setting initial two-level navigation state...');
    
    // Set JIRA as default primary tab and ensure proper initial state
    setTimeout(() => {
        switchPrimaryTab('jira');
        console.log('✅ Two-level navigation initial state set');
    }, 100);
}

/**
 * NEW: Trigger component activation for specific secondary tabs
 * @param {string} primaryTabName - Primary tab name
 * @param {string} secondaryTabName - Secondary tab name
 */
function triggerComponentActivation(primaryTabName, secondaryTabName) {
    console.log(`🔄 Triggering component activation: ${primaryTabName} > ${secondaryTabName}`);
    
    // We need to manually call the activation functions instead of dispatching click events
    // to avoid infinite recursion
    if (primaryTabName === 'github') {
        if (secondaryTabName === 'my-code-reviews') {
            // Call the Reviews activation function directly
            // Import and call the function - we'll need to make it available globally
            if (window.onReviewsTabActivated) {
                window.onReviewsTabActivated();
                console.log('📧 Triggered My Code Reviews activation');
            }
        } else if (secondaryTabName === 'my-prs') {
            // Call the MyPrs activation function directly
            if (window.onMyPrsTabActivated) {
                window.onMyPrsTabActivated();
                console.log('📧 Triggered My PRs activation');
            }
        }
    } else if (primaryTabName === 'jira') {
        if (secondaryTabName === 'jira-lookup') {
            // For JIRA Lookup, we don't need to trigger anything special
            // as it's always ready to accept input
            console.log('📧 JIRA Lookup activated (ready for input)');
        }
    }
}

// NOTE: switchPrimaryTab and switchSecondaryTab are already exported in their function declarations above

// Removed old switchTab function - replaced by two-level navigation system

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

/**
 * Update column title with "Last Refreshed" timestamp
 * @param {string} columnSelector - CSS selector for the column title element
 * @param {string} baseTitle - Base title text (e.g., "PRs I'm Reviewing", "My PRs")
 * @param {number} timestamp - Last refresh timestamp in milliseconds
 */
export function updateColumnTitleWithTimestamp(columnSelector, baseTitle, timestamp, refreshCallback = null) {
    const titleElement = document.querySelector(columnSelector);
    if (!titleElement) return;
    
    // Find existing icon
    const icon = titleElement.querySelector('img');
    
    // Create new title content
    const titleText = document.createElement('span');
    titleText.className = 'title-text';
    titleText.textContent = baseTitle;
    
    // Create timestamp container
    const timestampContainer = document.createElement('small');
    timestampContainer.className = 'last-refreshed-container';
    timestampContainer.style.cssText = 'color: #666; font-weight: normal; margin-left: 8px; display: block; font-size: 0.8em; display: flex; align-items: center; gap: 8px;';
    
    // Create timestamp element
    const timestampElement = document.createElement('span');
    timestampElement.className = 'last-refreshed-time';
    timestampElement.textContent = formatLastUpdated(timestamp);
    
    timestampContainer.appendChild(timestampElement);
    
    // Add refresh button if callback provided
    if (refreshCallback) {
        const refreshButton = document.createElement('button');
        refreshButton.className = 'refresh-btn';
        refreshButton.textContent = '🔄 Refresh';
        refreshButton.title = 'Refresh data';
        refreshButton.style.cssText = 'background: transparent; color: #0066cc; border: none; padding: 2px 6px; border-radius: 3px; font-size: 0.85em; cursor: pointer; display: inline-flex; align-items: center; gap: 2px;';
        
        // Add hover effects
        refreshButton.onmouseover = () => {
            refreshButton.style.background = '#f0f8ff';
            refreshButton.style.color = '#0052a3';
        };
        refreshButton.onmouseout = () => {
            refreshButton.style.background = 'transparent';
            refreshButton.style.color = '#0066cc';
        };
        
        refreshButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            refreshButton.disabled = true;
            refreshButton.textContent = '⏳ Refreshing...';
            
            // Call the refresh callback
            refreshCallback().finally(() => {
                refreshButton.disabled = false;
                refreshButton.textContent = '🔄 Refresh';
            });
        };
        
        timestampContainer.appendChild(refreshButton);
    }
    
    // Add auto-update info text
    const infoText = document.createElement('span');
    infoText.className = 'auto-update-info';
    infoText.textContent = ' • updates every 5 minutes';
    infoText.style.cssText = 'color: #999; font-size: 0.8em; margin-left: 4px;';
    timestampContainer.appendChild(infoText);
    
    // Clear and rebuild title
    titleElement.innerHTML = '';
    if (icon) {
        titleElement.appendChild(icon);
    }
    titleElement.appendChild(titleText);
    titleElement.appendChild(timestampContainer);
}

/**
 * Show GitHub API rate limit warning instead of generic 403 error
 * @param {string} containerId - ID of container to show warning in
 * @param {string} action - What action was being attempted (e.g., "load PRs", "search repositories")
 */
export function showGitHubRateLimitWarning(containerId, action) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-state github-rate-limit-warning">
            <div class="error-icon">⚠️</div>
            <div class="error-content">
                <h4>GitHub API Rate Limit Reached</h4>
                <p>Too many requests were made to GitHub's API while trying to ${action}.</p>
                
                <div class="rate-limit-info">
                    <h5>📊 GitHub API Limits:</h5>
                    <ul>
                        <li><strong>Search API:</strong> 30 requests/minute</li>
                        <li><strong>Regular API:</strong> 5,000 requests/hour</li>
                    </ul>
                </div>
                
                <div class="suggestions">
                    <h5>💡 What you can do:</h5>
                    <ul>
                        <li><strong>Wait:</strong> Limits reset automatically</li>
                        <li><strong>Cached data:</strong> Recent data is cached for 5 minutes</li>
                        <li><strong>Try later:</strong> Switch to other tabs and return later</li>
                    </ul>
                </div>
                
                <div class="next-steps">
                    <button class="retry-btn" onclick="location.reload()" 
                            style="background: #0066cc; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
                        🔄 Refresh Page
                    </button>
                </div>
            </div>
        </div>
    `;
}
