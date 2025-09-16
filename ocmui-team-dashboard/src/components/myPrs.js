/**
 * My PRs Tab Component
 * 
 * Handles functionality for the "My PRs" tab:
 * - Fetching PRs authored by the current user (open/closed)
 * - Displaying PRs in a list format with split pane layout
 * - Handling PR selection and JIRA association
 * - Radio button controls for open/closed PR filtering
 * - Pagination for closed PRs with "Load More" functionality
 * - Loading states and API call cancellation
 */

import { appState } from '../core/appState.js';
import { showErrorState, showPlaceholderState, showNotification, initializeMyPrsSplitPanes, updateColumnTitleWithTimestamp, showGitHubRateLimitWarning } from '../utils/ui.js';
import { parseJiraMarkdown, getBadgeClass } from '../utils/formatting.js';
import { generatePRCardsHTML } from '../utils/prCard.js';
import { generateJiraCardsFromResults } from '../utils/jiraCard.js';

// Removed getMyPrsElementIds() - using direct IDs for clarity  
// PRs Content: 'my-prs-content'
// JIRA Content: 'my-prs-jira-content'

// Global state for My PRs tab
let currentAbortController = null;
let loadedPRs = [];
let currentPage = 1;
const CLOSED_PRS_PER_PAGE = 5;

// Auto-refresh timers
let openPRsAutoRefreshTimer = null;
let closedPRsAutoRefreshTimer = null;
const AUTO_REFRESH_INTERVAL = 300000; // 5 minutes

/**
 * Clear auto-refresh timer for specific PR status
 * @param {string} prStatus - 'open' or 'closed'
 */
function clearAutoRefreshTimer(prStatus) {
    if (prStatus === 'closed' && closedPRsAutoRefreshTimer) {
        clearTimeout(closedPRsAutoRefreshTimer);
        closedPRsAutoRefreshTimer = null;
        console.log('🕐 Cleared auto-refresh timer for closed PRs');
    } else if (prStatus === 'open' && openPRsAutoRefreshTimer) {
        clearTimeout(openPRsAutoRefreshTimer);
        openPRsAutoRefreshTimer = null;
        console.log('🕐 Cleared auto-refresh timer for open PRs');
    }
}

/**
 * Set auto-refresh timer for specific PR status
 * @param {string} prStatus - 'open' or 'closed'
 */
function setAutoRefreshTimer(prStatus) {
    // Clear existing timer first
    clearAutoRefreshTimer(prStatus);
    
    const timer = setTimeout(() => {
        console.log(`🕐 Auto-refresh triggered for ${prStatus} PRs after 5 minutes`);
        
        // Only auto-refresh if we're currently viewing this PR status
        if (getCurrentPRStatus() === prStatus) {
            console.log(`🔄 Auto-refreshing ${prStatus} PRs...`);
            loadMyPRs(false, true); // forceRefresh = true
        }
    }, AUTO_REFRESH_INTERVAL);
    
    if (prStatus === 'closed') {
        closedPRsAutoRefreshTimer = timer;
    } else {
        openPRsAutoRefreshTimer = timer;
    }
    
    console.log(`🕐 Set auto-refresh timer for ${prStatus} PRs (5 minutes)`);
}

/**
 * Initialize the My PRs tab
 * Sets up event handlers and loads initial data
 */
export function initializeMyPrsTab() {
    console.log('🚀 Initializing My PRs tab');
    
    // Initialize split panes for this tab
    initializeMyPrsSplitPanes();
    
    // Set up radio button change handlers
    setupRadioButtonHandlers();
    
    // Navigation activation is handled by triggerComponentActivation in ui.js
    // Removed legacy data-tab event listener as it's no longer needed
    
    // Make activation function globally available for two-level navigation
    if (typeof window !== 'undefined') {
        window.onMyPrsTabActivated = onMyPrsTabActivated;
    }
    
    // Make cancellation function available globally for tab navigation
    window.cancelMyPRsRequests = function() {
        if (currentAbortController) {
            console.log('🚫 Cancelling My PRs API requests due to tab navigation');
            currentAbortController.abort();
            currentAbortController = null;
            
            // Reset loading states
            setLoadingState(false);
        }
    };
}

