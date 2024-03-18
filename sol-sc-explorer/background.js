// background.js
console.log('background script loaded');

function sendMessageToTab(tabId, message) {
    if (typeof browser !== 'undefined') {
        return browser.tabs.sendMessage(tabId, message); // Firefox
    } else if (typeof chrome !== 'undefined') {
        chrome.tabs.sendMessage(tabId, message); // Chrome (callback based)
    } else {
        throw new Error('Browser not supported');
    }
}

function onMessageListener(message, sender, sendResponse) {
    if (message.action === "toggleExtensionPlugin") {
        // Get the current active tab and send a message to its content script
        if (typeof browser !== 'undefined') {
            // Firefox
            browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                const currentTab = tabs[0];
                sendMessageToTab(currentTab.id, message);
            });
        } else if (typeof chrome !== 'undefined') {
            // Chrome
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const currentTab = tabs[0];
                sendMessageToTab(currentTab.id, message);
            });
        }
    }
}

if (typeof browser !== 'undefined') {
    browser.runtime.onMessage.addListener(onMessageListener); // Firefox
} else if (typeof chrome !== 'undefined') {
    chrome.runtime.onMessage.addListener(onMessageListener); // Chrome
}


