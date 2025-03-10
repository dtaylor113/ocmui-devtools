/**
 * Source Code Viewer Extension
 *
 * A browser extension that enhances source code visibility on web pages
 * by highlighting code elements and displaying file trees.
 */

// ===================================================================
// 1. CONSTANTS
// ===================================================================

const CONSTANTS = {
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
        HIGHLIGHTED_SOURCE_LINE: 'highlighted-source-line',
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

    // Sizes and dimensions
    SIZES: {
        MIN_PANEL_HEIGHT: 50,
        MAX_PANEL_HEIGHT_RATIO: 0.8,
        MIN_PANEL_WIDTH: 200,
        MAX_PANEL_WIDTH_RATIO: 0.8,
        DEFAULT_RIGHT_PANEL_WIDTH: 375,
        HEADER_HEIGHT: 40 // Standardized header height for both panels
    },

    // Key bindings
    KEYS: {
        TOGGLE_EXTENSION: { key: 'T', requiresAlt: true, requiresShift: true },
        TOGGLE_LOCK: { key: 'l', caseSensitive: false }
    }
};

// CSS styles with added tree view panel and resize functionality
const styles = `
    .${CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT} {
        border-radius: 10px;
        box-shadow: 0 0 8px 2px #2F8464;
    }
    
    .${CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT} {
        border-radius: 6px;
        border: 2px solid #FF8C00;
        box-shadow: none;
    }
    
    .${CONSTANTS.CLASSES.LOCKED_HIGHLIGHT} {
        border: 2px solid red;
    }
    
    #${CONSTANTS.DOM_IDS.SOURCE_CODE_PANEL} {
        position: fixed;
        bottom: 0;
        left: 0;
        width: calc(100% - ${CONSTANTS.SIZES.DEFAULT_RIGHT_PANEL_WIDTH}px);
        height: 50%;
        background-color: #272822;
        color: #F8F8F2;
        border-top: 1px solid #ddd;
        overflow: hidden;
        padding: 0;
        box-sizing: border-box;
        z-index: 9999;
        display: none;
    }
    
    #${CONSTANTS.DOM_IDS.FILE_TREE_PANEL} {
        position: fixed;
        bottom: 0;
        right: 0;
        width: ${CONSTANTS.SIZES.DEFAULT_RIGHT_PANEL_WIDTH}px;
        height: 50%;
        background-color: #272822;
        color: #F8F8F2;
        border-top: 1px solid #ddd;
        border-left: 1px solid #444;
        padding: 0;
        box-sizing: border-box;
        z-index: 9999;
        display: none;
        display: flex;
        flex-direction: column;
        overflow: hidden; /* Prevent outer panel from scrolling */
    }
    
    #${CONSTANTS.DOM_IDS.RESIZE_HANDLE} {
        position: fixed;
        bottom: 50%;
        left: 0;
        width: 100%;
        height: 5px;
        background-color: gray;
        cursor: ns-resize;
        z-index: 10000;
        display: none;
    }
    
    #${CONSTANTS.DOM_IDS.HORIZONTAL_RESIZE_HANDLE} {
        position: fixed;
        bottom: 0;
        left: calc(100% - ${CONSTANTS.SIZES.DEFAULT_RIGHT_PANEL_WIDTH}px);
        width: 5px;
        height: 50%;
        background-color: gray;
        cursor: ew-resize;
        z-index: 10000;
        display: none;
    }
    
    .${CONSTANTS.CLASSES.FILE_TREE_NODE} {
        padding: 3px 0;
        white-space: nowrap;
    }
    
    .${CONSTANTS.CLASSES.FILE_TREE_NODE}:hover {
        background-color: #3E3D32;
    }
    
    .${CONSTANTS.CLASSES.TREE_FOLDER} {
        color: #66D9EF;
        cursor: pointer;
    }
    
    .${CONSTANTS.CLASSES.TREE_FILE} {
        color: #A6E22E;
        cursor: pointer;
    }
    
    .${CONSTANTS.CLASSES.TREE_FILE_SELECTED} {
        color: #FF8C00 !important; /* Orange for file-based selection */
    }
    
    .${CONSTANTS.CLASSES.TREE_FILE_HOVER_SELECTED} {
        color: white !important; /* White for hover-based selection */
    }
    
    .${CONSTANTS.CLASSES.TREE_FOLDER_SELECTED} {
        color: white !important;
    }
    
    .${CONSTANTS.CLASSES.HOVER_HIGHLIGHTED_SOURCE_LINE} {
        background-color: rgba(47, 132, 100, 0.5); 
        color: white; 
        display: block;
    }
    
    .${CONSTANTS.CLASSES.FILE_HIGHLIGHTED_SOURCE_LINE} {
        background-color: rgba(47, 132, 100, 0.5); 
        color: #FF8C00; 
        display: block;
    }
    
    /* New class for selected tree nodes */
    .file-tree-node-selected {
        background-color: #2F8464;
        width: 100%;
    }
    
    .${CONSTANTS.CLASSES.TREE_EXPAND_ICON} {
        display: inline-block;
        width: 16px;
        text-align: center;
        color: #FD971F;
    }
    
    .${CONSTANTS.CLASSES.TREE_INDENT} {
        display: inline-block;
        width: 16px;
    }
    
    .${CONSTANTS.CLASSES.TREE_LOCK_ICON} {
        display: inline-block;
        width: 16px;
        margin-left: 5px;
        text-align: center;
        color: #F92672;
    }
    
    .${CONSTANTS.CLASSES.FILE_TREE_REFRESH} {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: #66D9EF;
        color: #272822;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        padding: 3px 8px;
        font-size: 12px;
    }
    
    .${CONSTANTS.CLASSES.FILE_TREE_REFRESH}:hover {
        background-color: #A6E22E;
    }
    
    .${CONSTANTS.CLASSES.FILE_TREE_TITLE} {
        font-weight: bold;
        font-size: 16px;
        margin: 0;
        padding: 0;
    }
    
    .file-tree-header {
        position: sticky;
        top: 0;
        background-color: #272822;
        padding: 0 10px;
        border-bottom: 1px solid #444;
        z-index: 1;
        height: ${CONSTANTS.SIZES.HEADER_HEIGHT}px;
        display: flex;
        align-items: center;
    }
    
    .source-code-header {
        padding: 0 10px;
        border-bottom: 1px solid #444;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        background-color: #272822;
        z-index: 1;
        height: ${CONSTANTS.SIZES.HEADER_HEIGHT}px;
        display: flex;
        align-items: center;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .source-code-header strong {
        font-size: 16px;
        /* Color is now set dynamically in the updateBottomPanel function */
    }
    
    .file-tree-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: auto;
        padding: 10px;
        max-height: calc(100% - ${CONSTANTS.SIZES.HEADER_HEIGHT}px);
        box-sizing: border-box;
    }
    
    .source-code-content {
        position: absolute;
        top: ${CONSTANTS.SIZES.HEADER_HEIGHT}px;
        left: 0;
        right: 0;
        bottom: 0;
        overflow-y: auto;
        overflow-x: auto;
        padding: 10px;
        box-sizing: border-box;
    }
`;

// ===================================================================
// 2. STATE MANAGEMENT
// ===================================================================

// Application state
let state = {
    isInitialized: false,
    isLocked: false,
    lockedElement: null,
    lockedFile: null,
    elementHighlighting: false,
    extensionEnabled: false,
    isResizing: false,
    isHorizontalResizing: false,
    lastY: 0,
    lastX: 0,
    eventListenersAttached: false,
    rightPanelWidth: CONSTANTS.SIZES.DEFAULT_RIGHT_PANEL_WIDTH,
    fileTree: {},
    viewMode: 'filetree',           // New property: 'filetree' or 'domhierarchy'
    originalFileTree: {}            // New property: Store original tree when in hierarchy view
};

// UI elements
let elements = {
    panel: null,
    fileTreePanel: null,
    resizeHandle: null,
    horizontalResizeHandle: null,
    styleElement: null
};

// ===================================================================
// 3. UTILITY FUNCTIONS
// ===================================================================

// Centralized logging utility
const logger = {
    // Log levels: error, warn, info, debug
    logLevel: 'info',
    levels: { error: 0, warn: 1, info: 2, debug: 3 },

    log: function(level, message) {
        if (this.levels[level] <= this.levels[this.logLevel]) {
            switch(level) {
                case 'error':
                    console.error(`[SourceViewer] ${message}`);
                    break;
                case 'warn':
                    console.warn(`[SourceViewer] ${message}`);
                    break;
                case 'info':
                    console.log(`[SourceViewer] ${message}`);
                    break;
                case 'debug':
                    console.log(`[SourceViewer][Debug] ${message}`);
                    break;
            }
        }
    }
};

// DOM utility functions
const domUtils = {
    // Create an element with attributes and properties
    createElement: function(tag, options = {}) {
        const element = document.createElement(tag);

        // Set attributes
        if (options.attributes) {
            for (const [key, value] of Object.entries(options.attributes)) {
                element.setAttribute(key, value);
            }
        }

        // Set properties
        if (options.properties) {
            for (const [key, value] of Object.entries(options.properties)) {
                element[key] = value;
            }
        }

        // Add classes
        if (options.classes) {
            options.classes.forEach(cls => element.classList.add(cls));
        }

        // Set styles directly
        if (options.styles) {
            for (const [key, value] of Object.entries(options.styles)) {
                element.style[key] = value;
            }
        }

        // Set text content
        if (options.textContent) {
            element.textContent = options.textContent;
        }

        // Set inner HTML
        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }

        // Add event listeners
        if (options.eventListeners) {
            for (const [event, listener] of Object.entries(options.eventListeners)) {
                element.addEventListener(event, listener);
            }
        }

        return element;
    },

    // Show or hide an element
    setElementVisibility: function(element, isVisible) {
        if (element) {
            element.style.display = isVisible ? 'block' : 'none';
        }
    },

    // Safely append element to parent with fallback
    appendElement: function(element, parent = document.body) {
        try {
            parent.appendChild(element);
            return true;
        } catch (error) {
            // Try alternative approach for Arc browser
            try {
                document.documentElement.appendChild(element);
                return true;
            } catch (fallbackError) {
                logger.log('error', `Failed to append element: ${fallbackError.message}`);
                return false;
            }
        }
    }
};

