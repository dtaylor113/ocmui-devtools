/**
 * OCMUI Team Tools - Chrome Extension Popup
 * 
 * Architecture Overview:
 * - Chrome Extension V3 popup with CSP-compliant event handling
 * - JIRA API integration with Bearer/Basic auth fallback
 * - Intelligent blocked ticket detection using custom field analysis
 * - Chrome storage for secure token management and JIRA history
 * - Two-column responsive layout for JIRA ticket display
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // ==================== POPUP PERSISTENCE ====================
    // Prevent popup from auto-closing during user interactions
    
    // Prevent closing when interacting with popup content
    document.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Allow manual popup close with Escape key (but not when settings modal is open)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !document.querySelector('.settings-modal[style*="display: block"]')) {
            window.close();
        }
    });
    // ==================== DOM ELEMENTS & STATE ====================
    const jiraInput = document.getElementById('jiraInput');
    const jiraDropdown = document.getElementById('jiraDropdown');
    const githubButton = document.getElementById('githubButton');
    const jiraBoardButton = document.getElementById('jiraBoardButton');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsClose = document.getElementById('settingsClose');
    const settingsCancel = document.getElementById('settingsCancel');
    const settingsSave = document.getElementById('settingsSave');
    const githubTokenInput = document.getElementById('githubToken');
    const jiraTokenInput = document.getElementById('jiraToken');
    const testGithubBtn = document.getElementById('testGithub');
    const testJiraBtn = document.getElementById('testJira');
    const githubErrorDiv = document.getElementById('githubError');
    const jiraErrorDiv = document.getElementById('jiraError');
    
    // Application state - persisted in Chrome storage
    let jiraHistory = [];
    let apiTokens = { github: '', jira: '' };
    
    // ==================== INITIALIZATION ====================
    loadJiraHistory();
    loadApiTokens();
    
    // Update ready message after tokens are loaded
    setTimeout(() => {
        const hasGithubToken = apiTokens.github && apiTokens.github.trim().length > 0;
        const hasJiraToken = apiTokens.jira && apiTokens.jira.trim().length > 0;
        const needsSetup = !hasGithubToken || !hasJiraToken;
        updateReadyMessage(needsSetup);
    }, 100);
    
    // ==================== EVENT LISTENERS ====================
    // JIRA input handlers
    jiraInput.addEventListener('keydown', handleJiraInputKeydown);
    jiraInput.addEventListener('input', handleJiraInputChange);
    jiraInput.addEventListener('focus', showDropdown);
    jiraInput.addEventListener('blur', hideDropdownDelayed);
    
    // Navigation buttons
    githubButton.addEventListener('click', function(e) {
        e.preventDefault();
        openTab('https://github.com/RedHatInsights/uhc-portal/pulls');
    });
    
    jiraBoardButton.addEventListener('click', function(e) {
        e.preventDefault();
        openTab('https://issues.redhat.com/secure/RapidBoard.jspa?rapidView=15825&projectKey=OCMUI&view=planning.nodetail&issueLimit=100#');
    });
    
    const timeboardButton = document.getElementById('timeboardButton');
    timeboardButton.addEventListener('click', function(e) {
        e.preventDefault();
        openTimeboard();
    });
    
    // Settings modal handlers
    settingsBtn.addEventListener('click', openSettings);
    settingsClose.addEventListener('click', closeSettings);
    settingsCancel.addEventListener('click', closeSettings);
    settingsSave.addEventListener('click', saveSettings);
    testGithubBtn.addEventListener('click', testGithubToken);
    testJiraBtn.addEventListener('click', testJiraToken);
    
    // Close settings modal when clicking outside
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) {
            closeSettings();
        }
    });
    
    // ==================== CHROME STORAGE FUNCTIONS ====================
    
    function loadJiraHistory() {
        chrome.storage.local.get(['jiraHistory'], function(result) {
            if (result.jiraHistory) {
                jiraHistory = result.jiraHistory;
            }
            updateDropdown();
        });
    }
    
    function saveJiraHistory() {
        chrome.storage.local.set({jiraHistory: jiraHistory});
    }
    
    // ==================== JIRA INPUT HANDLING ====================
    
    function handleJiraInputKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const jiraId = jiraInput.value.trim().toUpperCase();
            
            if (jiraId) {
                // Validate JIRA ID format (basic validation)
                if (jiraId.match(/^[A-Z]+-\d+$/)) {
                    addToHistory(jiraId);
                    openJiraTicket(jiraId);
                    jiraInput.value = '';
                    hideDropdown();
                } else {
                    // Auto-format if it's just a number (defaults to OCMUI project)
                    const numberMatch = jiraId.match(/^\d+$/);
                    if (numberMatch) {
                        const formattedId = `OCMUI-${numberMatch[0]}`;
                        addToHistory(formattedId);
                        openJiraTicket(formattedId);
                        jiraInput.value = '';
                        hideDropdown();
                    } else {
                        alert('Please enter a valid JIRA ID format (e.g., OCMUI-1234)');
                    }
                }
            }
        } else if (e.key === 'Escape') {
            hideDropdown();
        }
    }
    
    function handleJiraInputChange(e) {
        const value = e.target.value.toUpperCase();
        updateDropdown(value);
        if (value.length > 0) {
            showDropdown();
        }
    }
    
    function addToHistory(jiraId) {
        // Remove if already exists to avoid duplicates
        jiraHistory = jiraHistory.filter(id => id !== jiraId);
        
        // Add to beginning of history
        jiraHistory.unshift(jiraId);
        
        // Keep only last 10 items
        jiraHistory = jiraHistory.slice(0, 10);
        
        saveJiraHistory();
        updateDropdown();
    }
    
    // ==================== JIRA API INTEGRATION ====================
    
    /**
     * Main entry point for JIRA ticket processing
     * Attempts to fetch and display ticket details if token is available,
     * otherwise falls back to opening in browser tab
     */
    async function openJiraTicket(jiraId) {
        if (apiTokens.jira && apiTokens.jira.trim().length > 0) {
            try {
                await fetchAndDisplayJiraTicket(jiraId);
            } catch (error) {
                console.error('Error fetching JIRA details:', error);
                // Fallback to browser tab
                const url = `https://issues.redhat.com/browse/${jiraId}`;
                openTab(url);
            }
        } else {
            // No token available - open in browser
            const url = `https://issues.redhat.com/browse/${jiraId}`;
            openTab(url);
        }
    }
    
    /**
     * Fetches JIRA ticket data using REST API with Bearer/Basic auth fallback
     * Expands changelog and comment data for comprehensive ticket information
     */
    async function fetchAndDisplayJiraTicket(jiraId) {
        showLoadingState();
        
        const jiraApiUrl = `https://issues.redhat.com/rest/api/2/issue/${jiraId}?expand=changelog,comment`;
        
        // Try Bearer authentication first (modern approach)
        let response = await fetch(jiraApiUrl, {
            headers: {
                'Authorization': `Bearer ${apiTokens.jira}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        // Fallback to Basic auth if Bearer fails (legacy support)
        if (!response.ok && response.status === 401) {
            const basicAuth = btoa(`:${apiTokens.jira}`);
            response = await fetch(jiraApiUrl, {
                headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
        }
        
        if (!response.ok) {
            throw new Error(`JIRA API request failed: ${response.status} ${response.statusText}`);
        }
        
        const ticketData = await response.json();
        displayJiraTicket(ticketData);
    }
    
    /**
     * JIRA TICKET DISPLAY RENDERER
     * Renders comprehensive JIRA ticket information in a two-column layout
     * Includes intelligent blocked ticket detection and expandable sections
     */
    function displayJiraTicket(ticket) {
        // ==================== FIELD EXTRACTION ====================
        const jiraId = ticket.key;
        const summary = ticket.fields.summary;
        const description = ticket.fields.description || 'No description provided';
        const issueType = ticket.fields.issuetype ? ticket.fields.issuetype.name : 'Unknown';
        const status = ticket.fields.status ? ticket.fields.status.name : 'Unknown';
        const assignee = ticket.fields.assignee ? ticket.fields.assignee.displayName : 'Unassigned';
        const priority = ticket.fields.priority ? ticket.fields.priority.name : 'Undefined';
        const reporter = ticket.fields.reporter ? ticket.fields.reporter.displayName : 'Unknown';
        const created = ticket.fields.created ? new Date(ticket.fields.created).toLocaleDateString() : 'Unknown';
        
        // Extract latest comment for quick reference
        let latestComment = null;
        if (ticket.fields.comment && ticket.fields.comment.comments && ticket.fields.comment.comments.length > 0) {
            const comments = ticket.fields.comment.comments;
            latestComment = comments[comments.length - 1];
        }
        
        const labels = ticket.fields.labels || [];
        
        // ==================== BLOCKED TICKET DETECTION ====================
        // Red Hat JIRA uses customfield_12316543 for the "Blocked" field
        // This field can contain objects or simple boolean values
        const statusName = ticket.fields.status ? ticket.fields.status.name.toLowerCase() : '';
        const blockedFieldId = 'customfield_12316543';
        const blockedField = ticket.fields[blockedFieldId];
        
        let isBlockedByField = false;
        if (blockedField) {
            if (typeof blockedField === 'object') {
                // Handle complex field structures (objects with nested values)
                isBlockedByField = blockedField.value === true || 
                                 blockedField.value === 'True' || 
                                 blockedField.value === 'true' ||
                                 blockedField.id === 'true' ||
                                 blockedField.key === 'true' ||
                                 blockedField.name === 'True' ||
                                 (blockedField.displayValue && blockedField.displayValue === 'True');
            } else {
                // Handle simple boolean or string values
                isBlockedByField = blockedField === true || 
                                 blockedField === 'True' || 
                                 blockedField === 'true' || 
                                 blockedField === 'TRUE';
            }
        }
        
        // Also check status-based blocking (fallback)
        const statusBlocked = statusName.includes('blocked') || 
                             statusName.includes('impediment') || 
                             statusName.includes('waiting') ||
                             statusName === 'blocked' ||
                             statusName === 'on hold';
        
        const isBlocked = isBlockedByField || statusBlocked;
        
        // ==================== BLOCKED REASON DETECTION ====================
        let blockedReason = '';
        let blockedReasonFieldId = '';
        if (isBlocked) {
            // Strategy 1: Look for URLs (GitHub links are common blocked reasons)
            const urlField = Object.keys(ticket.fields).find(key => {
                const value = ticket.fields[key];
                return typeof value === 'string' && 
                       (value.includes('github.com') || value.includes('http'));
            });
            
            if (urlField && ticket.fields[urlField]) {
                blockedReason = ticket.fields[urlField];
                blockedReasonFieldId = urlField;
            } else {
                // Strategy 2: Check common blocked reason custom fields
                const potentialReasonFields = [
                    'customfield_12316544', // Adjacent to blocked field
                    'customfield_12316542', 
                    'customfield_12316545',
                    'customfield_12315950', // Known blocked reason fields
                    'customfield_12310243',
                    'customfield_12315951',
                    'customfield_12310940',
                    'customfield_12315942'
                ];
                
                for (const fieldId of potentialReasonFields) {
                    if (ticket.fields[fieldId]) {
                        blockedReason = ticket.fields[fieldId];
                        blockedReasonFieldId = fieldId;
                        break;
                    }
                }
                
                if (!blockedReason) {
                    blockedReason = 'Reason not specified';
                }
            }
        }
        
        // ==================== UI ELEMENT GENERATION ====================
        // Priority display with icons and color coding
        const getPriorityDisplay = (priorityName) => {
            switch (priorityName.toLowerCase()) {
                case 'blocker':
                    return { icon: '🔴', className: 'blocker' };
                case 'critical':
                    return { icon: '🟠', className: 'critical' };
                case 'major':
                    return { icon: '🟡', className: 'major' };
                case 'normal':
                    return { icon: '🟢', className: 'normal' };
                case 'minor':
                    return { icon: '🔵', className: 'minor' };
                case 'undefined':
                default:
                    return { icon: '⚪', className: 'undefined' };
            }
        };
        
        const priorityDisplay = getPriorityDisplay(priority);
        
        // Look for development/PR links
        let prLinks = [];
        if (ticket.fields.issuelinks) {
            ticket.fields.issuelinks.forEach(link => {
                // Check for GitHub PR references in various link types
                if (link.outwardIssue && link.outwardIssue.fields && link.outwardIssue.fields.summary) {
                    const summary = link.outwardIssue.fields.summary;
                    if (summary.includes('Pull Request') || summary.includes('PR')) {
                        prLinks.push({
                            key: link.outwardIssue.key,
                            summary: summary,
                            url: `https://issues.redhat.com/browse/${link.outwardIssue.key}`
                        });
                    }
                }
            });
        }
        
        // Check for development information (GitHub integration)
        let developmentInfo = '';
        if (ticket.fields.development) {
            developmentInfo = '<div class="field-group"><strong>Development:</strong> Available</div>';
        }
        
        // Build the HTML content
        const ticketHtml = `
            <div class="jira-ticket-details">
                <div class="ticket-header">
                    <h3><strong>${jiraId}: ${summary}</strong></h3>
                    <button id="copyJiraUrlBtn" class="copy-url-btn" data-jira-id="${jiraId}" title="Copy JIRA URL to clipboard">
                        Copy jira url
                    </button>
                </div>
                
                <div class="ticket-fields-container">
                    <div class="ticket-fields-left">
                        <div class="field-group">
                            <strong>Type:</strong> 
                            <span class="issue-type ${issueType.toLowerCase().replace(/[\s-]/g, '-')}">${issueType}</span>
                        </div>
                        
                        <div class="field-group">
                            <strong>Status:</strong> 
                            <div class="ticket-status status-${status.toLowerCase().replace(/\s+/g, '-')}">${status}</div>
                        </div>
                        
                        <div class="field-group">
                            <strong>Priority:</strong> 
                            <span class="priority priority-${priorityDisplay.className}">
                                ${priorityDisplay.icon} ${priority}
                            </span>
                        </div>
                        
                        ${developmentInfo}
                        
                        ${prLinks.length > 0 ? `
                            <div class="field-group">
                                <strong>Related PRs:</strong>
                                <ul class="pr-links">
                                    ${prLinks.map(pr => `<li><a href="${pr.url}" target="_blank">${pr.key}</a>: ${pr.summary}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${isBlocked ? `
                            <div class="field-group">
                                <strong><span style="color: #dc2626; font-weight: bold;">Blocked</span> Reason:</strong> 
                                <span class="blocked-reason">${blockedReason || 'No specific reason provided'}</span>
                            </div>
                        ` : ''}
                        
                    </div>
                    
                    <div class="ticket-fields-right">
                        <div class="field-group">
                            <strong>Assignee:</strong> 
                            <span class="assignee">${assignee}</span>
                        </div>
                        
                        <div class="field-group">
                            <strong>Created:</strong> 
                            <span class="created-date">${created}</span>
                        </div>
                        
                        <div class="field-group">
                            <strong>Reporter:</strong> 
                            <span class="reporter">${reporter}</span>
                        </div>
                        
                        ${labels.length > 0 ? `
                            <div class="field-group">
                                <strong>Labels:</strong>
                                <div class="labels-container">
                                    ${labels.map(label => `<span class="label-tag">${label}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="description-section">
                    <button class="description-toggle" id="descriptionToggle">
                        <span class="arrow">▶</span>
                        <span>Description</span>
                    </button>
                    <div class="description-content" id="descriptionContent">
                        <div class="description-text" id="descriptionText">${description}</div>
                    </div>
                </div>
                
                ${latestComment ? `
                    <div class="comment-section">
                        <button class="comment-toggle" id="commentToggle">
                            <span class="arrow">▶</span>
                            <span>Latest Comment</span>
                        </button>
                        <div class="comment-content" id="commentContent">
                            <div class="comment-header">
                                <span class="comment-author">${latestComment.author.displayName}</span>
                                <span class="comment-date"> • ${new Date(latestComment.created).toLocaleDateString()}</span>
                            </div>
                            <div class="comment-text">${latestComment.body || 'No comment text'}</div>
                        </div>
                    </div>
                ` : ''}
                
            </div>
        `;
        
        mainContent.innerHTML = ticketHtml;
        
        // Add event listener for description toggle (CSP-compliant)
        const descriptionToggle = document.getElementById('descriptionToggle');
        if (descriptionToggle) {
            descriptionToggle.addEventListener('click', toggleDescription);
        }
        
        // Add event listener for comment toggle (CSP-compliant)
        const commentToggle = document.getElementById('commentToggle');
        if (commentToggle) {
            commentToggle.addEventListener('click', toggleComment);
        }
        
        // Add event listener for copy JIRA URL button (CSP-compliant)
        const copyJiraUrlBtn = document.getElementById('copyJiraUrlBtn');
        if (copyJiraUrlBtn) {
            copyJiraUrlBtn.addEventListener('click', function(event) {
                event.preventDefault();
                const jiraId = copyJiraUrlBtn.getAttribute('data-jira-id');
                copyJiraUrlToClipboard(jiraId);
            });
        }
    }
    
    // Show loading state in main content
    function showLoadingState() {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">⏳</div>
                <div class="loading-text">Fetching JIRA ticket details...</div>
            </div>
        `;
    }
    
    
    // Copy JIRA URL to clipboard
    function copyJiraUrlToClipboard(jiraId) {
        const jiraUrl = `https://issues.redhat.com/browse/${jiraId}`;
        
        navigator.clipboard.writeText(jiraUrl).then(function() {
            // Success feedback - briefly change button text
            const copyBtn = document.getElementById('copyJiraUrlBtn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '✅ Copied!';
                copyBtn.style.backgroundColor = '#059669';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.backgroundColor = '';
                }, 1500);
            }
        }).catch(function(err) {
            console.error('Failed to copy JIRA URL: ', err);
            // Fallback for older browsers
            const copyBtn = document.getElementById('copyJiraUrlBtn');
            if (copyBtn) {
                copyBtn.innerHTML = '❌ Failed';
                copyBtn.style.backgroundColor = '#dc2626';
                
                setTimeout(() => {
                    copyBtn.innerHTML = 'Copy jira url';
                    copyBtn.style.backgroundColor = '';
                }, 1500);
            }
        });
    }
    
    
    // Toggle description section
    function toggleDescription() {
        const toggle = document.getElementById('descriptionToggle');
        const content = document.getElementById('descriptionContent');
        const arrow = toggle.querySelector('.arrow');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            toggle.classList.remove('expanded');
            arrow.textContent = '▶';
        } else {
            content.classList.add('expanded');
            toggle.classList.add('expanded');
            arrow.textContent = '▼';
        }
    }
    
    // Toggle comment section
    function toggleComment() {
        const toggle = document.getElementById('commentToggle');
        const content = document.getElementById('commentContent');
        const arrow = toggle.querySelector('.arrow');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            toggle.classList.remove('expanded');
            arrow.textContent = '▶';
        } else {
            content.classList.add('expanded');
            toggle.classList.add('expanded');
            arrow.textContent = '▼';
        }
    }
    
    // ==================== NAVIGATION FUNCTIONS ====================
    
    function openTab(url) {
        chrome.tabs.create({url: url});
        // Keep popup open for user convenience
    }
    
    function openTimeboard() {
        const timeboardUrl = chrome.runtime.getURL('timeboard/popup.html');
        chrome.windows.create({
            url: timeboardUrl,
            type: 'popup',
            width: 680,
            height: 580,
            focused: true
        });
        // Keep popup open for user convenience
    }
    
    // ==================== API TOKEN MANAGEMENT ====================
    
    function loadApiTokens() {
        chrome.storage.local.get(['apiTokens'], function(result) {
            if (result.apiTokens) {
                apiTokens = result.apiTokens;
            }
            updateSettingsIconStatus();
        });
    }
    
    function saveApiTokens() {
        chrome.storage.local.set({apiTokens: apiTokens});
        updateSettingsIconStatus();
    }
    
    function updateSettingsIconStatus() {
        const hasGithubToken = apiTokens.github && apiTokens.github.trim().length > 0;
        const hasJiraToken = apiTokens.jira && apiTokens.jira.trim().length > 0;
        const needsSetup = !hasGithubToken || !hasJiraToken;
        
        if (needsSetup) {
            settingsBtn.classList.add('needs-setup');
            settingsBtn.title = 'Settings - API tokens required';
        } else {
            settingsBtn.classList.remove('needs-setup');
            settingsBtn.title = 'Settings';
        }
        
        updateReadyMessage(needsSetup);
    }
    
    function updateReadyMessage(needsSetup) {
        const readyMessage = document.getElementById('readyMessage');
        const mainContent = document.getElementById('mainContent');
        
        // Only update if we're showing the default message (not JIRA ticket content)
        if (mainContent && !mainContent.querySelector('.jira-ticket-details')) {
            if (needsSetup) {
                readyMessage.textContent = 'Click on Settings icon to enter your tokens.';
                readyMessage.style.color = '#f59e0b'; // Orange color to draw attention
            } else {
                readyMessage.textContent = 'Ready for JIRA reporting....';
                readyMessage.style.color = '#666'; // Default color
            }
        }
    }
    
    function openSettings() {
        // Load current tokens into inputs
        githubTokenInput.value = apiTokens.github || '';
        jiraTokenInput.value = apiTokens.jira || '';
        settingsModal.style.display = 'block';
    }
    
    function closeSettings() {
        settingsModal.style.display = 'none';
        // Reset button states
        resetButtonState(testGithubBtn, 'Test');
        resetButtonState(testJiraBtn, 'Test');
        // Hide error messages
        githubErrorDiv.style.display = 'none';
        jiraErrorDiv.style.display = 'none';
    }
    
    function resetButtonState(button, text) {
        button.textContent = text;
        button.disabled = false;
        button.className = 'test-btn';
    }
    
    async function testGithubToken() {
        const token = githubTokenInput.value.trim();
        if (!token) {
            alert('Please enter a GitHub token');
            return;
        }
        
        testGithubBtn.textContent = '...';
        testGithubBtn.disabled = true;
        testGithubBtn.className = 'test-btn testing';
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'User-Agent': 'OCMUI-Team-Tools'
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                
                // Get token scopes from response headers
                const scopes = response.headers.get('X-OAuth-Scopes') || 'none';
                const acceptedScopes = response.headers.get('X-Accepted-OAuth-Scopes') || 'none';
                
                testGithubBtn.textContent = '✓';
                testGithubBtn.className = 'test-btn success';
                setTimeout(() => resetButtonState(testGithubBtn, 'Test'), 2000);
                
                console.log(`GitHub token valid for user: ${user.login}`);
                console.log(`Token scopes: ${scopes}`);
                console.log(`Accepted scopes for this endpoint: ${acceptedScopes}`);
                
                // Show scope info to user (use success styling)
                githubErrorDiv.className = 'success-message';
                githubErrorDiv.innerHTML = `✅ Valid for user: <strong>${user.login}</strong><br>
                📝 Token scopes: <code style="background: #374151; padding: 2px 4px; border-radius: 3px;">${scopes}</code>`;
                githubErrorDiv.style.display = 'block';
                
                // Hide success message after 8 seconds
                setTimeout(() => {
                    githubErrorDiv.style.display = 'none';
                }, 8000);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            testGithubBtn.textContent = '✗';
            testGithubBtn.className = 'test-btn error';
            setTimeout(() => resetButtonState(testGithubBtn, 'Test'), 3000);
            console.error('GitHub token test failed:', error);
            githubErrorDiv.className = 'error-message';
            githubErrorDiv.textContent = `GitHub test failed: ${error.message}`;
            githubErrorDiv.style.display = 'block';
        }
    }
    
    async function testJiraToken() {
        const token = jiraTokenInput.value.trim();
        if (!token) {
            jiraErrorDiv.className = 'error-message';
            jiraErrorDiv.textContent = 'Please enter a JIRA token';
            jiraErrorDiv.style.display = 'block';
            return;
        }
        
        testJiraBtn.textContent = '...';
        testJiraBtn.disabled = true;
        testJiraBtn.className = 'test-btn testing';
        jiraErrorDiv.style.display = 'none';
        
        try {
            // Red Hat JIRA Personal Access Token testing
            // API endpoint: https://issues.redhat.com/rest/api/2/myself
            console.log('Testing JIRA token against: https://issues.redhat.com/rest/api/2/myself');
            
            // Red Hat JIRA Personal Access Tokens should work with Bearer authorization
            let response = await fetch('https://issues.redhat.com/rest/api/2/myself', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            // If Bearer fails, try Basic Auth as fallback
            if (!response.ok && response.status === 401) {
                console.log('Bearer auth failed, trying Basic auth...');
                const basicAuth = btoa(`:${token}`);
                response = await fetch('https://issues.redhat.com/rest/api/2/myself', {
                    headers: {
                        'Authorization': `Basic ${basicAuth}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
            }
            
            if (response.ok) {
                const user = await response.json();
                testJiraBtn.textContent = '✓';
                testJiraBtn.className = 'test-btn success';
                setTimeout(() => resetButtonState(testJiraBtn, 'Test'), 2000);
                console.log(`JIRA token valid for user: ${user.displayName || user.name}`);
                jiraErrorDiv.style.display = 'none';
            } else {
                const errorText = await response.text();
                let errorMsg = `HTTP ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.errorMessages && errorJson.errorMessages.length > 0) {
                        errorMsg = errorJson.errorMessages[0];
                    } else if (errorJson.message) {
                        errorMsg = errorJson.message;
                    }
                } catch (e) {
                    // Use default error message
                }
                
                if (response.status === 401) {
                    errorMsg = "Authentication failed. For Red Hat JIRA, you need a Personal Access Token. Go to https://issues.redhat.com/secure/ViewProfile.jspa and scroll to 'Personal Access Tokens' section.";
                } else if (response.status === 403) {
                    errorMsg = "Access denied. Your token may not have sufficient permissions.";
                }
                
                throw new Error(errorMsg);
            }
        } catch (error) {
            testJiraBtn.textContent = '✗';
            testJiraBtn.className = 'test-btn error';
            setTimeout(() => resetButtonState(testJiraBtn, 'Test'), 3000);
            console.error('JIRA token test failed:', error);
            jiraErrorDiv.className = 'error-message';
            jiraErrorDiv.textContent = `JIRA test failed: ${error.message}`;
            jiraErrorDiv.style.display = 'block';
        }
    }
    
    async function saveSettings() {
        const githubToken = githubTokenInput.value.trim();
        const jiraToken = jiraTokenInput.value.trim();
        
        // Test both tokens before saving
        let githubValid = false;
        let jiraValid = false;
        
        if (githubToken) {
            try {
                const response = await fetch('https://api.github.com/user', {
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'User-Agent': 'OCMUI-Team-Tools'
                    }
                });
                githubValid = response.ok;
            } catch (error) {
                console.error('GitHub validation failed:', error);
            }
        } else {
            githubValid = true; // Allow empty tokens
        }
        
        if (jiraToken) {
            try {
                // Try Bearer first, then Basic auth (same logic as test function)
                let response = await fetch('https://issues.redhat.com/rest/api/2/myself', {
                    headers: {
                        'Authorization': `Bearer ${jiraToken}`,
                        'Accept': 'application/json'
                    }
                });
                
                // If Bearer fails, try Basic Auth
                if (!response.ok && response.status === 401) {
                    const basicAuth = btoa(`:${jiraToken}`);
                    response = await fetch('https://issues.redhat.com/rest/api/2/myself', {
                        headers: {
                            'Authorization': `Basic ${basicAuth}`,
                            'Accept': 'application/json'
                        }
                    });
                }
                
                jiraValid = response.ok;
            } catch (error) {
                console.error('JIRA validation failed:', error);
            }
        } else {
            jiraValid = true; // Allow empty tokens
        }
        
        if (!githubValid) {
            alert('GitHub token is invalid. Please check and try again.');
            return;
        }
        
        if (!jiraValid) {
            alert('JIRA token is invalid. Please check and try again.');
            return;
        }
        
        // Save tokens
        apiTokens.github = githubToken;
        apiTokens.jira = jiraToken;
        saveApiTokens();
        
        alert('Settings saved successfully!');
        closeSettings();
        updateSettingsIconStatus();
    }
    
    // ==================== DROPDOWN MANAGEMENT ====================
    
    function updateDropdown(filter = '') {
        jiraDropdown.innerHTML = '';
        
        const filteredHistory = jiraHistory.filter(id => 
            id.toUpperCase().includes(filter)
        );
        
        if (filteredHistory.length === 0) {
            jiraDropdown.style.display = 'none';
            return;
        }
        
        filteredHistory.forEach(jiraId => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = jiraId;
            
            item.addEventListener('mousedown', function(e) {
                e.preventDefault(); // Prevent blur event
                jiraInput.value = jiraId;
                hideDropdown();
                
                // Automatically trigger JIRA lookup
                addToHistory(jiraId);
                openJiraTicket(jiraId);
                jiraInput.value = '';
                jiraInput.blur(); // Unfocus the input field
            });
            
            jiraDropdown.appendChild(item);
        });
    }
    
    // Show dropdown
    function showDropdown() {
        if (jiraDropdown.children.length > 0) {
            jiraDropdown.style.display = 'block';
        }
    }
    
    // Hide dropdown immediately
    function hideDropdown() {
        jiraDropdown.style.display = 'none';
    }
    
    // Hide dropdown with delay to allow clicks
    function hideDropdownDelayed() {
        setTimeout(hideDropdown, 150);
    }
    
    // Handle clicks outside to close dropdown
    document.addEventListener('click', function(e) {
        if (!jiraInput.contains(e.target) && !jiraDropdown.contains(e.target)) {
            hideDropdown();
        }
    });
});
