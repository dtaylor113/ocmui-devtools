// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/features/fileTree/fileTreeRenderer.js
import { CONSTANTS } from '../../constants.js';
import { state, elements, updateState } from '../../state.js';
import { logger } from '../../utils/logger.js';
import { domUtils } from '../../utils/dom.js';
import { fetchSourceCode } from '../../core/sourceDiscovery.js';
import { updateSourceCodePanel } from '../../ui/panelController.js';
import * as PageHighlighterModule from '../../ui/pageHighlighter.js';
import { highlightTreeFileNode, removeAllLockIconsFromTree, clearAllTreeNodeSelections } from './fileTreeInteraction.js';

export async function renderFileTree() {
    if (!elements.rightPanelContentArea) {
        logger.log('error', 'FileTreeRenderer: Right panel content area not found for rendering file tree.');
        return;
    }
    elements.rightPanelContentArea.innerHTML = '';
    logger.log('info', `FileTreeRenderer: Rendering file tree.`);
    clearAllTreeNodeSelections();
    removeAllLockIconsFromTree();

    const fileTreeSpecificHeader = domUtils.createElement('div', {
        classes: ['file-tree-header'],
        styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px', borderBottom: '1px solid #444', height: `${CONSTANTS.SIZES.HEADER_HEIGHT}px`, backgroundColor: '#272822' }
    });
    const titleDiv = domUtils.createElement('div', {
        classes: [CONSTANTS.CLASSES.FILE_TREE_TITLE],
        textContent: 'Web Page Source Files',
        styles: { fontWeight: 'normal' }
    });
    fileTreeSpecificHeader.appendChild(titleDiv);
    const refreshButton = domUtils.createElement('button', {
        classes: [CONSTANTS.CLASSES.FILE_TREE_REFRESH], textContent: 'Refresh Files',
        styles: { position: 'relative', top: 'auto', right: 'auto'},
        eventListeners: {
            click: async function() {
                logger.log('info', 'FileTreeRenderer: File tree refresh clicked.');
                const { scanForSourceFilesOnPage } = await import('../../core/sourceDiscovery.js');
                scanForSourceFilesOnPage();
            }
        }
    });
    fileTreeSpecificHeader.appendChild(refreshButton);
    elements.rightPanelContentArea.appendChild(fileTreeSpecificHeader);

    const treeContentContainer = domUtils.createElement('div', {
        classes: ['file-tree-scroll-container'],
        styles: { overflowY: 'auto', overflowX: 'auto', padding: '10px', height: `calc(100% - ${CONSTANTS.SIZES.HEADER_HEIGHT}px)` }
    });

    if (!state.fileTree || Object.keys(state.fileTree).length === 0) {
        const emptyMessage = domUtils.createElement('div', {
            styles: { color: '#F92672', padding: '10px', textAlign: 'center', marginTop: '20px' },
            textContent: 'No source files found on this page. Try refreshing.'
        });
        treeContentContainer.appendChild(emptyMessage);
    } else {
        const treeRootElement = domUtils.createElement('div');
        renderStandardTree(treeRootElement, state.fileTree, 0);
        treeContentContainer.appendChild(treeRootElement);
    }
    elements.rightPanelContentArea.appendChild(treeContentContainer);

    if (state.lockedFile && !state.elementHighlighting && state.isLocked && !state.lockedElement) {
        highlightTreeFileNode(state.lockedFile, false);
    }
}