// Debounce function to limit event firing
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Browser compatibility layer
const browserCompat = {
    // Detect browser environment
    detectBrowser: function () {
        const isBrowser = typeof window !== 'undefined';
        const isChrome = isBrowser && !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
        const isFirefox = isBrowser && typeof InstallTrigger !== 'undefined';
        const isEdge = isBrowser && navigator.userAgent.indexOf("Edg") !== -1;
        const isArc = isBrowser && navigator.userAgent.indexOf("Arc") !== -1;

        return {
            isChrome,
            isFirefox,
            isEdge,
            isArc,
            name: isChrome ? 'Chrome' :
                isFirefox ? 'Firefox' :
                    isEdge ? 'Edge' :
                        isArc ? 'Arc' :
                            'Unknown'
        };
    },

    // Load state from storage
    loadStateFromStorage: function (callback) {
        try {
            // Check if chrome.storage is available (Chrome, Edge, Arc)
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED, function (data) {
                    const isEnabled = data[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED] !== undefined ?
                        Boolean(data[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED]) : true;
                    logger.log('info', `Loaded state from chrome storage: ${isEnabled}`);
                    callback(isEnabled);
                });

                // Also listen for storage changes
                chrome.storage.onChanged.addListener(function (changes, namespace) {
                    if (namespace === 'local' && changes[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED]) {
                        const isEnabled = Boolean(changes[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED].newValue);
                        logger.log('info', `State changed in storage: ${isEnabled}`);
                        callback(isEnabled);
                    }
                });

                return true;
            }
            // Check if browser.storage is available (Firefox)
            else if (typeof browser !== 'undefined' && browser.storage) {
                browser.storage.local.get(CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED).then(data => {
                    const isEnabled = data[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED] !== undefined ?
                        Boolean(data[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED]) : true;
                    logger.log('info', `Loaded state from browser storage: ${isEnabled}`);
                    callback(isEnabled);
                });

                // Also listen for storage changes in Firefox
                browser.storage.onChanged.addListener(function (changes, namespace) {
                    if (namespace === 'local' && changes[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED]) {
                        const isEnabled = Boolean(changes[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED].newValue);
                        logger.log('info', `State changed in storage: ${isEnabled}`);
                        callback(isEnabled);
                    }
                });

                return true;
            }
            // Fallback for Arc or other browsers if storage API fails
            else {
                logger.log('info', 'No storage API detected, defaulting to enabled');
                callback(true);
                return false;
            }
        } catch (error) {
            logger.log('error', `Error accessing storage API: ${error.message}`);
            logger.log('info', 'Defaulting extension to enabled state');
            callback(true);
            return false;
        }
    },

    // Setup message listeners for different browsers
    setupMessageListeners: function(callback) {
        // Detect browser environment
        const isFirefox = typeof browser !== 'undefined';
        const isChrome = !isFirefox && typeof chrome !== 'undefined';
        const runtime = isFirefox ? browser.runtime : (isChrome ? chrome.runtime : null);

        // First try to clean up any previous message handlers
        try {
            if (window._extensionMessageHandler && runtime) {
                try {
                    runtime.onMessage.removeListener(window._extensionMessageHandler);
                    logger.log('debug', 'Removed existing message listener');
                } catch (e) {
                    logger.log('debug', 'Could not remove existing listener: ' + e.message);
                }
            }
        } catch (error) {
            logger.log('debug', 'Error cleaning up message listeners: ' + error.message);
        }

        // Exit early if no runtime API available
        if (!runtime) {
            logger.log('info', 'No runtime API detected for messaging');
            return false;
        }

        // Create message handler functions for Chrome and Firefox
        // They're different because Firefox uses promises for responses
        if (isFirefox) {
            // Firefox handler
            window._extensionMessageHandler = function(message) {
                try {
                    // Validate message
                    if (!message || typeof message !== 'object') {
                        logger.log('error', 'Received invalid message format in Firefox');
                        return Promise.resolve({error: "Invalid message format"});
                    }

                    logger.log('debug', `Firefox content script received message: ${JSON.stringify(message)}`);

                    if (message.action === "toggleExtensionPlugin") {
                        callback(Boolean(message.checked));
                        return Promise.resolve({status: "OK"});
                    }

                    return Promise.resolve({status: "Unknown action"});
                } catch (error) {
                    logger.log('error', `Error processing message in Firefox: ${error.message}`);
                    return Promise.resolve({error: error.message});
                }
            };

            // Add the listener in Firefox
            browser.runtime.onMessage.addListener(window._extensionMessageHandler);
            logger.log('info', 'Firefox message listener attached');
        } else {
            // Chrome/Arc handler
            window._extensionMessageHandler = function(message, sender, sendResponse) {
                try {
                    // Validate message
                    if (!message || typeof message !== 'object') {
                        logger.log('error', 'Received invalid message format in Chrome');
                        sendResponse({error: "Invalid message format"});
                        return false;
                    }

                    logger.log('debug', `Chrome content script received message: ${JSON.stringify(message)}`);

                    if (message.action === "toggleExtensionPlugin") {
                        callback(Boolean(message.checked));
                        sendResponse({status: "OK"});
                    } else {
                        sendResponse({status: "Unknown action"});
                    }
                } catch (error) {
                    logger.log('error', `Error processing message in Chrome: ${error.message}`);
                    sendResponse({error: error.message});
                }
                return false; // No async response
            };

            // Add the listener in Chrome/Arc
            chrome.runtime.onMessage.addListener(window._extensionMessageHandler);
            logger.log('info', 'Chrome message listener attached');
        }

        // Set up a fallback for other communication methods
        try {
            window.addEventListener('message', function(event) {
                try {
                    const data = event.data;
                    if (data && typeof data === 'object' && data.action === "toggleExtensionPlugin") {
                        callback(Boolean(data.checked));
                    }
                } catch (e) {
                    logger.log('error', 'Error processing window message: ' + e.message);
                }
            });
        } catch (e) {
            logger.log('warn', 'Could not setup window message listener: ' + e.message);
        }

        return true;
    }
};

