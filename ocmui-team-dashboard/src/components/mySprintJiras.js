/**
 * My Sprint JIRAs Component
 * 
 * Handles the "My Sprint JIRAs" tab functionality including:
 * - Fetching JIRAs assigned to the user in open sprints
 * - Displaying JIRAs in a list format (left pane)
 * - Handling JIRA selection and details display (right pane)
 */

import { appState } from '../core/appState.js';
import { showErrorState, showPlaceholderState, showNotification, updateColumnTitleWithTimestamp, showGitHubRateLimitWarning } from '../utils/ui.js';
import { parseJiraMarkdown, getBadgeClass } from '../utils/formatting.js';
import { generateJiraCardHTML, generateJiraCardsFromResults } from '../utils/jiraCard.js';
import { generatePRCardsHTML } from '../utils/prCard.js';

// Auto-refresh timer for sprint JIRAs
let sprintJirasAutoRefreshTimer = null;
const AUTO_REFRESH_INTERVAL = 300000; // 5 minutes

/**
 * Clear auto-refresh timer for sprint JIRAs
 */
function clearSprintJirasAutoRefreshTimer() {
    if (sprintJirasAutoRefreshTimer) {
        clearTimeout(sprintJirasAutoRefreshTimer);
        sprintJirasAutoRefreshTimer = null;
        console.log('🕐 Cleared auto-refresh timer for My Sprint JIRAs');
    }
}

/**
 * Set auto-refresh timer for sprint JIRAs
 */
function setSprintJirasAutoRefreshTimer() {
    // Clear existing timer first
    clearSprintJirasAutoRefreshTimer();
    
    sprintJirasAutoRefreshTimer = setTimeout(() => {
        console.log('🕐 Auto-refresh triggered for My Sprint JIRAs after 5 minutes');
        console.log('🔄 Auto-refreshing My Sprint JIRAs...');
        loadMySprintJIRAs(true); // forceRefresh = true
    }, AUTO_REFRESH_INTERVAL);
    
    console.log('🕐 Set auto-refresh timer for My Sprint JIRAs (5 minutes)');
}

/**
 * Initialize the My Sprint JIRAs tab
 * Sets up event handlers and prepares the interface
 */
export function initializeMySprintJirasTab() {
    console.log('🎯 Initializing My Sprint JIRAs tab...');
    
    // Navigation activation is handled by triggerComponentActivation in ui.js
    // No additional setup needed here since the component is data-driven
    
    console.log('✅ My Sprint JIRAs tab initialized');
}

/**
 * Handle when the My Sprint JIRAs tab is activated
 * Loads sprint JIRAs if not already loaded
 */
function onMySprintJirasTabActivated() {
    console.log('🎯 My Sprint JIRAs tab activated');
    
    // Reset the GitHub PRs panel to placeholder state
    const githubContent = document.getElementById('my-sprint-jiras-github-content');
    if (githubContent) {
        githubContent.innerHTML = '<div class="placeholder">Select a JIRA ticket from the list to view associated PRs...</div>';
    }
    
    // Reset titles to default
    resetGitHubPanelTitle();
    resetSprintTabTitle();
    
    // Remove active state from all JIRA items since we're starting fresh
    document.querySelectorAll('.jira-ticket-section').forEach(jira => jira.classList.remove('active'));
    
    // Check if we have required credentials
    if (!appState.apiTokens.jira || !appState.apiTokens.jiraUsername) {
        showErrorState('my-sprint-jiras-list-content', 
            'JIRA credentials required', 
            'Please configure your JIRA token and username (email) in Settings');
        return;
    }
    
    // Load sprint JIRAs
    loadMySprintJIRAs();
}

/**
 * Load JIRAs assigned to the current user in open sprints
 * Shows loading state while fetching data
 * @param {boolean} forceRefresh - Whether to bypass cache and force refresh
 */
