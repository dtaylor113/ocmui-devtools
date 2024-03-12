// background.js
/*
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleBottomPanel" || message.action === "toggleFeature1") {
        // Get the current active tab and send a message to its content script
        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            const currentTab = tabs[0];
            browser.tabs.sendMessage(currentTab.id, message).then(response => {
                // Handle the response from the content script
            }).catch(error => {
                // Handle any errors that occur when sending the message
                console.error(`Error sending message to content script: ${error}`);
            });
        });
    }
});
*/