// HTML escape function
function escapeHtml(html) {
    return html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Helper function to get a readable identifier for an element
function getElementIdentifier(element) {
    let identifier = element.tagName.toLowerCase();

    if (element.id) {
        identifier += `#${element.id}`;
    } else if (element.className) {
        // Format class list properly
        const classList = Array.from(element.classList)
            .filter(cls => !cls.startsWith('my-extension-') &&
                !cls.includes('highlight') &&
                !cls.includes('locked'))
            .join('.');
        if (classList) {
            identifier += `.${classList}`;
        }
    }

    // Add a hint about element content if it's short
    const textContent = element.textContent?.trim().substring(0, 20);
    if (textContent && textContent.length > 0) {
        identifier += ` "${textContent}${textContent.length > 20 ? '...' : ''}"`;
    }

    return identifier;
}

// ===================================================================
// 4. UI COMPONENT FUNCTIONS
// ===================================================================

// Initialize UI components
function initializeUI() {
    if (elements.panel) return; // Already initialized

    logger.log('info', 'Initializing UI components');

    try {
        // Add styles
        elements.styleElement = document.createElement('style');
        elements.styleElement.textContent = styles;
        document.head.appendChild(elements.styleElement);

        // Create UI elements with error handling
        elements.panel = domUtils.createElement('div', {
            attributes: { id: CONSTANTS.DOM_IDS.SOURCE_CODE_PANEL }
        });
        domUtils.appendElement(elements.panel);

        elements.fileTreePanel = domUtils.createElement('div', {
            attributes: { id: CONSTANTS.DOM_IDS.FILE_TREE_PANEL }
        });
        domUtils.appendElement(elements.fileTreePanel);

        elements.resizeHandle = domUtils.createElement('div', {
            attributes: { id: CONSTANTS.DOM_IDS.RESIZE_HANDLE },
            eventListeners: {
                mousedown: function(e) {
                    state.isResizing = true;
                    state.lastY = e.clientY;
                    e.preventDefault();
                }
            }
        });
        domUtils.appendElement(elements.resizeHandle);

        elements.horizontalResizeHandle = domUtils.createElement('div', {
            attributes: { id: CONSTANTS.DOM_IDS.HORIZONTAL_RESIZE_HANDLE },
            eventListeners: {
                mousedown: function(e) {
                    state.isHorizontalResizing = true;
                    state.lastX = e.clientX;
                    e.preventDefault();
                }
            }
        });
        domUtils.appendElement(elements.horizontalResizeHandle);

        // Successfully initialized
        state.isInitialized = true;
        logger.log('info', 'UI components initialized successfully');
    } catch (error) {
        logger.log('error', `Error initializing UI components: ${error.message}`);
    }
}

// Update panel with source code
function updateBottomPanel(elementInfo, fileContent) {
    if (!elements.panel) return;

    // Clear previous content
    elements.panel.innerHTML = '';

    // Create a fixed header for the filepath
    let pathSegments = elementInfo.sourceFile.split('/').filter(part => part.length > 0);
    let fileNameAndLineNumber = pathSegments.pop();

    // Create formatted path with smaller arrow and proper spacing
    const arrowSpan = '<span style="font-size: 10px; margin: 0 4px;"> ▶ </span>';
    let formattedPath = pathSegments.join(arrowSpan);

    // Determine header color based on whether we're in hover mode or tree selection mode
    const headerColor = state.elementHighlighting ? '#8fce00' : '#FF8C00';

    logger.log('debug', `Updating panel with state: locked=${state.isLocked}, elementHighlighting=${state.elementHighlighting}, lockedFile=${state.lockedFile}`);

    const header = domUtils.createElement('div', {
        classes: ['source-code-header'],
        innerHTML: formattedPath ?
            `/ ${formattedPath}${arrowSpan}<strong style="margin-left: 2px; color: ${headerColor};">${fileNameAndLineNumber}::${elementInfo.sourceLine}</strong>` :
            `/ <strong style="color: ${headerColor};">${fileNameAndLineNumber}::${elementInfo.sourceLine}</strong>`
    });

    // Create a container for the code with its own scrollbar
    const codeContainer = domUtils.createElement('div', {
        classes: ['source-code-content']
    });

    // Add the code to the container
    const preBlock = prepareSourceCode(fileContent, elementInfo);
    codeContainer.appendChild(preBlock);

    // Add both elements to the panel
    elements.panel.appendChild(header);
    elements.panel.appendChild(codeContainer);

    // Scroll to highlighted line
    setTimeout(() => {
        const highlightedLine = document.getElementById(CONSTANTS.DOM_IDS.HIGHLIGHTED_LINE);
        if (highlightedLine) {
            highlightedLine.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
    }, 0);

    // Highlight corresponding file in the tree view
    highlightTreeFile(elementInfo.sourceFile);
}

// Prepare source code display
function prepareSourceCode(fileContent, elementInfo) {
    const lines = fileContent.split('\n');
    const scrollToLine = parseInt(elementInfo.sourceLine);

    // Find all elements with this source file to highlight their lines
    let elementLines = [];

    try {
        // Always look for all elements with this source file, whether in hover or file-based mode
        const sourceFile = elementInfo.sourceFile;
        logger.log('debug', `Looking for elements with source file: ${sourceFile}`);

        // Use wildcard attribute selector to ensure we find all elements
        const elements = document.querySelectorAll(`[data-source-file]`);
        logger.log('debug', `Found ${elements.length} total elements with data-source-file attributes`);

        // Filter matching elements and collect their line numbers
        elements.forEach(element => {
            const elementSourceFile = element.getAttribute('data-source-file');
            if (elementSourceFile === sourceFile) {
                const line = parseInt(element.getAttribute('data-source-line'));
                if (!isNaN(line)) {
                    elementLines.push(line);
                    logger.log('debug', `Added line ${line} from element to highlight list`);
                }
            }
        });

        logger.log('debug', `Total matching lines to highlight: ${elementLines.length}`);
    } catch (e) {
        logger.log('warn', `Error finding element lines: ${e.message}`);
    }

    const formattedLines = lines.map((line, index) => {
        const escapedLine = escapeHtml(line);
        const lineNumber = index + 1;

        // Highlight the line we're scrolling to as the primary highlight
        if (lineNumber === scrollToLine) {
            // Choose color based on mode
            if (state.elementHighlighting) {
                return `<span id="${CONSTANTS.DOM_IDS.HIGHLIGHTED_LINE}" class="${CONSTANTS.CLASSES.HIGHLIGHTED_SOURCE_LINE}" style="background-color: #2F8464; color: white; display: block;">${lineNumber}: ${escapedLine}</span>`;
            } else {
                return `<span id="${CONSTANTS.DOM_IDS.HIGHLIGHTED_LINE}" class="${CONSTANTS.CLASSES.HIGHLIGHTED_SOURCE_LINE}" style="background-color: #2F8464; color: #FF8C00; display: block;">${lineNumber}: ${escapedLine}</span>`;
            }
        }
        // Highlight other lines that correspond to elements
        else if (elementLines.includes(lineNumber)) {
            // Choose color based on mode
            if (state.elementHighlighting) {
                return `<span class="${CONSTANTS.CLASSES.HOVER_HIGHLIGHTED_SOURCE_LINE}">${lineNumber}: ${escapedLine}</span>`;
            } else {
                return `<span class="${CONSTANTS.CLASSES.FILE_HIGHLIGHTED_SOURCE_LINE}">${lineNumber}: ${escapedLine}</span>`;
            }
        }
        // Regular line
        else {
            return `<span style="display: block;">${lineNumber}: ${escapedLine}</span>`;
        }
    }).join('');

    const preBlock = domUtils.createElement('pre', {
        styles: {
            fontSize: '12px',
            margin: '0',
            padding: '10px',
            border: 'none',
            backgroundColor: 'transparent',
            overflowX: 'auto',
            overflowY: 'visible'  // Remove the scrollbar from the pre element
        },
        innerHTML: `<code style="font-size: 12px;">${formattedLines}</code>`
    });

    return preBlock;
}

// Calculate line height
function getLineHeight(element) {
    const tempDiv = domUtils.createElement('div', {
        styles: {
            visibility: 'hidden',
            position: 'absolute',
            height: 'auto',
            width: 'auto',
            whiteSpace: 'nowrap'
        },
        textContent: 'A'
    });

    element.appendChild(tempDiv);
    const lineHeight = tempDiv.clientHeight;
    element.removeChild(tempDiv);

    return lineHeight;
}

// Helper to update the file tree header with view type
function updateFileTreeHeader(title) {
    if (elements.fileTreePanel) {
        const headerSection = elements.fileTreePanel.querySelector('.file-tree-header');
        if (headerSection) {
            const titleDiv = headerSection.querySelector(`.${CONSTANTS.CLASSES.FILE_TREE_TITLE}`);
            if (titleDiv) {
                // Set the title without any view type label
                titleDiv.textContent = title;
            }
        }
    }
}

// ===================================================================
// 5. FILE TREE FUNCTIONS
// ===================================================================

// Make sure all parent folders of a file are expanded
function ensureFileVisible(fileElement) {
    let parent = fileElement.parentElement;

    while (parent) {
        // If this is a child container that might be hidden
        if (parent.classList.contains(CONSTANTS.CLASSES.TREE_CHILDREN) && parent.style.display === 'none') {
            parent.style.display = 'block';

            // Update the collapse icon of the previous sibling
            const prevSibling = parent.previousElementSibling;
            if (prevSibling && prevSibling.classList.contains(CONSTANTS.CLASSES.FILE_TREE_NODE)) {
                const expandIcon = prevSibling.querySelector(`.${CONSTANTS.CLASSES.TREE_EXPAND_ICON}`);
                if (expandIcon) {
                    expandIcon.textContent = '▼';
                }
            }
        }
        parent = parent.parentElement;
    }
}

// Highlight parent folders that match part of the path
function highlightParentFolders(filePath) {
    const pathParts = filePath.split('/').filter(part => part.length > 0);

    // Find the scrollable content container
    const contentContainer = elements.fileTreePanel.querySelector('.file-tree-content');
    if (!contentContainer) {
        logger.log('error', 'Cannot find file-tree-content element for highlighting parent folders');
        return;
    }

    // Highlight any folder that matches a part of the path
    pathParts.forEach(part => {
        const folders = elements.fileTreePanel.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_FOLDER}`);
        folders.forEach(folder => {
            if (folder.textContent === part) {
                folder.classList.add(CONSTANTS.CLASSES.TREE_FOLDER_SELECTED);

                // Add selected background to parent node for full-width highlight
                const parentNode = folder.closest(`.${CONSTANTS.CLASSES.FILE_TREE_NODE}`);
                if (parentNode) {
                    parentNode.classList.add('file-tree-node-selected');
                }

                // Make sure the folder is visible
                let parent = folder.parentElement;
                while (parent) {
                    if (parent.classList.contains(CONSTANTS.CLASSES.TREE_CHILDREN) && parent.style.display === 'none') {
                        parent.style.display = 'block';

                        const prevSibling = parent.previousElementSibling;
                        if (prevSibling && prevSibling.classList.contains(CONSTANTS.CLASSES.FILE_TREE_NODE)) {
                            const expandIcon = prevSibling.querySelector(`.${CONSTANTS.CLASSES.TREE_EXPAND_ICON}`);
                            if (expandIcon) {
                                expandIcon.textContent = '▼';
                            }
                        }
                    }
                    parent = parent.parentElement;
                }

                // Scroll to the highlighted folder
                scrollElementToMiddle(folder, contentContainer);
            }
        });
    });
}

// Find and highlight page elements that are associated with a source file
function highlightPageElementsByFile(sourceFile, specificLine = null) {
    // First clear any existing highlights from previous file selections
    clearAllHighlights();

    // Set the state as locked to prevent hover interactions from removing highlights
    state.isLocked = true;
    state.elementHighlighting = false;
    state.lockedFile = sourceFile;

    logger.log('info', `Scanning for elements from file: ${sourceFile}`);
    try {
        // Find all elements with this source file
        const elements = document.querySelectorAll(`[data-source-file="${sourceFile}"]`);

        logger.log('info', `Found ${elements.length} elements for file: ${sourceFile}`);

        // Highlight all elements with the file-locked highlight style (orange)
        elements.forEach(element => {
            // Apply the file locked highlight style to all elements
            element.classList.add(CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT);
        });

        // If we have a specific line, find that element and scroll to it
        if (specificLine && elements.length > 0) {
            // Try to find the exact element with this line
            let targetElement = null;

            for (const element of elements) {
                const elementLine = element.getAttribute('data-source-line');
                if (elementLine === specificLine) {
                    targetElement = element;
                    break;
                }
            }

            // If we can't find the exact line, find the closest
            if (!targetElement) {
                logger.log('info', `No exact line match found for line ${specificLine}, finding closest`);

                // Convert all line numbers to numbers for comparison
                const elementLines = Array.from(elements).map(el => {
                    return {
                        element: el,
                        line: parseInt(el.getAttribute('data-source-line') || '0')
                    };
                });

                // Sort by closest line number to the specific line
                elementLines.sort((a, b) => {
                    return Math.abs(a.line - parseInt(specificLine)) - Math.abs(b.line - parseInt(specificLine));
                });

                if (elementLines[0]) {
                    targetElement = elementLines[0].element;
                }
            }

            // Scroll to the target element if found
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    } catch (error) {
        logger.log('error', `Error highlighting page elements: ${error.message}`);
    }
}

// Clear all highlighted elements on the page
function clearAllHighlights() {
    // Clear extension highlights (green - for hover)
    const highlightedElements = document.querySelectorAll(`.${CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT}`);
    highlightedElements.forEach(element => {
        element.classList.remove(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT);
    });

    // Clear file locked highlights (orange - for tree selection)
    const fileLockElements = document.querySelectorAll(`.${CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT}`);
    fileLockElements.forEach(element => {
        element.classList.remove(CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT);
    });

    // Clear any old red locked highlights
    const lockedElements = document.querySelectorAll(`.${CONSTANTS.CLASSES.LOCKED_HIGHLIGHT}`);
    lockedElements.forEach(element => {
        element.classList.remove(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT);
    });

    // Reset locked element state
    state.lockedElement = null;
    state.lockedFile = null;
}

// Remove all lock icons from file tree
function removeAllLockIcons() {
    const lockIcons = elements.fileTreePanel.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_LOCK_ICON}`);
    lockIcons.forEach(icon => {
        icon.remove();
    });
}

// Function to highlight a file in the tree view
function highlightTreeFile(filePath) {
    if (!elements.fileTreePanel) return;

    logger.log('info', `Highlighting file in tree: ${filePath}`);

    // Remove any existing lock icons first
    removeAllLockIcons();

    // First, clear any existing highlights
    const allFiles = elements.fileTreePanel.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_FILE}`);
    allFiles.forEach(file => {
        file.classList.remove(CONSTANTS.CLASSES.TREE_FILE_SELECTED);
        file.classList.remove(CONSTANTS.CLASSES.TREE_FILE_HOVER_SELECTED);
        // Also remove selected background from parent node
        const parentNode = file.closest(`.${CONSTANTS.CLASSES.FILE_TREE_NODE}`);
        if (parentNode) {
            parentNode.classList.remove('file-tree-node-selected');
        }
    });

    const allFolders = elements.fileTreePanel.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_FOLDER}`);
    allFolders.forEach(folder => {
        folder.classList.remove(CONSTANTS.CLASSES.TREE_FOLDER_SELECTED);
        // Also remove selected background from parent node
        const parentNode = folder.closest(`.${CONSTANTS.CLASSES.FILE_TREE_NODE}`);
        if (parentNode) {
            parentNode.classList.remove('file-tree-node-selected');
        }
    });

    // Find the scrollable content container
    const contentContainer = elements.fileTreePanel.querySelector('.file-tree-content');
    if (!contentContainer) {
        logger.log('error', 'Cannot find file-tree-content element');
        return;
    }

    // Find and highlight the file
    const fileElement = elements.fileTreePanel.querySelector(`.${CONSTANTS.CLASSES.TREE_FILE}[data-path="${filePath}"]`);
    if (fileElement) {
        // Apply the appropriate class based on hover vs. file selection mode
        if (state.elementHighlighting) {
            fileElement.classList.add(CONSTANTS.CLASSES.TREE_FILE_HOVER_SELECTED); // White text for hover mode
        } else {
            fileElement.classList.add(CONSTANTS.CLASSES.TREE_FILE_SELECTED); // Orange text for file selection mode
        }

        // Add selected background to parent node for full-width highlight
        const parentNode = fileElement.closest(`.${CONSTANTS.CLASSES.FILE_TREE_NODE}`);
        if (parentNode) {
            parentNode.classList.add('file-tree-node-selected');
        }

        // If this file is locked, add the lock icon
        if (state.lockedFile === filePath && !state.elementHighlighting) {
            const lockIcon = domUtils.createElement('span', {
                classes: [CONSTANTS.CLASSES.TREE_LOCK_ICON],
                textContent: '🔒',
                attributes: { 'title': 'Click to unlock' }
            });
            fileElement.parentNode.insertBefore(lockIcon, fileElement.nextSibling);
        }

        // Also make sure the file is visible by expanding all parent folders
        ensureFileVisible(fileElement);

        // Scroll the file into view and position it in the middle of the panel
        scrollElementToMiddle(fileElement, contentContainer);

        logger.log('info', `File found and highlighted: ${filePath}`);
    } else {
        logger.log('info', `File not found in tree: ${filePath}`);

        // Try to match by filename if full path doesn't match
        const fileName = filePath.split('/').pop();
        const fileByName = elements.fileTreePanel.querySelector(`.${CONSTANTS.CLASSES.TREE_FILE}[data-filename="${fileName}"]`);
        if (fileByName) {
            // Apply the appropriate class based on hover vs. file selection mode
            if (state.elementHighlighting) {
                fileByName.classList.add(CONSTANTS.CLASSES.TREE_FILE_HOVER_SELECTED); // White text for hover mode
            } else {
                fileByName.classList.add(CONSTANTS.CLASSES.TREE_FILE_SELECTED); // Orange text for file selection mode
            }

            // Add selected background to parent node for full-width highlight
            const parentNode = fileByName.closest(`.${CONSTANTS.CLASSES.FILE_TREE_NODE}`);
            if (parentNode) {
                parentNode.classList.add('file-tree-node-selected');
            }

            // If this file is locked, add the lock icon
            if (state.lockedFile === filePath && !state.elementHighlighting) {
                const lockIcon = domUtils.createElement('span', {
                    classes: [CONSTANTS.CLASSES.TREE_LOCK_ICON],
                    textContent: '🔒',
                    attributes: { 'title': 'Click to unlock' }
                });
                fileByName.parentNode.insertBefore(lockIcon, fileByName.nextSibling);
            }

            ensureFileVisible(fileByName);
            scrollElementToMiddle(fileByName, contentContainer);
            logger.log('info', `File found by name and highlighted: ${fileName}`);
        } else {
            // If we still can't find it, highlight parent folders that match part of the path
            highlightParentFolders(filePath);
        }
    }
}

