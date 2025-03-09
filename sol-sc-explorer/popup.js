// Simplified popup script - works directly with storage when needed
console.log('Popup script loaded');

// Constants
const ENABLE_STORAGE_KEY = 'extensionEnabled';
const MAX_IDS = 10;
const JIRA_STORAGE_KEY = 'recentJiraIds';
const MR_STORAGE_KEY = 'recentMrIds';

// Elements
let enabledCheckbox;
let jiraInput;
let jiraGoButton;
let jiraDropdown;
let mrInput;
let mrGoButton;
let mrDropdown;
let statusText;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup DOM loaded');

  // Get DOM elements
  enabledCheckbox = document.getElementById('enabledCheckbox');
  jiraInput = document.getElementById('jiraInput');
  jiraGoButton = document.getElementById('jiraGoButton');
  jiraDropdown = document.getElementById('jiraDropdown');
  mrInput = document.getElementById('mrInput');
  mrGoButton = document.getElementById('mrGoButton');
  mrDropdown = document.getElementById('mrDropdown');

  // Create status text element
  statusText = document.createElement('div');
  statusText.id = 'statusText';
  statusText.style.padding = '10px';
  statusText.style.color = '#8fce00';
  statusText.style.fontSize = '12px';
  statusText.style.textAlign = 'center';
  document.body.appendChild(statusText);

  // Load stored IDs
  loadStoredIds(JIRA_STORAGE_KEY, jiraDropdown);
  loadStoredIds(MR_STORAGE_KEY, mrDropdown);

  // Load extension state
  loadExtensionState();

  // Set up event listeners
  setupEventListeners();
});

// Load current extension state
function loadExtensionState() {
  chrome.storage.local.get(ENABLE_STORAGE_KEY, function(data) {
    const isEnabled = data.extensionEnabled !== undefined ? Boolean(data.extensionEnabled) : true;
    console.log('Loaded state:', isEnabled);
    enabledCheckbox.checked = isEnabled;
  });
}

// Set up all event listeners
function setupEventListeners() {
  // Checkbox toggle
  enabledCheckbox.addEventListener('click', function() {
    const isEnabled = enabledCheckbox.checked;
    toggleExtension(isEnabled);
  });

  // JIRA Go button
  jiraGoButton.addEventListener('click', function() {
    handleJiraGo();
  });

  // MR Go button
  mrGoButton.addEventListener('click', function() {
    handleMrGo();
  });

  // Enter key support
  jiraInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      handleJiraGo();
    }
  });

  mrInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      handleMrGo();
    }
  });

  // Optional: Add this if you want to add a reset/cleanup button to the popup
  /*
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      if (confirm('This will reset the extension. Continue?')) {
        triggerCleanup();
        window.close();
      }
    });
  }
  */
}

// Toggle extension state - work directly with storage when needed
function toggleExtension(isEnabled) {
  statusText.textContent = isEnabled ? "Enabling..." : "Disabling...";
  enabledCheckbox.disabled = true;

  // First update the storage directly
  chrome.storage.local.set({extensionEnabled: isEnabled}, function() {
    console.log('State saved to storage:', isEnabled);

    // Try to notify background script, but don't rely on it
    try {
      chrome.runtime.sendMessage({
        action: "toggleExtensionPlugin",
        checked: isEnabled
      }, function(response) {
        // Response handler - optional
        if (chrome.runtime.lastError) {
          console.log('Background error:', chrome.runtime.lastError.message);
          // Finish anyway since we've updated storage
          finishToggle(isEnabled);
        } else {
          console.log('Background response:', response);
          finishToggle(isEnabled);
        }
      });

      // Set a timeout in case background doesn't respond
      setTimeout(function() {
        finishToggle(isEnabled);
      }, 1000);
    } catch (err) {
      console.error('Error sending message:', err);
      // Finish toggle even if messaging fails
      finishToggle(isEnabled);
    }
  });
}

// Complete the toggle operation
function finishToggle(isEnabled) {
  statusText.textContent = isEnabled ? "Enabled" : "Disabled";
  enabledCheckbox.disabled = false;
  setTimeout(function() {
    statusText.textContent = "";
  }, 1500);
}

// Trigger cleanup when needed
function triggerCleanup() {
  try {
    chrome.runtime.sendMessage({
      action: "cleanup"
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.log('Background error:', chrome.runtime.lastError.message);
      } else {
        console.log('Cleanup response:', response);
      }
    });
  } catch (err) {
    console.error('Error sending cleanup message:', err);
  }
}

// Load stored IDs into dropdowns
function loadStoredIds(storageKey, dropdown) {
  const storedIds = JSON.parse(localStorage.getItem(storageKey)) || [];
  updateDropdown(storedIds, dropdown);
}

// Update dropdown options
function updateDropdown(ids, dropdown) {
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
  let storedIds = JSON.parse(localStorage.getItem(storageKey)) || [];
  storedIds = storedIds.filter(id => id !== newId); // Remove duplicates
  storedIds.unshift(newId); // Add to beginning
  if (storedIds.length > MAX_IDS) storedIds = storedIds.slice(0, MAX_IDS);
  localStorage.setItem(storageKey, JSON.stringify(storedIds));
  updateDropdown(storedIds, dropdown);
}

// Handle JIRA Go button
function handleJiraGo() {
  const issueNumber = jiraInput.value.trim();
  if (/^\d{1,6}$/.test(issueNumber)) {
    saveId(issueNumber, JIRA_STORAGE_KEY, jiraDropdown);
    const jiraUrl = `https://issues.redhat.com/browse/OCMUI-${issueNumber}`;
    window.open(jiraUrl, '_blank');
  } else {
    alert('Please enter a valid 1-6 digit JIRA ID.');
  }
}

// Handle MR Go button
function handleMrGo() {
  const mrNumber = mrInput.value.trim();
  if (/^\d{1,5}$/.test(mrNumber)) {
    saveId(mrNumber, MR_STORAGE_KEY, mrDropdown);
    const mrUrl = `https://gitlab.cee.redhat.com/service/uhc-portal/-/merge_requests/${mrNumber}`;
    window.open(mrUrl, '_blank');
  } else {
    alert('Please enter a valid 1-5 digit MR ID.');
  }
}

// Before window closes, trigger cleanup if extension is disabled
window.addEventListener('beforeunload', function() {
  if (!enabledCheckbox.checked) {
    triggerCleanup();
  }
});