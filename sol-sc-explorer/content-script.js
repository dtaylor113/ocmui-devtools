// Simplified content script for Arc browser compatibility
console.log('Content script loaded');

// CSS styles
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
        width: 100%;
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
`;

// Variables to track state
let isInitialized = false;
let isLocked = false;
let lockedElement = null;
let extensionEnabled = false;
let isResizing = false;
let lastY = 0;
let eventListenersAttached = false;
let panel = null;
let resizeHandle = null;
let styleElement = null;

// Initialize the extension
function initializeExtension() {
    if (isInitialized) return;

    console.log('Initializing extension UI components');

    // Add styles
    styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    // Create UI elements
    panel = document.createElement('div');
    panel.id = 'source-code-panel';
    document.body.appendChild(panel);

    resizeHandle = document.createElement('div');
    resizeHandle.id = 'my-extension-resize-handle';
    document.body.appendChild(resizeHandle);

    // Add resize functionality
    resizeHandle.addEventListener('mousedown', function(e) {
        isResizing = true;
        lastY = e.clientY;
        e.preventDefault();
    });

    isInitialized = true;

    // Check storage for current state
    loadStateFromStorage();
}

// Load state from storage
function loadStateFromStorage() {
    chrome.storage.local.get('extensionEnabled', function(data) {
        const isEnabled = data.extensionEnabled !== undefined ? Boolean(data.extensionEnabled) : true;
        console.log('Loaded state from storage:', isEnabled);
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
    if (!isResizing) return;

    const deltaY = e.clientY - lastY;
    const newHeight = Math.max(panel.offsetHeight - deltaY, 50);

    panel.style.height = `${newHeight}px`;
    resizeHandle.style.bottom = `${newHeight}px`;

    lastY = e.clientY;
}

// Handle mouse up for resize
function handleMouseUp() {
    isResizing = false;
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

    if (panel && panel.contains(e.target)) return;

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

    if (panel && panel.contains(e.target)) return;

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
        resizeHandle.style.display = 'block';
        attachEventListeners();
    } else {
        panel.style.display = 'none';
        resizeHandle.style.display = 'none';
        detachEventListeners();
    }
}

// Listen for messages
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Content script received message:', message);

    if (message.action === "toggleExtensionPlugin") {
        toggleExtensionPlugin(message.checked);
        sendResponse({status: "OK"});
    }

    return false; // No async response needed
});

// Initialize on load
window.addEventListener('load', function() {
    setTimeout(initializeExtension, 500);
});

// Also initialize immediately in case we're injected after page load
initializeExtension();