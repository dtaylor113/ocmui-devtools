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
│   │   ├── JiraPanel.tsx         # ✅ My Sprint JIRAs (COMPLETE + Sorted by update date)
│   │   ├── JiraCard.tsx          # ✅ JIRA ticket display (COMPLETE - Refactored)
│   │   ├── JiraDescription.tsx   # ✅ JIRA description content (NEW)
│   │   ├── JiraComments.tsx      # ✅ JIRA comments content (NEW)
│   │   ├── PRCard.tsx            # ✅ PR cards (COMPLETE - Refactored)
│   │   ├── PRDescription.tsx     # ✅ PR description content (NEW)
│   │   ├── PRConversation.tsx    # ✅ PR conversation content (NEW)
│   │   ├── CollapsibleSection.tsx# ✅ Reusable collapsible UI
│   │   ├── ReviewerCommentsModal.tsx # ✅ Reviewer comment popup (FIXED)
│   │   ├── AssociatedPRsPanel.tsx# ✅ Associated PRs display (COMPLETE)
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
│   │   └── formatting.ts # ✅ ADVANCED: Uses official Atlassian libraries + Smart image caching
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
| **My Sprint JIRAs** | ✅ Complete | ✅ **Complete** | **Superior JIRA markdown + Auto-sorting by update date** |
| **Navigation & Layout** | ✅ Complete | ✅ **Complete** | Two-level tabs, split panels |
| **JIRA Markdown Rendering** | 🔸 Basic (marked.js) | ✅ **ADVANCED** | **Official Atlassian libraries** |
| **Token Persistence** | ✅ localStorage | ✅ **Complete** | React Context integration |
| **API Architecture** | ✅ Fetch-based | ✅ **Modern** | React Query with caching |
| **JIRA Card Architecture** | 🔸 Basic collapsible | ✅ **ENHANCED** | **Individual collapsible Description + Comments sections** |
| **PR Card Architecture** | 🔸 Basic collapsible | ✅ **ENHANCED** | **Individual collapsible Description + Conversation sections** |
| **Associated PRs Panel** | ❌ Not implemented | ✅ **Complete** | Auto JIRA ID detection with PR search |
| **Image Handling System** | 🔸 Basic | ✅ **ADVANCED** | Smart caching, GitHub/JIRA optimized, clickable fallbacks |
| **Reviewer Comment Popups** | ✅ Complete | ✅ **Complete** | Async markdown parsing with proper error handling |

### 🔸 **Partially Implemented (React)**

| Feature | Status | Plain JS Implementation | What's Missing |
|---------|--------|------------------------|---------------|
| **My Code Reviews** | API Ready | Full reviewer detection & status | **UI panel implementation (NEXT PRIORITY)** |
| **My PRs** | API Ready | Open/closed filtering, detailed cards | UI panel implementation |

### ❌ **Not Implemented (React)**

| Feature | Plain JS Status | Missing Implementation |
|---------|----------------|----------------------|
| **JIRA Lookup** | Complex input with prefix history | Complete feature missing |
| **Associated JIRAs Panel** | Auto JIRA ID extraction from PRs | Complete feature missing (placeholder exists) |

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

## 🖼️ Image Handling Implementation

### **Current Status**: ✅ **IMPLEMENTED** - Smart Image Handling System

A sophisticated **image handling system** has been implemented to provide the best possible user experience given platform security constraints.

### **System Architecture**:

#### **Backend Image Caching Infrastructure** ✅:
```
ocmui-team-dashboard/
├── images/
│   └── github/          # Hash-named cached GitHub images only
├── server/
│   └── index.js        # Image caching endpoints (GitHub only)
└── react/src/utils/
    └── formatting.ts   # Smart image processing logic
```

#### **Smart GitHub Image Processing** ✅:
- **`user-attachments/assets` URLs**: Converted to styled clickable links (🖼️ icon)
  - *Reason*: These are placeholder URLs that always return 404
  - *Result*: Clean fallback that opens image in GitHub web interface
- **Real GitHub Images** (avatars, public images): Cached and displayed inline
  - *Process*: Server-side download → Local storage → Direct display
  - *Examples*: `avatars.githubusercontent.com`, `github.githubassets.com`
- **Smart Detection**: Automatically identifies image type and applies appropriate handling

#### **JIRA Image Handling** ✅:
- **Direct Display**: Uses JIRA attachment URLs for immediate image rendering (live-loaded)
- **Full Resolution**: Prioritizes `attachment.url` over thumbnails  
- **No Caching Used**: JIRA images displayed directly from JIRA servers, not cached locally
- **Fallback Links**: For filename-only references, links to JIRA ticket

