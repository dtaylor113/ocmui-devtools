console.log('popup script loaded');

document.getElementById('enabledCheckbox').addEventListener('change', function () {
  const isChecked = this.checked;
  browser.runtime.sendMessage({ action: "toggleExtensionPlugin", checked: isChecked }).catch(console.error);
});


function getStorage() {
  if (typeof browser !== 'undefined') {
    return browser.storage; // Firefox
  } else if (typeof chrome !== 'undefined') {
    return chrome.storage; // Chrome
  } else {
    throw new Error('Browser not supported');
  }
}

function sendMessage(message) {
  if (typeof browser !== 'undefined') {
    return browser.runtime.sendMessage(message); // Firefox
  } else if (typeof chrome !== 'undefined') {
    chrome.runtime.sendMessage(message); // Chrome (no return needed as it uses callbacks)
  } else {
    throw new Error('Browser not supported');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const checkbox = document.getElementById('enabledCheckbox');
  const storage = getStorage();

  // Load the saved state from storage and update the checkbox
  storage.local.get('extensionEnabled', function(data) {
    if (data.hasOwnProperty('extensionEnabled')) {
      checkbox.checked = data.extensionEnabled;
    } else {
      checkbox.checked = true; // Default to true if not set
    }
  });

  checkbox.addEventListener('change', function () {
    const isChecked = this.checked;
    // Save the current state to storage
    storage.local.set({ 'extensionEnabled': isChecked });
    // Send the message to the background script or content script
    sendMessage({ action: "toggleExtensionPlugin", checked: isChecked });
  });
});
