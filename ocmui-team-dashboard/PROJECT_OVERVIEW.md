# 🎯 OCMUI Team Dashboard - Project Overview

> **For AI/LLM Context**: This document provides comprehensive understanding of the project structure, features, and current development status for rapid comprehension.

## 📋 Project Summary

**OCMUI Team Dashboard** is a unified web application that combines GitHub PR management with JIRA ticket tracking to streamline developer workflows. The project is currently **migrating from plain JavaScript to React** with modern TypeScript architecture.

### 🎯 Core Purpose
- **GitHub Integration**: Track PRs, code reviews, and repository activity  
- **JIRA Integration**: Manage sprint tickets, view descriptions, comments with advanced markdown rendering
- **Unified Dashboard**: Single interface combining both platforms with auto-associations
- **Developer Productivity**: Reduce context switching between GitHub and JIRA

---

## 🏗️ Directory Structure

### Root Level (`/ocmui-devtools/ocmui-team-dashboard/`)

```
ocmui-team-dashboard/
├── src/                    # 🟡 LEGACY Plain JavaScript App (Feature Complete)
├── react/                  # 🟢 NEW React App (Currently Porting)
├── server/                 # 🔵 Backend API Server (Express.js - Shared)
├── dist/                   # Build output for plain JS app
├── package.json           # Main package config & scripts
└── PROJECT_OVERVIEW.md    # This file
```

### 🟡 **Legacy Plain JavaScript App** (`/src/`)
**Status: COMPLETE - Reference Implementation**

```
src/
├── app.js                 # Main orchestrator & initialization
├── components/            # Feature modules (all working)
│   ├── jira.js           # JIRA ticket lookup with input history
│   ├── github.js         # GitHub PR management
│   ├── myPrs.js          # User's PRs with open/closed filtering  
│   ├── mySprintJiras.js  # Sprint JIRA tickets
│   └── reviews.js        # Code reviews awaiting user action
├── core/                 # Application state & settings
│   ├── appState.js       # Central state management
│   └── settings.js       # Token management & persistence
├── utils/                # Shared utilities
│   ├── formatting.js     # Basic markdown parsing (marked.js)
│   ├── prCard.js         # PR card HTML generation
│   ├── jiraCard.js       # JIRA card HTML generation
│   └── reviewerUtils.js  # Reviewer detection & comment parsing
└── styles/
    └── main.css          # Complete CSS styling
```

### 🟢 **React App** (`/react/`)
**Status: PARTIALLY COMPLETE - Modern Migration Target**

```
react/
├── src/
│   ├── App.tsx           # ✅ Main application with routing
│   ├── components/       # ✅ React component architecture
│   │   ├── JiraPanel.tsx         # ✅ My Sprint JIRAs (COMPLETE)
│   │   ├── JiraCard.tsx          # ✅ JIRA ticket display (COMPLETE)  
│   │   ├── JiraMoreInfo.tsx      # ✅ Advanced JIRA details (COMPLETE)
│   │   ├── CollapsibleSection.tsx# ✅ Reusable collapsible UI
│   │   ├── PRPanel.tsx           # 🔸 PR display (API ready, UI incomplete)
│   │   ├── PRCard.tsx            # 🔸 PR cards (basic, missing More Info)
│   │   ├── SettingsModal.tsx     # ✅ Settings management (COMPLETE)
│   │   ├── Header.tsx            # ✅ Navigation header
│   │   ├── NavigationTabs.tsx    # ✅ Two-level navigation
│   │   ├── SplitPanel.tsx        # ✅ Resizable split layout
│   │   └── *PlaceholderPanel.tsx # ❌ Placeholder components for missing features
│   ├── contexts/         # ✅ React Context API
│   │   ├── SettingsContext.tsx   # ✅ Token management & persistence
│   │   └── QueryProvider.tsx     # ✅ React Query setup
│   ├── hooks/            # ✅ Custom React hooks  
│   │   └── useApiQueries.ts      # ✅ API integration with React Query
│   ├── types/           # ✅ TypeScript definitions
│   ├── utils/           # ✅ Utilities (ENHANCED)
│   │   └── formatting.ts # ✅ ADVANCED: Uses official Atlassian libraries
│   └── styles/
│       └── App.css      # ✅ Complete CSS (ported + enhanced)
├── package.json         # React dependencies & scripts
└── vite.config.ts       # Vite build configuration
```

