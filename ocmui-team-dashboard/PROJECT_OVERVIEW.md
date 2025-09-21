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
│   │   ├── BasePanel.tsx             # Common panel wrapper
│   │   └── EmptyState.tsx            # Placeholder component
│   │
│   ├── contexts/                 # React Context API
│   │   ├── SettingsContext.tsx   # Token management & persistence
│   │   └── QueryProvider.tsx     # React Query setup
│   │
│   ├── hooks/                    # Custom React hooks  
│   │   └── useApiQueries.ts      # API integration with React Query
│   │
│   ├── types/                    # TypeScript definitions
│   │   ├── settings.ts           # Settings interfaces
│   │   └── marked.d.ts           # Markdown type declarations
│   │
│   ├── utils/                    # Utility functions
│   │   └── formatting.ts         # Advanced markdown parsing with Atlassian libraries
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

The application uses **different architectural approaches** for JIRA vs GitHub APIs due to their security models:

**🔒 JIRA API Proxy Pattern:**
- **CORS Restrictions**: Red Hat's JIRA (`issues.redhat.com`) blocks direct browser requests due to enterprise security policies
- **Server-Side Proxy**: Express server acts as a proxy to bypass CORS limitations
- **Token Security**: JIRA tokens never leave the server environment
- **Request Flow**: `Frontend → Backend Server → JIRA API → Backend → Frontend`

**🌐 GitHub API Direct Access:**
- **CORS-Enabled**: GitHub's public API explicitly allows browser requests with proper headers
- **Client-Side Tokens**: GitHub personal access tokens work directly from frontend
- **Public API Design**: Built for client-side applications and OAuth flows  
- **Request Flow**: `Frontend → GitHub API directly`

This hybrid architecture provides optimal security for enterprise JIRA while maintaining performance for public GitHub API calls.

---

## 🎨 User Interface & Features

### **Navigation System**
- **Single-Row Header**: Compact design with logo, navigation, and settings
- **Four Primary Tabs**:
  1. **My Sprint JIRAs** - Current sprint tickets with status tracking
  2. **My Code Reviews** - PRs awaiting user review 
  3. **My PRs** - Personal PRs with open/closed filtering
  4. **JIRA Lookup** - Search any JIRA ticket with history

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
- **React Context**: Application-wide settings and authentication
- **React Query**: Server state management with caching and background updates
- **LocalStorage**: Token persistence and search history
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

---

## 🚨 Known Issues & Considerations

### **API Limitations**
- **GitHub Rate Limits**: 30 requests/minute for search API (handled with caching)
- **JIRA Authentication**: Requires Red Hat JIRA personal access tokens
- **GitHub Image Placeholders**: Most PR images show as styled clickable links due to GitHub's security model

### **Performance Notes**
- **Image Caching**: GitHub images cached in `/images/github/` directory
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

## 🕐 Legacy JavaScript Application & Remaining Task

### **Background**
This React application was migrated from a working plain JavaScript implementation located in `/src/`. All core features have been successfully ported to React with enhanced functionality.

### **Legacy Architecture Reference** (`/src/`)
```
src/
├── app.js                 # Main orchestrator
├── components/            # Feature modules
│   ├── jira.js           # JIRA functionality (ported ✅)
│   ├── github.js         # GitHub functionality (ported ✅)  
│   ├── myPrs.js          # PR management (ported ✅)
│   ├── mySprintJiras.js  # Sprint JIRAs (ported ✅)
│   ├── reviews.js        # Code reviews (ported ✅)
│   └── timeboard.js      # ⏰ TIMEZONE FEATURE - needs porting
├── core/                 # Application state & settings
├── utils/                # Shared utilities
└── styles/main.css       # Legacy styling (reference only)
```

### **Remaining Task: Timezone Feature Implementation**

The only remaining enhancement is porting the timezone functionality from the legacy JavaScript app.

#### **Implementation Requirements**
- **Header Button**: Add timezone picker between Timeboard 🕒 and Settings ⚙️ buttons
- **Settings Integration**: Add timezone preference to `SettingsContext`
- **UI Component**: Create timezone selection dropdown/modal
- **Date Conversion**: Update all timestamp displays across components:
  - `PRCard.tsx` and `JiraCard.tsx` timestamp displays
  - `PRConversation.tsx` and `JiraComments.tsx` comment dates
  - All existing `formatDate()` calls in `formatting.ts`
- **Persistence**: Save timezone preference to localStorage

#### **Files to Modify**
1. `/react/src/components/Header.tsx` - Add timezone button
2. `/react/src/contexts/SettingsContext.tsx` - Add timezone state
3. `/react/src/utils/formatting.ts` - Add timezone conversion utilities  
4. Update timestamp displays across all components

#### **Expected Scope**
2-3 hours - Medium complexity feature requiring timezone logic and UI integration.

---

**The React application is fully functional and production-ready. Only the timezone feature remains to be ported from the legacy implementation.**
