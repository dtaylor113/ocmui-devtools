import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../contexts/SettingsContext';
import type { GitHubComment } from '../utils/formatting';

// Query keys for different data types
export const queryKeys = {
  mySprintJiras: ['jira', 'sprint-tickets'] as const,
  jiraTicket: (jiraId: string) => ['jira', 'ticket', jiraId] as const,
  myCodeReviews: ['github', 'code-reviews'] as const,
  myPRs: (status: 'open' | 'closed') => ['github', 'my-prs', status] as const,
  prConversation: (repoName: string, prNumber: number) => ['github', 'pr-conversation', repoName, prNumber] as const,
};

// Types for our API responses
interface JiraTicket {
  key: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  reporter: string;
  type: string;
  created: string;
  updated: string;
  sprint?: string;
}

export interface GitHubReviewer {
  username: string;
  state: 'approved' | 'changes_requested' | 'commented' | 'review_requested' | 'dismissed';
  hasComments: boolean;
  date?: string;
  isCurrentUser?: boolean;
}

interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  html_url: string;  // Web page URL for GitHub PR
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head?: {
    ref: string;
  };
  base?: {
    ref: string;
  };
  // Enhanced data from detailed PR fetch
  reviewers?: GitHubReviewer[];
  repository_url?: string;
}

interface SprintJirasResponse {
  success: boolean;
  tickets: JiraTicket[];
  total: number;
  sprintName?: string;
  jqlQuery: string;
}

interface CodeReviewsResponse {
  success: boolean;
  pullRequests: GitHubPR[];
  total: number;
}

interface MyPRsResponse {
  success: boolean;
  pullRequests: GitHubPR[];
  total: number;
}

interface PRConversationResponse {
  description: string;
  comments: GitHubComment[];
}

