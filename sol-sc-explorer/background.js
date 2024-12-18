// background.js
console.log('Background script loaded');

// Helper to determine the correct API for cross-browser support
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Send a message to the active tab
function sendMessageToTab(tabId, message) {
    console.log('sendMessageToTab:', message);
    browserAPI.tabs.sendMessage(tabId, message, (response) => {
        if (browserAPI.runtime.lastError) {
            console.error('Error sending message to tab:', browserAPI.runtime.lastError.message);
        }
    });
}

// Handle messages received from the popup
function onMessageListener(message, sender, sendResponse) {
    console.log('onMessageListener:', message);

    if (message.action === "toggleExtensionPlugin") {
        console.log('Forwarding toggleExtensionPlugin to content script');

        // Query the active tab in the current window
        browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                const currentTab = tabs[0];
                sendMessageToTab(currentTab.id, message);
            } else {
                console.warn('No active tab found to send the message.');
            }
        });
    }
}

// Register the message listener
browserAPI.runtime.onMessage.addListener(onMessageListener);
