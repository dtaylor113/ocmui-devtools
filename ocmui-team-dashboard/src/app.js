/**
 * OCMUI Team Dashboard - Main Application
 */

import './styles/main.css';
import Split from 'split.js';

// Application state
let appState = {
    currentTab: 'jira',
    apiTokens: { github: '', jira: '', githubUsername: '' },
    jiraHistory: [],
    jiraPrefixes: ['OCMUI-'], // Default prefix
    selectedJiraId: null // Track currently selected JIRA
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 OCMUI Team Dashboard initializing...');
    
    loadAppState();
    initializeTabNavigation();
    initializeSettingsModal();
    initializeJiraTab();
    initializeSplitPanes();
    updateReadyState();
    
    console.log('🔥 Final app state:', appState);
    console.log('✅ Dashboard ready!');
});

function loadAppState() {
    try {
        const tokens = localStorage.getItem('ocmui_api_tokens');
        if (tokens) {
            appState.apiTokens = JSON.parse(tokens);
        }
        
        const history = localStorage.getItem('ocmui_jira_history');
        if (history) {
            appState.jiraHistory = JSON.parse(history);
        }
        
        const prefixes = localStorage.getItem('ocmui_jira_prefixes');
        if (prefixes) {
            appState.jiraPrefixes = JSON.parse(prefixes);
        }
        
        console.log('📱 State loaded from localStorage');
    } catch (error) {
        console.error('❌ Error loading state:', error);
    }
}

function saveApiTokens() {
    localStorage.setItem('ocmui_api_tokens', JSON.stringify(appState.apiTokens));
    console.log('💾 API tokens saved');
}

function initializeTabNavigation() {
    const tabButtons = document.querySelectorAll('.nav-tab');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');
    
    appState.currentTab = tabName;
}

function initializeSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    settingsBtn.addEventListener('click', openSettingsModal);
}

function openSettingsModal() {
    const modalHtml = '<div class="modal-backdrop">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<h2>⚙️ Settings</h2>' +
        '<button class="modal-close" id="settingsClose">&times;</button>' +
        '</div>' +
        '<div class="modal-body">' +
        '<div class="form-group">' +
        '<label for="githubToken">GitHub Token:</label>' +
        '<div class="input-row">' +
        '<input type="password" id="githubToken" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value="' + (appState.apiTokens.github || '') + '">' +
        '<button class="test-btn" id="testGithub">Test</button>' +
        '</div>' +
        '<div class="help-text">' +
        '<a href="https://github.com/settings/tokens" target="_blank">Create GitHub Token →</a>' +
        '<small>Required scopes: public_repo, repo:status, read:user</small>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="githubUsername">GitHub Username:</label>' +
        '<input type="text" id="githubUsername" placeholder="your-github-username" value="' + (appState.apiTokens.githubUsername || '') + '">' +
        '<div class="help-text">' +
        '<small>Used for "Awaiting My Code Review" and "My PRs" tabs</small>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="jiraToken">JIRA Token:</label>' +
        '<div class="input-row">' +
        '<input type="password" id="jiraToken" placeholder="Your JIRA API token" value="' + (appState.apiTokens.jira || '') + '">' +
        '<button class="test-btn" id="testJira">Test</button>' +
        '</div>' +
        '<div class="help-text">' +
        '<a href="https://issues.redhat.com/secure/ViewProfile.jspa" target="_blank">Create JIRA Token →</a>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-secondary" id="settingsCancel">Cancel</button>' +
        '<button class="btn btn-primary" id="settingsSave">Save</button>' +
        '</div>' +
        '</div>' +
        '</div>';
    
    const modal = document.getElementById('settingsModal');
    modal.innerHTML = modalHtml;
    modal.style.display = 'block';
    
    document.getElementById('settingsClose').addEventListener('click', closeSettingsModal);
    document.getElementById('settingsCancel').addEventListener('click', closeSettingsModal);
    document.getElementById('settingsSave').addEventListener('click', saveSettings);
    document.getElementById('testGithub').addEventListener('click', testGithubToken);
    document.getElementById('testJira').addEventListener('click', testJiraToken);
    
    modal.querySelector('.modal-backdrop').addEventListener('click', function(e) {
        if (e.target === this) closeSettingsModal();
    });
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
    const githubToken = document.getElementById('githubToken').value.trim();
    const githubUsername = document.getElementById('githubUsername').value.trim();
    const jiraToken = document.getElementById('jiraToken').value.trim();
    
    appState.apiTokens.github = githubToken;
    appState.apiTokens.githubUsername = githubUsername;
    appState.apiTokens.jira = jiraToken;
    
    saveApiTokens();
    updateReadyState();
    closeSettingsModal();
    
    console.log('✅ Settings saved successfully');
}