// API fetch functions
const fetchSprintJiras = async (jiraUsername: string, jiraToken: string): Promise<SprintJirasResponse> => {
  const response = await fetch('http://localhost:3017/api/jira-sprint-tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jiraUsername,
      token: jiraToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sprint JIRAs: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

const fetchJiraTicket = async (jiraId: string, jiraToken: string) => {
  const response = await fetch('http://localhost:3017/api/jira-ticket', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jiraId,
      token: jiraToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch JIRA ticket: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

const fetchMyCodeReviews = async (githubUsername: string, githubToken: string): Promise<CodeReviewsResponse> => {
  console.log(`🔍 fetchMyCodeReviews starting for user: ${githubUsername}`);
  
  // GitHub search for PRs where user is requested as reviewer
  const query = `is:pr is:open review-requested:${githubUsername}`;
  const response = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc`, {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch code reviews: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const basePRs = data.items || [];
  
  console.log(`📋 fetchMyCodeReviews found ${basePRs.length} PRs, enhancing first ${Math.min(basePRs.length, 10)}...`);
  
  // Enhance PRs with reviewer data (limit to first 10 for performance)
  const enhancedPRs = await enhancePRsWithReviewers(basePRs.slice(0, 10), githubToken, githubUsername);
  
  console.log(`✅ fetchMyCodeReviews completed, returning ${enhancedPRs.length} enhanced PRs`);
  
  return {
    success: true,
    pullRequests: enhancedPRs,
    total: data.total_count || 0
  };
};

const fetchMyPRs = async (githubUsername: string, githubToken: string, status: 'open' | 'closed'): Promise<MyPRsResponse> => {
  console.log(`🔍 fetchMyPRs starting for user: ${githubUsername}, status: ${status}`);
  
  // GitHub search for user's own PRs
  const query = `is:pr author:${githubUsername} is:${status}`;
  const response = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc`, {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch my PRs: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const basePRs = data.items || [];
  
  console.log(`📋 fetchMyPRs found ${basePRs.length} ${status} PRs, enhancing first ${Math.min(basePRs.length, 10)}...`);
  
  // Enhance PRs with reviewer data (limit to first 10 for performance)
  const enhancedPRs = await enhancePRsWithReviewers(basePRs.slice(0, 10), githubToken, githubUsername);
  
  console.log(`✅ fetchMyPRs completed, returning ${enhancedPRs.length} enhanced PRs`);
  
  return {
    success: true,
    pullRequests: enhancedPRs,
    total: data.total_count || 0
  };
};

// Function to fetch detailed PR information including reviewers and comments
const fetchPRDetails = async (repoUrl: string, prNumber: number, githubToken: string, currentUser: string): Promise<GitHubReviewer[]> => {
  // Extract owner/repo from GitHub API URL
  // URLs are in format: https://api.github.com/repos/owner/repo/issues/123
  const repoMatch = repoUrl.match(/github\.com\/repos\/([^/]+)\/([^/]+)/);
  if (!repoMatch) {
    throw new Error(`Invalid repository URL: ${repoUrl}`);
  }
  
  const [, owner, repo] = repoMatch;
  const repoName = `${owner}/${repo}`;

  const headers = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github.v3+json'
  };

  // Debug: Log PR processing
  // console.log(`🚀 Starting fetchPRDetails for PR #${prNumber}`);

  try {
    // Fetch reviews, comments, and PR details in parallel (same as old JS app)
    const [reviewsResponse, commentsResponse, prDetailsResponse] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}/reviews`, { headers }),
      fetch(`https://api.github.com/repos/${repoName}/issues/${prNumber}/comments`, { headers }),
      fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}`, { headers })
    ]);
    
    // Debug: Log API response status
    // console.log(`📞 API Responses for PR #${prNumber}:`, {...});

    if (!reviewsResponse.ok || !commentsResponse.ok || !prDetailsResponse.ok) {
      throw new Error(`Failed to fetch PR details: reviews=${reviewsResponse.status}, comments=${commentsResponse.status}, prDetails=${prDetailsResponse.status}`);
    }

    const [reviews, generalComments, prDetails] = await Promise.all([
      reviewsResponse.json(),
      commentsResponse.json(),
      prDetailsResponse.json()
    ]);

    // Debug: Log fetched data
    // console.log(`📊 PR #${prNumber} data:`, {...});

    // Process reviewers (based on processReviewers from old JS app)
    const reviewerMap = new Map<string, GitHubReviewer>();
    const reviewerComments = new Map<string, any[]>();
    
    // First, process requested reviewers (those who haven't reviewed yet)
    const requestedReviewers = prDetails?.requested_reviewers || [];
    requestedReviewers.forEach((reviewer: any) => {
      if (reviewer?.login) {
        reviewerMap.set(reviewer.login, {
          username: reviewer.login,
          state: 'review_requested',
          hasComments: false,
          date: undefined,
          isCurrentUser: reviewer.login === currentUser
        });
      }
    });

    // Helper function to map GitHub API review states to our interface
    const mapReviewState = (apiState: string): GitHubReviewer['state'] => {
      switch (apiState.toUpperCase()) {
        case 'APPROVED': return 'approved';
        case 'CHANGES_REQUESTED': return 'changes_requested';
        case 'COMMENTED': return 'commented';
        case 'DISMISSED': return 'dismissed';
        default: 
          console.warn(`Unknown review state from GitHub API: ${apiState}`);
          return 'commented'; // Default fallback
      }
    };

    // Process completed reviews
    reviews.forEach((review: any) => {
      const reviewer = review.user?.login;
      if (!reviewer) return;

      const hasCommentBody = review.body && review.body.trim().length > 0;
      const mappedState = mapReviewState(review.state);
      
      // Track review comments for this reviewer
      if (hasCommentBody) {
        if (!reviewerComments.has(reviewer)) {
          reviewerComments.set(reviewer, []);
        }
        reviewerComments.get(reviewer)!.push({
          body: review.body,
          submitted_at: review.submitted_at,
          state: review.state,
          type: 'review'
        });
      }

      // Track reviewer state (latest review wins)
      reviewerMap.set(reviewer, {
        username: reviewer,
        state: mappedState,
        hasComments: hasCommentBody,
        date: review.submitted_at,
        isCurrentUser: reviewer === currentUser
      });
    });

    // Process general PR comments
    generalComments.forEach((comment: any) => {
      const commenter = comment.user?.login;
      if (!commenter) return;

      // Track general comments for this user
      if (!reviewerComments.has(commenter)) {
        reviewerComments.set(commenter, []);
      }
      reviewerComments.get(commenter)!.push({
        body: comment.body,
        submitted_at: comment.created_at,
        state: 'commented',
        type: 'comment'
      });

      // If this user isn't already tracked as a reviewer, add them as a commenter
      if (!reviewerMap.has(commenter)) {
        reviewerMap.set(commenter, {
          username: commenter,
          state: 'commented',
          hasComments: true,
          date: comment.created_at,
          isCurrentUser: commenter === currentUser
        });
      } else {
        // Update hasComments flag for existing reviewers
        const existing = reviewerMap.get(commenter)!;
        existing.hasComments = true;
        reviewerMap.set(commenter, existing);
      }
    });

    // Update hasComments flag for all reviewers who have comments
    reviewerComments.forEach((_, reviewer) => {
      if (reviewerMap.has(reviewer)) {
        const existing = reviewerMap.get(reviewer)!;
        existing.hasComments = true;
        reviewerMap.set(reviewer, existing);
      }
    });

    // Sort reviewers to put current user first
    const sortedReviewers = Array.from(reviewerMap.values()).sort((a, b) => {
      if (currentUser) {
        if (a.isCurrentUser) return -1;
        if (b.isCurrentUser) return 1;
      }
      return a.username.localeCompare(b.username);
    });

    // Debug: Processed reviewers are now working correctly
    return sortedReviewers;
    
  } catch (error) {
    console.error('Error fetching PR details:', error);
    return []; // Return empty array on error
  }
};

// Function to enhance PRs with reviewer data
export const enhancePRsWithReviewers = async (prs: GitHubPR[], githubToken: string, currentUser: string): Promise<GitHubPR[]> => {
  console.log(`🚀 enhancePRsWithReviewers starting with ${prs.length} PRs for user: ${currentUser}`);
  
  if (prs.length === 0) {
    console.log(`⚠️ No PRs to enhance, returning empty array`);
    return [];
  }
  
  const enhanced = await Promise.all(
    prs.map(async (pr, index) => {
      try {
        const url = pr.repository_url || pr.url;
        console.log(`🔄 Processing PR ${index + 1}/${prs.length}: #${pr.number} (${pr.title?.substring(0, 50)}...)`);
        const reviewers = await fetchPRDetails(url, pr.number, githubToken, currentUser);
        console.log(`✅ Enhanced PR #${pr.number} with ${reviewers.length} reviewers`);
        return { ...pr, reviewers };
      } catch (error) {
        console.error(`❌ Failed to fetch reviewers for PR #${pr.number}:`, error);
        return { ...pr, reviewers: [] };
      }
    })
  );
  
  console.log(`🎯 enhancePRsWithReviewers completed: ${enhanced.length} PRs enhanced`);
  
  return enhanced;
};

const fetchPRConversation = async (repoName: string, prNumber: number, githubToken: string): Promise<PRConversationResponse> => {
  console.log(`🔍 fetchPRConversation starting for ${repoName}#${prNumber}`);
  
  const headers = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'OCMUI-Team-Dashboard'
  };
  
  try {
    // Fetch ALL comment types: PR details, reviews, general comments, and inline review comments
    const [prResponse, reviewsResponse, commentsResponse, reviewCommentsResponse] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}`, { headers }),
      fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}/reviews`, { headers }), // ✅ ADDED: PR reviews
      fetch(`https://api.github.com/repos/${repoName}/issues/${prNumber}/comments`, { headers }),
      fetch(`https://api.github.com/repos/${repoName}/pulls/${prNumber}/comments`, { headers }) // Inline review comments
    ]);
    
    if (!prResponse.ok || !reviewsResponse.ok || !commentsResponse.ok || !reviewCommentsResponse.ok) {
      throw new Error(`Failed to fetch PR conversation: ${prResponse.status}/${reviewsResponse.status}/${commentsResponse.status}/${reviewCommentsResponse.status}`);
    }
    
    const prData = await prResponse.json();
    const reviews = await reviewsResponse.json();
    const generalComments = await commentsResponse.json();
    const reviewComments = await reviewCommentsResponse.json();
    
    // Combine ALL comment types: reviews, general comments, and inline review comments
    const allComments = [
      // 1. PR Reviews (high-level review comments like "Changes requested", "Approved")
      ...reviews
        .filter((review: any) => review.body && review.body.trim()) // Only reviews with actual content
        .map((review: any) => ({
          ...review,
          comment_type: 'review',
          created_at: review.submitted_at, // Reviews use submitted_at instead of created_at
          body: `**${review.state.toUpperCase()} Review by @${review.user?.login}**\n\n${review.body}`,
          user: review.user,
          id: `review-${review.id}` // Prefix to avoid ID conflicts
        })),
      
      // 2. General PR comments (main conversation thread)
      ...generalComments.map((comment: any) => ({
        ...comment,
        comment_type: 'general',
        body: `**@${comment.user?.login}** commented:\n\n${comment.body}`
      })),
      
      // 3. Inline review comments (specific code line comments)
      ...reviewComments.map((comment: any) => ({
        ...comment,
        comment_type: 'inline',
        // Enhanced context for inline comments
        body: `**@${comment.user?.login}** commented on code:\n\n${comment.body}` + 
              (comment.path ? `\n\n*📄 File: \`${comment.path}\`${comment.line ? ` (Line ${comment.line})` : ''}*` : '')
      }))
    ];
    
    // Sort ALL comments chronologically by creation/submission date
    allComments.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.submitted_at).getTime();
      const dateB = new Date(b.created_at || b.submitted_at).getTime();
      return dateA - dateB; // Oldest first for chronological conversation flow
    });
    
    console.log(`✅ fetchPRConversation completed for ${repoName}#${prNumber}: ${prData.body?.length || 0} chars description, ${allComments?.length || 0} total comments (${reviews.filter((r: any) => r.body?.trim()).length} reviews + ${generalComments?.length || 0} general + ${reviewComments?.length || 0} inline)`);
    
    return {
      description: prData.body || '',
      comments: allComments || []
    };
    
  } catch (error) {
    console.error(`❌ Error fetching PR conversation for ${repoName}#${prNumber}:`, error);
    throw error;
  }
};