// Helper function to scroll an element to the middle of its container
function scrollElementToMiddle(element, container) {
    if (!element || !container) {
        logger.log('debug', 'Missing element or container for scrolling');
        return;
    }

    logger.log('debug', `Scrolling element to middle. Container: ${container.className}`);

    try {
        // Calculate the position to scroll to
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Ensure element is fully visible in the container
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const containerVisibleHeight = container.clientHeight;
        const currentScroll = container.scrollTop;

        // Calculate target scroll position (element at middle of container)
        let targetScrollTop;

        // If element doesn't fit in the viewport, scroll to top of element
        if (elementHeight > containerVisibleHeight) {
            targetScrollTop = elementTop;
        } else {
            // Otherwise center the element
            targetScrollTop = elementTop - (containerVisibleHeight / 2) + (elementHeight / 2);
        }

        // Ensure the target scroll position is within bounds
        targetScrollTop = Math.max(0, Math.min(targetScrollTop, container.scrollHeight - containerVisibleHeight));

        logger.log('debug', `Scrolling to position: ${targetScrollTop}. Element top: ${elementTop}, container height: ${containerVisibleHeight}`);

        // Smoothly scroll to the calculated position
        container.scrollTop = targetScrollTop;
    } catch (error) {
        logger.log('error', `Error scrolling element to middle: ${error.message}`);
    }
}

// Build a hierarchical tree from flat file paths
function buildFileTree(filePathMap) {
    const root = {};

    logger.log('debug', `Building file tree from: ${Object.keys(filePathMap).length} paths`);

    for (const filePath in filePathMap) {
        let currentLevel = root;
        // Skip empty parts that might come from leading slashes
        const parts = filePath.split('/').filter(part => part.length > 0);

        logger.log('debug', `Processing file path: ${filePath} with ${parts.length} parts`);

        // Process directories
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!currentLevel[part]) {
                currentLevel[part] = {
                    _isDir: true,
                    _children: {},
                    _path: '/' + parts.slice(0, i + 1).join('/') // Store the full path to the directory
                };
            } else if (!currentLevel[part]._children) {
                // Fix for malformed tree nodes
                currentLevel[part]._children = {};
                currentLevel[part]._isDir = true;
                currentLevel[part]._path = '/' + parts.slice(0, i + 1).join('/');
            }
            currentLevel = currentLevel[part]._children;
        }

        // Process file
        const fileName = parts[parts.length - 1];
        currentLevel[fileName] = {
            _isFile: true,
            _path: filePath,
            _lines: filePathMap[filePath]
        };
    }

    return root;
}

// Build a DOM hierarchy tree for the locked element
function buildDomHierarchyTree(lockedElement) {
    // Store the result
    const hierarchyTree = {};

    // Start with the locked element
    let currentElement = lockedElement;
    let path = [];

    logger.log('info', 'Building DOM hierarchy tree for locked element');

    // Traverse up the DOM tree to collect all elements with data-source-file
    while (currentElement && currentElement !== document.body) {
        // Check if current element has source file data
        const sourceFile = currentElement.getAttribute('data-source-file');
        const sourceLine = currentElement.getAttribute('data-source-line');

        if (sourceFile && sourceLine) {
            // Create a unique identifier for this element
            const elementId = getElementIdentifier(currentElement);

            // Add to our path (processing from bottom up)
            path.unshift({
                element: currentElement,
                id: elementId,
                sourceFile: sourceFile,
                sourceLine: sourceLine
            });

            logger.log('debug', `Added element to hierarchy: ${elementId} (${sourceFile}:${sourceLine})`);
        }

        // Move up to parent
        currentElement = currentElement.parentElement;
    }

    // Now construct the tree structure
    if (path.length > 0) {
        // Start with the root
        let current = hierarchyTree;

        // Process each level
        for (let i = 0; i < path.length; i++) {
            const item = path[i];
            const isLeaf = (i === path.length - 1);

            // Create the node for this level
            const nodeName = isLeaf ?
                `${item.id}` :
                `${item.id}`;

            if (isLeaf) {
                // This is our locked element - the leaf
                current[nodeName] = {
                    _isFile: true,
                    _path: item.sourceFile,
                    _lines: [item.sourceLine],
                    _element: item.element,  // Store reference to the actual DOM element
                    _isSelectedElement: true
                };
            } else {
                // This is a container
                if (!current[nodeName]) {
                    current[nodeName] = {
                        _isDir: true,
                        _children: {},
                        _path: item.sourceFile,
                        _sourceLine: item.sourceLine,
                        _element: item.element  // Store reference to the actual DOM element
                    };
                }
                current = current[nodeName]._children;
            }
        }
    } else {
        // If we couldn't find any hierarchy, create a simple entry for the locked element
        const sourceFile = lockedElement.getAttribute('data-source-file');
        const sourceLine = lockedElement.getAttribute('data-source-line');
        const elementId = getElementIdentifier(lockedElement);

        if (sourceFile && sourceLine) {
            hierarchyTree[elementId] = {
                _isFile: true,
                _path: sourceFile,
                _lines: [sourceLine],
                _element: lockedElement,
                _isSelectedElement: true
            };
        }
    }

    return hierarchyTree;
}

// Switch to DOM hierarchy view
function switchToDomHierarchyView(lockedElement) {
    logger.log('info', '=== SWITCHING TO DOM HIERARCHY VIEW ===');
    logger.log('debug', `Locked element: ${lockedElement ? lockedElement.tagName : 'none'}`);

    if (!lockedElement) {
        logger.log('error', 'Cannot switch to hierarchy view: No locked element provided');
        return;
    }

    // Check if element has source data
    const sourceFile = lockedElement.getAttribute('data-source-file');
    const sourceLine = lockedElement.getAttribute('data-source-line');

    if (!sourceFile || !sourceLine) {
        logger.log('error', `Element lacks source data - file: ${sourceFile}, line: ${sourceLine}`);
        return;
    }

    // Save the current file tree if not already saved
    if (!state.originalFileTree || Object.keys(state.originalFileTree).length === 0) {
        logger.log('info', 'Saving original file tree');
        try {
            state.originalFileTree = JSON.parse(JSON.stringify(state.fileTree));
            logger.log('debug', `Original tree saved with ${Object.keys(state.originalFileTree).length} root nodes`);
        } catch (error) {
            logger.log('error', `Error saving original tree: ${error.message}`);
            // Create empty object as fallback
            state.originalFileTree = {};
        }
    }

    // Build new hierarchy tree
    logger.log('info', 'Building DOM hierarchy tree');
    try {
        state.fileTree = buildDomHierarchyTree(lockedElement);
        logger.log('debug', `Hierarchy tree built with ${Object.keys(state.fileTree).length} root nodes`);
    } catch (error) {
        logger.log('error', `Error building hierarchy tree: ${error.message}`);
        // Keep original tree as fallback
        state.fileTree = state.originalFileTree || {};
        return;
    }

    // Update view mode
    state.viewMode = 'domhierarchy';

    // Update panel header to indicate we're in hierarchy view
    try {
        updateFileTreeHeader('DOM Hierarchy View');
        logger.log('debug', 'Updated file tree header');
    } catch (error) {
        logger.log('error', `Error updating header: ${error.message}`);
    }

    // Re-render the tree with the new structure
    try {
        logger.log('info', 'Rendering hierarchy tree');
        renderFileTree();
        logger.log('info', 'DOM hierarchy view switch complete');
    } catch (error) {
        logger.log('error', `Error rendering hierarchy tree: ${error.message}`);
    }
}

