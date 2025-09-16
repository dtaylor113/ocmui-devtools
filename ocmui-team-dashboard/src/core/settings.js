/**
 * Settings Management Module
 * 
 * Handles the settings modal, API token validation, and user configuration.
 * Provides a centralized interface for managing user authentication
 * and application preferences.
 */

import { appState, saveApiTokens } from './appState.js';
import { updateTabTitlesWithUsername } from '../utils/ui.js';

/**
 * Initialize the settings modal and attach event listeners
 * Sets up the modal trigger button and prepares the settings interface
 */
export function initializeSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsModal);
    }
}

/**
 * Open the settings modal with current configuration
 * Displays modal with pre-filled API tokens and test buttons
 */
export function openSettingsModal() {
    const modalHtml = `
        <div class="modal-backdrop">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>⚙️ Settings</h2>
                    <button class="modal-close" id="settingsClose">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="githubToken">GitHub Token:</label>
                        <div class="input-row">
                            <input type="password" id="githubToken" 
                                   placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                                   value="${appState.apiTokens.github || ''}">
                            <button class="test-btn" id="testGithub">Test</button>
                        </div>
                        <div class="help-text">
                            <a href="https://github.com/settings/tokens" target="_blank">Create GitHub Token →</a>
                            <small>Required scopes: public_repo, repo:status, read:user</small>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="githubUsername">GitHub Username:</label>
                        <input type="text" id="githubUsername" 
                               placeholder="your-github-username" 
                               value="${appState.apiTokens.githubUsername || ''}">
                        <div class="help-text">
                            <small>Used for "Awaiting My Code Review" and "My PRs" tabs</small>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="jiraToken">JIRA Token:</label>
                        <div class="input-row">
                            <input type="password" id="jiraToken" 
                                   placeholder="Your JIRA API token" 
                                   value="${appState.apiTokens.jira || ''}">
                            <button class="test-btn" id="testJira">Test</button>
                        </div>
                        <div class="help-text">
                            <a href="https://issues.redhat.com/secure/ViewProfile.jspa" target="_blank">Create JIRA Token →</a>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="jiraUsername">JIRA Username:</label>
                        <input type="email" id="jiraUsername" 
                               placeholder="your-email@redhat.com" 
                               value="${appState.apiTokens.jiraUsername || ''}">
                        <div class="help-text">
                            <small>Your JIRA login email - used for "My Sprint JIRAs" to find tickets assigned to you</small>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="settingsCancel">Cancel</button>
                    <button class="btn btn-primary" id="settingsSave">Save</button>
                </div>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('settingsModal');
    modal.innerHTML = modalHtml;
    modal.style.display = 'block';
    
    // Attach event listeners for modal interactions
    attachModalEventListeners();
}

/**
 * Attach event listeners to modal elements
 * Handles close, save, cancel, and test button interactions
 */
function attachModalEventListeners() {
    document.getElementById('settingsClose').addEventListener('click', closeSettingsModal);
    document.getElementById('settingsCancel').addEventListener('click', closeSettingsModal);
    document.getElementById('settingsSave').addEventListener('click', saveSettings);
    document.getElementById('testGithub').addEventListener('click', testGithubToken);
    document.getElementById('testJira').addEventListener('click', testJiraToken);
    
    // Close modal when clicking outside content area
    document.querySelector('.modal-backdrop').addEventListener('click', function(e) {
        if (e.target === this) closeSettingsModal();
    });
}

/**
 * Close the settings modal
 * Hides the modal and cleans up any temporary state
 */
export function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
        modal.innerHTML = '';
    }
}

/**
 * Save settings to application state and localStorage
 * Updates tokens and triggers UI state refresh
 */
export function saveSettings() {
    const githubToken = document.getElementById('githubToken').value.trim();
    const githubUsername = document.getElementById('githubUsername').value.trim();
    const jiraToken = document.getElementById('jiraToken').value.trim();
    const jiraUsername = document.getElementById('jiraUsername').value.trim();
    
    // Update application state
    appState.apiTokens.github = githubToken;
    appState.apiTokens.githubUsername = githubUsername;
    appState.apiTokens.jira = jiraToken;
    appState.apiTokens.jiraUsername = jiraUsername;
    
    // Persist to localStorage
    saveApiTokens();
    
    // Update UI to reflect new ready state
    updateReadyState();
    
    // Update tab titles with the new GitHub username
    updateTabTitlesWithUsername();
    
    closeSettingsModal();
    
    console.log('✅ Settings saved successfully');
}

/**
 * Test GitHub token validity
 * Makes an authenticated request to GitHub API to verify token
 */
export async function testGithubToken() {
    const token = document.getElementById('githubToken').value.trim();
    const button = document.getElementById('testGithub');
    
    if (!token) {
        showTestResult(button, false, 'Token is required');
        return;
    }
    
    // Show loading state
    const originalText = button.textContent;
    button.textContent = 'Testing...';
    button.disabled = true;
    
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            showTestResult(button, true, `Connected as ${userData.login}`);
        } else {
            const errorData = await response.json();
            showTestResult(button, false, errorData.message || 'Invalid token');
        }
    } catch (error) {
        console.error('GitHub token test error:', error);
        showTestResult(button, false, 'Network error or invalid token');
    }
    
    // Re-enable button after showing result
    setTimeout(() => {
        button.disabled = false;
    }, 100);
}

/**
 * Test JIRA token validity
 * Makes an authenticated request through our proxy to verify JIRA token
 */
export async function testJiraToken() {
    const token = document.getElementById('jiraToken').value.trim();
    const button = document.getElementById('testJira');
    
    if (!token) {
        showTestResult(button, false, 'Token is required');
        return;
    }
    
    // Show loading state
    const originalText = button.textContent;
    button.textContent = 'Testing...';
    button.disabled = true;
    
    try {
        const response = await fetch('/api/test-jira', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showTestResult(button, true, 'JIRA connection successful');
            } else {
                showTestResult(button, false, result.error || 'Authentication failed');
            }
        } else {
            showTestResult(button, false, 'Server error - please try again');
        }
    } catch (error) {
        console.error('JIRA token test error:', error);
        showTestResult(button, false, 'Network error - please check connection');
    }
    
    // Re-enable button after showing result
    setTimeout(() => {
        button.disabled = false;
    }, 100);
}

/**
 * Show visual feedback for token test results
 * @param {HTMLElement} button - The test button element
 * @param {boolean} success - Whether the test passed
 * @param {string} message - Result message to display
 */
function showTestResult(button, success, message) {
    // Remove any existing result classes
    button.classList.remove('test-success', 'test-failure');
    
    // Add appropriate result class
    button.classList.add(success ? 'test-success' : 'test-failure');
    
    // Show result message immediately
    button.textContent = message;
    
    // Reset after 3 seconds
    setTimeout(() => {
        button.textContent = 'Test';
        button.classList.remove('test-success', 'test-failure');
    }, 3000);
    
    console.log(`${success ? '✅' : '❌'} Token test result: ${message}`);
}

/**
 * Update the ready state indicator in the header
 * Shows/hides the alert icon based on whether API tokens are configured
 */
export function updateReadyState() {
    const settingsAlert = document.getElementById('settingsAlert');
    const settingsBtn = document.getElementById('settingsBtn');
    
    const isReady = !!(appState.apiTokens.github && 
                      appState.apiTokens.jira && 
                      appState.apiTokens.githubUsername &&
                      appState.apiTokens.jiraUsername);
    
    if (settingsAlert && settingsBtn) {
        if (isReady) {
            settingsAlert.style.display = 'none';
            settingsBtn.classList.remove('settings-alert-active');
        } else {
            settingsAlert.style.display = 'inline';
            settingsBtn.classList.add('settings-alert-active');
        }
    }
}
