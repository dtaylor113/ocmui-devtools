// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/core/initializer.js
import { CONSTANTS } from '../constants.js';
import { state, elements, updateState, setElement } from '../state.js';
import { logger } from '../utils/logger.js';
import { browserCompat } from '../utils/browser.js';
import { domUtils } from '../utils/dom.js';
import { injectCoreStyles } from '../ui/stylesManager.js';
import { initializeMainPanels, showAllPanels, hideAllPanels } from '../ui/panelController.js';
import { attachCoreEventListeners, detachCoreEventListeners } from './eventManager.js';
import { scanForSourceFilesOnPage, debouncedScanForSourceFiles } from './sourceDiscovery.js';

let lastUrl = '';
let navigationObserver = null;
let popstateHandler = null;

function handleSpaNavigation(detectionType = "unknown") {
    requestAnimationFrame(() => {
        if (location.href !== lastUrl) {
            logger.log('info', `Core Initializer: SPA Nav Detected (type: ${detectionType}). URL changed from "${lastUrl}" to "${location.href}".`);
            lastUrl = location.href;
            if (state.extensionEnabled) {
                logger.log('debug', `Core Initializer: URL changed & ext enabled. Calling debouncedScanForSourceFiles for new URL: ${location.href}`);
                debouncedScanForSourceFiles();
            } else {
                logger.log('debug', 'Core Initializer: URL changed, but extension is disabled. Skipping scan.');
            }
        } else {
            if (detectionType.includes("MutationObserver") && state.extensionEnabled) {
                 logger.log('debug', `Core Initializer: MutationObserver fired (URL might be same: ${location.href}). Calling debouncedScan for potential DOM updates.`);
                 debouncedScanForSourceFiles();
            }
        }
    });
}

function setupNavigationListeners() {
    if (navigationObserver || popstateHandler) {
        logger.log('debug', 'Core Initializer: Navigation listeners appear to be already set up. Skipping setup.');
        return;
    }
    logger.log('info', 'Core Initializer: Setting up SPA navigation listeners.');
    lastUrl = location.href;

    try {
        const observerCallback = (mutationsList, observer) => {
            logger.log('debug', `Core Initializer: MutationObserver fired. Mutations observed: ${mutationsList.length}.`);
            handleSpaNavigation("MutationObserver - DOM Change");
        };
        navigationObserver = new MutationObserver(observerCallback);
        const appRootElement = document.getElementById('root') || document.querySelector('[role="main"]') || document.body;
        const targetNode = appRootElement || document.documentElement;
        if (targetNode) {
            navigationObserver.observe(targetNode, { childList: true, subtree: true });
            logger.log('debug', `Core Initializer: MutationObserver observing ${targetNode.tagName}${targetNode.id ? '#' + targetNode.id : ''}.`);
        } else {
            logger.log('error', 'Core Initializer: Could not find a suitable target node for MutationObserver.');
        }
    } catch (e) {
        logger.log('error', `Core Initializer: Error setting up MutationObserver: ${e.message}`);
        console.error(e);
    }

    popstateHandler = () => {
        logger.log('info', 'Core Initializer: "popstate" event detected.');
        handleSpaNavigation("popstate");
    };
    window.addEventListener('popstate', popstateHandler);
}

function cleanupNavigationListeners() {
    logger.log('info', 'Core Initializer: Cleaning up SPA navigation listeners.');
    if (navigationObserver) {
        navigationObserver.disconnect();
        navigationObserver = null;
        logger.log('debug', 'Core Initializer: MutationObserver disconnected.');
    }
    if (popstateHandler) {
        window.removeEventListener('popstate', popstateHandler);
        popstateHandler = null;
        logger.log('debug', 'Core Initializer: "popstate" listener removed.');
    }
}

export function initializeExtension() {
    logger.log('debug', `INITIALIZER (initializeExtension) - Called. state.isInitialized: ${state.isInitialized}`);
    logger.log('DEBUG_STATE', `Initializer - TOP of initializeExtension: elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`); // DEBUG_STATE
    if (state.isInitialized) {
        logger.log('debug', 'Core Initializer: Extension already initialized. Skipping re-initialization.');
        return;
    }
    logger.log('info', 'Core Initializer: Initializing extension...');

    try {
        injectCoreStyles();
        initializeMainPanels();
        browserCompat.setupMessageListeners(toggleExtensionPlugin);
        browserCompat.loadStateFromStorage(toggleExtensionPlugin);
        setupNavigationListeners();

        updateState({ isInitialized: true });
        logger.log('info', 'Core Initializer: Extension initialization sequence complete.');
        logger.log('DEBUG_STATE', `Initializer - END of initializeExtension: elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`); // DEBUG_STATE
    } catch (error) {
        logger.log('error', `Core Initializer: Error during initialization: ${error.message}`);
        console.error(error);
    }
}

