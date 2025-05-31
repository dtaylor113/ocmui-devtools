// /repos/ocmui-devtools/sol-sc-explorer/src/popup.js
// (Content of your existing popup.js file)

// Simplified popup script - works directly with storage when needed
// console.log('Popup script loaded'); // Keeping this commented as it was originally

const popupDebugMode = false; // Set to true to enable specific debug logs below

// Constants
const ENABLE_STORAGE_KEY = 'extensionEnabled';
const MAX_IDS = 10;
const JIRA_STORAGE_KEY = 'recentJiraIds';
const PR_STORAGE_KEY = 'recentPrIds';

// Elements
let enabledCheckbox;
let jiraInput;
let jiraGoButton;
let jiraDropdown;
let prInput;
let prGoButton;
let prDropdown;
let statusText;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup DOM loaded');

  // Get DOM elements
  enabledCheckbox = document.getElementById('enabledCheckbox');
  jiraInput = document.getElementById('jiraInput');
  jiraGoButton = document.getElementById('jiraGoButton');
  jiraDropdown = document.getElementById('jiraDropdown');
  prInput = document.getElementById('prInput');
  prGoButton = document.getElementById('prGoButton');
  prDropdown = document.getElementById('prDropdown');

  // Create status text element
  statusText = document.createElement('div');
  statusText.id = 'statusText';
  statusText.style.padding = '10px';
  statusText.style.color = '#8fce00';
  statusText.style.fontSize = '12px';
  statusText.style.textAlign = 'center';
  if (document.body) { // Ensure body exists
    document.body.appendChild(statusText);
  }


  // Load stored IDs
  loadStoredIds(JIRA_STORAGE_KEY, jiraDropdown);
  loadStoredIds(PR_STORAGE_KEY, prDropdown);

  // Load extension state
  loadExtensionState();

  // Set up event listeners
  setupEventListeners();
});

// Load current extension state
function loadExtensionState() {
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(ENABLE_STORAGE_KEY, function(data) {
      const isEnabled = data.extensionEnabled !== undefined ? Boolean(data.extensionEnabled) : true;
      console.log('Loaded state:', isEnabled);
      if (enabledCheckbox) enabledCheckbox.checked = isEnabled;
    });
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Checkbox toggle
  if (enabledCheckbox) {
    enabledCheckbox.addEventListener('click', function() {
      const isEnabled = enabledCheckbox.checked;
      toggleExtension(isEnabled);
    });
  }


  // JIRA Go button
  if (jiraGoButton) {
    jiraGoButton.addEventListener('click', function() {
      handleJiraGo();
    });
  }


  // PR Go button
  if (prGoButton) {
    prGoButton.addEventListener('click', function() {
      handlePrGo();
    });
  }


  // Enter key support
  if (jiraInput) {
    jiraInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        handleJiraGo();
      }
    });
  }

  if (prInput) {
    prInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (popupDebugMode) console.log('[popup.js] Enter key pressed in PR input, calling handlePrGo.');
        handlePrGo();
      }
    });
  }
}

// Toggle extension state - work directly with storage when needed
function toggleExtension(isEnabled) {
  if (statusText) statusText.textContent = isEnabled ? "Enabling..." : "Disabling...";
  if (enabledCheckbox) enabledCheckbox.disabled = true;

  // First update the storage directly
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({extensionEnabled: isEnabled}, function() {
      console.log('State saved to storage:', isEnabled);

      // Try to notify background script, but don't rely on it
      try {
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: "toggleExtensionPlugin",
            checked: isEnabled
          }, function(response) {
            // Response handler - optional
            if (chrome.runtime.lastError) {
              console.log('Background error:', chrome.runtime.lastError.message);
            } else {
              console.log('Background response:', response);
            }
            finishToggle(isEnabled); // Call finishToggle here, after sendMessage attempt
          });

          // Set a timeout in case background doesn't respond, but this might conflict
          // It's better to rely on the callback of sendMessage or handle errors there.
          // For simplicity here, we call finishToggle in the callback.
        } else {
            console.warn("chrome.runtime.sendMessage is not available. Finishing toggle directly.");
            finishToggle(isEnabled); // If messaging isn't available
        }
      } catch (err) {
        console.error('Error sending message:', err);
        // Finish toggle even if messaging fails
        finishToggle(isEnabled);
      }
    });
  } else {
      console.warn("chrome.storage.local is not available. Cannot save state.");
      finishToggle(isEnabled); // Cannot save state but still update UI
  }
}

