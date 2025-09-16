/**
 * My Code Reviews Component
 * 
 * Handles the "My Code Reviews" tab functionality including:
 * - Fetching PRs where the user is assigned as a reviewer
 * - Displaying PRs in a list format
 * - Handling PR selection and JIRA association
 */

import { appState } from '../core/appState.js';
import { showErrorState, showPlaceholderState, showNotification, updateColumnTitleWithTimestamp, showGitHubRateLimitWarning } from '../utils/ui.js';
import { parseJiraMarkdown, getBadgeClass } from '../utils/formatting.js';
import { generatePRCardsHTML } from '../utils/prCard.js';
import { generateJiraCardsFromResults } from '../utils/jiraCard.js';

// Auto-refresh timer for reviews
let reviewsAutoRefreshTimer = null;
const AUTO_REFRESH_INTERVAL = 300000; // 5 minutes

/**
 * Clear auto-refresh timer for reviews
 */
function clearReviewsAutoRefreshTimer() {
    if (reviewsAutoRefreshTimer) {
        clearTimeout(reviewsAutoRefreshTimer);
        reviewsAutoRefreshTimer = null;
        console.log('🕐 Cleared auto-refresh timer for reviews');
    }
}

/**
 * Set auto-refresh timer for reviews
 */
function setReviewsAutoRefreshTimer() {
    // Clear existing timer first
    clearReviewsAutoRefreshTimer();
    
    reviewsAutoRefreshTimer = setTimeout(() => {
        console.log('🕐 Auto-refresh triggered for Reviews after 5 minutes');
        console.log('🔄 Auto-refreshing Reviews...');
        loadPRsAwaitingReview(true); // forceRefresh = true
    }, AUTO_REFRESH_INTERVAL);
    
    console.log('🕐 Set auto-refresh timer for Reviews (5 minutes)');
}

// Removed getReviewsElementIds() - using direct IDs for clarity
// PRs Content: 'reviews-prs-content'
// JIRA Content: 'reviews-jira-content'

/**
 * Initialize the My Code Reviews tab
 * Sets up event handlers and loads initial data
 */
export function initializeReviewsTab() {
    console.log('🔄 Initializing Reviews tab...');
    
    // Navigation activation is handled by triggerComponentActivation in ui.js
    // Removed legacy data-tab event listener as it's no longer needed
    
    console.log('✅ Reviews tab initialized');
}

/**
 * Handle when the Reviews tab is activated
 * Loads PRs awaiting review if not already loaded
 */
function onReviewsTabActivated() {
    console.log('🔄 Reviews tab activated');
    
    // Reset the JIRA content panel to placeholder state
    const jiraContent = document.getElementById('reviews-jira-content');
    if (jiraContent) {
        jiraContent.innerHTML = '<div class="placeholder">Associated JIRAs will be loaded here...</div>';
    }
    
    // Reset the JIRA panel title to default
    resetJiraPanelTitle();
    
    // Remove active state from all PRs since we're starting fresh
    document.querySelectorAll('.github-pr-item').forEach(pr => pr.classList.remove('active'));
    
    // Check if we have required API tokens
    if (!appState.apiTokens.github || !appState.apiTokens.githubUsername) {
        showErrorState(elementIds.prsContentId, 
            'GitHub credentials required', 
            'Please configure your GitHub token and username in Settings');
        return;
    }
    
    // Load PRs awaiting review
    loadPRsAwaitingReview();
}

/**
 * Load PRs where the current user is assigned as a reviewer
 * Shows loading state while fetching data
 * @param {boolean} forceRefresh - Whether to bypass cache and force refresh
 */
