// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/constants.js

export const CONSTANTS = {
    // DOM element IDs
    DOM_IDS: {
        SOURCE_CODE_PANEL: 'source-code-panel',
        FILE_TREE_PANEL: 'file-tree-panel',
        RESIZE_HANDLE: 'my-extension-resize-handle',
        HORIZONTAL_RESIZE_HANDLE: 'my-extension-horizontal-resize-handle',
        HIGHLIGHTED_LINE: 'highlighted-line'
    },
    // CSS Classes
    CLASSES: {
        EXTENSION_HIGHLIGHT: 'my-extension-highlight',
        LOCKED_HIGHLIGHT: 'locked-highlight',
        FILE_LOCKED_HIGHLIGHT: 'file-locked-highlight',
        TREE_FILE: 'tree-file',
        TREE_FILE_SELECTED: 'tree-file-selected',
        TREE_FILE_HOVER_SELECTED: 'tree-file-hover-selected',
        TREE_FOLDER: 'tree-folder',
        TREE_FOLDER_SELECTED: 'tree-folder-selected',
        TREE_CHILDREN: 'tree-children',
        TREE_INDENT: 'tree-indent',
        TREE_EXPAND_ICON: 'tree-expand-icon',
        FILE_TREE_NODE: 'file-tree-node',
        FILE_TREE_REFRESH: 'file-tree-refresh',
        FILE_TREE_TITLE: 'file-tree-title',
        TREE_LOCK_ICON: 'tree-lock-icon',
        HIGHLIGHTED_SOURCE_LINE: 'highlighted-source-line', // Used in panelController for class, and here for CSS
        HOVER_HIGHLIGHTED_SOURCE_LINE: 'hover-highlighted-source-line',
        FILE_HIGHLIGHTED_SOURCE_LINE: 'file-highlighted-source-line',
        SEARCH_MATCH_HIGHLIGHT: 'search-match-highlight',
        SEARCH_MATCH_ACTIVE: 'search-match-active'
    },
    // URLs
    URLS: {
        BASE_API_URL: 'https://prod.foo.redhat.com:1337'
    },
    // Storage keys
    STORAGE_KEYS: {
        EXTENSION_ENABLED: 'extensionEnabled'
    },
    // Sizes and dimensions <<<< --- CHECK THIS SECTION CAREFULLY
    SIZES: {
        MIN_PANEL_HEIGHT: 50,
        MAX_PANEL_HEIGHT_RATIO: 0.8,
        MIN_PANEL_WIDTH: 200,
        MAX_PANEL_WIDTH_RATIO: 0.8,
        DEFAULT_RIGHT_PANEL_WIDTH: 375,
        HEADER_HEIGHT: 40
    },
    // Key bindings
    KEYS: {
        TOGGLE_EXTENSION: { key: 'T', requiresAlt: true, requiresShift: true },
        TOGGLE_LOCK: { key: 'l', caseSensitive: false }
    }
};

// Box layout styles for DOM hierarchy view - REMOVING THESE
export const additionalStyles = `
    /* No additional styles needed for now. */

    /* AI Analysis Tab specific styles */
    .ai-analysis-results-area {
        line-height: 1.6;       /* Increased for readability */
        padding-top: 5px; 
        white-space: normal !important; /* Key change: Collapse whitespace */
    }

    .ai-analysis-results-area > *:first-child {
        margin-top: 0 !important; 
    }

    /* Modest spacing for block elements */
    .ai-analysis-results-area p,
    .ai-analysis-results-area ol,
    .ai-analysis-results-area ul,
    .ai-analysis-results-area h1,
    .ai-analysis-results-area h2,
    .ai-analysis-results-area h3,
    .ai-analysis-results-area h4,
    .ai-analysis-results-area h5,
    .ai-analysis-results-area h6 {
        margin-top: 0.5em !important; 
        margin-bottom: 0.75em !important; /* Primary spacing between blocks */
        padding: 0 !important;
    }
    
    .ai-analysis-results-area ol,
    .ai-analysis-results-area ul {
        padding-left: 25px !important; /* Standard list indentation */
        /* Margins are handled by the general block rule above */
    }
    
    .ai-analysis-results-area li {
        margin-bottom: 0.3em !important; /* Space after each list item */
        margin-top: 0 !important;
        padding: 0 !important;   
    }

    .ai-analysis-results-area li > p {
        margin: 0 !important; 
        padding: 0 !important; 
    }

    .ai-analysis-results-area li > ol,
    .ai-analysis-results-area li > ul {
        margin-top: 0.3em !important;    /* Space before a nested list */
        margin-bottom: 0.3em !important; /* Space after a nested list */
        padding-left: 20px !important;   /* Indent nested lists further */
    }

    .ai-analysis-results-area hr {
        display: none !important; 
    }

    .ai-analysis-results-area code, 
    .ai-analysis-filename { 
      background-color: #4a4a4a !important; 
      color: #f0f0f0 !important; 
      padding: 1px 4px !important; 
      border-radius: 3px !important;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace !important;
      font-size: inherit !important; 
    }
`;