/**
 * Handle My PRs tab activation
 */
function onMyPrsTabActivated() {
    console.log('📂 My PRs tab activated');
    
    // Reset the JIRA content panel to placeholder state
    const jiraContent = document.getElementById('my-prs-jira-content');
    if (jiraContent) {
        jiraContent.innerHTML = '<div class="placeholder">Associated JIRAs will be loaded here...</div>';
    }
    
    // Load PRs if we have a GitHub username
    if (appState.apiTokens.githubUsername) {
        loadMyPRs();
    } else {
        showErrorState('my-prs-content', 'GitHub username not configured', 'Please set your GitHub username in Settings');
    }
}

/**
 * Set up radio button change handlers
 */
function setupRadioButtonHandlers() {
    const radioButtons = document.querySelectorAll('input[name="pr-status"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                console.log(`📻 Filter changed to: ${e.target.value}`);
                
                // Reset the JIRA content panel to placeholder state
                const jiraContent = document.getElementById('my-prs-jira-content');
                if (jiraContent) {
                    jiraContent.innerHTML = '<div class="placeholder">Associated JIRAs will be loaded here...</div>';
                }
                
                // Remove active state from all PRs since we're switching filters
                document.querySelectorAll('.github-pr-item').forEach(pr => pr.classList.remove('active'));
                
                // Cancel any ongoing API calls
                if (currentAbortController) {
                    currentAbortController.abort();
                    console.log('🚫 Cancelled previous API call');
                }
                
                // Clear auto-refresh timers when switching filters
                clearAutoRefreshTimer('open');
                clearAutoRefreshTimer('closed');
                
                // Reset pagination state
                loadedPRs = [];
                currentPage = 1;
                
                // Load PRs with new filter (will use cache if available)
                loadMyPRs();
            }
        });
    });
}

/**
 * Get the currently selected PR status filter
 * @returns {string} 'open' or 'closed'
 */
function getCurrentPRStatus() {
    const checkedRadio = document.querySelector('input[name="pr-status"]:checked');
    return checkedRadio ? checkedRadio.value : 'open';
}

/**
 * Set loading state - disable/enable controls
 * @param {boolean} loading - Whether to show loading state
 */
function setLoadingState(loading) {
    const radioButtons = document.querySelectorAll('input[name="pr-status"]');
    
    // Disable/enable radio buttons
    radioButtons.forEach(radio => {
        radio.disabled = loading;
    });
    
    // Update visual state of radio button labels
    document.querySelectorAll('.radio-group').forEach(group => {
        if (loading) {
            group.style.opacity = '0.5';
            group.style.pointerEvents = 'none';
        } else {
            group.style.opacity = '1';
            group.style.pointerEvents = 'auto';
        }
    });
}

/**
 * Load PRs authored by the current user
 * @param {boolean} loadMore - Whether this is a "load more" request
 * @param {boolean} forceRefresh - Whether to bypass cache and force refresh
 */