function renderStandardTree(container, nodeData, level) {
    const sortedKeys = Object.keys(nodeData).filter(key => !key.startsWith('_')).sort((a, b) => {
        const nodeA = nodeData[a]; const nodeB = nodeData[b];
        if (nodeA._isDir && !nodeB._isDir) return -1; if (!nodeA._isDir && nodeB._isDir) return 1;
        return a.localeCompare(b);
    });

    for (const key of sortedKeys) {
        const nodeInfo = nodeData[key];
        const nodeElement = domUtils.createElement('div', { classes: [CONSTANTS.CLASSES.FILE_TREE_NODE] });
        for (let i = 0; i < level; i++) { nodeElement.appendChild(domUtils.createElement('span', { classes: [CONSTANTS.CLASSES.TREE_INDENT] })); }

        if (nodeInfo._isDir) {
            const expandIcon = domUtils.createElement('span', { classes: [CONSTANTS.CLASSES.TREE_EXPAND_ICON], textContent: '▼' });
            nodeElement.appendChild(expandIcon);
            const folderSpan = domUtils.createElement('span', { classes: [CONSTANTS.CLASSES.TREE_FOLDER], textContent: key, attributes: { 'data-path': nodeInfo._path || key } });
            nodeElement.appendChild(folderSpan); container.appendChild(nodeElement);
            const childrenContainer = domUtils.createElement('div', { classes: [CONSTANTS.CLASSES.TREE_CHILDREN] });
            renderStandardTree(childrenContainer, nodeInfo._children, level + 1); container.appendChild(childrenContainer);
            const toggleNode = () => { const isHidden = childrenContainer.style.display === 'none'; childrenContainer.style.display = isHidden ? 'block' : 'none'; expandIcon.textContent = isHidden ? '▼' : '►'; };
            expandIcon.addEventListener('click', (e) => { e.stopPropagation(); toggleNode(); });
            folderSpan.addEventListener('click', (e) => { e.stopPropagation(); toggleNode(); });
        } else if (nodeInfo._isFile) {
            nodeElement.appendChild(domUtils.createElement('span', { classes: [CONSTANTS.CLASSES.TREE_EXPAND_ICON], textContent: ' ' }));
            const fileSpan = domUtils.createElement('span', {
                classes: [CONSTANTS.CLASSES.TREE_FILE], textContent: key,
                attributes: { title: nodeInfo._path, 'data-path': nodeInfo._path, 'data-filename': nodeInfo._path.split('/').pop() }
            });
            nodeElement.appendChild(fileSpan);
            if (nodeInfo._lines && nodeInfo._lines.length > 0) {
                const linesHint = domUtils.createElement('span', { styles: { color: '#75715E', fontSize: '0.8em', marginLeft: '5px' }, textContent: `(${nodeInfo._lines.length} loc)` });
                nodeElement.appendChild(linesHint);
            }
            container.appendChild(nodeElement);

            nodeElement.addEventListener('click', async () => {
                logger.log('info', `FileTree: Clicked ${nodeInfo._isFile ? 'file' : 'folder'}: ${nodeInfo._path}`);
                if (state.lockedFile === nodeInfo._path && state.isLocked && !state.lockedElement) {
                    logger.log('info', `FileTree: Unlocking file: ${nodeInfo._path}`);
                    updateState({ isLocked: false, lockedFile: null, elementHighlighting: true });
                    if (typeof PageHighlighterModule.clearAllPageHighlights === 'function') { PageHighlighterModule.clearAllPageHighlights(); }
                    removeAllLockIconsFromTree();
                    clearAllTreeNodeSelections();
                    return;
                }
                updateState({ elementHighlighting: false, lockedFile: nodeInfo._path, isLocked: true, lockedElement: null });
                if (typeof PageHighlighterModule.clearAllPageHighlights === 'function') { PageHighlighterModule.clearAllPageHighlights(); }
                
                const fileContent = await fetchSourceCode(nodeInfo._path);
                const firstLine = (nodeInfo._lines && nodeInfo._lines.length > 0) ? nodeInfo._lines[0] : '1';
                if (fileContent || fileContent === "") { updateSourceCodePanel({ sourceFile: nodeInfo._path, sourceLine: firstLine }, fileContent); }
                else { updateSourceCodePanel({ sourceFile: nodeInfo._path, sourceLine: firstLine }, `/* Could not load: ${nodeInfo._path} */`); }
                if (typeof PageHighlighterModule.highlightPageElementsByFile === 'function') { PageHighlighterModule.highlightPageElementsByFile(nodeInfo._path, firstLine); }
                else { logger.log('error', 'FileTreeRenderer: PageHighlighterModule.highlightPageElementsByFile is not a function.'); }
                highlightTreeFileNode(nodeInfo._path, false);
            });
        }
    }
}