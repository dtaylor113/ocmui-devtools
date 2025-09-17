# 🚀 Team Setup Instructions

**Quick copy-paste instructions for getting the OCMUI Team Dashboard running on your machine.**

## Option 1: Automatic Setup (Recommended)

**Copy and paste this into your terminal:**

```bash
# Clone the repository
git clone https://github.com/dtaylor113/ocmui-devtools.git
cd ocmui-devtools/ocmui-team-dashboard

# Run the automated setup
./setup.sh
```

That's it! The script will:
- Install all dependencies
- Build the dashboard  
- Start the server
- Open your browser to http://localhost:3017

## Option 2: Manual Setup

If you prefer manual control:

```bash
# Clone and navigate
git clone https://github.com/dtaylor113/ocmui-devtools.git
cd ocmui-devtools/ocmui-team-dashboard

# Install dependencies
yarn install

# Start the dashboard
yarn start
```

## 🔑 First-Time Configuration

**After the dashboard opens in your browser:**

1. **Click the ⚙️ Settings button** (you'll see a red alert icon)

2. **Get your GitHub Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `public_repo`, `repo:status`, `read:user`
   - Copy the token (starts with `ghp_`)

3. **Get your JIRA Token**:
   - Go to: https://issues.redhat.com/secure/ViewProfile.jspa  
   - Scroll to "Personal Access Tokens"
   - Click "Create token"
   - Copy the token

4. **Fill in the Settings**:
   - **GitHub Token**: Paste your `ghp_` token
   - **GitHub Username**: Your GitHub username (e.g., `dtaylor113`)
   - **JIRA Token**: Paste your JIRA token  
   - **JIRA Username**: Your Red Hat email address

5. **Test & Save**:
   - Click **Test** for each token (should show green checkmarks)
   - Click **Save**
   - The red alert icon should disappear

## ✅ You're Done!

**The dashboard gives you:**
- 📋 **My Sprint JIRAs** - Your current sprint tickets + related PRs
- 🔄 **My Code Reviews** - PRs awaiting your review + JIRA context
- 📂 **My PRs** - Your pull requests + associated JIRAs  
- 🔍 **JIRA Lookup** - Quick JIRA search + PR associations

## 🆘 Need Help?

**Common Issues:**

- **"Credentials Required"** → Make sure all 4 fields in Settings are filled and tested
- **"Rate Limited"** → Wait a few minutes, the dashboard handles GitHub limits automatically
- **Nothing loading** → Check your username spelling (case-sensitive) and token permissions

**Still stuck?** Check the browser console (F12) for error messages or ask for help!

---

**🎯 Happy coding!** This dashboard saves tons of time by keeping GitHub and JIRA in one place.