async function loadMyPRs(loadMore = false, forceRefresh = false) {
    const prsContainer = document.getElementById('my-prs-content');
    const username = appState.apiTokens.githubUsername;
    const githubToken = appState.apiTokens.github;
    const prStatus = getCurrentPRStatus();
    
    // Check cache first (unless loading more results or force refreshing)
    if (!loadMore && !forceRefresh) {
        // Check if we've loaded data recently to prevent GitHub API rate limiting
        // GitHub Search API has strict limit: 30 requests/minute
        // Use separate timestamps for open vs closed PRs
        const lastLoadTime = (prStatus === 'closed') ? 
            (window.myPrsClosedLastLoadTime || 0) : 
            (window.myPrsOpenLastLoadTime || 0);
        const now = Date.now();
        const CACHE_DURATION = 300000; // 5 minutes cache to prevent rate limiting
        
        // Check if we have cached data for this specific PR status (not just any data in container)
        const hasCachedData = (prStatus === 'closed') ? 
            window.cachedClosedPRs && window.cachedClosedPRs.length > 0 :
            window.cachedOpenPRs && window.cachedOpenPRs.length > 0;
            
        if (hasCachedData && (now - lastLoadTime) < CACHE_DURATION) {
            const remainingTime = Math.round((CACHE_DURATION - (now - lastLoadTime)) / 1000);
            console.log(`✅ My PRs (${prStatus}) cached for ${remainingTime}s more to prevent GitHub rate limiting`);
            
            console.log(`🕒 Cache hit for ${prStatus} PRs - Using cached data`);
            console.log(`🕒 Available timestamps - Open: ${window.myPrsOpenLastLoadTime ? new Date(window.myPrsOpenLastLoadTime).toLocaleTimeString() : 'undefined'}, Closed: ${window.myPrsClosedLastLoadTime ? new Date(window.myPrsClosedLastLoadTime).toLocaleTimeString() : 'undefined'}`);
            
            // Display cached data for the current filter
            const cachedData = (prStatus === 'closed') ? window.cachedClosedPRs : window.cachedOpenPRs;
            displayMyPRs(cachedData, { showLoadMore: false, totalAvailable: cachedData.length });
            return;
        }
    }
    
    // Set load timestamp when making actual API call
    // Use separate timestamps for open vs closed PRs
    if (!loadMore) {
        const timestamp = Date.now();
        console.log(`🕒 Setting timestamp for ${prStatus} PRs: ${new Date(timestamp).toLocaleTimeString()}`);
        if (prStatus === 'closed') {
            window.myPrsClosedLastLoadTime = timestamp;
            console.log(`🕒 Closed timestamp now: ${new Date(window.myPrsClosedLastLoadTime).toLocaleTimeString()}`);
        } else {
            window.myPrsOpenLastLoadTime = timestamp;
            console.log(`🕒 Open timestamp now: ${new Date(window.myPrsOpenLastLoadTime).toLocaleTimeString()}`);
        }
        console.log(`🕒 Current state - Open: ${window.myPrsOpenLastLoadTime ? new Date(window.myPrsOpenLastLoadTime).toLocaleTimeString() : 'undefined'}, Closed: ${window.myPrsClosedLastLoadTime ? new Date(window.myPrsClosedLastLoadTime).toLocaleTimeString() : 'undefined'}`);
        
        // Clear existing timer for this status and set a new one for auto-refresh
        if (forceRefresh) {
            console.log(`🕐 Manual refresh - clearing timer for ${prStatus} PRs`);
            clearAutoRefreshTimer(prStatus);
        }
    }
    
    if (!username || !githubToken) {
        showErrorState('my-prs-content', 'Configuration missing', 'Please configure GitHub username and token in Settings');
        return;
    }
    
    // Create new abort controller for this request
    currentAbortController = new AbortController();
    
    // Set loading state (disable controls)
    setLoadingState(true);
    
    try {
        // For "load more", we append to existing results
        const isInitialLoad = !loadMore;
        
        if (isInitialLoad) {
            // Show loading state for initial load
            prsContainer.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Loading your ${prStatus} PRs...</span>
                </div>
            `;
        } else {
            // Show loading indicator for "load more"
            updateLoadMoreButton(true);
        }
        
        // Determine how many PRs to fetch
        let perPage = 50; // Default for open PRs
        if (prStatus === 'closed') {
            // For closed PRs, use pagination
            perPage = CLOSED_PRS_PER_PAGE;
        }
        
        console.log(`🔍 Searching for ${prStatus} PRs authored by ${username} (page ${currentPage})`);
        
        // Search for PRs authored by the user with specified status
        const searchQuery = `author:${username} type:pr state:${prStatus}`;
        const searchResponse = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc&per_page=${perPage}&page=${currentPage}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'OCMUI-Team-Dashboard'
            },
            signal: currentAbortController.signal
        });
        
        if (!searchResponse.ok) {
            throw new Error(`GitHub API error: ${searchResponse.status} ${searchResponse.statusText}`);
        }
        
        const searchData = await searchResponse.json();
        const newPRs = searchData.items || [];
        
        console.log(`📊 Found ${newPRs.length} new ${prStatus} PRs for page ${currentPage}`);
        
        // Enhance PRs with detailed information
        const enhancedPRs = await enhancePRsWithDetails(newPRs);
        
        if (isInitialLoad) {
            // First load - replace all PRs
            loadedPRs = enhancedPRs;
        } else {
            // Load more - append to existing PRs
            loadedPRs = [...loadedPRs, ...enhancedPRs];
        }
        
        // Display the PRs
        displayMyPRs(loadedPRs, {
            showLoadMore: prStatus === 'closed' && newPRs.length === perPage,
            totalAvailable: searchData.total_count
        });
        
        // Set auto-refresh timer for successful data load (only for initial loads, not "load more")
        if (!loadMore) {
            setAutoRefreshTimer(prStatus);
        }
        
        // Increment page for next "load more" request
        if (newPRs.length === perPage) {
            currentPage++;
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('🚫 My PRs API request was cancelled');
            return;
        }
        
        console.error('❌ Error loading My PRs:', error);
        if (!loadMore) {
            // Check if it's a 403 rate limiting error
            if (error.message && error.message.includes('403')) {
                showGitHubRateLimitWarning('my-prs-content', 'load your PRs');
                showNotification('GitHub API rate limit reached. Data is cached for 5 minutes.', 'warning');
            } else {
                showErrorState('my-prs-content', 'Failed to load PRs', error.message);
                showNotification('Failed to load PRs. Check your GitHub token.', 'error');
            }
        } else {
            updateLoadMoreButton(false, 'Failed to load more PRs');
        }
    } finally {
        // Re-enable controls
        setLoadingState(false);
        currentAbortController = null;
    }
}

/**
 * Enhance PRs with detailed information (reviews, check runs, etc.)
 * @param {Array} prs - Array of basic PR objects from GitHub search API
 * @returns {Promise<Array>} Array of enhanced PR objects
 */
async function enhancePRsWithDetails(prs) {
    const enhancedPRs = [];
    
    for (const pr of prs) {
        try {
            // Check if request was cancelled
            if (currentAbortController?.signal.aborted) {
                console.log('🚫 Enhancement cancelled by user');
                break;
            }
            
            const repoName = pr.repository_url.split('/').slice(-2).join('/');
            const prNumber = pr.number;
            
            // Fetch PR details, reviews, and general comments
            const [prResponse, reviewsResponse, commentsResponse] = await Promise.all([
                fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}`, {
                    headers: {
                        'Authorization': `token ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OCMUI-Team-Dashboard'
                    },
                    signal: currentAbortController?.signal
                }),
                fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}/reviews`, {
                    headers: {
                        'Authorization': `token ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OCMUI-Team-Dashboard'
                    },
                    signal: currentAbortController?.signal
                }),
                fetch(`https://api.github.com/repos/${repoName}/issues/${prNumber}/comments`, {
                    headers: {
                        'Authorization': `token ${appState.apiTokens.github}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OCMUI-Team-Dashboard'
                    },
                    signal: currentAbortController?.signal
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
                    },
                    signal: currentAbortController?.signal
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
            
            // Enhance PR object with detailed information
            const enhancedPR = {
                ...pr,
                repoName,
                // Store detailed data for shared component
                reviews,
                prDetails,
                comments, // Add general PR comments for reviewer detection
                checkRuns
            };
            
            enhancedPRs.push(enhancedPR);
            
        } catch (error) {
            console.warn(`⚠️ Error processing PR #${pr.number}:`, error);
            // Continue with other PRs
        }
    }
    
    return enhancedPRs;
}

/**
 * Display the list of My PRs
 * @param {Array} prs - Array of enhanced PR objects
 * @param {Object} options - Display options
 */
function displayMyPRs(prs, options = {}) {
    const { showLoadMore = false, totalAvailable = 0 } = options;
    const prsContainer = document.getElementById('my-prs-content');
    const prStatus = getCurrentPRStatus();
    
    // Cache the PRs data separately for open vs closed
    if (prStatus === 'closed') {
        window.cachedClosedPRs = prs;
    } else {
        window.cachedOpenPRs = prs;
    }
    
    if (!prsContainer) {
        console.error('❌ My PRs container not found: my-prs-content');
        return;
    }
    
    if (prs.length === 0) {
        showPlaceholderState('my-prs-content', 
            `No ${prStatus} PRs found`, 
            prStatus === 'open' ? '📝' : '✅');
        return;
    }
    
    // Generate PR cards using shared component
    const prsHtml = generatePRCardsHTML(prs, {
        clickableTitle: false,
        showLinkIcon: true,
        showMoreInfo: true,
        initiallyExpanded: false,
        clickHandler: 'selectMyPRForJiraLookup(this)',
        currentUser: appState.apiTokens.githubUsername
    });
    
    // Add "Load More" button for closed PRs if needed
    let loadMoreHtml = '';
    if (showLoadMore) {
        const remaining = totalAvailable - prs.length;
        const nextBatch = Math.min(remaining, CLOSED_PRS_PER_PAGE);
        
        loadMoreHtml = `
            <div class="load-more-container">
                <button id="load-more-btn" class="load-more-btn" onclick="loadMoreMyPRs()">
                    <span class="load-more-text">Load ${nextBatch} more PRs (${remaining} remaining)</span>
                    <div class="load-more-spinner" style="display: none;">
                        <div class="spinner"></div>
                        <span>Loading...</span>
                    </div>
                </button>
            </div>
        `;
    }
    
    prsContainer.innerHTML = `
        <div class="prs-list">
            <div class="prs-items">
                ${prsHtml}
            </div>
            ${loadMoreHtml}
        </div>
    `;
    
    // Create refresh callback for this specific PR status
    const createRefreshCallback = () => {
        return async () => {
            console.log(`🔄 Manual refresh triggered for My PRs (${prStatus})`);
            
            // Clear the JIRA content panel
            const jiraContent = document.getElementById('my-prs-jira-content');
            if (jiraContent) {
                jiraContent.innerHTML = '<div class="placeholder">Associated JIRAs will be loaded here...</div>';
            }
            
            // Remove active state from all PRs
            document.querySelectorAll('.github-pr-item').forEach(pr => pr.classList.remove('active'));
            
            await loadMyPRs(false, true); // forceRefresh = true
        };
    };
    
    // Update column title with timestamp and refresh button
    const timestamp = (prStatus === 'closed') ? 
        window.myPrsClosedLastLoadTime : 
        window.myPrsOpenLastLoadTime;
        
    console.log(`🕒 displayMyPRs for ${prStatus} PRs - Using timestamp: ${timestamp ? new Date(timestamp).toLocaleTimeString() : 'undefined'}`);
    console.log(`🕒 Available timestamps - Open: ${window.myPrsOpenLastLoadTime ? new Date(window.myPrsOpenLastLoadTime).toLocaleTimeString() : 'undefined'}, Closed: ${window.myPrsClosedLastLoadTime ? new Date(window.myPrsClosedLastLoadTime).toLocaleTimeString() : 'undefined'}`);
    
    // Update column title with timestamp and refresh button
    updateColumnTitleWithTimestamp('#my-prs-column .column-title', 'My PRs', timestamp, createRefreshCallback());
    
    // Make click handler available globally
    window.selectMyPRForJiraLookup = function(element) {
        // Remove active state from other PRs
        document.querySelectorAll('.github-pr-item').forEach(pr => pr.classList.remove('active'));
        
        // Add active state to clicked PR
        element.classList.add('active');
        
        // Extract PR info from data attributes (more reliable than parsing text)
        const repoName = element.getAttribute('data-repo-name');
        const prNumber = element.getAttribute('data-pr-number');
        
        if (prNumber && repoName) {
            console.log(`🔍 Selected My PR #${prNumber} from ${repoName} for JIRA lookup`);
            loadAssociatedJIRAsForMyPR(repoName, prNumber);
        } else {
            console.error('❌ Could not extract PR info from element:', { repoName, prNumber });
        }
    };
    
    // Make load more function available globally
    window.loadMoreMyPRs = function() {
        loadMyPRs(true); // true = load more
    };
    
    console.log(`✅ Displayed ${prs.length} My PRs${showLoadMore ? ' with Load More button' : ''}`);
}

/**
 * Update the Load More button state
 * @param {boolean} loading - Whether to show loading state
 * @param {string} errorMessage - Error message to display (optional)
 */
function updateLoadMoreButton(loading, errorMessage = '') {
    const loadMoreBtn = document.getElementById('load-more-btn');
    const loadMoreText = document.querySelector('.load-more-text');
    const loadMoreSpinner = document.querySelector('.load-more-spinner');
    
    if (!loadMoreBtn) return;
    
    if (loading) {
        // Show loading state
        loadMoreBtn.disabled = true;
        loadMoreText.style.display = 'none';
        loadMoreSpinner.style.display = 'flex';
    } else if (errorMessage) {
        // Show error state
        loadMoreBtn.disabled = false;
        loadMoreText.style.display = 'block';
        loadMoreSpinner.style.display = 'none';
        loadMoreText.textContent = errorMessage + ' - Click to retry';
        loadMoreBtn.classList.add('error');
    } else {
        // Show normal state
        loadMoreBtn.disabled = false;
        loadMoreText.style.display = 'block';
        loadMoreSpinner.style.display = 'none';
        loadMoreBtn.classList.remove('error');
    }
}

/**
 * Load associated JIRA tickets for a selected My PR
 * @param {string} repoName - Repository name
 * @param {string} prNumber - PR number
 */
async function loadAssociatedJIRAsForMyPR(repoName, prNumber) {
    const jiraContainer = document.getElementById('my-prs-jira-content');
    
    if (!jiraContainer) {
        console.error('❌ My PRs JIRA container not found: my-prs-jira-content');
        return;
    }
    
    // Show loading state
    jiraContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <span>Loading associated JIRAs...</span>
        </div>
    `;
    
    try {
        console.log(`🔍 Looking for JIRA associations in PR #${prNumber}`);
        
        // Get PR details to extract JIRA IDs from title and body
        const prResponse = await fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}`, {
            headers: {
                'Authorization': `token ${appState.apiTokens.github}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'OCMUI-Team-Dashboard'
            }
        });
        
        if (!prResponse.ok) {
            throw new Error(`Failed to fetch PR details: ${prResponse.status}`);
        }
        
        const prData = await prResponse.json();
        
        // Extract JIRA IDs from PR title and body
        const jiraIds = extractJIRAIds(prData.title, prData.body);
        
        if (jiraIds.length === 0) {
            jiraContainer.innerHTML = '<div class="placeholder">No JIRA associations found in this PR</div>';
            return;
        }
        
        console.log(`📝 Found JIRA IDs: ${jiraIds.join(', ')}`);
        
        // Load all JIRA details
        const jiraResults = await loadAllJIRADetails(jiraIds, repoName, prNumber);
        
        // Display loaded JIRAs
        displayLoadedJIRAsForMyPR(jiraResults, repoName, prNumber);
        
    } catch (error) {
        console.error('❌ Error loading associated JIRAs:', error);
        showErrorState('my-prs-jira-content', 'Failed to load JIRAs', error.message);
    }
}

