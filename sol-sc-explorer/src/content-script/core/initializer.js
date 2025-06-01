// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/core/initializer.js
import { CONSTANTS } from '../constants.js';
import { state, elements, updateState, setElement } from '../state.js';
import { logger, showDebugLogs } from '../utils/logger.js';
import { browserCompat } from '../utils/browser.js';
import { domUtils } from '../utils/dom.js';
import { injectCoreStyles } from '../ui/stylesManager.js';
import { initializeMainPanels, showAllPanels, hideAllPanels } from '../ui/panelController.js';
import { attachCoreEventListeners, detachCoreEventListeners } from './eventManager.js';
import { scanForSourceFilesOnPage, debouncedScanForSourceFiles } from './sourceDiscovery.js';
import * as PageHighlighterModule from '../ui/pageHighlighter.js';
import * as PanelController from '../ui/panelController.js';

let lastUrl = '';
let navigationObserver = null;
let popstateHandler = null;

function handleSpaNavigation(detectionType = "unknown") {
    requestAnimationFrame(() => {
        if (location.href !== lastUrl) {
            logger.log('info', `Core Initializer: SPA Nav Detected. URL changed from "${lastUrl}" to "${location.href}". Type: ${detectionType}`);
            lastUrl = location.href;
            
            // Reset active tab to File Tree on SPA navigation
            logger.log('debug', 'Core Initializer: Resetting active tab to fileTree due to SPA navigation.');
            updateState({ 
                activeRightPanelTab: 'fileTree',
                currentSourceCodePathForAIChat: null, // Also clear AI context
                currentSourceCodeContentForAIChat: null
            });
            // Re-render the right panel to reflect the tab change immediately
            // Need to ensure renderRightPanelContent is accessible here or we trigger it indirectly
            // For now, let's assume initializeMainPanels or a similar top-level UI refresh will handle it
            // if it's part of a broader re-initialization triggered by navigation for SPAs.
            // More direct would be to import and call it, or have a global event/callback.
            // Considering initializeExtension might be re-called or parts of it by some SPAs.
            // Let's try just setting state first, as initializeMainPanels should pick it up if UI is re-rendered.
            // If UI doesn't auto-refresh tab selection, we might need to explicitly call PanelController.handleRightPanelTabClick('fileTree') or PanelController.renderRightPanelContent().
            // Forcing a re-render of tab content might be good.
            if (elements.rightPanelContentArea) { // If UI is already up
                const { renderRightPanelContent, handleRightPanelTabClick } = PanelController; // Assuming PanelController is imported or accessible
                handleRightPanelTabClick('fileTree'); // This updates tab style and calls renderRightPanelContent
            }

            if (state.extensionEnabled) {
                debouncedScanForSourceFiles();
            }
        } else {
            if (detectionType.includes("MutationObserver") && state.extensionEnabled) {
                 debouncedScanForSourceFiles();
            }
        }
    });
}

function setupNavigationListeners() {
    lastUrl = location.href;
    popstateHandler = () => handleSpaNavigation("popstate");
    window.addEventListener('popstate', popstateHandler);

    navigationObserver = new MutationObserver((mutations) => {
        let titleChanged = false;
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.target === document.head) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeName === 'TITLE') {
                        titleChanged = true;
                        break;
                    }
                }
            }
            if (titleChanged) break;
        }
        if (titleChanged || location.href !== lastUrl) {
             handleSpaNavigation("MutationObserver (head/title)");
        }
    });

    // Observe changes that might indicate SPA navigation if direct URL changes are missed
    navigationObserver.observe(document.documentElement, { childList: true, subtree: true });
    logger.log('info', 'Core Initializer: Navigation listeners set up.');
}

function cleanupNavigationListeners() {
    if (popstateHandler) {
        window.removeEventListener('popstate', popstateHandler);
        popstateHandler = null;
    }
    if (navigationObserver) {
        navigationObserver.disconnect();
        navigationObserver = null;
    }
    logger.log('info', 'Core Initializer: Navigation listeners cleaned up.');
}

export function initializeExtension() {
    // This is the single message that should appear if showDebugLogs is false.
    // It uses console.log directly to bypass the logger's showDebugLogs check.
    if (!showDebugLogs) {
        console.log('SOL Source Code Explorer Plugin successfully loaded.');
    }

    if (state.isInitialized) {
        logger.log('info', 'Core Initializer: Extension already initialized. Skipping re-initialization.');
        return;
    }
    logger.log('info', 'Core Initializer: Initializing extension...');

    try {
        // logger.log('debug', 'INIT_CTRL: initializeExtension - Before injectCoreStyles'); // To be removed
        injectCoreStyles();
        // logger.log('debug', 'INIT_CTRL: initializeExtension - After injectCoreStyles, before initializeMainPanels'); // To be removed
        initializeMainPanels(); 
        // logger.log('debug', 'INIT_CTRL: initializeExtension - After initializeMainPanels, before loadStateFromStorage'); // To be removed
        browserCompat.setupMessageListeners(toggleExtensionPlugin);
        browserCompat.loadStateFromStorage(toggleExtensionPlugin);
        setupNavigationListeners(); 

        updateState({ isInitialized: true });
        logger.log('info', 'Core Initializer: Extension initialization sequence complete (isInitialized = true).');

        // Safeguard: After all initialization steps, if the extension is supposed to be disabled,
        // ensure any just-created panels are explicitly hidden.
        if (!state.extensionEnabled) {
            // logger.log('debug', 'INIT_CTRL: initializeExtension END - state is DISABLED. Explicitly calling hideAllPanels.'); // To be removed
            hideAllPanels();
        }

    } catch (error) {
        logger.log('error', `Core Initializer: Error during initialization: ${error.message}`);
        console.error(error);
    }
}

