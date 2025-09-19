import { marked } from 'marked';
import { WikiMarkupTransformer } from '@atlaskit/editor-wikimarkup-transformer';

/**
 * Cache an image and return the local URL
 * @param imageUrl - Original image URL
 * @param type - 'github' or 'jira'
 * @param token - API token if needed
 * @returns Promise<string> - Local image URL or fallback
 */
async function cacheImage(imageUrl: string, type: 'github' | 'jira', token?: string): Promise<string | null> {
  try {
    const endpoint = type === 'github' ? '/api/cache-github-image' : '/api/cache-jira-image';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        imageUrl,
        ...(token && { token })
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Image cached successfully: ${imageUrl} -> ${result.localUrl}`);
        return result.localUrl;
      }
    }
    
    console.warn(`⚠️ Image caching failed for: ${imageUrl}, falling back to clickable link`);
    return null; // Will trigger fallback
  } catch (error) {
    console.warn(`⚠️ Image caching error for: ${imageUrl}`, error);
    return null; // Will trigger fallback
  }
}

/**
 * Process images in HTML - cache them and replace URLs
 * @param html - HTML content
 * @param type - 'github' or 'jira'
 * @param token - API token if needed
 * @returns Promise<string> - Updated HTML with local image URLs or fallbacks
 */
async function processImagesWithCaching(html: string, type: 'github' | 'jira', token?: string): Promise<string> {
  const imageRegex = /<img\s+[^>]*src="([^"]*)"[^>]*\/?>/gi;
  const images: Array<{ match: string, src: string, index: number }> = [];
  let match;
  
  // Find all images
  while ((match = imageRegex.exec(html)) !== null) {
    images.push({
      match: match[0],
      src: match[1],
      index: match.index
    });
  }
  
  // Process images in reverse order to maintain indices
  for (const image of images.reverse()) {
    try {
      // Skip if already processed or is a data URL
      if (image.src.startsWith('/images/') || image.src.startsWith('data:')) {
        continue;
      }
      
      console.log(`🖼️ Processing ${type} image: ${image.src}`);
      
      // Try to cache the image
      const localUrl = await cacheImage(image.src, type, token);
      
      if (localUrl) {
        // Replace with local URL
        const newImg = image.match.replace(image.src, localUrl);
        html = html.substring(0, image.index) + newImg + html.substring(image.index + image.match.length);
        console.log(`✅ Replaced with cached image: ${localUrl}`);
      } else {
        // Fallback to clickable link
        const filename = image.src.split('/').pop() || 'Image';
        const altMatch = image.match.match(/alt="([^"]*)"/);
        const altText = altMatch ? altMatch[1] : filename;
        const linkText = type === 'github' ? '🖼️' : '📎';
        
        const fallbackLink = `<a href="${image.src}" target="_blank" rel="noopener noreferrer" class="github-image-link">${linkText} ${altText}</a>`;
        html = html.substring(0, image.index) + fallbackLink + html.substring(image.index + image.match.length);
        console.log(`🔗 Replaced with clickable link: ${altText}`);
      }
    } catch (error) {
      console.error(`❌ Error processing image: ${image.src}`, error);
    }
  }
  
  return html;
}

/**
 * Parse GitHub markdown to HTML with image caching
 * Uses the marked library to convert GitHub Flavored Markdown to HTML
 * Same configuration as plain JS app for consistency
 * @param markdown - Raw markdown text
 * @param token - GitHub token for authenticated requests
 * @returns Promise<string> - HTML string with cached images
 */
export async function parseGitHubMarkdown(markdown: string, token?: string): Promise<string> {
  if (!markdown) return '';
  
  console.log('📝 parseGitHubMarkdown called with:', {
    length: markdown.length,
    hasImages: /!\[[^\]]*\]\([^)]+\)|<img[^>]+>/i.test(markdown),
    preview: markdown.substring(0, 200) + (markdown.length > 200 ? '...' : '')
  });
  
  try {
    // Configure marked for GitHub Flavored Markdown (same as plain JS app)
    marked.setOptions({
      breaks: true,          // Convert line breaks to <br>
      gfm: true,            // GitHub Flavored Markdown
      sanitize: false,      // Don't sanitize HTML (we trust GitHub content)
      smartLists: true,     // Better list handling
      smartypants: false    // Don't convert quotes/dashes
    });
    
    let html = marked(markdown) as string;
    
    console.log('📄 marked() output:', {
      length: html.length,
      hasImgTags: /<img[^>]+>/i.test(html),
      preview: html.substring(0, 300) + (html.length > 300 ? '...' : '')
    });
    
    // Process images with caching system
    html = await processImagesWithCaching(html, 'github', token);
    
    console.log('📄 Final GitHub markdown HTML:', {
      length: html.length,
      hasCachedImages: /\/images\/github\//.test(html),
      preview: html.substring(0, 300) + (html.length > 300 ? '...' : '')
    });
    
    return html;
  } catch (error) {
    console.error('❌ GitHub markdown parsing error:', error);
    return parseBasicMarkdown(markdown);
  }
}

/**
 * Synchronous version for backwards compatibility
 * @deprecated Use parseGitHubMarkdown (async) instead
 */
export function parseGitHubMarkdownSync(markdown: string): string {
  if (!markdown) return '';
  
  try {
    marked.setOptions({
      breaks: true,
      gfm: true,
      sanitize: false,
      smartLists: true,
      smartypants: false
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
  
  // EXPERIMENT: Images - let user-attachments display directly (JWT will expire!)
  // html = html.replace(/!\[([^\]]*)\]\(([^)]*user-attachments\/assets\/[^)]*)\)/gim, (_, alt, src) => {
  //   return `<a href="${src}" target="_blank" rel="noopener noreferrer" class="github-image-link">🖼️ ${alt || 'Image'}</a>`;
  // });
  console.log('🧪 EXPERIMENT: Basic markdown also letting user-attachments display directly!');
  
  // Other images - convert to use proxy endpoint
  html = html.replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, (_, alt, src) => {
    const proxyUrl = `/api/github-image-proxy?imageUrl=${encodeURIComponent(src)}&token=GITHUB_TOKEN_PLACEHOLDER`;
    return `<img src="${proxyUrl}" alt="${alt}" loading="lazy" />`;
  });
  
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
 * @param jiraKey - Optional JIRA ticket key for constructing image links
 * @param attachments - Optional attachment mapping for proper image URLs
 * @returns HTML string
 */
export async function parseJiraMarkdown(jiraText: string, jiraKey?: string, attachments?: Record<string, any>, token?: string): Promise<string> {
  if (!jiraText) return '';
  
  // Check for potential images in the content
  const hasImageSyntax = /!([^!]+)(!|\|)/.test(jiraText);
  if (hasImageSyntax) {
    console.log('🖼️ JIRA content appears to contain images, processing...');
  }
  
  try {
    // Use official Atlassian WikiMarkupTransformer
    const transformer = new WikiMarkupTransformer();
    
    // Transform wiki markup to ADF (Atlassian Document Format)
    const adfDocument = transformer.parse(jiraText);
    
    // Convert ADF to HTML with image caching
    const result = await convertAdfToHtml(adfDocument, jiraKey, attachments, token);
    
    if (hasImageSyntax && result.includes('<img')) {
      console.log('✅ Successfully processed JIRA images via ADF converter');
    } else if (hasImageSyntax) {
      console.log('⚠️ JIRA content had image syntax but no <img> tags generated - may need fallback parsing');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ JIRA wiki markup parsing error:', error);
    console.error('Falling back to basic JIRA parsing');
    // Fallback to basic parsing if official library fails
    return await parseBasicJiraMarkdown(jiraText, jiraKey, attachments, token);
  }
}


/**
 * Convert ADF (Atlassian Document Format) to HTML
 * @param adfNode - ADF document node
 * @param jiraKey - Optional JIRA ticket key for constructing image links
 * @param attachments - Optional attachment mapping for proper image URLs
 * @returns HTML string
 */
async function convertAdfToHtml(adfNode: any, jiraKey?: string, attachments?: Record<string, any>, token?: string): Promise<string> {
  // Simple ADF to HTML conversion
  // This is a basic implementation - could be enhanced with more ADF node types
  let html = '';
  
  if (adfNode.type.name === 'doc') {
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        html += await convertAdfToHtml(adfNode.content.child(i), jiraKey, attachments, token);
      }
    }
  } else if (adfNode.type.name === 'paragraph') {
    let content = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        content += await convertAdfToHtml(adfNode.content.child(i), jiraKey, attachments, token);
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
        items += await convertAdfToHtml(adfNode.content.child(i), jiraKey, attachments, token);
      }
    }
    html += `<ul>${items}</ul>`;
  } else if (adfNode.type.name === 'orderedList') {
    let items = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        items += await convertAdfToHtml(adfNode.content.child(i), jiraKey, attachments, token);
      }
    }
    html += `<ol>${items}</ol>`;
  } else if (adfNode.type.name === 'listItem') {
    let content = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        content += await convertAdfToHtml(adfNode.content.child(i), jiraKey, attachments, token);
      }
    }
    html += `<li>${content}</li>`;
  } else if (adfNode.type.name === 'heading') {
    const level = adfNode.attrs?.level || 1;
    let content = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        content += await convertAdfToHtml(adfNode.content.child(i), jiraKey, attachments, token);
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
        content += await convertAdfToHtml(adfNode.content.child(i), jiraKey, attachments, token);
      }
    }
    html += `<blockquote>${content}</blockquote>`;
  } else if (adfNode.type.name === 'mediaSingle') {
    // JIRA image container
    let mediaContent = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        mediaContent += await convertAdfToHtml(adfNode.content.child(i), jiraKey, attachments, token);
      }
    }
    const layout = adfNode.attrs?.layout || 'center';
    html += `<div class="jira-image-container jira-image-${layout}">${mediaContent}</div>`;
  } else if (adfNode.type.name === 'media') {
    // JIRA image/media node - use image caching system
    const attrs = adfNode.attrs || {};
    const imageUrl = attrs.url || attrs.id || '';
    const alt = attrs.alt || 'Image';
    const filename = imageUrl.split('/').pop() || alt || 'Image';
    
    console.log('🖼️ Processing ADF media node:', { imageUrl, attrs, jiraKey, hasAttachments: !!attachments });
    
    let finalImageUrl = null;
    
    // Check if we have a proper attachment URL for this filename
    if (attachments && filename && attachments[filename]) {
      const attachment = attachments[filename];
      finalImageUrl = attachment.url || attachment.thumbnail;  // Full-size first
      console.log(`📎 Found attachment mapping: ${filename} -> ${finalImageUrl}`);
    } else if (imageUrl && imageUrl.startsWith('http')) {
      finalImageUrl = imageUrl;
      console.log(`🖼️ Using direct URL: ${imageUrl}`);
    }
    
    if (finalImageUrl) {
      try {
        // Try to cache the image
        const localUrl = await cacheImage(finalImageUrl, 'jira', token);
        if (localUrl) {
          html += `<img src="${localUrl}" alt="${filename}" loading="lazy" class="jira-image" />`;
          console.log(`✅ Cached JIRA image: ${filename} -> ${localUrl}`);
        } else {
          // Fallback to clickable link if caching fails
          html += `<a href="${finalImageUrl}" target="_blank" rel="noopener noreferrer" class="github-image-link">📎 ${filename}</a>`;
          console.log(`🔗 Fallback to direct link: ${filename}`);
        }
      } catch (error) {
        console.error(`❌ Error processing JIRA image: ${filename}`, error);
        html += `<a href="${finalImageUrl}" target="_blank" rel="noopener noreferrer" class="github-image-link">📎 ${filename}</a>`;
      }
    } else if (jiraKey) {
      // Fallback - link to the JIRA ticket where user can see the image
      const jiraUrl = `https://issues.redhat.com/browse/${jiraKey}`;
      console.log(`🔗 Fallback to JIRA link: ${filename} -> ${jiraUrl}`);
      html += `<a href="${jiraUrl}" target="_blank" rel="noopener noreferrer" class="github-image-link">📎 ${filename} (see in JIRA)</a>`;
    } else {
      console.warn('⚠️ JIRA media node missing attachment mapping and no jiraKey provided:', attrs);
      const filename = imageUrl || alt || 'Image';
      html += `<span class="github-image-link">📎 ${filename}</span>`;
    }
  } else {
    // For unhandled node types, try to process children
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        html += convertAdfToHtml(adfNode.content.child(i), jiraKey, attachments);
      }
    }
  }
  
  return html;
}