#### **Technical Implementation**:

**Frontend Components**:
- `PRDescription.tsx` & `PRConversation.tsx`: Use async `parseGitHubMarkdownWithCaching()` with smart image processing
- `JiraDescription.tsx` & `JiraComments.tsx`: Use sync `parseJiraMarkdownSync()` with direct JIRA image display
- Progressive loading states during GitHub image processing

**Backend Endpoints**:
- `POST /api/cache-github-image`: Downloads and caches GitHub images
- `GET /images/*`: Static serving of cached GitHub images
- **Note**: JIRA images use direct URLs, no backend caching needed

**Smart Processing Logic**:
```typescript
// Different handling per image type
if (imageUrl.includes('user-attachments/assets')) {
  // Placeholder → Clickable link
} else if (imageUrl.includes('avatars.githubusercontent.com')) {
  // Real image → Cache and display
} else {
  // External → Attempt cache, fallback gracefully
}
```

### **Current Implementation Status**:

#### **✅ Successfully Working**:
- **Real GitHub Images**: Cached locally and displayed inline (avatars, public assets)
- **JIRA Images**: Direct display using live JIRA attachment URLs (no local caching)
- **Smart Fallbacks**: Placeholder URLs converted to styled clickable links
- **Hash-based Caching**: GitHub images cached with hash names to prevent conflicts

#### **🔗 Clickable Link Fallbacks**:
- **GitHub Placeholder URLs** (`user-attachments/assets`): Clean 🖼️ buttons
- **Failed Downloads**: Graceful fallback to external links
- **Visual Consistency**: GitHub-styled buttons that integrate with app design

#### **🏗️ Technical Architecture**:
- **Backend Caching**: `/api/cache-github-image` endpoint for GitHub images only
- **Static Serving**: Express static middleware for cached GitHub images
- **Smart Processing**: `processGitHubImagesSmartly()` function with type detection
- **JIRA Direct Display**: `parseJiraMarkdownSync()` uses live JIRA attachment URLs
- **Error Handling**: Progressive enhancement with multiple fallback layers

### **Known Limitations & Design Decisions**:
- **GitHub PR Images**: Most appear as clickable links due to platform security (expected behavior)
- **JWT Token Management**: GitHub's temporary tokens cannot be generated via API
- **Placeholder URL Detection**: Smart system identifies and handles different URL types appropriately
- **Performance Optimization**: Real images cached permanently, placeholders handled efficiently

---

## 📊 Migration Progress Tracking

### **Completion Status**: ~75% Complete

| Component Category | Progress | Details |
|-------------------|----------|---------|
| **Core Infrastructure** | ✅ 100% | Settings, navigation, layouts, API setup |
| **JIRA Integration** | ✅ 95% | Sprint JIRAs complete with enhanced architecture, Lookup missing |
| **GitHub Integration** | 🔸 60% | Enhanced PR cards, API ready, My Code Reviews panel missing |
| **Image Handling** | ✅ 100% | Smart system: real images cached inline, placeholders as clickable links |
| **Cross-Platform Features** | 🔸 50% | Associated PRs complete, Associated JIRAs placeholder only |
| **Component Architecture** | ✅ 100% | Simplified, maintainable collapsible system |

### **Immediate Next Steps**:
1. **🔥 PRIORITY: Implement "My Code Reviews" Panel** - API ready, UI missing
2. **Complete "My PRs" Panel** - Similar to Code Reviews but for authored PRs  
3. **Implement JIRA Lookup UI** - Core missing feature with complex input history
4. **Complete Associated JIRAs Panel** - Auto JIRA detection from PR content

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
4. **GitHub PR Image Placeholders**: Most PR images show as styled clickable links due to GitHub's security model (placeholder URLs + JWT restrictions) - this is the optimal solution given API constraints
5. **GitHub Image Caching Storage**: Cached GitHub images accumulate in `/images/github/` directory (cleanup system available as future enhancement)

---

## 🎯 Next Steps & Project Goals

### **Phase 1: Complete Core Features** (High Priority)

#### **1. My Code Reviews Panel Implementation** 🔥 **CRITICAL - IMMEDIATE NEXT TASK**
- **Status**: API completely ready, UI panel missing  
- **Implementation**: Port from `src/components/reviews.js`
- **What's Available**: 
  - ✅ API hooks in `useApiQueries.ts` 
  - ✅ PR card components with reviewer functionality
  - ✅ Reviewer comment modals working
- **What's Needed**:
  - Create `MyCodeReviewsPanel.tsx` component
  - Filter PRs where user is requested reviewer
  - Sort by review status priority (changes requested first)
  - Display using existing `PRCard` components
