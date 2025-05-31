// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/ui/panelController.js
import { CONSTANTS } from '../constants.js';
import { state, elements, setElement, updateState } from '../state.js';
import { domUtils } from '../utils/dom.js';
import { logger } from '../utils/logger.js';
import { escapeHtml } from '../utils/helpers.js';
import { renderFileTree } from '../features/fileTree/fileTreeRenderer.js';

// Search functionality globals (within this module)
let originalCodeContentHTML = ''; // To restore content when clearing search

async function handleRightPanelTabClick(tabName) {
    // Simplified: if already active, do nothing.
    if (state.activeRightPanelTab === tabName) {
        return;
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
        const sourcePanel = domUtils.createElement('div', { 
            attributes: { id: CONSTANTS.DOM_IDS.SOURCE_CODE_PANEL },
            styles: { // Make sourcePanel a flex container
                display: 'flex',
                flexDirection: 'column'
            }
        });
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

    // Log computed styles after application
    if (elements.panel && elements.rightPanelContainer) {
        const panelComputed = window.getComputedStyle(elements.panel);
        const rightPanelComputed = window.getComputedStyle(elements.rightPanelContainer);
        logger.log('debug', `SHOW_PANELS Panel - display: ${panelComputed.display}, position: ${panelComputed.position}, left: ${panelComputed.left}, right: ${panelComputed.right}, width: ${panelComputed.width}, height: ${panelComputed.height}, z-index: ${panelComputed.zIndex}`);
        logger.log('debug', `SHOW_PANELS RightPanel - display: ${rightPanelComputed.display}, position: ${rightPanelComputed.position}, left: ${rightPanelComputed.left}, right: ${rightPanelComputed.right}, width: ${rightPanelComputed.width}, height: ${rightPanelComputed.height}, z-index: ${rightPanelComputed.zIndex}`);
    }
}

export function hideAllPanels() {
    if (elements.panel) domUtils.setElementVisibility(elements.panel, false);
    if (elements.rightPanelContainer) domUtils.setElementVisibility(elements.rightPanelContainer, false);
    if (elements.resizeHandle) domUtils.setElementVisibility(elements.resizeHandle, false);
    if (elements.horizontalResizeHandle) domUtils.setElementVisibility(elements.horizontalResizeHandle, false);
}

function clearSearchHighlights() {
    if (elements.sourceCodeContentContainer && originalCodeContentHTML) {
        const codeElement = elements.sourceCodeContentContainer.querySelector('code');
        if (codeElement) {
            codeElement.innerHTML = originalCodeContentHTML;
        }
    }
    updateState({ searchResults: [], currentSearchIndex: -1, searchTerm: '' });
    if (elements.findCounter) {
        elements.findCounter.textContent = '0 of 0';
    }
    // DO NOT clear the input field here. Let the caller decide.
    // if (elements.findInput) {
    //     elements.findInput.value = '';
    // }
}

function setActiveMatchAndScroll(index, shouldScroll = true) { 
    const { searchResults } = state;
    if (!elements.sourceCodeContentContainer || !searchResults || searchResults.length === 0) {
        return;
    }
    if (index < 0 || index >= searchResults.length) {
        return;
    }

    // Remove active class from previously active match
    if (state.currentSearchIndex !== -1 && state.currentSearchIndex < searchResults.length) {
        const prevActiveMatch = searchResults[state.currentSearchIndex];
        if (prevActiveMatch) { 
            prevActiveMatch.classList.remove(CONSTANTS.CLASSES.SEARCH_MATCH_ACTIVE);
            // Ensure base highlight remains if it was an active match
            if (!prevActiveMatch.classList.contains(CONSTANTS.CLASSES.SEARCH_MATCH_HIGHLIGHT)) {
                 prevActiveMatch.classList.add(CONSTANTS.CLASSES.SEARCH_MATCH_HIGHLIGHT);
            }
        }
    }

    updateState({ currentSearchIndex: index });

    const currentMatchElement = searchResults[index];
    if (currentMatchElement) {
        // Remove base highlight if present, then add active (to prevent double classes if logic is complex elsewhere)
        currentMatchElement.classList.remove(CONSTANTS.CLASSES.SEARCH_MATCH_HIGHLIGHT);
        currentMatchElement.classList.add(CONSTANTS.CLASSES.SEARCH_MATCH_ACTIVE);
        if (shouldScroll) {
            currentMatchElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    if (elements.findCounter) {
        elements.findCounter.textContent = `${index + 1} of ${searchResults.length}`;
    }
}

// Helper to get line number from a search result span (which contains the original line text)
function getLineNumberOfSearchResult(searchResultElement) {
    if (!searchResultElement) return null;
    // The highlighted span's content is the matched text. 
    // We need to get its parent line span to find the line number.
    let lineSpan = searchResultElement.closest('span[style*="display: block"]');
    if (lineSpan && lineSpan.parentElement && lineSpan.parentElement.tagName === 'CODE') {
        const textContent = lineSpan.textContent || '';
        const match = textContent.match(/^(\d+):/);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
    }
    // Fallback or if structure is different - this might need adjustment
    // If the searchResultElement *is* the line span itself (e.g. if a whole line matched somehow)
    if (searchResultElement.tagName === 'SPAN' && searchResultElement.style.display === 'block') {
        const textContent = searchResultElement.textContent || '';
        const match = textContent.match(/^(\d+):/);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
    }
    logger.log('warn', 'Could not determine line number for search result:', searchResultElement);
    return null;
}

function performSearch() {
    if (!elements.findInput || !elements.sourceCodeContentContainer) {
        logger.log('warn', "Search: Find input or source code container not ready.");
        return;
    }
    const newSearchTerm = elements.findInput.value;
    const oldSearchTerm = state.searchTerm;

    // If search term hasn't changed (e.g. user just blurred input), do nothing further for 'input' event based search.
    // Navigation via Enter/buttons will handle explicit requests to move.
    // However, if the input field is cleared, we should clear results.
    if (newSearchTerm === oldSearchTerm && newSearchTerm.trim() !== '') { 
        // If results exist, ensure the first one is active but don't scroll if it's just an input event
        // This case is more for when the user types. If they press enter, navigateToSearchMatch handles it.
        if(state.searchResults.length > 0 && state.currentSearchIndex === -1) {
             // setActiveMatchAndScroll(0, false); // Don't scroll on mere input if first result isn't active
        } // Let existing active match remain active.
        return;
    }
    
    clearSearchHighlights(); // Clears previous highlights and resets searchResults, currentSearchIndex
    updateState({ searchTerm: newSearchTerm }); 
    
    const codeElement = elements.sourceCodeContentContainer.querySelector('code');
    if (!codeElement) {
        logger.log('warn', "Search: Code element not found in source container.");
        // updateState is handled by clearSearchHighlights
        if (elements.findCounter) elements.findCounter.textContent = '0 of 0';
        return;
    }

    if (!newSearchTerm.trim()) {
        // clearSearchHighlights already called, counter updated by it.
        return;
    }

    if (!originalCodeContentHTML) {
        logger.log('error', "Search: originalCodeContentHTML is empty, cannot perform search.");
        return; 
    }

    const escapedSearchTerm = newSearchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
    const regex = new RegExp(escapeHtml(escapedSearchTerm), 'gi');
    
    codeElement.innerHTML = originalCodeContentHTML.replace(regex, (matchedText) => {
        return `<span class="${CONSTANTS.CLASSES.SEARCH_MATCH_HIGHLIGHT}">${matchedText}</span>`;
    });

    const highlightedSpans = Array.from(codeElement.querySelectorAll(`.${CONSTANTS.CLASSES.SEARCH_MATCH_HIGHLIGHT}`));
    updateState({ searchResults: highlightedSpans }); // currentSearchIndex remains -1 or as cleared

    if (elements.findCounter) {
        elements.findCounter.textContent = `0 of ${highlightedSpans.length}`;
    }

    if (highlightedSpans.length > 0) {
        // Make the first match active, but DO NOT scroll. User navigates to scroll.
        setActiveMatchAndScroll(0, false); 
    } else {
        // updateState in clearSearchHighlights already set currentSearchIndex to -1
        // Counter is set to "0 of 0" by clearSearchHighlights or above logic for no spans
    }
}

function navigateToSearchMatch(direction) {
    const { searchResults, currentSearchIndex, lastClickedSourceLine } = state;

    if (!searchResults || searchResults.length === 0) {
        if (elements.findInput && elements.findInput.value.trim()) {
            performSearch();
            // After performSearch, state will be updated. Re-fetch.
            const updatedState = state;
            if (updatedState.currentSearchIndex === -1 || updatedState.searchResults.length === 0) return;
            // If performSearch found results, the first one is active (index 0), but not scrolled.
            // For explicit navigation, we should now scroll to it.
            setActiveMatchAndScroll(updatedState.currentSearchIndex, true);
            updateState({ lastClickedSourceLine: null }); // Clear click after use
            return;
        } else {
            return;
        }
    }

    let referenceLine = null;
    let isRelativeSearch = false;

    if (lastClickedSourceLine !== null) {
        referenceLine = lastClickedSourceLine;
        isRelativeSearch = true;
        logger.log('info', `Using last clicked line as reference: ${referenceLine}`);
    } else if (currentSearchIndex !== -1 && searchResults[currentSearchIndex]) {
        referenceLine = getLineNumberOfSearchResult(searchResults[currentSearchIndex]);
        if (referenceLine !== null) {
            logger.log('info', `Using current active match line as reference: ${referenceLine}`);
        }
    } else {
        // Fallback: if no click and no current selection, 'next' goes to first, 'prev' to last.
        logger.log('info', 'No specific reference line, using start/end of document.');
    }
    
    // Clear lastClickedSourceLine after using it once for this navigation attempt
    if (lastClickedSourceLine !== null) {
        updateState({ lastClickedSourceLine: null });
    }

    let bestMatchIndex = -1;

    if (direction === 'next') {
        let minLineAfterReference = Infinity;
        let firstMatchOnMinLineIndex = -1;

        if (referenceLine === null) { // No reference, find the very first match
            bestMatchIndex = 0;
        } else {
            for (let i = 0; i < searchResults.length; i++) {
                const matchLine = getLineNumberOfSearchResult(searchResults[i]);
                if (matchLine === null) continue;

                if (matchLine > referenceLine) {
                    if (matchLine < minLineAfterReference) {
                        minLineAfterReference = matchLine;
                        firstMatchOnMinLineIndex = i;
                    } else if (matchLine === minLineAfterReference) {
                        // Already found the first match on this line, stick with it for 'next'
                    }
                }
            }
            bestMatchIndex = firstMatchOnMinLineIndex;
            // If no match found AFTER reference, wrap around to the first match
            if (bestMatchIndex === -1 && searchResults.length > 0) {
                bestMatchIndex = 0; 
            }
        }
    } else { // direction === 'prev'
        let maxLineBeforeReference = -Infinity;
        let lastMatchOnMaxLineIndex = -1;

        if (referenceLine === null) { // No reference, find the very last match
            bestMatchIndex = searchResults.length - 1;
        } else {
            for (let i = 0; i < searchResults.length; i++) {
                const matchLine = getLineNumberOfSearchResult(searchResults[i]);
                if (matchLine === null) continue;

                if (matchLine < referenceLine) {
                    if (matchLine > maxLineBeforeReference) {
                        maxLineBeforeReference = matchLine;
                        lastMatchOnMaxLineIndex = i; 
                    } else if (matchLine === maxLineBeforeReference) {
                        lastMatchOnMaxLineIndex = i; // Keep updating to get the last one on this line
                    }
                }
            }
            bestMatchIndex = lastMatchOnMaxLineIndex;
            // If no match found BEFORE reference, wrap around to the last match
            if (bestMatchIndex === -1 && searchResults.length > 0) {
                bestMatchIndex = searchResults.length - 1;
            }
        }
    }

    if (bestMatchIndex !== -1) {
        setActiveMatchAndScroll(bestMatchIndex, true);
    } else if (searchResults.length > 0) {
        // Fallback if no suitable match found (e.g. all matches on the same line as reference for relative)
        // just cycle from current or default to first/last
        let newFallbackIndex = currentSearchIndex;
        if (newFallbackIndex === -1) {
             newFallbackIndex = (direction === 'next') ? 0 : searchResults.length -1;
        } else if (direction === 'next') {
            newFallbackIndex = (currentSearchIndex + 1) % searchResults.length;
        } else {
            newFallbackIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
        }
        setActiveMatchAndScroll(newFallbackIndex, true);
    }
}

function createFindBar() {
    const findBar = domUtils.createElement('div', {
        classes: ['source-code-find-bar'],
        styles: { 
            display: 'flex', 
            alignItems: 'center', 
            padding: '2px 6px',
            backgroundColor: '#3a3a3a',
            borderBottom: '1px solid #222',
            height: '26px',
            boxSizing: 'border-box',
            flexShrink: '0'
        }
    });

    const findLabel = domUtils.createElement('span', { 
        textContent: 'Find:',
        styles: { marginRight: '5px', fontSize: '0.9em' }
    });

    const findInputEl = domUtils.createElement('input', {
        attributes: { type: 'text', placeholder: 'Search...' },
        classes: ['source-code-find-input'],
        styles: { 
            flexGrow: '1',
            marginRight: '5px', 
            backgroundColor: '#272822',
            border: '1px solid #555',
            color: '#F8F8F2',
            padding: '1px 3px',
            fontSize: '0.9em'
        }
    });
    setElement('findInput', findInputEl);
    findInputEl.addEventListener('input', performSearch);
    // Add keydown listener for Enter/Shift+Enter for next/prev
    findInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // navigateToSearchMatch will perform a search if needed (e.g. text entered, no search done yet)
            if (e.shiftKey) {
                navigateToSearchMatch('prev');
            } else {
                navigateToSearchMatch('next');
            }
        }
    });


    const prevButtonEl = domUtils.createElement('button', { 
        textContent: '↑', 
        classes: ['source-code-find-btn', 'source-code-find-prev'],
        styles: { marginRight: '2px', padding: '0 4px', fontSize: '0.9em', cursor: 'pointer' }
    });
    setElement('findPrevButton', prevButtonEl);
    prevButtonEl.addEventListener('click', () => navigateToSearchMatch('prev'));

    const nextButtonEl = domUtils.createElement('button', { 
        textContent: '↓', 
        classes: ['source-code-find-btn', 'source-code-find-next'],
        styles: { marginRight: '5px', padding: '0 4px', fontSize: '0.9em', cursor: 'pointer' }
    });
    setElement('findNextButton', nextButtonEl);
    nextButtonEl.addEventListener('click', () => navigateToSearchMatch('next'));
    
    const matchCounterEl = domUtils.createElement('span', {
        textContent: '0 of 0',
        classes: ['source-code-find-counter'],
        styles: { 
            fontSize: '0.9em', 
            color: '#bbb',
            whiteSpace: 'nowrap',
            marginRight: '5px'
        }
    });
    setElement('findCounter', matchCounterEl);

    const clearButtonEl = domUtils.createElement('button', {
        textContent: 'Clear',
        classes: ['source-code-find-btn', 'source-code-find-clear'],
        attributes: { title: 'Clear search' },
        styles: { 
            marginLeft: '5px', 
            padding: '0 6px',
            fontSize: '0.9em', 
            cursor: 'pointer' 
        }
    });
    setElement('findClearButton', clearButtonEl);
    clearButtonEl.addEventListener('click', () => {
        clearSearchHighlights(); 
        if (elements.findInput) {
            elements.findInput.value = '';
        }
        // elements.findInput?.focus(); 
    });

    findBar.appendChild(findLabel);
    findBar.appendChild(findInputEl);
    findBar.appendChild(prevButtonEl);
    findBar.appendChild(nextButtonEl);
    findBar.appendChild(matchCounterEl);
    findBar.appendChild(clearButtonEl);

    return findBar;
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
    originalCodeContentHTML = ''; 
    clearSearchHighlights(); 
    updateState({ searchTerm: '' });

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

    // --- Create Top Row (Title + Find Bar) ---
    const topRowContainer = domUtils.createElement('div', {
        styles: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: `${CONSTANTS.SIZES.HEADER_HEIGHT}px`,
            borderBottom: '1px solid #444',
            backgroundColor: '#272822', // Background for the whole top row
            paddingLeft: '10px', // Padding for the title part
            boxSizing: 'border-box',
            flexShrink: '0'
        }
    });

    let pathSegments = elementInfo.sourceFile.split('/').filter(part => part.length > 0);
    let fileNameAndLineNumber = pathSegments.pop() || elementInfo.sourceFile;
    const arrowSpan = '<span style="font-size: 10px; margin: 0 4px;"> ▶ </span>';
    let formattedPath = pathSegments.join(arrowSpan);
    const headerColor = state.elementHighlighting ? '#8fce00' : '#FF8C00';

    const titleDiv = domUtils.createElement('div', {
        // Use a class if more complex styling is needed, or rely on parent flex properties
        innerHTML: formattedPath ?
            `/ ${formattedPath}${arrowSpan}<strong style="margin-left: 2px; color: ${headerColor};">${fileNameAndLineNumber}::${elementInfo.sourceLine}</strong>` :
            `/ <strong style="color: ${headerColor};">${fileNameAndLineNumber}::${elementInfo.sourceLine}</strong>`,
        styles: {
            flexGrow: '1',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '14px', // From old .source-code-header
            // No padding here, it's on topRowContainer now for the left side
        }
    });

    const findBar = createFindBar();
    // Adjust findBar styles for integration into the top row
    findBar.style.flexBasis = '25%';
    findBar.style.flexShrink = '0';
    findBar.style.flexGrow = '0';
    findBar.style.height = '100%'; // Make it fill the topRowContainer height
    findBar.style.borderBottom = 'none'; // Remove its own border
    findBar.style.backgroundColor = 'transparent'; // Inherit from topRowContainer
    // Ensure internal padding of findBar is still respected and items centered
    findBar.style.padding = '0 6px'; // Keep its horizontal padding
    // findBar already has display:flex, align-items:center for its own children

    topRowContainer.appendChild(titleDiv);
    topRowContainer.appendChild(findBar);
    // --- End Create Top Row ---

    const codeContainer = domUtils.createElement('div', {
        classes: ['source-code-content'], // This will be a flex item
        styles: { 
            flexGrow: '1', // Takes remaining space
            overflowY: 'auto',
            overflowX: 'auto',
            padding: '10px',
            boxSizing: 'border-box',
            // Remove position:absolute and top/left/right/bottom
        }
    });
    const preBlock = prepareSourceCodeDisplay(fileContent, elementInfo);
    codeContainer.appendChild(preBlock);

    // Store reference to the code container for search
    setElement('sourceCodeContentContainer', codeContainer);
    // Store the initial HTML of the code block for restoring after search highlighting
    const codeElement = preBlock.querySelector('code');
    if (codeElement) {
        originalCodeContentHTML = codeElement.innerHTML;
    }

    // Add click listener to codeContainer to update lastClickedSourceLine
    codeContainer.addEventListener('click', (event) => {
        let target = event.target;
        while (target && target !== codeContainer) {
            // Assuming each line is a direct child span of the <code> element, or has a clear marker.
            // The structure from prepareSourceCodeDisplay is <span style="display: block;">LINE_NUM: CODE</span>
            if (target.tagName === 'SPAN' && target.style.display === 'block' && target.parentElement.tagName === 'CODE') {
                const textContent = target.textContent || '';
                const match = textContent.match(/^(\d+):/);
                if (match && match[1]) {
                    const lineNumber = parseInt(match[1], 10);
                    if (!isNaN(lineNumber)) {
                        logger.log('info', `Code line clicked: ${lineNumber}`);
                        updateState({ lastClickedSourceLine: lineNumber });
                        // Optional: Clear current search index to make next/prev relative to click
                        // updateState({ currentSearchIndex: -1 }); 
                    }
                }
                break; 
            }
            target = target.parentElement;
        }
    });

    elements.panel.appendChild(topRowContainer);
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