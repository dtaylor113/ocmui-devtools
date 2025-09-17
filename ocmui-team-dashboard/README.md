# 🎯 OCMUI Team Dashboard

A unified web dashboard that combines **GitHub PR management** with **JIRA ticket tracking** to streamline developer workflows. Get everything you need in one place: your PRs, code reviews, sprint tickets, and JIRA associations.

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/dtaylor/ocmui-devtools.git
cd ocmui-devtools/ocmui-team-dashboard

# Run the automated setup
./setup.sh

....OR....

# Run manual setup steps
yarn install
```

### 2. Start the Dashboard  
```bash
yarn start
```
Opens at `http://localhost:3017`

### 3. First-Time Setup
1. Click the **⚙️ Settings** button (you'll see a red alert icon)
2. Add your API tokens:
   - **GitHub Token**: [Create one here](https://github.com/settings/tokens) with `public_repo`, `repo:status`, `read:user` scopes
   - **GitHub Username**: Your GitHub username (e.g., `dtaylorABC`)
   - **JIRA Token**: [Get from Red Hat JIRA](https://issues.redhat.com/secure/ViewProfile.jspa) → Personal Access Tokens
   - **JIRA Username**: Your Red Hat email address
3. Click **Test** for each token to verify they work
4. Click **Save**

**✅ You're ready!** The red alert icon will disappear when all tokens are configured.

## 💡 Pro Tips

**🔗 JIRA ↔ PR Associations**: The dashboard automatically finds PRs that mention JIRA IDs in titles or descriptions

**👥 Reviewer Comments**: Click on reviewer badges (when available) to see their actual review comments

**⏱️ Auto-Refresh**: Data refreshes every 5 minutes automatically

**📱 Responsive**: Works great on different screen sizes  

**💾 Persistent**: Your settings and preferences are saved locally

## 🛠️ Troubleshooting

### "Credentials Required" Messages
- Make sure all 4 fields are filled in Settings (GitHub token + username, JIRA token + username)
- Use the **Test** buttons to verify each token works
- For GitHub: ensure your token has the required scopes
- For JIRA: use your Red Hat email address, not your GitHub username

### Rate Limits
- GitHub API: 30 requests/minute - the dashboard handles this automatically
- If you hit limits, wait a few minutes or the dashboard will queue requests

### No PRs/JIRAs Showing
- Check that your usernames are correct (case-sensitive)
- Verify you have access to the repositories/projects
- Try the **Test** buttons in Settings to diagnose token issues

---

**🚀 Happy coding!** This dashboard is designed to save you time by keeping GitHub and JIRA info in one place.