// Custom hooks for each query
export const useMySprintJiras = () => {
  const { apiTokens, isConfigured } = useSettings();

  return useQuery({
    queryKey: queryKeys.mySprintJiras,
    queryFn: () => fetchSprintJiras(apiTokens.jiraUsername, apiTokens.jira),
    enabled: isConfigured && !!apiTokens.jiraUsername && !!apiTokens.jira,
    refetchInterval: 5 * 60 * 1000, // Every 5 minutes
  });
};

export const useJiraTicket = (jiraId: string) => {
  const { apiTokens } = useSettings();

  return useQuery({
    queryKey: queryKeys.jiraTicket(jiraId),
    queryFn: () => fetchJiraTicket(jiraId, apiTokens.jira),
    enabled: !!jiraId && !!apiTokens.jira,
    staleTime: 2 * 60 * 1000, // 2 minutes for individual tickets
  });
};

export const useMyCodeReviews = () => {
  const { apiTokens, isConfigured } = useSettings();
  
  console.log(`🔍 useMyCodeReviews hook called:`, {
    isConfigured,
    hasGithubUsername: !!apiTokens.githubUsername,
    hasGithubToken: !!apiTokens.github,
    githubUsername: apiTokens.githubUsername,
    enabled: isConfigured && !!apiTokens.githubUsername && !!apiTokens.github
  });

  return useQuery({
    queryKey: queryKeys.myCodeReviews,
    queryFn: () => fetchMyCodeReviews(apiTokens.githubUsername, apiTokens.github),
    enabled: isConfigured && !!apiTokens.githubUsername && !!apiTokens.github,
    refetchInterval: 2 * 60 * 1000, // Every 2 minutes
  });
};

