// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/main.js

// utils/logger.js should be one of the first imports if other modules use it.
import { logger } from './utils/logger.js';

// core/initializer.js is the main entry point for the extension's logic
import { initializeExtension } from './core/initializer.js';

import { state, updateState, elements } from './state.js'; // Ensure elements is imported if needed elsewhere, or remove if not
import { CONSTANTS } from './constants.js';
import { domUtils } from './utils/dom.js';

// Set desired log level as early as possible
// You can change 'debug' to 'info', 'warn', or 'error'
logger.setLogLevel('debug');

logger.log('info', '[sol-sc-explorer] Webpack bundled content-script/main.js has EXECUTED!');
logger.log('debug', 'main.js: About to schedule core initialization.');

// Auto-initialization logic that calls the main initializer from core/initializer.js
// This ensures that we try to initialize the extension once the DOM is ready.
function scheduleInitialization() {
    // Using a small timeout can sometimes help ensure the page is fully settled,
    // especially if other scripts are manipulating the DOM heavily at load time.
    setTimeout(() => {
        logger.log('debug', 'main.js: Timeout expired, calling initializeExtension().');
        initializeExtension();
    }, 500); // 500ms delay, adjust if needed
}

if (document.readyState === 'loading') {
    logger.log('debug', 'main.js: DOM is in "loading" state. Adding DOMContentLoaded listener.');
    document.addEventListener('DOMContentLoaded', () => {
        logger.log('debug', 'main.js: DOMContentLoaded event fired. Scheduling initialization.');
        scheduleInitialization();
    });
} else {
    // DOM is already 'interactive' or 'complete'
    logger.log('debug', `main.js: DOM is in "${document.readyState}" state. Scheduling initialization directly.`);
    scheduleInitialization();
}

// You can also add a listener for the window's 'load' event as a fallback,
// though DOMContentLoaded is generally preferred for starting script logic.
// window.addEventListener('load', () => {
//     logger.log('debug', 'main.js: Window "load" event fired. Ensuring initialization is scheduled (if not already run).');
//     // Potentially call initializeExtension() here too, but be careful about multiple initializations.
//     // The state.isInitialized check within initializeExtension() should prevent re-runs.
// });

// Ensure this runs before any UI initialization that depends on these states.
logger.log('info', 'Resetting tab and AI context state for new page context.');
updateState({
    activeRightPanelTab: 'fileTree',
    currentSourceCodePathForAIChat: null,
    currentSourceCodeContentForAIChat: null,
    // Consider if `verifiedApiKey` and `aiChatSessionInitialized` should be reset here too.
    // For now, let's assume verification status might persist if localStorage keys are still valid.
});

// Check if the script has already been injected and initialized.
// This helps prevent multiple initializations if the script is somehow injected multiple times.
// if (!window.solScExplorerInitialized) {
//     logger.log('info', 'SOL-SC-Explorer: Content script main.js executing for the first time on this page context.');
//
//     // Initialize the extension's UI and functionalities.
//     initializer.initializeUI();
//
//     // Set a flag to indicate that initialization has occurred.
//     window.solScExplorerInitialized = true;
// } else {
//     logger.log('info', 'SOL-SC-Explorer: Content script main.js already executed on this page context. Skipping re-initialization.');
    // Potentially, you might want to re-run certain parts of the UI update if the page content changed
    // but the script itself wasn't fully reloaded. For instance, re-evaluating available source code info.
    // For now, the primary initialization is guarded.
// }
// The scheduleInitialization() function which calls initializeExtension() is already correctly set up
// and initializeExtension() has its own internal guard (state.isInitialized) to prevent re-runs.