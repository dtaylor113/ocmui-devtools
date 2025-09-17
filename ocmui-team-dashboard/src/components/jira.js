/**
 * JIRA Integration Module
 * 
 * Handles all JIRA-related functionality including ticket input,
 * history management, API communication, and ticket display.
 * Provides a complete interface for JIRA ticket operations.
 */

import { appState, getDefaultJiraPrefix } from '../core/appState.js';
import { parseJiraMarkdown, getBadgeClass } from '../utils/formatting.js';
import { showLoadingState } from '../utils/ui.js';
import { generateJiraCardHTML } from '../utils/jiraCard.js';

/**
 * Initialize the JIRA tab interface
 * Sets up input fields, history dropdown, and event listeners
 */
export function initializeJiraTab() {
    // Initialize legacy structure if it exists
    initializeJiraForContainer('jira-column', 'jira-content');
    
    // Initialize new structure if it exists (will use same IDs when active)
    initializeJiraForContainer('new-jira-column', 'new-jira-content');
}

/**
 * Initialize JIRA functionality for a specific container
 * @param {string} columnId - ID of the column container
 * @param {string} contentId - ID of the content container
 */
function initializeJiraForContainer(columnId, contentId) {
    const jiraColumn = document.getElementById(columnId);
    const jiraContent = document.getElementById(contentId);
    
    if (!jiraColumn || !jiraContent) return;
    
    console.log(`🔧 Initializing JIRA for container: ${columnId}`);
    
    // Update the title to include input fields in header
    const titleElement = jiraColumn.querySelector('.column-title');
    
    // Replace the title with new layout including inline input fields
    titleElement.innerHTML = `
        <div class="jira-title-row">
            <div class="title-left">
                <img src="assets/jiraLogo.png" alt="JIRA" class="column-icon">
                <span>JIRA Ticket</span>
            </div>
            <div class="title-right">
                <div class="jira-prefix-section">
                    <input type="text" id="jiraPrefixInput" placeholder="OCMUI-" maxlength="20" class="jira-prefix-input">
                    <div class="jira-prefix-dropdown" id="jiraPrefixDropdown" style="display: none;">
                        <div class="prefix-placeholder">Recent prefixes will appear here</div>
                    </div>
                </div>
                <div class="jira-number-section">
                    <input type="text" id="jiraNumberInput" placeholder="1234" maxlength="8" class="jira-number-input">
                </div>
            </div>
        </div>
        <div class="jira-history-section">
            <label>Recent JIRAs:</label>
            <div class="jira-dropdown-wrapper">
                <div id="jiraHistoryButton" class="jira-history-button">
                    <span class="selected-jira">Select a recent JIRA...</span>
                    <span class="dropdown-arrow">▼</span>
                </div>
                <div id="jiraHistoryDropdown" class="jira-history-dropdown" style="display: none;">
                    <div class="history-placeholder">Recent JIRAs will appear here</div>
                </div>
            </div>
        </div>
    `;
    
    // Set up main content area with spacing and ticket display
    jiraContent.innerHTML = `
        <div class="jira-content-spacer"></div>
        <div id="jiraTicketDisplay" class="jira-ticket-display">
            <div class="placeholder">Enter a JIRA ID to view ticket details</div>
        </div>
    `;
    
    // Only initialize handlers once (for the first container found)
    if (columnId === 'new-jira-column' || !document.getElementById('new-jira-column')) {
        setupJiraInputFields();
        setupJiraHistoryDropdown();
        initializeJiraData();
    }
}

/**
 * Set up JIRA input field event handlers
 * Handles prefix and number inputs with navigation and validation
 */
