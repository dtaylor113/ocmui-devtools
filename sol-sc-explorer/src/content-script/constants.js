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
        FILE_HIGHLIGHTED_SOURCE_LINE: 'file-highlighted-source-line'
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

// Box layout styles for DOM hierarchy view
export const additionalStyles = `
    /* Box layout for DOM hierarchy view */
    .hierarchy-box { /* ... */ }
    /* ... (rest of additionalStyles as before) ... */
    .hierarchy-box { border: 1px solid #444; border-radius: 4px; margin: 5px 0; padding: 8px; background-color: #2A2A2A; position: relative; min-height: 24px; transition: background-color 0.2s; }
    .hierarchy-box:hover { border: 1px solid #FF8C00; background-color: transparent !important; }
    .hierarchy-box-content { padding-left: 8px; margin-top: 5px; }
    .hierarchy-box-selected { border: 2px solid #FF8C00 !important; }
    .hierarchy-box-label { display: block; font-size: 12px; color: #F8F8F2; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hierarchy-box-label-selected { color: #FF8C00; }
    .hierarchy-box-label .filename { color: #66D9EF; }
    .hierarchy-box-label .line { color: #A6E22E; }
    .hierarchy-box-label .element-text { color: #FD971F; }
    .hierarchy-box-label .path-info { color: #75715E; font-size: 11px; }
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
        padding: 0 10px; border-bottom: 1px solid #444; position: absolute;
        top: 0; left: 0; right: 0; background-color: #272822; z-index: 1;
        height: ${CONSTS_ARG.SIZES.HEADER_HEIGHT}px; /* Uses SIZES */
        display: flex; align-items: center;
        font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .source-code-header strong { font-size: 16px; }
    .file-tree-content {
        flex: 1; overflow-y: auto; overflow-x: auto; padding: 10px;
        max-height: calc(100% - ${CONSTS_ARG.SIZES.HEADER_HEIGHT}px); /* Uses SIZES */
        box-sizing: border-box;
    }
    .source-code-content {
        position: absolute; top: ${CONSTS_ARG.SIZES.HEADER_HEIGHT}px; /* Uses SIZES */
        left: 0; right: 0; bottom: 0;
        overflow-y: auto; overflow-x: auto; padding: 10px; box-sizing: border-box;
    }
    /* additionalStyles should be appended after this string by the caller */
`;
}