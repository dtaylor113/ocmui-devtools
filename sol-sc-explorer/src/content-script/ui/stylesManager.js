// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/ui/stylesManager.js
import { CONSTANTS, getBaseStyles, additionalStyles } from '../constants.js';
import { elements, setElement } from '../state.js'; // Using setElement to update global elements object
import { logger } from '../utils/logger.js';

export function injectCoreStyles() {
    if (elements.styleElement) {
        logger.log('debug', 'Styles already injected. Skipping.');
        return;
    }
    try {
        logger.log('info', 'Injecting core UI styles.');
        const styleEl = document.createElement('style');
        // Pass CONSTANTS to getBaseStyles because it uses template literals with CONSTANTS values
        styleEl.textContent = getBaseStyles(CONSTANTS) + additionalStyles; // Combine base and additional
        document.head.appendChild(styleEl);
        setElement('styleElement', styleEl); // Save reference to state.elements
        logger.log('info', 'Core UI styles injected successfully.');
    } catch (error) {
        logger.log('error', `Error injecting core styles: ${error.message}`);
        console.error(error); // Also log the full error object
    }
}

// This function was originally part of initializeBoxLayoutStyles / updateStylesWithBoxLayout
// Since additionalStyles is now combined in injectCoreStyles, this might not be needed
// separately unless you want to add more styles dynamically later.
// For now, it's effectively handled by injectCoreStyles.
/*
export function ensureBoxLayoutStyles() {
    if (!elements.styleElement) {
        logger.log('warn', 'Core styles not injected. Injecting all styles now.');
        injectCoreStyles();
        return;
    }
    if (!elements.styleElement.textContent.includes('.hierarchy-box')) {
        logger.log('info', 'Box layout styles not found. Appending them.');
        elements.styleElement.textContent += additionalStyles;
    } else {
        logger.log('debug', 'Box layout styles already present.');
    }
}
*/