// CSS class for highlighting elements
const highlightClass = 'my-extension-highlight';
const highlightStyle = `
    .${highlightClass} {
        border-radius: 10px; /* Rounded corners */
        box-shadow: 0 0 8px 2px #2F8464; /* Soft shadow with the highlight color */
    }`;

// Inject highlight style
const styleElement = document.createElement('style');
styleElement.textContent = highlightStyle;
document.head.appendChild(styleElement);

// Variable to track the locked state
let isLocked = false;
let lockedElement = null;

// Function to toggle lock state
function toggleLock() {
    isLocked = !isLocked;
    if (isLocked && lockedElement) {
        lockedElement.classList.add('locked-highlight');
    } else if (lockedElement) {
        lockedElement.classList.remove('locked-highlight');
    }
}

let extensionEnabled = true; // Default state is enabled

function makePanelResizable(panel, resizeHandle) {
    let isResizing = false;
    let lastY = 0;

    resizeHandle.addEventListener('mousedown', function (e) {
        isResizing = true;
        lastY = e.clientY;
        e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
        if (isResizing) {
            const deltaY = e.clientY - lastY; // Changed calculation of deltaY
            const newHeight = Math.max(panel.offsetHeight - deltaY, 50); // Calculate newHeight based on decreasing height as deltaY increases
            // Removed newBottom calculation as we always want the panel to stick to the bottom

            panel.style.height = `${newHeight}px`;
            // Removed the update to panel.style.bottom to keep the bottom fixed
            resizeHandle.style.bottom = `${newHeight}px`; // Update only the resizeHandle position

            lastY = e.clientY;
        }
    });

    window.addEventListener('mouseup', function () {
        isResizing = false;
    });
}

function initializePanel() {
    let panel = document.getElementById('source-code-panel');
    let resizeHandle = document.getElementById('my-extension-resize-handle');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'source-code-panel';
        panel.style = 'position: fixed; bottom: 0; left: 0; width: 100%; height: 50%; background-color: #272822; color: #F8F8F2; border-top: 1px solid #ddd; overflow: auto; padding: 10px; box-sizing: border-box; z-index: 9999;';

        resizeHandle = document.createElement('div');
        resizeHandle.id = 'my-extension-resize-handle';
        resizeHandle.style = 'position: fixed; bottom: 50%; left: 0; width: 100%; height: 5px; background-color: gray; cursor: ns-resize; z-index: 10000;';

        document.body.appendChild(resizeHandle);
        document.body.appendChild(panel);

        makePanelResizable(panel, resizeHandle);
    }
    return panel;
}

function escapeHtml(html) {
    return html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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

function addAskButton(panel, fileContent) {
    const askButton = document.createElement('button');
    askButton.textContent = 'Ask RedHatChat about this code';
    askButton.style = 'margin-top: 10px; background-image: url(\'images/Logo-Red_Hat-B-Standard-RGB.png\'); background-size: 20px 20px; background-repeat: no-repeat; background-position: left center; padding-left: 30px;';
    panel.appendChild(askButton);

    askButton.addEventListener('click', function () {
        const queryParam = encodeURIComponent(fileContent);
        const url = `https://prod.foo.redhat.com:1337/openshift/redhatchat?file=${queryParam}`;
        const windowFeatures = "width=768, height=1024, left=100, top=100, resizable=yes, scrollbars=yes, toolbar=yes, menubar=no, location=no, directories=no, status=yes";
        window.open(url, 'RedHatChatWindow', windowFeatures);
    });
}

function updateBottomPanel(elementInfo, fileContent) {
    const panel = initializePanel();

    const preBlock = prepareSourceCode(fileContent, elementInfo);

    let pathSegments = elementInfo.sourceFile.split('/');
    let fileNameAndLineNumber = pathSegments.pop();
    let remainingPath = pathSegments.join('/');

    panel.innerHTML = `
        <div>${remainingPath}/<strong style="font-size: large; color: #8fce00;">${fileNameAndLineNumber}::${elementInfo.sourceLine}</strong></div>
    `;
    panel.appendChild(preBlock);

    addAskButton(panel, fileContent);

    setTimeout(() => {
        const highlightedLine = document.getElementById('highlighted-line');
        if (highlightedLine) {
            const lineHeight = getLineHeight(preBlock);
            const offsetAdjustment = 4;
            preBlock.scrollTop = highlightedLine.offsetTop - offsetAdjustment * lineHeight;
        }
    }, 0);
}


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

async function fetchSourceCode(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        return data;
    } catch (error) {
        console.error('Error fetching source code:', error);
        return null;
    }
}

