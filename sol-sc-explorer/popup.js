console.log('Popup script loaded');

// Helper to determine the correct API for cross-browser support
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Constants
const ENABLE_STORAGE_KEY = 'extensionEnabled';
const MAX_IDS = 10;
const JIRA_STORAGE_KEY = 'recentJiraIds';
const MR_STORAGE_KEY = 'recentMrIds';

// Elements
const enabledCheckbox = document.getElementById('enabledCheckbox');
const jiraInput = document.getElementById('jiraInput');
const jiraGoButton = document.getElementById('jiraGoButton');
const jiraDropdown = document.getElementById('jiraDropdown');
const mrInput = document.getElementById('mrInput');
const mrGoButton = document.getElementById('mrGoButton');
const mrDropdown = document.getElementById('mrDropdown');

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Load stored IDs into dropdowns
  loadStoredIds(JIRA_STORAGE_KEY, jiraDropdown);
  loadStoredIds(MR_STORAGE_KEY, mrDropdown);

  // Load and set the checkbox state
  browserAPI.storage.local.get(ENABLE_STORAGE_KEY, (data) => {
    const isEnabled = data[ENABLE_STORAGE_KEY] ?? true;
    enabledCheckbox.checked = isEnabled;
    sendToggleMessage(isEnabled);
  });
});

// Checkbox toggle event
enabledCheckbox.addEventListener('change', () => {
  const isEnabled = enabledCheckbox.checked;
  console.log(`Checkbox changed: ${isEnabled}`);
  browserAPI.storage.local.set({ [ENABLE_STORAGE_KEY]: isEnabled });
  sendToggleMessage(isEnabled);
});

// Send a toggle message to the background script
function sendToggleMessage(isEnabled) {
  console.log(`sendToggleMessage: ${isEnabled}`);
  browserAPI.runtime.sendMessage({
    action: "toggleExtensionPlugin",
    checked: isEnabled
  });
}

// Load stored IDs into dropdowns
function loadStoredIds(storageKey, dropdown) {
  const storedIds = JSON.parse(localStorage.getItem(storageKey)) || [];
  updateDropdown(storedIds, dropdown);
}

// Update dropdown options dynamically
function updateDropdown(ids, dropdown) {
  dropdown.innerHTML = '';
  ids.forEach(id => {
    const option = document.createElement('option');
    option.value = id;
    dropdown.appendChild(option);
  });
}

// Save new ID to local storage and update dropdown
function saveId(newId, storageKey, dropdown) {
  if (!newId) return;
  let storedIds = JSON.parse(localStorage.getItem(storageKey)) || [];
  storedIds = storedIds.filter(id => id !== newId); // Remove duplicates
  storedIds.unshift(newId); // Add to the beginning
  if (storedIds.length > MAX_IDS) storedIds = storedIds.slice(0, MAX_IDS);
  localStorage.setItem(storageKey, JSON.stringify(storedIds));
  updateDropdown(storedIds, dropdown);
}

// Handle JIRA Go button click
jiraGoButton.addEventListener('click', () => {
  const issueNumber = jiraInput.value.trim();
  if (/^\d{1,6}$/.test(issueNumber)) {
    saveId(issueNumber, JIRA_STORAGE_KEY, jiraDropdown);
    const jiraUrl = `https://issues.redhat.com/browse/OCMUI-${issueNumber}`;
    window.open(jiraUrl, '_blank');
  } else {
    alert('Please enter a valid 1-6 digit JIRA ID.');
  }
});

// Handle MR Go button click
mrGoButton.addEventListener('click', () => {
  const mrNumber = mrInput.value.trim();
  if (/^\d{1,5}$/.test(mrNumber)) {
    saveId(mrNumber, MR_STORAGE_KEY, mrDropdown);
    const mrUrl = `https://gitlab.cee.redhat.com/service/uhc-portal/-/merge_requests/${mrNumber}`;
    window.open(mrUrl, '_blank');
  } else {
    alert('Please enter a valid 1-5 digit MR ID.');
  }
});
