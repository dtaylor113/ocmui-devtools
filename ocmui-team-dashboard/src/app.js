/**
 * OCMUI Team Dashboard - Main Application
 * 
 * This is the main application orchestrator that initializes all modules
 * and coordinates the overall application flow. The heavy lifting is done
 * by specialized modules in core/, components/, and utils/ directories.
 */

import './styles/main.css';

// Core application modules
import { loadAppState, appState } from './core/appState.js';
import { initializeSettingsModal, updateReadyState } from './core/settings.js';

// Feature components
import { initializeJiraTab, setGitHubPRFetcher } from './components/jira.js';
import { fetchAndDisplayGitHubPRs } from './components/github.js';

// UI utilities
import { initializeTabNavigation, initializeSplitPanes } from './utils/ui.js';

/**
 * Application initialization
 * Called when DOM is fully loaded, sets up all application features
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 OCMUI Team Dashboard initializing...');
    
    try {
        // Initialize application state from localStorage
        loadAppState();
        
        // Initialize core UI components
        initializeTabNavigation();
        initializeSettingsModal();
        
        // Initialize feature modules
        initializeJiraTab();
        
        // Set up module cross-dependencies
        setupModuleDependencies();
        
        // Initialize advanced UI features
        initializeSplitPanes();
        
        // Update UI based on current state
        updateReadyState();
        
        console.log('📊 Application state loaded:', {
            currentTab: appState.currentTab,
            hasGitHubToken: !!appState.apiTokens.github,
            hasJiraToken: !!appState.apiTokens.jira,
            hasGitHubUsername: !!appState.apiTokens.githubUsername,
            jiraHistoryCount: appState.jiraHistory.length,
            jiraPrefixCount: appState.jiraPrefixes.length
        });
        
        console.log('✅ OCMUI Team Dashboard ready!');
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        
        // Show error state to user
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="initialization-error">
                    <h2>⚠️ Application Error</h2>
                    <p>The dashboard failed to initialize properly.</p>
                    <p>Please refresh the page or check the console for details.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
                </div>
            `;
        }
    }
});

/**
 * Set up cross-module dependencies
 * Some modules need to call functions from other modules, this sets up those connections
 */
function setupModuleDependencies() {
    // Allow JIRA module to trigger GitHub PR fetching
    setGitHubPRFetcher(fetchAndDisplayGitHubPRs);
}

/**
 * Global error handler for unhandled errors
 * Provides fallback error handling and user feedback
 */
window.addEventListener('error', function(event) {
    console.error('🚨 Unhandled error:', event.error);
    
    // Log error details for debugging
    console.error('Error details:', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
    });
});

/**
 * Global handler for unhandled promise rejections
 * Provides fallback handling for async errors
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});

/**
 * Export app state for debugging in browser console
 * Allows developers to inspect application state during development
 */
if (typeof window !== 'undefined') {
    window.OCMUIDebug = {
        appState,
        version: '1.0.0',
        modules: {
            core: ['appState', 'settings'],
            components: ['jira', 'github'], 
            utils: ['formatting', 'ui']
        }
    };
    
    console.log('🐛 Debug interface available at: window.OCMUIDebug');
}