// Add CSS for locked highlight
const lockedHighlightStyle = `
    .locked-highlight {
        border: 2px solid red; // Red border for locked elements
    }`;
styleElement.textContent += lockedHighlightStyle;

function getStorage() {
    if (typeof browser !== 'undefined') {
        return browser.storage; // Firefox
    } else if (typeof chrome !== 'undefined') {
        return chrome.storage; // Chrome
    } else {
        throw new Error('Browser not supported');
    }
}

// Function to show or hide the bottom panel and toggle event listeners
function toggleExtensionPlugin(isEnabled) {
    extensionEnabled = isEnabled;
    const storage = getStorage();
    // Save the current state to storage
    storage.local.set({'extensionEnabled': isEnabled});

    const panel = document.getElementById('source-code-panel');
    const resizeHandle = document.getElementById('my-extension-resize-handle');

    if (extensionEnabled) {
        // Show the bottom panel if it exists
        if (panel) {
            panel.style.display = 'block';
        }
        if (resizeHandle) {
            resizeHandle.style.display = 'block';
        }
        // Start listening for mouse hover events
        document.body.addEventListener('mouseover', handleMouseOver);
        document.body.addEventListener('mouseout', handleMouseOut);
        document.addEventListener('keydown', handleKeyPress);
    } else {
        // Hide the bottom panel if it exists
        if (panel) {
            panel.style.display = 'none';
        }
        if (resizeHandle) {
            resizeHandle.style.display = 'none';
        }
        // Stop listening for mouse hover events
        document.body.removeEventListener('mouseover', handleMouseOver);
        document.body.removeEventListener('mouseout', handleMouseOut);
        document.removeEventListener('keydown', handleKeyPress);
    }
}

function handleMessage(message, sender, sendResponse) {
    if (message.action === "toggleExtensionPlugin") {
        toggleExtensionPlugin(message.checked);
    }
}

if (typeof browser !== 'undefined') {
    // Firefox
    browser.runtime.onMessage.addListener(handleMessage);
} else if (typeof chrome !== 'undefined') {
    // Chrome
    chrome.runtime.onMessage.addListener(handleMessage);
}

function handleKeyPress(event) {
    if (event.key === 'L' || event.key === 'l') {
        toggleLock();
    }
}

// Add event listener for 'L' key
document.addEventListener('keydown', handleKeyPress);

// Separate out the mouseover event handler into an async function
async function handleMouseOver(e) {
    if (isLocked || !extensionEnabled) return;

    const panel = document.getElementById('source-code-panel');
    if (panel && panel.contains(e.target)) {
        return;
    }

    lockedElement = e.target;
    const elementInfo = {
        sourceFile: e.target.getAttribute('data-source-file'),
        sourceLine: e.target.getAttribute('data-source-line')
    };

    if (elementInfo.sourceFile && elementInfo.sourceLine) {
        e.target.classList.add(highlightClass);
        const sourceCodeUrl = `https://prod.foo.redhat.com:1337${elementInfo.sourceFile}`;

        try {
            const fileContent = await fetchSourceCode(sourceCodeUrl);
            updateBottomPanel(elementInfo, fileContent);
        } catch (error) {
            console.error('Error fetching source code:', error);
        }
    }
}

// Attach the handleMouseOver function to the mouseover event
document.body.addEventListener('mouseover', handleMouseOver);

function handleMouseOut(e) {
    const panel = document.getElementById('source-code-panel');

    if (panel && panel.contains(e.target)) {
        return;
    }

    e.target.classList.remove(highlightClass);
}

document.body.addEventListener('mouseout', handleMouseOut);