function initializeJiraTab() {
    // Update the title to include input fields
    const jiraColumn = document.getElementById('jira-column');
    const titleElement = jiraColumn.querySelector('.column-title');
    
    // Replace the title with new layout
    titleElement.innerHTML = '<div class="title-left">' +
        '<img src="assets/jiraLogo.png" alt="JIRA" class="column-icon">' +
        '<span>JIRA Ticket</span>' +
        '</div>' +
        '<div class="title-right">' +
        '<div class="jira-prefix-section">' +
        '<input type="text" id="jiraPrefixInput" placeholder="OCMUI-" maxlength="20" class="jira-prefix-input">' +
        '<div class="jira-prefix-dropdown" id="jiraPrefixDropdown" style="display: none;">' +
        '<div class="prefix-placeholder">Recent prefixes will appear here</div>' +
        '</div>' +
        '</div>' +
        '<div class="jira-number-section">' +
        '<input type="text" id="jiraNumberInput" placeholder="1234" maxlength="8" class="jira-number-input">' +
        '</div>' +
        '</div>';
    
    const jiraContent = document.getElementById('jira-content');
    
    jiraContent.innerHTML = '<div class="jira-history-section">' +
        '<label>Recent JIRAs:</label>' +
        '<div class="jira-dropdown-wrapper">' +
        '<div id="jiraHistoryButton" class="jira-history-button">' +
        '<span class="selected-jira">Select a recent JIRA...</span>' +
        '<span class="dropdown-arrow">▼</span>' +
        '</div>' +
        '<div id="jiraHistoryDropdown" class="jira-history-dropdown" style="display: none;">' +
        '<div class="history-placeholder">Recent JIRAs will appear here</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="jiraTicketDisplay">' +
        '<div class="placeholder">Enter a JIRA ID to view ticket details</div>' +
        '</div>';
    
    const jiraPrefixInput = document.getElementById('jiraPrefixInput');
    const jiraNumberInput = document.getElementById('jiraNumberInput');
    
    // Set default prefix if none stored
    const savedPrefix = appState.jiraPrefixes && appState.jiraPrefixes.length > 0 ? appState.jiraPrefixes[0] : 'OCMUI-';
    jiraPrefixInput.value = savedPrefix;
    
    jiraPrefixInput.addEventListener('keydown', handleJiraPrefixInput);
    jiraPrefixInput.addEventListener('focus', showJiraPrefixDropdown);
    jiraPrefixInput.addEventListener('blur', hideJiraPrefixDropdownDelayed);
    jiraNumberInput.addEventListener('keydown', handleJiraNumberInput);
    
    // Add dropdown event listeners
    const historyButton = document.getElementById('jiraHistoryButton');
    const historyDropdown = document.getElementById('jiraHistoryDropdown');
    
    historyButton.addEventListener('click', toggleJiraHistoryDropdown);
    document.addEventListener('click', function(e) {
        if (!historyButton.contains(e.target) && !historyDropdown.contains(e.target)) {
            hideJiraHistoryDropdown();
        }
    });
    
    updateJiraHistoryList(); // Initial update for history
    updateJiraPrefixDropdown(); // Initialize prefix dropdown
}

function initializeSplitPanes() {
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
        const jiraColumn = document.getElementById('jira-column');
        const githubColumn = document.getElementById('github-column');
        
        console.log('🔧 Split elements check:', {
            jiraColumn: !!jiraColumn,
            githubColumn: !!githubColumn
        });
        
        if (jiraColumn && githubColumn) {
            // Check for saved sizes, default to 60/40 split
            let initialSizes = [60, 40];
            const savedSizes = localStorage.getItem('ocmui_split_sizes');
            if (savedSizes) {
                try {
                    initialSizes = JSON.parse(savedSizes);
                    console.log('🔧 Restored split sizes:', initialSizes);
                } catch (error) {
                    console.log('🔧 Could not restore split sizes, using defaults:', error);
                }
            }
            
            // Initialize Split.js with saved or default sizes
            try {
                const splitInstance = Split(['#jira-column', '#github-column'], {
                    sizes: initialSizes,  
                    minSize: 300,         // Minimum 300px for each pane
                    gutterSize: 8,        // 8px drag handle
                    cursor: 'col-resize',
                    direction: 'horizontal',
                    snapOffset: 30,       // Snap to edges within 30px
                    dragInterval: 1,      // Update every 1px for smooth dragging
                    onDrag: function(sizes) {
                        console.log('🔧 Dragging:', sizes);
                    },
                    onDragEnd: function(sizes) {
                        // Save user's preferred sizes to localStorage
                        localStorage.setItem('ocmui_split_sizes', JSON.stringify(sizes));
                        console.log('🔧 Split sizes saved:', sizes);
                    }
                });
                
                console.log('✅ Split.js initialized successfully:', splitInstance);
            } catch (error) {
                console.error('❌ Split.js initialization failed:', error);
            }
        } else {
            console.error('❌ Split columns not found in DOM');
        }
    }, 100); // Small delay to ensure DOM is ready
}

function handleJiraPrefixInput(event) {
    const input = event.target;
    let value = input.value.trim();
    
    // Handle Enter key press - move to number input
    if (event.key === 'Enter') {
        event.preventDefault();
        const numberInput = document.getElementById('jiraNumberInput');
        if (numberInput) {
            numberInput.focus();
        }
        return;
    }
    
    // Show/hide dropdown on input
    if (value.length >= 1) {
        showJiraPrefixDropdown();
    }
}

