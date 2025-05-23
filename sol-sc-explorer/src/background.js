// /repos/ocmui-devtools/sol-sc-explorer/src/background.js
// (Content of your existing background.js file)

// Cross-browser compatible background script for Firefox, Chrome and Arc
console.log('Background script loaded');

// Global variable to store our state
let extensionEnabled = true;

// Initialize on load
chrome.storage.local.get('extensionEnabled', function(data) {
    extensionEnabled = data.extensionEnabled !== undefined ? Boolean(data.extensionEnabled) : true;
    console.log('Initial extension state:', extensionEnabled);
});

// Detect browser environment
const isFirefox = typeof browser !== 'undefined';
const isChrome = !isFirefox && typeof chrome !== 'undefined';
const runtime = isFirefox ? browser.runtime : chrome.runtime;

// Set up install handler
runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        console.log('Extension installed - initializing data');
        // Initialize with default settings
        chrome.storage.local.set({extensionEnabled: true});
    } else if (details.reason === 'update') {
        console.log('Extension updated from version ' + details.previousVersion);
    }
});

// Listen for storage changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.extensionEnabled) {
        extensionEnabled = Boolean(changes.extensionEnabled.newValue);
        console.log('Extension state updated from storage:', extensionEnabled);

        // Broadcast to all tabs
        broadcastStateToAllTabs();
    }
});

// Simple function to send message to a tab with cross-browser support
function sendMessageToTab(tabId, message) {
    try {
        if (isFirefox) {
            browser.tabs.sendMessage(tabId, message).catch(err => {
                // Ignore errors for Firefox - tab might not be ready
                // console.log(`Firefox: Error sending message to tab ${tabId}:`, err.message);
            });
        } else {
            chrome.tabs.sendMessage(tabId, message, function(response) {
                // Ignore errors for Chrome - tab might not be ready
                if (chrome.runtime.lastError) {
                    // console.log(`Chrome: Error sending message to tab ${tabId}:`, chrome.runtime.lastError.message);
                }
            });
        }
    } catch (err) {
        // Ignore generic errors - some tabs may not have content scripts
        // console.log(`Error sending message to tab ${tabId}:`, err.message);
    }
}

// Broadcast state to all tabs with cross-browser support
function broadcastStateToAllTabs() {
    if (isFirefox) {
        browser.tabs.query({}).then(tabs => {
            for (let tab of tabs) {
                if (tab.id) {
                   sendMessageToTab(tab.id, {
                        action: "toggleExtensionPlugin",
                        checked: extensionEnabled
                    });
                }
            }
        }).catch(err => console.log("Error querying tabs in Firefox:", err.message));
    } else {
        chrome.tabs.query({}, function(tabs) {
            if (chrome.runtime.lastError) {
                console.log("Error querying tabs in Chrome:", chrome.runtime.lastError.message);
                return;
            }
            for (let tab of tabs) {
                if (tab.id) {
                    sendMessageToTab(tab.id, {
                        action: "toggleExtensionPlugin",
                        checked: extensionEnabled
                    });
                }
            }
        });
    }
}

// This function will be called before the extension is disabled or uninstalled
function performCleanup() {
    console.log('Performing pre-uninstall cleanup');

    // First, disable the extension in storage
    extensionEnabled = false;
    chrome.storage.local.set({extensionEnabled: false}, function() {
        console.log('Extension disabled in storage');

        // Then broadcast to all tabs to clean up
        broadcastStateToAllTabs();
    });
}

// For clean shutdown, listen for browser close events where possible
// This is more reliable in Firefox than Chrome
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', function() {
        performCleanup();
    });
}

// Set up message handling with cross-browser support
runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Validate the request format first
    if (!request || typeof request !== 'object') {
        console.error('Received invalid message format:', request);
        sendResponse({error: "Invalid message format"});
        return true; // Indicate async response for older Chrome, or just return for newer.
    }

    // Always respond to pings immediately
    if (request.action === "ping") {
        sendResponse({status: "pong"});
        return false; // No async response needed
    }

    // Forward toggle requests to all tabs
    if (request.action === "toggleExtensionPlugin") {
        extensionEnabled = Boolean(request.checked);

        // Store state first
        chrome.storage.local.set({extensionEnabled: extensionEnabled}, function() {
            // Then broadcast to all tabs
            broadcastStateToAllTabs();

            // Finally, respond to caller
            sendResponse({status: "OK"});
        });

        return true; // Keep message channel open for the async response
    }

    if (request.action === "cleanup") {
        performCleanup();
        sendResponse({status: "Cleanup complete"});
        return false; // No async response needed
    }

    // Default response for unknown actions
    sendResponse({error: "Unknown action: " + request.action});
    return true; // Indicate async response for older Chrome, or just return for newer.
});

// When a tab updates, send current state
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        // Wait a moment for content scripts to initialize
        setTimeout(function() {
            sendMessageToTab(tabId, {
                action: "toggleExtensionPlugin",
                checked: extensionEnabled
            });
        }, 1000);
    }
});