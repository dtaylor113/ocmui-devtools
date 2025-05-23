// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/ui/pageHighlighter.js
console.log('[pageHighlighter.js] MODULE PARSED AND BEING EXECUTED');

import { CONSTANTS } from '../constants.js';
import { logger } from '../utils/logger.js';
// state and updateState are not directly used by these functions,
// they operate on the DOM based on arguments or general selectors.

export function clearAllPageHighlights() {
    console.log('[pageHighlighter.js] clearAllPageHighlights FUNCTION CALLED');
    logger.log('debug', 'PageHighlighter: Clearing all page highlights from DOM.');

    document.querySelectorAll(`.${CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT}`).forEach(el =>
        el.classList.remove(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT)
    );
    document.querySelectorAll(`.${CONSTANTS.CLASSES.LOCKED_HIGHLIGHT}`).forEach(el =>
        el.classList.remove(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT)
    );
    document.querySelectorAll(`.${CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT}`).forEach(el =>
        el.classList.remove(CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT)
    );
}

export function applyElementLockHighlight(element) {
    console.log('[pageHighlighter.js] applyElementLockHighlight FUNCTION CALLED');
    if (!element || !element.classList) {
        logger.log('warn', 'PageHighlighter: applyElementLockHighlight called with invalid element.');
        return;
    }
    // Typically, other highlights should be cleared before applying a definitive lock.
    // If clearAllPageHighlights wasn't called by the initiator, call it here for safety.
    // However, the initiator (eventManager) now calls clearAllPageHighlights if it's unlocking,
    // or removeElementHoverHighlight then applyElementLockHighlight if locking.
    // For simplicity and to ensure only one lock highlight, let's ensure others are gone.
    element.classList.remove(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT);
    element.classList.remove(CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT);

    element.classList.add(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT);
    logger.log('debug', `PageHighlighter: Applied LOCK_HIGHLIGHT to element: ${element.tagName}`);
}

export function removeElementLockHighlight(element) { // Mostly unused if clearAll is preferred
    console.log('[pageHighlighter.js] removeElementLockHighlight FUNCTION CALLED');
    if (!element || !element.classList) return;
    element.classList.remove(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT);
    logger.log('debug', `PageHighlighter: Removed LOCK_HIGHLIGHT from element: ${element.tagName}`);
}

export function applyElementHoverHighlight(element) {
    console.log('[pageHighlighter.js] applyElementHoverHighlight FUNCTION CALLED');
    if (!element || !element.classList) return;

    // Do not apply hover highlight if the element is already L-locked (red) or file-locked (orange)
    if (element.classList.contains(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT) ||
        element.classList.contains(CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT)) {
        logger.log('debug', 'PageHighlighter: applyElementHoverHighlight - element already has a persistent lock, hover highlight skipped.');
        return;
    }
    // Clear only other GREEN hover highlights from other elements
    document.querySelectorAll(`.${CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT}`).forEach(el => {
        if (el !== element) el.classList.remove(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT);
    });
    element.classList.add(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT);
    logger.log('debug', `PageHighlighter: Applied EXTENSION_HIGHLIGHT (green hover) to ${element.tagName}`);
}

export function removeElementHoverHighlight(element) {
    console.log('[pageHighlighter.js] removeElementHoverHighlight FUNCTION CALLED');
    if (!element || !element.classList) return;

    // Only remove hover if it's not also locked by other means
    // This ensures that if an L-lock (red) or file-lock (orange) was applied *over* a hover,
    // removing the hover concept doesn't strip those more persistent highlights.
    if (!element.classList.contains(CONSTANTS.CLASSES.LOCKED_HIGHLIGHT) &&
        !element.classList.contains(CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT)) {
        element.classList.remove(CONSTANTS.CLASSES.EXTENSION_HIGHLIGHT);
        logger.log('debug', `PageHighlighter: Removed EXTENSION_HIGHLIGHT (green hover) from ${element.tagName}`);
    } else {
        logger.log('debug', `PageHighlighter: removeElementHoverHighlight - element has a persistent lock, green hover highlight not removed or was already replaced.`);
    }
}

export function highlightPageElementsByFile(sourceFile, specificLine = null) {
    console.log('[pageHighlighter.js] highlightPageElementsByFile FUNCTION CALLED');
    if (!sourceFile) {
        logger.log('warn', 'PageHighlighter: highlightPageElementsByFile called with no sourceFile.');
        return;
    }
    logger.log('info', `PageHighlighter: Highlighting page elements for file: ${sourceFile}, specific line: ${specificLine}`);

    // Clear ALL previous highlights (green hover, red L-lock) before applying file-specific orange highlights
    clearAllPageHighlights();

    const elementsToHighlight = document.querySelectorAll(`[data-source-file="${sourceFile}"]`);
    logger.log('debug', `PageHighlighter: Found ${elementsToHighlight.length} elements on page for file ${sourceFile}.`);

    elementsToHighlight.forEach(el => {
        el.classList.add(CONSTANTS.CLASSES.FILE_LOCKED_HIGHLIGHT); // Applies orange border
    });

    if (specificLine && elementsToHighlight.length > 0) {
        let targetElement = null;
        for (const el of elementsToHighlight) {
            if (el.getAttribute('data-source-line') === String(specificLine)) {
                targetElement = el;
                logger.log('debug', `PageHighlighter: Found specific element for line ${specificLine} to scroll to.`);
                break;
            }
        }

        if (targetElement) {
            logger.log('debug', `PageHighlighter: Scrolling to target element (line ${specificLine}) on page.`);
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Optionally, add a slightly more distinct highlight to this primary target element
            // For example: targetElement.style.boxShadow = '0 0 10px 3px #FF8C00';
            // But ensure it's cleared when another file is selected or unlocked.
        } else {
            logger.log('debug', `PageHighlighter: No specific element found to scroll to for line ${specificLine} in file ${sourceFile}.`);
        }
    }
}