async function loadPRsAwaitingReview(forceRefresh = false) {
    const prsContainer = document.getElementById('reviews-prs-content');
    
    // Check cache first (unless force refreshing)
    if (!forceRefresh) {
        // Check if we've loaded data recently to prevent GitHub API rate limiting
        // GitHub Search API has strict limit: 30 requests/minute
        const lastLoadTime = window.reviewsLastLoadTime || 0;
        const now = Date.now();
        const CACHE_DURATION = 300000; // 5 minutes cache to prevent rate limiting
        
        if (prsContainer && prsContainer.innerHTML && 
            !prsContainer.innerHTML.includes('Loading') && 
            !prsContainer.innerHTML.includes('Failed') &&
            (now - lastLoadTime) < CACHE_DURATION) {
            const remainingTime = Math.round((CACHE_DURATION - (now - lastLoadTime)) / 1000);
            console.log(`✅ Reviews PRs cached for ${remainingTime}s more to prevent GitHub rate limiting`);
            
            // Update UI to show cached data with refresh button
            const createRefreshCallback = () => {
                return async () => {
                    console.log('🔄 Manual refresh triggered for PRs I\'m Reviewing');
                    
                    // Clear the JIRA content panel and reset title
                    const jiraContent = document.getElementById('reviews-jira-content');
                    if (jiraContent) {
                        jiraContent.innerHTML = '<div class="placeholder">Associated JIRAs will be loaded here...</div>';
                    }
                    resetJiraPanelTitle();
                    
                    // Remove active state from all PRs
                    document.querySelectorAll('.github-pr-item').forEach(pr => pr.classList.remove('active'));
                    
                    await loadPRsAwaitingReview(true); // forceRefresh = true
                };
            };
            
            updateColumnTitleWithTimestamp('#reviews-prs-column .column-title', 'PRs I\'m Reviewing', window.reviewsLastLoadTime, createRefreshCallback());
            return;
        }
    }
    
    // Set load timestamp to prevent rapid successive calls
    window.reviewsLastLoadTime = Date.now();
    
    // Clear existing timer if this is a manual refresh
    if (forceRefresh) {
        console.log('🕐 Manual refresh - clearing reviews timer');
        clearReviewsAutoRefreshTimer();
    }
    
    if (!prsContainer) {
        console.error('❌ Reviews PRs container not found:', elementIds.prsContentId);
        return;
    }
    
    // Show loading state
    prsContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <span>Loading reviews awaiting your review...</span>
        </div>
    `;
    
    try {
        console.log('🔍 Fetching PRs where you are a reviewer...');
        
        // Use broader search to find PRs involving the user, then filter for reviewer role
        const searchQuery = `type:pr state:open involves:${appState.apiTokens.githubUsername}`;
        const apiUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc&per_page=100`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `token ${appState.apiTokens.github}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'OCMUI-Team-Dashboard'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log(`🔍 Found ${data.items.length} PRs involving user, filtering for reviewer role...`);
        
        // Filter PRs to only those where the user is a reviewer and get review status
        const reviewerPRs = await filterAndEnhancePRsWithReviewStatus(data.items);
        
        console.log(`🔍 Found ${reviewerPRs.length} PRs where you are a reviewer`);
        displayPRsAwaitingReview(reviewerPRs);
        
    } catch (error) {
        console.error('❌ Error loading PRs awaiting review:', error);
        
        // Check if it's a 403 rate limiting error
        if (error.message && error.message.includes('403')) {
            showGitHubRateLimitWarning('reviews-prs-content', 'load PRs awaiting your review');
            showNotification('GitHub API rate limit reached. Data is cached for 5 minutes.', 'warning');
        } else {
            showErrorState('reviews-prs-content', 
                'Failed to load PRs awaiting review', 
                error.message);
            showNotification('Failed to load reviews. Check your GitHub token.', 'error');
        }
    }
}

/**
 * Filter PRs to only those where the user is a reviewer and enhance with review status
 * @param {Array} prs - Array of PR objects from GitHub search API
 * @returns {Promise<Array>} Array of PRs where user is a reviewer, with review status
 */
async function filterAndEnhancePRsWithReviewStatus(prs) {
    const username = appState.apiTokens.githubUsername;
    const reviewerPRs = [];
    
    for (const pr of prs) {
        try {
            // Skip if the user is the author
            if (pr.user.login === username) {
                continue;
            }
            
            // Get the full PR details to check reviewers and review status
            const repoName = pr.repository_url.split('/').slice(-2).join('/');
            const prNumber = pr.number;
            
            // Fetch PR details, reviews, and general comments
            const [prResponse, reviewsResponse, commentsResponse] = await Promise.all([
                fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}`, {
                    headers: {
                        'Authorization': `token ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OCMUI-Team-Dashboard'
                    }
                }),
                fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}/reviews`, {
                    headers: {
                        'Authorization': `token ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OCMUI-Team-Dashboard'
                    }
                }),
                fetch(`https://api.github.com/repos/${repoName}/issues/${prNumber}/comments`, {
                    headers: {
                        'Authorization': `token ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OCMUI-Team-Dashboard'
                    }
                })
            ]);
            
            if (!prResponse.ok || !reviewsResponse.ok || !commentsResponse.ok) {
                console.warn(`⚠️ Failed to fetch details for PR #${prNumber}: ${prResponse.status}/${reviewsResponse.status}/${commentsResponse.status}`);
                continue;
            }
            
            const prDetails = await prResponse.json();
            const reviews = await reviewsResponse.json();
            const comments = await commentsResponse.json();
            
            // Now fetch check runs using the current head SHA from PR details
            let checkRuns = [];
            try {
                const headSha = prDetails.head.sha;
                console.log(`🔍 Fetching check runs for PR #${prNumber} using current head SHA: ${headSha}`);
                
                const checksResponse = await fetch(`https://api.github.com/repos/${repoName}/commits/${headSha}/check-runs`, {
                    headers: {
                        'Authorization': `token ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OCMUI-Team-Dashboard'
                    }
                });
                
                if (checksResponse.ok) {
                    const checksData = await checksResponse.json();
                    checkRuns = checksData.check_runs || [];
                    console.log(`✅ Fetched ${checkRuns.length} check runs for PR #${prNumber}`);
                } else {
                    console.warn(`⚠️ Check runs API returned ${checksResponse.status} for PR #${prNumber}`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to fetch check runs for PR #${prNumber}:`, error);
                // Continue without check runs data
            }
            
            // Check if user is a requested reviewer or has reviewed
            const isRequestedReviewer = prDetails.requested_reviewers?.some(reviewer => reviewer.login === username);
            const userReviews = reviews.filter(review => review.user.login === username);
            const hasUserReviewed = userReviews.length > 0;
            
            // Skip if user is not involved as a reviewer
            if (!isRequestedReviewer && !hasUserReviewed) {
                continue;
            }
            
            // Determine review status
            let reviewStatus = 'waiting'; // Default status
            let reviewStatusLabel = 'Waiting for Review';
            let statusPriority = 1; // Lower number = higher priority (top of list)
            
            if (hasUserReviewed) {
                // Get the latest review by this user
                const latestReview = userReviews[userReviews.length - 1];
                
                switch (latestReview.state) {
                    case 'APPROVED':
                        reviewStatus = 'approved';
                        reviewStatusLabel = 'Approved';
                        statusPriority = 4; // Lowest priority (bottom)
                        break;
                    case 'CHANGES_REQUESTED':
                        reviewStatus = 'changes_requested';
                        reviewStatusLabel = 'Changes Requested';
                        statusPriority = 2; // High priority
                        break;
                    case 'COMMENTED':
                        reviewStatus = 'commented';
                        reviewStatusLabel = 'Commented';
                        statusPriority = 3; // Medium priority
                        break;
                    default:
                        reviewStatus = 'reviewed';
                        reviewStatusLabel = 'Reviewed';
                        statusPriority = 3;
                }
            }
            
            // Enhance PR object with detailed information for shared component
            const enhancedPR = {
                ...pr,
                reviewStatus,
                reviewStatusLabel,
                statusPriority,
                repoName,
                isRequestedReviewer,
                userReviews: userReviews.length,
                // Store detailed data for shared component
                reviews,
                prDetails,
                comments, // Add general PR comments for reviewer detection
                checkRuns
            };
            
            reviewerPRs.push(enhancedPR);
            
        } catch (error) {
            console.warn(`⚠️ Error processing PR #${pr.number}:`, error);
            // Continue with other PRs even if one fails
        }
    }
    
    // Sort by status priority (changes_requested first, approved last)
    reviewerPRs.sort((a, b) => {
        // First sort by priority (lower number = higher priority)
        if (a.statusPriority !== b.statusPriority) {
            return a.statusPriority - b.statusPriority;
        }
        // Then sort by updated date (most recent first)
        return new Date(b.updated_at) - new Date(a.updated_at);
    });
    
    return reviewerPRs;
}

/**
 * Display the list of PRs awaiting review
 * @param {Array} prs - Array of enhanced PR objects with review status
 */
function displayPRsAwaitingReview(prs) {
    const prsContainer = document.getElementById('reviews-prs-content');
    
    if (!prsContainer) {
        console.error('❌ Reviews PRs container not found: reviews-prs-content');
        return;
    }
    
    if (prs.length === 0) {
        showPlaceholderState('reviews-prs-content', 
            'No PRs awaiting your review', 
            '🎉');
        return;
    }
    
    // Generate PR cards using shared component
    const prsHtml = generatePRCardsHTML(prs, {
        clickableTitle: false,
        showLinkIcon: true,
        showMoreInfo: true,
        initiallyExpanded: false,
        clickHandler: 'selectPRForJiraLookup(this)',
        currentUser: appState.apiTokens.githubUsername
    });
    
    prsContainer.innerHTML = `
        <div class="prs-list">
            <div class="prs-items">
                ${prsHtml}
            </div>
        </div>
    `;
    
    // Create refresh callback
    const createRefreshCallback = () => {
        return async () => {
            console.log('🔄 Manual refresh triggered for PRs I\'m Reviewing');
            
            // Clear the JIRA content panel and reset title
            const jiraContent = document.getElementById('reviews-jira-content');
            if (jiraContent) {
                jiraContent.innerHTML = '<div class="placeholder">Associated JIRAs will be loaded here...</div>';
            }
            resetJiraPanelTitle();
            
            // Remove active state from all PRs
            document.querySelectorAll('.github-pr-item').forEach(pr => pr.classList.remove('active'));
            
            await loadPRsAwaitingReview(true); // forceRefresh = true
        };
    };
    
    // Update column title with timestamp and refresh button
    updateColumnTitleWithTimestamp('#reviews-prs-column .column-title', 'PRs I\'m Reviewing', window.reviewsLastLoadTime, createRefreshCallback());
    
    // Make click handler available globally
    window.selectPRForJiraLookup = function(element) {
        // Remove active state from other PRs
        document.querySelectorAll('.github-pr-item').forEach(pr => pr.classList.remove('active'));
        
        // Add active state to clicked PR
        element.classList.add('active');
        
        // Extract PR info from data attributes (more reliable than parsing text)
        const repoName = element.getAttribute('data-repo-name');
        const prNumber = element.getAttribute('data-pr-number');
        
        if (prNumber && repoName) {
            console.log(`🔍 Selected PR #${prNumber} from ${repoName} for JIRA lookup`);
            loadAssociatedJIRAsForPR(repoName, prNumber);
        } else {
            console.error('❌ Could not extract PR info from element:', { repoName, prNumber });
        }
    };
    
    console.log(`✅ Displayed ${prs.length} PRs awaiting review`);
    
    // Set auto-refresh timer for successful data load
    setReviewsAutoRefreshTimer();
}

/**
 * Set up click handlers for PR items
 * Allows users to click on PRs to view associated JIRAs
 */
function setupPRClickHandlers() {
    const prItems = document.querySelectorAll('.pr-item');
    
    prItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active state from other PRs
            document.querySelectorAll('.pr-item').forEach(pr => pr.classList.remove('active'));
            
            // Add active state to clicked PR
            this.classList.add('active');
            
            const prNumber = this.dataset.prNumber;
            const repo = this.dataset.repo;
            
            console.log(`🔍 Selected PR #${prNumber} from ${repo}`);
            
            // Load associated JIRAs for this PR
            loadAssociatedJIRAsForPR(repo, prNumber);
        });
    });
}

/**
 * Update the JIRA panel title with the PR number
 * @param {string} prNumber - The PR number to display
 */
function updateJiraPanelTitle(prNumber) {
    const titleElement = document.querySelector('#reviews-jira-title .title-text');
    if (titleElement) {
        titleElement.textContent = `JIRAs associated with #${prNumber}`;
    }
}

/**
 * Reset the JIRA panel title to default
 */
function resetJiraPanelTitle() {
    const titleElement = document.querySelector('#reviews-jira-title .title-text');
    if (titleElement) {
        titleElement.textContent = 'Associated JIRAs';
    }
}

/**
 * Load and display JIRAs associated with the selected PR
 * @param {string} repo - Repository name (owner/repo)
 * @param {string} prNumber - PR number
 */
async function loadAssociatedJIRAsForPR(repo, prNumber) {
    const jiraContainer = document.getElementById('reviews-jira-content');
    
    if (!jiraContainer) {
        console.error('❌ Reviews JIRA container not found: reviews-jira-content');
        return;
    }
    
    // Update the JIRA panel title
    updateJiraPanelTitle(prNumber);
    
    // Show loading state
    jiraContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <span>Loading associated JIRAs...</span>
        </div>
    `;
    
    try {
        console.log(`🔍 Fetching PR details for ${repo}#${prNumber}...`);
        
        // Fetch PR details including body and comments
        const prApiUrl = `https://api.github.com/repos/${repo}/pulls/${prNumber}`;
        const commentsApiUrl = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
        
        const [prResponse, commentsResponse] = await Promise.all([
            fetch(prApiUrl, {
                headers: {
                    'Authorization': `token ${appState.apiTokens.github}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'OCMUI-Team-Dashboard'
                }
            }),
            fetch(commentsApiUrl, {
                headers: {
                    'Authorization': `token ${appState.apiTokens.github}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'OCMUI-Team-Dashboard'
                }
            })
        ]);
        
        if (!prResponse.ok || !commentsResponse.ok) {
            throw new Error(`GitHub API error: ${prResponse.status} or ${commentsResponse.status}`);
        }
        
        const prData = await prResponse.json();
        const commentsData = await commentsResponse.json();
        
        // Extract JIRA IDs from PR body and comments
        const jiraIds = extractJIRAIds([prData.body, ...commentsData.map(c => c.body)]);
        
        console.log(`🔍 Found ${jiraIds.length} JIRA references in PR #${prNumber}`);
        
        if (jiraIds.length > 0) {
            // Automatically load all JIRA tickets
            await loadAllJIRADetails(jiraIds, repo, prNumber);
        } else {
            showPlaceholderState('reviews-jira-content', 
                `No JIRA references found in PR #${prNumber}`, 
                '📝');
        }
        
    } catch (error) {
        console.error('❌ Error loading associated JIRAs:', error);
        showErrorState('reviews-jira-content', 
            'Failed to load associated JIRAs', 
            error.message);
    }
}

/**
 * Extract JIRA IDs from text content
 * @param {Array<string>} textContents - Array of text content to search
 * @returns {Array<string>} Array of unique JIRA IDs found
 */
function extractJIRAIds(textContents) {
    const jiraIds = new Set();
    
    // Common JIRA prefixes based on the app state
    const prefixes = appState.jiraPrefixes || ['OCMUI-', 'OCM-', 'XCMSTRAT-'];
    
    textContents.forEach(text => {
        if (!text) return;
        
        prefixes.forEach(prefix => {
            // Match pattern: PREFIX-NUMBER (e.g., OCMUI-1234)
            const regex = new RegExp(`${prefix.replace('-', '\\-')}(\\d+)`, 'gi');
            const matches = text.match(regex);
            
            if (matches) {
                matches.forEach(match => jiraIds.add(match.toUpperCase()));
            }
        });
    });
    
    return Array.from(jiraIds);
}



/**
 * Load all JIRA details automatically using Promise.all
 * @param {Array<string>} jiraIds - Array of JIRA IDs
 * @param {string} repo - Repository name  
 * @param {string} prNumber - PR number
 */
async function loadAllJIRADetails(jiraIds, repo, prNumber) {
    const jiraContainer = document.getElementById('reviews-jira-content');
    
    if (!jiraContainer) {
        console.error('❌ Reviews JIRA container not found: reviews-jira-content');
        return;
    }
    
    // Show initial loading state
    jiraContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <span>Loading ${jiraIds.length} JIRA ticket${jiraIds.length > 1 ? 's' : ''}...</span>
        </div>
    `;
    
    try {
        console.log(`🔍 Loading ${jiraIds.length} JIRA tickets:`, jiraIds);
        
        // Fetch all JIRA tickets in parallel
        const jiraPromises = jiraIds.map(jiraId => fetchJIRATicket(jiraId));
        const results = await Promise.all(jiraPromises);
        
        // Filter successful results
        const successfulJIRAs = results.filter(result => result.success);
        const failedJIRAs = results.filter(result => !result.success);
        
        if (failedJIRAs.length > 0) {
            console.warn(`⚠️ ${failedJIRAs.length} JIRA(s) failed to load:`, failedJIRAs.map(f => f.jiraId));
        }
        
        if (successfulJIRAs.length === 0) {
            showErrorState('reviews-jira-content', 
                'Failed to load any JIRA tickets', 
                `All ${jiraIds.length} JIRA requests failed`);
            return;
        }
        
        // Display all successfully loaded JIRAs
        displayLoadedJIRAs(successfulJIRAs, repo, prNumber);
        
    } catch (error) {
        console.error('❌ Error loading JIRA details:', error);
        showErrorState('reviews-jira-content', 
            'Failed to load JIRA tickets', 
            error.message);
    }
}

/**
 * Fetch a single JIRA ticket using the same API as the main JIRA tab
 * @param {string} jiraId - JIRA ticket ID
 * @returns {Promise<Object>} Result object with success flag and ticket data
 */
async function fetchJIRATicket(jiraId) {
    try {
        const requestBody = { 
            jiraId: jiraId, 
            token: appState.apiTokens.jira 
        };
        
        const response = await fetch('/api/jira-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.ticket) {
            return {
                success: true,
                jiraId,
                ticket: result.ticket
            };
        } else {
            return {
                success: false,
                jiraId,
                error: result.error || 'Unknown error'
            };
        }
    } catch (error) {
        console.error(`❌ Error fetching JIRA ${jiraId}:`, error);
        return {
            success: false,
            jiraId,
            error: error.message
        };
    }
}

/**
 * Display all successfully loaded JIRA tickets
 * @param {Array} jiraResults - Array of successful JIRA results
 * @param {string} repo - Repository name
 * @param {string} prNumber - PR number  
 */
function displayLoadedJIRAs(jiraResults, repo, prNumber) {
    const jiraContainer = document.getElementById('reviews-jira-content');
    
    if (!jiraContainer) {
        console.error('❌ Reviews JIRA container not found: reviews-jira-content');
        return;
    }
    
    // Generate JIRA cards using shared component with collapsible sections
    const jiraHtml = generateJiraCardsFromResults(jiraResults, {
        collapsible: true,
        wrapInSection: true,
        toggleFunction: 'toggleJiraMoreInfo'
    });
    
    jiraContainer.innerHTML = `
        <div class="associated-jiras">
            <div class="jira-tickets">
                ${jiraHtml}
            </div>
        </div>
    `;
    
    console.log(`✅ Displayed ${jiraResults.length} JIRA tickets for PR #${prNumber}`);
    
// Note: toggleJiraMoreInfo function is provided by the shared collapsible component
}

// toggleJiraMoreInfo function is provided by the shared collapsible component

/**
 * Format JIRA comments for display (same as main JIRA tab)
 * @param {Array} comments - Array of JIRA comments
 * @returns {string} HTML string for comments section
 */
function formatCommentsHtml(comments) {
    if (!comments || comments.length === 0) {
        return '';
    }
    
    const commentsHtml = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <strong>${comment.author}</strong> - ${new Date(comment.created).toLocaleDateString()}
            </div>
            <div class="comment-body">
                ${parseJiraMarkdown(comment.body)}
            </div>
        </div>
    `).join('');
    
    return `
        <div class="jira-section">
            <label><strong>Comments:</strong></label>
            <div class="jira-content">
                ${commentsHtml}
            </div>
        </div>
    `;
}

// Make activation function globally available for two-level navigation
if (typeof window !== 'undefined') {
    window.onReviewsTabActivated = onReviewsTabActivated;
}