// Complete the toggle operation
function finishToggle(isEnabled) {
  if (statusText) statusText.textContent = isEnabled ? "Enabled" : "Disabled";
  if (enabledCheckbox) enabledCheckbox.disabled = false;
  setTimeout(function() {
    if (statusText) statusText.textContent = "";
  }, 1500);
}

// Trigger cleanup when needed
function triggerCleanup() {
  try {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: "cleanup"
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Background error:', chrome.runtime.lastError.message);
          } else {
            console.log('Cleanup response:', response);
          }
        });
    } else {
        console.warn("chrome.runtime.sendMessage not available for cleanup.");
    }
  } catch (err) {
    console.error('Error sending cleanup message:', err);
  }
}

// Load stored IDs into dropdowns
function loadStoredIds(storageKey, dropdown) {
  try {
    const storedIds = JSON.parse(localStorage.getItem(storageKey)) || [];
    updateDropdown(storedIds, dropdown);
  } catch (e) {
    console.error("Error loading stored IDs:", e);
  }
}

// Update dropdown options
function updateDropdown(ids, dropdown) {
  if (!dropdown) return;
  dropdown.innerHTML = '';
  ids.forEach(function(id) {
    const option = document.createElement('option');
    option.value = id;
    dropdown.appendChild(option);
  });
}

// Save new ID
function saveId(newId, storageKey, dropdown) {
  if (!newId) return;
  try {
    let storedIds = JSON.parse(localStorage.getItem(storageKey)) || [];
    storedIds = storedIds.filter(id => id !== newId); // Remove duplicates
    storedIds.unshift(newId); // Add to beginning
    if (storedIds.length > MAX_IDS) storedIds = storedIds.slice(0, MAX_IDS);
    localStorage.setItem(storageKey, JSON.stringify(storedIds));
    updateDropdown(storedIds, dropdown);
  } catch (e) {
    console.error("Error saving ID:", e);
  }
}

// Handle JIRA Go button
function handleJiraGo() {
  if (!jiraInput) return;
  const issueNumber = jiraInput.value.trim();
  if (/^\d{1,6}$/.test(issueNumber)) {
    saveId(issueNumber, JIRA_STORAGE_KEY, jiraDropdown);
    const jiraUrl = `https://issues.redhat.com/browse/OCMUI-${issueNumber}`;
    window.open(jiraUrl, '_blank');
  } else {
    alert('Please enter a valid 1-6 digit JIRA ID.');
  }
}

// Handle PR Go button
function handlePrGo() {
  if (!prInput) {
    return;
  }
  const prNumber = prInput.value.trim();

  if (/^\d{1,5}$/.test(prNumber)) {
    saveId(prNumber, PR_STORAGE_KEY, prDropdown);
    const prUrl = `https://github.com/RedHatInsights/uhc-portal/pull/${prNumber}`;
    setTimeout(() => {
        window.open(prUrl, '_blank');
        if (popupDebugMode) console.log('[popup.js] handlePrGo: window.open attempt has been made.');
    }, 0);
  } else {
    alert('Please enter a valid 1-5 digit PR ID.');
  }
}

// Before window closes, trigger cleanup if extension is disabled
window.addEventListener('beforeunload', function() {
  if (enabledCheckbox && !enabledCheckbox.checked) {
    triggerCleanup();
  }
});