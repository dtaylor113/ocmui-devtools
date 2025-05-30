// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/core/eventManager.js
import { CONSTANTS } from '../constants.js';
import { state, elements, updateState } from '../state.js';
import { logger } from '../utils/logger.js';
import { fetchSourceCode } from './sourceDiscovery.js';
import { updateSourceCodePanel } from '../ui/panelController.js';
import { highlightTreeFileNode } from '../features/fileTree/fileTreeInteraction.js';

// console.log('[eventManager.js] Attempting to import from pageHighlighter.js...');
import * as PageHighlighterModule from '../ui/pageHighlighter.js';
// console.log('[eventManager.js] Imported PageHighlighterModule:', PageHighlighterModule);

const clearAllPageHighlights = PageHighlighterModule.clearAllPageHighlights;
const applyElementLockHighlight = PageHighlighterModule.applyElementLockHighlight;
const applyElementHoverHighlight = PageHighlighterModule.applyElementHoverHighlight;
const removeElementHoverHighlight = PageHighlighterModule.removeElementHoverHighlight;

// console.log('[eventManager.js] typeof clearAllPageHighlights after destructure:', typeof clearAllPageHighlights);
// console.log('[eventManager.js] typeof updateSourceCodePanel after import:', typeof updateSourceCodePanel);

function handlePanelMouseMove(e) {
    if (state.isResizing && elements.panel && elements.rightPanelContainer && elements.resizeHandle && elements.horizontalResizeHandle) {
        const deltaY = e.clientY - state.lastY;
        const newHeight = Math.max(elements.panel.offsetHeight - deltaY, CONSTANTS.SIZES.MIN_PANEL_HEIGHT);
        const viewportHeight = window.innerHeight;
        const panelHeight = Math.min(newHeight, viewportHeight * CONSTANTS.SIZES.MAX_PANEL_HEIGHT_RATIO);
        elements.panel.style.height = `${panelHeight}px`;
        elements.rightPanelContainer.style.height = `${panelHeight}px`;
        elements.resizeHandle.style.bottom = `${panelHeight}px`;
        elements.horizontalResizeHandle.style.height = `${panelHeight}px`;
        updateState({ lastY: e.clientY });
    }
    if (state.isHorizontalResizing && elements.panel && elements.rightPanelContainer && elements.horizontalResizeHandle) {
        const deltaX = e.clientX - state.lastX;
        let newRightPanelWidth = Math.max(state.rightPanelWidth - deltaX, CONSTANTS.SIZES.MIN_PANEL_WIDTH);
        const viewportWidth = window.innerWidth;
        newRightPanelWidth = Math.min(newRightPanelWidth, viewportWidth * CONSTANTS.SIZES.MAX_PANEL_WIDTH_RATIO);
        updateState({ rightPanelWidth: newRightPanelWidth });
        elements.rightPanelContainer.style.width = `${state.rightPanelWidth}px`;
        elements.panel.style.width = `calc(100% - ${state.rightPanelWidth}px)`;
        elements.horizontalResizeHandle.style.left = `calc(100% - ${state.rightPanelWidth}px)`;
        updateState({ lastX: e.clientX });
    }
}

function handlePanelMouseUp() {
    if (state.isResizing || state.isHorizontalResizing) {
        // logger.log('debug', 'EventManager: Panel resize mouseup.');
    }
    updateState({ isResizing: false, isHorizontalResizing: false });
}

function setupResizeListeners() {
    // logger.log('debug', 'EventManager: Setting up window resize listeners.');
    window.addEventListener('mousemove', handlePanelMouseMove);
    window.addEventListener('mouseup', handlePanelMouseUp);
}

function cleanupResizeListeners() {
    // logger.log('debug', 'EventManager: Cleaning up window resize listeners.');
    window.removeEventListener('mousemove', handlePanelMouseMove);
    window.removeEventListener('mouseup', handlePanelMouseUp);
}

