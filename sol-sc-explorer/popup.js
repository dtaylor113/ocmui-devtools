console.log('popup script loaded');

document.getElementById('toggleButton').addEventListener('click', function () {
  console.log('Toggle button clicked');
  // browser.runtime.sendMessage({ action: "toggleBottomPanel" }).catch(console.error);
});

document.getElementById('feature1Button').addEventListener('click', function () {
  console.log('Feature 1 button clicked');
  // browser.runtime.sendMessage({ action: "toggleFeature1" }).catch(console.error);
});

// Message listener
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`popup script onMessage: ${message}`);
});