// CSS styles function
export function getBaseStyles(CONSTS_ARG) { // Renamed argument for clarity
    // Ensure CONSTS_ARG and its properties are defined before trying to access them
    if (!CONSTS_ARG || !CONSTS_ARG.CLASSES || !CONSTS_ARG.DOM_IDS || !CONSTS_ARG.SIZES) {
        console.error("[SourceViewer][Constants] getBaseStyles called with incomplete CONSTS_ARG:", CONSTS_ARG);
        // Fallback to an empty string or minimal styles to prevent further errors
        return `/* ERROR: CONSTS_ARG not properly defined for getBaseStyles */`;
    }

    return `
    .${CONSTS_ARG.CLASSES.EXTENSION_HIGHLIGHT} { /* Page element hover highlight */
        border-radius: 10px;
        box-shadow: 0 0 8px 2px #2F8464; /* Green glow */
    }

    .${CONSTS_ARG.CLASSES.FILE_LOCKED_HIGHLIGHT} { /* Page element file-locked highlight */
        border-radius: 6px;
        border: 2px solid #FF8C00; /* Orange border */
        box-shadow: none;
    }

    .${CONSTS_ARG.CLASSES.LOCKED_HIGHLIGHT} { /* Page element explicitly locked highlight */
        border: 2px solid red;
    }

    #${CONSTS_ARG.DOM_IDS.SOURCE_CODE_PANEL} {
        position: fixed; bottom: 0; left: 0;
        width: calc(100% - ${CONSTS_ARG.SIZES.DEFAULT_RIGHT_PANEL_WIDTH}px); /* Uses SIZES */
        height: 50%; /* Default height */
        background-color: #272822; color: #F8F8F2; border-top: 1px solid #ddd;
        overflow: hidden; padding: 0; box-sizing: border-box; z-index: 9999; display: none;
    }

    #${CONSTS_ARG.DOM_IDS.FILE_TREE_PANEL} {
        position: fixed; bottom: 0; right: 0;
        width: ${CONSTS_ARG.SIZES.DEFAULT_RIGHT_PANEL_WIDTH}px; /* Uses SIZES */
        height: 50%; /* Default height */
        background-color: #272822; color: #F8F8F2; border-top: 1px solid #ddd;
        border-left: 1px solid #444; padding: 0; box-sizing: border-box; z-index: 9999;
        display: none; flex-direction: column; overflow: hidden;
    }

    #${CONSTS_ARG.DOM_IDS.RESIZE_HANDLE} {
        position: fixed; bottom: 50%; left: 0; width: 100%; height: 5px;
        background-color: gray; cursor: ns-resize; z-index: 10000; display: none;
    }

    #${CONSTS_ARG.DOM_IDS.HORIZONTAL_RESIZE_HANDLE} {
        position: fixed; bottom: 0;
        left: calc(100% - ${CONSTS_ARG.SIZES.DEFAULT_RIGHT_PANEL_WIDTH}px); /* Uses SIZES */
        width: 5px; height: 50%; background-color: gray; cursor: ew-resize;
        z-index: 10000; display: none;
    }

    .${CONSTS_ARG.CLASSES.FILE_TREE_NODE} { padding: 3px 0; white-space: nowrap; }
    .${CONSTS_ARG.CLASSES.FILE_TREE_NODE}:hover { background-color: #3E3D32; }
    .${CONSTS_ARG.CLASSES.TREE_FOLDER} { color: #66D9EF; cursor: pointer; }
    .${CONSTS_ARG.CLASSES.TREE_FILE} { color: #A6E22E; cursor: pointer; }
    .${CONSTS_ARG.CLASSES.TREE_FILE_SELECTED} { color: #FF8C00 !important; }
    .${CONSTS_ARG.CLASSES.TREE_FILE_HOVER_SELECTED} { color: white !important; }
    .${CONSTS_ARG.CLASSES.TREE_FOLDER_SELECTED} { color: white !important; }

    .${CONSTS_ARG.CLASSES.HIGHLIGHTED_SOURCE_LINE} {
        background-color: #2F8464 !important;
        display: block;
    }
    .${CONSTS_ARG.CLASSES.HOVER_HIGHLIGHTED_SOURCE_LINE} {
        background-color: rgba(47, 132, 100, 0.4) !important;
        color: #E6E6E6 !important;
        display: block;
    }
    .${CONSTS_ARG.CLASSES.FILE_HIGHLIGHTED_SOURCE_LINE} {
        background-color: rgba(255, 140, 0, 0.3) !important;
        color: #FFD700 !important;
        display: block;
    }

    .file-tree-node-selected { background-color: #2F8464; width: 100%; }
    .${CONSTS_ARG.CLASSES.TREE_EXPAND_ICON} { display: inline-block; width: 16px; text-align: center; color: #FD971F; }
    .${CONSTS_ARG.CLASSES.TREE_INDENT} { display: inline-block; width: 16px; }
    .${CONSTS_ARG.CLASSES.TREE_LOCK_ICON} { display: inline-block; width: 16px; margin-left: 5px; text-align: center; color: #F92672; }
    .${CONSTS_ARG.CLASSES.FILE_TREE_REFRESH} {
        position: absolute; top: 10px; right: 10px; background-color: #66D9EF;
        color: #272822; border: none; border-radius: 3px; cursor: pointer;
        padding: 3px 8px; font-size: 12px;
    }
    .${CONSTS_ARG.CLASSES.FILE_TREE_REFRESH}:hover { background-color: #A6E22E; }
    .${CONSTS_ARG.CLASSES.FILE_TREE_TITLE} { font-weight: bold; font-size: 16px; margin: 0; padding: 0; }

    .file-tree-header {
        position: sticky; top: 0; background-color: #272822; padding: 0 10px;
        border-bottom: 1px solid #444; z-index: 1; height: ${CONSTS_ARG.SIZES.HEADER_HEIGHT}px; /* Uses SIZES */
        display: flex; align-items: center;
    }
    .source-code-header {
        padding: 0 10px; border-bottom: 1px solid #444;
        background-color: #272822; 
        height: ${CONSTS_ARG.SIZES.HEADER_HEIGHT}px; /* Uses SIZES */
        display: flex; align-items: center;
        font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        box-sizing: border-box; /* Add for consistency */
        flex-shrink: 0; /* Prevent shrinking in flex layout */
    }
    .source-code-header strong { font-size: 16px; }
    .file-tree-content {
        flex: 1; overflow-y: auto; overflow-x: auto; padding: 10px;
        max-height: calc(100% - ${CONSTS_ARG.SIZES.HEADER_HEIGHT}px); /* Uses SIZES */
        box-sizing: border-box;
    }
    .source-code-content {
        flex-grow: 1; /* Make it take remaining vertical space */
        min-height: 0; /* Important for overflow in flex items */
        overflow-y: auto; overflow-x: auto; padding: 10px; box-sizing: border-box;
    }

    .${CONSTS_ARG.CLASSES.SEARCH_MATCH_HIGHLIGHT} {
        background-color: yellow; /* Standard highlight */
        color: black;
        border-radius: 2px;
    }

    .${CONSTS_ARG.CLASSES.SEARCH_MATCH_ACTIVE} {
        background-color: #FF8C00; /* Orange for active selection (fixed quotes) */
        color: white; /* Ensure good contrast with orange */
        border-radius: 2px;
    }

    /* additionalStyles should be appended after this string by the caller */
`;
}