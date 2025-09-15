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
import { showErrorState, showPlaceholderState, showNotification, switchTab, initializeMyPrsSplitPanes } from '../utils/ui.js';
import { parseJiraMarkdown, getBadgeClass } from '../utils/formatting.js';
import { generatePRCardsHTML } from '../utils/prCard.js';
import { generateJiraCardsFromResults } from '../utils/jiraCard.js';

// Global state for My PRs tab
let currentAbortController = null;
let loadedPRs = [];
let currentPage = 1;
const CLOSED_PRS_PER_PAGE = 5;

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
    
    // Set up tab activation handler
    const myPrsTab = document.querySelector('[data-tab="my-prs"]');
    if (myPrsTab) {
        myPrsTab.addEventListener('click', onMyPrsTabActivated);
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
                
                // Cancel any ongoing API calls
                if (currentAbortController) {
                    currentAbortController.abort();
                    console.log('🚫 Cancelled previous API call');
                }
                
                // Reset pagination state
                loadedPRs = [];
                currentPage = 1;
                
                // Load PRs with new filter
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
    const myPrsTab = document.querySelector('[data-tab="my-prs"]');
    
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
    
    // Optionally disable tab (but allow navigation away to cancel)
    if (myPrsTab) {
        if (loading) {
            myPrsTab.style.opacity = '0.7';
        } else {
            myPrsTab.style.opacity = '1';
        }
    }
}

/**
 * Load PRs authored by the current user
 * @param {boolean} loadMore - Whether this is a "load more" request
 */
async function loadMyPRs(loadMore = false) {
    const prsContainer = document.getElementById('my-prs-content');
    const username = appState.apiTokens.githubUsername;
    const githubToken = appState.apiTokens.github;
    const prStatus = getCurrentPRStatus();
    
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
            showErrorState('my-prs-content', 'Failed to load PRs', error.message);
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
            
            // Fetch PR details and reviews first
            const [prResponse, reviewsResponse] = await Promise.all([
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
                })
            ]);
            
            if (!prResponse.ok || !reviewsResponse.ok) {
                console.warn(`⚠️ Failed to fetch details for PR #${prNumber}: ${prResponse.status}/${reviewsResponse.status}`);
                continue;
            }
            
            const prDetails = await prResponse.json();
            const reviews = await reviewsResponse.json();
            
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
    
    if (!prsContainer) {
        console.error('❌ My PRs container not found');
        return;
    }
    
    if (prs.length === 0) {
        const prStatus = getCurrentPRStatus();
        showPlaceholderState('my-prs-content', 
            `No ${prStatus} PRs found`, 
            prStatus === 'open' ? '📝' : '✅');
        return;
    }
    
    // Generate PR cards using shared component
    const prsHtml = generatePRCardsHTML(prs, {
        clickableTitle: false,
        showLinkIcon: true,
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
    
    // Make click handler available globally
    window.selectMyPRForJiraLookup = function(element) {
        // Remove active state from other PRs
        document.querySelectorAll('.github-pr-item').forEach(pr => pr.classList.remove('active'));
        
        // Add active state to clicked PR
        element.classList.add('active');
        
        // Extract PR info from the element
        const titleElement = element.querySelector('.github-pr-title-text');
        const prTitle = titleElement ? titleElement.textContent : '';
        const prNumber = prTitle.match(/#(\d+)/)?.[1] || '';
        
        if (prNumber) {
            console.log(`🔍 Selected My PR #${prNumber} for JIRA lookup`);
            
            // Find the PR data
            const selectedPR = prs.find(pr => pr.number.toString() === prNumber);
            if (selectedPR) {
                loadAssociatedJIRAsForMyPR(selectedPR.repoName, prNumber);
            }
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
        console.error('❌ My PRs JIRA container not found');
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
    
    // Match JIRA ticket patterns (case-insensitive)
    const jiraPattern = /\b([A-Z]+-\d+)\b/gi;
    const matches = text.match(jiraPattern) || [];
    
    // Remove duplicates and return
    const jiraIds = [...new Set(matches.map(match => match.toUpperCase()))];
    
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
        console.error('❌ My PRs JIRA container not found');
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