/**
 * Extract JIRA ticket IDs from PR title and body
 * @param {string} title - PR title
 * @param {string} body - PR body/description
 * @returns {Array<string>} Array of unique JIRA IDs
 */
function extractJIRAIds(title, body) {
    const text = `${title || ''} ${body || ''}`;
    const jiraIds = new Set();
    
    // Use specific JIRA prefixes from app state (same approach as reviews.js)
    const prefixes = appState.jiraPrefixes || ['OCMUI-', 'OCM-', 'XCMSTRAT-'];
    
    prefixes.forEach(prefix => {
        // Match pattern: PREFIX-NUMBER (e.g., OCMUI-1234)
        const regex = new RegExp(`${prefix.replace('-', '\\-')}(\\d+)`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
            matches.forEach(match => {
                const jiraId = match.toUpperCase();
                // Additional filter to exclude unwanted patterns
                if (!jiraId.includes('CLAUDE')) {
                    jiraIds.add(jiraId);
                }
            });
        }
    });
    
    return Array.from(jiraIds);
}

/**
 * Load all JIRA details automatically using Promise.all
 * @param {Array<string>} jiraIds - Array of JIRA IDs
 * @param {string} repo - Repository name  
 * @param {string} prNumber - PR number
 * @returns {Promise<Array>} Array of JIRA results
 */
