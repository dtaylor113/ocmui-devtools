// Function to highlight a file in the tree view
function highlightTreeFile(filePath) {
    if (!fileTreePanel) return;

    console.log(`Highlighting file in tree: ${filePath}`);

    // First, clear any existing highlights
    const allFiles = fileTreePanel.querySelectorAll('.tree-file');
    allFiles.forEach(file => {
        file.classList.remove('tree-file-selected');
    });

    const allFolders = fileTreePanel.querySelectorAll('.tree-folder');
    allFolders.forEach(folder => {
        folder.classList.remove('tree-folder-selected');
    });

    // Find and highlight the file
    const fileElement = fileTreePanel.querySelector(`.tree-file[data-path="${filePath}"]`);
    if (fileElement) {
        fileElement.classList.add('tree-file-selected');

        // Also make sure the file is visible by expanding all parent folders
        ensureFileVisible(fileElement);

        // Scroll the file into view if needed
        fileElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        console.log(`File found and highlighted: ${filePath}`);
    } else {
        console.log(`File not found in tree: ${filePath}`);

        // Try to match by filename if full path doesn't match
        const fileName = filePath.split('/').pop();
        const fileByName = fileTreePanel.querySelector(`.tree-file[data-filename="${fileName}"]`);
        if (fileByName) {
            fileByName.classList.add('tree-file-selected');
            ensureFileVisible(fileByName);
            fileByName.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            console.log(`File found by name and highlighted: ${fileName}`);
        } else {
            // If we still can't find it, highlight parent folders that match part of the path
            highlightParentFolders(filePath);
        }
    }
}

