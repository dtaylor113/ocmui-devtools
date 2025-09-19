import { marked } from 'marked';

/**
 * Parse GitHub markdown to HTML
 * Uses the marked library to convert GitHub Flavored Markdown to HTML
 * @param markdown - Raw markdown text
 * @returns HTML string
 */
export function parseGitHubMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  try {
    // Configure marked for GitHub Flavored Markdown (same as old JS app)
    marked.setOptions({
      breaks: true,          // Convert line breaks to <br>
      gfm: true,            // GitHub Flavored Markdown
      sanitize: false,      // Don't sanitize HTML (we trust GitHub content)
      smartLists: true,     // Better list handling
      smartypants: false    // Don't convert quotes/dashes
    });
    
    return marked(markdown) as string;
  } catch (error) {
    console.error('❌ GitHub markdown parsing error:', error);
    return parseBasicMarkdown(markdown);
  }
}

/**
 * Basic markdown parser as fallback when marked library fails
 * @param markdown - Raw markdown text
 * @returns HTML string
 */
function parseBasicMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```([^`]*)```/gim, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]*)`/gim, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Line breaks
  html = html.replace(/\n/gim, '<br>');
  
  return html;
}

/**
 * Parse JIRA markdown/text formatting
 * Basic parser for JIRA text formatting (for future use)
 * @param jiraText - Raw JIRA text
 * @returns HTML string
 */
export function parseJiraMarkdown(jiraText: string): string {
  if (!jiraText) return '';
  
  let html = jiraText;
  
  // JIRA bold: *text*
  html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
  // JIRA italic: _text_
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // JIRA monospace: {{text}}
  html = html.replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>');
  
  // JIRA links: [text|url]
  html = html.replace(/\[([^|]*)\|([^\]]*)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
}