function setupJiraInputFields() {
    const jiraPrefixInput = document.getElementById('jiraPrefixInput') || document.getElementById('jiraPrefixInput-new') || document.getElementById('jiraPrefixInput-new');
    const jiraNumberInput = document.getElementById('jiraNumberInput') || document.getElementById('jiraNumberInput-new') || document.getElementById('jiraNumberInput-new');
    
    // Set default prefix from saved preferences
    const savedPrefix = getDefaultJiraPrefix();
    jiraPrefixInput.value = savedPrefix;
    
    // Prefix input event handlers
    jiraPrefixInput.addEventListener('keydown', handleJiraPrefixInput);
    jiraPrefixInput.addEventListener('focus', showJiraPrefixDropdown);
    jiraPrefixInput.addEventListener('blur', hideJiraPrefixDropdownDelayed);
    
    // Number input event handlers
    jiraNumberInput.addEventListener('keydown', handleJiraNumberInput);
}

/**
 * Set up JIRA history dropdown functionality
 * Handles dropdown toggle, selection, and outside click detection
 */
function setupJiraHistoryDropdown() {
    // Get the appropriate element IDs for current structure
    const historyButton = document.getElementById('jiraHistoryButton') || document.getElementById('jiraHistoryButton-new');
    const historyDropdown = document.getElementById('jiraHistoryDropdown') || document.getElementById('jiraHistoryDropdown-new');
    
    if (historyButton) {
        historyButton.addEventListener('click', toggleJiraHistoryDropdown);
    }
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!historyButton.contains(e.target) && !historyDropdown.contains(e.target)) {
            hideJiraHistoryDropdown();
        }
    });
}

/**
 * Initialize JIRA data displays
 * Updates history list and prefix dropdown with current data
 */
function initializeJiraData() {
    updateJiraHistoryList();
    updateJiraPrefixDropdown();
}

/**
 * Handle JIRA prefix input field interactions
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleJiraPrefixInput(event) {
    const input = event.target;
    const value = input.value.trim();
    
    // Enter key moves focus to number input
    if (event.key === 'Enter') {
        event.preventDefault();
        const numberInput = document.getElementById('jiraNumberInput') || document.getElementById('jiraNumberInput-new');
        if (numberInput) {
            numberInput.focus();
        }
        return;
    }
    
    // Show prefix dropdown on input
    if (value.length >= 1) {
        showJiraPrefixDropdown();
    }
}

/**
 * Handle JIRA number input field interactions
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleJiraNumberInput(event) {
    const numberInput = event.target;
    const prefixInput = document.getElementById('jiraPrefixInput') || document.getElementById('jiraPrefixInput-new');
    const numberValue = numberInput.value.trim();
    const prefixValue = prefixInput ? prefixInput.value.trim() : 'OCMUI-';
    
    // Enter key submits the JIRA ticket lookup
    if (event.key === 'Enter') {
        event.preventDefault();
        
        if (numberValue && prefixValue) {
            // Ensure prefix ends with dash
            const normalizedPrefix = prefixValue.endsWith('-') ? prefixValue : prefixValue + '-';
            
            // Validate number input
            if (!numberValue.match(/^\d+$/)) {
                alert('Please enter only numbers in the JIRA number field');
                return;
            }
            
            const jiraId = normalizedPrefix + numberValue;
            
            // Add prefix to history and process the ticket
            addToJiraPrefixHistory(normalizedPrefix);
            addToJiraHistory(jiraId);
            numberInput.value = ''; // Clear number input after submission
            
            openJiraTicket(jiraId);
        }
    }
}

/**
 * Update the JIRA history dropdown display
 * Refreshes both the dropdown contents and the button text
 */