/**
 * Sync version of parseBasicJiraMarkdown for backwards compatibility
 */
function parseBasicJiraMarkdownSync(jiraText: string, jiraKey?: string, attachments?: Record<string, any>): string {
  if (!jiraText) return '';
  
  let html = jiraText;
  
  // Convert line breaks to <br>
  html = html.replace(/\n/g, '<br>');
  
  // Bold text: *bold*
  html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
  // Italic text: _italic_
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Code: {{code}}
  html = html.replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>');
  
  // Links: [text|url]
  html = html.replace(/\[([^|]+)\|([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Simple image handling for sync version - just create links
  html = html.replace(/!([^!]+?)(?:\|([^!]*?))?!/g, (_, imageName) => {
    const filename = imageName.split('/').pop() || imageName || 'Image';
    if (attachments && filename && attachments[filename]) {
      const attachment = attachments[filename];
      const actualImageUrl = attachment.url || attachment.thumbnail;
      return `<img src="${actualImageUrl}" alt="${filename}" loading="lazy" class="jira-image" />`;
    } else if (imageName.startsWith('http')) {
      return `<img src="${imageName}" alt="${filename}" loading="lazy" class="jira-image" />`;
    } else if (jiraKey) {
      const jiraUrl = `https://issues.redhat.com/browse/${jiraKey}`;
      return `<a href="${jiraUrl}" target="_blank" rel="noopener noreferrer" class="github-image-link">📎 ${filename} (see in JIRA)</a>`;
    } else {
      return `<span class="github-image-link">📎 ${filename}</span>`;
    }
  });
  
  return html;
}

/**
 * Async Fallback JIRA parser for when official library fails with image caching
 * @param jiraText - Raw JIRA wiki markup text
 * @param jiraKey - Optional JIRA ticket key for constructing image links
 * @param attachments - Optional attachment mapping for proper image URLs
 * @param token - JIRA token for authenticated requests
 * @returns Promise<string> - HTML string with cached images
 */
async function parseBasicJiraMarkdown(jiraText: string, jiraKey?: string, attachments?: Record<string, any>, token?: string): Promise<string> {
  if (!jiraText) return '';
  
  let html = jiraText;
  
  // Convert line breaks to <br>
  html = html.replace(/\n/g, '<br>');
  
  // Bold text: *bold*
  html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
  // Italic text: _italic_
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Code: {{code}}
  html = html.replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>');
  
  // Links: [text|url]
  html = html.replace(/\[([^|]+)\|([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Process images with caching - need to collect all matches first
  const imageRegex = /!([^!]+?)(?:\|([^!]*?))?!/g;
  const imageMatches: Array<{ match: string, imageName: string, index: number }> = [];
  let match;
  
  while ((match = imageRegex.exec(html)) !== null) {
    imageMatches.push({
      match: match[0],
      imageName: match[1],
      index: match.index
    });
  }
  
  // Process images in reverse order to maintain indices
  for (const imageMatch of imageMatches.reverse()) {
    const { match: fullMatch, imageName, index } = imageMatch;
    const filename = imageName.split('/').pop() || imageName || 'Image';
    
    let finalImageUrl = null;
    
    // Check if we have attachment mapping
    if (attachments && filename && attachments[filename]) {
      const attachment = attachments[filename];
      finalImageUrl = attachment.url || attachment.thumbnail;
      console.log(`📎 Found attachment mapping: ${filename} -> ${finalImageUrl}`);
    } else if (imageName.startsWith('http')) {
      finalImageUrl = imageName;
      console.log(`🖼️ Using direct URL: ${imageName}`);
    }
    
    let replacement = '';
    
    if (finalImageUrl) {
      try {
        // Try to cache the image
        const localUrl = await cacheImage(finalImageUrl, 'jira', token);
        if (localUrl) {
          replacement = `<img src="${localUrl}" alt="${filename}" loading="lazy" class="jira-image" />`;
          console.log(`✅ Cached JIRA image: ${filename} -> ${localUrl}`);
        } else {
          // Fallback to clickable link if caching fails
          replacement = `<a href="${finalImageUrl}" target="_blank" rel="noopener noreferrer" class="github-image-link">📎 ${filename}</a>`;
          console.log(`🔗 Fallback to direct link: ${filename}`);
        }
      } catch (error) {
        console.error(`❌ Error processing JIRA image: ${filename}`, error);
        replacement = `<a href="${finalImageUrl}" target="_blank" rel="noopener noreferrer" class="github-image-link">📎 ${filename}</a>`;
      }
    } else if (jiraKey) {
      // Fallback to JIRA ticket link
      const jiraUrl = `https://issues.redhat.com/browse/${jiraKey}`;
      replacement = `<a href="${jiraUrl}" target="_blank" rel="noopener noreferrer" class="github-image-link">📎 ${filename} (see in JIRA)</a>`;
      console.log(`🔗 Fallback to JIRA link: ${filename} -> ${jiraUrl}`);
    } else {
      replacement = `<span class="github-image-link">📎 ${filename}</span>`;
    }
    
    // Replace the match at the specific index
    html = html.substring(0, index) + replacement + html.substring(index + fullMatch.length);
  }
  
  return html;
}

/**
 * Synchronous version of convertAdfToHtml for backwards compatibility
 */
function convertAdfToHtmlSync(adfNode: any, jiraKey?: string, attachments?: Record<string, any>): string {
  let html = '';
  
  if (adfNode.type?.name === 'doc') {
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        html += convertAdfToHtmlSync(adfNode.content.child(i), jiraKey, attachments);
      }
    }
  } else if (adfNode.type?.name === 'paragraph') {
    let content = '';
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        content += convertAdfToHtmlSync(adfNode.content.child(i), jiraKey, attachments);
      }
    }
    html += `<p>${content}</p>`;
  } else if (adfNode.type?.name === 'text') {
    let text = adfNode.text || '';
    
    if (adfNode.marks) {
      adfNode.marks.forEach((mark: any) => {
        switch (mark.type?.name) {
          case 'strong':
            text = `<strong>${text}</strong>`;
            break;
          case 'em':
            text = `<em>${text}</em>`;
            break;
          case 'code':
            text = `<code>${text}</code>`;
            break;
        }
      });
    }
    html += text;
  } else if (adfNode.type?.name === 'media') {
    // For sync version, just create simple links or images
    const attrs = adfNode.attrs || {};
    const imageUrl = attrs.url || attrs.id || '';
    const alt = attrs.alt || 'Image';
    const filename = imageUrl.split('/').pop() || alt || 'Image';
    
    if (attachments && filename && attachments[filename]) {
      const attachment = attachments[filename];
      const actualImageUrl = attachment.url || attachment.thumbnail;
      html += `<img src="${actualImageUrl}" alt="${filename}" loading="lazy" class="jira-image" />`;
    } else if (imageUrl && imageUrl.startsWith('http')) {
      html += `<img src="${imageUrl}" alt="${filename}" loading="lazy" class="jira-image" />`;
    } else if (jiraKey) {
      const jiraUrl = `https://issues.redhat.com/browse/${jiraKey}`;
      html += `<a href="${jiraUrl}" target="_blank" rel="noopener noreferrer" class="github-image-link">📎 ${filename} (see in JIRA)</a>`;
    } else {
      html += `<span class="github-image-link">📎 ${filename}</span>`;
    }
  } else {
    // For unhandled node types, try to process children
    if (adfNode.content) {
      for (let i = 0; i < adfNode.content.childCount; i++) {
        html += convertAdfToHtmlSync(adfNode.content.child(i), jiraKey, attachments);
      }
    }
  }
  
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

/**
 * GitHub Comment interface matching API response
 */
export interface GitHubComment {
  id: number | string; // Can be number or string like "review-123"
  user: {
    login: string;
    avatar_url?: string;
  };
  body: string;
  created_at: string;
  updated_at?: string;
  submitted_at?: string; // For reviews
  comment_type?: 'general' | 'review' | 'inline'; // Type of comment for enhanced display
  state?: string; // For review comments (approved, changes_requested, etc.)
  path?: string; // For inline comments - file path
  line?: number; // For inline comments - line number
}

/**
 * Sort and prepare GitHub comments for display
 * Based on plain JS app implementation
 * @param comments - Array of GitHub comment objects
 * @returns Sorted array of comments
 */
export function prepareGitHubComments(comments: GitHubComment[]): GitHubComment[] {
  if (!comments || comments.length === 0) {
    return [];
  }
  
  // Sort comments by creation date (most recent first)
  return [...comments].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Inject GitHub tokens into proxy URLs for image authentication
 * @param html - HTML string with token placeholders
 * @param githubToken - GitHub token for API access
 * @returns HTML string with actual tokens
 */
export function injectTokens(html: string, githubToken?: string): string {
  if (!html) return '';
  
  let result = html;
  
  // Replace GitHub token placeholder
  if (githubToken) {
    const beforeReplace = result;
    result = result.replace(/GITHUB_TOKEN_PLACEHOLDER/g, encodeURIComponent(githubToken));
    if (beforeReplace !== result) {
      console.log('✅ GitHub token injected successfully');
    }
  } else {
    // Remove token parameter if no token available (some images might still work)
    const beforeReplace = result;
    result = result.replace(/&token=GITHUB_TOKEN_PLACEHOLDER/g, '');
    if (beforeReplace !== result) {
      console.log('🔄 GitHub token placeholder removed (no token available)');
    }
  }
  
  return result;
}

/**
 * Synchronous version of parseJiraMarkdown for JIRA components (keeps the working direct image display)
 */
export function parseJiraMarkdownSync(jiraText: string, jiraKey?: string, attachments?: Record<string, any>): string {
  if (!jiraText) return '';
  
  const transformer = new WikiMarkupTransformer();
  
  try {
    const adfDocument = transformer.parse(jiraText);
    return convertAdfToHtmlSync(adfDocument, jiraKey, attachments);
  } catch (error) {
    console.warn('🔄 ADF parsing failed, falling back to basic JIRA markdown:', error);
    return parseBasicJiraMarkdownSync(jiraText, jiraKey, attachments);
  }
}

/**
 * GitHub-specific async markdown parser with smart image handling
 */
export async function parseGitHubMarkdownWithCaching(markdown: string, token?: string): Promise<string> {
  if (!markdown) return '';
  
  try {
    // Use marked for GitHub-flavored markdown
    marked.setOptions({
      breaks: true,
      gfm: true,
      sanitize: false,
      smartLists: true,
      smartypants: false
    });
    
    let html = marked(markdown) as string;
    
    // Smart GitHub image processing
    html = await processGitHubImagesSmartly(html, token);
    
    return html;
  } catch (error) {
    console.error('❌ GitHub markdown parsing error:', error);
    return parseBasicMarkdown(markdown);
  }
}

/**
 * Smart GitHub image processor that handles different types of GitHub images differently
 */
async function processGitHubImagesSmartly(html: string, token?: string): Promise<string> {
  const imageRegex = /<img\s+[^>]*src="([^"]*)"[^>]*\/?>/gi;
  const images: Array<{ match: string, src: string, index: number }> = [];
  let match;
  
  while ((match = imageRegex.exec(html)) !== null) {
    images.push({ match: match[0], src: match[1], index: match.index });
  }
  
  // Process images in reverse order to maintain indices
  for (const image of images.reverse()) {
    try {
      if (image.src.startsWith('/images/') || image.src.startsWith('data:')) {
        continue; // Skip already processed images
      }
      
      console.log(`🔍 Processing GitHub image: ${image.src}`);
      
      // Identify image type and handle accordingly
      if (image.src.includes('user-attachments/assets')) {
        // Placeholder URLs - convert to clickable links
        const filename = image.src.split('/').pop() || 'Image';
        const altMatch = image.match.match(/alt="([^"]*)"/);
        const altText = altMatch ? altMatch[1] : filename;
        const fallbackLink = `<a href="${image.src}" target="_blank" rel="noopener noreferrer" class="github-image-link">🖼️ ${altText}</a>`;
        html = html.substring(0, image.index) + fallbackLink + html.substring(image.index + image.match.length);
        console.log(`🔗 Converted placeholder URL to link: ${altText}`);
      } else if (image.src.includes('avatars.githubusercontent.com') || 
                 image.src.includes('github.com') ||
                 image.src.includes('githubusercontent.com')) {
        // Real GitHub images - try caching
        const localUrl = await cacheImage(image.src, 'github', token);
        if (localUrl) {
          const newImg = image.match.replace(image.src, localUrl);
          html = html.substring(0, image.index) + newImg + html.substring(image.index + image.match.length);
          console.log(`✅ Cached GitHub image: ${localUrl}`);
        } else {
          // Caching failed - fallback to clickable link
          const filename = image.src.split('/').pop() || 'Image';
          const altMatch = image.match.match(/alt="([^"]*)"/);
          const altText = altMatch ? altMatch[1] : filename;
          const fallbackLink = `<a href="${image.src}" target="_blank" rel="noopener noreferrer" class="github-image-link">🖼️ ${altText}</a>`;
          html = html.substring(0, image.index) + fallbackLink + html.substring(image.index + image.match.length);
          console.log(`🔗 Caching failed, fallback to link: ${altText}`);
        }
      } else {
        // Other images - attempt caching
        const localUrl = await cacheImage(image.src, 'github', token);
        if (localUrl) {
          const newImg = image.match.replace(image.src, localUrl);
          html = html.substring(0, image.index) + newImg + html.substring(image.index + image.match.length);
          console.log(`✅ Cached external image: ${localUrl}`);
        } else {
          // Keep original image tag for external images that fail caching
          console.log(`⚠️ Keeping original external image: ${image.src}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing image: ${image.src}`, error);
    }
  }
  
  return html;
}