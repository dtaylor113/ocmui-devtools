const express = require('express');
const path = require('path');
const https = require('https');
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
            path: `/rest/api/2/issue/${jiraId}?expand=changelog,comment`,
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
                                comments: comments
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

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 OCMUI Team Dashboard server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`⚙️  Settings: http://localhost:${PORT}/#settings`);
    console.log(`🕐 Timeboard: http://localhost:${PORT}/#timeboard`);
    console.log(`🔧 JIRA API proxy: http://localhost:${PORT}/api/test-jira`);
});
