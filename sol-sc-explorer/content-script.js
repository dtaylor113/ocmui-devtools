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
        TREE_FILE: 'tree-file',
        TREE_FILE_SELECTED: 'tree-file-selected',
        TREE_FOLDER: 'tree-folder',
        TREE_FOLDER_SELECTED: 'tree-folder-selected',
        TREE_CHILDREN: 'tree-children',
        TREE_INDENT: 'tree-indent',
        TREE_EXPAND_ICON: 'tree-expand-icon',
        FILE_TREE_NODE: 'file-tree-node',
        FILE_TREE_REFRESH: 'file-tree-refresh',
        FILE_TREE_TITLE: 'file-tree-title'
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
        DEFAULT_RIGHT_PANEL_WIDTH: 375
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
        overflow: auto;
        padding: 10px;
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
        overflow: auto;
        padding: 10px;
        box-sizing: border-box;
        z-index: 9999;
        display: none;
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
        color: #FD971F !important;
        font-weight: bold;
        background-color: rgba(253, 151, 31, 0.2);
        border-radius: 2px;
        padding: 0 2px;
    }
    
    .${CONSTANTS.CLASSES.TREE_FOLDER_SELECTED} {
        background-color: rgba(102, 217, 239, 0.2);
        border-radius: 2px;
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
    
    .${CONSTANTS.CLASSES.FILE_TREE_REFRESH} {
        position: absolute;
        top: 8px;
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
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid #444;
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
    extensionEnabled: false,
    isResizing: false,
    isHorizontalResizing: false,
    lastY: 0,
    lastX: 0,
    eventListenersAttached: false,
    rightPanelWidth: CONSTANTS.SIZES.DEFAULT_RIGHT_PANEL_WIDTH,
    fileTree: {}
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
    detectBrowser: function() {
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
    loadStateFromStorage: function(callback) {
        try {
            // Check if chrome.storage is available (Chrome, Edge, Arc)
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED, function(data) {
                    const isEnabled = data[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED] !== undefined ?
                        Boolean(data[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED]) : true;
                    logger.log('info', `Loaded state from chrome storage: ${isEnabled}`);
                    callback(isEnabled);
                });

                // Also listen for storage changes
                chrome.storage.onChanged.addListener(function(changes, namespace) {
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
                browser.storage.onChanged.addListener(function(changes, namespace) {
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
        try {
            // Chrome, Edge, and Arc implementation
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
                    logger.log('debug', `Content script received Chrome message: ${JSON.stringify(message)}`);

                    if (message.action === "toggleExtensionPlugin") {
                        callback(message.checked);
                        sendResponse({status: "OK"});
                    }

                    return false; // No async response needed
                });

                return true;
            }
            // Firefox implementation
            else if (typeof browser !== 'undefined' && browser.runtime) {
                browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
                    logger.log('debug', `Content script received Firefox message: ${JSON.stringify(message)}`);

                    if (message.action === "toggleExtensionPlugin") {
                        callback(message.checked);
                        return Promise.resolve({status: "OK"}); // Firefox uses promises for responses
                    }
                });

                return true;
            }
            // Fallback for Arc or other browsers if runtime API is not available
            else {
                logger.log('info', 'No runtime API detected for messaging');
                // Add a fallback toggle method if runtime API is unavailable
                window.addEventListener('message', function(event) {
                    if (event.data && event.data.action === "toggleExtensionPlugin") {
                        callback(event.data.checked);
                    }
                });

                return false;
            }
        } catch (error) {
            logger.log('error', `Error setting up message listeners: ${error.message}`);
            return false;
        }
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

    const preBlock = prepareSourceCode(fileContent, elementInfo);

    let pathSegments = elementInfo.sourceFile.split('/');
    let fileNameAndLineNumber = pathSegments.pop();
    let remainingPath = pathSegments.join('/');

    elements.panel.innerHTML = `
    <div>${remainingPath}/<strong style="font-size: large; color: #8fce00;">${fileNameAndLineNumber}::${elementInfo.sourceLine}</strong></div>
  `;
    elements.panel.appendChild(preBlock);

    // Scroll to highlighted line
    setTimeout(() => {
        const highlightedLine = document.getElementById(CONSTANTS.DOM_IDS.HIGHLIGHTED_LINE);
        if (highlightedLine) {
            const lineHeight = getLineHeight(preBlock);
            const offsetAdjustment = 4;
            preBlock.scrollTop = highlightedLine.offsetTop - offsetAdjustment * lineHeight;
        }
    }, 0);

    // Highlight corresponding file in the tree view
    highlightTreeFile(elementInfo.sourceFile);
}

// Prepare source code display
function prepareSourceCode(fileContent, elementInfo) {
    const lines = fileContent.split('\n');
    const scrollToLine = parseInt(elementInfo.sourceLine);
    const formattedLines = lines.map((line, index) => {
        const escapedLine = escapeHtml(line);
        const lineNumber = index + 1;
        if (lineNumber === scrollToLine) {
            return `<span id="${CONSTANTS.DOM_IDS.HIGHLIGHTED_LINE}" style="background-color: #2F8464; color: white; display: block;">${lineNumber}: ${escapedLine}</span>`;
        } else {
            return `<span style="display: block;">${lineNumber}: ${escapedLine}</span>`;
        }
    }).join('');

    const preBlock = domUtils.createElement('pre', {
        styles: {
            fontSize: '12px',
            border: '1px solid black',
            overflowY: 'scroll',
            maxHeight: '800px'
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

    // Highlight any folder that matches a part of the path
    pathParts.forEach(part => {
        const folders = elements.fileTreePanel.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_FOLDER}`);
        folders.forEach(folder => {
            if (folder.textContent === part) {
                folder.classList.add(CONSTANTS.CLASSES.TREE_FOLDER_SELECTED);

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
            }
        });
    });
}

// Function to highlight a file in the tree view
function highlightTreeFile(filePath) {
    if (!elements.fileTreePanel) return;

    logger.log('info', `Highlighting file in tree: ${filePath}`);

    // First, clear any existing highlights
    const allFiles = elements.fileTreePanel.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_FILE}`);
    allFiles.forEach(file => {
        file.classList.remove(CONSTANTS.CLASSES.TREE_FILE_SELECTED);
    });

    const allFolders = elements.fileTreePanel.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_FOLDER}`);
    allFolders.forEach(folder => {
        folder.classList.remove(CONSTANTS.CLASSES.TREE_FOLDER_SELECTED);
    });

    // Find and highlight the file
    const fileElement = elements.fileTreePanel.querySelector(`.${CONSTANTS.CLASSES.TREE_FILE}[data-path="${filePath}"]`);
    if (fileElement) {
        fileElement.classList.add(CONSTANTS.CLASSES.TREE_FILE_SELECTED);

        // Also make sure the file is visible by expanding all parent folders
        ensureFileVisible(fileElement);

        // Scroll the file into view if needed
        fileElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        logger.log('info', `File found and highlighted: ${filePath}`);
    } else {
        logger.log('info', `File not found in tree: ${filePath}`);

        // Try to match by filename if full path doesn't match
        const fileName = filePath.split('/').pop();
        const fileByName = elements.fileTreePanel.querySelector(`.${CONSTANTS.CLASSES.TREE_FILE}[data-filename="${fileName}"]`);
        if (fileByName) {
            fileByName.classList.add(CONSTANTS.CLASSES.TREE_FILE_SELECTED);
            ensureFileVisible(fileByName);
            fileByName.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            logger.log('info', `File found by name and highlighted: ${fileName}`);
        } else {
            // If we still can't find it, highlight parent folders that match part of the path
            highlightParentFolders(filePath);
        }
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
                textContent: key,
                attributes: { 'data-path': nodeInfo._path || key }
            });
            nodeElement.appendChild(folderSpan);

            container.appendChild(nodeElement);

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

            // Add file icon and name
            const fileSpan = domUtils.createElement('span', {
                classes: [CONSTANTS.CLASSES.TREE_FILE],
                textContent: key,
                attributes: {
                    'title': nodeInfo._path,
                    'data-path': nodeInfo._path,
                    'data-filename': key
                }
            });
            nodeElement.appendChild(fileSpan);

            // Add line numbers as a small hint
            if (nodeInfo._lines && nodeInfo._lines.length > 0) {
                const linesSpan = domUtils.createElement('span', {
                    styles: {
                        color: '#75715E',
                        fontSize: '0.8em',
                        marginLeft: '5px'
                    },
                    textContent: `(${nodeInfo._lines.length} line${nodeInfo._lines.length > 1 ? 's' : ''})`
                });
                nodeElement.appendChild(linesSpan);
            }

            // Changed from mouseover to click event
            nodeElement.addEventListener('click', async function() {
                try {
                    const sourceCodeUrl = `${CONSTANTS.URLS.BASE_API_URL}${nodeInfo._path}`;
                    logger.log('info', `Fetching source code from: ${sourceCodeUrl}`);
                    const fileContent = await fetchSourceCode(nodeInfo._path);

                    if (fileContent) {
                        const elementInfo = {
                            sourceFile: nodeInfo._path,
                            sourceLine: nodeInfo._lines[0] || '1' // Default to first line
                        };
                        updateBottomPanel(elementInfo, fileContent);

                        // Select this file in the tree
                        highlightTreeFile(nodeInfo._path);
                    }
                } catch (error) {
                    logger.log('error', `Error loading file from tree: ${error.message}`);
                }
            });

            container.appendChild(nodeElement);
        }
    }
}

// Render the file tree
function renderFileTree() {
    if (!elements.fileTreePanel) {
        logger.log('error', 'File tree panel not initialized');
        return;
    }

    logger.log('info', 'Rendering file tree');

    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();

    const titleDiv = domUtils.createElement('div', {
        classes: [CONSTANTS.CLASSES.FILE_TREE_TITLE],
        textContent: 'Source Files'
    });
    fragment.appendChild(titleDiv);

    // Add a refresh button
    const refreshButton = domUtils.createElement('button', {
        classes: [CONSTANTS.CLASSES.FILE_TREE_REFRESH],
        textContent: 'Refresh',
        eventListeners: {
            click: function() {
                logger.log('info', 'Manual refresh requested');
                scanForSourceFiles();
            }
        }
    });
    fragment.appendChild(refreshButton);

    // Check if file tree is empty
    if (!state.fileTree || Object.keys(state.fileTree).length === 0) {
        const emptyMessage = domUtils.createElement('div', {
            styles: { color: '#F92672', padding: '10px' },
            textContent: 'No source files found'
        });
        fragment.appendChild(emptyMessage);

        // Update the panel content
        elements.fileTreePanel.innerHTML = '';
        elements.fileTreePanel.appendChild(fragment);
        logger.log('info', 'No files in the tree to render');
        return;
    }

    const treeRoot = document.createElement('div');
    renderTreeNode(treeRoot, state.fileTree, 0);
    fragment.appendChild(treeRoot);

    // Update the panel content
    elements.fileTreePanel.innerHTML = '';
    elements.fileTreePanel.appendChild(fragment);
    logger.log('info', 'Tree rendering complete');
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

// Toggle lock state
function toggleLock() {
    state.isLocked = !state.isLocked;
    logger.log('info', `Lock state: ${state.isLocked}`);

    if (state.isLocked && state.lockedElement) {
        state.lockedElement.classList.add(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT);
    } else if (state.lockedElement) {
        state.lockedElement.classList.remove(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT);
    }

    // Debug the file tree when toggling lock
    if (state.isLocked) {
        logger.log('debug', 'Current file tree keys:', Object.keys(state.fileTree));
    }
}

// Handle key press for lock and other keyboard shortcuts
function handleKeyPress(e) {
    // Toggle lock with 'l' or 'L' key
    if (e.key.toLowerCase() === CONSTANTS.KEYS.TOGGLE_LOCK.key.toLowerCase()) {
        toggleLock();
    }

    // Toggle extension with Alt+Shift+T
    if (e.altKey && e.shiftKey && e.key === CONSTANTS.KEYS.TOGGLE_EXTENSION.key) {
        toggleExtensionPlugin(!state.extensionEnabled);
    }
}

// Handle mouseover event
async function handleMouseOver(e) {
    if (state.isLocked || !state.extensionEnabled) return;

    // Skip if the target is in any of our panels
    if ((elements.panel && elements.panel.contains(e.target)) ||
        (elements.fileTreePanel && elements.fileTreePanel.contains(e.target))) return;

    state.lockedElement = e.target;
    const elementInfo = {
        sourceFile: e.target.getAttribute('data-source-file'),
        sourceLine: e.target.getAttribute('data-source-line')
    };

    if (elementInfo.sourceFile && elementInfo.sourceLine) {
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
    if (state.isLocked || !state.extensionEnabled) return;

    // Skip if the target is in any of our panels
    if ((elements.panel && elements.panel.contains(e.target)) ||
        (elements.fileTreePanel && elements.fileTreePanel.contains(e.target))) return;

    if (e.target.classList.contains(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT)) {
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

// ===================================================================
// 8. INITIALIZATION AND MAIN FUNCTIONALITY
// ===================================================================

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

    // Make sure UI is initialized
    if (!state.isInitialized) {
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
        // Hide panels
        domUtils.setElementVisibility(elements.panel, false);
        domUtils.setElementVisibility(elements.fileTreePanel, false);
        domUtils.setElementVisibility(elements.resizeHandle, false);
        domUtils.setElementVisibility(elements.horizontalResizeHandle, false);

        detachEventListeners();
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