export const useMyPRs = (status: 'open' | 'closed' = 'open') => {
  const { apiTokens, isConfigured } = useSettings();
  
  console.log(`🔍 useMyPRs hook called:`, {
    status,
    isConfigured,
    hasGithubUsername: !!apiTokens.githubUsername,
    hasGithubToken: !!apiTokens.github,
    githubUsername: apiTokens.githubUsername,
    enabled: isConfigured && !!apiTokens.githubUsername && !!apiTokens.github
  });

  return useQuery({
    queryKey: queryKeys.myPRs(status),
    queryFn: () => fetchMyPRs(apiTokens.githubUsername, apiTokens.github, status),
    enabled: isConfigured && !!apiTokens.githubUsername && !!apiTokens.github,
    refetchInterval: 4 * 60 * 1000, // Every 4 minutes
  });
};

export const usePRConversation = (repoName: string, prNumber: number) => {
  const { apiTokens } = useSettings();
  
  console.log(`🔍 usePRConversation hook called:`, {
    repoName,
    prNumber,
    hasGithubToken: !!apiTokens.github,
    enabled: !!repoName && !!prNumber && !!apiTokens.github
  });

  return useQuery({
    queryKey: queryKeys.prConversation(repoName, prNumber),
    queryFn: () => fetchPRConversation(repoName, prNumber, apiTokens.github),
    enabled: !!repoName && !!prNumber && !!apiTokens.github,
    staleTime: 5 * 60 * 1000, // 5 minutes for PR conversation data
  });
};

// Helper hook to format last updated timestamp
export const useLastUpdatedFormat = (dataUpdatedAt?: number) => {
  if (!dataUpdatedAt) return 'Never';

  const now = Date.now();
  const diffMs = now - dataUpdatedAt;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(dataUpdatedAt).toLocaleDateString();
};