async function loadMySprintJIRAs(forceRefresh = false) {
    const jirasContainer = document.getElementById('my-sprint-jiras-list-content');
    
    // Check cache first (unless force refreshing)
    if (!forceRefresh) {
        // Check if we've loaded data recently to prevent excessive API calls
        const lastLoadTime = window.sprintJirasLastLoadTime || 0;
        const now = Date.now();
        const CACHE_DURATION = 300000; // 5 minutes cache
        
        if (jirasContainer && jirasContainer.innerHTML && 
            !jirasContainer.innerHTML.includes('Loading') && 
            !jirasContainer.innerHTML.includes('Failed') &&
            (now - lastLoadTime) < CACHE_DURATION) {
            const remainingTime = Math.round((CACHE_DURATION - (now - lastLoadTime)) / 1000);
            console.log(`✅ Sprint JIRAs cached for ${remainingTime}s more to prevent excessive API calls`);
            
            // Update UI to show cached data with refresh button
            const createRefreshCallback = () => {
                return async () => {
                    console.log('🔄 Manual refresh triggered for My Sprint JIRAs');
                    
                    // Clear the GitHub PRs panel
                    const githubContent = document.getElementById('my-sprint-jiras-github-content');
                    if (githubContent) {
                        githubContent.innerHTML = '<div class="placeholder">Select a JIRA ticket from the list to view associated PRs...</div>';
                    }
                    
                    // Reset the title to default
                    resetGitHubPanelTitle();
                    
                    // Remove active state from all JIRA items
                    document.querySelectorAll('.jira-ticket-section').forEach(jira => jira.classList.remove('active'));
                    
                    await loadMySprintJIRAs(true); // forceRefresh = true
                };
            };
            
            updateColumnTitleWithTimestamp('#my-sprint-jiras-list-column .column-title', 'My Sprint JIRAs', window.sprintJirasLastLoadTime, createRefreshCallback());
            return;
        }
    }
    
    // Set load timestamp to prevent rapid successive calls
    window.sprintJirasLastLoadTime = Date.now();
    
    // Clear existing timer if this is a manual refresh
    if (forceRefresh) {
        console.log('🕐 Manual refresh - clearing sprint JIRAs timer');
        clearSprintJirasAutoRefreshTimer();
    }
    
    if (!jirasContainer) {
        console.error('❌ My Sprint JIRAs list container not found: my-sprint-jiras-list-content');
        return;
    }
    
    // Show loading state
    jirasContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <span>Loading your sprint JIRAs...</span>
        </div>
    `;
    
    try {
        console.log('🎯 Fetching JIRAs assigned to user in open sprints...');
        
        const requestBody = {
            jiraUsername: appState.apiTokens.jiraUsername,
            token: appState.apiTokens.jira
        };
        
        const response = await fetch('/api/jira-sprint-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch sprint JIRAs');
        }
        
        console.log(`🎯 Found ${data.tickets?.length || 0} sprint JIRAs for user`);
        
        // Update the secondary tab title if we have sprint name
        if (data.sprintName) {
            updateSprintTabTitle(data.sprintName);
        }
        
        displaySprintJIRAs(data.tickets || []);
        
    } catch (error) {
        console.error('❌ Error loading My Sprint JIRAs:', error);
        
        // Check if it's an API endpoint issue (might not be implemented yet)
        if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
            showErrorState('my-sprint-jiras-list-content', 
                'API Endpoint Not Implemented', 
                'The /api/jira-sprint-tickets endpoint needs to be implemented on the backend server');
            showNotification('Backend API endpoint needs to be implemented', 'warning');
        } else {
            showErrorState('my-sprint-jiras-list-content', 
                'Failed to load sprint JIRAs', 
                error.message);
            showNotification('Failed to load sprint JIRAs. Check your JIRA credentials.', 'error');
        }
    }
}

/**
 * Display the list of sprint JIRAs in the left pane
 * @param {Array} jiraTickets - Array of JIRA ticket objects
 */
function displaySprintJIRAs(jiraTickets) {
    const jirasContainer = document.getElementById('my-sprint-jiras-list-content');
    
    if (!jirasContainer) {
        console.error('❌ My Sprint JIRAs list container not found: my-sprint-jiras-list-content');
        return;
    }
    
    if (jiraTickets.length === 0) {
        showPlaceholderState('my-sprint-jiras-list-content', 
            'No JIRAs assigned to you in open sprints', 
            '🎯');
        return;
    }
    
    // Sort JIRAs by priority and status
    const sortedJIRAs = [...jiraTickets].sort((a, b) => {
        // First sort by priority (High, Medium, Low)
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        const aPriority = priorityOrder[a.priority] || 4;
        const bPriority = priorityOrder[b.priority] || 4;
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // Then sort by status (In Progress first, then others)
        if (a.status === 'In Progress' && b.status !== 'In Progress') return -1;
        if (b.status === 'In Progress' && a.status !== 'In Progress') return 1;
        
        // Finally sort by updated date (most recent first)
        return new Date(b.updated) - new Date(a.updated);
    });
    
    // Convert sprint JIRA data to format expected by generateJiraCardsFromResults
    const jiraResults = sortedJIRAs.map(jira => ({
        success: true,
        jiraId: jira.key,
        ticket: {
            key: jira.key,
            summary: jira.summary,
            description: jira.description,
            status: jira.status,
            priority: jira.priority,
            assignee: jira.assignee,
            reporter: jira.reporter,
            type: jira.type,
            created: jira.created,
            updated: jira.updated,
            // Add sprint info to description for display
            sprintInfo: jira.sprint
        }
    }));
    
    // Generate JIRA cards using shared component (same format as Associated JIRAs)
    const jirasHtml = generateJiraCardsFromResults(jiraResults, {
        collapsible: true,
        wrapInSection: true,
        initiallyExpanded: false,
        toggleFunction: 'toggleCollapsibleSection'
    });
    
    jirasContainer.innerHTML = `
        <div class="sprint-jiras-list">
            <div class="jira-tickets">
                ${jirasHtml}
            </div>
        </div>
    `;
    
    // Add click handlers to JIRA cards for selection
    setTimeout(() => {
        const jiraCards = jirasContainer.querySelectorAll('.jira-ticket-section[data-jira-id]');
        jiraCards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on links or collapsible toggle
                if (e.target.tagName === 'A' || e.target.closest('[onclick]')) {
                    return;
                }
                
                const jiraId = card.getAttribute('data-jira-id');
                selectSprintJIRAForDetails(jiraId);
            });
        });
    }, 0);
    
    // Create refresh callback
    const createRefreshCallback = () => {
        return async () => {
            console.log('🔄 Manual refresh triggered for My Sprint JIRAs');
            
            // Clear the GitHub PRs panel
            const githubContent = document.getElementById('my-sprint-jiras-github-content');
            if (githubContent) {
                githubContent.innerHTML = '<div class="placeholder">Select a JIRA ticket from the list to view associated PRs...</div>';
            }
            
            // Reset the title to default
            resetGitHubPanelTitle();
            
            // Remove active state from all JIRA items
            document.querySelectorAll('.jira-ticket-section').forEach(jira => jira.classList.remove('active'));
            
            await loadMySprintJIRAs(true); // forceRefresh = true
        };
    };
    
    // Update column title with timestamp and refresh button
    updateColumnTitleWithTimestamp('#my-sprint-jiras-list-column .column-title', 'My Sprint JIRAs', window.sprintJirasLastLoadTime, createRefreshCallback());
    
    console.log(`✅ Displayed ${jiraTickets.length} sprint JIRAs`);
    
    // Set auto-refresh timer for successful data load
    setSprintJirasAutoRefreshTimer();
}

/**
 * Handle JIRA selection from the list to show details in right pane
 * @param {string} jiraId - The JIRA ticket ID that was selected
 */
function selectSprintJIRAForDetails(jiraId) {
    console.log(`🎯 Selected sprint JIRA ${jiraId} for GitHub PRs view`);
    
    // Remove active state from other JIRA items (now using shared component format)
    document.querySelectorAll('.jira-ticket-section').forEach(jira => jira.classList.remove('active'));
    
    // Add active state to clicked JIRA item
    const selectedItem = document.querySelector(`.jira-ticket-section[data-jira-id="${jiraId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    // Update the right pane title to show the selected JIRA ID
    updateGitHubPanelTitle(jiraId);
    
    // Load associated GitHub PRs for right pane
    loadAssociatedGitHubPRs(jiraId);
}

/**
 * Update the GitHub PRs panel title to show the selected JIRA ID
 * @param {string} jiraId - The selected JIRA ticket ID
 */
function updateGitHubPanelTitle(jiraId) {
    const titleElement = document.querySelector('#my-sprint-jiras-github-title .title-text');
    if (titleElement) {
        titleElement.textContent = `PRs associated with ${jiraId}`;
    }
}

/**
 * Reset the GitHub PRs panel title to default
 */
function resetGitHubPanelTitle() {
    const titleElement = document.querySelector('#my-sprint-jiras-github-title .title-text');
    if (titleElement) {
        titleElement.textContent = 'Associated PRs';
    }
}

/**
 * Update the secondary tab title with the sprint name
 * @param {string} sprintName - The active sprint name from JIRA
 */
function updateSprintTabTitle(sprintName) {
    const tabButton = document.querySelector('[data-secondary-tab="my-sprint-jiras"]');
    if (tabButton) {
        // Clean up the sprint name for display (remove common prefixes/suffixes)
        let displayName = sprintName;
        
        // Remove common sprint prefixes like "Sprint ", "PI ", etc.
        displayName = displayName.replace(/^(Sprint\s+|PI\s+)/i, '');
        
        // Update the tab text
        tabButton.textContent = `My ${displayName} JIRAs`;
        console.log(`✅ Updated sprint tab title to: My ${displayName} JIRAs`);
    }
}

/**
 * Reset the sprint tab title to default
 */
function resetSprintTabTitle() {
    const tabButton = document.querySelector('[data-secondary-tab="my-sprint-jiras"]');
    if (tabButton) {
        tabButton.textContent = 'My Sprint JIRAs';
    }
}

/**
 * Load and display GitHub PRs associated with the selected JIRA
 * @param {string} jiraId - The JIRA ticket ID to search PRs for
 */
async function loadAssociatedGitHubPRs(jiraId) {
    console.log('🐙 Fetching GitHub PRs for JIRA:', jiraId);
    
    const githubContent = document.getElementById('my-sprint-jiras-github-content');
    if (!githubContent) {
        console.error('❌ GitHub content container not found: my-sprint-jiras-github-content');
        return;
    }
    
    // Check if GitHub token is configured
    if (!appState.apiTokens.github || !appState.apiTokens.githubUsername) {
        githubContent.innerHTML = '<div class="placeholder">Configure GitHub token and username in Settings to view related PRs</div>';
        return;
    }
    
    try {
        githubContent.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <span>🔍 Searching for PRs related to ${jiraId}...</span>
            </div>
        `;
        
        // Search for PRs mentioning the JIRA ID
        const searchResults = await searchGithubPRsForJira(jiraId);
        
        if (searchResults.length === 0) {
            githubContent.innerHTML = `<div class="placeholder">No related PRs found for ${jiraId}</div>`;
            return;
        }
        
        // Fetch detailed information for each PR
        const detailedPRs = await fetchDetailedPRInfoForJira(searchResults, jiraId);
        
        // Display PRs with full details
        displayGitHubPRsForJira(detailedPRs, jiraId);
        
    } catch (error) {
        console.error('❌ GitHub PR fetch error:', error);
        if (error.message && error.message.includes('403')) {
            showGitHubRateLimitWarning('my-sprint-jiras-github-content', `search for PRs related to ${jiraId}`);
        } else {
            showErrorState('my-sprint-jiras-github-content', 
                `Error loading GitHub PRs for ${jiraId}`, 
                error.message);
        }
    }
}

/**
 * Search GitHub for PRs mentioning a JIRA ID
 * @param {string} jiraId - The JIRA ticket ID to search for
 * @returns {Promise<Array>} Array of PR search results
 */
async function searchGithubPRsForJira(jiraId) {
    // Use quoted search for exact JIRA ID matching to avoid partial matches
    const searchQuery = `"${jiraId}" type:pr`;
    const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc`;
    
    console.log(`🔍 Searching GitHub for JIRA ${jiraId} with query: ${searchQuery}`);
    
    const response = await fetch(searchUrl, {
        headers: {
            'Authorization': `Bearer ${appState.apiTokens.github}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'OCMUI-Team-Dashboard'
        }
    });
    
    if (!response.ok) {
        throw new Error(`GitHub search failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 Found ${data.items?.length || 0} PRs for JIRA ${jiraId}`);
    
    // Filter results to ensure they actually contain the JIRA ID
    const filteredResults = (data.items || []).filter(pr => {
        const containsJiraId = verifyPRContainsJiraId(pr, jiraId);
        if (!containsJiraId) {
            console.warn(`⚠️ PR #${pr.number} was returned by search but doesn't contain ${jiraId}`);
        }
        return containsJiraId;
    });
    
    console.log(`✅ After filtering: ${filteredResults.length} PRs actually contain ${jiraId}`);
    return filteredResults;
}

/**
 * Verify that a PR actually contains the JIRA ID we're searching for
 * @param {Object} pr - The PR object from GitHub search
 * @param {string} jiraId - The JIRA ID to verify
 * @returns {boolean} True if PR contains the JIRA ID
 */
function verifyPRContainsJiraId(pr, jiraId) {
    // Check title
    if (pr.title && pr.title.includes(jiraId)) return true;
    
    // Check body/description
    if (pr.body && pr.body.includes(jiraId)) return true;
    
    // Check if it's in labels
    if (pr.labels && pr.labels.some(label => label.name.includes(jiraId))) return true;
    
    return false;
}

/**
 * Fetch detailed information for GitHub PRs
 * @param {Array} prs - Array of basic PR objects from search
 * @param {string} jiraId - The related JIRA ticket ID
 * @returns {Promise<Array>} Array of PRs with detailed information
 */
async function fetchDetailedPRInfoForJira(prs, jiraId) {
    console.log('🔍 Fetching detailed PR info for', prs.length, 'PRs');
    
    const detailedPromises = prs.map(async (pr) => {
        try {
            // Get detailed PR information
            const prResponse = await fetch(pr.pull_request.url, {
                headers: {
                    'Authorization': `Bearer ${appState.apiTokens.github}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'OCMUI-Team-Dashboard'
                }
            });
            
            if (prResponse.ok) {
                pr.prDetails = await prResponse.json();
            }
            
            // Get PR reviews and general comments
            const [reviewsResponse, commentsResponse] = await Promise.all([
                fetch(`${pr.pull_request.url}/reviews`, {
                    headers: {
                        'Authorization': `Bearer ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OCMUI-Team-Dashboard'
                    }
                }),
                fetch(`${pr.pull_request.url.replace('/pulls/', '/issues/')}/comments`, {
                    headers: {
                        'Authorization': `Bearer ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OCMUI-Team-Dashboard'
                    }
                })
            ]);
            
            if (reviewsResponse.ok) {
                pr.reviews = await reviewsResponse.json();
            }
            
            if (commentsResponse.ok) {
                pr.comments = await commentsResponse.json();
            }
            
            // Get check runs for the latest commit
            if (pr.prDetails && pr.prDetails.head && pr.prDetails.head.sha) {
                const headSha = pr.prDetails.head.sha;
                const checksResponse = await fetch(
                    `https://api.github.com/repos/${pr.prDetails.base.repo.full_name}/commits/${headSha}/check-runs`,
                    {
                        headers: {
                            'Authorization': `Bearer ${appState.apiTokens.github}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'OCMUI-Team-Dashboard'
                        }
                    }
                );
                
                if (checksResponse.ok) {
                    const checksData = await checksResponse.json();
                    pr.checkRuns = checksData.check_runs || [];
                }
            }
            
            return pr;
        } catch (error) {
            console.error('❌ Error fetching details for PR:', pr.html_url, error);
            return pr; // Return basic PR info even if detailed fetch fails
        }
    });
    
    return Promise.all(detailedPromises);
}

/**
 * Display GitHub PRs with detailed information for the selected JIRA
 * @param {Array} prs - Array of detailed PR objects
 * @param {string} jiraId - The related JIRA ticket ID
 */
function displayGitHubPRsForJira(prs, jiraId) {
    console.log('📊 Displaying', prs.length, 'PRs with details for JIRA', jiraId);
    
    const githubContent = document.getElementById('my-sprint-jiras-github-content');
    if (!githubContent) return;
    
    if (!prs || prs.length === 0) {
        githubContent.innerHTML = `<div class="placeholder">No related PRs found for ${jiraId}</div>`;
        return;
    }
    
    // Generate PR cards using shared component with clickable titles
    const prsHtml = generatePRCardsHTML(prs, {
        clickableTitle: true,
        showLinkIcon: false,
        showMoreInfo: true,
        initiallyExpanded: false,
        currentUser: appState.apiTokens.githubUsername
    });
    
    githubContent.innerHTML = `<div class="github-prs-container">${prsHtml}</div>`;
    
    console.log(`✅ Displayed ${prs.length} GitHub PRs for JIRA ${jiraId}`);
}

// Make the JIRA selection function available globally
if (typeof window !== 'undefined') {
    window.selectSprintJIRAForDetails = selectSprintJIRAForDetails;
}

// Make activation function globally available for two-level navigation
if (typeof window !== 'undefined') {
    window.onMySprintJirasTabActivated = onMySprintJirasTabActivated;
}
