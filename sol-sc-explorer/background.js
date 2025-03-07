// Minimal background script - designed for maximum compatibility
console.log('Background script loaded');

// Global variable to store our state
let extensionEnabled = true;

// Initialize on load
chrome.storage.local.get('extensionEnabled', function(data) {
    extensionEnabled = data.extensionEnabled !== undefined ? Boolean(data.extensionEnabled) : true;
    console.log('Initial extension state:', extensionEnabled);
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

// Simple function to send message to a tab
function sendMessageToTab(tabId, message) {
    try {
        chrome.tabs.sendMessage(tabId, message, function(response) {
            // We don't need to do anything with the response
            // Just avoid errors from disconnected tabs
        });
    } catch (err) {
        // Ignore errors - some tabs may not have content scripts
    }
}

// Broadcast state to all tabs
function broadcastStateToAllTabs() {
    chrome.tabs.query({}, function(tabs) {
        for (let tab of tabs) {
            sendMessageToTab(tab.id, {
                action: "toggleExtensionPlugin",
                checked: extensionEnabled
            });
        }
    });
}

// Simple message handler - just respond to pings and toggle requests
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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

    return false; // No async response for other messages
});

// When a tab updates, send current state
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        // Wait a moment for content scripts to initialize
        setTimeout(function() {
            sendMessageToTab(tabId, {
                action: "toggleExtensionPlugin",
                checked: extensionEnabled
            });
        }, 1000);
    }
});