# 🎯 OCMUI Team Dashboard - React Application

> **For AI/LLM Context**: This document provides comprehensive understanding of the React-based OCMUI Team Dashboard for rapid development and maintenance.

## 📋 Project Summary

**OCMUI Team Dashboard** is a modern React application that unifies GitHub PR management with JIRA ticket tracking to streamline developer workflows for the Red Hat OCMUI team.

### 🎯 Core Purpose
- **GitHub Integration**: Track PRs, code reviews, and repository activity  
- **JIRA Integration**: Manage sprint tickets, view descriptions, comments with advanced markdown rendering
- **Unified Dashboard**: Single interface combining both platforms with auto-associations
- **Developer Productivity**: Reduce context switching between GitHub and JIRA

---

## 🏗️ Application Architecture

### **React Application Structure** (`/react/`)

```
react/
├── src/
│   ├── App.tsx                    # Main application with routing
│   ├── components/                # React component architecture
│   │   ├── Header.tsx            # Navigation header with settings
│   │   ├── NavigationTabs.tsx    # Four-tab navigation system
│   │   ├── SplitPanel.tsx        # Resizable split layout manager
│   │   │
│   │   ├── JiraPanel.tsx         # My Sprint JIRAs (sorted by update date)
│   │   ├── JiraLookupPanel.tsx   # JIRA Lookup with search & history
│   │   ├── JiraCard.tsx          # JIRA ticket display component
│   │   ├── JiraDescription.tsx   # JIRA description renderer
│   │   ├── JiraComments.tsx      # JIRA comments renderer
│   │   │
│   │   ├── PRPanel.tsx           # Code Reviews & My PRs
│   │   ├── PRCard.tsx            # PR card display component
│   │   ├── PRDescription.tsx     # PR description renderer
│   │   ├── PRConversation.tsx    # PR conversation renderer
│   │   │
│   │   ├── AssociatedPRsPanel.tsx    # Shows PRs linked to JIRA tickets
│   │   ├── AssociatedJirasPanel.tsx  # Shows JIRAs linked to PRs
│   │   │
│   │   ├── CollapsibleSection.tsx    # Reusable collapsible UI
│   │   ├── ReviewerCommentsModal.tsx # Reviewer comment popup
│   │   ├── SettingsModal.tsx         # Token management
│   │   ├── TimeboardModal.tsx        # Team timezone dashboard
│   │   ├── BasePanel.tsx             # Common panel wrapper
│   │   └── EmptyState.tsx            # Placeholder component
│   │
│   ├── contexts/                 # React Context API
│   │   ├── SettingsContext.tsx   # Token management, user preferences & persistence
│   │   └── QueryProvider.tsx     # React Query setup
│   │
│   ├── hooks/                    # Custom React hooks  
│   │   └── useApiQueries.ts      # API integration with React Query
│   │
│   ├── types/                    # TypeScript definitions
│   │   ├── settings.ts           # Settings interfaces (includes UserPreferences)
│   │   └── marked.d.ts           # Markdown type declarations
│   │
│   ├── utils/                    # Utility functions
│   │   └── formatting.ts         # Advanced markdown parsing & timezone-aware date formatting
│   │
│   └── styles/
│       └── App.css               # Complete application styling
│
├── package.json                  # React dependencies & scripts
├── vite.config.ts               # Vite build configuration
└── tsconfig.json                # TypeScript configuration
```

### **Backend API Server** (`/server/`)

```
server/
└── index.js                     # Express server with JIRA proxy endpoints
    ├── /api/test-jira           # JIRA token validation
    ├── /api/jira-ticket         # Single JIRA ticket lookup  
    └── /api/jira-sprint-tickets # Sprint JIRAs for user
```

#### **Why Backend Server is Required for JIRA (But Not GitHub)**

The Express server exists **specifically to solve JIRA CORS limitations** - it's not an architectural preference but a necessary workaround:

**❌ JIRA Direct Access Fails:**
```javascript
// This fails from browser with CORS error:
fetch('https://issues.redhat.com/rest/api/2/search', {
  headers: { 'Authorization': `Basic ${base64(email:token)}` }
});
// Error: "Access-Control-Allow-Origin header is not present"
```

**✅ GitHub Direct Access Works:**
```javascript
// This works perfectly from browser:
fetch('https://api.github.com/repos/owner/repo/pulls', {
  headers: { 'Authorization': `token ${githubToken}` }
});
```

**🔒 JIRA API Challenges:**
- **No CORS Support**: Red Hat JIRA doesn't allow cross-origin browser requests
- **Enterprise Security**: Corporate JIRA instances block direct browser access by design
- **Authentication Model**: Basic Auth with email:token requires server-side handling
- **Solution**: Express proxy acts as CORS-free bridge between frontend and JIRA

