// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/features/fileTree/fileTreeInteraction.js
import { CONSTANTS } from '../../constants.js';
import { logger } from '../../utils/logger.js';
import { domUtils } from '../../utils/dom.js';
import { elements } from '../../state.js'; // To access the rendered tree

// Removes all lock icons from the file tree
export function removeAllLockIconsFromTree() {
    if (!elements.rightPanelContentArea) return;
    logger.log('debug', 'FileTreeInteraction: Removing all lock icons from tree.');
    const lockIcons = elements.rightPanelContentArea.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_LOCK_ICON}`);
    lockIcons.forEach(icon => icon.remove());
}

// Clears all selection styling (text color, background) from tree nodes
export function clearAllTreeNodeSelections() {
    if (!elements.rightPanelContentArea) return;
    logger.log('debug', 'FileTreeInteraction: Clearing all tree node selections.');

    const selectedFiles = elements.rightPanelContentArea.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_FILE_SELECTED}`);
    selectedFiles.forEach(file => file.classList.remove(CONSTANTS.CLASSES.TREE_FILE_SELECTED));

    const selectedHoverFiles = elements.rightPanelContentArea.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_FILE_HOVER_SELECTED}`);
    selectedHoverFiles.forEach(file => file.classList.remove(CONSTANTS.CLASSES.TREE_FILE_HOVER_SELECTED));

    const selectedFolders = elements.rightPanelContentArea.querySelectorAll(`.${CONSTANTS.CLASSES.TREE_FOLDER_SELECTED}`);
    selectedFolders.forEach(folder => folder.classList.remove(CONSTANTS.CLASSES.TREE_FOLDER_SELECTED));

    // Also remove the full-row background selection style
    const selectedNodes = elements.rightPanelContentArea.querySelectorAll('.file-tree-node-selected');
    selectedNodes.forEach(node => node.classList.remove('file-tree-node-selected'));
}

// Ensures a specific file node and its parent folders are visible
function ensureFileNodeVisible(fileElement) {
    if (!fileElement) return;
    let parent = fileElement.parentElement;
    while (parent && parent !== elements.rightPanelContentArea) {
        if (parent.classList.contains(CONSTANTS.CLASSES.TREE_CHILDREN) && parent.style.display === 'none') {
            parent.style.display = 'block';
            const folderNode = parent.previousElementSibling; // The .file-tree-node containing the folder
            if (folderNode && folderNode.classList.contains(CONSTANTS.CLASSES.FILE_TREE_NODE)) {
                const expandIcon = folderNode.querySelector(`.${CONSTANTS.CLASSES.TREE_EXPAND_ICON}`);
                if (expandIcon) expandIcon.textContent = '▼';
            }
        }
        parent = parent.parentElement;
    }
}

// Scrolls an element to the middle of its scrollable container
function scrollElementToMiddle(element, container) {
    if (!element || !container) return;
    try {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate based on offsetTop relative to the scroll container
        const elementTopInContainer = element.offsetTop - container.offsetTop; // Adjust if container itself isn't at (0,0) in parent
        const elementHeight = element.offsetHeight;
        const containerVisibleHeight = container.clientHeight;

        let targetScrollTop = elementTopInContainer - (containerVisibleHeight / 2) + (elementHeight / 2);
        targetScrollTop = Math.max(0, Math.min(targetScrollTop, container.scrollHeight - containerVisibleHeight));
        
        container.scrollTop = targetScrollTop;
        logger.log('debug', `FileTreeInteraction: Scrolled tree node to middle. Target scrollTop: ${targetScrollTop}`);
    } catch (error) {
        logger.log('error', `FileTreeInteraction: Error scrolling tree node: ${error.message}`);
    }
}


// Highlights a file in the tree, isHover indicates if it's a temporary hover highlight
export function highlightTreeFileNode(filePath, isHoverHighlight = false) {
    if (!elements.rightPanelContentArea) {
        logger.log('warn', 'FileTreeInteraction: rightPanelContentArea not found, cannot highlight tree file.');
        return;
    }
    logger.log('debug', `FileTreeInteraction: Highlighting tree file: ${filePath}, Hover: ${isHoverHighlight}`);

    clearAllTreeNodeSelections(); // Clear previous selections first
    // If it's not a hover highlight, it implies a lock, so also clear lock icons
    // The calling function (e.g. file click handler) will add the new lock icon.
    if (!isHoverHighlight) {
        removeAllLockIconsFromTree();
    }

    const fileElement = elements.rightPanelContentArea.querySelector(`.${CONSTANTS.CLASSES.TREE_FILE}[data-path="${filePath}"]`);

    if (fileElement) {
        const parentNodeDiv = fileElement.closest(`.${CONSTANTS.CLASSES.FILE_TREE_NODE}`); // The whole row

        if (isHoverHighlight) {
            fileElement.classList.add(CONSTANTS.CLASSES.TREE_FILE_HOVER_SELECTED); // White text
        } else {
            fileElement.classList.add(CONSTANTS.CLASSES.TREE_FILE_SELECTED); // Orange text
            if (parentNodeDiv) parentNodeDiv.classList.add('file-tree-node-selected'); // Background highlight for row

            // Add lock icon for non-hover (i.e., file click/lock)
            const lockIcon = domUtils.createElement('span', {
                classes: [CONSTANTS.CLASSES.TREE_LOCK_ICON],
                textContent: '🔒',
                attributes: { title: 'File is selected. Click again to unlock.' }
            });
            // Insert after the fileSpan, but within the same parent div (nodeElement)
            // fileSpan is fileElement here.
            if (fileElement.parentNode) { // Ensure parentNode exists
                 fileElement.parentNode.insertBefore(lockIcon, fileElement.nextSibling);
            }
        }

        ensureFileNodeVisible(fileElement);
        const scrollContainer = elements.rightPanelContentArea.querySelector('.file-tree-scroll-container');
        if (scrollContainer) {
            scrollElementToMiddle(parentNodeDiv || fileElement, scrollContainer);
        }
        logger.log('info', `FileTreeInteraction: Highlighted and ensured visibility for: ${filePath}`);
    } else {
        logger.log('warn', `FileTreeInteraction: File element not found in tree for path: ${filePath}`);
        // TODO: Optionally highlight parent folders if file not exact match
    }
}