// background.js
console.log('background script loaded');
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("   in background script's  onMessage listener");
    if (message.action === "toggleExtensionPlugin") {
        // Get the current active tab and send a message to its content script
        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            const currentTab = tabs[0];
            browser.tabs.sendMessage(currentTab.id, message).then(response => {
                console.log("   in background script's sendMessage to tab");
            }).catch(error => {
                // Handle any errors that occur when sending the message
                console.error(`Error sending message to content script: ${error}`);
            });
        });
    }
});

