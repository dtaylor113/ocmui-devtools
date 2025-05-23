// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/core/viewManager.js
import { state, updateState } from '../state.js';
import { logger } from '../utils/logger.js';
import { scanForSourceFilesOnPage } from './sourceDiscovery.js'; // Needed if restoring original tree fails
// Removed PageHighlighterModule import as tab switch doesn't directly clear L-lock anymore; L-key toggle does.
// panelController's renderRightPanelContent will call the appropriate renderers.

// This function is primarily to ensure the File Tree tab has the correct data
// and that the extension is in a consistent state for displaying the file tree.
// It's called when the "File Tree" tab is explicitly selected.
export function ensureFileTreeView() {
    logger.log('info', 'ViewManager: Ensuring File Tree view data and state.');

    // If not already in fileTree mode (e.g., switching from AI Chat, though not fully implemented)
    // or if explicitly called.
    // The 'L' lock is independent of tab choice now.
    // Clicking a file in the tree sets its own type of "lock" (state.lockedFile, state.isLocked=true).

    updateState({
        activeRightPanelTab: 'fileTree', // Ensure this tab is marked active
        // elementHighlighting: true, // Default to hover mode if no file is selected
        // viewMode: 'filetree', // This might be redundant if activeRightPanelTab is primary
    });

    // If state.fileTree is already populated (e.g. by initial scan or previous view),
    // and it's not the placeholder for DOM hierarchy, it should be the file list.
    // The `originalFileTree` concept was for switching *back from* DOM hierarchy.
    // Since DOM hierarchy is removed, `state.fileTree` should always hold the file list.
    // If it's empty, a scan should be triggered.
    if (!state.fileTree || Object.keys(state.fileTree).length === 0) {
        logger.log('warn', 'ViewManager: File tree data is empty. Rescanning for file tree view.');
        scanForSourceFilesOnPage(); // This updates state.fileTree and calls its own renderFileTree
    } else {
        // Data exists, panelController's renderRightPanelContent will use it.
        logger.log('debug', 'ViewManager: File tree data already exists. Tab content renderer will use it.');
        // If renderRightPanelContent isn't automatically called by tab switch, call it here.
        // const { renderRightPanelContent } = await import('../ui/panelController.js'); // If needed
        // renderRightPanelContent();
    }
}

// DOM Hierarchy specific functions (switchToDomHierarchyView, prepareDomHierarchyView) are removed.
// The fileTreeRenderer's refresh button now calls scanForSourceFilesOnPage directly.
// The 'L' key in eventManager handles its own logic without view switching.
// Tab clicks in panelController handle calling renderRightPanelContent for the active tab.