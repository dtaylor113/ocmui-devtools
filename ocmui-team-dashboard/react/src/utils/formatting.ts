import { marked } from 'marked';
import { WikiMarkupTransformer } from '@atlaskit/editor-wikimarkup-transformer';

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
 * Parse JIRA wiki markup to HTML using official Atlassian library
 * Uses @atlaskit/editor-wikimarkup-transformer for proper JIRA formatting
 * @param jiraText - Raw JIRA wiki markup text
 * @returns HTML string
 */
export function parseJiraMarkdown(jiraText: string): string {
  if (!jiraText) return '';
  
  try {
    // Use official Atlassian WikiMarkupTransformer
    const transformer = new WikiMarkupTransformer();
    
    // Transform wiki markup to ADF (Atlassian Document Format)
    const adfDocument = transformer.parse(jiraText);
    
    // Convert ADF to HTML
    return convertAdfToHtml(adfDocument);
    
  } catch (error) {
    console.error('❌ JIRA wiki markup parsing error:', error);
    console.error('Falling back to basic JIRA parsing');
    // Fallback to basic parsing if official library fails
    return parseBasicJiraMarkdown(jiraText);
  }
}

/**
 * Convert ADF (Atlassian Document Format) to HTML
 * @param adfNode - ADF document node
 * @returns HTML string
 */
function convertAdfToHtml(adfNode: any): string {
  // Simple ADF to HTML conversion
  // This is a basic implementation - could be enhanced with more ADF node types
  let html = '';
  
  if (adfNode.type.name === 'doc') {
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        html += convertAdfToHtml(adfNode.content.child(i));
      }
    }
  } else if (adfNode.type.name === 'paragraph') {
    let content = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        content += convertAdfToHtml(adfNode.content.child(i));
      }
    }
    html += `<p>${content}</p>`;
  } else if (adfNode.type.name === 'text') {
    let text = adfNode.text || '';
    
    // Apply text marks (bold, italic, etc.)
    if (adfNode.marks) {
      adfNode.marks.forEach((mark: any) => {
        switch (mark.type.name) {
          case 'strong':
            text = `<strong>${text}</strong>`;
            break;
          case 'em':
            text = `<em>${text}</em>`;
            break;
          case 'code':
            text = `<code>${text}</code>`;
            break;
          case 'strike':
            text = `<del>${text}</del>`;
            break;
          case 'underline':
            text = `<u>${text}</u>`;
            break;
          case 'textColor':
            const color = mark.attrs?.color;
            if (color) {
              text = `<span style="color: ${color}">${text}</span>`;
            }
            break;
          case 'link':
            const href = mark.attrs?.href;
            if (href) {
              text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            }
            break;
        }
      });
    }
    html += text;
  } else if (adfNode.type.name === 'bulletList') {
    let items = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        items += convertAdfToHtml(adfNode.content.child(i));
      }
    }
    html += `<ul>${items}</ul>`;
  } else if (adfNode.type.name === 'orderedList') {
    let items = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        items += convertAdfToHtml(adfNode.content.child(i));
      }
    }
    html += `<ol>${items}</ol>`;
  } else if (adfNode.type.name === 'listItem') {
    let content = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        content += convertAdfToHtml(adfNode.content.child(i));
      }
    }
    html += `<li>${content}</li>`;
  } else if (adfNode.type.name === 'heading') {
    const level = adfNode.attrs?.level || 1;
    let content = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        content += convertAdfToHtml(adfNode.content.child(i));
      }
    }
    html += `<h${level}>${content}</h${level}>`;
  } else if (adfNode.type.name === 'codeBlock') {
    const language = adfNode.attrs?.language || '';
    let code = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        code += adfNode.content.child(i).text || '';
      }
    }
    html += `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
  } else if (adfNode.type.name === 'blockquote') {
    let content = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        content += convertAdfToHtml(adfNode.content.child(i));
      }
    }
    html += `<blockquote>${content}</blockquote>`;
  } else {
    // For unhandled node types, try to process children
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        html += convertAdfToHtml(adfNode.content.child(i));
      }
    }
  }
  
  return html;
}

/**
 * Fallback JIRA parser for when official library fails
 * @param jiraText - Raw JIRA wiki markup text
 * @returns HTML string
 */
function parseBasicJiraMarkdown(jiraText: string): string {
  if (!jiraText) return '';
  
  let html = jiraText;
  
  // Basic JIRA formatting (minimal implementation as fallback)
  
  // Headers: h1. text, h2. text, etc.
  html = html.replace(/^h([1-6])\.\s*(.+)$/gm, '<h$1>$2</h$1>');
  
  // Color formatting: {color:#hex}text{color}
  html = html.replace(/\{color:(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|[a-zA-Z]+)\}([^{]*?)\{color\}/g, 
    '<span style="color: $1">$2</span>');
  
  // Bold: *text*
  html = html.replace(/(^|[^*])\*([^*\r\n]+?)\*([^*]|$)/g, '$1<strong>$2</strong>$3');
  
  // Italic: _text_
  html = html.replace(/(^|[^_])_([^_\r\n]+?)_([^_]|$)/g, '$1<em>$2</em>$3');
  
  // Code: {{text}}
  html = html.replace(/\{\{([^}]+?)\}\}/g, '<code>$1</code>');
  
  // Links: [text|url]
  html = html.replace(/\[([^|\]]*?)\|([^\]]+?)\]/g, 
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Simple lists (basic implementation)
  html = html.replace(/^[\s"]*#\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^[\s"]*[\*\-]\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive list items
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // Line breaks to paragraphs
  html = html.replace(/\n\s*\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  
  // Clean up
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/\{[^}]*\}/g, ''); // Remove remaining JIRA tags
  
  return html;
}

/**
 * Escape HTML special characters
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}