function handleJiraNumberInput(event) {
    console.log('🔥 handleJiraNumberInput called, key:', event.key);
    
    const numberInput = event.target;
    const prefixInput = document.getElementById('jiraPrefixInput');
    let numberValue = numberInput.value.trim();
    let prefixValue = prefixInput ? prefixInput.value.trim() : 'OCMUI-';
    
    // Handle Enter key press
    if (event.key === 'Enter') {
        event.preventDefault();
        console.log('🔥 Enter pressed, numberValue:', numberValue, 'prefixValue:', prefixValue);
        
        if (numberValue && prefixValue) {
            // Ensure prefix ends with dash
            if (!prefixValue.endsWith('-')) {
                prefixValue += '-';
            }
            
            // Validate number input
            if (!numberValue.match(/^\d+$/)) {
                alert('Please enter only numbers in the JIRA number field');
                return;
            }
            
            const jiraId = prefixValue + numberValue;
            console.log('🔥 Formatted ID:', jiraId);
            
            // Add prefix to history if not already there
            addToJiraPrefixHistory(prefixValue);
            
            // Add full JIRA ID to history and clear number input
            addToJiraHistory(jiraId);
            numberInput.value = '';
            
            // Open the JIRA ticket
            openJiraTicket(jiraId);
        }
        return;
    }
}


function updateJiraHistoryList() {
    const historyDropdown = document.getElementById('jiraHistoryDropdown');
    const historyButton = document.getElementById('jiraHistoryButton');
    const selectedJiraSpan = historyButton?.querySelector('.selected-jira');
    
    if (!historyDropdown) return;
    
    historyDropdown.innerHTML = '';
    
    if (appState.jiraHistory.length === 0) {
        // Show placeholder when no history
        const div = document.createElement('div');
        div.className = 'history-item history-placeholder';
        div.textContent = 'Recent JIRAs will appear here';
        historyDropdown.appendChild(div);
        return;
    }
    
    // Update the button text to show selected JIRA if any
    if (appState.selectedJiraId && selectedJiraSpan) {
        const selectedItem = appState.jiraHistory.find(item => 
            (typeof item === 'string' ? item : item.id) === appState.selectedJiraId
        );
        
        if (selectedItem) {
            if (typeof selectedItem === 'string') {
                selectedJiraSpan.textContent = selectedItem;
            } else {
                const summary = selectedItem.summary && selectedItem.summary !== 'Loading...' ? 
                    (selectedItem.summary.length > 25 ? selectedItem.summary.substring(0, 22) + '...' : selectedItem.summary) : '';
                selectedJiraSpan.textContent = `${selectedItem.id}${summary ? ' - ' + summary : ''}`;
            }
        }
    }
    
    // Show last 10 items
    const recentHistory = appState.jiraHistory.slice(0, 10);
    
    recentHistory.forEach(item => {
        const div = document.createElement('div');
        const jiraId = typeof item === 'string' ? item : item.id;
        const isSelected = appState.selectedJiraId === jiraId;
        
        div.className = `history-item${isSelected ? ' selected' : ''}`;
        
        if (typeof item === 'string') {
            // Legacy format - just show JIRA ID
            div.textContent = item;
        } else {
            // Enhanced format - show "JIRA-ID (assignee) Summary..."
            const assignee = item.assignee !== 'Unassigned' ? item.assignee : '';
            const assigneeText = assignee ? ` (${assignee})` : '';
            const summary = item.summary && item.summary !== 'Loading...' ? 
                (item.summary.length > 35 ? item.summary.substring(0, 32) + '...' : item.summary) : '';
            div.innerHTML = `<span class="history-jira-id">${item.id}</span>${assigneeText} <span class="history-summary">${summary}</span>`;
        }
        
        div.addEventListener('click', () => {
            // Set as selected
            appState.selectedJiraId = jiraId;
            
            // Split the JIRA ID into prefix and number
            const match = jiraId.match(/^([A-Z]+-)(\d+)$/);
            if (match) {
                const prefix = match[1]; // e.g., "OCMUI-"
                const number = match[2]; // e.g., "1234"
                
                const prefixInput = document.getElementById('jiraPrefixInput');
                const numberInput = document.getElementById('jiraNumberInput');
                
                if (prefixInput && numberInput) {
                    prefixInput.value = prefix;
                    numberInput.value = number;
                    // Focus the number field for immediate editing
                    numberInput.focus();
                }
            }
            
            hideJiraHistoryDropdown();
            openJiraTicket(jiraId);
            updateJiraHistoryList(); // Refresh to show selection
        });
        historyDropdown.appendChild(div);
    });
}

function toggleJiraHistoryDropdown() {
    const dropdown = document.getElementById('jiraHistoryDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
    
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
        if (arrow) arrow.textContent = '▲';
    } else {
        dropdown.style.display = 'none';
        if (arrow) arrow.textContent = '▼';
    }
}