async function handlePageMouseOver(e) {
    // logger.log('DEBUG_STATE', `EventManager - START OF handlePageMouseOver: elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`); // DEBUG_STATE
    // logger.log('debug', `EVENT_MGR_HOVER (0) - Entered. Target: ${e.target?.tagName || 'unknown'}, ID: ${e.target?.id || 'none'}, Class: ${e.target?.className || 'none'}`);

    if (!state.extensionEnabled || state.isLocked) {
        return;
    }
    if ((elements.panel && elements.panel.contains(e.target)) ||
        (elements.rightPanelContainer && elements.rightPanelContainer.contains(e.target))) {
        return;
    }

    const targetElement = e.target;
    const sourceFileAttr = targetElement.getAttribute('data-source-file');
    const sourceLineAttr = targetElement.getAttribute('data-source-line');

    if (sourceFileAttr && sourceLineAttr) {
        const pathFromAttribute = sourceFileAttr;
        let normalizedPathForProcessing = sourceFileAttr;
        if (typeof sourceFileAttr === 'string' && sourceFileAttr.startsWith('/')) {
            normalizedPathForProcessing = sourceFileAttr.substring(1);
        }
        // logger.log('debug', `EVENT_MGR_HOVER (1.5) - Path from attribute: [${pathFromAttribute}], Normalized for processing: [${normalizedPathForProcessing}]`);

        const sourceFile = normalizedPathForProcessing;
        const sourceLine = sourceLineAttr;

        logger.log('info', `EVENT_MGR_HOVER: Hovering over element from [${sourceFile}:${sourceLine}]`);
        
        const processingElement = targetElement;
        updateState({ currentHoveredElement: processingElement, elementHighlighting: true });

        if (typeof PageHighlighterModule.applyElementHoverHighlight === 'function') {
            PageHighlighterModule.applyElementHoverHighlight(processingElement);
        } else {
            logger.log('error', 'EVENT_MGR_HOVER: applyElementHoverHighlight is not a function.');
        }
        
        try {
            logger.log('info', `EVENT_MGR_HOVER: Fetching source for [${sourceFile}] (element: ${processingElement.tagName})`);
            const fileContent = await fetchSourceCode(pathFromAttribute);
            // logger.log('info', `EVENT_MGR_HOVER (4) - TRY_BLOCK: Fetch complete for path used: [${pathFromAttribute}]. Content type: ${typeof fileContent}, length: ${fileContent?.length}. CurrentHovered (after await): ${state.currentHoveredElement?.tagName || 'null'}, ProcessingThisEvent: ${processingElement.tagName}`);

            if (state.isLocked) {
                logger.log('warn', `EVENT_MGR_HOVER: Panel is locked. Aborting panel update for [${sourceFile}].`);
                return; 
            }

            if (typeof fileContent === 'string') {
                // logger.log('info', `EVENT_MGR_HOVER (5) - TRY_BLOCK: fileContent is string. About to call updateSourceCodePanel. Using sourceFile: [${sourceFile}].`);
                if (typeof updateSourceCodePanel === 'function') {
                    updateSourceCodePanel({ sourceFile: pathFromAttribute, sourceLine }, fileContent);
                    // logger.log('info', `EVENT_MGR_HOVER (6) - TRY_BLOCK: updateSourceCodePanel CALLED. Path used for panel: [${pathFromAttribute}].`);
                    
                    if (!elements.rightPanelContentArea) {
                        logger.log('error', 'EVENT_MGR_HOVER: rightPanelContentArea is NULL before calling highlightTreeFileNode!');
                    } else {
                        // const displayStyle = window.getComputedStyle(elements.rightPanelContentArea).display;
                        // logger.log('debug', `EVENT_MGR_HOVER (6.05) - rightPanelContentArea FOUND. ID: [${elements.rightPanelContentArea.id || 'none'}], Class: [${elements.rightPanelContentArea.className || 'none'}], Display: [${displayStyle}]`);
                    }
                    // logger.log('debug', `EVENT_MGR_HOVER (6.1) - Attempting to highlight file in tree. Passing normalized sourceFile: [${sourceFile}] to highlightTreeFileNode.`);
                    highlightTreeFileNode(sourceFile, true);
                } else { 
                    logger.log('error', 'EVENT_MGR_HOVER: updateSourceCodePanel is not a function (fileContent is string).'); 
                }
            } else {
                logger.log('warn', `EVENT_MGR_HOVER: fileContent is NOT a string for [${pathFromAttribute}]. Updating panel with error.`);
                if (typeof updateSourceCodePanel === 'function') {
                    updateSourceCodePanel({ sourceFile: pathFromAttribute, sourceLine }, `/* Could not load: ${pathFromAttribute} (content type: ${typeof fileContent}) */`);
                } else { 
                    logger.log('error', 'EVENT_MGR_HOVER: updateSourceCodePanel is not a function (fileContent not string).'); 
                }
            }
            // logger.log('info', `EVENT_MGR_HOVER (8) - TRY_BLOCK END for path: [${sourceFile}].`);
        } catch (error) {
            logger.log('error', `EVENT_MGR_HOVER: CATCH_BLOCK Error for [${sourceFile}]: ${error.message}`);
            console.error(`EVENT_MGR_HOVER: Full error object for path [${sourceFile}]:`, error);
            if (typeof updateSourceCodePanel === 'function') {
                updateSourceCodePanel({ sourceFile: pathFromAttribute, sourceLine }, `/* Exception loading source: ${error.message} */`);
            }
        }
        // logger.log('info', `EVENT_MGR_HOVER (10) - End of sourceFile/sourceLine block for path: [${sourceFile}].`);
    }
}