**🌐 GitHub API Advantages:**
- **CORS-Enabled**: GitHub API designed for browser access with proper headers
- **Client-Side Friendly**: Personal Access Tokens work directly from frontend
- **Public API Design**: Built specifically for client applications and OAuth

**Architecture Summary:**
- **JIRA**: `React (5174) → Express Proxy (3017) → JIRA API` *(required due to CORS)*
- **GitHub**: `React (5174) → GitHub API directly` *(no proxy needed)*

This hybrid approach eliminates unnecessary complexity for GitHub while solving JIRA's enterprise security restrictions.

---

## 🎨 User Interface & Features

### **Navigation System**
- **Single-Row Header**: Compact design with logo, navigation, timeboard, and settings
- **Four Primary Tabs**:
  1. **My Sprint JIRAs** - Current sprint tickets with status tracking
  2. **My Code Reviews** - PRs awaiting user review 
  3. **My PRs** - Personal PRs with open/closed filtering
  4. **JIRA Lookup** - Search any JIRA ticket with history
- **Team Timeboard**: 🌍 Globe button opens team timezone dashboard with member selection

### **Core Features**

#### **My Sprint JIRAs Panel**
- Displays all JIRA tickets assigned to user in current sprint
- Sorted by last updated date (most recent first)
- Click any ticket to view associated PRs automatically
- Status badges with dynamic colors (Story/blue, Bug/red, etc.)
- Assignee and priority information

#### **JIRA Lookup Panel**
- **Search Interface**: Prefix dropdown (OCMUI-, XCMSTRAT-, etc.) + number input
- **Recent History**: Dropdown with last 10 searched tickets including summaries
- **Auto-completion**: Prefix suggestions based on search history
- **Instant Associated PRs**: Automatically shows related PRs when ticket loads
- **LocalStorage Persistence**: Search history and prefixes saved locally

#### **My Code Reviews Panel**
- Lists all PRs where user is requested reviewer
- "Review Requested" badges with clear visual indicators
- Click any PR to view associated JIRA tickets
- Reviewer comments modal with detailed feedback
- Status tracking (pending, approved, changes requested)

#### **My PRs Panel**  
- **Open/Closed Toggle**: Switch between active and completed PRs
- **Associated JIRA Detection**: Smart parsing of PR descriptions for JIRA IDs
- **Warning System**: Yellow badges for PRs with missing/invalid JIRA references
- **External Links**: Direct links to GitHub PRs

#### **Associated Panels (Right Side)**
- **Associated PRs Panel**: Shows PRs linked to selected JIRA ticket
- **Associated JIRAs Panel**: Shows JIRA tickets mentioned in selected PR
- **Smart Validation**: Warns about invalid JIRA IDs with detailed modal explanations
- **Auto-clearing**: Clean state when switching between tabs

### **Advanced Components**

#### **JiraCard Component**
- **Rich Content Rendering**: Full Atlassian Document Format support
- **Markdown Processing**: Advanced parsing with code blocks, tables, lists
- **Image Handling**: Smart caching system for JIRA attachments
- **Collapsible Sections**: Description, comments expandable
- **External Links**: Direct links to JIRA tickets

#### **PRCard Component**  
- **GitHub Markdown**: Full GitHub Flavored Markdown support
- **Conversation Threading**: Complete PR discussion threads
- **Review Comments**: Inline code review feedback
- **Status Badges**: Merge status, review state, CI status
- **External Links**: Direct links to GitHub PRs
- **Timezone-Aware Timestamps**: All dates displayed in user's selected timezone

#### **TimeboardModal Component**
- **Team Timezone Dashboard**: View all team members' local times simultaneously
- **Smart Identity Selection**: "I am..." feature for first-time users with automatic timezone setting
- **Multi-Mode Display**: "Now" for current time or "Reference" for specific time comparisons
- **Dynamic Member Management**: Add/edit/delete team members with timezone validation
- **Off-Hours Detection**: Visual indicators for team members outside 9am-5pm local time
- **Search & Filter**: Quick filtering by name, role, or timezone
- **IANA Timezone Support**: Full timezone database with automatic DST handling

---

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 18+ 
- Yarn package manager
- GitHub personal access token
- Red Hat JIRA personal access token

### **Getting Started**

1. **Install Dependencies**
   ```bash
   cd /path/to/ocmui-team-dashboard
   yarn install
   ```

2. **Start Development Server**
   ```bash
   yarn start:react
   ```
   This starts both:
   - **API Server**: `http://localhost:3017` (Express.js)
   - **React App**: `http://localhost:5174` (Vite dev server)

3. **Configure Tokens**
   - Click Settings ⚙️ in top-right corner
   - Add GitHub personal access token
   - Add JIRA token and email address
   - Settings persist in localStorage

