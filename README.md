# OCMUI DevTools

A collection of development tools and utilities for the OCMUI team.

## 🏗️ **Monorepo Structure**

Each sub-directory contains an independent project that can be built and run separately:

```
ocmui-devtools/
├── ocmui-team-dashboard/     # Web-based team dashboard
├── ocmui-team-browser-plugin/  # Chrome extension
├── sol-sc-explorer/          # Solana smart contract explorer
└── README.md                 # This file
```

## 🚀 **Quick Start - Any Project**

```bash
# Navigate to any sub-project
cd ocmui-devtools/[project-name]

# Install dependencies
yarn install

# Start the project
yarn start
```

---

## 📋 **Projects**

### 🌐 [OCMUI Team Dashboard](./ocmui-team-dashboard/)
**Web-based dashboard for JIRA/GitHub integration and team productivity tools**

```bash
cd ocmui-team-dashboard
yarn install
yarn start          # Production server on localhost:3017
yarn start:dev      # Development server with hot-reload
```

**Features:**
- JIRA ticket integration
- GitHub PR correlation
- Team timezone management
- Settings with API token management

---

### 🔌 [OCMUI Team Browser Plugin](./ocmui-team-browser-plugin/)
**Chrome Extension V3 for JIRA and GitHub integration**

```bash
cd ocmui-team-browser-plugin
# Load as unpacked extension in Chrome
```

**Features:**
- JIRA ticket popup display
- GitHub PR correlation
- Chrome extension popup interface
- Team timezone quick access

---

### ⛓️ [Sol Smart Contract Explorer](./sol-sc-explorer/)
**Solana smart contract exploration tool**

```bash
cd sol-sc-explorer
yarn install
yarn start
```

---

## 🛠️ **Development Workflow**

### Working on Individual Projects
```bash
# Work on dashboard
cd ocmui-team-dashboard
yarn start:dev

# Work on extension  
cd ocmui-team-browser-plugin
# Load in Chrome Developer Mode

# Work on explorer
cd sol-sc-explorer
yarn start
```

### Adding New Tools
1. Create new directory: `my-new-tool/`
2. Initialize with `yarn init`
3. Add build scripts: `yarn start`, `yarn build`, etc.
4. Update this README

## 📝 **Notes**

- **Independent Projects**: Each sub-directory is completely self-contained
- **Shared Repository**: All tools share the same Git repository for easier management
- **Individual Packages**: Each project has its own `package.json` and dependencies
- **Monorepo Benefits**: Unified versioning, shared tooling, easier cross-project changes

---

## 🤝 **Contributing**

1. Navigate to the specific project directory
2. Follow that project's development setup
3. Each project may have different tech stacks and requirements

**Happy coding!** 🚀