async function loadAllJIRADetails(jiraIds, repo, prNumber) {
    console.log(`🔄 Loading ${jiraIds.length} JIRA tickets: ${jiraIds.join(', ')}`);
    
    // Fetch all JIRAs in parallel
    const jiraPromises = jiraIds.map(jiraId => fetchJIRATicket(jiraId));
    const results = await Promise.all(jiraPromises);
    
    // Filter successful results
    const successfulJIRAs = results.filter(result => result && result.success);
    const failedJIRAs = results.filter(result => result && !result.success);
    
    if (failedJIRAs.length > 0) {
        console.warn(`⚠️ ${failedJIRAs.length} JIRA(s) failed to load:`, failedJIRAs.map(f => f.jiraId));
    }
    
    console.log(`✅ Successfully loaded ${successfulJIRAs.length}/${jiraIds.length} JIRA tickets`);
    
    return successfulJIRAs;
}

/**
 * Fetch a single JIRA ticket
 * @param {string} jiraId - JIRA ticket ID
 * @returns {Promise<Object|null>} JIRA ticket data or null if failed
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
            console.warn(`⚠️ JIRA API returned failure for ${jiraId}:`, result.message || 'Unknown error');
            return {
                success: false,
                jiraId,
                error: result.message || 'Unknown error'
            };
        }
        
    } catch (error) {
        console.warn(`⚠️ Error fetching JIRA ${jiraId}:`, error);
        return {
            success: false,
            jiraId,
            error: error.message
        };
    }
}

/**
 * Display loaded JIRA tickets for My PR
 * @param {Array} jiraResults - Array of JIRA result objects
 * @param {string} repo - Repository name
 * @param {string} prNumber - PR number
 */
