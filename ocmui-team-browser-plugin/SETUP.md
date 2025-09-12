# OCMUI Team Browser Extension Setup

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Extension
1. Download the extension files
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode" 
4. Click "Load unpacked" → Select the `ocmui-team` folder

### Step 2: Create Your API Tokens

#### GitHub Token (Recommended)
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. **Required scopes for this extension:**
   - ✅ `public_repo` - Access public repositories (for UHC Portal)
4. **Optional scopes (for future features):**
   - ⚪ `read:user` - Read user profile info
5. Set expiration (90 days recommended)
6. Click "Generate token" and **copy immediately** (starts with `ghp_`)

**💡 Pro tip:** After creating your token, use the "Test" button in the extension to see exactly what scopes you have!

#### JIRA Token (Required for JIRA features)  
1. Go to https://issues.redhat.com/secure/ViewProfile.jspa
2. Scroll down to "Personal Access Tokens" section
3. Click "Create token" 
4. Give it a name (e.g., "OCMUI Tools")
5. Select appropriate expiry date
6. Click "Create" and copy the token immediately

### Step 3: Configure Extension
1. Click the red fedora icon in Chrome toolbar
2. Click the ⚙️ settings icon (top-right)
3. Paste your tokens
4. Click "Test" for each token to verify
5. Click "Save"

## ✅ You're Done!

Your tokens are stored securely in your browser and never shared with anyone.

## 🔒 Security Notes
- **Your tokens are private** - stored only in your browser
- **Each team member uses their own tokens** - maintains audit trails
- **Tokens can be revoked** anytime from GitHub/JIRA settings
- **No tokens are stored in the code** - extension repo can be public

## 🆘 Need Help?
- **GitHub token not working?** Check the scopes using the "Test" button - you'll see exactly what permissions you have
- **JIRA token not working?** Ensure it has read permissions for projects  
- **Wrong GitHub scopes?** The Test button will show your current scopes - you may need `public_repo`
- **Extension not loading?** Make sure to reload after making changes

---
**Questions?** Ask @dtaylor in Slack