export function updateJiraHistoryList() {
    const historyDropdown = document.getElementById('jiraHistoryDropdown') || document.getElementById('jiraHistoryDropdown-new');
    const historyButton = document.getElementById('jiraHistoryButton') || document.getElementById('jiraHistoryButton-new');
    const selectedJiraSpan = historyButton?.querySelector('.selected-jira');
    
    if (!historyDropdown) return;
    
    historyDropdown.innerHTML = '';
    
    // Show placeholder if no history
    if (appState.jiraHistory.length === 0) {
        const div = document.createElement('div');
        div.className = 'history-item history-placeholder';
        div.textContent = 'Recent JIRAs will appear here';
        historyDropdown.appendChild(div);
        return;
    }
    
    // Update button text to show currently selected JIRA
    updateSelectedJiraDisplay(selectedJiraSpan);
    
    // Populate dropdown with recent history (last 10 items)
    const recentHistory = appState.jiraHistory.slice(0, 10);
    recentHistory.forEach(item => {
        const div = document.createElement('div');
        const jiraId = typeof item === 'string' ? item : item.id;
        const isSelected = appState.selectedJiraId === jiraId;
        
        div.className = `history-item${isSelected ? ' selected' : ''}`;
        
        // Format history item display
        if (typeof item === 'string') {
            div.textContent = item;
        } else {
            const assignee = item.assignee !== 'Unassigned' ? item.assignee : '';
            const assigneeText = assignee ? ` (${assignee})` : '';
            const summary = item.summary && item.summary !== 'Loading...' ? 
                (item.summary.length > 150 ? item.summary.substring(0, 147) + '...' : item.summary) : '';
            div.innerHTML = `<span class="history-jira-id">${item.id}</span>${assigneeText} <span class="history-summary">${summary}</span>`;
        }
        
        // Handle history item selection
        div.addEventListener('click', () => handleHistoryItemClick(jiraId));
        historyDropdown.appendChild(div);
    });
}

/**
 * Update the selected JIRA display in the dropdown button
 * @param {HTMLElement} selectedJiraSpan - The span element showing selected JIRA
 */
function updateSelectedJiraDisplay(selectedJiraSpan) {
    if (!appState.selectedJiraId || !selectedJiraSpan) return;
    
    const selectedItem = appState.jiraHistory.find(item => 
        (typeof item === 'string' ? item : item.id) === appState.selectedJiraId
    );
    
    if (selectedItem) {
        if (typeof selectedItem === 'string') {
            selectedJiraSpan.textContent = selectedItem;
        } else {
            const summary = selectedItem.summary && selectedItem.summary !== 'Loading...' ? 
                (selectedItem.summary.length > 100 ? selectedItem.summary.substring(0, 97) + '...' : selectedItem.summary) : '';
            selectedJiraSpan.textContent = `${selectedItem.id}${summary ? ' - ' + summary : ''}`;
        }
    }
}

/**
 * Handle clicking on a JIRA history item
 * @param {string} jiraId - The JIRA ID that was clicked
 */
function handleHistoryItemClick(jiraId) {
    // Set as currently selected
    appState.selectedJiraId = jiraId;
    
    // Parse JIRA ID and populate input fields
    const match = jiraId.match(/^([A-Z]+-)(\d+)$/);
    if (match) {
        const prefix = match[1];
        const number = match[2];
        
        const prefixInput = document.getElementById('jiraPrefixInput') || document.getElementById('jiraPrefixInput-new');
        const numberInput = document.getElementById('jiraNumberInput') || document.getElementById('jiraNumberInput-new');
        
        if (prefixInput && numberInput) {
            prefixInput.value = prefix;
            numberInput.value = number;
            numberInput.focus(); // Focus for immediate editing
        }
    }
    
    hideJiraHistoryDropdown();
    openJiraTicket(jiraId);
    updateJiraHistoryList(); // Refresh to show new selection
}

/**
 * Toggle the JIRA history dropdown visibility
 */
export function toggleJiraHistoryDropdown() {
    const dropdown = document.getElementById('jiraHistoryDropdown') || document.getElementById('jiraHistoryDropdown-new');
    const arrow = document.querySelector('.dropdown-arrow');
    
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
        if (arrow) arrow.textContent = '▲';
    } else {
        dropdown.style.display = 'none';
        if (arrow) arrow.textContent = '▼';
    }
}

/**
 * Hide the JIRA history dropdown
 */
export function hideJiraHistoryDropdown() {
    const dropdown = document.getElementById('jiraHistoryDropdown') || document.getElementById('jiraHistoryDropdown-new');
    const arrow = document.querySelector('.dropdown-arrow');
    
    if (dropdown) dropdown.style.display = 'none';
    if (arrow) arrow.textContent = '▼';
}

/**
 * Add a JIRA ID to the history
 * @param {string} jiraId - The JIRA ticket ID
 * @param {Object} ticketData - Optional ticket metadata
 */
