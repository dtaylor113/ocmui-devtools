/**
 * Application State Management
 * 
 * Handles the global application state, localStorage persistence,
 * and state initialization. This module provides a centralized
 * way to manage the application's data and configuration.
 */

/**
 * Global application state object
 * Contains all persistent and runtime application data
 */
export let appState = {
    currentTab: 'jira',                    // Currently active tab ('jira', 'reviews', 'my-prs')
    apiTokens: {                          // API authentication tokens
        github: '',                       // GitHub personal access token
        jira: '',                        // JIRA API token
        githubUsername: ''               // GitHub username for API calls
    },
    jiraHistory: [],                     // Recently accessed JIRA tickets (with metadata)
    jiraPrefixes: ['OCMUI-'],           // Project prefixes (OCMUI-, XCMSTRAT-, OCM-, etc.)
    selectedJiraId: null                // Currently selected/active JIRA ticket ID
};

/**
 * Load application state from localStorage
 * Initializes appState with persisted data or defaults
 */
export function loadAppState() {
    try {
        // Load API tokens
        const tokens = localStorage.getItem('ocmui_api_tokens');
        if (tokens) {
            appState.apiTokens = { ...appState.apiTokens, ...JSON.parse(tokens) };
        }
        
        // Load JIRA history with error handling for legacy formats
        const history = localStorage.getItem('ocmui_jira_history');
        if (history) {
            const parsedHistory = JSON.parse(history);
            // Ensure history items have required structure
            appState.jiraHistory = parsedHistory.map(item => {
                if (typeof item === 'string') {
                    // Convert legacy string format to object format
                    return { id: item, summary: '', assignee: 'Unknown' };
                }
                return item;
            });
        }
        
        // Load JIRA project prefixes
        const prefixes = localStorage.getItem('ocmui_jira_prefixes');
        if (prefixes) {
            const parsedPrefixes = JSON.parse(prefixes);
            if (Array.isArray(parsedPrefixes) && parsedPrefixes.length > 0) {
                appState.jiraPrefixes = parsedPrefixes;
            }
        }
        
        console.log('📱 Application state loaded from localStorage');
    } catch (error) {
        console.error('❌ Error loading application state:', error);
        // Reset to defaults on corruption
        appState = {
            currentTab: 'jira',
            apiTokens: { github: '', jira: '', githubUsername: '' },
            jiraHistory: [],
            jiraPrefixes: ['OCMUI-'],
            selectedJiraId: null
        };
    }
}

/**
 * Persist API tokens to localStorage
 * Called whenever tokens are updated in settings
 */
export function saveApiTokens() {
    try {
        localStorage.setItem('ocmui_api_tokens', JSON.stringify(appState.apiTokens));
        console.log('💾 API tokens saved to localStorage');
    } catch (error) {
        console.error('❌ Error saving API tokens:', error);
    }
}

/**
 * Update the current active tab
 * @param {string} tabName - Tab identifier ('jira', 'reviews', 'my-prs')
 */
export function setCurrentTab(tabName) {
    appState.currentTab = tabName;
}

/**
 * Get the default JIRA prefix (most recently used)
 * @returns {string} The default prefix to use for new JIRA entries
 */
export function getDefaultJiraPrefix() {
    return appState.jiraPrefixes && appState.jiraPrefixes.length > 0 
        ? appState.jiraPrefixes[0] 
        : 'OCMUI-';
}

/**
 * Check if all required API tokens are configured
 * @returns {boolean} True if both GitHub and JIRA tokens are set
 */
export function areApiTokensConfigured() {
    return !!(appState.apiTokens.github && 
              appState.apiTokens.jira && 
              appState.apiTokens.githubUsername);
}