export function toggleExtensionPlugin(isEnabled) {
    if (!isEnabled) {
        logger.log('ERROR', `CORE_TOGGLE_OFF: toggleExtensionPlugin called with isEnabled=false. elements.panel before cleanup: ${elements.panel ? elements.panel.id : 'NULL'}`);
        console.trace("Trace for toggleExtensionPlugin(false) call");
    }
    logger.log('info', `Core Initializer: Toggling extension features to: ${isEnabled}. Current elements.panel: ${elements.panel ? elements.panel.id : 'NULL'}. state.isInitialized: ${state.isInitialized}`);
    logger.log('DEBUG_STATE', `Initializer - START OF toggleExtensionPlugin(${isEnabled}): elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`); // DEBUG_STATE

    if (!state.isInitialized && isEnabled) {
        logger.log('warn', 'Core Initializer: toggleExtensionPlugin called to ENABLE before full initialization was complete. This might indicate an issue in startup flow or rapid toggling.');
        if (!elements.panel || !elements.rightPanelContainer) {
            logger.log('debug', 'Core Initializer: Panels not yet created by initializeExtension, calling initializeMainPanels from toggle.');
            initializeMainPanels();
        }
    }

    const previousEnabledState = state.extensionEnabled;
    updateState({ extensionEnabled: Boolean(isEnabled) });

    if (state.isInitialized && previousEnabledState === state.extensionEnabled) {
        logger.log('debug', `Core Initializer: Toggle called but enabled state (${state.extensionEnabled}) effectively unchanged. Ensuring UI/listeners consistency.`);
        if (state.extensionEnabled) {
            if (!elements.panel || !elements.rightPanelContainer || !document.body.contains(elements.panel)) {
                logger.log('debug', 'Core Initializer: (State Unchanged Path) Panels missing or detached. Re-initializing panels.');
                initializeMainPanels();
            }
            showAllPanels();
            attachCoreEventListeners();
        } else {
            hideAllPanels();
            detachCoreEventListeners();
        }
        logger.log('DEBUG_STATE', `Initializer - END OF toggleExtensionPlugin(${isEnabled}) [state unchanged path]: elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`); // DEBUG_STATE
        return;
    }

    if (state.extensionEnabled) {
        if (!elements.panel || !elements.rightPanelContainer || !document.body.contains(elements.panel)) {
            logger.log('debug', 'Core Initializer: Enabling - Panels missing or detached. Re-initializing panels.');
            initializeMainPanels();
        }
        showAllPanels();
        attachCoreEventListeners();

        logger.log('info', 'Core Initializer: Extension enabled. Performing initial source file scans with delays.');
        setTimeout(scanForSourceFilesOnPage, 200);
        setTimeout(scanForSourceFilesOnPage, 1000);
        setTimeout(scanForSourceFilesOnPage, 2500);

        logger.log('info', 'Core Initializer: Extension features ENABLED.');
    } else {
        cleanupExtension();
        logger.log('info', 'Core Initializer: Extension features DISABLED.');
    }
    logger.log('DEBUG_STATE', `Initializer - END OF toggleExtensionPlugin(${isEnabled}): elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`); // DEBUG_STATE
}

export function cleanupExtension() {
    logger.log('ERROR', 'CORE_CLEANUP: cleanupExtension HAS BEEN CALLED! Tracing why...');
    console.trace("Trace for cleanupExtension call");
    logger.log('DEBUG_STATE', `Initializer - START OF cleanupExtension: elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`); // DEBUG_STATE

    logger.log('info', 'Core Initializer: Performing complete extension cleanup...');
    try {
        detachCoreEventListeners();
        cleanupNavigationListeners();
        hideAllPanels();

        if (elements.panel) { try { elements.panel.remove(); } catch (e) { logger.log('debug', `Error removing panel: ${e.message}`); } setElement('panel', null); }
        if (elements.rightPanelContainer) { try { elements.rightPanelContainer.remove(); } catch (e) { logger.log('debug', `Error removing rightPanelContainer: ${e.message}`); } setElement('rightPanelContainer', null); setElement('rightPanelContentArea', null); }
        if (elements.resizeHandle) { try { elements.resizeHandle.remove(); } catch (e) { logger.log('debug', `Error removing resizeHandle: ${e.message}`); } setElement('resizeHandle', null); }
        if (elements.horizontalResizeHandle) { try { elements.horizontalResizeHandle.remove(); } catch (e) { logger.log('debug', `Error removing horizontalResizeHandle: ${e.message}`); } setElement('horizontalResizeHandle', null); }
        if (elements.styleElement) { try { elements.styleElement.remove(); } catch (e) { logger.log('debug', `Error removing styleElement: ${e.message}`); } setElement('styleElement', null); }

        logger.log('info', 'Core Initializer: TODO: Call clearAllPageHighlights() here from pageHighlighter.js.');
        updateState({
            isInitialized: false, isLocked: false, lockedElement: null, lockedFile: null,
            elementHighlighting: false, eventListenersAttached: false, fileTree: {},
            activeRightPanelTab: 'fileTree',
        });
        logger.log('info', 'Core Initializer: Extension cleanup completed.');
        logger.log('DEBUG_STATE', `Initializer - END OF cleanupExtension: elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`); // DEBUG_STATE
        return true;
    } catch (error) {
        logger.log('error', `Core Initializer: Error during cleanup: ${error.message}`);
        console.error(error);
        return false;
    }
}