// Switch back to regular file tree view
function switchToFileTreeView() {
    logger.log('info', '=== SWITCHING BACK TO FILE TREE VIEW ===');

    // Restore the original file tree if we have one
    if (state.originalFileTree && Object.keys(state.originalFileTree).length > 0) {
        logger.log('info', 'Restoring original file tree');
        try {
            state.fileTree = state.originalFileTree;
            state.originalFileTree = {};
            logger.log('debug', `Restored tree with ${Object.keys(state.fileTree).length} root nodes`);
        } catch (error) {
            logger.log('error', `Error restoring original tree: ${error.message}`);
            // Fallback to scanning if restoration fails
            scanForSourceFiles();
        }
    } else {
        // If for some reason we don't have the original tree, rescan
        logger.log('info', 'No original tree found, rescanning for files');
        scanForSourceFiles();
    }

    // Update view mode
    state.viewMode = 'filetree';

    // Update panel header
    try {
        updateFileTreeHeader('Web Page Source Files');
        logger.log('debug', 'Updated file tree header for file tree view');
    } catch (error) {
        logger.log('error', `Error updating header: ${error.message}`);
    }

    // Re-render the tree
    try {
        logger.log('info', 'Rendering file tree');
        renderFileTree();
        logger.log('info', 'File tree view switch complete');
    } catch (error) {
        logger.log('error', `Error rendering file tree: ${error.message}`);
    }
}

// Render the file tree
function renderFileTree() {
    if (!elements.fileTreePanel) {
        logger.log('error', 'File tree panel not initialized');
        return;
    }

    logger.log('info', `Rendering file tree in ${state.viewMode} mode`);

    // Clear previous content
    elements.fileTreePanel.innerHTML = '';

    // Create header section (fixed at top)
    const headerSection = domUtils.createElement('div', {
        classes: ['file-tree-header']
    });

    // Create title without the view type label
    const title = state.viewMode === 'domhierarchy' ? 'DOM Hierarchy' : 'Web Page Source Files';
    const titleDiv = domUtils.createElement('div', {
        classes: [CONSTANTS.CLASSES.FILE_TREE_TITLE],
        innerHTML: `${title}`  // Removed the orange label
    });
    headerSection.appendChild(titleDiv);

    // Add a refresh button
    const refreshButton = domUtils.createElement('button', {
        classes: [CONSTANTS.CLASSES.FILE_TREE_REFRESH],
        textContent: 'Refresh',
        eventListeners: {
            click: function() {
                logger.log('info', 'Manual refresh requested');
                if (state.viewMode === 'domhierarchy' && state.lockedElement) {
                    // In DOM hierarchy view, refresh means rebuilding the hierarchy
                    switchToDomHierarchyView(state.lockedElement);
                } else {
                    // In file tree view, refresh means rescanning
                    scanForSourceFiles();
                }
            }
        }
    });
    headerSection.appendChild(refreshButton);

    // Add header to panel
    elements.fileTreePanel.appendChild(headerSection);

    // Create scrollable content section
    const contentSection = domUtils.createElement('div', {
        classes: ['file-tree-content'],
        styles: {
            'overflow-y': 'auto',
            'max-height': `calc(100% - ${CONSTANTS.SIZES.HEADER_HEIGHT}px)`,
            'box-sizing': 'border-box'
        }
    });

    // Check if file tree is empty
    if (!state.fileTree || Object.keys(state.fileTree).length === 0) {
        const emptyMessage = domUtils.createElement('div', {
            styles: { color: '#F92672', padding: '10px' },
            textContent: state.viewMode === 'domhierarchy' ?
                'No DOM hierarchy found for locked element' :
                'No source files found'
        });
        contentSection.appendChild(emptyMessage);

        logger.log('info', 'No files in the tree to render');
    } else {
        const treeRoot = document.createElement('div');
        renderTreeNode(treeRoot, state.fileTree, 0);
        contentSection.appendChild(treeRoot);

        logger.log('info', `Tree rendering complete in ${state.viewMode} mode`);
    }

    // Add content section to panel
    elements.fileTreePanel.appendChild(contentSection);

    // Log scrollable container info for debugging
    logger.log('debug', `File tree content height: ${contentSection.scrollHeight}, visible height: ${contentSection.clientHeight}`);
}// Render the file tree
function renderFileTree() {
    if (!elements.fileTreePanel) {
        logger.log('error', 'File tree panel not initialized');
        return;
    }

    logger.log('info', `Rendering file tree in ${state.viewMode} mode`);

    // Clear previous content
    elements.fileTreePanel.innerHTML = '';

    // Create header section (fixed at top)
    const headerSection = domUtils.createElement('div', {
        classes: ['file-tree-header']
    });

    // Create title with view type label - use our standardized function
    const title = state.viewMode === 'domhierarchy' ? 'DOM Hierarchy' : 'Web Page Source Files';
    const titleDiv = domUtils.createElement('div', {
        classes: [CONSTANTS.CLASSES.FILE_TREE_TITLE],
        innerHTML: `${title}`
    });
    headerSection.appendChild(titleDiv);

    // Add a refresh button
    const refreshButton = domUtils.createElement('button', {
        classes: [CONSTANTS.CLASSES.FILE_TREE_REFRESH],
        textContent: 'Refresh',
        eventListeners: {
            click: function() {
                logger.log('info', 'Manual refresh requested');
                if (state.viewMode === 'domhierarchy' && state.lockedElement) {
                    // In composite view, refresh means rebuilding the hierarchy
                    switchToDomHierarchyView(state.lockedElement);
                } else {
                    // In file tree view, refresh means rescanning
                    scanForSourceFiles();
                }
            }
        }
    });
    headerSection.appendChild(refreshButton);

    // Add header to panel
    elements.fileTreePanel.appendChild(headerSection);

    // Create scrollable content section
    const contentSection = domUtils.createElement('div', {
        classes: ['file-tree-content'],
        styles: {
            'overflow-y': 'auto',
            'max-height': `calc(100% - ${CONSTANTS.SIZES.HEADER_HEIGHT}px)`,
            'box-sizing': 'border-box'
        }
    });

    // Check if file tree is empty
    if (!state.fileTree || Object.keys(state.fileTree).length === 0) {
        const emptyMessage = domUtils.createElement('div', {
            styles: { color: '#F92672', padding: '10px' },
            textContent: state.viewMode === 'domhierarchy' ?
                'No DOM hierarchy found for locked element' :
                'No source files found'
        });
        contentSection.appendChild(emptyMessage);

        logger.log('info', 'No files in the tree to render');
    } else {
        const treeRoot = document.createElement('div');
        renderTreeNode(treeRoot, state.fileTree, 0);
        contentSection.appendChild(treeRoot);

        logger.log('info', `Tree rendering complete in ${state.viewMode} mode`);
    }

    // Add content section to panel
    elements.fileTreePanel.appendChild(contentSection);

    // Log scrollable container info for debugging
    logger.log('debug', `File tree content height: ${contentSection.scrollHeight}, visible height: ${contentSection.clientHeight}`);
}

