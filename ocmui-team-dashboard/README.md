# OCMUI Team Dashboard

A web-based dashboard for JIRA/GitHub integration, team timezones, and productivity tools.

**Converted from Chrome Extension to standalone web application.**

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Yarn package manager

### Setup Instructions

1. **Navigate to this project directory:**
   ```bash
   cd ocmui-devtools/ocmui-team-dashboard
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Start the server:**
   ```bash
   yarn start  # Automatically builds and starts on localhost:3017
   ```

**The dashboard will be available at: http://localhost:3017**

### Development Mode

For development with hot-reload:
```bash
yarn start:dev
```

## 🎯 Features

### Current Implementation
- **✅ Settings Modal**: GitHub Token, GitHub Username, JIRA Token
- **✅ Settings Alert**: Red exclamation when API tokens are missing
- **✅ Tab Navigation**: JIRA, Awaiting My Code Review, My PRs  
- **✅ Two-Column Layout**: JIRA left, GitHub PRs right
- **✅ Icons**: GitHub and JIRA icons from original extension
- **✅ Column Titles**: Distinctive colors (JIRA: amber, GitHub: green)
- **✅ LocalStorage**: API tokens and settings persistence
- **✅ Responsive Design**: Mobile-friendly dark theme

### Header Navigation
- **⚙️ Settings**: Configure API tokens and GitHub username (shows ❗ when missing)
- **🕰️ Team Timezones**: Quick access to team timezone information

### Tab Views
1. **🎟️ JIRA**: Enter JIRA IDs to view ticket details + associated GitHub PRs
2. **📝 Awaiting My Code Review**: PRs where you are assigned as reviewer
3. **🔄 My PRs**: Your authored pull requests

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Production server (auto-builds if needed, auto-kills port conflicts) |
| `yarn start:dev` | Development server with hot-reload |
| `yarn build` | Build production assets |

## 📋 Next Development Steps

- [ ] Port JIRA functionality from Chrome extension
- [ ] Port GitHub PR functionality from Chrome extension  
- [ ] Implement "Awaiting My Code Review" tab
- [ ] Implement "My PRs" tab
- [ ] Integrate Timeboard functionality

## 🔧 Configuration

The dashboard uses `localStorage` to persist:
- GitHub API token
- GitHub username  
- JIRA API token
- JIRA search history

Configure these in **Settings** (⚙️ button in header).

## 🌐 API Requirements

### GitHub Token Scopes
- `public_repo`
- `repo:status` 
- `read:user`

### JIRA Token
- Personal Access Token from Red Hat JIRA
- Generate at: https://issues.redhat.com/secure/ViewProfile.jspa

---

**Port:** localhost:3017  
**Tech Stack:** Express.js, Webpack, Vanilla JavaScript  
**Part of:** [OCMUI DevTools](../README.md)
