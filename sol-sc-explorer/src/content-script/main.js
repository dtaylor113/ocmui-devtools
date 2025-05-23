// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/main.js

// utils/logger.js should be one of the first imports if other modules use it.
import { logger } from './utils/logger.js';

// core/initializer.js is the main entry point for the extension's logic
import { initializeExtension } from './core/initializer.js';

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