function hideJiraHistoryDropdown() {
    const dropdown = document.getElementById('jiraHistoryDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
    
    if (dropdown) dropdown.style.display = 'none';
    if (arrow) arrow.textContent = '▼';
}

function addToJiraHistory(jiraId, ticketData = null) {
    // Set as currently selected
    appState.selectedJiraId = jiraId;
    
    // Remove if already exists to avoid duplicates
    appState.jiraHistory = appState.jiraHistory.filter(item => 
        (typeof item === 'string' ? item : item.id) !== jiraId
    );
    
    // Create enhanced history item
    let historyItem;
    if (ticketData) {
        historyItem = {
            id: jiraId,
            summary: ticketData.summary,
            assignee: ticketData.assignee || 'Unassigned'
        };
    } else {
        // Fallback for when we don't have ticket data yet
        historyItem = {
            id: jiraId,
            summary: 'Loading...',
            assignee: 'Unknown'
        };
    }
    
    // Add to beginning of history
    appState.jiraHistory.unshift(historyItem);
    
    // Keep only last 10 items
    appState.jiraHistory = appState.jiraHistory.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem('ocmui_jira_history', JSON.stringify(appState.jiraHistory));
    
    updateJiraHistoryList();
}

function addToJiraPrefixHistory(prefix) {
    console.log('🔥 Adding prefix to history:', prefix);
    
    // Remove if already exists to avoid duplicates
    appState.jiraPrefixes = appState.jiraPrefixes.filter(p => p !== prefix);
    
    // Add to beginning
    appState.jiraPrefixes.unshift(prefix);
    
    // Keep only last 8 prefixes
    appState.jiraPrefixes = appState.jiraPrefixes.slice(0, 8);
    
    // Save to localStorage
    localStorage.setItem('ocmui_jira_prefixes', JSON.stringify(appState.jiraPrefixes));
    
    // Update the UI
    updateJiraPrefixDropdown();
}

function showJiraPrefixDropdown() {
    const dropdown = document.getElementById('jiraPrefixDropdown');
    if (dropdown && appState.jiraPrefixes.length > 0) {
        dropdown.style.display = 'block';
    }
}

function hideJiraPrefixDropdown() {
    const dropdown = document.getElementById('jiraPrefixDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

function hideJiraPrefixDropdownDelayed() {
    setTimeout(() => {
        hideJiraPrefixDropdown();
    }, 200);
}

function updateJiraPrefixDropdown() {
    const dropdown = document.getElementById('jiraPrefixDropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    
    if (appState.jiraPrefixes.length === 0) {
        const div = document.createElement('div');
        div.className = 'prefix-placeholder';
        div.textContent = 'Recent prefixes will appear here';
        dropdown.appendChild(div);
        return;
    }
    
    appState.jiraPrefixes.forEach(prefix => {
        const div = document.createElement('div');
        div.className = 'prefix-item';
        div.textContent = prefix;
        div.addEventListener('click', () => {
            const prefixInput = document.getElementById('jiraPrefixInput');
            if (prefixInput) {
                prefixInput.value = prefix;
                hideJiraPrefixDropdown();
                const numberInput = document.getElementById('jiraNumberInput');
                if (numberInput) {
                    numberInput.focus();
                }
            }
        });
        dropdown.appendChild(div);
    });
}

async function openJiraTicket(jiraId) {
    console.log('🔥 openJiraTicket called with:', jiraId);
    console.log('🔥 Current API tokens:', appState.apiTokens);
    console.log('🔥 JIRA token exists:', !!appState.apiTokens.jira);
    console.log('🔥 JIRA token length:', appState.apiTokens.jira ? appState.apiTokens.jira.trim().length : 0);
    
    if (appState.apiTokens.jira && appState.apiTokens.jira.trim().length > 0) {
        console.log('🔥 Has JIRA token, calling fetchAndDisplayJiraTicket');
        try {
            await fetchAndDisplayJiraTicket(jiraId);
        } catch (error) {
            console.error('🔥 Error in fetchAndDisplayJiraTicket:', error);
            // Clear loading state and show error
            document.getElementById('jiraTicketDisplay').innerHTML = 
                '<div class="error">Failed to load JIRA ticket. <a href="https://issues.redhat.com/browse/' + jiraId + '" target="_blank" style="color: #3b82f6;">Click here to open in JIRA</a></div>';
        }
    } else {
        console.log('🔥 No JIRA token, showing placeholder message');
        // No token available - show message and open in browser
        document.getElementById('jiraTicketDisplay').innerHTML = 
            '<div class="placeholder">No JIRA token configured. <a href="https://issues.redhat.com/browse/' + jiraId + '" target="_blank" style="color: #3b82f6;">Click here to open ' + jiraId + ' in JIRA</a><br><br>Configure your JIRA token in Settings to view tickets here.</div>';
        
        const url = `https://issues.redhat.com/browse/${jiraId}`;
        window.open(url, '_blank');
    }
}

async function fetchAndDisplayJiraTicket(jiraId) {
    console.log('🔥 fetchAndDisplayJiraTicket called with:', jiraId);
    showLoadingState();
    
    try {
        console.log('🔥 Making API request to /api/jira-ticket');
        console.log('🔥 Request payload:', { jiraId: jiraId, token: appState.apiTokens.jira ? '[HIDDEN]' : null });
        
        const response = await fetch('/api/jira-ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                jiraId: jiraId,
                token: appState.apiTokens.jira 
            })
        });
        
        console.log('🔥 API response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('🔥 API response data:', result);
        
        if (result.success) {
            console.log('🔥 Success! Displaying JIRA ticket');
            
            // Update history with ticket details
            addToJiraHistory(jiraId, result.ticket);
            
            displayJiraTicket(result.ticket);
            
            // Clear the number input field after successful search
            const numberInput = document.getElementById('jiraNumberInput');
            if (numberInput) {
                numberInput.value = '';
                // Update the history list to show the new item
                updateJiraHistoryList();
            }
            
            // Also fetch related GitHub PRs
            await fetchAndDisplayGitHubPRs(jiraId);
        } else {
            throw new Error(result.error || 'Failed to load JIRA ticket');
        }
    } catch (error) {
        console.error('🔥 ❌ Error in fetchAndDisplayJiraTicket:', error);
        document.getElementById('jiraTicketDisplay').innerHTML = 
            '<div class="error">Error loading ' + jiraId + ': ' + error.message + '</div>';
    }
}

function showLoadingState() {
    console.log('🔥 showLoadingState called');
    document.getElementById('jiraTicketDisplay').innerHTML = '<div class="loading">Loading JIRA ticket...</div>';
}

async function fetchAndDisplayGitHubPRs(jiraId) {
    console.log('🔥 fetchAndDisplayGitHubPRs called with:', jiraId);
    const githubContent = document.getElementById('github-content');
    
    // Show loading state in GitHub section
    githubContent.innerHTML = '<div class="loading">Loading related GitHub PRs...</div>';
    
    try {
        // Check if GitHub credentials are available
        if (!appState.apiTokens.github || !appState.apiTokens.githubUsername) {
            console.log('🔥 No GitHub credentials available');
            githubContent.innerHTML = '<div class="placeholder">Configure GitHub token and username in Settings to view related PRs</div>';
            return;
        }
        
        console.log('🔥 Searching GitHub for PRs containing:', jiraId);
        
        // Search GitHub for PRs mentioning this JIRA ID
        const searchQuery = encodeURIComponent(`${jiraId} type:pr org:RedHatInsights`);
        const searchUrl = `https://api.github.com/search/issues?q=${searchQuery}&sort=updated&order=desc&per_page=10`;
        
        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${appState.apiTokens.github}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'OCMUI-Team-Dashboard'
            }
        });
        
        console.log('🔥 GitHub API response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('🔥 GitHub search results:', data);
        
        if (data.items && data.items.length > 0) {
            // Fetch detailed PR information including reviewers and checks for each PR
            await fetchDetailedPRInfo(data.items, jiraId);
        } else {
            console.log('🔥 No GitHub PRs found');
            githubContent.innerHTML = '<div class="placeholder">No related GitHub PRs found for ' + jiraId + '</div>';
        }
        
    } catch (error) {
        console.error('🔥 ❌ Error fetching GitHub PRs:', error);
        githubContent.innerHTML = '<div class="error">Error loading GitHub PRs: ' + error.message + '</div>';
    }
}

