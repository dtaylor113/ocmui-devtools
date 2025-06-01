// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/state.js
import { CONSTANTS } from './constants.js';

export let state = {
    isInitialized: false,
    isLocked: false,            // For 'L' key page element lock
    lockedElement: null,        // The page element locked by 'L' key
    currentHoveredElement: null,// Element currently under mouse on page
    lockedFile: null,           // Path of file selected/locked from tree view
    elementHighlighting: true,  // True if source panel header color should be 'hover' color (green)
    extensionEnabled: false,
    isResizing: false,
    isHorizontalResizing: false,
    lastY: 0,
    lastX: 0,
    eventListenersAttached: false,
    rightPanelWidth: CONSTANTS.SIZES.DEFAULT_RIGHT_PANEL_WIDTH,
    panelHeight: '50%', // Added: Default panel height, can be '50%' or a pixel value like '300px'
    fileTree: {},               // Holds data for the File Tree tab (can be file list or empty)
    activeRightPanelTab: 'fileTree', // Default active tab: 'fileTree' or 'aiChat'
    // isRefreshingHierarchy: false, // Was a potential flag, not needed now

    // Search state
    searchTerm: '',
    searchResults: [], // Stores { lineElement: node, startOffset: int, endOffset: int, textNode: node } or similar
    currentSearchIndex: -1,
    lastClickedSourceLine: null, // Added for new search behavior

    // AI Chat Context
    currentSourceCodePathForAIChat: null,
    currentSourceCodeContentForAIChat: null,
};

export let elements = {
    panel: null,                    // Left source code panel
    rightPanelContainer: null,      // Main container for the right panel (with tabs)
    rightPanelContentArea: null,    // Div inside rightPanelContainer where tab content goes
    // domHierarchyTabButton: null, // Removed
    resizeHandle: null,             // Vertical resize
    horizontalResizeHandle: null,   // Horizontal resize
    styleElement: null,

    // Find bar elements
    findInput: null,
    findNextButton: null,
    findPrevButton: null,
    findCounter: null,
    findClearButton: null,
    sourceCodeContentContainer: null // Will store reference to 'codeContainer' from panelController
};

// boxToElementMap was for DOM Hierarchy, can be removed.
// export let boxToElementMap = new WeakMap();

export function updateState(newState) {
    // Simple merge, could be more sophisticated if needed
    // logger.log('debug', 'State update:', newState); // Can be very verbose
    Object.assign(state, newState);
}

export function getElement(key) {
    return elements[key];
}

export function setElement(key, value) {
    elements[key] = value;
}