- **Priority**: **HIGHEST** - most logical next feature, minimal new code needed

#### **2. My PRs Panel Implementation** 🔸 **HIGH**  
- **Status**: API ready, UI panel missing
- **Implementation**: Port from `src/components/myPrs.js` 
- **Complexity**: Medium - similar to Code Reviews but for authored PRs
- **Features**: Open/closed filtering, status badges, associated JIRA detection

#### **3. JIRA Lookup UI Implementation** 🔸 **IMPORTANT**
- **Status**: Complex feature entirely missing
- **Implementation**: Create search interface matching plain JS app (`src/components/jira.js`)
- **Components Needed**: 
  - Search input with JIRA prefix dropdown (OCMUI-, OCM-, etc.)
  - Input history with localStorage persistence  
  - Auto-completion based on previous searches
  - Results display with ticket summaries
- **Complexity**: High - requires input management and history system

#### **4. Associated JIRAs Panel** 🔗 **MEDIUM**
- **Status**: Placeholder exists, logic missing
- **Implementation**: Auto JIRA ID detection from PR titles/descriptions
- **Complexity**: Medium - text parsing and API integration

### **Phase 2: System Optimization** (Medium Priority)

#### **4. Image System Enhancements** 📸 **NICE TO HAVE**
- **Cleanup System**: Automatic removal of old cached images  
- **Storage Management**: Size limits and cache eviction policies
- **Performance**: Lazy loading for large image sets
- **Analytics**: Track cache hit rates and storage usage

#### **5. Performance & UX Improvements** ⚡ **ONGOING**
- **Loading States**: Enhanced skeleton loaders and progressive rendering
- **Error Handling**: More graceful error boundaries and retry mechanisms  
- **Mobile Optimization**: Responsive design improvements
- **Accessibility**: ARIA labels and keyboard navigation

### **Phase 3: Advanced Features** (Lower Priority)

#### **6. Developer Experience** 🛠️ **FUTURE**
- **Testing Suite**: Unit and integration tests for React components
- **Documentation**: Component documentation and usage examples
- **CI/CD Pipeline**: Automated testing and deployment
- **Code Quality**: ESLint rules and automated code formatting

#### **7. Feature Enhancements** 🚀 **FUTURE**
- **Search & Filtering**: Advanced filtering across JIRA and GitHub content
- **Notifications**: Real-time updates for PR/JIRA changes
- **Customization**: User preferences for layouts and data display
- **Export Features**: Data export and reporting capabilities

### **Immediate Action Items**

1. **Start with JIRA Lookup** - Most critical missing piece
2. **Reference existing plain JS implementation** in `/src/components/jira.js`
3. **Follow established patterns** from other React components
4. **Test incrementally** using the shared backend server
5. **Maintain TypeScript typing** and React Query patterns

### **Technical Debt & Maintenance**

- **Image Cache Management**: Implement cleanup for long-term stability
- **API Rate Limit Optimization**: Improve caching strategies
- **Component Refactoring**: DRY principle improvements where beneficial
- **Bundle Size Optimization**: Code splitting for better performance

---

---

## 📋 **Immediate Action Plan for Next Developer Session**

### **🎯 PRIMARY TASK: Implement My Code Reviews Panel**

**Goal**: Create a fully functional "My Code Reviews" panel that shows PRs where the current user is a requested reviewer.

**Implementation Steps**:

1. **Create `MyCodeReviewsPanel.tsx`** 
   - Use existing GitHub PR APIs from `useApiQueries.ts`
   - Follow pattern from `AssociatedPRsPanel.tsx` 
   - Filter for PRs where `apiTokens.githubUsername` is in reviewers

2. **Add Panel to Navigation**
   - Update `NavigationTabs.tsx` to include "My Code Reviews" tab
   - Wire up routing in `App.tsx`

3. **Implement Review Priority Sorting**
   - Sort PRs by review status: `changes_requested` → `review_requested` → `commented` → `approved`
   - Use existing reviewer detection logic

4. **UI Polish**  
   - Loading states, error handling
   - Empty state when no reviews pending
   - Count badge showing number of pending reviews

**Reference Implementation**: `src/components/reviews.js` (fully working in plain JS app)

**Expected Time**: 2-3 hours (APIs and components already exist)

**Success Criteria**: 
- ✅ Panel shows PRs where user is requested reviewer
- ✅ Proper sorting by review priority  
- ✅ Clicking reviewer badges shows comment popups (already working)
- ✅ Responsive loading and error states

---

**This overview provides complete context for any AI/LLM working on this project. The React migration has solid foundations with a simplified, maintainable architecture and clear immediate next steps focused on completing the GitHub integration.**