function displayGitHubPRs(prs, jiraId) {
    console.log('🔥 displayGitHubPRs called with', prs.length, 'PRs');
    const githubContent = document.getElementById('github-content');
    
    if (!prs || prs.length === 0) {
        githubContent.innerHTML = '<div class="placeholder">No related PRs found</div>';
        return;
    }
    
    let html = '<div class="github-pr-list">';
    
    prs.forEach(pr => {
        const prState = pr.state === 'closed' ? (pr.pull_request?.merged_at ? 'merged' : 'closed') : 'open';
        const stateClass = `pr-status-${prState}`;
        const stateText = prState.charAt(0).toUpperCase() + prState.slice(1);
        
        const createdDate = new Date(pr.created_at).toLocaleDateString();
        const author = pr.user?.login || 'Unknown';
        const title = pr.title || 'No title';
        const url = pr.html_url;
        
        html += `
            <div class="github-pr-item">
                <div class="github-pr-header-row">
                    <a href="${url}" target="_blank" class="github-pr-title-link">${title}</a>
                    <div class="github-pr-status-row">
                        <span class="github-pr-status ${stateClass}">${stateText}</span>
                    </div>
                </div>
                <div class="github-pr-meta">
                    <span>By <span class="github-pr-author">${author}</span></span>
                    <span>•</span>
                    <span class="github-pr-date">${createdDate}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    githubContent.innerHTML = html;
}

async function fetchDetailedPRInfo(prs, jiraId) {
    console.log('🔥 fetchDetailedPRInfo called with', prs.length, 'PRs');
    const githubContent = document.getElementById('github-content');
    
    try {
        const detailedPRs = [];
        
        for (const pr of prs) {
            console.log('🔥 Fetching details for PR:', pr.number);
            
            // Extract owner and repo from PR URL
            const urlParts = pr.pull_request.url.match(/repos\/([^\/]+)\/([^\/]+)\/pulls/);
            if (!urlParts) continue;
            
            const owner = urlParts[1];
            const repo = urlParts[2];
            const prNumber = pr.number;
            
            // Fetch PR details, reviews, and checks in parallel
            const [prDetails, reviews, checks] = await Promise.all([
                fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
                    headers: {
                        'Authorization': `Bearer ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }).then(res => res.ok ? res.json() : null),
                
                fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
                    headers: {
                        'Authorization': `Bearer ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }).then(res => res.ok ? res.json() : []),
                
                fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${pr.pull_request?.head?.sha || 'HEAD'}/check-runs`, {
                    headers: {
                        'Authorization': `Bearer ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }).then(res => res.ok ? res.json() : { check_runs: [] })
            ]);
            
            // Combine original PR data with detailed info
            const enhancedPR = {
                ...pr,
                prDetails: prDetails,
                reviews: reviews || [],
                checks: checks?.check_runs || []
            };
            
            detailedPRs.push(enhancedPR);
            console.log('🔥 Enhanced PR:', enhancedPR.title, 'Reviews:', enhancedPR.reviews.length, 'Checks:', enhancedPR.checks.length);
        }
        
        displayGitHubPRsWithDetails(detailedPRs, jiraId);
        
    } catch (error) {
        console.error('🔥 ❌ Error fetching detailed PR info:', error);
        // Fallback to basic display
        displayGitHubPRs(prs, jiraId);
    }
}

function displayGitHubPRsWithDetails(prs, jiraId) {
    console.log('🔥 displayGitHubPRsWithDetails called with', prs.length, 'PRs');
    const githubContent = document.getElementById('github-content');
    
    if (!prs || prs.length === 0) {
        githubContent.innerHTML = '<div class="placeholder">No related PRs found</div>';
        return;
    }
    
    let html = '<div class="github-pr-list">';
    
    prs.forEach(pr => {
        const prState = pr.state === 'closed' ? (pr.pull_request?.merged_at ? 'merged' : 'closed') : 'open';
        const stateClass = `pr-status-${prState}`;
        const stateText = prState.charAt(0).toUpperCase() + prState.slice(1);
        
        const createdDate = new Date(pr.created_at).toLocaleDateString();
        const author = pr.user?.login || 'Unknown';
        const title = pr.title || 'No title';
        const url = pr.html_url;
        
        // Process reviewers
        const reviewerInfo = processReviewers(pr.reviews || [], pr.prDetails?.requested_reviewers || []);
        
        // Process checks
        const checkStatus = processChecks(pr.checks || []);
        
        // Check if PR needs rebase (mergeable_state)
        const needsRebase = pr.prDetails?.mergeable_state === 'dirty' || pr.prDetails?.mergeable === false;
        
        html += `
            <div class="github-pr-item">
                <div class="github-pr-header-row">
                    <a href="${url}" target="_blank" class="github-pr-title-link">${title}</a>
                    <div class="github-pr-status-row">
                        <span class="github-pr-status ${stateClass}">${stateText}</span>
                    </div>
                </div>
                <div class="github-pr-meta">
                    <span>By <span class="github-pr-author">${author}</span></span>
                    <span>•</span>
                    <span class="github-pr-date">${createdDate}</span>
                </div>
                <div class="github-pr-badges">
                    ${checkStatus.html}
                    ${needsRebase ? '<span class="pr-badge pr-badge-needs-rebase">Needs Rebase</span>' : ''}
                </div>
                ${reviewerInfo.html ? `<div class="github-pr-reviewers">
                    <span>Reviewers:</span>
                    ${reviewerInfo.html}
                </div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    githubContent.innerHTML = html;
}

function processReviewers(reviews, requestedReviewers) {
    const reviewerMap = new Map();
    
    // Add requested reviewers (pending state)
    requestedReviewers.forEach(reviewer => {
        if (reviewer.login) {
            reviewerMap.set(reviewer.login, {
                login: reviewer.login,
                state: 'REQUESTED',
                latest: true
            });
        }
    });
    
    // Process actual reviews (most recent state per reviewer)
    reviews.forEach(review => {
        if (review.user?.login) {
            const existing = reviewerMap.get(review.user.login);
            if (!existing || new Date(review.submitted_at) > new Date(existing.submitted_at)) {
                reviewerMap.set(review.user.login, {
                    login: review.user.login,
                    state: review.state,
                    submitted_at: review.submitted_at,
                    latest: true
                });
            }
        }
    });
    
    const reviewerList = Array.from(reviewerMap.values());
    
    if (reviewerList.length === 0) {
        return { html: '', count: 0 };
    }
    
    const reviewerHtml = reviewerList.map(reviewer => {
        let badgeClass = 'reviewer-review-requested';
        let badgeText = reviewer.login;
        
        switch (reviewer.state) {
            case 'APPROVED':
                badgeClass = 'reviewer-approved';
                badgeText = `✓ ${reviewer.login}`;
                break;
            case 'CHANGES_REQUESTED':
                badgeClass = 'reviewer-changes-requested';
                badgeText = `✗ ${reviewer.login}`;
                break;
            case 'COMMENTED':
                badgeClass = 'reviewer-commented';
                badgeText = `💬 ${reviewer.login}`;
                break;
            case 'DISMISSED':
                badgeClass = 'reviewer-dismissed';
                badgeText = `⊘ ${reviewer.login}`;
                break;
            default: // REQUESTED
                badgeClass = 'reviewer-review-requested';
                badgeText = `⏳ ${reviewer.login}`;
                break;
        }
        
        return `<span class="reviewer-item ${badgeClass}">${badgeText}</span>`;
    }).join('');
    
    return {
        html: `<div class="reviewer-list">${reviewerHtml}</div>`,
        count: reviewerList.length
    };
}

function processChecks(checkRuns) {
    if (!checkRuns || checkRuns.length === 0) {
        return { html: '', status: 'unknown' };
    }
    
    const statusCounts = {
        success: 0,
        failure: 0,
        pending: 0,
        neutral: 0
    };
    
    checkRuns.forEach(check => {
        switch (check.status) {
            case 'completed':
                if (check.conclusion === 'success') {
                    statusCounts.success++;
                } else if (check.conclusion === 'failure') {
                    statusCounts.failure++;
                } else {
                    statusCounts.neutral++;
                }
                break;
            default:
                statusCounts.pending++;
                break;
        }
    });
    
    let badgeClass = 'pr-badge-checks-pending';
    let badgeText = 'Checks';
    let overallStatus = 'pending';
    
    if (statusCounts.failure > 0) {
        badgeClass = 'pr-badge-checks-fail';
        badgeText = `✗ ${statusCounts.failure} failed`;
        overallStatus = 'failure';
    } else if (statusCounts.pending > 0) {
        badgeClass = 'pr-badge-checks-pending';
        badgeText = `⏳ ${statusCounts.pending} pending`;
        overallStatus = 'pending';
    } else if (statusCounts.success > 0) {
        badgeClass = 'pr-badge-checks-pass';
        badgeText = `✓ ${statusCounts.success} passed`;
        overallStatus = 'success';
    }
    
    return {
        html: `<span class="pr-badge ${badgeClass}">${badgeText}</span>`,
        status: overallStatus
    };
}

function getBadgeClass(type, value) {
    if (type === 'type') {
        return value.toLowerCase().replace(/\s+/g, '');
    }
    if (type === 'priority') {
        return value.toLowerCase().replace(/\s+/g, '');
    }
    if (type === 'status') {
        return value.toLowerCase().replace(/\s+/g, '').replace('inprogress', 'inprogress').replace('codereview', 'codereview');
    }
    return '';
}

function parseJiraMarkdown(text) {
    if (!text) return 'No content';
    
    // JIRA uses wiki markup, not standard markdown
    // Split into lines for better processing
    let lines = text.split('\n');
    let result = [];
    let inUnorderedList = false;
    let inOrderedList = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Headers (h1. h2. h3. etc.)
        if (line.match(/^h[1-6]\.\s*(.+)$/)) {
            if (inUnorderedList) { result.push('</ul>'); inUnorderedList = false; }
            if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
            
            line = line
                .replace(/^h1\.\s*(.+)$/, '<h1>$1</h1>')
                .replace(/^h2\.\s*(.+)$/, '<h2>$1</h2>')
                .replace(/^h3\.\s*(.+)$/, '<h3>$1</h3>')
                .replace(/^h4\.\s*(.+)$/, '<h4>$1</h4>')
                .replace(/^h5\.\s*(.+)$/, '<h5>$1</h5>')
                .replace(/^h6\.\s*(.+)$/, '<h6>$1</h6>');
        }
        // Unordered lists (* bullet points)
        else if (line.match(/^\*\s+(.+)$/)) {
            if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
            if (!inUnorderedList) { result.push('<ul>'); inUnorderedList = true; }
            line = line.replace(/^\*\s+(.+)$/, '<li>$1</li>');
        }
        // Ordered lists (# numbered)
        else if (line.match(/^#\s+(.+)$/)) {
            if (inUnorderedList) { result.push('</ul>'); inUnorderedList = false; }
            if (!inOrderedList) { result.push('<ol>'); inOrderedList = true; }
            line = line.replace(/^#\s+(.+)$/, '<li>$1</li>');
        }
        // Empty line or non-list item
        else {
            if (inUnorderedList) { result.push('</ul>'); inUnorderedList = false; }
            if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
            
            if (line.length === 0) {
                if (result.length > 0 && result[result.length - 1] !== '<br>') {
                    result.push('<br>');
                }
                continue;
            }
        }
        
        // Apply other formatting to the line
        line = line
            // JIRA color markup {color:#hexcode}text{color}
            .replace(/\{color:(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|[a-zA-Z]+)\}([^{]*)\{color\}/g, '<span style="color:$1">$2</span>')
            // Bold and italic
            .replace(/\*([^*]+)\*/g, '<strong>$1</strong>') // *bold*
            .replace(/\+([^+]+)\+/g, '<u>$1</u>')          // +underline+
            .replace(/_([^_]+)_/g, '<em>$1</em>')          // _italic_
            .replace(/\-([^-]+)\-/g, '<del>$1</del>')      // -strikethrough-
            // Links
            .replace(/\[([^\]]+)\|([^\]]+)\]/g, '<a href="$2" target="_blank">$1</a>') // [text|url]
            .replace(/\[([^\]]+)\]/g, '<a href="$1" target="_blank">$1</a>') // [url]
            // Code blocks
            .replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>') // {{code}}
            .replace(/\{code\}([\s\S]*?)\{code\}/g, '<pre><code>$1</code></pre>'); // {code}block{code}
        
        result.push(line);
    }
    
    // Close any remaining lists
    if (inUnorderedList) result.push('</ul>');
    if (inOrderedList) result.push('</ol>');
    
    // Join and clean up
    let converted = result.join('\n')
        .replace(/\n+/g, '\n')  // Remove multiple newlines
        .replace(/\n/g, ' ')    // Convert remaining newlines to spaces
        .replace(/\s+/g, ' ')   // Clean up extra spaces
        .replace(/>\s+</g, '><') // Remove spaces between tags
        .trim();
    
    return converted || 'No content';
}

function displayJiraTicket(ticket) {
    const displayElement = document.getElementById('jiraTicketDisplay');
    
    const typeClass = getBadgeClass('type', ticket.type);
    const priorityClass = getBadgeClass('priority', ticket.priority);
    const statusClass = getBadgeClass('status', ticket.status);
    
    const html = '<div class="jira-ticket">' +
        '<div class="jira-header">' +
        '<h3><a href="https://issues.redhat.com/browse/' + ticket.key + '" target="_blank" style="color: white; text-decoration: underline;">' +
        '<img src="assets/jiraLogo.png" style="width: 16px; height: 16px; margin-right: 8px;">' +
        ticket.key + ': ' + ticket.summary + '</a></h3>' +
        '</div>' +
        '<div class="jira-details-grid">' +
        '<div class="detail-left">' +
        '<p><strong>Type:</strong><span class="badge badge-type ' + typeClass + '">' + ticket.type + '</span></p>' +
        '<p><strong>Priority:</strong><span class="badge badge-priority badge-priority-' + priorityClass + '">' + ticket.priority + '</span></p>' +
        '<p><strong>Status:</strong><span class="badge badge-status ' + statusClass + '">' + ticket.status + '</span></p>' +
        '</div>' +
        '<div class="detail-right">' +
        '<p><strong>Assignee:</strong><span>' + (ticket.assignee || 'Unassigned') + '</span></p>' +
        '<p><strong>Reporter:</strong><span>' + ticket.reporter + '</span></p>' +
        '<p><strong>Created:</strong><span>' + new Date(ticket.created).toLocaleDateString() + '</span></p>' +
        '</div>' +
        '</div>' +
        '<div class="jira-section">' +
        '<label><strong>Description:</strong></label>' +
        '<div class="jira-content">' + parseJiraMarkdown(ticket.description) + '</div>' +
        '</div>' +
        (ticket.comments && ticket.comments.length > 0 ? 
        '<div class="jira-section">' +
        '<label><strong>Comments:</strong></label>' +
        '<div class="jira-content">' + formatCommentsHtml(ticket.comments) + '</div>' +
        '</div>' : '') +
        '</div>';
    
    displayElement.innerHTML = html;
}

function formatComments(comments) {
    if (!comments || comments.length === 0) return 'No comments';
    
    // Sort by created date, most recent first
    const sortedComments = comments.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    return sortedComments.slice(0, 5).map(comment => {
        const date = new Date(comment.created).toLocaleDateString();
        const author = comment.author || 'Unknown';
        const body = comment.body || '';
        return `[${date}] ${author}:\n${body}\n${'─'.repeat(50)}`;
    }).join('\n');
}

function formatCommentsHtml(comments) {
    if (!comments || comments.length === 0) return '<div class="no-comments">No comments</div>';
    
    // Sort by created date, most recent first
    const sortedComments = comments.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    // Show all comments
    return sortedComments.map(comment => {
        const date = new Date(comment.created).toLocaleDateString();
        const author = comment.author || 'Unknown';
        const body = parseJiraMarkdown(comment.body || '');
        return `<div class="comment">
            <div class="comment-header">
                <strong>${author}</strong> - ${date}
            </div>
            <div class="comment-body">${body}</div>
        </div>`;
    }).join('');
}

function updateReadyState() {
    const hasTokens = appState.apiTokens.github && appState.apiTokens.jira;
    const hasUsername = appState.apiTokens.githubUsername;
    
    console.log('🔄 Ready state:', { hasTokens, hasUsername });

    // Show/hide settings alert based on missing data
    const settingsAlert = document.getElementById("settingsAlert");
    const settingsBtn = document.getElementById("settingsBtn");
    
    if (settingsAlert && settingsBtn) {
        const needsSettings = !hasTokens || !hasUsername;
        settingsAlert.style.display = needsSettings ? "inline" : "none";
        
        // Add/remove red border class to settings button
        if (needsSettings) {
            settingsBtn.classList.add("settings-alert-active");
        } else {
            settingsBtn.classList.remove("settings-alert-active");
        }
    }
}

async function testGithubToken() {
    const tokenInput = document.getElementById('githubToken');
    const testBtn = document.getElementById('testGithub');
    const token = tokenInput.value.trim();
    
    if (!token) {
        alert('Please enter a GitHub token first');
        return;
    }
    
    // Update button to show testing state
    const originalText = testBtn.textContent;
    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;
    testBtn.style.backgroundColor = '#666';
    
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'OCMUI-Team-Dashboard'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            testBtn.textContent = '✅ Valid';
            testBtn.style.backgroundColor = '#10b981';
            console.log('✅ GitHub token valid for user:', userData.login);
            
            // Optionally pre-fill username if it's empty
            const usernameInput = document.getElementById('githubUsername');
            if (!usernameInput.value.trim() && userData.login) {
                usernameInput.value = userData.login;
            }
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        testBtn.textContent = '❌ Failed';
        testBtn.style.backgroundColor = '#ef4444';
        console.error('❌ GitHub token test failed:', error);
        alert(`GitHub token test failed: ${error.message}`);
    } finally {
        // Reset button after 3 seconds
        setTimeout(() => {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
            testBtn.style.backgroundColor = '#333';
        }, 3000);
    }
}

async function testJiraToken() {
    const tokenInput = document.getElementById('jiraToken');
    const testBtn = document.getElementById('testJira');
    const token = tokenInput.value.trim();
    
    if (!token) {
        alert('Please enter a JIRA token first');
        return;
    }
    
    // Update button to show testing state
    const originalText = testBtn.textContent;
    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;
    testBtn.style.backgroundColor = '#666';
    
    try {
        // Use our server-side proxy to avoid CORS issues
        const response = await fetch('/api/test-jira', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            testBtn.textContent = '✅ Valid';
            testBtn.style.backgroundColor = '#10b981';
            console.log('✅ JIRA token valid for user:', result.user.displayName);
        } else {
            throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        testBtn.textContent = '❌ Failed';
        testBtn.style.backgroundColor = '#ef4444';
        console.error('❌ JIRA token test failed:', error);
        
        // Show more user-friendly error messages
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error - please check your connection';
        } else if (error.message.includes('401')) {
            errorMessage = 'Invalid token - please check your JIRA API token';
        }
        
        alert(`JIRA token test failed: ${errorMessage}`);
    } finally {
        // Reset button after 3 seconds
        setTimeout(() => {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
            testBtn.style.backgroundColor = '#333';
        }, 3000);
    }
}

