console.log('popup script loaded');

document.getElementById('enabledCheckbox').addEventListener('change', function () {
  console.log('Enabled checkbox state changed');
  const isChecked = this.checked;
  browser.runtime.sendMessage({ action: "toggleExtensionPlugin", checked: isChecked }).catch(console.error);
});

document.addEventListener('DOMContentLoaded', function() {
  const checkbox = document.getElementById('enabledCheckbox');

  // Load the saved state from storage and update the checkbox
  browser.storage.local.get('extensionEnabled', function(data) {
    checkbox.checked = data.hasOwnProperty('extensionEnabled') ? data.extensionEnabled : true;
  });

  checkbox.addEventListener('change', function () {
    const isChecked = this.checked;

    // Save the current state to storage
    browser.storage.local.set({ 'extensionEnabled': isChecked });

    // Send the message to the background script or content script
    browser.runtime.sendMessage({ action: "toggleExtensionPlugin", checked: isChecked }).catch(console.error);
  });
});