export function addToJiraHistory(jiraId, ticketData = null) {
    // Set as currently selected
    appState.selectedJiraId = jiraId;
    
    // Remove existing entry to avoid duplicates
    appState.jiraHistory = appState.jiraHistory.filter(item => 
        (typeof item === 'string' ? item : item.id) !== jiraId
    );
    
    // Create enhanced history item
    const historyItem = ticketData ? {
        id: jiraId,
        summary: ticketData.summary,
        assignee: ticketData.assignee || 'Unassigned'
    } : {
        id: jiraId,
        summary: 'Loading...',
        assignee: 'Unknown'
    };
    
    // Add to beginning and limit to 10 items
    appState.jiraHistory.unshift(historyItem);
    appState.jiraHistory = appState.jiraHistory.slice(0, 10);
    
    // Persist to localStorage
    localStorage.setItem('ocmui_jira_history', JSON.stringify(appState.jiraHistory));
    
    updateJiraHistoryList();
}

/**
 * Add a JIRA prefix to the prefix history
 * @param {string} prefix - The JIRA project prefix (e.g., "OCMUI-")
 */
export function addToJiraPrefixHistory(prefix) {
    // Remove existing to avoid duplicates
    appState.jiraPrefixes = appState.jiraPrefixes.filter(p => p !== prefix);
    
    // Add to beginning and limit to 8 prefixes
    appState.jiraPrefixes.unshift(prefix);
    appState.jiraPrefixes = appState.jiraPrefixes.slice(0, 8);
    
    // Persist to localStorage
    localStorage.setItem('ocmui_jira_prefixes', JSON.stringify(appState.jiraPrefixes));
    
    updateJiraPrefixDropdown();
}

/**
 * Show the JIRA prefix dropdown
 */
function showJiraPrefixDropdown() {
    const dropdown = document.getElementById('jiraPrefixDropdown') || document.getElementById('jiraPrefixDropdown-new');
    if (dropdown && appState.jiraPrefixes.length > 0) {
        dropdown.style.display = 'block';
    }
}

/**
 * Hide the JIRA prefix dropdown
 */
