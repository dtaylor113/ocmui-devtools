// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/ui/panelController.js
import { CONSTANTS } from '../constants.js';
import { state, elements, setElement, updateState } from '../state.js';
import { domUtils } from '../utils/dom.js';
import { logger } from '../utils/logger.js';
import { escapeHtml } from '../utils/helpers.js';
import { renderFileTree } from '../features/fileTree/fileTreeRenderer.js';

async function handleRightPanelTabClick(tabName) {
    if (state.activeRightPanelTab === tabName && tabName !== 'domHierarchy') {
        if (tabName === 'domHierarchy' && elements.domHierarchyTabButton?.dataset.lockedElementId !== state.lockedElement?.id) {
            // Allow re-render
        } else {
            return;
        }
    }
    logger.log('info', `PanelController: Tab clicked - ${tabName}.`);
    updateState({ activeRightPanelTab: tabName });

    const tabButtons = elements.rightPanelContainer?.querySelectorAll('.right-panel-tab-button');
    tabButtons?.forEach(btn => {
        const isActive = btn.dataset.tabName === tabName;
        btn.classList.toggle('active', isActive);
        btn.style.color = isActive ? '#fff' : '#ccc';
        btn.style.borderBottomColor = isActive ? CONSTANTS.CLASSES.TREE_FILE_SELECTED : 'transparent';
    });
    await renderRightPanelContent();
}

export async function renderRightPanelContent() {
    if (!elements.rightPanelContentArea) {
        logger.log('error', 'PanelController: Right panel content area not found. Cannot render tab content.');
        return;
    }
    elements.rightPanelContentArea.innerHTML = '';
    switch (state.activeRightPanelTab) {
        case 'fileTree':
            if (typeof renderFileTree === 'function') {
                await renderFileTree(); 
            } else {
                elements.rightPanelContentArea.textContent = 'File Tree renderer not available.';
                logger.log('error', 'PanelController: renderFileTree function not found/imported.');
            }
            break;
        case 'aiChat':
            elements.rightPanelContentArea.innerHTML = '<div style="padding:10px; text-align:center; color:#aaa;">AI Chat Feature - Coming Soon!</div>';
            break;
        default:
            elements.rightPanelContentArea.textContent = `Unknown tab selected: ${state.activeRightPanelTab}`;
            logger.log('warn', `PanelController: Attempted to render unknown tab: ${state.activeRightPanelTab}. Defaulting to fileTree.`);
            if (state.activeRightPanelTab !== 'fileTree') {
                await handleRightPanelTabClick('fileTree');
            }
    }
}