---

## 🔧 Technical Architecture

### **State Management**
- **React Context**: Application-wide settings, authentication, and user preferences (timezone)
- **React Query**: Server state management with caching and background updates
- **LocalStorage**: Token persistence, search history, timezone preferences, and team member selection
- **Component State**: UI state and form management

### **API Integration**
- **GitHub API**: Direct integration from frontend with rate limiting
- **JIRA API**: Proxied through Express server for authentication
- **React Query Hooks**: `useJiraTicket`, `useGitHubPRs`, `useSprintJiras`
- **Background Refetch**: Automatic data updates every 30 seconds

### **Styling & UI**
- **CSS Architecture**: Single `App.css` with organized sections
- **Dark Theme**: Professional dark interface optimized for developers
- **Responsive Design**: Mobile-compatible layouts
- **Component Isolation**: Scoped CSS classes prevent conflicts

### **Image Retrieval Systems**

The application handles image display differently for JIRA and GitHub content due to varying security policies and architectural constraints.

#### **Current Implementation**
- **JIRA Images**: ✅ Display inline successfully
  - JIRA attachments load directly from `https://issues.redhat.com/secure/attachment/` URLs
  - Images render properly in descriptions and comments using `<img>` tags
  - Authentication handled via browser session/cookies to Red Hat JIRA

- **GitHub Images**: ⚠️ Display as clickable link-and-launch buttons
  - GitHub user-attachments appear as styled buttons with external link icons
  - Users must click to open images in new tabs
  - Not ideal UX but functional fallback

#### **Legacy JavaScript App Behavior**
The original JavaScript application (`/src/`) successfully displays **both JIRA and GitHub images inline**:

- **Same-Origin Advantage**: Legacy app runs on `localhost:3017` (same as backend)
- **No CORS Restrictions**: All requests appear to come from the same origin
- **Direct Image Loading**: GitHub user-attachments load directly without proxy issues
- **Unified Authentication**: Both GitHub and JIRA images work seamlessly

#### **React App Challenges & Failed Attempts**
Multiple approaches were attempted to achieve inline GitHub image display in the React app:

**Root Cause**: The React app runs on `localhost:5174` (Vite dev server) while the backend runs on `localhost:3017`, creating cross-origin request issues.

**Attempted Solutions**:
1. **Backend Image Proxy** (`/api/github-image-proxy`)
   - Implemented comprehensive header spoofing (User-Agent, Referer, etc.)
   - GitHub consistently returned 404 errors for user-attachments URLs
   - User-attachments redirect to signed S3 URLs with strict CORS policies

2. **Header Optimization**
   - Tried various browser-like User-Agent strings
   - Experimented with different Referer policies
   - Removed authentication headers for public images
   - None consistently worked due to GitHub's security model

3. **Direct Display with Fallbacks**
   - Attempted direct `<img>` tags with `onerror` handlers
   - GitHub user-attachments URLs are temporary/signed (expire quickly)
   - S3 redirects block cross-origin requests from `localhost:5174`

**Technical Limitations**:
- **GitHub Security Model**: User-attachments use temporary, signed URLs that expire
- **CORS Policy**: GitHub/S3 blocks cross-origin image requests by design
- **Authentication Requirements**: GitHub images require specific session context
- **URL Expiration**: User-attachments URLs become invalid after short periods

**Brief Success & Regression**:
We achieved inline GitHub image display temporarily during development, but the solution was unstable due to:
- URL expiration cycles
- Inconsistent GitHub API responses  
- Development environment variations
- Authentication token refresh cycles

The current clickable link approach provides reliable access to GitHub images, though it requires an additional user interaction step.

---

## 🚨 Known Issues & Considerations

### **API Limitations**
- **GitHub Rate Limits**: 30 requests/minute for search API (handled with caching)
- **JIRA Authentication**: Requires Red Hat JIRA personal access tokens
- **GitHub Image Placeholders**: Most PR images show as styled clickable links due to GitHub's security model

### **Performance Notes**
- **Image Loading**: JIRA images load directly; GitHub images use clickable fallbacks
- **Bundle Size**: ~2MB including markdown parsing libraries
- **Memory Usage**: React Query maintains reasonable cache limits

---

## 🎯 Development Best Practices

### **Adding New Features**
1. **Use React Query** for all API calls via `useApiQueries.ts`
2. **Follow TypeScript** patterns with proper interfaces
3. **CSS Classes** should follow existing naming conventions
4. **Component Structure** should use `BasePanel` for consistency

### **Code Patterns**
- **Functional Components**: All components use React hooks
- **Context Usage**: Access settings via `useSettings()` hook
- **Error Handling**: Graceful error states with user feedback
- **Loading States**: Consistent loading indicators across components

---

## ✅ Migration Complete - Legacy JavaScript Application

