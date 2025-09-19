const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const PORT = 3017;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// CORS middleware for API routes
app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// JIRA ticket fetch endpoint
app.post('/api/jira-ticket', async (req, res) => {
    const { jiraId, token } = req.body;
    
    if (!jiraId || !token) {
        return res.status(400).json({ error: 'JIRA ID and token are required' });
    }
    
    try {
        const options = {
            hostname: 'issues.redhat.com',
            path: `/rest/api/2/issue/${jiraId}?expand=changelog,comment,attachment`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'OCMUI-Team-Dashboard'
            }
        };
        
        const jiraRequest = https.request(options, (jiraRes) => {
            let data = '';
            
            jiraRes.on('data', (chunk) => {
                data += chunk;
            });
            
            jiraRes.on('end', () => {
                if (jiraRes.statusCode === 200) {
                    try {
                        const ticketData = JSON.parse(data);
                        
                        // Parse comments
                        const comments = [];
                        if (ticketData.fields.comment && ticketData.fields.comment.comments) {
                            ticketData.fields.comment.comments.forEach(comment => {
                                comments.push({
                                    author: comment.author ? comment.author.displayName : 'Unknown',
                                    body: comment.body || '',
                                    created: comment.created
                                });
                            });
                        }
                        
                        // Parse attachments to get proper JIRA image URLs
                        const attachments = {};
                        if (ticketData.fields.attachment && Array.isArray(ticketData.fields.attachment)) {
                            ticketData.fields.attachment.forEach(attachment => {
                                // Map filename to proper JIRA URL
                                if (attachment.filename && attachment.content) {
                                    attachments[attachment.filename] = {
                                        url: attachment.content,
                                        thumbnail: attachment.thumbnail || attachment.content,
                                        filename: attachment.filename,
                                        mimeType: attachment.mimeType,
                                        size: attachment.size
                                    };
                                    console.log(`📎 Found attachment: ${attachment.filename} -> ${attachment.content}`);
                                }
                            });
                        }
                        
                        res.json({
                            success: true,
                            ticket: {
                                key: ticketData.key,
                                summary: ticketData.fields.summary,
                                description: ticketData.fields.description || '',
                                status: ticketData.fields.status.name,
                                type: ticketData.fields.issuetype.name,
                                priority: ticketData.fields.priority ? ticketData.fields.priority.name : 'Normal',
                                assignee: ticketData.fields.assignee ? ticketData.fields.assignee.displayName : null,
                                reporter: ticketData.fields.reporter ? ticketData.fields.reporter.displayName : 'Unknown',
                                created: ticketData.fields.created,
                                comments: comments,
                                attachments: attachments // Include attachment URL mapping
                            }
                        });
                    } catch (parseError) {
                        res.status(500).json({ 
                            error: 'Failed to parse JIRA response',
                            details: parseError.message 
                        });
                    }
                } else if (jiraRes.statusCode === 404) {
                    res.status(404).json({ 
                        error: `JIRA ticket ${jiraId} not found`
                    });
                } else {
                    res.status(jiraRes.statusCode).json({ 
                        error: `JIRA API error: ${jiraRes.statusCode}`,
                        details: data 
                    });
                }
            });
        });
        
        jiraRequest.on('error', (error) => {
            console.error('JIRA request error:', error);
            res.status(500).json({ 
                error: 'Network error connecting to JIRA',
                details: error.message 
            });
        });
        
        jiraRequest.end();
        
    } catch (error) {
        console.error('JIRA ticket fetch error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// JIRA API proxy endpoint
app.post('/api/test-jira', async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }
    
    try {
        // Use node's https module to make the request
        const options = {
            hostname: 'issues.redhat.com',
            path: '/rest/api/2/myself',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'OCMUI-Team-Dashboard'
            }
        };
        
        const jiraRequest = https.request(options, (jiraRes) => {
            let data = '';
            
            jiraRes.on('data', (chunk) => {
                data += chunk;
            });
            
            jiraRes.on('end', () => {
                if (jiraRes.statusCode === 200) {
                    try {
                        const userData = JSON.parse(data);
                        res.json({
                            success: true,
                            user: {
                                displayName: userData.displayName || userData.name,
                                emailAddress: userData.emailAddress
                            }
                        });
                    } catch (parseError) {
                        res.status(500).json({ 
                            error: 'Failed to parse JIRA response',
                            details: parseError.message 
                        });
                    }
                } else {
                    res.status(jiraRes.statusCode).json({ 
                        error: `JIRA API error: ${jiraRes.statusCode}`,
                        details: data 
                    });
                }
            });
        });
        
        jiraRequest.on('error', (error) => {
            console.error('JIRA request error:', error);
            res.status(500).json({ 
                error: 'Network error connecting to JIRA',
                details: error.message 
            });
        });
        
        jiraRequest.end();
        
    } catch (error) {
        console.error('JIRA test error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// JIRA sprint tickets endpoint
app.post('/api/jira-sprint-tickets', async (req, res) => {
    const { jiraUsername, token } = req.body;
    
    if (!jiraUsername || !token) {
        return res.status(400).json({ error: 'JIRA username and token are required' });
    }
    
    try {
        // Construct JQL query for tickets assigned to user in open sprints
        const jqlQuery = `assignee = "${jiraUsername}" AND Sprint in openSprints()`;
        const encodedJql = encodeURIComponent(jqlQuery);
        
        // Request up to 100 tickets, sorted by priority and updated date
        const apiPath = `/rest/api/2/search?jql=${encodedJql}&maxResults=100&fields=key,summary,description,status,priority,assignee,reporter,created,updated,issuetype,sprint&expand=changelog`;
        
        const options = {
            hostname: 'issues.redhat.com',
            path: apiPath,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'OCMUI-Team-Dashboard'
            }
        };
        
        console.log(`🎯 Fetching sprint JIRAs for ${jiraUsername} with JQL: ${jqlQuery}`);
        
        const jiraRequest = https.request(options, (jiraRes) => {
            let data = '';
            
            jiraRes.on('data', (chunk) => {
                data += chunk;
            });
            
            jiraRes.on('end', () => {
                if (jiraRes.statusCode === 200) {
                    try {
                        const searchResult = JSON.parse(data);
                        
                        // Transform JIRA tickets to simplified format
                        // Collect sprint names to determine the most common active sprint
                        const sprintNames = new Set();
                        let activeSprintName = null;
                        
                        const tickets = searchResult.issues.map(issue => {
                            // Extract sprint information from the fields
                            let sprintName = 'No Sprint';
                            let sprintObj = null;
                            
                            if (issue.fields.sprint && Array.isArray(issue.fields.sprint)) {
                                // Get the most recent/active sprint
                                const activeSprint = issue.fields.sprint.find(sprint => 
                                    sprint && sprint.state === 'active'
                                ) || issue.fields.sprint[issue.fields.sprint.length - 1];
                                
                                if (activeSprint && activeSprint.name) {
                                    sprintName = activeSprint.name;
                                    sprintObj = activeSprint;
                                    sprintNames.add(sprintName);
                                    if (activeSprint.state === 'active') {
                                        activeSprintName = sprintName;
                                    }
                                }
                            } else if (issue.fields.customfield_12310940) {
                                // Alternative sprint field (customfield_12310940 is common for sprint)
                                const sprintField = issue.fields.customfield_12310940;
                                if (Array.isArray(sprintField) && sprintField.length > 0) {
                                    const sprintInfo = sprintField[sprintField.length - 1];
                                    if (typeof sprintInfo === 'string' && sprintInfo.includes('name=')) {
                                        const nameMatch = sprintInfo.match(/name=([^,\]]+)/);
                                        if (nameMatch) {
                                            sprintName = nameMatch[1];
                                            sprintNames.add(sprintName);
                                            // Check if this is an active sprint
                                            if (sprintInfo.includes('state=active') || sprintInfo.includes('state=ACTIVE')) {
                                                activeSprintName = sprintName;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            return {
                                key: issue.key,
                                summary: issue.fields.summary || 'No summary',
                                description: issue.fields.description || '',
                                status: issue.fields.status ? issue.fields.status.name : 'Unknown',
                                priority: issue.fields.priority ? issue.fields.priority.name : 'Medium',
                                assignee: issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned',
                                reporter: issue.fields.reporter ? issue.fields.reporter.displayName : 'Unknown',
                                type: issue.fields.issuetype ? issue.fields.issuetype.name : 'Task',
                                created: issue.fields.created,
                                updated: issue.fields.updated,
                                sprint: sprintName
                            };
                        });
                        
                        // Determine the best sprint name to use in the UI
                        const currentSprintName = activeSprintName || (sprintNames.size > 0 ? Array.from(sprintNames)[0] : null);
                        
                        console.log(`✅ Found ${tickets.length} sprint JIRAs for ${jiraUsername}`);
                        if (currentSprintName) {
                            console.log(`🎯 Active sprint: ${currentSprintName}`);
                        }
                        
                        res.json({
                            success: true,
                            tickets: tickets,
                            total: searchResult.total,
                            jqlQuery: jqlQuery,
                            sprintName: currentSprintName,
                            allSprintNames: Array.from(sprintNames)
                        });
                        
                    } catch (parseError) {
                        console.error('Failed to parse JIRA search response:', parseError);
                        res.status(500).json({ 
                            error: 'Failed to parse JIRA response',
                            details: parseError.message 
                        });
                    }
                } else if (jiraRes.statusCode === 400) {
                    // Bad request - likely invalid JQL or user not found
                    res.status(400).json({ 
                        error: `Invalid request - check that JIRA username '${jiraUsername}' is correct`,
                        details: data,
                        jqlQuery: jqlQuery
                    });
                } else if (jiraRes.statusCode === 401) {
                    res.status(401).json({ 
                        error: 'JIRA authentication failed - check your token',
                        details: data 
                    });
                } else if (jiraRes.statusCode === 403) {
                    res.status(403).json({ 
                        error: 'JIRA access denied - insufficient permissions',
                        details: data 
                    });
                } else {
                    console.error(`JIRA API error ${jiraRes.statusCode}:`, data);
                    res.status(jiraRes.statusCode).json({ 
                        error: `JIRA API error: ${jiraRes.statusCode}`,
                        details: data,
                        jqlQuery: jqlQuery
                    });
                }
            });
        });
        
        jiraRequest.on('error', (error) => {
            console.error('JIRA sprint tickets request error:', error);
            res.status(500).json({ 
                error: 'Network error connecting to JIRA',
                details: error.message,
                jqlQuery: jqlQuery
            });
        });
        
        jiraRequest.end();
        
    } catch (error) {
        console.error('JIRA sprint tickets fetch error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// ===== IMAGE CACHING SYSTEM =====

// Helper function to generate a hash-based filename for images
function generateImageFilename(url, originalFilename = null) {
    // Create a hash of the URL for uniqueness
    const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
    
    // Extract file extension from URL or filename
    let extension = '.jpg'; // default
    if (originalFilename) {
        const match = originalFilename.match(/\.([a-zA-Z0-9]+)$/);
        if (match) extension = `.${match[1]}`;
    } else {
        const urlMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        if (urlMatch) extension = `.${urlMatch[1]}`;
    }
    
    return `${urlHash}${extension}`;
}

// Helper function to ensure directory exists
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Helper function to download and cache an image
async function downloadAndCacheImage(imageUrl, cacheDir, token = null) {
    return new Promise((resolve, reject) => {
        try {
            console.log(`📥 Downloading image: ${imageUrl}`);
            
            // Generate filename
            const filename = generateImageFilename(imageUrl);
            const filePath = path.join(cacheDir, filename);
            
            // Check if already cached
            if (fs.existsSync(filePath)) {
                console.log(`✅ Image already cached: ${filename}`);
                return resolve({ filename, filePath, cached: true });
            }
            
            // Ensure directory exists
            ensureDirectoryExists(cacheDir);
            
            // Parse URL
            const url = new URL(imageUrl);
            const protocol = url.protocol === 'https:' ? https : http;
            
            // Set up headers
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'DNT': '1',
                'Connection': 'keep-alive'
            };
            
            // Add authorization if token provided
            if (token) {
                if (imageUrl.includes('issues.redhat.com')) {
                    headers['Authorization'] = `Bearer ${token}`;
                } else if (imageUrl.includes('github') || imageUrl.includes('githubusercontent')) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }
            
            const downloadRequest = protocol.request({
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'GET',
                headers: headers
            }, (downloadRes) => {
                console.log(`📡 Download response: ${downloadRes.statusCode} for ${imageUrl}`);
                
                if (downloadRes.statusCode >= 200 && downloadRes.statusCode < 300) {
                    // Success - write to file
                    const fileStream = fs.createWriteStream(filePath);
                    downloadRes.pipe(fileStream);
                    
                    fileStream.on('finish', () => {
                        console.log(`✅ Image cached: ${filename}`);
                        resolve({ filename, filePath, cached: false });
                    });
                    
                    fileStream.on('error', (error) => {
                        console.error(`❌ File write error: ${error.message}`);
                        // Clean up partial file
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                        reject(error);
                    });
                    
                } else if (downloadRes.statusCode >= 300 && downloadRes.statusCode < 400 && downloadRes.headers.location) {
                    // Redirect - follow it
                    console.log(`🔄 Following redirect to: ${downloadRes.headers.location}`);
                    downloadAndCacheImage(downloadRes.headers.location, cacheDir, token)
                        .then(resolve)
                        .catch(reject);
                } else {
                    // Error
                    console.error(`❌ Download failed: ${downloadRes.statusCode} for ${imageUrl}`);
                    reject(new Error(`HTTP ${downloadRes.statusCode}`));
                }
            });
            
            downloadRequest.on('error', (error) => {
                console.error(`❌ Download request error: ${error.message}`);
                reject(error);
            });
            
            downloadRequest.end();
            
        } catch (error) {
            console.error(`❌ Download and cache error: ${error.message}`);
            reject(error);
        }
    });
}

// API endpoint to download and cache GitHub images
app.post('/api/cache-github-image', async (req, res) => {
    const { imageUrl, token } = req.body;
    
    if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl is required' });
    }
    
    try {
        const cacheDir = path.join(__dirname, '../images/github');
        const result = await downloadAndCacheImage(imageUrl, cacheDir, token);
        
        res.json({
            success: true,
            filename: result.filename,
            cached: result.cached,
            localUrl: `/images/github/${result.filename}`
        });
    } catch (error) {
        console.error(`❌ GitHub image caching error: ${error.message}`);
        res.status(500).json({ 
            error: 'Failed to cache image',
            details: error.message 
        });
    }
});

// API endpoint to download and cache JIRA images
app.post('/api/cache-jira-image', async (req, res) => {
    const { imageUrl, token } = req.body;
    
    if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl is required' });
    }
    
    try {
        const cacheDir = path.join(__dirname, '../images/jira');
        const result = await downloadAndCacheImage(imageUrl, cacheDir, token);
        
        res.json({
            success: true,
            filename: result.filename,
            cached: result.cached,
            localUrl: `/images/jira/${result.filename}`
        });
    } catch (error) {
        console.error(`❌ JIRA image caching error: ${error.message}`);
        res.status(500).json({ 
            error: 'Failed to cache image',
            details: error.message 
        });
    }
});

// Serve cached images statically
app.use('/images', express.static(path.join(__dirname, '../images')));

// Test GitHub redirect endpoint
app.get('/api/test-github-redirect', async (req, res) => {
    const { imageUrl } = req.query;
    
    if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl parameter required' });
    }
    
    try {
        console.log(`🧪 Testing GitHub redirect for: ${imageUrl}`);
        
        const options = new URL(imageUrl);
        const redirectRequest = https.request({
            hostname: options.hostname,
            path: options.pathname + options.search,
            method: 'HEAD', // Just get headers, not content
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"'
            }
        }, (redirectRes) => {
            console.log(`📡 GitHub redirect response:`, {
                statusCode: redirectRes.statusCode,
                location: redirectRes.headers.location,
                headers: Object.keys(redirectRes.headers)
            });
            
            res.json({
                originalUrl: imageUrl,
                statusCode: redirectRes.statusCode,
                redirectUrl: redirectRes.headers.location,
                headers: redirectRes.headers
            });
        });
        
        redirectRequest.on('error', (error) => {
            console.error(`❌ GitHub redirect test error:`, error.message);
            res.status(500).json({ error: error.message });
        });
        
        redirectRequest.end();
        
    } catch (error) {
        console.error(`❌ GitHub redirect test error:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

// GitHub image proxy endpoint
app.get('/api/github-image-proxy', async (req, res) => {
    const { imageUrl, token } = req.query;
    
    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
    }
    
    try {
        const url = new URL(imageUrl);
        
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'User-Agent': 'OCMUI-Team-Dashboard'
            }
        };
        
        // Add GitHub token if provided
        if (token && url.hostname.includes('github')) {
            options.headers['Authorization'] = `token ${token}`;
        }
        
        console.log(`🖼️ Proxying GitHub image: ${imageUrl}`, {
            originalUrl: req.query.imageUrl,
            hasToken: !!req.query.token,
            urlType: imageUrl.includes('user-attachments/assets') ? 'user-attachments' : 'other',
            userAgent: req.headers['user-agent'],
            referer: req.headers.referer
        });
        
        const imageRequest = https.request(options, (imageRes) => {
            console.log(`📡 GitHub image response:`, {
                statusCode: imageRes.statusCode,
                contentType: imageRes.headers['content-type'],
                location: imageRes.headers.location,
                isUserAttachments: imageUrl.includes('user-attachments/assets')
            });
            
            if (imageRes.statusCode === 200) {
                // Forward the content type and other relevant headers
                res.set({
                    'Content-Type': imageRes.headers['content-type'] || 'image/png',
                    'Content-Length': imageRes.headers['content-length'],
                    'Cache-Control': 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*'
                });
                // Pipe the image data directly to the response
                imageRes.pipe(res);
            } else if (imageRes.statusCode === 302 || imageRes.statusCode === 301) {
                // Handle redirects - especially important for user-attachments URLs
                const redirectUrl = imageRes.headers.location;
                if (redirectUrl) {
                    console.log(`🔄 Following redirect to: ${redirectUrl.substring(0, 100)}...`);
                    
                    // Follow the redirect with a new request
                    const redirectOptions = new URL(redirectUrl);
                    const protocol = redirectOptions.protocol === 'https:' ? https : http;
                    
                    const redirectRequest = protocol.request({
                        hostname: redirectOptions.hostname,
                        path: redirectOptions.pathname + redirectOptions.search,
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; OCMUI-Dashboard)',
                            'Accept': 'image/*,*/*'
                        }
                    }, (redirectRes) => {
                        console.log(`📡 Redirect response: ${redirectRes.statusCode}`);
                        
                        if (redirectRes.statusCode === 200) {
                            res.set({
                                'Content-Type': redirectRes.headers['content-type'] || 'image/png',
                                'Cache-Control': 'public, max-age=3600',
                                'Access-Control-Allow-Origin': '*'
                            });
                            redirectRes.pipe(res);
                        } else {
                            console.error(`❌ Redirect failed: ${redirectRes.statusCode}`);
                            res.status(redirectRes.statusCode).json({ 
                                error: `Redirect failed: ${redirectRes.statusCode}`,
                                redirectUrl: redirectUrl.substring(0, 100)
                            });
                        }
                    });
                    
                    redirectRequest.on('error', (error) => {
                        console.error('❌ Redirect request error:', error);
                        res.status(500).json({ error: 'Redirect failed', details: error.message });
                    });
                    
                    redirectRequest.end();
                    return;
                }
            } else {
                console.error(`❌ GitHub image proxy failed:`, {
                    statusCode: imageRes.statusCode,
                    imageUrl: imageUrl.substring(0, 100),
                    headers: Object.keys(imageRes.headers)
                });
                res.status(imageRes.statusCode).json({ 
                    error: `Failed to fetch image: ${imageRes.statusCode}`,
                    imageUrl: imageUrl.substring(0, 100)
                });
            }
        });
        
        imageRequest.on('error', (error) => {
            console.error('GitHub image proxy error:', error);
            res.status(500).json({ 
                error: 'Network error fetching image',
                details: error.message,
                imageUrl: imageUrl
            });
        });
        
        imageRequest.end();
        
    } catch (error) {
        console.error('GitHub image proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// JIRA image proxy endpoint  
app.get('/api/jira-image-proxy', async (req, res) => {
    const { imageUrl, token } = req.query;
    
    if (!imageUrl || !token) {
        return res.status(400).json({ error: 'Image URL and token are required' });
    }
    
    try {
        // Parse the JIRA image URL
        let targetUrl = imageUrl;
        if (!targetUrl.startsWith('http')) {
            // Handle relative JIRA attachment URLs
            targetUrl = targetUrl.startsWith('/') ? 
                `https://issues.redhat.com${targetUrl}` :
                `https://issues.redhat.com/secure/attachment/${targetUrl}`;
        }
        
        const url = new URL(targetUrl);
        
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'OCMUI-Team-Dashboard'
            }
        };
        
        console.log(`🖼️ Proxying JIRA image: ${targetUrl}`);
        
        const jiraRequest = https.request(options, (jiraRes) => {
            // Forward the content type and other relevant headers
            res.set({
                'Content-Type': jiraRes.headers['content-type'] || 'image/png',
                'Content-Length': jiraRes.headers['content-length'],
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                'Access-Control-Allow-Origin': '*'
            });
            
            if (jiraRes.statusCode === 200) {
                // Pipe the image data directly to the response
                jiraRes.pipe(res);
            } else {
                res.status(jiraRes.statusCode).json({ 
                    error: `Failed to fetch image: ${jiraRes.statusCode}`,
                    imageUrl: targetUrl
                });
            }
        });
        
        jiraRequest.on('error', (error) => {
            console.error('JIRA image proxy error:', error);
            res.status(500).json({ 
                error: 'Network error fetching image',
                details: error.message,
                imageUrl: targetUrl
            });
        });
        
        jiraRequest.end();
        
    } catch (error) {
        console.error('JIRA image proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 OCMUI Team Dashboard server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`⚙️  Settings: http://localhost:${PORT}/#settings`);
    console.log(`🕐 Timeboard: http://localhost:${PORT}/#timeboard`);
    console.log(`🔧 JIRA API endpoints:`);
    console.log(`   - Test: http://localhost:${PORT}/api/test-jira`);
    console.log(`   - Single ticket: http://localhost:${PORT}/api/jira-ticket`);
    console.log(`   - Sprint tickets: http://localhost:${PORT}/api/jira-sprint-tickets`);
});
