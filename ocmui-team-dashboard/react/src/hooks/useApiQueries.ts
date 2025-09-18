import { useQuery } from '@tanstack/react-query';
import { useSettings } from '../contexts/SettingsContext';

// Query keys for different data types
export const queryKeys = {
  mySprintJiras: ['jira', 'sprint-tickets'] as const,
  jiraTicket: (jiraId: string) => ['jira', 'ticket', jiraId] as const,
  myCodeReviews: ['github', 'code-reviews'] as const,
  myPRs: (status: 'open' | 'closed') => ['github', 'my-prs', status] as const,
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

interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
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
  return {
    success: true,
    pullRequests: data.items || [],
    total: data.total_count || 0
  };
};

const fetchMyPRs = async (githubUsername: string, githubToken: string, status: 'open' | 'closed'): Promise<MyPRsResponse> => {
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
  return {
    success: true,
    pullRequests: data.items || [],
    total: data.total_count || 0
  };
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

  return useQuery({
    queryKey: queryKeys.myCodeReviews,
    queryFn: () => fetchMyCodeReviews(apiTokens.githubUsername, apiTokens.github),
    enabled: isConfigured && !!apiTokens.githubUsername && !!apiTokens.github,
    refetchInterval: 2 * 60 * 1000, // Every 2 minutes
  });
};

export const useMyPRs = (status: 'open' | 'closed' = 'open') => {
  const { apiTokens, isConfigured } = useSettings();

  return useQuery({
    queryKey: queryKeys.myPRs(status),
    queryFn: () => fetchMyPRs(apiTokens.githubUsername, apiTokens.github, status),
    enabled: isConfigured && !!apiTokens.githubUsername && !!apiTokens.github,
    refetchInterval: 4 * 60 * 1000, // Every 4 minutes
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
