/**
 * GitHub Integration Module
 * 
 * Handles GitHub PR fetching, processing, and display functionality.
 * Provides comprehensive GitHub API integration for pull request
 * management and review tracking.
 */

import { appState } from '../core/appState.js';
import { generatePRCardsHTML } from '../utils/prCard.js';

/**
 * Fetch and display GitHub PRs related to a JIRA ticket
 * @param {string} jiraId - The JIRA ticket ID to search PRs for
 */
export async function fetchAndDisplayGitHubPRs(jiraId) {
    console.log('🐙 Fetching GitHub PRs for JIRA:', jiraId);
    
    const githubContent = document.getElementById('github-content');
    if (!githubContent) return;
    
    // Check if GitHub token is configured
    if (!appState.apiTokens.github || !appState.apiTokens.githubUsername) {
        githubContent.innerHTML = '<div class="placeholder">Configure GitHub token in Settings to view related PRs</div>';
        return;
    }
    
    try {
        githubContent.innerHTML = '<div class="loading">🔍 Searching for related PRs...</div>';
        
        // Search for PRs mentioning the JIRA ID
        const searchResults = await searchGithubPRs(jiraId);
        
        if (searchResults.length === 0) {
            githubContent.innerHTML = '<div class="placeholder">No related PRs found</div>';
            return;
        }
        
        // Fetch detailed information for each PR
        const detailedPRs = await fetchDetailedPRInfo(searchResults, jiraId);
        
        // Display PRs with full details
        displayGitHubPRsWithDetails(detailedPRs, jiraId);
        
    } catch (error) {
        console.error('❌ GitHub PR fetch error:', error);
        githubContent.innerHTML = `<div class="error">Error loading GitHub PRs: ${error.message}</div>`;
    }
}

/**
 * Search GitHub for PRs mentioning a JIRA ID
 * @param {string} jiraId - The JIRA ticket ID to search for
 * @returns {Promise<Array>} Array of PR search results
 */
async function searchGithubPRs(jiraId) {
    const searchQuery = `${jiraId} type:pr`;
    const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc`;
    
    const response = await fetch(searchUrl, {
        headers: {
            'Authorization': `Bearer ${appState.apiTokens.github}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`GitHub search failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items || [];
}

/**
 * Fetch detailed information for GitHub PRs
 * @param {Array} prs - Array of basic PR objects from search
 * @param {string} jiraId - The related JIRA ticket ID
 * @returns {Promise<Array>} Array of PRs with detailed information
 */
async function fetchDetailedPRInfo(prs, jiraId) {
    console.log('🔍 Fetching detailed PR info for', prs.length, 'PRs');
    
    const detailedPromises = prs.map(async (pr) => {
        try {
            // Get detailed PR information
            const prResponse = await fetch(pr.pull_request.url, {
                headers: {
                    'Authorization': `Bearer ${appState.apiTokens.github}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (prResponse.ok) {
                pr.prDetails = await prResponse.json();
            }
            
            // Get PR reviews
            const reviewsResponse = await fetch(`${pr.pull_request.url}/reviews`, {
                headers: {
                    'Authorization': `Bearer ${appState.apiTokens.github}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (reviewsResponse.ok) {
                pr.reviews = await reviewsResponse.json();
            }
            
            // Get check runs for the latest commit
            if (pr.prDetails && pr.prDetails.head && pr.prDetails.head.sha) {
                const headSha = pr.prDetails.head.sha;
                console.log(`🔍 [GitHub tab] Fetching check runs for PR #${pr.number} using head SHA: ${headSha}`);
                
                const checksResponse = await fetch(
                    `https://api.github.com/repos/${pr.prDetails.base.repo.full_name}/commits/${headSha}/check-runs`,
                    {
                        headers: {
                            'Authorization': `Bearer ${appState.apiTokens.github}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (checksResponse.ok) {
                    const checksData = await checksResponse.json();
                    pr.checkRuns = checksData.check_runs || [];
                    console.log(`✅ [GitHub tab] Fetched ${pr.checkRuns.length} check runs for PR #${pr.number}`);
                } else {
                    console.warn(`⚠️ [GitHub tab] Check runs API returned ${checksResponse.status} for PR #${pr.number}`);
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
 * Display GitHub PRs with detailed information
 * @param {Array} prs - Array of detailed PR objects
 * @param {string} jiraId - The related JIRA ticket ID
 */
function displayGitHubPRsWithDetails(prs, jiraId) {
    console.log('📊 Displaying', prs.length, 'PRs with details');
    
    const githubContent = document.getElementById('github-content');
    if (!githubContent) return;
    
    if (!prs || prs.length === 0) {
        githubContent.innerHTML = '<div class="placeholder">No related PRs found</div>';
        return;
    }
    
    // Generate PR cards using shared component with clickable titles
    const prsHtml = generatePRCardsHTML(prs, {
        clickableTitle: true,
        showLinkIcon: false,
        currentUser: appState.apiTokens.githubUsername
    });
    
    githubContent.innerHTML = `<div class="github-prs-container">${prsHtml}</div>`;
}