### 🔵 **Backend API Server** (`/server/`)
**Status: COMPLETE - Shared by Both Apps**

```
server/
└── index.js             # Express server with JIRA proxy endpoints
    ├── /api/test-jira          # JIRA token validation
    ├── /api/jira-ticket        # Single JIRA ticket lookup  
    └── /api/jira-sprint-tickets# Sprint JIRAs for user
```

---

## 🚀 Current Development Status

### ✅ **Fully Implemented (React)**

| Feature | Plain JS | React | Enhancement |
|---------|----------|-------|-------------|
| **Settings Management** | ✅ Complete | ✅ **Complete** | Modern React Context |
| **My Sprint JIRAs** | ✅ Complete | ✅ **Complete** | **Superior JIRA markdown** |
| **Navigation & Layout** | ✅ Complete | ✅ **Complete** | Two-level tabs, split panels |
| **JIRA Markdown Rendering** | 🔸 Basic (marked.js) | ✅ **ADVANCED** | **Official Atlassian libraries** |
| **Token Persistence** | ✅ localStorage | ✅ **Complete** | React Context integration |
| **API Architecture** | ✅ Fetch-based | ✅ **Modern** | React Query with caching |

### 🔸 **Partially Implemented (React)**

| Feature | Status | Plain JS Implementation | What's Missing |
|---------|--------|------------------------|---------------|
| **My Code Reviews** | API Ready | Full reviewer detection & status | UI panel implementation |
| **My PRs** | API Ready | Open/closed filtering, detailed cards | UI panel + More Info sections |

### ❌ **Not Implemented (React)**

| Feature | Plain JS Status | Missing Implementation |
|---------|----------------|----------------------|
| **JIRA Lookup** | Complex input with prefix history | Complete feature missing |
| **Associated JIRAs Panel** | Auto JIRA ID extraction from PRs | Complete feature missing |
| **PR More Info Sections** | Rich collapsible sections with reviewer comments | Complete feature missing |

---

## 🔧 Technical Architecture

### **Frontend Technologies**

#### Plain JavaScript App:
- **Vanilla ES6+ JavaScript** with module imports
- **Webpack** for bundling  
- **marked.js** for basic markdown parsing
- **Manual DOM manipulation** 
- **localStorage** for persistence
- **Fetch API** for HTTP requests

#### React App:
- **React 19** + **TypeScript**
- **Vite** for fast development & building
- **React Query (@tanstack/react-query)** for server state management
- **React Context API** for app state
- **Official Atlassian Libraries** for JIRA markdown:
  - `@atlaskit/editor-wikimarkup-transformer`
  - `@atlaskit/adf-utils` 
- **Advanced CSS Grid/Flexbox** layouts

### **Backend Architecture**
- **Express.js** server on port `:3017`
- **JIRA API proxy** to handle CORS and authentication
- **GitHub API** direct integration from frontend
- **No database** - all data fetched real-time from APIs

### **API Integration**

#### GitHub APIs Used:
- **Search API**: Find PRs by user, status, reviewer
- **Pull Requests API**: Detailed PR information
- **Reviews API**: PR review status and comments  
- **Issues API**: General PR comments
- **Check Runs API**: CI/CD status

#### JIRA APIs (Proxied):
- **Authentication**: `/rest/api/2/myself`
- **Single Ticket**: `/rest/api/2/issue/{jiraId}`
- **Sprint Search**: JQL queries for user's sprint tickets

---

## 🎮 Development Workflow

### **Running the Applications**

#### Legacy JavaScript App:
```bash
cd ocmui-team-dashboard
yarn start          # Builds + starts server + opens browser
# Serves at: http://localhost:3017
```

#### React App (Current Development):
```bash  
cd ocmui-team-dashboard
yarn start:react    # Starts both backend API + React dev server
# React dev: http://localhost:5173
# API server: http://localhost:3017
```

### **Key Scripts** (from `package.json`):
- `yarn start:react` - **Recommended**: Starts both servers concurrently
- `yarn build:react` - Builds React app for production
- `yarn start` - Legacy plain JS app  

---

## 🧩 Key Features Breakdown

