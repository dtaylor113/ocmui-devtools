# OCMUI Team Dashboard

A comprehensive web dashboard for managing JIRA tickets and GitHub PRs with a clean, modular architecture.

## 🏗️ Architecture Overview

The application has been refactored from a single monolithic `app.js` file into a well-organized modular structure for better maintainability and scalability.

### 📁 Project Structure

```
src/
├── app.js                    # Main application orchestrator
├── core/                     # Core application logic
│   ├── appState.js          # Global state management & localStorage
│   └── settings.js          # Settings modal & API token management
├── components/              # Feature-specific modules  
│   ├── jira.js             # JIRA integration & ticket management
│   └── github.js           # GitHub PR fetching & display
├── utils/                   # Reusable utilities
│   ├── formatting.js       # Text processing & markdown parsing
│   └── ui.js               # UI utilities & interactive components
├── styles/
│   └── main.css            # Application styles
└── assets/                 # Images and static resources
```

## 🧩 Module Responsibilities

### Core Modules

#### `core/appState.js`
- **Purpose**: Centralized application state management
- **Responsibilities**:
  - Global state object (`appState`)
  - localStorage persistence for tokens, history, and preferences
  - State initialization and validation
  - Helper functions for state access

#### `core/settings.js`
- **Purpose**: User settings and API token management
- **Responsibilities**:
  - Settings modal UI and interactions
  - GitHub and JIRA token validation
  - API token testing with visual feedback
  - Ready state indicator management

### Component Modules

#### `components/jira.js`
- **Purpose**: Complete JIRA integration functionality
- **Responsibilities**:
  - JIRA input fields (prefix + number)
  - History dropdown with selection state
  - JIRA API communication via server proxy
  - Ticket display with markdown parsing
  - Prefix history management

#### `components/github.js`
- **Purpose**: GitHub PR integration and display
- **Responsibilities**:
  - GitHub API integration for PR search
  - Detailed PR information fetching (reviews, checks, etc.)
  - Reviewer status processing and display
  - Check run status analysis
  - PR display with badges and metadata

### Utility Modules

#### `utils/formatting.js`
- **Purpose**: Text processing and formatting utilities
- **Responsibilities**:
  - JIRA wiki markup to HTML conversion
  - Badge class generation for styling consistency
  - Date formatting and relative time calculations
  - Text truncation and sanitization
  - JIRA ID parsing and validation

#### `utils/ui.js`
- **Purpose**: UI utilities and interactive components
- **Responsibilities**:
  - Split pane functionality with persistent sizing
  - Loading states and error displays
  - Tab navigation management
  - Toast notifications
  - Utility functions (debounce, clipboard, etc.)

### Main Application

#### `app.js`
- **Purpose**: Application orchestration and initialization
- **Responsibilities**:
  - Module initialization coordination
  - Cross-module dependency setup
  - Global error handling
  - Debug interface setup

## 🔧 Key Features

### JIRA Integration
- **Customizable Project Prefixes**: Support for multiple projects (OCMUI-, XCMSTRAT-, OCM-, etc.)
- **Smart Input Fields**: Separate prefix and number inputs with auto-completion
- **Rich History**: Persistent dropdown with ticket summaries and assignee info
- **Comprehensive Display**: Full ticket details with parsed descriptions and comments
- **Markdown Support**: JIRA wiki markup converted to HTML with proper styling

### GitHub Integration
- **PR Search**: Automatic search for PRs mentioning JIRA tickets
- **Detailed Information**: Reviews, check runs, and merge status
- **Reviewer Tracking**: Visual badges for review states (approved, changes requested, etc.)
- **Status Indicators**: Check run results and rebase requirements

### User Experience
- **Resizable Columns**: Drag-to-resize JIRA and GitHub panes with persistent sizes
- **Responsive Design**: Adapts to different screen sizes
- **Persistent State**: All user preferences saved to localStorage
- **Error Handling**: Graceful error states with user-friendly messages
- **Loading States**: Visual feedback during API calls

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- Yarn package manager

### Installation
```bash
cd ocmui-team-dashboard
yarn install
```

### Development
```bash
# Start development server with hot-reload
yarn start:dev

# Build and start production server
yarn start
```

### Configuration
1. Click the **Settings** button in the header
2. Configure your API tokens:
   - **GitHub Token**: Personal access token with `public_repo`, `repo:status`, `read:user` scopes
   - **GitHub Username**: Your GitHub username for PR filtering
   - **JIRA Token**: API token from your JIRA profile
3. Use the **Test** buttons to verify connectivity

## 📊 API Integration

### JIRA API
- Uses server-side proxy to avoid CORS issues
- Endpoints: `/api/test-jira`, `/api/jira-ticket`
- Fetches complete ticket data including comments and metadata

### GitHub API
- Direct API calls from browser
- Uses GitHub's search API and REST API
- Comprehensive PR data including reviews and check runs

## 🎨 Code Quality

### Documentation Standards
- **Comprehensive JSDoc**: Every function documented with purpose, parameters, and return values
- **Module Headers**: Clear descriptions of each module's purpose and responsibilities
- **Inline Comments**: Explanations for complex logic and business rules

### Organization Principles
- **Single Responsibility**: Each module has a clear, focused purpose
- **Separation of Concerns**: UI, business logic, and data management are separated
- **Dependency Injection**: Modules receive dependencies rather than importing directly
- **Error Boundaries**: Each module handles its own errors gracefully

### Maintainability Features
- **Modular Structure**: Easy to modify individual features without affecting others
- **Consistent Patterns**: Similar patterns used across modules for predictability
- **Utility Functions**: Common operations abstracted into reusable utilities
- **Debug Interface**: `window.OCMUIDebug` provides runtime inspection capabilities

## 🧪 Testing

The modular structure makes testing much easier:
- **Unit Testing**: Each module can be tested independently
- **Integration Testing**: Module interactions are clearly defined
- **Manual Testing**: Individual features can be tested in isolation

## 🔮 Future Enhancements

The modular architecture enables easy addition of new features:
- **New Tabs**: "Awaiting My Code Review" and "My PRs" tabs (modules already exist)
- **Additional Integrations**: New services can be added as separate modules
- **Enhanced UI**: New UI components can be added to the utils module
- **Data Sources**: Additional data sources can be integrated through the core modules

## 🐛 Development Debug Interface

Access `window.OCMUIDebug` in the browser console for:
- Current application state inspection
- Module registry
- Version information
- Development utilities

## 📝 Contributing

When adding new features:
1. **Choose the Right Module**: Add code to the appropriate existing module or create a new one
2. **Follow Patterns**: Use existing patterns for consistency
3. **Document Everything**: Add comprehensive JSDoc comments
4. **Handle Errors**: Provide graceful error handling and user feedback
5. **Test Thoroughly**: Verify both individual module functionality and integration

---

**Previous Structure**: 1300+ lines in a single `app.js` file with mixed concerns
**New Structure**: ~100 line orchestrator + 6 focused modules with clear responsibilities

This refactoring improves code maintainability, testability, and developer productivity while preserving all existing functionality.