### **Background**
This React application was migrated from a working plain JavaScript implementation located in `/src/`. **ALL core features have been successfully ported to React** with significant enhancements.

### **Legacy Architecture Reference** (`/src/`)
```
src/
├── app.js                 # Main orchestrator (ported ✅)
├── components/            # Feature modules  
│   ├── jira.js           # JIRA functionality (ported ✅)
│   ├── github.js         # GitHub functionality (ported ✅)  
│   ├── myPrs.js          # PR management (ported ✅)
│   ├── mySprintJiras.js  # Sprint JIRAs (ported ✅)
│   ├── reviews.js        # Code reviews (ported ✅)
│   └── timeboard.js      # ⏰ TIMEZONE FEATURE (ported ✅)
├── core/                 # Application state & settings (ported ✅)
├── utils/                # Shared utilities (ported ✅)
└── styles/main.css       # Legacy styling (ported ✅)
```

### **✅ Completed Migration Features**

#### **🕐 Timezone & Timeboard Implementation** 
The sophisticated timezone functionality has been fully ported and enhanced:

**New Components Added:**
- `TimeboardModal.tsx` - Complete team timezone dashboard with advanced features
- Enhanced `SettingsContext.tsx` - User preferences with timezone persistence
- Enhanced `formatting.ts` - Timezone-aware date formatting utilities

**Key Features Implemented:**
- **Team Timeboard Dashboard**: View all team members' current local times
- **"I am..." Identity Selection**: Smart first-time user experience with automatic timezone detection
- **Timezone-Aware Timestamps**: All dates across the application display in user's selected timezone
- **Multi-Mode Time Display**: Current time vs. reference time comparisons
- **Member Management**: Add/edit/delete team members with full timezone support
- **Off-Hours Detection**: Visual indicators for team members outside business hours
- **Advanced Search & Filtering**: Quick team member lookup capabilities

**Enhanced Components:**
- `PRCard.tsx` - All PR timestamps now timezone-aware
- `JiraCard.tsx` - All JIRA timestamps now timezone-aware  
- `PRConversation.tsx` - Comment timestamps now timezone-aware
- `JiraComments.tsx` - Comment timestamps now timezone-aware
- `Header.tsx` - Integrated timeboard access with streamlined UX

#### **🎨 UI/UX Improvements Beyond Legacy**
- **Streamlined Controls**: Clean left/right grouped layout in timeboard controls
- **Red Alert Styling**: Consistent alert indicators for unset user preferences
- **Responsive Design**: Mobile-compatible timeboard interface
- **Professional Spacing**: Eliminated excessive padding throughout interface
- **Visual Hierarchy**: Clear grouping and separation of functional areas

---

## 🎯 Project Status: 100% Complete

**The React application is now fully functional, production-ready, and contains ALL functionality from the legacy JavaScript implementation plus significant enhancements.**

### **Next Steps: Legacy Cleanup & Production Setup**

#### **Phase 1: Remove Legacy Application** 🗑️
- **Delete `/src/` directory**: Remove entire legacy JavaScript codebase
- **Clean up root files**: Remove legacy `package.json`, `webpack.config.js`, and related files
- **Archive `/dist/` folder**: Remove built legacy application files

#### **Phase 2: Make React App the Default** 🚀
- **Update `README.md`**: Replace instructions to point to React application (`/react/`)
- **Modify `setup.sh`**: Update script to install React dependencies and start React dev server
- **Update root `package.json`**: Simplify to only manage the React application
- **Restructure repository**: Consider moving React app contents to root level

#### **Phase 3: Production Optimization** ⚡
- **Build Process**: Optimize production build for deployment
- **Environment Configuration**: Set up production vs. development environments
- **Documentation**: Update all documentation to reflect React-only architecture
- **Deployment**: Configure hosting for React SPA with Express.js API server

### **Recommended Repository Structure (Post-Cleanup)**
```
ocmui-team-dashboard/
├── src/                  # React application (moved from /react/src/)
├── server/               # Express.js API server (unchanged)
├── package.json          # React app dependencies
├── vite.config.ts        # Vite build configuration
├── README.md             # Updated React-focused documentation
└── setup.sh              # Simplified React setup script
```

### **Project Goals - Next Phase**
1. **🧹 Legacy Removal**: Clean elimination of JavaScript codebase
2. **📚 Documentation Update**: Comprehensive React-focused documentation  
3. **🚀 Production Readiness**: Optimized build and deployment configuration
4. **👥 Team Onboarding**: Simplified setup process for new team members
5. **📈 Performance Monitoring**: Analytics and performance optimization
6. **🔧 Maintenance Mode**: Focus on bug fixes and incremental improvements

**The core application functionality is complete. Future work focuses on operational excellence and team productivity optimization.**