export function toggleExtensionPlugin(isEnabled) {
    logger.log('info', `Core Initializer: Toggling extension features to: ${isEnabled}. Current initialized state: ${state.isInitialized}`);

    const alreadyInTargetState = state.extensionEnabled === isEnabled;

    if (isEnabled && !state.isInitialized) {
        logger.log('info', 'Core Initializer: Enabling an uninitialized extension. Running initializeExtension first.');
        initializeExtension(); 
    } else if (isEnabled && state.isInitialized) {
        if (!elements.panel || !elements.rightPanelContainer || !document.body.contains(elements.panel)) {
            logger.log('info', 'Core Initializer: Panel DOM elements missing for an initialized extension. Re-creating via initializeMainPanels.');
            initializeMainPanels(); 
        }
    }

    updateState({ extensionEnabled: Boolean(isEnabled) });

    if (alreadyInTargetState && state.isInitialized) {
        if (state.extensionEnabled) {
            logger.log('debug', 'Core Initializer: Extension already enabled and initialized. Ensuring panels are visible.');
            showAllPanels();
            attachCoreEventListeners(); 
        }
        return;
    }

    if (state.extensionEnabled) {
        // At this point, if we are enabling, panels and core styles should be correctly in place.
        logger.log('info', 'Core Initializer: Setting up UI for enabled extension.');
        // logger.log('debug', `INIT_CTRL: toggleExtensionPlugin(true) - before showAllPanels. elements.panel in DOM? ${elements.panel && document.body.contains(elements.panel) ? 'Yes' : 'No'}`); // To be removed

        const currentPanelHeight = state.panelHeight || '50%';
        if (elements.panel) elements.panel.style.height = currentPanelHeight;
        if (elements.rightPanelContainer) elements.rightPanelContainer.style.height = currentPanelHeight;
        if (elements.resizeHandle) elements.resizeHandle.style.bottom = currentPanelHeight;
        if (elements.horizontalResizeHandle) elements.horizontalResizeHandle.style.height = currentPanelHeight;

        showAllPanels(); 
        attachCoreEventListeners();

        logger.log('info', 'Core Initializer: Extension enabled. Performing initial source file scans.');
        setTimeout(scanForSourceFilesOnPage, 200);
        setTimeout(scanForSourceFilesOnPage, 1000);
        setTimeout(scanForSourceFilesOnPage, 2500);
    } else {
        // Only call cleanup if we are actually transitioning to a disabled state
        logger.log('info', 'Core Initializer: Disabling extension. Calling cleanupExtension.');
        // logger.log('debug', `INIT_CTRL: toggleExtensionPlugin(false) - before cleanup. elements.panel in DOM? ${elements.panel && document.body.contains(elements.panel) ? 'Yes' : 'No'}`); // To be removed
        cleanupExtension(); 
    }
}

export function cleanupExtension() {
    logger.log('info', 'Core Initializer: Performing complete extension cleanup...');
    // logger.log('debug', `INIT_CTRL: cleanupExtension START - elements.panel in DOM? ${elements.panel && document.body.contains(elements.panel) ? 'Yes' : 'No'}`); // To be removed
    try {
        detachCoreEventListeners();
        cleanupNavigationListeners();
        hideAllPanels();

        if (elements.panel) { try { elements.panel.remove(); } catch (e) { /* ignore */ } setElement('panel', null); }
        if (elements.rightPanelContainer) { try { elements.rightPanelContainer.remove(); } catch (e) { /* ignore */ } setElement('rightPanelContainer', null); setElement('rightPanelContentArea', null); }
        if (elements.resizeHandle) { try { elements.resizeHandle.remove(); } catch (e) { /* ignore */ } setElement('resizeHandle', null); }
        if (elements.horizontalResizeHandle) { try { elements.horizontalResizeHandle.remove(); } catch (e) { /* ignore */ } setElement('horizontalResizeHandle', null); }
        if (elements.styleElement) { try { elements.styleElement.remove(); } catch (e) { /* ignore */ } setElement('styleElement', null); }
        
        if (typeof PageHighlighterModule.clearAllPageHighlights === 'function') {
            PageHighlighterModule.clearAllPageHighlights();
        } else {
            logger.log('warn', 'Core Initializer: clearAllPageHighlights function not found during cleanup.');
        }

        updateState({
            isInitialized: false, isLocked: false, lockedElement: null, lockedFile: null,
            elementHighlighting: false, eventListenersAttached: false, fileTree: {},
            activeRightPanelTab: 'fileTree'
        });
        logger.log('info', 'Core Initializer: Extension cleanup complete.');
    } catch (error) {
        logger.log('error', `Core Initializer: Error during cleanup: ${error.message}`);
        console.error(error);
    }
}