### **1. My Sprint JIRAs** ✅
- **React Status**: COMPLETE with enhancements
- **Functionality**: Fetches user's tickets from active sprints using JQL
- **Enhancement**: Advanced JIRA wiki markup rendering with official Atlassian libraries
- **UI**: Collapsible cards with rich descriptions, comments, metadata

### **2. JIRA Lookup** ❌  
- **React Status**: NOT IMPLEMENTED (placeholder only)
- **Plain JS Features**: 
  - JIRA ID input with prefix dropdown (OCMUI-, OCM-, etc.)
  - Input history with persistence
  - Auto-completion based on previous searches
  - Loads full ticket details with descriptions/comments

### **3. My Code Reviews** 🔸
- **React Status**: API IMPLEMENTED, UI MISSING
- **Plain JS Features**:
  - Finds PRs where user is requested reviewer
  - Shows review status (approved, changes requested, commented)
  - Sorts by priority (changes requested first)
  - Clickable reviewer badges with comment modals

### **4. My PRs** 🔸  
- **React Status**: API IMPLEMENTED, UI MISSING
- **Plain JS Features**:
  - User's authored PRs with open/closed filtering  
  - Rich "More Info" sections for each PR
  - Reviewer status badges
  - Associated JIRA detection

### **5. Associated JIRAs/PRs** ❌
- **React Status**: PLACEHOLDERS ONLY
- **Plain JS Features**:
  - Auto-detects JIRA IDs mentioned in PR titles/descriptions
  - Shows related PRs when viewing JIRA tickets
  - Cross-linking between GitHub and JIRA content

---

## 🔬 Advanced JIRA Markdown Implementation

### **Plain JS Implementation** (Basic):
```javascript
import { marked } from 'marked';
// Basic GitHub Flavored Markdown only
const html = marked(jiraText);
```

### **React Implementation** (Advanced):
```javascript
import { WikiMarkupTransformer } from '@atlaskit/editor-wikimarkup-transformer';
// Official Atlassian JIRA wiki markup parser
const transformer = new WikiMarkupTransformer();
const adfDocument = transformer.parse(jiraText);  
const html = convertAdfToHtml(adfDocument);
```

**React Advantages**:
- ✅ Native JIRA color formatting `{color:#de350b}text{color}`
- ✅ JIRA-specific elements (panels, code blocks)  
- ✅ Proper list rendering and nesting
- ✅ Advanced ADF (Atlassian Document Format) support

---

## 📊 Migration Progress Tracking

### **Completion Status**: ~60% Complete

| Component Category | Progress | Details |
|-------------------|----------|---------|
| **Core Infrastructure** | ✅ 100% | Settings, navigation, layouts, API setup |
| **JIRA Integration** | ✅ 90% | Sprint JIRAs complete, Lookup missing |
| **GitHub Integration** | 🔸 30% | API ready, UI panels missing |
| **Cross-Platform Features** | ❌ 0% | Associated content linking |

### **Immediate Next Steps**:
1. **Implement JIRA Lookup UI** - Core missing feature
2. **Complete GitHub panels** - My Code Reviews & My PRs
3. **Add PR More Info sections** - Rich expandable content  
4. **Implement Associated panels** - Cross-platform linking

---

## 🛠️ Developer Notes

### **When Working on This Project**:

1. **Backend is Shared**: Both apps use same Express server on `:3017`
2. **Start Both Servers**: Use `yarn start:react` for full development setup
3. **Reference Plain JS**: Complete implementation exists in `/src/` for all features
4. **React Query**: All API calls should use existing hooks in `useApiQueries.ts`
5. **TypeScript**: Maintain strict typing throughout React implementation
6. **CSS Isolation**: Use existing classes, avoid style conflicts between apps

### **Code Patterns**:
- **API Calls**: Always through React Query hooks
- **State Management**: React Context for app state, React Query for server state  
- **Components**: Functional components with TypeScript interfaces
- **Styling**: CSS classes matching plain JS implementation for consistency

---

## 🚨 Known Issues & Considerations

1. **Port 3017 Conflicts**: Backend server must be running for React app APIs
2. **GitHub Rate Limits**: 30 requests/minute for search API - handled with caching
3. **JIRA Authentication**: Requires Red Hat JIRA personal access tokens
4. **CSS Specificity**: Some collapsible sections had selection effects (now fixed)

This overview should provide complete context for any AI/LLM working on this project. The React migration is well-architected and partially complete, with clear patterns for finishing the remaining features.