function handlePageMouseOut(e) {
    if (!state.extensionEnabled || state.isLocked) { return; }
    if ((elements.panel && elements.panel.contains(e.target)) ||
        (elements.rightPanelContainer && elements.rightPanelContainer.contains(e.target))) {
        return;
    }
    const targetElement = e.target;
    if (state.currentHoveredElement === targetElement && !state.isLocked) { 
        // logger.log('debug', `EVENT_MGR_HOUT (1) - MouseOut from currentHoveredElement: ${targetElement.tagName}`);
        if (typeof removeElementHoverHighlight === 'function') {
            removeElementHoverHighlight(targetElement);
        }
        updateState({ currentHoveredElement: null });
    }
}

function toggleElementLock() {
    const newLockState = !state.isLocked;
    logger.log('info', `EventManager: Toggling page element lock. New state will be: ${newLockState ? 'LOCKED' : 'UNLOCKED'}`);

    if (newLockState) {
        if (state.currentHoveredElement && state.currentHoveredElement.getAttribute('data-source-file')) {
            updateState({
                isLocked: true, 
                lockedElement: state.currentHoveredElement,
                elementHighlighting: false 
            });
            // logger.log('debug', `EventManager: L-Locking element: ${state.lockedElement?.tagName}`);
            if (typeof removeElementHoverHighlight === 'function') removeElementHoverHighlight(state.lockedElement); else logger.log('error', "EventManager: removeElementHoverHighlight not a function in toggleLock");
            if (typeof applyElementLockHighlight === 'function') applyElementLockHighlight(state.lockedElement); else logger.log('error', "EventManager: applyElementLockHighlight not a function in toggleLock");
        } else {
            logger.log('warn', 'EventManager: Lock pressed to lock, but no valid element was hovered. No change to lock state.');
            return; 
        }
    } else { 
        updateState({
            isLocked: false, 
            lockedElement: null,
            elementHighlighting: true, 
        });
        // logger.log('debug', 'EventManager: L-Unlocking page element.');
        if (typeof clearAllPageHighlights === 'function') clearAllPageHighlights(); else logger.log('error', "EventManager: clearAllPageHighlights not a function in toggleLock");
    }
}

function handlePageKeyPress(e) {
    if (!state.extensionEnabled) return;
    const targetTagName = e.target.tagName.toLowerCase();
    if (targetTagName === 'input' || targetTagName === 'textarea' || e.target.isContentEditable) {
        return;
    }
    if (e.key.toLowerCase() === CONSTANTS.KEYS.TOGGLE_LOCK.key.toLowerCase()) {
        logger.log('info', `EventManager: Lock key ('${e.key}') pressed.`);
        e.preventDefault();
        toggleElementLock();
    }
}

export function attachCoreEventListeners() {
    if (state.eventListenersAttached) {
        // logger.log('debug', 'EventManager: Core event listeners already attached.');
        return;
    }
    logger.log('info', 'EventManager: Attaching core event listeners.');
    setupResizeListeners();
    document.body.addEventListener('mouseover', handlePageMouseOver);
    document.body.addEventListener('mouseout', handlePageMouseOut);
    document.addEventListener('keydown', handlePageKeyPress);
    updateState({ eventListenersAttached: true });
    // logger.log('info', 'EventManager: Core event listeners attached.'); // Redundant with the one above
}

export function detachCoreEventListeners() {
    if (!state.eventListenersAttached) {
        // logger.log('debug', 'EventManager: Core event listeners already detached.');
        return;
    }
    logger.log('info', 'EventManager: Detaching core event listeners.');
    cleanupResizeListeners();
    document.body.removeEventListener('mouseover', handlePageMouseOver);
    document.body.removeEventListener('mouseout', handlePageMouseOut);
    document.removeEventListener('keydown', handlePageKeyPress);
    updateState({ eventListenersAttached: false });
    // logger.log('info', 'EventManager: Core event listeners detached.'); // Redundant with the one above
}

// Unused local functions - replaced by highlightTreeFileNode from fileTreeInteraction.js
/*
function highlightTreeFile(filePath) {
    // ... (removed old function content)
}

function ensureFileVisible(fileElement) {
    // ... (removed old function content)
}

function scrollElementToMiddle(element, container) {
    // ... (removed old function content)
}
*/