export function initializeMainPanels() {
    if (elements.panel && document.body.contains(elements.panel) &&
        elements.rightPanelContainer && document.body.contains(elements.rightPanelContainer)) {
        if (!elements.rightPanelContentArea && elements.rightPanelContainer) {
            const contentArea = elements.rightPanelContainer.querySelector('.right-panel-content-area');
            if (contentArea) setElement('rightPanelContentArea', contentArea);
        }
        return;
    }
    logger.log('info', 'PanelController: Initializing main UI panel elements.');
    try {
        const sourcePanel = domUtils.createElement('div', { attributes: { id: CONSTANTS.DOM_IDS.SOURCE_CODE_PANEL } });
        if (domUtils.appendElement(sourcePanel, document.body)) {
            setElement('panel', sourcePanel);
        } else {
            logger.log('error', 'PanelController: Failed to append source code panel.');
            setElement('panel', null); 
        }
        const rightPanel = domUtils.createElement('div', { attributes: { id: CONSTANTS.DOM_IDS.FILE_TREE_PANEL } }); 
        setElement('rightPanelContainer', rightPanel);
        const tabHeader = domUtils.createElement('div', {
            classes: ['right-panel-tab-header'],
            styles: { display: 'flex', borderBottom: '1px solid #444', padding: '0 5px', backgroundColor: '#202020', height: `${CONSTANTS.SIZES.HEADER_HEIGHT -1}px`, alignItems: 'stretch' }
        });
        const tabs = [
            { name: 'fileTree', label: 'File Tree' },
            { name: 'aiChat', label: 'AI Chat' }
        ];
        tabs.forEach(tabInfo => {
            const tabButton = domUtils.createElement('button', {
                classes: ['right-panel-tab-button'], textContent: tabInfo.label,
                attributes: { 'data-tab-name': tabInfo.name },
                styles: { padding: '0 10px', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', borderBottom: '2px solid transparent', fontSize: '13px', outline: 'none' },
                eventListeners: { click: () => handleRightPanelTabClick(tabInfo.name) }
            });
            if (tabInfo.name === state.activeRightPanelTab) {
                tabButton.classList.add('active');
                tabButton.style.color = '#fff';
                tabButton.style.borderBottomColor = CONSTANTS.CLASSES.TREE_FILE_SELECTED;
            }
            tabHeader.appendChild(tabButton);
        });
        rightPanel.appendChild(tabHeader);
        const tabContentArea = domUtils.createElement('div', {
            classes: ['right-panel-content-area'],
            styles: { flex: '1', overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }
        });
        setElement('rightPanelContentArea', tabContentArea);
        rightPanel.appendChild(tabContentArea);
        if (!domUtils.appendElement(rightPanel, document.body)) {
            logger.log('error', 'PanelController: Failed to append right panel container.');
            setElement('rightPanelContainer', null); 
            setElement('rightPanelContentArea', null);
        }
        const vHandle = domUtils.createElement('div', {
            attributes: { id: CONSTANTS.DOM_IDS.RESIZE_HANDLE },
            eventListeners: { mousedown: (e) => { updateState({ isResizing: true, lastY: e.clientY }); e.preventDefault(); } }
        });
        if (domUtils.appendElement(vHandle, document.body)) { setElement('resizeHandle', vHandle); }
        const hHandle = domUtils.createElement('div', {
            attributes: { id: CONSTANTS.DOM_IDS.HORIZONTAL_RESIZE_HANDLE },
            eventListeners: { mousedown: (e) => { updateState({ isHorizontalResizing: true, lastX: e.clientX }); e.preventDefault(); } }
        });
        if (domUtils.appendElement(hHandle, document.body)) { setElement('horizontalResizeHandle', hHandle); }
        logger.log('info', 'PanelController: Main UI panel elements creation attempt complete.');
        if (elements.rightPanelContentArea) {
            renderRightPanelContent(); 
        } else {
            logger.log('error', 'PANEL_CTRL (InitEnd) - rightPanelContentArea not valid after init, cannot render initial tab.');
        }
    } catch (error) {
        logger.log('error', `PanelController: Error initializing main UI panels: ${error.message}`);
        console.error(error);
    }
}

export function showAllPanels() {
    if (elements.panel) domUtils.setElementVisibility(elements.panel, true);
    if (elements.rightPanelContainer) domUtils.setElementVisibility(elements.rightPanelContainer, true);
    if (elements.resizeHandle) domUtils.setElementVisibility(elements.resizeHandle, true);
    if (elements.horizontalResizeHandle) domUtils.setElementVisibility(elements.horizontalResizeHandle, true);
    if (elements.rightPanelContainer) elements.rightPanelContainer.style.width = `${state.rightPanelWidth}px`;
    if (elements.panel) elements.panel.style.width = `calc(100% - ${state.rightPanelWidth}px)`;
    if (elements.horizontalResizeHandle) elements.horizontalResizeHandle.style.left = `calc(100% - ${state.rightPanelWidth}px)`;
    const panelHeightStyle = elements.panel?.style.height && elements.panel.style.height !== '0px' ? elements.panel.style.height : "50%";
    if (elements.panel) elements.panel.style.height = panelHeightStyle;
    if (elements.rightPanelContainer) elements.rightPanelContainer.style.height = panelHeightStyle;
    if (elements.resizeHandle) elements.resizeHandle.style.bottom = panelHeightStyle;
    if (elements.horizontalResizeHandle) elements.horizontalResizeHandle.style.height = panelHeightStyle;
}

export function hideAllPanels() {
    if (elements.panel) domUtils.setElementVisibility(elements.panel, false);
    if (elements.rightPanelContainer) domUtils.setElementVisibility(elements.rightPanelContainer, false);
    if (elements.resizeHandle) domUtils.setElementVisibility(elements.resizeHandle, false);
    if (elements.horizontalResizeHandle) domUtils.setElementVisibility(elements.horizontalResizeHandle, false);
}

function prepareSourceCodeDisplay(fileContent, elementInfo) {
    if (!fileContent && fileContent !== "") { 
        logger.log('warn', 'PANEL_CTRL (Prepare) - fileContent is null or undefined.');
        return domUtils.createElement('pre', { textContent: 'Error: File content is null or undefined.' });
    }
    if (!elementInfo) {
        logger.log('warn', 'PANEL_CTRL (Prepare) - Missing elementInfo.');
        return domUtils.createElement('pre', { textContent: 'Error: Missing element info.' });
    }
    const lines = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const scrollToLine = parseInt(elementInfo.sourceLine, 10);
    let elementLines = [];
    try {
        const pathFromElementInfo = elementInfo.sourceFile;
        const normalizedPathForQuery = pathFromElementInfo.startsWith('/') ? pathFromElementInfo.substring(1) : pathFromElementInfo;
        const pathWithLeadingSlashForQuery = '/' + normalizedPathForQuery;
        const elementsV1 = document.querySelectorAll(`[data-source-file="${normalizedPathForQuery}"]`);
        const elementsV2 = document.querySelectorAll(`[data-source-file="${pathWithLeadingSlashForQuery}"]`);
        const combinedElements = new Set([...elementsV1, ...elementsV2]);
        combinedElements.forEach(element => {
            const elFileAttr = element.getAttribute('data-source-file');
            const elFileNormalized = elFileAttr && elFileAttr.startsWith('/') ? elFileAttr.substring(1) : elFileAttr;
            if (elFileNormalized === normalizedPathForQuery) {
                const line = parseInt(element.getAttribute('data-source-line'), 10);
                if (!isNaN(line) && !elementLines.includes(line)) { 
                    elementLines.push(line); 
                }
            }
        });
        elementLines.sort((a, b) => a - b); 
    } catch (e) { logger.log('warn', `PanelController/prepare: Error finding element lines: ${e.message}`); }

    const formattedLines = lines.map((line, index) => {
        const escapedLine = escapeHtml(line);
        const lineNumber = index + 1;
        let lineClass = '';
        let lineStyle = 'display: block;'; 
        let lineId = '';
        if (state.elementHighlighting) { 
            if (lineNumber === scrollToLine) {
                lineId = CONSTANTS.DOM_IDS.HIGHLIGHTED_LINE;
                lineClass = CONSTANTS.CLASSES.HIGHLIGHTED_SOURCE_LINE; 
            } else if (elementLines.includes(lineNumber)) {
                lineClass = CONSTANTS.CLASSES.HOVER_HIGHLIGHTED_SOURCE_LINE; 
            }
        } else { 
            if (elementLines.includes(lineNumber)) {
                lineClass = CONSTANTS.CLASSES.FILE_HIGHLIGHTED_SOURCE_LINE; 
                if (lineNumber === scrollToLine) {
                    lineId = CONSTANTS.DOM_IDS.HIGHLIGHTED_LINE;
                }
            }
        }
        return `<span${lineId ? ` id="${lineId}"` : ''}${lineClass ? ` class="${lineClass}"` : ''} style="${lineStyle}">${lineNumber}: ${escapedLine}</span>`;
    }).join('');
    const preBlock = domUtils.createElement('pre', {
        styles: { fontSize: '12px', margin: '0', padding: '0', border: 'none', backgroundColor: 'transparent', overflowX: 'auto' },
        innerHTML: `<code style="font-size: 12px; display: block; white-space: pre;">${formattedLines}</code>`
    });
    return preBlock;
}

export function updateSourceCodePanel(elementInfo, fileContent) {
    if (!elements.panel) {
        logger.log('error', 'PANEL_CTRL (Update) - Source code panel is NULL. Cannot update.');
        return;
    }
    if (!elementInfo) {
        logger.log('warn', 'PANEL_CTRL (Update) - Missing elementInfo.');
        elements.panel.innerHTML = '<div class="source-code-header">Error loading source.</div><div class="source-code-content">Missing element information.</div>';
        return;
    }
    if (fileContent === null || typeof fileContent === 'undefined') {
        logger.log('warn', `PANEL_CTRL (Update) - fileContent is null/undefined for ${elementInfo.sourceFile}.`);
        const errHeader = domUtils.createElement('div', { classes: ['source-code-header'], textContent: `Error: Could not load ${elementInfo.sourceFile}` });
        const errContent = domUtils.createElement('div', { classes: ['source-code-content'], textContent: "Failed to fetch file content." });
        elements.panel.innerHTML = ''; elements.panel.appendChild(errHeader); elements.panel.appendChild(errContent);
        return;
    }
    logger.log('info', `PANEL_CTRL (Update) - Updating source panel for ${elementInfo.sourceFile}:${elementInfo.sourceLine}.`);
    elements.panel.innerHTML = '';
    let pathSegments = elementInfo.sourceFile.split('/').filter(part => part.length > 0);
    let fileNameAndLineNumber = pathSegments.pop() || elementInfo.sourceFile;
    const arrowSpan = '<span style="font-size: 10px; margin: 0 4px;"> ▶ </span>';
    let formattedPath = pathSegments.join(arrowSpan);
    const headerColor = state.elementHighlighting ? '#8fce00' : '#FF8C00';
    const header = domUtils.createElement('div', {
        classes: ['source-code-header'],
        innerHTML: formattedPath ?
            `/ ${formattedPath}${arrowSpan}<strong style="margin-left: 2px; color: ${headerColor};">${fileNameAndLineNumber}::${elementInfo.sourceLine}</strong>` :
            `/ <strong style="color: ${headerColor};">${fileNameAndLineNumber}::${elementInfo.sourceLine}</strong>`
    });
    const codeContainer = domUtils.createElement('div', { classes: ['source-code-content'] });
    const preBlock = prepareSourceCodeDisplay(fileContent, elementInfo);
    codeContainer.appendChild(preBlock);
    elements.panel.appendChild(header);
    elements.panel.appendChild(codeContainer);
    setTimeout(() => {
        const highlightedLine = document.getElementById(CONSTANTS.DOM_IDS.HIGHLIGHTED_LINE);
        if (highlightedLine) {
            highlightedLine.scrollIntoView({ block: 'center', behavior: 'auto' });
        } else {
            logger.log('warn', `PANEL_CTRL (Scroll) - Highlighted line ID '${CONSTANTS.DOM_IDS.HIGHLIGHTED_LINE}' not found for scrolling after update.`);
        }
    }, 0);
}

export function updateRightPanelHeader(title) { 
    // This function is mostly managed by individual tab renderers now.
}