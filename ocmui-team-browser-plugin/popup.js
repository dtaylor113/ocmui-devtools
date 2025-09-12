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
    
    // Comment popup modal handlers
    const commentPopupModal = document.getElementById('commentPopupModal');
    const commentPopupClose = document.getElementById('commentPopupClose');
    
    if (commentPopupClose) {
        commentPopupClose.addEventListener('click', closeCommentPopup);
    }
    
    if (commentPopupModal) {
        commentPopupModal.addEventListener('click', function(e) {
            if (e.target === commentPopupModal) {
                closeCommentPopup();
            }
        });
    }
    
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
                    <a href="https://issues.redhat.com/browse/${jiraId}" target="_blank" class="jira-title-link">
                        <img src="jiraLogo.png" alt="JIRA" class="jira-icon">
                        <strong>${jiraId}: ${summary}</strong>
                    </a>
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
                        <span class="arrow">▶️</span>
                        <span>Description</span>
                    </button>
                    <div class="description-content" id="descriptionContent">
                        <div class="description-text" id="descriptionText">${description}</div>
                    </div>
                </div>
                
                ${latestComment ? `
                    <div class="comment-section">
                        <button class="comment-toggle" id="commentToggle">
                            <span class="arrow">▶️</span>
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
                
                <div class="github-pr-section">
                    <button class="github-pr-toggle expanded" id="githubPRToggle">
                        <span class="arrow">🔽</span>
                        <img src="githubIcon.png" alt="GitHub" class="github-icon">
                        <span>Related GitHub PRs</span>
                    </button>
                    <div class="github-pr-collapsible-content expanded" id="githubPRCollapsibleContent">
                        <div class="github-pr-container" id="githubPRContainer">
                            <div class="github-loading-state">
                                <div class="github-loading-spinner">⏳</div>
                                <span>Searching GitHub PRs...</span>
                            </div>
                        </div>
                    </div>
                </div>
                
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
        
        // JIRA title is now a clickable link - no additional event listeners needed
        
        // Add event listener for GitHub PR toggle (CSP-compliant)
        const githubPRToggle = document.getElementById('githubPRToggle');
        if (githubPRToggle) {
            githubPRToggle.addEventListener('click', toggleGithubPRSection);
        }
        
        // Fetch and display associated GitHub PRs
        if (apiTokens.github && apiTokens.github.trim().length > 0) {
            fetchAndDisplayGithubPRs(jiraId); // Fetch all PRs
        } else {
            const githubPRContainer = document.getElementById('githubPRContainer');
            if (githubPRContainer) {
                githubPRContainer.innerHTML = `
                    <div class="github-no-results">
                        No GitHub token configured
                    </div>
                `;
            }
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
    
    
    
    // Toggle description section
    function toggleDescription() {
        const toggle = document.getElementById('descriptionToggle');
        const content = document.getElementById('descriptionContent');
        const arrow = toggle.querySelector('.arrow');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            toggle.classList.remove('expanded');
            arrow.textContent = '▶️';
        } else {
            content.classList.add('expanded');
            toggle.classList.add('expanded');
            arrow.textContent = '🔽';
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
            arrow.textContent = '▶️';
        } else {
            content.classList.add('expanded');
            toggle.classList.add('expanded');
            arrow.textContent = '🔽';
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
    
    // ==================== GITHUB PR INTEGRATION ====================
    
    /**
     * Fetches GitHub PRs associated with the given JIRA ID
     * Searches first in PR titles, then in PR descriptions if not found
     */
    async function fetchAndDisplayGithubPRs(jiraId) {
        const githubPRContainer = document.getElementById('githubPRContainer');
        
        if (!githubPRContainer) {
            console.error('GitHub PR container not found');
            return;
        }
        
        // Show loading state
        githubPRContainer.innerHTML = `
            <div class="github-loading-state">
                <div class="github-loading-spinner">⏳</div>
                <span>Searching GitHub PRs...</span>
            </div>
        `;
        
        try {
            const prs = await searchGithubPRs(jiraId);
            const prsWithReviews = await fetchPRReviewsInfo(prs);
            displayGithubPRs(prsWithReviews, jiraId);
        } catch (error) {
            console.error('Error fetching GitHub PRs:', error);
            githubPRContainer.innerHTML = `
                <div class="github-no-results">
                    Error fetching GitHub PRs: ${error.message}
                </div>
            `;
        }
    }
    
    /**
     * Searches GitHub PRs for the given JIRA ID
     * First searches in PR titles, then in PR descriptions
     * Fetches both open and closed PRs
     */
    async function searchGithubPRs(jiraId) {
        const repo = 'RedHatInsights/uhc-portal';
        const headers = {
            'Authorization': `token ${apiTokens.github}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'OCMUI-Team-Tools'
        };
        
        let foundPRs = [];
        
        // Search 1: Look for JIRA ID in PR titles using GitHub Search API (all states)
        try {
            // Use quotes to search for exact phrase
            const titleSearchUrl = `https://api.github.com/search/issues?q="${encodeURIComponent(jiraId)}"+type:pr+repo:${repo}`;
            const titleResponse = await fetch(titleSearchUrl, { headers });
            
            if (titleResponse.ok) {
                const titleData = await titleResponse.json();
                foundPRs = titleData.items || [];
                
                console.log(`Found ${foundPRs.length} PRs with "${jiraId}" in title`);
                
                // Filter results to ensure they actually contain the JIRA ID (case insensitive)
                foundPRs = foundPRs.filter(pr => 
                    pr.title.toUpperCase().includes(jiraId.toUpperCase()) ||
                    (pr.body && pr.body.toUpperCase().includes(jiraId.toUpperCase()))
                );
                
                console.log(`After filtering: ${foundPRs.length} PRs actually contain "${jiraId}"`);
            }
        } catch (error) {
            console.error('Error searching PR titles:', error);
        }
        
        // If no results found in titles, search in PR body/description
        if (foundPRs.length === 0) {
            try {
                const bodySearchUrl = `https://api.github.com/search/issues?q="${encodeURIComponent(jiraId)}"+in:body+type:pr+repo:${repo}`;
                const bodyResponse = await fetch(bodySearchUrl, { headers });
                
                if (bodyResponse.ok) {
                    const bodyData = await bodyResponse.json();
                    let bodyResults = bodyData.items || [];
                    
                    console.log(`Found ${bodyResults.length} PRs with "${jiraId}" in body search`);
                    
                    // Filter results to ensure they actually contain the JIRA ID (case insensitive)
                    bodyResults = bodyResults.filter(pr => 
                        pr.title.toUpperCase().includes(jiraId.toUpperCase()) ||
                        (pr.body && pr.body.toUpperCase().includes(jiraId.toUpperCase()))
                    );
                    
                    foundPRs = bodyResults;
                    console.log(`After filtering body results: ${foundPRs.length} PRs actually contain "${jiraId}"`);
                }
            } catch (error) {
                console.error('Error searching PR descriptions:', error);
            }
        }
        
        // Sort PRs by creation date (newest first)
        foundPRs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        return foundPRs;
    }
    
    /**
     * Fetches reviewer information for each PR with deep analysis
     * Handles review timeline, dismissals, re-requests, gets most recent status,
     * and fetches review comments for interactive display
     */
    async function fetchPRReviewsInfo(prs) {
        const headers = {
            'Authorization': `token ${apiTokens.github}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'OCMUI-Team-Tools'
        };
        
        const prsWithReviews = await Promise.all(prs.map(async (pr) => {
            try {
                // Fetch PR details to get current review requests and mergeable status
                const prDetailsUrl = `https://api.github.com/repos/RedHatInsights/uhc-portal/pulls/${pr.number}`;
                const prDetailsResponse = await fetch(prDetailsUrl, { headers });
                
                // Fetch PR reviews (chronological order)
                const reviewsUrl = `https://api.github.com/repos/RedHatInsights/uhc-portal/pulls/${pr.number}/reviews`;
                const reviewsResponse = await fetch(reviewsUrl, { headers });
                
                // Fetch PR timeline for review requests/dismissals
                const timelineUrl = `https://api.github.com/repos/RedHatInsights/uhc-portal/issues/${pr.number}/timeline`;
                const timelineResponse = await fetch(timelineUrl, { 
                    headers: {
                        ...headers,
                        'Accept': 'application/vnd.github.v3.star-fox-preview+json'
                    }
                });
                
                // Fetch check runs for status badges
                const checksUrl = `https://api.github.com/repos/RedHatInsights/uhc-portal/commits/${pr.head?.sha || 'HEAD'}/check-runs`;
                const checksResponse = await fetch(checksUrl, { headers });
                
                let reviewers = [];
                let checkStatus = null;
                let needsRebase = false;
                
                if (prDetailsResponse.ok && reviewsResponse.ok && timelineResponse.ok) {
                    const prDetails = await prDetailsResponse.json();
                    const reviews = await reviewsResponse.json();
                    const timeline = await timelineResponse.json();
                    
                    // Determine rebase status
                    needsRebase = prDetails.mergeable === false || 
                                  (prDetails.mergeable_state && prDetails.mergeable_state === 'dirty');
                    
                    // Process check runs
                    if (checksResponse.ok) {
                        const checkRuns = await checksResponse.json();
                        if (checkRuns.check_runs && checkRuns.check_runs.length > 0) {
                            const allChecks = checkRuns.check_runs;
                            const passedChecks = allChecks.filter(check => check.conclusion === 'success').length;
                            const failedChecks = allChecks.filter(check => check.conclusion === 'failure').length;
                            const pendingChecks = allChecks.filter(check => !check.conclusion || check.status === 'in_progress' || check.status === 'queued').length;
                            
                            if (pendingChecks > 0) {
                                checkStatus = { status: 'pending', total: allChecks.length, pending: pendingChecks };
                            } else if (failedChecks > 0) {
                                checkStatus = { status: 'failure', total: allChecks.length, failed: failedChecks };
                            } else {
                                checkStatus = { status: 'success', total: allChecks.length, passed: passedChecks };
                            }
                        }
                    }
                    
                    console.log(`Analyzing PR #${pr.number} - ${reviews.length} reviews, ${timeline.length} timeline events`);
                    
                    // Build comprehensive reviewer status map
                    const reviewerStatusMap = new Map();
                    
                    // Step 1: Process timeline events chronologically to track review requests/dismissals
                    timeline
                        .filter(event => ['review_requested', 'review_request_removed', 'review_dismissed'].includes(event.event))
                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                        .forEach(event => {
                            if (event.event === 'review_requested') {
                                if (event.requested_reviewer) {
                                    reviewerStatusMap.set(event.requested_reviewer.login, {
                                        username: event.requested_reviewer.login,
                                        status: 'review_requested',
                                        state: 'REQUESTED',
                                        lastUpdated: new Date(event.created_at),
                                        isTeam: false
                                    });
                                }
                                if (event.requested_team) {
                                    reviewerStatusMap.set(`@${event.requested_team.name}`, {
                                        username: event.requested_team.name,
                                        status: 'review_requested',
                                        state: 'REQUESTED',
                                        lastUpdated: new Date(event.created_at),
                                        isTeam: true
                                    });
                                }
                            } else if (event.event === 'review_request_removed') {
                                if (event.requested_reviewer) {
                                    reviewerStatusMap.delete(event.requested_reviewer.login);
                                }
                                if (event.requested_team) {
                                    reviewerStatusMap.delete(`@${event.requested_team.name}`);
                                }
                            } else if (event.event === 'review_dismissed' && event.review && event.review.user) {
                                reviewerStatusMap.set(event.review.user.login, {
                                    username: event.review.user.login,
                                    status: 'dismissed',
                                    state: 'DISMISSED',
                                    lastUpdated: new Date(event.created_at),
                                    isTeam: false
                                });
                            }
                        });
                    
                    // Step 2: Process actual reviews chronologically (newest last to overwrite older reviews)
                    reviews
                        .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
                        .forEach(review => {
                            if (!review.user) return;
                            
                            let status = 'commented';
                            if (review.state === 'APPROVED') {
                                status = 'approved';
                            } else if (review.state === 'CHANGES_REQUESTED') {
                                status = 'changes_requested';
                            } else if (review.state === 'DISMISSED') {
                                status = 'dismissed';
                            } else if (review.state === 'COMMENTED') {
                                status = 'commented';
                            }
                            
                            const reviewDate = new Date(review.submitted_at);
                            const existingReviewer = reviewerStatusMap.get(review.user.login);
                            
                            // Only update if this review is newer than existing status
                            if (!existingReviewer || reviewDate > existingReviewer.lastUpdated) {
                                reviewerStatusMap.set(review.user.login, {
                                    username: review.user.login,
                                    status: status,
                                    state: review.state,
                                    lastUpdated: reviewDate,
                                    isTeam: false
                                });
                            }
                        });
                    
                    // Step 3: Add current review requests (these override timeline if they exist)
                    const currentRequested = prDetails.requested_reviewers || [];
                    const currentTeamRequested = prDetails.requested_teams || [];
                    
                    currentRequested.forEach(reviewer => {
                        // If someone has a current review request, it means they were re-requested
                        // after their previous review, so mark as requested
                        reviewerStatusMap.set(reviewer.login, {
                            username: reviewer.login,
                            status: 'review_requested',
                            state: 'REQUESTED',
                            lastUpdated: new Date(), // Most recent
                            isTeam: false
                        });
                    });
                    
                    currentTeamRequested.forEach(team => {
                        reviewerStatusMap.set(`@${team.name}`, {
                            username: team.name,
                            status: 'review_requested',
                            state: 'REQUESTED',
                            lastUpdated: new Date(), // Most recent
                            isTeam: true
                        });
                    });
                    
                    // Step 4: Fetch detailed comments for reviewers who commented or requested changes
                    const reviewersWithComments = await Promise.all(
                        Array.from(reviewerStatusMap.values()).map(async (reviewer) => {
                            if (reviewer.status === 'commented' || reviewer.status === 'changes_requested') {
                                try {
                                    // Find the review ID for this reviewer
                                    const userReviews = reviews.filter(r => r.user && r.user.login === reviewer.username);
                                    const comments = [];
                                    
                                    for (const review of userReviews) {
                                        if (review.body && review.body.trim()) {
                                            comments.push({
                                                body: review.body,
                                                submitted_at: review.submitted_at,
                                                state: review.state
                                            });
                                        }
                                        
                                        // Fetch individual review comments if available
                                        if (review.id) {
                                            const commentsUrl = `https://api.github.com/repos/RedHatInsights/uhc-portal/pulls/${pr.number}/reviews/${review.id}/comments`;
                                            const commentsResponse = await fetch(commentsUrl, { headers });
                                            
                                            if (commentsResponse.ok) {
                                                const reviewComments = await commentsResponse.json();
                                                reviewComments.forEach(comment => {
                                                    if (comment.body) {
                                                        comments.push({
                                                            body: comment.body,
                                                            created_at: comment.created_at,
                                                            path: comment.path,
                                                            line: comment.line
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    }
                                    
                                    return { ...reviewer, comments };
                                } catch (error) {
                                    console.error(`Error fetching comments for ${reviewer.username}:`, error);
                                    return reviewer;
                                }
                            }
                            return reviewer;
                        })
                    );
                    
                    reviewers = reviewersWithComments;
                    console.log(`PR #${pr.number} final reviewers:`, reviewers.map(r => `${r.username}:${r.status}`));
                }
                
                return { ...pr, reviewers, checkStatus, needsRebase };
            } catch (error) {
                console.error(`Error fetching reviews for PR #${pr.number}:`, error);
                return { ...pr, reviewers: [], checkStatus: null, needsRebase: false };
            }
        }));
        
        return prsWithReviews;
    }
    
    /**
     * Displays the GitHub PRs in the UI
     */
    function displayGithubPRs(prs, jiraId) {
        const githubPRContainer = document.getElementById('githubPRContainer');
        
        if (!prs || prs.length === 0) {
            githubPRContainer.innerHTML = `
                <div class="github-no-results">
                    No PRs found for ${jiraId}
                </div>
            `;
            return;
        }
        
        const prItems = prs.map((pr, index) => {
            const prStatus = pr.state === 'closed' ? 
                (pr.pull_request?.merged_at ? 'merged' : 'closed') : 'open';
            
            const statusClass = `pr-status-${prStatus}`;
            const statusText = prStatus.charAt(0).toUpperCase() + prStatus.slice(1);
            
            const createdDate = new Date(pr.created_at).toLocaleDateString();
            const author = pr.user?.login || 'Unknown';
            
            // Truncate long descriptions
            let description = pr.body || 'No description provided';
            if (description.length > 200) {
                description = description.substring(0, 200) + '...';
            }
            
            // Build reviewers display
            let reviewersHtml = '';
            if (pr.reviewers && pr.reviewers.length > 0) {
                const reviewerItems = pr.reviewers.map((reviewer, reviewerIndex) => {
                    const statusClass = `reviewer-${reviewer.status.replace('_', '-')}`;
                    const statusIcon = getReviewerStatusIcon(reviewer.status);
                    const displayName = reviewer.isTeam ? `@${reviewer.username}` : reviewer.username;
                    const hasComments = reviewer.comments && reviewer.comments.length > 0;
                    const clickableClass = hasComments ? 'clickable' : '';
                    const dataAttribs = hasComments ? `data-username="${reviewer.username}" data-pr-index="${index}" data-reviewer-index="${reviewerIndex}"` : '';
                    
                    return `
                        <span class="reviewer-item ${statusClass} ${clickableClass}" title="${reviewer.state}" ${dataAttribs}>
                            ${statusIcon} ${displayName}
                        </span>
                    `;
                }).join('');
                
                reviewersHtml = `
                    <div class="github-pr-reviewers">
                        <span>Reviewers:</span>
                        <div class="reviewer-list">
                            ${reviewerItems}
                        </div>
                    </div>
                `;
            }
            
            // Build additional status badges (rebase only - checks will be inline with PR status)
            let additionalBadgesHtml = '';
            const additionalBadges = [];
            
            if (pr.needsRebase) {
                additionalBadges.push(`<span class="pr-badge pr-badge-needs-rebase">🔀 Needs rebase</span>`);
            }
            
            if (additionalBadges.length > 0) {
                additionalBadgesHtml = `
                    <div class="github-pr-badges">
                        ${additionalBadges.join('')}
                    </div>
                `;
            }
            
            // Build checks badge for inline display with PR status
            let checksBadge = '';
            if (pr.checkStatus) {
                if (pr.checkStatus.status === 'success') {
                    checksBadge = `<span class="pr-badge pr-badge-checks-pass">✅ Checks</span>`;
                } else if (pr.checkStatus.status === 'failure') {
                    checksBadge = `<span class="pr-badge pr-badge-checks-fail">❌ Checks</span>`;
                } else if (pr.checkStatus.status === 'pending') {
                    checksBadge = `<span class="pr-badge pr-badge-checks-pending">⏳ Checks</span>`;
                }
            }
            
            return `
                <div class="github-pr-item">
                    <div class="github-pr-header-row">
                        <a href="${pr.html_url}" target="_blank" class="github-pr-title-link">
                            #${pr.number} ${pr.title}
                        </a>
                        <div class="github-pr-status-row">
                            <div class="github-pr-status ${statusClass}">
                                ${statusText}
                            </div>
                            ${checksBadge}
                        </div>
                    </div>
                    
                    <div class="github-pr-meta">
                        <span class="github-pr-author">${author}</span>
                        <span>•</span>
                        <span class="github-pr-date">${createdDate}</span>
                    </div>
                    
                    ${reviewersHtml}
                    ${additionalBadgesHtml}
                    
                    <button class="github-pr-description-toggle" id="prDescToggle${index}">
                        <span class="arrow">▶️</span>
                        <span>Description</span>
                    </button>
                    <div class="github-pr-description-content" id="prDescContent${index}">
                        <div class="github-pr-description-text">${description}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        githubPRContainer.innerHTML = `
            <div class="github-pr-list">
                ${prItems}
            </div>
        `;
        
        // Store PR data globally for comment popup access
        window.currentPRs = prs;
        
        // Add event listeners for description toggles
        prs.forEach((pr, index) => {
            const toggle = document.getElementById(`prDescToggle${index}`);
            if (toggle) {
                toggle.addEventListener('click', function() {
                    togglePRDescription(index);
                });
            }
        });
        
        // Add event listeners for clickable reviewer items (CSP-compliant)
        const clickableReviewers = document.querySelectorAll('.reviewer-item.clickable');
        clickableReviewers.forEach(reviewerItem => {
            reviewerItem.addEventListener('click', function() {
                const username = this.getAttribute('data-username');
                const prIndex = parseInt(this.getAttribute('data-pr-index'));
                const reviewerIndex = parseInt(this.getAttribute('data-reviewer-index'));
                
                if (username && !isNaN(prIndex) && !isNaN(reviewerIndex)) {
                    showReviewerComments(username, prIndex, reviewerIndex);
                }
            });
        });
    }
    
    /**
     * Returns the appropriate icon for reviewer status
     */
    function getReviewerStatusIcon(status) {
        switch (status) {
            case 'approved':
                return '✅';
            case 'changes_requested':
                return '❌';
            case 'review_requested':
                return '⏳';
            case 'commented':
                return '💬';
            case 'dismissed':
                return '🚫';
            default:
                return '⏳';
        }
    }
    
    /**
     * Toggles the description section for a GitHub PR
     */
    function togglePRDescription(index) {
        const toggle = document.getElementById(`prDescToggle${index}`);
        const content = document.getElementById(`prDescContent${index}`);
        const arrow = toggle?.querySelector('.arrow');
        
        if (!toggle || !content || !arrow) return;
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            toggle.classList.remove('expanded');
            arrow.textContent = '▶️';
        } else {
            content.classList.add('expanded');
            toggle.classList.add('expanded');
            arrow.textContent = '🔽';
        }
    }
    
    /**
     * Toggles the entire GitHub PR section
     */
    function toggleGithubPRSection() {
        const toggle = document.getElementById('githubPRToggle');
        const content = document.getElementById('githubPRCollapsibleContent');
        const arrow = toggle?.querySelector('.arrow');
        
        if (!toggle || !content || !arrow) return;
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            toggle.classList.remove('expanded');
            arrow.textContent = '▶️';
        } else {
            content.classList.add('expanded');
            toggle.classList.add('expanded');
            arrow.textContent = '🔽';
        }
    }
    
    // ==================== COMMENT POPUP FUNCTIONS ====================
    
    /**
     * Shows reviewer comments in a popup modal
     * Called when clicking on clickable reviewer badges
     */
    function showReviewerComments(username, prIndex, reviewerIndex) {
        if (!window.currentPRs || !window.currentPRs[prIndex]) {
            console.error('PR data not available');
            return;
        }
        
        const pr = window.currentPRs[prIndex];
        const reviewer = pr.reviewers[reviewerIndex];
        
        if (!reviewer.comments || reviewer.comments.length === 0) {
            console.error('No comments available for this reviewer');
            return;
        }
        
        const commentPopupModal = document.getElementById('commentPopupModal');
        const commentPopupTitle = document.getElementById('commentPopupTitle');
        const commentPopupBody = document.getElementById('commentPopupBody');
        const commentPopupContent = document.getElementById('commentPopupContent');
        
        if (!commentPopupModal || !commentPopupTitle || !commentPopupBody || !commentPopupContent) {
            console.error('Comment popup elements not found');
            return;
        }
        
        // Set title
        commentPopupTitle.textContent = `${username}'s Review Comments`;
        
        // Build comments HTML
        const commentsHtml = reviewer.comments.map(comment => {
            const date = comment.submitted_at || comment.created_at;
            const formattedDate = date ? new Date(date).toLocaleDateString() : 'Unknown date';
            const locationInfo = comment.path ? `${comment.path}${comment.line ? `:${comment.line}` : ''}` : '';
            
            return `
                <div class="comment-item">
                    <div class="comment-item-header">
                        ${formattedDate}${locationInfo ? ` • ${locationInfo}` : ''}${comment.state ? ` • ${comment.state}` : ''}
                    </div>
                    <div class="comment-item-text">${comment.body}</div>
                </div>
            `;
        }).join('');
        
        commentPopupBody.innerHTML = commentsHtml;
        
        // Position the modal near the clicked element (simple center for now)
        commentPopupContent.style.top = '50%';
        commentPopupContent.style.left = '50%';
        commentPopupContent.style.transform = 'translate(-50%, -50%)';
        
        // Show modal
        commentPopupModal.style.display = 'block';
    }
    
    /**
     * Closes the comment popup modal
     */
    function closeCommentPopup() {
        const commentPopupModal = document.getElementById('commentPopupModal');
        if (commentPopupModal) {
            commentPopupModal.style.display = 'none';
        }
    }
    
    // Functions are now called via proper event listeners (CSP-compliant)
    
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