// Render a single node in the tree
function renderTreeNode(container, node, level) {
    // Debug what we're rendering
    logger.log('debug', `Rendering level ${level} with keys: ${Object.keys(node).filter(k => !k.startsWith('_')).join(', ')}`);

    for (const key in node) {
        if (key.startsWith('_')) continue;

        const nodeInfo = node[key];
        const nodeElement = domUtils.createElement('div', {
            classes: [CONSTANTS.CLASSES.FILE_TREE_NODE]
        });

        // Create indentation
        for (let i = 0; i < level; i++) {
            const indent = domUtils.createElement('span', {
                classes: [CONSTANTS.CLASSES.TREE_INDENT]
            });
            nodeElement.appendChild(indent);
        }

        // Add expand/collapse icon for directories
        if (nodeInfo._isDir) {
            logger.log('debug', `Rendering directory: ${key}`);

            const expandIcon = domUtils.createElement('span', {
                classes: [CONSTANTS.CLASSES.TREE_EXPAND_ICON],
                textContent: '▼', // Default to expanded
                eventListeners: {
                    click: function(e) {
                        e.stopPropagation();
                        const childContainer = nodeElement.nextElementSibling;
                        if (childContainer.style.display === 'none') {
                            childContainer.style.display = 'block';
                            expandIcon.textContent = '▼';
                        } else {
                            childContainer.style.display = 'none';
                            expandIcon.textContent = '►';
                        }
                    }
                }
            });
            nodeElement.appendChild(expandIcon);

            // Add folder icon and name
            const folderSpan = domUtils.createElement('span', {
                classes: [CONSTANTS.CLASSES.TREE_FOLDER],
                // Only modify the text in domhierarchy mode
                textContent: state.viewMode === 'domhierarchy' ?
                    (nodeInfo._path ? `${nodeInfo._path.split('/').pop()}:${nodeInfo._sourceLine || '1'}` : key) :
                    key,
                attributes: {
                    'data-path': nodeInfo._path || key,
                    'data-source-line': nodeInfo._sourceLine || '1' // Add source line info for folders
                }
            });
            nodeElement.appendChild(folderSpan);

            // If we're in DOM hierarchy view and this is a parent element with source info,
            // add the source file and line in the new requested format
            if (state.viewMode === 'domhierarchy' && nodeInfo._path && nodeInfo._sourceLine) {
                // Extract the filename from the path
                const pathParts = nodeInfo._path.split('/');
                const filename = pathParts[pathParts.length - 1];

                // Get the directory path (everything except the filename)
                const dirPath = pathParts.slice(0, pathParts.length - 1).join('/') + '/';

                // If we're in DOM hierarchy view and this is a parent element with source info,
                // add the path and DOM element info as a span
                if (state.viewMode === 'domhierarchy' && nodeInfo._path && nodeInfo._sourceLine) {
                    // Extract element text for display
                    let elementText = "";
                    if (key.includes('"')) {
                        // Extract the quoted text if it exists
                        const matches = key.match(/"([^"]*)"/);
                        if (matches && matches[1]) {
                            elementText = `"${matches[1]}" `;
                        }
                    }

                    // Extract the filename from the path
                    const pathParts = nodeInfo._path.split('/');
                    const dirPath = pathParts.slice(0, pathParts.length - 1).join('/') + '/';

                    // Get DOM element identifier without the quoted text
                    let domIdentifier = key;
                    if (elementText) {
                        domIdentifier = key.replace(/"[^"]*"/, "").trim();
                    }

                    // Add the element text and path info
                    const sourceInfo = domUtils.createElement('span', {
                        styles: {
                            color: '#75715E',
                            fontSize: '0.8em',
                            marginLeft: '5px'
                        },
                        textContent: ` ${elementText}(${dirPath}, ${domIdentifier})`
                    });
                    nodeElement.appendChild(sourceInfo);
                }
            }

            container.appendChild(nodeElement);

            // In composite view, make the folder node clickable like a file
            if (state.viewMode === 'domhierarchy' && nodeInfo._path) {
                nodeElement.style.cursor = 'pointer';

                // Handle folder click in composite view similar to file click
                nodeElement.addEventListener('click', async function(e) {
                    // Don't handle click if it was on the expand icon
                    if (e.target === expandIcon) return;

                    try {
                        logger.log('info', `Folder clicked in composite view: ${nodeInfo._path}`);

                        if (nodeInfo._element) {
                            // First clear all highlights
                            clearAllHighlights();

                            // Highlight the DOM element with orange border
                            nodeInfo._element.classList.add(CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT);

                            // Scroll the element into view
                            nodeInfo._element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                            // Load source code
                            const fileContent = await fetchSourceCode(nodeInfo._path);
                            if (fileContent) {
                                const elementInfo = {
                                    sourceFile: nodeInfo._path,
                                    sourceLine: nodeInfo._sourceLine || '1'
                                };

                                // Lock the current file
                                state.isLocked = true;
                                state.lockedFile = nodeInfo._path;
                                state.elementHighlighting = false;

                                // Update bottom panel with source code
                                updateBottomPanel(elementInfo, fileContent);

                                // Select this file in the tree
                                highlightTreeFile(nodeInfo._path);

                                // Highlight all page elements that come from this file
                                highlightPageElementsByFile(nodeInfo._path, elementInfo.sourceLine);
                            }
                        }
                    } catch (error) {
                        logger.log('error', `Error handling folder click: ${error.message}`);
                    }
                });
            }

            // Create container for children
            const childContainer = domUtils.createElement('div', {
                classes: [CONSTANTS.CLASSES.TREE_CHILDREN]
            });
            renderTreeNode(childContainer, nodeInfo._children, level + 1);
            container.appendChild(childContainer);
        } else if (nodeInfo._isFile) {
            logger.log('debug', `Rendering file: ${key} (${nodeInfo._path})`);

            // Add icon space for files (for alignment)
            const iconSpace = domUtils.createElement('span', {
                classes: [CONSTANTS.CLASSES.TREE_EXPAND_ICON],
                textContent: ' '
            });
            nodeElement.appendChild(iconSpace);

            // Add file icon and name - highlight if it's the selected element in hierarchy view
            const fileSpan = domUtils.createElement('span', {
                classes: [
                    CONSTANTS.CLASSES.TREE_FILE,
                    // Highlight selected element in hierarchy view
                    ...(nodeInfo._isSelectedElement ? [CONSTANTS.CLASSES.TREE_FILE_SELECTED] : [])
                ],
                // In DOM hierarchy view, show filename:line, otherwise show the key
                textContent: state.viewMode === 'domhierarchy' && nodeInfo._path ?
                    `${nodeInfo._path.split('/').pop()}:${nodeInfo._lines ? nodeInfo._lines[0] : '1'}` :
                    key,
                attributes: {
                    'title': nodeInfo._path,
                    'data-path': nodeInfo._path,
                    'data-filename': nodeInfo._path.split('/').pop()
                }
            });
            nodeElement.appendChild(fileSpan);

            // Add line numbers as a small hint in the new format for DOM hierarchy view
            if (nodeInfo._lines && nodeInfo._lines.length > 0) {
                if (state.viewMode === 'domhierarchy') {
                    // Extract element text for display
                    let elementText = "";
                    if (key.includes('"')) {
                        // Extract the quoted text if it exists
                        const matches = key.match(/"([^"]*)"/);
                        if (matches && matches[1]) {
                            elementText = `"${matches[1]}" `;
                        }
                    }

                    // Extract the filename and path
                    const pathParts = nodeInfo._path.split('/');
                    const dirPath = pathParts.slice(0, pathParts.length - 1).join('/') + '/';

                    // Get DOM element identifier without the quoted text
                    let domIdentifier = key;
                    if (elementText) {
                        domIdentifier = key.replace(/"[^"]*"/, "").trim();
                    }

                    // Only add the path and DOM element info as a separate span
                    const linesSpan = domUtils.createElement('span', {
                        styles: {
                            color: '#75715E',
                            fontSize: '0.8em',
                            marginLeft: '5px'
                        },
                        textContent: ` ${elementText}(${dirPath}, ${domIdentifier})`
                    });
                    nodeElement.appendChild(linesSpan);
                } else {
                    // Standard file tree view - keep original format
                    const linesText = `(${nodeInfo._lines.length} line${nodeInfo._lines.length > 1 ? 's' : ''})`;

                    const linesSpan = domUtils.createElement('span', {
                        styles: {
                            color: '#75715E',
                            fontSize: '0.8em',
                            marginLeft: '5px'
                        },
                        textContent: linesText
                    });
                    nodeElement.appendChild(linesSpan);
                }
            }

            // Handle file click event - behavior differs between view modes
            nodeElement.addEventListener('click', async function() {
                try {
                    if (state.viewMode === 'domhierarchy' && nodeInfo._element) {
                        // In DOM hierarchy view, clicking an element should highlight it on the page

                        // First clear all highlights
                        clearAllHighlights();

                        // Highlight the DOM element
                        if (nodeInfo._isSelectedElement) {
                            // For the locked element, keep it with red border
                            nodeInfo._element.classList.add(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT);
                        } else {
                            // For other elements, use orange border like file-based selection
                            nodeInfo._element.classList.add(CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT);
                        }

                        // Scroll the element into view
                        nodeInfo._element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        // Load its source code
                        const fileContent = await fetchSourceCode(nodeInfo._path);
                        if (fileContent) {
                            const elementInfo = {
                                sourceFile: nodeInfo._path,
                                sourceLine: nodeInfo._lines ? nodeInfo._lines[0] : (nodeInfo._sourceLine || '1')
                            };

                            // Lock the current file
                            state.lockedFile = nodeInfo._path;
                            state.elementHighlighting = false;

                            updateBottomPanel(elementInfo, fileContent);

                            // Select this file in the tree
                            highlightTreeFile(nodeInfo._path);
                        }
                    } else {
                        // Standard file tree behavior (same as original code)
                        // If this file is already locked, unlock it
                        if (state.lockedFile === nodeInfo._path && !state.elementHighlighting) {
                            logger.log('info', `Unlocking file: ${nodeInfo._path}`);
                            state.isLocked = false;
                            state.lockedFile = null;
                            state.elementHighlighting = true;

                            // Clear all highlights
                            clearAllHighlights();

                            // Remove the lock icon
                            removeAllLockIcons();

                            // Still keep the file selected in the tree
                            highlightTreeFile(nodeInfo._path);

                            return;
                        }

                        const sourceCodeUrl = `${CONSTANTS.URLS.BASE_API_URL}${nodeInfo._path}`;
                        logger.log('info', `Fetching source code from: ${sourceCodeUrl}`);
                        const fileContent = await fetchSourceCode(nodeInfo._path);

                        if (fileContent) {
                            const elementInfo = {
                                sourceFile: nodeInfo._path,
                                sourceLine: nodeInfo._lines[0] || '1' // Default to first line
                            };
                            updateBottomPanel(elementInfo, fileContent);

                            // Lock the current file
                            state.isLocked = true;
                            state.lockedFile = nodeInfo._path;
                            state.elementHighlighting = false;

                            // Select this file in the tree (adds lock icon)
                            highlightTreeFile(nodeInfo._path);

                            // Highlight all page elements that come from this file
                            // and specifically highlight the element matching our line number
                            highlightPageElementsByFile(nodeInfo._path, elementInfo.sourceLine);
                        }
                    }
                } catch (error) {
                    logger.log('error', `Error loading file from tree: ${error.message}`);
                }
            });

            container.appendChild(nodeElement);
        }
    }
}

// ===================================================================
// 6. SOURCE FILE DETECTION AND FETCHING
// ===================================================================