function hideJiraPrefixDropdown() {
    const dropdown = document.getElementById('jiraPrefixDropdown') || document.getElementById('jiraPrefixDropdown-new');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

/**
 * Hide the JIRA prefix dropdown with a delay
 * Used for blur events to allow clicks on dropdown items
 */
function hideJiraPrefixDropdownDelayed() {
    setTimeout(hideJiraPrefixDropdown, 200);
}

/**
 * Update the JIRA prefix dropdown contents
 */
function updateJiraPrefixDropdown() {
    const dropdown = document.getElementById('jiraPrefixDropdown') || document.getElementById('jiraPrefixDropdown-new');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    
    if (appState.jiraPrefixes.length === 0) {
        const div = document.createElement('div');
        div.className = 'prefix-placeholder';
        div.textContent = 'Recent prefixes will appear here';
        dropdown.appendChild(div);
        return;
    }
    
    // Populate with available prefixes
    appState.jiraPrefixes.forEach(prefix => {
        const div = document.createElement('div');
        div.className = 'prefix-item';
        div.textContent = prefix;
        div.addEventListener('click', () => {
            const prefixInput = document.getElementById('jiraPrefixInput') || document.getElementById('jiraPrefixInput-new');
            if (prefixInput) {
                prefixInput.value = prefix;
                hideJiraPrefixDropdown();
                const numberInput = document.getElementById('jiraNumberInput') || document.getElementById('jiraNumberInput-new');
                if (numberInput) {
                    numberInput.focus();
                }
            }
        });
        dropdown.appendChild(div);
    });
}

/**
 * Open/fetch a JIRA ticket
 * @param {string} jiraId - The JIRA ticket ID to open
 */
async function openJiraTicket(jiraId) {
    console.log('🎟️ Opening JIRA ticket:', jiraId);
    
    if (!appState.apiTokens.jira) {
        // No token configured - open in browser instead
        window.open(`https://issues.redhat.com/browse/${jiraId}`, '_blank');
        return;
    }
    
    try {
        await fetchAndDisplayJiraTicket(jiraId);
    } catch (error) {
        console.error('❌ Error opening JIRA ticket:', error);
        // Fallback to browser
        window.open(`https://issues.redhat.com/browse/${jiraId}`, '_blank');
    }
}

/**
 * Fetch and display a JIRA ticket using the API
 * @param {string} jiraId - The JIRA ticket ID to fetch
 */
async function fetchAndDisplayJiraTicket(jiraId) {
    showLoadingState(`Loading ${jiraId}...`);
    
    try {
        console.log('🔥 Fetching JIRA ticket:', jiraId, 'with token:', !!appState.apiTokens.jira);
        
        const requestBody = { 
            jiraId: jiraId, 
            token: appState.apiTokens.jira 
        };
        console.log('🔥 Request body:', requestBody);
        
        const response = await fetch('/api/jira-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        console.log('🔥 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('🔥 Error response:', errorText);
            throw new Error(`Server error: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
        }
        
        const result = await response.json();
        console.log('🔥 JIRA API result:', result.success ? 'SUCCESS' : 'FAILURE');
        
        if (result.success && result.ticket) {
            console.log('🔥 JIRA ticket data received:', result.ticket);
            
            // Update history with ticket details
            addToJiraHistory(jiraId, result.ticket);
            
            console.log('🔥 About to display JIRA ticket...');
            try {
                displayJiraTicket(result.ticket);
                console.log('🔥 JIRA ticket displayed successfully');
            } catch (displayError) {
                console.error('🔥 Error displaying JIRA ticket:', displayError);
                const jiraDisplay = document.getElementById('jiraTicketDisplay') || document.getElementById('jiraTicketDisplay-new');
                if (jiraDisplay) {
                    jiraDisplay.innerHTML = `<div class="error">Error displaying ticket: ${displayError.message}</div>`;
                }
                return; // Don't fetch GitHub PRs if JIRA display failed
            }
            
            // Clear the number input after successful search
            const numberInput = document.getElementById('jiraNumberInput') || document.getElementById('jiraNumberInput-new');
            if (numberInput) {
                numberInput.value = '';
                updateJiraHistoryList();
            }
            
            // Also fetch related GitHub PRs
            console.log('🔥 About to fetch GitHub PRs...');
            if (fetchAndDisplayGitHubPRs) {
                await fetchAndDisplayGitHubPRs(jiraId);
            } else {
                console.warn('🔥 fetchAndDisplayGitHubPRs not available');
            }
        } else {
            console.error('🔥 JIRA API result was not successful:', result);
            throw new Error(result.error || 'Failed to load JIRA ticket');
        }
    } catch (error) {
        console.error('❌ JIRA fetch error:', error);
        const jiraDisplay = document.getElementById('jiraTicketDisplay') || document.getElementById('jiraTicketDisplay-new');
        if (jiraDisplay) {
            jiraDisplay.innerHTML = `<div class="error">Error loading ${jiraId}: ${error.message}</div>`;
        }
        // Don't fetch GitHub PRs if JIRA failed
        return;
    }
}

/**
 * Display a JIRA ticket in the UI
 * @param {Object} ticket - The JIRA ticket data
 */
function displayJiraTicket(ticket) {
    const jiraDisplay = document.getElementById('jiraTicketDisplay') || document.getElementById('jiraTicketDisplay-new');
    if (!jiraDisplay) return;
    
    // Generate JIRA card using shared component (collapsible, initially collapsed to avoid conflicts, no section wrapper)  
    const ticketHtml = generateJiraCardHTML(ticket, {
        collapsible: true,
        wrapInSection: false,
        initiallyExpanded: false,  // ← Changed from true to false to test
        toggleFunction: 'toggleCollapsibleSection'
    });
    
    jiraDisplay.innerHTML = ticketHtml;
}


// Import the GitHub PR fetching function (will be defined in github.js)
let fetchAndDisplayGitHubPRs;
export function setGitHubPRFetcher(fetchFunction) {
    fetchAndDisplayGitHubPRs = fetchFunction;
}
