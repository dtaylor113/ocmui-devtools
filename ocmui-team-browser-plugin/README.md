# OCMUI Team Browser Extension 🚀

> **A comprehensive browser extension for the OCMUI team featuring JIRA navigation, GitHub shortcuts, team timeboard, and productivity tools.**

![OCMUI Team Tools](icon128.png)

## ✨ Features

### 🎯 **Quick Navigation**
- **JIRA Input**: Enter ticket IDs (e.g., "OCMUI-1234") and press Enter to open tickets
- **Smart History**: Remembers your last 10 JIRA tickets for quick access
- **GitHub Shortcuts**: Direct access to UHC-Portal pull requests
- **JIRA Board**: Quick link to OCMUI planning board

### 🕐 **Team Timeboard**
- **Real-time timezone display** for all team members
- **Off-hours highlighting** (before 9am/after 5pm in red)
- **Reference time mode** - see what time it would be for everyone at a specific hour
- **Search and filter** team members by name, role, or timezone
- **Editable member list** - add/edit/remove team members as needed

### ⚙️ **Personal API Integration**
- **Individual token setup** for secure API access
- **GitHub integration** for future features
- **Red Hat JIRA integration** with your personal access token
- **Built-in token testing** with detailed error feedback

## 🚀 Quick Start

### 1. Navigate to Extension Directory
```bash
cd ocmui-devtools/ocmui-team-browser-plugin
```

### 2. Install Extension in Chrome
1. Open `chrome://extensions/`
2. Enable **"Developer mode"** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `ocmui-team-browser-plugin` folder
5. The red fedora icon should appear in your toolbar!

### 2. Setup Your Tokens (5 minutes)
1. **Click the red fedora icon** in Chrome toolbar
2. **Click ⚙️ settings** (top-right corner)
3. **Create tokens**:
   - **GitHub**: [Create here](https://github.com/settings/tokens) (scopes: `public_repo`, `read:user`)
   - **JIRA**: [Create here](https://issues.redhat.com/secure/ViewProfile.jspa) → Personal Access Tokens section
4. **Test & Save** your tokens

### 3. You're Ready! 🎉

## 📱 Interface Overview

```
┌─────────────────────────────────────┐
│  OCMUI Team Tools              ⚙️   │
│  Quick access to JIRA and GitHub    │
├─────────────────────────────────────┤
│                                     │
│  JIRA: [OCMUI-1234        ] ▼       │
│                                     │
│  ┌─ Main Content Area ─────────────┐ │
│  │                                 │ │
│  │     Ready for JIRA features     │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Pull Requests] [JIRA Board] [⏰]   │
└─────────────────────────────────────┘
```

## 👥 Team Members

Current team in timeboard:
- **US Timezones**: Dylan, Zac, Kim, Dave, Trevor, David, Lakshmi, Jason, Joseph, Deepika
- **Europe**: Aneela (NL), Roberto (IT), Ales (CZ), Denis (DE)  
- **Israel**: Eliran, Lior, Netta, Liza, Nir
- **APAC**: Jaya (Singapore)

*Team members can be edited via the timeboard management interface.*

## 🔧 Development

### Project Structure
```
ocmui-team/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # Main functionality
├── timeboard/            # Team timeboard feature
│   ├── popup.html
│   ├── popup.js
│   └── members.json      # Team member data
├── icons/                # Extension icons (red fedora)
├── *.png                 # Button icons (GitHub, JIRA)
├── README.md            # This file
└── SETUP.md             # User setup guide
```

### Key Technologies
- **Manifest V3** Chrome Extension
- **Vanilla JavaScript** - no dependencies
- **CSS Grid/Flexbox** - responsive design
- **Chrome Storage API** - secure token storage
- **Fetch API** - GitHub/JIRA integration

## 🔒 Security & Privacy

### ✅ **Secure by Design**
- **Individual tokens**: Each team member uses their own API tokens
- **Local storage**: Tokens stored securely in browser storage
- **No shared credentials**: No tokens in code or repo
- **Audit friendly**: Each person's API calls use their identity

### 🛡️ **Permissions**
```json
"permissions": ["storage", "tabs"]
"host_permissions": [
  "https://api.github.com/*",
  "https://issues.redhat.com/*"
]
```

## 🎯 Roadmap

### 🚧 **Planned Features**
- [ ] **JIRA Reporting**: Ticket details, sprint info, workload charts
- [ ] **GitHub Integration**: PR status, branch info, code reviews
- [ ] **Team Notifications**: Sprint updates, standup reminders
- [ ] **Productivity Metrics**: Personal/team velocity tracking

### 💡 **Ideas for Future**
- Slack integration for team updates
- Calendar integration for meeting scheduling
- Custom shortcuts and bookmarks
- Team availability indicators

## 🆘 Support

### **Common Issues**
- **"Failed to fetch" errors**: Reload extension after installation
- **JIRA token not working**: Ensure token has read permissions for OCMUI project
- **Extension not loading**: Clear browser cache and reload

### **Getting Help**
- **Slack**: Ask @dtaylor in #ocmui-team
- **Issues**: Create GitHub issue in this repo
- **Setup Problems**: Check SETUP.md for detailed instructions

## 🤝 Contributing

### **Adding Team Members**
1. Open extension → click 🕐 Timeboard
2. Click 👥 manage members button
3. Add new member with correct timezone

### **Code Contributions**
1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is for internal OCMUI team use. All rights reserved.

---

**Built with ❤️ for the OCMUI Team**

*Questions? Feedback? Find @dtaylor on Slack!*

---

**Tech Stack:** Chrome Extension V3, Vanilla JavaScript  
**Part of:** [OCMUI DevTools](../README.md) monorepo