// Fetch source code from URL
async function fetchSourceCode(path) {
    const url = `${CONSTANTS.URLS.BASE_API_URL}${path}`;
    logger.log('info', `Fetching source code from: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        logger.log('error', `Error fetching source code: ${error.message}`);
        return null;
    }
}

// Scan for elements with data-source-file attributes
function scanForSourceFiles() {
    if (!state.extensionEnabled) return;

    logger.log('info', 'Scanning for source files');

    try {
        // Try different methods to find elements with data-source-file
        let elements = [];
        let filePathMap = {};

        // Method 1: Direct querySelector (most common)
        const directElements = document.querySelectorAll('[data-source-file]');
        elements = Array.from(directElements);

        // Method 2: Check for elements in all iframes (for Arc)
        try {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                try {
                    if (iframe.contentDocument) {
                        const iframeElements = iframe.contentDocument.querySelectorAll('[data-source-file]');
                        elements = elements.concat(Array.from(iframeElements));
                    }
                } catch (e) {
                    logger.log('debug', 'Could not access iframe content, possibly cross-origin');
                }
            });
        } catch (e) {
            logger.log('warn', `Error accessing iframes: ${e.message}`);
        }

        // Method 3: Check for data-source-file attributes in the raw HTML
        // This can catch attributes that might not be accessible via DOM methods
        try {
            const pageHtml = document.documentElement.outerHTML;
            const dataSourceMatches = pageHtml.match(/data-source-file="([^"]+)"\s+data-source-line="([^"]+)"/g);

            if (dataSourceMatches && dataSourceMatches.length > 0) {
                logger.log('info', `Found ${dataSourceMatches.length} data-source-file attributes in raw HTML`);

                dataSourceMatches.forEach(match => {
                    const filePathMatch = match.match(/data-source-file="([^"]+)"/);
                    const lineMatch = match.match(/data-source-line="([^"]+)"/);

                    if (filePathMatch && lineMatch) {
                        const filePath = filePathMatch[1];
                        const line = lineMatch[1];

                        if (!filePathMap[filePath]) {
                            filePathMap[filePath] = [];
                        }

                        if (!filePathMap[filePath].includes(line)) {
                            filePathMap[filePath].push(line);
                        }
                    }
                });
            }
        } catch (e) {
            logger.log('warn', `Error scanning HTML for data-source-file attributes: ${e.message}`);
        }

        // Method 4: Look for file paths in the current page content
        try {
            const pageText = document.body.textContent || '';

            // Pattern to match file paths like /src/.../Component.tsx:123 or with just the extension
            const filePathPattern = /(\/[a-zA-Z0-9\/._-]+\.(jsx|js|tsx|ts))(?::(\d+))?/g;
            let match;

            while ((match = filePathPattern.exec(pageText)) !== null) {
                const filePath = match[1];
                const line = match[3] || '1';

                if (!filePathMap[filePath]) {
                    filePathMap[filePath] = [];
                }

                if (!filePathMap[filePath].includes(line)) {
                    filePathMap[filePath].push(line);
                }
            }
        } catch (e) {
            logger.log('warn', `Error scanning page text for file paths: ${e.message}`);
        }

        // Method 5: Look for filename.extension patterns (without full paths)
        try {
            const pageText = document.body.textContent || '';

            // First get any filenames that appear to be highlighted or in focus
            // For example, from the header or highlighted in the source panel
            const currentFileMatches = pageText.match(/([A-Z][a-zA-Z0-9]+\.(jsx|js|tsx|ts))(?::(\d+))?/g);
            const currentFiles = new Set();

            if (currentFileMatches) {
                currentFileMatches.forEach(match => {
                    const fileName = match.split(':')[0];
                    currentFiles.add(fileName);
                });
            }

            // Then check the source panel
            const sourcePanel = document.getElementById(CONSTANTS.DOM_IDS.SOURCE_CODE_PANEL) ||
                document.querySelector('[style*="position: fixed"][style*="bottom"][style*="left"]');

            if (sourcePanel) {
                const panelText = sourcePanel.textContent || '';

                // Match both full paths and just filenames
                const fullPathMatch = panelText.match(/(?:\/[a-zA-Z0-9\/._-]+)?\/([A-Z][a-zA-Z0-9]+\.(jsx|js|tsx|ts))/);
                const lineMatch = panelText.match(/::(\d+)/);

                if (fullPathMatch) {
                    const fileName = fullPathMatch[1];
                    const fullPath = fullPathMatch[0];
                    const line = lineMatch ? lineMatch[1] : '1';

                    logger.log('info', `Found file in source panel: ${fullPath} (${fileName}) at line ${line}`);

                    if (!filePathMap[fullPath]) {
                        filePathMap[fullPath] = [];
                    }

                    if (!filePathMap[fullPath].includes(line)) {
                        filePathMap[fullPath].push(line);
                    }

                    // Also add to current files for more aggressive matching
                    currentFiles.add(fileName);
                }
            }

            logger.log('debug', `Current files in focus: ${Array.from(currentFiles).join(', ')}`);

            // Now search for any instances of these filenames in the full DOM
            // This helps us catch relative paths or different path formats
            if (currentFiles.size > 0) {
                const allText = document.documentElement.outerHTML;

                currentFiles.forEach(fileName => {
                    // Look for paths containing this filename
                    const pathRegex = new RegExp(`((?:/[a-zA-Z0-9/._-]+)?/${fileName.replace('.', '\\.')})(?::([0-9]+))?`, 'g');
                    let pathMatch;

                    while ((pathMatch = pathRegex.exec(allText)) !== null) {
                        const path = pathMatch[1];
                        const line = pathMatch[2] || '1';

                        logger.log('info', `Found path for ${fileName}: ${path} at line ${line}`);

                        if (!filePathMap[path]) {
                            filePathMap[path] = [];
                        }

                        if (!filePathMap[path].includes(line)) {
                            filePathMap[path].push(line);
                        }
                    }
                });
            }
        } catch (e) {
            logger.log('warn', `Error scanning for filenames: ${e.message}`);
        }

        // Method 6: Extract data from the element inspector if present
        try {
            // Look for the inspector or other dev tools panels that might show file paths
            const inspectorPanels = document.querySelectorAll('[class*="inspector"], [class*="debugger"], [class*="developer"]');

            inspectorPanels.forEach(panel => {
                const panelText = panel.textContent || '';
                const fileMatches = panelText.match(/(?:\/[a-zA-Z0-9\/._-]+\/)?([A-Z][a-zA-Z0-9]+\.(jsx|js|tsx|ts))(?::(\d+))?/g);

                if (fileMatches) {
                    fileMatches.forEach(match => {
                        const parts = match.split(':');
                        const filePath = parts[0];
                        const line = parts.length > 1 ? parts[1] : '1';

                        if (!filePathMap[filePath]) {
                            filePathMap[filePath] = [];
                        }

                        if (!filePathMap[filePath].includes(line)) {
                            filePathMap[filePath].push(line);
                        }
                    });
                }
            });
        } catch (e) {
            logger.log('warn', `Error scanning inspector panels: ${e.message}`);
        }

        // Add files found in elements collection
        elements.forEach(element => {
            const sourceFile = element.getAttribute('data-source-file');
            const sourceLine = element.getAttribute('data-source-line');

            if (sourceFile && sourceLine) {
                if (!filePathMap[sourceFile]) {
                    filePathMap[sourceFile] = [];
                }

                if (!filePathMap[sourceFile].includes(sourceLine)) {
                    filePathMap[sourceFile].push(sourceLine);
                }
            }
        });

        logger.log('info', `Found ${Object.keys(filePathMap).length} file paths`);

        // Convert to tree structure
        state.fileTree = buildFileTree(filePathMap);
        logger.log('debug', 'Built file tree structure');
        renderFileTree();
    } catch (error) {
        logger.log('error', `Error during source file scanning: ${error.message}`);
        state.fileTree = {};
        renderFileTree();
    }
}

// Debounced version of scanForSourceFiles for better performance
const debouncedScanForSourceFiles = debounce(scanForSourceFiles, 300);

// ===================================================================
// 7. EVENT HANDLERS
// ===================================================================

// Setup resize event listeners
function setupResizeListeners() {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
}

// Cleanup resize event listeners
function cleanupResizeListeners() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
}

// Handle mouse move for resize
function handleMouseMove(e) {
    // Handle vertical resizing (panel height)
    if (state.isResizing) {
        const deltaY = e.clientY - state.lastY;
        const newHeight = Math.max(elements.panel.offsetHeight - deltaY, CONSTANTS.SIZES.MIN_PANEL_HEIGHT);
        const viewportHeight = window.innerHeight;
        const panelHeight = Math.min(newHeight, viewportHeight * CONSTANTS.SIZES.MAX_PANEL_HEIGHT_RATIO);

        elements.panel.style.height = `${panelHeight}px`;
        elements.fileTreePanel.style.height = `${panelHeight}px`;
        elements.resizeHandle.style.bottom = `${panelHeight}px`;
        elements.horizontalResizeHandle.style.height = `${panelHeight}px`;

        state.lastY = e.clientY;
    }

    // Handle horizontal resizing (panel widths)
    if (state.isHorizontalResizing) {
        const deltaX = e.clientX - state.lastX;
        // Calculate new width for right panel (file tree panel)
        state.rightPanelWidth = Math.max(state.rightPanelWidth - deltaX, CONSTANTS.SIZES.MIN_PANEL_WIDTH);
        const viewportWidth = window.innerWidth;
        state.rightPanelWidth = Math.min(state.rightPanelWidth, viewportWidth * CONSTANTS.SIZES.MAX_PANEL_WIDTH_RATIO);

        // Update panel styles
        elements.fileTreePanel.style.width = `${state.rightPanelWidth}px`;
        elements.panel.style.width = `calc(100% - ${state.rightPanelWidth}px)`;
        elements.horizontalResizeHandle.style.left = `calc(100% - ${state.rightPanelWidth}px)`;

        state.lastX = e.clientX;
    }
}

// Handle mouse up for resize
function handleMouseUp() {
    state.isResizing = false;
    state.isHorizontalResizing = false;
}

// Toggle lock state - Modified to handle DOM hierarchy view
function toggleLock() {
    const previousState = state.isLocked;
    state.isLocked = !state.isLocked;
    logger.log('info', `Lock state changed: ${previousState} → ${state.isLocked}`);

    if (state.isLocked) {
        // If we're locking, add red border to currently hovered element
        if (state.elementHighlighting && !state.lockedFile) {
            // Find the currently highlighted element
            const highlightedElement = document.querySelector(`.${CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT}`);

            logger.log('debug', `Found highlighted element: ${highlightedElement ? 'Yes' : 'No'}`);

            if (highlightedElement) {
                logger.log('debug', `Element tag: ${highlightedElement.tagName}, classes: ${highlightedElement.className}`);

                // Check if element has source file data
                const sourceFile = highlightedElement.getAttribute('data-source-file');
                const sourceLine = highlightedElement.getAttribute('data-source-line');
                logger.log('debug', `Element source info - file: ${sourceFile}, line: ${sourceLine}`);

                // Remove green highlight and add red locked highlight
                highlightedElement.classList.remove(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT);
                highlightedElement.classList.add(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT);

                // Store reference to locked element
                state.lockedElement = highlightedElement;
                logger.log('info', 'Element locked with red border');

                // Switch to DOM hierarchy view
                logger.log('info', 'Calling switchToDomHierarchyView()');
                switchToDomHierarchyView(highlightedElement);

                // Log state after switching view
                logger.log('debug', `After view switch - viewMode: ${state.viewMode}, fileTree keys: ${Object.keys(state.fileTree).length}`);
            } else {
                logger.log('warn', 'No highlighted element found to lock');
            }
        } else {
            logger.log('debug', `Not in element highlighting mode or file is locked - elementHighlighting: ${state.elementHighlighting}, lockedFile: ${state.lockedFile}`);
        }
    } else {
        // If we're unlocking, remove all highlights
        logger.log('info', 'Unlocking element, clearing highlights');
        clearAllHighlights();
        state.elementHighlighting = true;
        state.lockedFile = null;
        state.lockedElement = null;
        removeAllLockIcons();

        // Switch back to file tree view
        logger.log('info', 'Calling switchToFileTreeView()');
        switchToFileTreeView();

        // Log state after switching view
        logger.log('debug', `After view switch back - viewMode: ${state.viewMode}, fileTree keys: ${Object.keys(state.fileTree).length}`);
    }
}

// Handle key press for lock and other keyboard shortcuts - Modified with debugging
function handleKeyPress(e) {
    // Debug log for key presses to verify key detection
    logger.log('debug', `Key pressed: ${e.key} (code: ${e.code}, shift: ${e.shiftKey}, alt: ${e.altKey})`);

    // Toggle lock with 'l' or 'L' key
    if (e.key.toLowerCase() === CONSTANTS.KEYS.TOGGLE_LOCK.key.toLowerCase()) {
        logger.log('info', `Lock key ('${CONSTANTS.KEYS.TOGGLE_LOCK.key}') detected, calling toggleLock()`);
        toggleLock();

        // Add a debug message to check after toggleLock call
        logger.log('debug', `After toggleLock - isLocked: ${state.isLocked}, viewMode: ${state.viewMode}`);
    }

    // Toggle extension with Alt+Shift+T
    if (e.altKey && e.shiftKey && e.key === CONSTANTS.KEYS.TOGGLE_EXTENSION.key) {
        toggleExtensionPlugin(!state.extensionEnabled);
    }
}

// Handle mouseover event - Modified to prevent highlighting when locked
async function handleMouseOver(e) {
    // If extension is disabled, exit
    if (!state.extensionEnabled) return;

    // If we have a locked element, prevent new highlights
    if (state.isLocked && state.lockedElement) return;

    // If we're in file-locked mode, ignore hover events
    if (state.lockedFile && !state.elementHighlighting) return;

    // Skip if the target is in any of our panels
    if ((elements.panel && elements.panel.contains(e.target)) ||
        (elements.fileTreePanel && elements.fileTreePanel.contains(e.target))) return;

    // Check if this element has source information
    const elementInfo = {
        sourceFile: e.target.getAttribute('data-source-file'),
        sourceLine: e.target.getAttribute('data-source-line')
    };

    if (elementInfo.sourceFile && elementInfo.sourceLine) {
        // Clear previous highlights when directly interacting with elements
        clearAllHighlights();

        // Set state to element highlighting mode
        state.elementHighlighting = true;
        state.lockedFile = null;

        // Remove any lock icons from the file tree
        removeAllLockIcons();

        state.lockedElement = e.target;
        e.target.classList.add(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT);

        try {
            const fileContent = await fetchSourceCode(elementInfo.sourceFile);
            if (fileContent) {
                updateBottomPanel(elementInfo, fileContent);
            }
        } catch (error) {
            logger.log('error', `Error fetching source code: ${error.message}`);
        }
    }
}

// Handle mouseout event
function handleMouseOut(e) {
    // If we're in locked mode (either element or file), don't remove highlights
    if (state.isLocked || !state.extensionEnabled || (state.lockedFile && !state.elementHighlighting)) return;

    // Skip if the target is in any of our panels
    if ((elements.panel && elements.panel.contains(e.target)) ||
        (elements.fileTreePanel && elements.fileTreePanel.contains(e.target))) return;

    // Only remove the highlight from this specific element if we're in element highlighting mode
    if (state.elementHighlighting && e.target.classList.contains(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT)) {
        e.target.classList.remove(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT);
    }
}

// Attach all event listeners
function attachEventListeners() {
    if (state.eventListenersAttached) return;

    logger.log('info', 'Attaching event listeners');
    document.body.addEventListener('mouseover', handleMouseOver);
    document.body.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('keydown', handleKeyPress);
    setupResizeListeners();
    state.eventListenersAttached = true;
}

// Detach all event listeners
function detachEventListeners() {
    if (!state.eventListenersAttached) return;

    logger.log('info', 'Detaching event listeners');
    document.body.removeEventListener('mouseover', handleMouseOver);
    document.body.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('keydown', handleKeyPress);
    cleanupResizeListeners();
    state.eventListenersAttached = false;
}

// Direct test function for composite view
function testCompositeView() {
    logger.log('info', '=== TESTING COMPOSITE VIEW ===');

    // Find a suitable element with data-source-file to use as our locked element
    const sourceElements = document.querySelectorAll('[data-source-file]');

    logger.log('info', `Found ${sourceElements.length} elements with data-source-file attributes`);

    if (sourceElements.length > 0) {
        const testElement = sourceElements[0];
        logger.log('info', `Test element: ${testElement.tagName}, source file: ${testElement.getAttribute('data-source-file')}`);

        // Set it as locked
        state.isLocked = true;
        state.lockedElement = testElement;
        state.elementHighlighting = false;

        // Apply locked highlight
        testElement.classList.add(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT);

        // Switch to DOM hierarchy view
        switchToDomHierarchyView(testElement);

        // Scroll to the element to make it visible
        testElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        return true;
    } else {
        logger.log('error', 'No elements with data-source-file found for testing');
        return false;
    }
}

// Add this to initializeExtension() or attach it to a global variable for testing
window.testCompositeView = testCompositeView;

// ===================================================================
// 8. INITIALIZATION AND MAIN FUNCTIONALITY
// ===================================================================

// Complete cleanup function for extension uninstall/disable
function cleanupExtension() {
    logger.log('info', 'Performing complete extension cleanup');

    try {
        // 1. Hide and remove UI elements
        if (elements.panel) {
            domUtils.setElementVisibility(elements.panel, false);
            elements.panel.remove();
            elements.panel = null;
        }

        if (elements.fileTreePanel) {
            domUtils.setElementVisibility(elements.fileTreePanel, false);
            elements.fileTreePanel.remove();
            elements.fileTreePanel = null;
        }

        if (elements.resizeHandle) {
            domUtils.setElementVisibility(elements.resizeHandle, false);
            elements.resizeHandle.remove();
            elements.resizeHandle = null;
        }

        if (elements.horizontalResizeHandle) {
            domUtils.setElementVisibility(elements.horizontalResizeHandle, false);
            elements.horizontalResizeHandle.remove();
            elements.horizontalResizeHandle = null;
        }

        // 2. Remove style element
        if (elements.styleElement) {
            elements.styleElement.remove();
            elements.styleElement = null;
        }

        // 3. Remove any highlights from DOM elements
        document.querySelectorAll(`.${CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT}`)
            .forEach(el => el.classList.remove(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT));

        document.querySelectorAll(`.${CONSTANTS.CLASSES.LOCKED_HIGHLIGHT}`)
            .forEach(el => el.classList.remove(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT));

        // 4. Detach all event listeners
        detachEventListeners();

        // 5. Reset state
        state = {
            isInitialized: false,
            isLocked: false,
            lockedElement: null,
            lockedFile: null,
            elementHighlighting: true,
            extensionEnabled: false,
            isResizing: false,
            isHorizontalResizing: false,
            lastY: 0,
            lastX: 0,
            eventListenersAttached: false,
            rightPanelWidth: CONSTANTS.SIZES.DEFAULT_RIGHT_PANEL_WIDTH,
            fileTree: {},
            viewMode: 'filetree',
            originalFileTree: {}
        };

        // 6. Clear elements reference object
        elements = {
            panel: null,
            fileTreePanel: null,
            resizeHandle: null,
            horizontalResizeHandle: null,
            styleElement: null
        };

        logger.log('info', 'Extension cleanup completed successfully');
        return true;
    } catch (error) {
        logger.log('error', `Error during extension cleanup: ${error.message}`);
        return false;
    }
}

// Initialize the extension
function initializeExtension() {
    if (state.isInitialized) return;

    logger.log('info', 'Initializing extension UI components');

    try {
        // Initialize UI components
        initializeUI();

        // Check storage for current state
        browserCompat.loadStateFromStorage(toggleExtensionPlugin);

        // Try multiple times to scan for source files to handle dynamic content
        // and differences in browser loading behavior
        scanForSourceFiles(); // Initial scan

        // Additional scans with increasing delays
        setTimeout(scanForSourceFiles, 1000);
        setTimeout(scanForSourceFiles, 2500);

        // Listen for navigation events to rescan for files
        try {
            // Watch for URL changes (for SPAs that don't trigger full page loads)
            let lastUrl = location.href;
            const urlObserver = new MutationObserver(() => {
                if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    logger.log('info', 'URL changed, rescanning for source files');
                    setTimeout(scanForSourceFiles, 500);
                }
            });

            urlObserver.observe(document, { subtree: true, childList: true });

            // Also listen for click events on navigation elements
            document.addEventListener('click', function(e) {
                // Look for navigation-related elements
                const navElement = e.target.closest('a, button, [role="link"], [role="button"], [role="tab"]');

                if (navElement) {
                    logger.log('info', 'Navigation element clicked, scheduling rescan');
                    setTimeout(scanForSourceFiles, 500);
                    setTimeout(scanForSourceFiles, 1500);
                }
            });
        } catch (e) {
            logger.log('warn', `Error setting up navigation listeners: ${e.message}`);
        }

        // Set up message listeners for browser extension communication
        browserCompat.setupMessageListeners(toggleExtensionPlugin);

        logger.log('info', 'Extension initialization complete');
    } catch (error) {
        logger.log('error', `Error during initialization: ${error.message}`);
    }
}

// Enable or disable extension features
function toggleExtensionPlugin(isEnabled) {
    logger.log('info', `Toggling extension to: ${isEnabled}`);

    state.extensionEnabled = Boolean(isEnabled);

    // Make sure UI is initialized if we're enabling
    if (state.extensionEnabled && !state.isInitialized) {
        initializeExtension();
    }

    if (state.extensionEnabled) {
        // Show panels
        domUtils.setElementVisibility(elements.panel, true);
        domUtils.setElementVisibility(elements.fileTreePanel, true);
        domUtils.setElementVisibility(elements.resizeHandle, true);
        domUtils.setElementVisibility(elements.horizontalResizeHandle, true);

        // Apply current panel dimensions from state
        elements.fileTreePanel.style.width = `${state.rightPanelWidth}px`;
        elements.panel.style.width = `calc(100% - ${state.rightPanelWidth}px)`;
        elements.horizontalResizeHandle.style.left = `calc(100% - ${state.rightPanelWidth}px)`;

        attachEventListeners();

        // Scan for source files immediately and after slight delay
        scanForSourceFiles();
        setTimeout(scanForSourceFiles, 750);
    } else {
        // Perform full cleanup when disabling
        cleanupExtension();
    }
}

// ===================================================================
// 9. AUTO-INITIALIZATION
// ===================================================================

// Initialize on load
window.addEventListener('load', function() {
    setTimeout(initializeExtension, 500);
});

// Also initialize immediately in case we're injected after page load
initializeExtension();