function displayLoadedJIRAsForMyPR(jiraResults, repo, prNumber) {
    const jiraContainer = document.getElementById('my-prs-jira-content');
    
    if (!jiraContainer) {
        console.error('❌ My PRs JIRA container not found: my-prs-jira-content');
        return;
    }
    
    if (jiraResults.length === 0) {
        jiraContainer.innerHTML = '<div class="placeholder">No JIRA tickets could be loaded</div>';
        return;
    }
    
    // Generate JIRA cards using shared component with collapsible sections
    const jiraHtml = generateJiraCardsFromResults(jiraResults, {
        collapsible: true,
        wrapInSection: true,
        initiallyExpanded: false,
        toggleFunction: 'toggleJiraMoreInfo'
    });
    
    jiraContainer.innerHTML = `
        <div class="associated-jiras">
            <div class="jira-tickets">
                ${jiraHtml}
            </div>
        </div>
    `;
    
    console.log(`✅ Displayed ${jiraResults.length} JIRA tickets for My PR #${prNumber}`);
    
    // Note: toggleJiraMoreInfo function is already available globally from reviews.js or jira.js
}

// Make activation function globally available for two-level navigation
if (typeof window !== 'undefined') {
    window.onMyPrsTabActivated = onMyPrsTabActivated;
}
