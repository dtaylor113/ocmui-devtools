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

let lastUrl = '';
let navigationObserver = null;
let popstateHandler = null;

function handleSpaNavigation(detectionType = "unknown") {
    requestAnimationFrame(() => {
        if (location.href !== lastUrl) {
            logger.log('info', `Core Initializer: SPA Nav Detected. URL changed to "${location.href}".`);
            lastUrl = location.href;
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
        injectCoreStyles();
        initializeMainPanels(); // This will log "PanelController: Initializing main UI panel elements."
        browserCompat.setupMessageListeners(toggleExtensionPlugin);
        browserCompat.loadStateFromStorage(toggleExtensionPlugin);
        setupNavigationListeners(); // This will log "Core Initializer: Navigation listeners set up."

        updateState({ isInitialized: true });
        logger.log('info', 'Core Initializer: Extension initialization sequence complete.');
    } catch (error) {
        logger.log('error', `Core Initializer: Error during initialization: ${error.message}`);
        console.error(error);
    }
}

export function toggleExtensionPlugin(isEnabled) {
    logger.log('info', `Core Initializer: Toggling extension features to: ${isEnabled}. Current initialized state: ${state.isInitialized}`);

    const alreadyInTargetState = state.extensionEnabled === isEnabled;

    // If attempting to enable and not initialized, OR if state is being forced
    if (isEnabled && !state.isInitialized) {
        logger.log('info', 'Core Initializer: Enabling an uninitialized extension. Running initializeExtension first.');
        initializeExtension(); // This will set state.isInitialized = true, inject styles, create panels.
    } else if (isEnabled && state.isInitialized) {
        // If enabling an already initialized extension (e.g., it was hidden)
        // Ensure panel DOM elements exist, as they might be removed by a previous cleanup without full re-init.
        if (!elements.panel || !elements.rightPanelContainer || !document.body.contains(elements.panel)) {
            logger.log('info', 'Core Initializer: Panel DOM elements missing for an initialized extension. Re-creating via initializeMainPanels.');
            initializeMainPanels(); // This recreates DOM elements. Styles should persist from initial injectCoreStyles.
        }
    }

    // Update the extensionEnabled state *after* potential initialization
    updateState({ extensionEnabled: Boolean(isEnabled) });

    if (alreadyInTargetState && state.isInitialized) {
        // If it was already in the target state (e.g. true -> true) AND initialized,
        // ensure visibility if enabled, then skip further redundant processing.
        // This handles cases where toggle is called multiple times with the same value.
        if (state.extensionEnabled) {
            logger.log('debug', 'Core Initializer: Extension already enabled and initialized. Ensuring panels are visible.');
            showAllPanels();
            attachCoreEventListeners(); // Ensure listeners are attached
        }
        return;
    }

    if (state.extensionEnabled) {
        // At this point, if we are enabling, panels and core styles should be correctly in place.
        logger.log('info', 'Core Initializer: Setting up UI for enabled extension.');

        const currentPanelHeight = state.panelHeight || '50%';
        if (elements.panel) elements.panel.style.height = currentPanelHeight;
        if (elements.rightPanelContainer) elements.rightPanelContainer.style.height = currentPanelHeight;
        if (elements.resizeHandle) elements.resizeHandle.style.bottom = currentPanelHeight;
        if (elements.horizontalResizeHandle) elements.horizontalResizeHandle.style.height = currentPanelHeight;

        showAllPanels(); // Applies visibility and dimensions.
        attachCoreEventListeners();

        logger.log('info', 'Core Initializer: Extension enabled. Performing initial source file scans.');
        setTimeout(scanForSourceFilesOnPage, 200);
        setTimeout(scanForSourceFilesOnPage, 1000);
        setTimeout(scanForSourceFilesOnPage, 2500);
    } else {
        // Only call cleanup if we are actually transitioning to a disabled state
        logger.log('info', 'Core Initializer: Disabling extension. Calling cleanupExtension.');
        cleanupExtension(); // This will set state.isInitialized = false
    }
}

export function cleanupExtension() {
    logger.log('info', 'Core Initializer: Performing complete extension cleanup...');
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