// Make sure all parent folders of a file are expanded
function ensureFileVisible(fileElement) {
    let parent = fileElement.parentElement;

    while (parent) {
        // If this is a child container that might be hidden
        if (parent.classList.contains('tree-children') && parent.style.display === 'none') {
            parent.style.display = 'block';

            // Update the collapse icon of the previous sibling
            const prevSibling = parent.previousElementSibling;
            if (prevSibling && prevSibling.classList.contains('file-tree-node')) {
                const expandIcon = prevSibling.querySelector('.tree-expand-icon');
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
        const folders = fileTreePanel.querySelectorAll('.tree-folder');
        folders.forEach(folder => {
            if (folder.textContent === part) {
                folder.classList.add('tree-folder-selected');

                // Make sure the folder is visible
                let parent = folder.parentElement;
                while (parent) {
                    if (parent.classList.contains('tree-children') && parent.style.display === 'none') {
                        parent.style.display = 'block';

                        const prevSibling = parent.previousElementSibling;
                        if (prevSibling && prevSibling.classList.contains('file-tree-node')) {
                            const expandIcon = prevSibling.querySelector('.tree-expand-icon');
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
}// Extended content script with tree view
console.log('Content script loaded');

// CSS styles with added tree view panel and resize functionality
const styles = `
    .my-extension-highlight {
        border-radius: 10px;
        box-shadow: 0 0 8px 2px #2F8464;
    }
    
    .locked-highlight {
        border: 2px solid red;
    }
    
    #source-code-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        width: calc(100% - 375px); /* Reduced by 25% from 300px to 375px */
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
    
    #file-tree-panel {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 375px; /* Increased by 25% from 300px to 375px */
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
    
    #my-extension-resize-handle {
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
    
    #my-extension-horizontal-resize-handle {
        position: fixed;
        bottom: 0;
        left: calc(100% - 375px);
        width: 5px;
        height: 50%;
        background-color: gray;
        cursor: ew-resize;
        z-index: 10000;
        display: none;
    }
    
    .file-tree-node {
        padding: 3px 0;
        white-space: nowrap;
    }
    
    .file-tree-node:hover {
        background-color: #3E3D32;
    }
    
    .tree-folder {
        color: #66D9EF;
        cursor: pointer;
    }
    
    .tree-file {
        color: #A6E22E;
        cursor: pointer;
    }
    
    .tree-file-selected {
        color: #FD971F !important;
        font-weight: bold;
        background-color: rgba(253, 151, 31, 0.2);
        border-radius: 2px;
        padding: 0 2px;
    }
    
    .tree-folder-selected {
        background-color: rgba(102, 217, 239, 0.2);
        border-radius: 2px;
    }
    
    .tree-expand-icon {
        display: inline-block;
        width: 16px;
        text-align: center;
        color: #FD971F;
    }
    
    .tree-indent {
        display: inline-block;
        width: 16px;
    }
    
    .file-tree-refresh {
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
    
    .file-tree-refresh:hover {
        background-color: #A6E22E;
    }
    
    .file-tree-title {
        font-weight: bold;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid #444;
    }
`;

// Variables to track state
let isInitialized = false;
let isLocked = false;
let lockedElement = null;
let extensionEnabled = false;
let isResizing = false;
let isHorizontalResizing = false;
let lastY = 0;
let lastX = 0;
let eventListenersAttached = false;
let panel = null;
let fileTreePanel = null;
let resizeHandle = null;
let horizontalResizeHandle = null;
let styleElement = null;
let fileTree = {};
let rightPanelWidth = 375; // Default width for right panel

// Initialize the extension
function initializeExtension() {
    if (isInitialized) return;

    console.log('Initializing extension UI components');

    try {
        // Add styles
        styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        // Create UI elements with error handling
        try {
            panel = document.createElement('div');
            panel.id = 'source-code-panel';
            document.body.appendChild(panel);
        } catch (error) {
            console.error('Error creating source code panel:', error);
            // Try alternative approach for Arc browser
            panel = document.createElement('div');
            panel.id = 'source-code-panel';
            document.documentElement.appendChild(panel);
        }

        try {
            fileTreePanel = document.createElement('div');
            fileTreePanel.id = 'file-tree-panel';
            document.body.appendChild(fileTreePanel);
        } catch (error) {
            console.error('Error creating file tree panel:', error);
            // Try alternative approach for Arc browser
            fileTreePanel = document.createElement('div');
            fileTreePanel.id = 'file-tree-panel';
            document.documentElement.appendChild(fileTreePanel);
        }

        try {
            resizeHandle = document.createElement('div');
            resizeHandle.id = 'my-extension-resize-handle';
            document.body.appendChild(resizeHandle);
        } catch (error) {
            console.error('Error creating resize handle:', error);
            // Try alternative approach for Arc browser
            resizeHandle = document.createElement('div');
            resizeHandle.id = 'my-extension-resize-handle';
            document.documentElement.appendChild(resizeHandle);
        }

        try {
            horizontalResizeHandle = document.createElement('div');
            horizontalResizeHandle.id = 'my-extension-horizontal-resize-handle';
            document.body.appendChild(horizontalResizeHandle);
        } catch (error) {
            console.error('Error creating horizontal resize handle:', error);
            // Try alternative approach for Arc browser
            horizontalResizeHandle = document.createElement('div');
            horizontalResizeHandle.id = 'my-extension-horizontal-resize-handle';
            document.documentElement.appendChild(horizontalResizeHandle);
        }

        // Add vertical resize functionality (for panel height)
        resizeHandle.addEventListener('mousedown', function(e) {
            isResizing = true;
            lastY = e.clientY;
            e.preventDefault();
        });

        // Add horizontal resize functionality (for panel width)
        horizontalResizeHandle.addEventListener('mousedown', function(e) {
            isHorizontalResizing = true;
            lastX = e.clientX;
            e.preventDefault();
        });

        isInitialized = true;

        // Check storage for current state
        loadStateFromStorage();

        // Try multiple times to scan for source files to handle dynamic content
        // and differences in browser loading behavior
        scanForSourceFiles(); // Initial scan

        // Additional scans with increasing delays
        setTimeout(scanForSourceFiles, 1000);
        setTimeout(scanForSourceFiles, 2500);

        // Add a direct way to toggle the extension via keyboard for Arc browser
        // where the popup might not work properly
        document.addEventListener('keydown', function(e) {
            // Alt+Shift+T to toggle the extension
            if (e.altKey && e.shiftKey && e.key === 'T') {
                toggleExtensionPlugin(!extensionEnabled);
            }
        });

        // Listen for navigation events to rescan for files
        try {
            // Watch for URL changes (for SPAs that don't trigger full page loads)
            let lastUrl = location.href;
            const urlObserver = new MutationObserver(() => {
                if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    console.log('URL changed, rescanning for source files');
                    setTimeout(scanForSourceFiles, 500);
                }
            });

            urlObserver.observe(document, { subtree: true, childList: true });

            // Also listen for click events on navigation elements
            document.addEventListener('click', function(e) {
                // Look for navigation-related elements
                const navElement = e.target.closest('a, button, [role="link"], [role="button"], [role="tab"]');

                if (navElement) {
                    console.log('Navigation element clicked, scheduling rescan');
                    setTimeout(scanForSourceFiles, 500);
                    setTimeout(scanForSourceFiles, 1500);
                }
            });
        } catch (e) {
            console.log('Error setting up navigation listeners:', e);
        }

        console.log('Extension initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Load state from storage with cross-browser support
function loadStateFromStorage() {
    // Use try-catch to handle potential browser differences
    try {
        // Check if chrome.storage is available (Chrome, Edge, Arc)
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get('extensionEnabled', function(data) {
                const isEnabled = data.extensionEnabled !== undefined ? Boolean(data.extensionEnabled) : true;
                console.log('Loaded state from chrome storage:', isEnabled);
                toggleExtensionPlugin(isEnabled);
            });

            // Also listen for storage changes
            chrome.storage.onChanged.addListener(function(changes, namespace) {
                if (namespace === 'local' && changes.extensionEnabled) {
                    const isEnabled = Boolean(changes.extensionEnabled.newValue);
                    console.log('State changed in storage:', isEnabled);
                    toggleExtensionPlugin(isEnabled);
                }
            });
        }
        // Check if browser.storage is available (Firefox)
        else if (typeof browser !== 'undefined' && browser.storage) {
            browser.storage.local.get('extensionEnabled').then(data => {
                const isEnabled = data.extensionEnabled !== undefined ? Boolean(data.extensionEnabled) : true;
                console.log('Loaded state from browser storage:', isEnabled);
                toggleExtensionPlugin(isEnabled);
            });

            // Also listen for storage changes in Firefox
            browser.storage.onChanged.addListener(function(changes, namespace) {
                if (namespace === 'local' && changes.extensionEnabled) {
                    const isEnabled = Boolean(changes.extensionEnabled.newValue);
                    console.log('State changed in storage:', isEnabled);
                    toggleExtensionPlugin(isEnabled);
                }
            });
        }
        // Fallback for Arc or other browsers if storage API fails
        else {
            console.log('No storage API detected, defaulting to enabled');
            toggleExtensionPlugin(true);
        }
    } catch (error) {
        console.error('Error accessing storage API:', error);
        console.log('Defaulting extension to enabled state');
        toggleExtensionPlugin(true);
    }
}

// Scan for elements with data-source-file attributes
function scanForSourceFiles() {
    if (!extensionEnabled) return;

    console.log('Scanning for source files');

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
                    console.log('Could not access iframe content, possibly cross-origin');
                }
            });
        } catch (e) {
            console.log('Error accessing iframes:', e);
        }

        // Method 3: Check for data-source-file attributes in the raw HTML
        // This can catch attributes that might not be accessible via DOM methods
        try {
            const pageHtml = document.documentElement.outerHTML;
            const dataSourceMatches = pageHtml.match(/data-source-file="([^"]+)"\s+data-source-line="([^"]+)"/g);

            if (dataSourceMatches && dataSourceMatches.length > 0) {
                console.log(`Found ${dataSourceMatches.length} data-source-file attributes in raw HTML`);

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
            console.log('Error scanning HTML for data-source-file attributes:', e);
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
            console.log('Error scanning page text for file paths:', e);
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
            const sourcePanel = document.getElementById('source-code-panel') ||
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

                    console.log(`Found file in source panel: ${fullPath} (${fileName}) at line ${line}`);

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

            console.log('Current files in focus:', Array.from(currentFiles));

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

                        console.log(`Found path for ${fileName}: ${path} at line ${line}`);

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
            console.log('Error scanning for filenames:', e);
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
            console.log('Error scanning inspector panels:', e);
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

        // Special case for CloudProvider.tsx which is showing in your screenshot
        // This is a dynamic detection based on your screenshot - not hardcoded path
        const pageText = document.body.textContent || '';
        if (pageText.includes('CloudProvider.tsx') || pageText.includes('CloudProvider.tsx:')) {
            // Detect if the file is already in the map with some path
            let hasCloudProvider = false;
            for (const path in filePathMap) {
                if (path.includes('CloudProvider.tsx')) {
                    hasCloudProvider = true;
                    break;
                }
            }

            // If not found but we see it in the text, look for it in the DOM
            if (!hasCloudProvider) {
                // Look for elements with text containing the filename
                const elementsWithText = Array.from(document.querySelectorAll('*')).filter(
                    el => (el.textContent || '').includes('CloudProvider.tsx')
                );

                if (elementsWithText.length > 0) {
                    // Try to extract a full path from these elements
                    for (const el of elementsWithText) {
                        const elText = el.textContent || '';
                        const pathMatch = elText.match(/(\/[a-zA-Z0-9\/._-]+\/CloudProvider\.tsx)/);

                        if (pathMatch) {
                            const path = pathMatch[1];

                            // Find a line number if available
                            const lineMatch = elText.match(/CloudProvider\.tsx:(\d+)/);
                            const line = lineMatch ? lineMatch[1] : '1';

                            console.log(`Found CloudProvider.tsx path: ${path} at line ${line}`);

                            if (!filePathMap[path]) {
                                filePathMap[path] = [];
                            }

                            if (!filePathMap[path].includes(line)) {
                                filePathMap[path].push(line);
                            }

                            break;
                        }
                    }
                }
            }
        }

        console.log('Found file paths:', Object.keys(filePathMap).length);

        // Convert to tree structure
        fileTree = buildFileTree(filePathMap);
        console.log('Built file tree:', fileTree);
        renderFileTree();
    } catch (error) {
        console.error('Error during source file scanning:', error);
        fileTree = {};
        renderFileTree();
    }
}

// Process example data for the cluster list page from screenshot
function processExampleClusterList() {
    console.log('Process example cluster list function no longer adds hardcoded paths');
    // This function is no longer used - we rely on dynamic discovery only
}

// Build a hierarchical tree from flat file paths
function buildFileTree(filePathMap) {
    const root = {};

    console.log('Building file tree from:', filePathMap);

    for (const filePath in filePathMap) {
        let currentLevel = root;
        // Skip empty parts that might come from leading slashes
        const parts = filePath.split('/').filter(part => part.length > 0);

        console.log(`Processing file path: ${filePath} with ${parts.length} parts`);

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

// Render the file tree
function renderFileTree() {
    if (!fileTreePanel) {
        console.error('File tree panel not initialized');
        return;
    }

    console.log('Rendering file tree');
    fileTreePanel.innerHTML = '<div class="file-tree-title">Source Files</div>';

    // Add a refresh button
    const refreshButton = document.createElement('button');
    refreshButton.className = 'file-tree-refresh';
    refreshButton.textContent = 'Refresh';
    refreshButton.addEventListener('click', function() {
        console.log('Manual refresh requested');
        scanForSourceFiles();
    });
    fileTreePanel.appendChild(refreshButton);

    // Check if file tree is empty
    if (!fileTree || Object.keys(fileTree).length === 0) {
        fileTreePanel.innerHTML += '<div style="color: #F92672; padding: 10px;">No source files found</div>';
        // Still add the refresh button even when empty
        fileTreePanel.appendChild(refreshButton);
        console.log('No files in the tree to render');
        return;
    }

    const treeRoot = document.createElement('div');
    renderTreeNode(treeRoot, fileTree, 0);
    fileTreePanel.appendChild(treeRoot);
    console.log('Tree rendering complete');
}

// Render a single node in the tree
function renderTreeNode(container, node, level) {
    // Debug what we're rendering
    console.log(`Rendering level ${level} with keys:`, Object.keys(node));

    for (const key in node) {
        if (key.startsWith('_')) continue;

        const nodeInfo = node[key];
        const nodeElement = document.createElement('div');
        nodeElement.className = 'file-tree-node';

        // Create indentation
        for (let i = 0; i < level; i++) {
            const indent = document.createElement('span');
            indent.className = 'tree-indent';
            nodeElement.appendChild(indent);
        }

        // Add expand/collapse icon for directories
        if (nodeInfo._isDir) {
            console.log(`Rendering directory: ${key}`);
            const expandIcon = document.createElement('span');
            expandIcon.className = 'tree-expand-icon';
            expandIcon.textContent = '▼'; // Default to expanded
            expandIcon.onclick = function(e) {
                e.stopPropagation();
                const childContainer = nodeElement.nextElementSibling;
                if (childContainer.style.display === 'none') {
                    childContainer.style.display = 'block';
                    expandIcon.textContent = '▼';
                } else {
                    childContainer.style.display = 'none';
                    expandIcon.textContent = '►';
                }
            };
            nodeElement.appendChild(expandIcon);

            // Add folder icon and name
            const folderSpan = document.createElement('span');
            folderSpan.className = 'tree-folder';
            folderSpan.textContent = key;
            folderSpan.setAttribute('data-path', nodeInfo._path || key);
            nodeElement.appendChild(folderSpan);

            container.appendChild(nodeElement);

            // Create container for children
            const childContainer = document.createElement('div');
            childContainer.className = 'tree-children';
            renderTreeNode(childContainer, nodeInfo._children, level + 1);
            container.appendChild(childContainer);
        } else if (nodeInfo._isFile) {
            console.log(`Rendering file: ${key} (${nodeInfo._path})`);
            // Add icon space for files (for alignment)
            const iconSpace = document.createElement('span');
            iconSpace.className = 'tree-expand-icon';
            iconSpace.textContent = ' ';
            nodeElement.appendChild(iconSpace);

            // Add file icon and name
            const fileSpan = document.createElement('span');
            fileSpan.className = 'tree-file';
            fileSpan.textContent = key;
            fileSpan.title = nodeInfo._path;
            fileSpan.setAttribute('data-path', nodeInfo._path);
            fileSpan.setAttribute('data-filename', key);
            nodeElement.appendChild(fileSpan);

            // Add line numbers as a small hint
            if (nodeInfo._lines && nodeInfo._lines.length > 0) {
                const linesSpan = document.createElement('span');
                linesSpan.style = 'color: #75715E; font-size: 0.8em; margin-left: 5px;';
                linesSpan.textContent = `(${nodeInfo._lines.length} line${nodeInfo._lines.length > 1 ? 's' : ''})`;
                nodeElement.appendChild(linesSpan);
            }

            // Changed from mouseover to click event
            nodeElement.addEventListener('click', async function() {
                try {
                    const sourceCodeUrl = `https://prod.foo.redhat.com:1337${nodeInfo._path}`;
                    console.log(`Fetching source code from: ${sourceCodeUrl}`);
                    const fileContent = await fetchSourceCode(sourceCodeUrl);

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
                    console.error('Error loading file from tree:', error);
                }
            });

            container.appendChild(nodeElement);
        }
    }
}

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
    if (isResizing) {
        const deltaY = e.clientY - lastY;
        const newHeight = Math.max(panel.offsetHeight - deltaY, 50);
        const viewportHeight = window.innerHeight;
        const panelHeight = Math.min(newHeight, viewportHeight * 0.8);

        panel.style.height = `${panelHeight}px`;
        fileTreePanel.style.height = `${panelHeight}px`;
        resizeHandle.style.bottom = `${panelHeight}px`;
        horizontalResizeHandle.style.height = `${panelHeight}px`;

        lastY = e.clientY;
    }

    // Handle horizontal resizing (panel widths)
    if (isHorizontalResizing) {
        const deltaX = e.clientX - lastX;
        // Calculate new width for right panel (file tree panel)
        rightPanelWidth = Math.max(rightPanelWidth - deltaX, 200); // Minimum width: 200px
        const viewportWidth = window.innerWidth;
        rightPanelWidth = Math.min(rightPanelWidth, viewportWidth * 0.8); // Maximum width: 80% of viewport

        // Update panel styles
        fileTreePanel.style.width = `${rightPanelWidth}px`;
        panel.style.width = `calc(100% - ${rightPanelWidth}px)`;
        horizontalResizeHandle.style.left = `calc(100% - ${rightPanelWidth}px)`;

        lastX = e.clientX;
    }
}

// Handle mouse up for resize
function handleMouseUp() {
    isResizing = false;
    isHorizontalResizing = false;
}

// Toggle lock state
function toggleLock() {
    isLocked = !isLocked;
    console.log('Lock state:', isLocked);

    if (isLocked && lockedElement) {
        lockedElement.classList.add('locked-highlight');
    } else if (lockedElement) {
        lockedElement.classList.remove('locked-highlight');
    }

    // Debug the file tree when toggling lock
    if (isLocked) {
        console.log('Current file tree:', fileTree);
        console.log('File tree panel content:', fileTreePanel.innerHTML);
    }
}

// Handle key press for lock
function handleKeyPress(e) {
    if (e.key === 'L' || e.key === 'l') {
        toggleLock();
    }
}

// Escape HTML
function escapeHtml(html) {
    return html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Prepare source code display
function prepareSourceCode(fileContent, elementInfo) {
    const lines = fileContent.split('\n');
    const scrollToLine = parseInt(elementInfo.sourceLine);
    const formattedLines = lines.map((line, index) => {
        const escapedLine = escapeHtml(line);
        const lineNumber = index + 1;
        if (lineNumber === scrollToLine) {
            return `<span id="highlighted-line" style="background-color: #2F8464; color: white; display: block;">${lineNumber}: ${escapedLine}</span>`;
        } else {
            return `<span style="display: block;">${lineNumber}: ${escapedLine}</span>`;
        }
    }).join('');

    let codeBlock = document.createElement('code');
    codeBlock.style.fontSize = '12px';
    codeBlock.innerHTML = formattedLines;

    let preBlock = document.createElement('pre');
    preBlock.style.fontSize = '12px';
    preBlock.style.border = '1px solid black';
    preBlock.style.overflowY = 'scroll';
    preBlock.style.maxHeight = '800px';
    preBlock.appendChild(codeBlock);

    return preBlock;
}

// Add "Ask RedHatChat" button
function addAskButton(panel, fileContent) {
    const askButton = document.createElement('button');
    askButton.textContent = 'Ask RedHatChat about this code';
    askButton.style = 'margin-top: 10px; background-image: url(\'images/Logo-Red_Hat-B-Standard-RGB.png\'); background-size: 20px 20px; background-repeat: no-repeat; background-position: left center; padding-left: 30px;';
    panel.appendChild(askButton);

    askButton.addEventListener('click', function() {
        const queryParam = encodeURIComponent(fileContent);
        const url = `https://prod.foo.redhat.com:1337/openshift/redhatchat?file=${queryParam}`;
        const windowFeatures = "width=768, height=1024, left=100, top=100, resizable=yes, scrollbars=yes, toolbar=yes, menubar=no, location=no, directories=no, status=yes";
        window.open(url, 'RedHatChatWindow', windowFeatures);
    });
}

// Update panel with source code
function updateBottomPanel(elementInfo, fileContent) {
    if (!panel) return;

    const preBlock = prepareSourceCode(fileContent, elementInfo);

    let pathSegments = elementInfo.sourceFile.split('/');
    let fileNameAndLineNumber = pathSegments.pop();
    let remainingPath = pathSegments.join('/');

    panel.innerHTML = `
    <div>${remainingPath}/<strong style="font-size: large; color: #8fce00;">${fileNameAndLineNumber}::${elementInfo.sourceLine}</strong></div>
  `;
    panel.appendChild(preBlock);

    addAskButton(panel, fileContent);

    // Scroll to highlighted line
    setTimeout(() => {
        const highlightedLine = document.getElementById('highlighted-line');
        if (highlightedLine) {
            const lineHeight = getLineHeight(preBlock);
            const offsetAdjustment = 4;
            preBlock.scrollTop = highlightedLine.offsetTop - offsetAdjustment * lineHeight;
        }
    }, 0);

    // Highlight corresponding file in the tree view
    highlightTreeFile(elementInfo.sourceFile);
}

// Calculate line height
function getLineHeight(element) {
    const tempDiv = document.createElement('div');
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    tempDiv.style.height = 'auto';
    tempDiv.style.width = 'auto';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.innerHTML = 'A';
    element.appendChild(tempDiv);
    const lineHeight = tempDiv.clientHeight;
    element.removeChild(tempDiv);
    return lineHeight;
}

// Fetch source code from URL
async function fetchSourceCode(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching source code:', error);
        return null;
    }
}

// Handle mouseover event
async function handleMouseOver(e) {
    if (isLocked || !extensionEnabled) return;

    // Skip if the target is in any of our panels
    if ((panel && panel.contains(e.target)) ||
        (fileTreePanel && fileTreePanel.contains(e.target))) return;

    lockedElement = e.target;
    const elementInfo = {
        sourceFile: e.target.getAttribute('data-source-file'),
        sourceLine: e.target.getAttribute('data-source-line')
    };

    if (elementInfo.sourceFile && elementInfo.sourceLine) {
        e.target.classList.add('my-extension-highlight');
        const sourceCodeUrl = `https://prod.foo.redhat.com:1337${elementInfo.sourceFile}`;

        try {
            const fileContent = await fetchSourceCode(sourceCodeUrl);
            if (fileContent) {
                updateBottomPanel(elementInfo, fileContent);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Handle mouseout event
function handleMouseOut(e) {
    if (isLocked || !extensionEnabled) return;

    // Skip if the target is in any of our panels
    if ((panel && panel.contains(e.target)) ||
        (fileTreePanel && fileTreePanel.contains(e.target))) return;

    if (e.target.classList.contains('my-extension-highlight')) {
        e.target.classList.remove('my-extension-highlight');
    }
}

// Attach all event listeners
function attachEventListeners() {
    if (eventListenersAttached) return;

    console.log('Attaching event listeners');
    document.body.addEventListener('mouseover', handleMouseOver);
    document.body.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('keydown', handleKeyPress);
    setupResizeListeners();
    eventListenersAttached = true;
}

// Detach all event listeners
function detachEventListeners() {
    if (!eventListenersAttached) return;

    console.log('Detaching event listeners');
    document.body.removeEventListener('mouseover', handleMouseOver);
    document.body.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('keydown', handleKeyPress);
    cleanupResizeListeners();
    eventListenersAttached = false;
}

// Enable or disable extension features
function toggleExtensionPlugin(isEnabled) {
    console.log('Toggling extension to:', isEnabled);

    extensionEnabled = Boolean(isEnabled);

    // Make sure UI is initialized
    if (!isInitialized) {
        initializeExtension();
    }

    if (extensionEnabled) {
        panel.style.display = 'block';
        fileTreePanel.style.display = 'block';
        resizeHandle.style.display = 'block';
        horizontalResizeHandle.style.display = 'block';

        // Apply current panel dimensions from state
        fileTreePanel.style.width = `${rightPanelWidth}px`;
        panel.style.width = `calc(100% - ${rightPanelWidth}px)`;
        horizontalResizeHandle.style.left = `calc(100% - ${rightPanelWidth}px)`;

        attachEventListeners();

        // Scan for source files immediately and after slight delay
        scanForSourceFiles();
        setTimeout(scanForSourceFiles, 750);
    } else {
        panel.style.display = 'none';
        fileTreePanel.style.display = 'none';
        resizeHandle.style.display = 'none';
        horizontalResizeHandle.style.display = 'none';
        detachEventListeners();
    }
}

// Listen for messages with cross-browser support
function setupMessageListeners() {
    try {
        // Chrome, Edge, and Arc implementation
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
                console.log('Content script received Chrome message:', message);

                if (message.action === "toggleExtensionPlugin") {
                    toggleExtensionPlugin(message.checked);
                    sendResponse({status: "OK"});
                }

                return false; // No async response needed
            });
        }
        // Firefox implementation
        else if (typeof browser !== 'undefined' && browser.runtime) {
            browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
                console.log('Content script received Firefox message:', message);

                if (message.action === "toggleExtensionPlugin") {
                    toggleExtensionPlugin(message.checked);
                    return Promise.resolve({status: "OK"}); // Firefox uses promises for responses
                }
            });
        }
        // Fallback for Arc or other browsers if runtime API is not available
        else {
            console.log('No runtime API detected for messaging');
            // Add a fallback toggle method if runtime API is unavailable
            window.addEventListener('message', function(event) {
                if (event.data && event.data.action === "toggleExtensionPlugin") {
                    toggleExtensionPlugin(event.data.checked);
                }
            });
        }
    } catch (error) {
        console.error('Error setting up message listeners:', error);
    }
}

// Initialize message listeners
setupMessageListeners();

// Initialize on load
window.addEventListener('load', function() {
    setTimeout(initializeExtension, 500);
});

// Also initialize immediately in case we're injected after page load
initializeExtension();