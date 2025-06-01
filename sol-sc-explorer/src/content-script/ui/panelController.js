// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/ui/panelController.js
import { CONSTANTS } from '../constants.js';
import { state, elements, setElement, updateState } from '../state.js';
import { domUtils } from '../utils/dom.js';
import { logger } from '../utils/logger.js';
import { escapeHtml } from '../utils/helpers.js';
import { renderFileTree } from '../features/fileTree/fileTreeRenderer.js';

// Search functionality globals (within this module)
let originalCodeContentHTML = ''; // To restore content when clearing search

// AI Chat Tab specific elements - to manage their visibility and content
let aiChatApiKeyInput = null;
let aiChatVerifyButton = null;
let aiChatStatusMessage = null;
let aiChatVpnNote = null;
let aiChatMainContainer = null; // The main container for the AI chat tab
let aiChatInteractionContainer = null; // Will hold prompt input and chat history after verification
let aiChatPromptTextarea = null;
let aiChatSendButton = null;
let aiChatHistoryContainer = null;
let verifiedApiKey = null; // Stores the API key after successful verification
let loadedUserApiKeyFromStorage = null; // To store key from localStorage without displaying it
let aiChatApiKeyLabel = null; // Reference to the API key label
let aiChatContextFileDisplay = null; // Span to show "about [filename]"
let aiChatIncludeFileCheckbox = null; // Checkbox to include file content
let aiChatClearButton = null; // Button to clear chat history
let aiChatModelApiInput = null; // Input for MODEL_API
let aiChatModelApiLabel = null; // Label for MODEL_API input
let aiChatSettingsButton = null; // Button to show API/Endpoint settings
let aiChatSessionInitialized = false; // Tracks if the current chat session has shown its initial success message

const DEFAULT_MODEL_API = "https://mistral-7b-instruct-v0-3--apicast-staging.apps.int.stc.ai.prod.us-east-1.aws.paas.redhat.com:443";
const MODEL_ID_CONST = "/data/Mistral-7B-Instruct-v0.3"; // Stays constant for now

// Make this function exportable so it can be called from initializer.js for SPA navigations
export async function handleRightPanelTabClick(tabName) {
    // Simplified: if already active, do nothing.
    if (state.activeRightPanelTab === tabName && tabName !== 'aiChat') { // Always rerender aiChat for context updates for now
        return;
    }
    logger.log('info', `PanelController: Tab clicked - ${tabName}.`);
    updateState({ activeRightPanelTab: tabName });

    const tabButtons = elements.rightPanelContainer?.querySelectorAll('.right-panel-tab-button');
    tabButtons?.forEach(btn => {
        const isActive = btn.dataset.tabName === tabName;
        btn.classList.toggle('active', isActive);
        if (isActive) {
            btn.style.backgroundColor = '#3a3a3a'; // Active tab background
            btn.style.color = '#fff';
            btn.style.borderBottomColor = CONSTANTS.CLASSES.TREE_FILE_SELECTED;
        } else {
            btn.style.backgroundColor = 'transparent'; // Inactive tab background
            btn.style.color = '#ccc';
            btn.style.borderBottomColor = 'transparent';
        }
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
            renderAIChatTabContent(elements.rightPanelContentArea);
            updateAIChatContextUI(); // Update context when tab is clicked
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
    // Ensure File Tree is the default active tab when panels are initialized
    updateState({ activeRightPanelTab: 'fileTree' });

    // logger.log('debug', `PANEL_CTRL: initializeMainPanels called. elements.panel exists? ${elements.panel ? 'Yes' : 'No'}. In DOM? ${elements.panel && document.body.contains(elements.panel) ? 'Yes' : 'No'}`); // To be removed
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
                styles: { 
                    padding: '0 10px', 
                    background: 'transparent', // Default inactive background
                    border: 'none', 
                    color: '#ccc', // Default inactive color
                    cursor: 'pointer', 
                    borderBottom: '2px solid transparent', // Default inactive bottom border
                    fontSize: '13px', 
                    outline: 'none',
                    height: '100%', // Fill header height
                    borderTopLeftRadius: '5px', // Rounded top corners
                    borderTopRightRadius: '5px' // Rounded top corners
                },
                eventListeners: { click: () => handleRightPanelTabClick(tabInfo.name) }
            });
            if (tabInfo.name === state.activeRightPanelTab) { // Initial active tab styles
                tabButton.classList.add('active');
                tabButton.style.backgroundColor = '#3a3a3a'; // Active tab background
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
    // logger.log('debug', `PANEL_CTRL: hideAllPanels called.`); // To be removed
    if (elements.panel) {
        // logger.log('debug', `PANEL_CTRL: Hiding panel with ID: ${elements.panel.id}`); // To be removed
        domUtils.setElementVisibility(elements.panel, false);
    }
    if (elements.rightPanelContainer) {
        // logger.log('debug', `PANEL_CTRL: Hiding rightPanelContainer with ID: ${elements.rightPanelContainer.id}`); // To be removed
        domUtils.setElementVisibility(elements.rightPanelContainer, false);
    }
    if (elements.resizeHandle) {
        // logger.log('debug', `PANEL_CTRL: Hiding resizeHandle with ID: ${elements.resizeHandle.id}`); // To be removed
        domUtils.setElementVisibility(elements.resizeHandle, false);
    }
    if (elements.horizontalResizeHandle) {
        // logger.log('debug', `PANEL_CTRL: Hiding horizontalResizeHandle with ID: ${elements.horizontalResizeHandle.id}`); // To be removed
        domUtils.setElementVisibility(elements.horizontalResizeHandle, false);
    }
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

    // Update AI Chat context state
    if (elementInfo && elementInfo.sourceFile && typeof fileContent === 'string') {
        updateState({
            currentSourceCodePathForAIChat: elementInfo.sourceFile,
            currentSourceCodeContentForAIChat: fileContent
        });
    } else {
        updateState({ // Clear context if file is invalid or not loaded
            currentSourceCodePathForAIChat: null,
            currentSourceCodeContentForAIChat: null
        });
    }

    // Update the AI Chat context UI if the tab is active or generally (it checks internally)
    updateAIChatContextUI();
}

export function updateRightPanelHeader(title) { 
    // This function is mostly managed by individual tab renderers now.
}

async function verifyLLMAccess(apiKey, modelApiUrl, statusElement, apiKeyLabelElement) {
    // const MODEL_API = "https://mistral-7b-instruct-v0-3--apicast-staging.apps.int.stc.ai.prod.us-east-1.aws.paas.redhat.com:443";
    // const MODEL_ID = "/data/Mistral-7B-Instruct-v0.3";
    
    statusElement.textContent = 'Verifying...';
    statusElement.style.color = '#ccc';

    try {
        const requestBody = {
            model: MODEL_ID_CONST,
            prompt: "Hello", // Simple prompt for verification
            max_tokens: 10,
            temperature: 0
        };

        const response = await fetch(`${modelApiUrl}/v1/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();

        if (response.ok) {
            if (responseData.choices && responseData.choices.length > 0) {
                // statusElement.textContent = `Successfully connected to ${MODEL_API_CONST}`; // No longer setting success here
                // statusElement.style.color = '#8fce00'; // Green for success
                logger.log('info', 'AI Chat API Verification: Success');
                verifiedApiKey = apiKey; // Store the key
                localStorage.setItem('aiChatUserApiKey', apiKey); // Persist API Key
                localStorage.setItem('aiChatModelApiUrl', modelApiUrl); // Persist Model API URL

                // Hide initial verification UI elements for API Key
                if (aiChatApiKeyInput) aiChatApiKeyInput.style.display = 'none';
                if (apiKeyLabelElement) apiKeyLabelElement.style.display = 'none'; 
                // Hide MODEL_API input and label as well
                if (aiChatModelApiInput) aiChatModelApiInput.style.display = 'none';
                if (aiChatModelApiLabel) aiChatModelApiLabel.style.display = 'none';

                // Verify button and VPN note are hidden by controlling their parent or individually
                if (aiChatVerifyButton) aiChatVerifyButton.style.display = 'none';
                if (aiChatVpnNote) aiChatVpnNote.style.display = 'none';

                // Setup the chat interface
                if (aiChatMainContainer) { 
                    aiChatSessionInitialized = false; // Reset for a fresh session message
                    setupChatInterface(aiChatMainContainer); 
                    // The success message is now added by the logic in renderAIChatTabContent after setup,
                    // based on aiChatSessionInitialized being false.
                    // appendMessageToChatHistory(`Successfully connected to ${modelApiUrl}`, 'system-success'); 
                    // Call renderAIChatTabContent to trigger the display logic including the session init message
                    // This seems a bit circular. Let verifyLLMAccess handle its own success message display then set initialized.
                    
                    // Simpler: set initialized and add message here directly for this new verification.
                    const currentModelApi = localStorage.getItem('aiChatModelApiUrl') || DEFAULT_MODEL_API; // use the just verified one
                    appendMessageToChatHistory(`Successfully connected to ${modelApiUrl}`, 'system-success');
                    aiChatSessionInitialized = true;
                    updateAIChatContextUI(); 
                    if (statusElement) statusElement.style.display = 'none'; // Ensure initial status is hidden
                }

            } else {
                statusElement.textContent = 'Verification Succeeded, but response format unexpected.';
                statusElement.style.color = '#FF8C00'; // Orange for warning
                logger.log('warn', `AI Chat API Verification: Unexpected response format: ${JSON.stringify(responseData)}`);
            }
        } else {
            let errorMessage = `Failed: HTTP ${response.status} - ${response.statusText}`;
            if (responseData && responseData.error && responseData.error.message) {
                errorMessage += ` - ${responseData.error.message}`;
            } else if (responseData && typeof responseData === 'string') {
                errorMessage += ` - ${responseData}`;
            } else if (responseData && responseData.detail) {
                 errorMessage += ` - ${responseData.detail}`;
            }
             else {
                const textResponse = await response.text(); // try to get raw text
                errorMessage += ` - Server response: ${textResponse.substring(0, 200)}`; // Show first 200 chars
            }
            statusElement.textContent = errorMessage;
            statusElement.style.color = '#ff4d4d'; // Red for error
            logger.log('error', `AI Chat API Verification: ${errorMessage} (Full Response: ${JSON.stringify(responseData)})`);
        }
    } catch (error) {
        let errorMessage = `Failed: ${error.message}`;
        if (error.cause) { // Fetch often includes a 'cause' for network errors
           errorMessage += ` (Cause: ${String(error.cause).substring(0,100)})`;
        }
        statusElement.textContent = errorMessage;
        statusElement.style.color = '#ff4d4d'; // Red for error
        logger.log('error', `AI Chat API Verification: Exception - ${error.message}`, error);
    }
}

function renderAIChatTabContent(container) {
    if (!container) {
        logger.log('error', 'AI Chat: Container not provided for rendering.');
        return;
    }
    aiChatMainContainer = container; // Store reference to the main container
    // container.innerHTML = ''; // DO NOT Clear previous content immediately
    // container.style.padding = '15px'; // These will be set if rendering inputs
    // container.style.display = 'flex';
    // container.style.flexDirection = 'column';
    // container.style.gap = '10px';

    // Check if already verified in this session
    if (verifiedApiKey) {
        logger.log('info', 'AI Chat: Already verified, ensuring chat interface is visible.');
        
        if (aiChatInteractionContainer && !container.contains(aiChatInteractionContainer)) {
            logger.log('debug', 'AI Chat: Interaction container exists but not in DOM, re-appending.');
            container.innerHTML = ''; 
            container.appendChild(aiChatInteractionContainer);
        } else if (!aiChatInteractionContainer) {
            logger.log('debug', 'AI Chat: Interaction container does NOT exist, setting up fresh.');
            container.innerHTML = ''; 
            setupChatInterface(container); 
            // Initial success message is now tied to aiChatSessionInitialized logic below or in verifyLLMAccess
        }
        if (aiChatInteractionContainer) {
            aiChatInteractionContainer.style.display = 'flex'; 
            if (!aiChatSessionInitialized) { // Only add success message if session hasn't been initialized yet
                logger.log('debug', 'AI Chat: Session not initialized, adding welcome message.');
                const currentModelApi = localStorage.getItem('aiChatModelApiUrl') || DEFAULT_MODEL_API;
                appendMessageToChatHistory(`Successfully connected to ${currentModelApi}`, 'system-success');
                aiChatSessionInitialized = true; // Mark session as initialized
            } else if (aiChatHistoryContainer && aiChatHistoryContainer.children.length === 0) {
                // If session IS initialized but history is blank (e.g. after clear), do nothing here.
                // The clear button handles this or leaves it blank.
                logger.log('debug', 'AI Chat: Session initialized and history is empty (likely cleared), not re-adding success message.');
            }
        } else {
            logger.log('error', 'AI Chat: Verified, but no interaction container found. Re-rendering inputs as fallback.');
            verifiedApiKey = null; 
            aiChatSessionInitialized = false; // Reset session state too
        }
        
        if (verifiedApiKey) { // Re-check because of fallback
            updateAIChatContextUI(); 
            return; // Skip rendering input fields
        }
    }

    // --- If not verified (or verification was reset), render input fields ---
    logger.log('info', 'AI Chat: Not verified (or reset), rendering API key input fields.');
    container.innerHTML = ''; // Clear previous content fully before rendering inputs
    container.style.padding = '15px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    // Label and Input for API Key
    const apiKeyLabelEl = domUtils.createElement('label', {
        textContent: 'MODELS_CORP_USER_KEY: ',
        styles: { display: 'block', marginBottom: '5px', color: '#ccc' }
    });
    aiChatApiKeyLabel = apiKeyLabelEl; // Store reference to the label

    const apiKeyInput = domUtils.createElement('input', {
        attributes: { type: 'text', placeholder: '' }, // 1. do not show place holder api id example
        styles: { 
            width: '100%', 
            padding: '8px', 
            boxSizing: 'border-box',
            backgroundColor: '#272822',
            border: '1px solid #555',
            color: '#F8F8F2',
            marginBottom: '10px'
        }
    });
    // Retrieve stored API key if available (optional, good for UX)
    const storedApiKey = localStorage.getItem('aiChatUserApiKey');
    if (storedApiKey) {
        // apiKeyInput.value = storedApiKey; // Issue 1: Do not show API Key
        loadedUserApiKeyFromStorage = storedApiKey; // Store internally
    }
    apiKeyInput.value = ''; // Ensure input field is always visually blank
    aiChatApiKeyInput = apiKeyInput; // Store reference

    // Label and Input for MODEL_API URL
    const modelApiLabelEl = domUtils.createElement('label', {
        textContent: 'MODEL_API URL: ',
        styles: { display: 'block', marginBottom: '5px', marginTop: '10px', color: '#ccc' }
    });
    aiChatModelApiLabel = modelApiLabelEl; // Store reference to the MODEL_API label

    aiChatModelApiInput = domUtils.createElement('input', {
        attributes: { type: 'text' },
        styles: { 
            width: '100%', 
            padding: '8px', 
            boxSizing: 'border-box',
            backgroundColor: '#272822',
            border: '1px solid #555',
            color: '#F8F8F2',
            marginBottom: '10px'
        }
    });
    const storedModelApiUrl = localStorage.getItem('aiChatModelApiUrl') || DEFAULT_MODEL_API;
    aiChatModelApiInput.value = storedModelApiUrl;

    // Verify Button
    const verifyButton = domUtils.createElement('button', {
        textContent: 'Verify Key',
        styles: { 
            padding: '10px 15px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            alignSelf: 'flex-start'
        }
    });
    aiChatVerifyButton = verifyButton; // Store reference

    // Status Message Area
    const statusMessage = domUtils.createElement('div', {
        textContent: 'Enter your API key and click Verify.',
        styles: { 
            marginTop: '10px', 
            padding: '10px',
            border: '1px solid transparent',
            borderRadius: '4px',
            color: '#aaa' // Default color
        }
    });
    aiChatStatusMessage = statusMessage; // Store reference

    // Event Listener for Verify Button
    verifyButton.addEventListener('click', () => {
        let userKeyToVerify = apiKeyInput.value.trim(); // Key typed by user
        const modelApiToVerify = aiChatModelApiInput.value.trim();

        if (!userKeyToVerify && loadedUserApiKeyFromStorage) { // If input is blank, try using the loaded key
            userKeyToVerify = loadedUserApiKeyFromStorage;
            logger.log('info', 'AI Chat: Using stored API key for verification as input was blank.');
        }
        
        if (!modelApiToVerify) {
            statusMessage.textContent = 'Please enter a MODEL_API URL.';
            statusMessage.style.color = '#ff4d4d';
            return;
        }

        if (userKeyToVerify) {
            // localStorage.setItem('aiChatUserApiKey', userKeyToVerify); // Moved to verifyLLMAccess on success
            // localStorage.setItem('aiChatModelApiUrl', modelApiToVerify); // Moved to verifyLLMAccess on success
            loadedUserApiKeyFromStorage = userKeyToVerify; // Update the internally stored key for immediate re-use if verify fails then succeeds
            verifyLLMAccess(userKeyToVerify, modelApiToVerify, statusMessage, aiChatApiKeyLabel); 
        } else {
            statusMessage.textContent = 'Please enter an API key.';
            statusMessage.style.color = '#ff4d4d'; // Red for error
        }
    });
    
    // Mouse hover effects for button
    verifyButton.addEventListener('mouseenter', () => verifyButton.style.backgroundColor = '#0056b3');
    verifyButton.addEventListener('mouseleave', () => verifyButton.style.backgroundColor = '#007bff');

    container.appendChild(apiKeyLabelEl); 
    container.appendChild(aiChatApiKeyInput);
    container.appendChild(aiChatModelApiLabel); // Use stored reference
    container.appendChild(aiChatModelApiInput);
    container.appendChild(verifyButton);
    container.appendChild(statusMessage);

    // 2. Under "Enter your API key and click Verify" pls add a new line: "* Must be logged into the RH VPN"
    const vpnNote = domUtils.createElement('div', {
        textContent: '* Must be logged into the RH VPN',
        styles: {
            marginTop: '5px',
            fontSize: '0.9em',
            color: '#aaa'
        }
    });
    aiChatVpnNote = vpnNote; // Store reference
    container.appendChild(vpnNote);

    logger.log('info', 'AI Chat tab content rendered.');
}

function setupChatInterface(container) { // No successMessageElement needed
    // This container will hold the chat history and the prompt input area
    if (!aiChatInteractionContainer) { // Create only if it doesn't exist
        aiChatInteractionContainer = domUtils.createElement('div', {
            styles: {
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100% - 40px)', // Adjust if successMessageElement has variable height
                marginTop: '2px' // Space below the success message
            }
        });

        // Chat History Header (with Clear Button) - MOVED HERE
        const chatHistoryHeader = domUtils.createElement('div', {
            styles: {
                display: 'flex',
                justifyContent: 'flex-end', // Align clear button to the right
                alignItems: 'center',
                padding: '2px 5px', // Reduced padding for a tighter header if only gear is present
                borderBottom: '1px solid #444', // Separator from history
                backgroundColor: '#252526', // Slightly different from history for distinction
                minHeight: '28px', // Ensure a minimum height for the header bar
                boxSizing: 'border-box'
            }
        });

        aiChatSettingsButton = domUtils.createElement('button', {
            textContent: '⚙️', // Gear icon for settings
            attributes: { title: 'Show API Key and Endpoint Settings' },
            styles: {
                background: 'none',
                border: 'none', // Can be styled more like an icon button
                color: '#ccc',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1.2em', // Make gear a bit larger
                lineHeight: '1', // Adjust line height for better vertical alignment if needed
                margin: '0' // Ensure no extra margins on the button itself
            }
        });
        aiChatSettingsButton.addEventListener('click', handleAIChatSettingsClick);
        aiChatSettingsButton.addEventListener('mouseenter', () => { 
            aiChatSettingsButton.style.color = '#fff'; 
        });
        aiChatSettingsButton.addEventListener('mouseleave', () => { 
            aiChatSettingsButton.style.color = '#ccc'; 
        });
        chatHistoryHeader.appendChild(aiChatSettingsButton); // Add settings button to header

        // Prepend header to interaction container first
        aiChatInteractionContainer.appendChild(chatHistoryHeader);

        // Chat History Area
        aiChatHistoryContainer = domUtils.createElement('div', {
            classes: ['ai-chat-history'],
            styles: {
                flexGrow: '1',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #444',
                marginBottom: '10px',
                backgroundColor: '#1e1e1e',
                color: '#ccc',
                minHeight: '100px' // Ensure it has some height
            }
        });

        // Prompt Input Area (container for label, textarea, and button)
        const promptAreaContainer = domUtils.createElement('div', {
            styles: {
                display: 'flex',
                flexDirection: 'column',
                flexShrink: '0' // Prevent shrinking
            }
        });
        
        const promptLabelLine = domUtils.createElement('div', {
            styles: {
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '5px'
            }
        });
        
        const promptLabel = domUtils.createElement('label', {
            textContent: 'Ask me anything....',
            styles: { 
                color: '#ccc',
                fontSize: '1.0em', // Increased size
                fontWeight: 'bold'   // Make it bold
            }
        });

        aiChatIncludeFileCheckbox = domUtils.createElement('input', {
            attributes: { type: 'checkbox', id: 'aiChatIncludeFileCheckbox' },
            styles: {
                width: '16px', // Standard checkbox size
                height: '16px',
                margin: '0', // Remove default margins
                cursor: 'pointer'
            }
        });

        aiChatContextFileDisplay = domUtils.createElement('span', {
            textContent: '', // Initially empty
            styles: {
                color: '#aaa',
                fontSize: '0.95em', // Slightly increased size, adjust as needed
                fontStyle: 'italic'
            }
        });

        promptLabelLine.appendChild(promptLabel);
        promptLabelLine.appendChild(aiChatIncludeFileCheckbox);
        promptLabelLine.appendChild(aiChatContextFileDisplay);

        const promptInputControlsRow = domUtils.createElement('div', {
            styles: {
                display: 'flex',
                alignItems: 'flex-end', // Align items to the bottom (good for textarea and buttons)
                gap: '5px'
            }
        });

        aiChatPromptTextarea = domUtils.createElement('textarea', {
            attributes: { rows: '3', placeholder: 'Type your message...' },
            styles: {
                flexGrow: '1',
                padding: '8px',
                boxSizing: 'border-box',
                backgroundColor: '#272822',
                border: '1px solid #555',
                color: '#F8F8F2',
                resize: 'none' // Can be 'vertical' if preferred
            }
        });
        aiChatPromptTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt();
            }
        });

        const actionButtonsContainer = domUtils.createElement('div', {
            styles: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: '10px',
                marginTop: '5px'
            }
        });

        aiChatClearButton = domUtils.createElement('button', { 
            textContent: '🗑️',
            attributes: { title: 'Clicking this clears the chat history' }
        });
        // Explicitly setting styles property by property
        aiChatClearButton.style.padding = '0px';
        aiChatClearButton.style.width = '36px';
        aiChatClearButton.style.height = 'auto';
        aiChatClearButton.style.minHeight = '28px';
        aiChatClearButton.style.lineHeight = '28px';
        aiChatClearButton.style.textAlign = 'center';
        aiChatClearButton.style.fontSize = '16px';
        aiChatClearButton.style.backgroundColor = '#555';
        aiChatClearButton.style.color = '#ccc';
        aiChatClearButton.style.border = '1px solid #666';
        aiChatClearButton.style.borderRadius = '4px';
        aiChatClearButton.style.cursor = 'pointer';
        aiChatClearButton.style.flexShrink = '0';

        aiChatSendButton = domUtils.createElement('button', { 
            textContent: '↑',
            attributes: { title: 'Send message' }
        });
        // Explicitly setting styles property by property
        aiChatSendButton.style.padding = '0px';
        aiChatSendButton.style.width = '36px';
        aiChatSendButton.style.height = 'auto';
        aiChatSendButton.style.minHeight = '28px';
        aiChatSendButton.style.lineHeight = '28px';
        aiChatSendButton.style.textAlign = 'center';
        aiChatSendButton.style.fontSize = '18px';
        aiChatSendButton.style.backgroundColor = '#007bff';
        aiChatSendButton.style.color = 'white';
        aiChatSendButton.style.border = 'none';
        aiChatSendButton.style.borderRadius = '4px';
        aiChatSendButton.style.cursor = 'pointer';
        aiChatSendButton.style.flexShrink = '0';

        aiChatClearButton.addEventListener('click', handleClearChat);
        aiChatClearButton.addEventListener('mouseenter', () => { 
            aiChatClearButton.style.backgroundColor = '#666'; 
            aiChatClearButton.style.color = '#fff'; 
        });
        aiChatClearButton.addEventListener('mouseleave', () => { 
            aiChatClearButton.style.backgroundColor = '#555'; 
            aiChatClearButton.style.color = '#ccc'; 
        });

        aiChatSendButton.addEventListener('click', () => handleSendPrompt());
        aiChatSendButton.addEventListener('mouseenter', () => aiChatSendButton.style.backgroundColor = '#0056b3');
        aiChatSendButton.addEventListener('mouseleave', () => aiChatSendButton.style.backgroundColor = '#007bff');

        promptInputControlsRow.appendChild(aiChatPromptTextarea); // Textarea first
        actionButtonsContainer.appendChild(aiChatClearButton);    // Clear button in vertical container
        actionButtonsContainer.appendChild(aiChatSendButton);     // Send button in vertical container
        promptInputControlsRow.appendChild(actionButtonsContainer);  // Append button container below textarea row

        promptAreaContainer.appendChild(promptLabelLine); 
        promptAreaContainer.appendChild(promptInputControlsRow); // Row with just textarea
        
        actionButtonsContainer.appendChild(aiChatClearButton);    // Clear button in vertical container
        actionButtonsContainer.appendChild(aiChatSendButton);     // Send button in vertical container
        promptAreaContainer.appendChild(actionButtonsContainer);  // Append button container below textarea row

        aiChatInteractionContainer.appendChild(aiChatHistoryContainer);
        aiChatInteractionContainer.appendChild(promptAreaContainer);
        container.appendChild(aiChatInteractionContainer);
    }
     // Ensure interaction container is visible if it was previously hidden (e.g. re-verification)
    aiChatInteractionContainer.style.display = 'flex';
}

function handleSendPrompt() { // No successMessageElement needed
    const promptText = aiChatPromptTextarea.value.trim();
    if (!promptText) return;

    let finalPrompt = promptText;

    if (aiChatIncludeFileCheckbox && aiChatIncludeFileCheckbox.checked) {
        if (state.currentSourceCodePathForAIChat && state.currentSourceCodeContentForAIChat) {
            const fileName = state.currentSourceCodePathForAIChat.split('/').pop();
            const fileContextPrefix = 
`Regarding the file "${fileName}" with the following content:\n\`\`\`\n${state.currentSourceCodeContentForAIChat}\n\`\`\`\n\nUser prompt: `;
            finalPrompt = fileContextPrefix + promptText;
            logger.log('info', `AI Chat: Sending prompt with context from ${fileName}`);
        } else {
            logger.log('warn', 'AI Chat: Include file checkbox checked, but no file context available in state.');
        }
    }

    appendMessageToChatHistory(promptText, 'user'); // Display original user prompt in chat
    aiChatPromptTextarea.value = ''; // Clear textarea

    if (verifiedApiKey) {
        sendPromptToLLM(verifiedApiKey, finalPrompt); // Send potentially augmented prompt
    } else {
        appendMessageToChatHistory('Error: API key not verified.', 'error');
        logger.log('error', 'AI Chat: Attempted to send prompt without a verified API key.');
    }
}

function appendMessageToChatHistory(message, senderType) {
    if (!aiChatHistoryContainer) return;

    const messageDiv = domUtils.createElement('div', {
        styles: {
            padding: '8px',
            marginBottom: '8px',
            borderRadius: '4px',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap' // Preserve line breaks from LLM
        }
    });

    if (senderType === 'user') {
        // messageDiv.textContent = `You: ${message}`; // Remove "You: " prefix
        messageDiv.textContent = message;
        messageDiv.style.backgroundColor = '#004080'; // Darker blue for user
        messageDiv.style.textAlign = 'right';
        messageDiv.style.color = '#e0e0e0';
    } else if (senderType === 'llm') {
        // messageDiv.textContent = `LLM: ${message}`; // Remove "LLM: " prefix
        messageDiv.textContent = message;
        messageDiv.style.backgroundColor = '#333'; // Grey for LLM
        messageDiv.style.color = '#f0f0f0';
        messageDiv.style.borderRadius = '4px';
    } else if (senderType === 'llm-status') {
        messageDiv.textContent = message; // e.g., "Thinking..."
        messageDiv.style.fontStyle = 'italic';
        messageDiv.style.color = '#aaa';
        messageDiv.style.backgroundColor = 'transparent';
        messageDiv.id = 'llm-thinking-message'; // ID to easily find and remove/update
    } else if (senderType === 'error') {
        messageDiv.textContent = `Error: ${message}`;
        messageDiv.style.backgroundColor = '#5c2323'; // Dark red for error
        messageDiv.style.color = '#ffcccc';
    }
    // New senderType for system messages like successful connection
    else if (senderType === 'system-success') {
        messageDiv.textContent = message;
        messageDiv.style.color = '#8fce00'; // Green
        messageDiv.style.padding = '10px'; // A bit more padding
        messageDiv.style.textAlign = 'center';
        messageDiv.style.backgroundColor = '#2a3a2a'; // Dark green background
        messageDiv.style.border = '1px solid #3a5a3a';
        messageDiv.style.borderRadius = '4px';

    }

    aiChatHistoryContainer.appendChild(messageDiv);
    aiChatHistoryContainer.scrollTop = aiChatHistoryContainer.scrollHeight; // Scroll to bottom
}

async function sendPromptToLLM(apiKey, prompt) {
    appendMessageToChatHistory('Thinking...', 'llm-status');
    const modelApiUrlToUse = localStorage.getItem('aiChatModelApiUrl') || DEFAULT_MODEL_API;

    try {
        const requestBody = {
            model: MODEL_ID_CONST,
            prompt: prompt,
            max_tokens: 1000, // Increased max_tokens for more complete responses
            temperature: 0.7 // Typical temperature for chat
        };

        const response = await fetch(`${modelApiUrlToUse}/v1/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        // Remove "Thinking..." message
        const thinkingMessage = aiChatHistoryContainer?.querySelector('#llm-thinking-message');
        if (thinkingMessage) thinkingMessage.remove();

        const responseData = await response.json();

        if (response.ok) {
            if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].text) {
                appendMessageToChatHistory(responseData.choices[0].text.trim(), 'llm');
                logger.log('info', 'AI Chat: LLM Response received.');
            } else {
                appendMessageToChatHistory('Received an empty or unexpected response from LLM.', 'error');
                logger.log('warn', `AI Chat: LLM response format unexpected: ${JSON.stringify(responseData)}`);
            }
        } else {
            let errorMessage = `HTTP ${response.status} - ${response.statusText}`;
            if (responseData && responseData.error && responseData.error.message) {
                errorMessage += ` - ${responseData.error.message}`;
            } else if (responseData && typeof responseData === 'string') {
                errorMessage += ` - ${responseData}`;
            } else if (responseData && responseData.detail) {
                 errorMessage += ` - ${responseData.detail}`;
            } else {
                const textResponse = await response.text();
                errorMessage += ` - Server response: ${textResponse.substring(0, 200)}`;
            }
            appendMessageToChatHistory(errorMessage, 'error');
            logger.log('error', `AI Chat: LLM API Error - ${errorMessage} (Full Response: ${JSON.stringify(responseData)})`);
        }
    } catch (error) {
        const thinkingMessage = aiChatHistoryContainer?.querySelector('#llm-thinking-message');
        if (thinkingMessage) thinkingMessage.remove();
        
        let errorMessage = error.message;
        if (error.cause) {
           errorMessage += ` (Cause: ${String(error.cause).substring(0,100)})`;
        }
    }};

function updateAIChatContextUI() {
    if (!aiChatContextFileDisplay || !aiChatIncludeFileCheckbox) {
        // logger.log('debug', 'AI Chat: Context UI elements not ready for update.');
        return;
    }

    if (state.currentSourceCodePathForAIChat) {
        const fileName = state.currentSourceCodePathForAIChat.split('/').pop();
        aiChatContextFileDisplay.textContent = `about ${fileName}`;
        aiChatIncludeFileCheckbox.style.display = 'inline-block';
        aiChatContextFileDisplay.style.display = 'inline';
    } else {
        aiChatContextFileDisplay.textContent = '';
        aiChatIncludeFileCheckbox.style.display = 'none';
        aiChatContextFileDisplay.style.display = 'none';
        aiChatIncludeFileCheckbox.checked = false; 
    }
    // logger.log('debug', `AI Chat: Context UI updated. Path: ${state.currentSourceCodePathForAIChat}`);
}

function handleClearChat() {
    if (aiChatHistoryContainer) {
        aiChatHistoryContainer.innerHTML = ''; // Clear the visual chat history
        logger.log('info', 'AI Chat: Chat history cleared.');
        // aiChatSessionInitialized remains true; clearing chat doesn't mean the session is no longer valid/initialized.
        // If we want the success message to reappear after clear, then set aiChatSessionInitialized = false here.
        // For now, a clear chat means a blank slate.
    }
}

function handleAIChatSettingsClick() {
    logger.log('info', 'AI Chat: Settings button clicked.');

    // Hide chat interaction area
    if (aiChatInteractionContainer) {
        aiChatInteractionContainer.style.display = 'none';
    }

    // Show initial setup UI elements again
    if (aiChatApiKeyLabel) aiChatApiKeyLabel.style.display = 'block';
    if (aiChatApiKeyInput) {
        aiChatApiKeyInput.style.display = 'block';
        aiChatApiKeyInput.value = ''; // Keep it visually blank
    }
    if (aiChatModelApiLabel) aiChatModelApiLabel.style.display = 'block';
    if (aiChatModelApiInput) {
        aiChatModelApiInput.style.display = 'block';
        const storedModelApiUrl = localStorage.getItem('aiChatModelApiUrl') || DEFAULT_MODEL_API;
        aiChatModelApiInput.value = storedModelApiUrl; // Show current/default API URL
    } 
    if (aiChatVerifyButton) aiChatVerifyButton.style.display = 'block';
    if (aiChatVpnNote) aiChatVpnNote.style.display = 'block';
    if (aiChatStatusMessage) {
        aiChatStatusMessage.textContent = 'Enter your API key and click Verify.'; // Reset status message
        aiChatStatusMessage.style.color = '#aaa';
        aiChatStatusMessage.style.display = 'block';
    }
    // `verifiedApiKey` is NOT cleared here. User might just be changing Model API URL.
    // However, we should reset aiChatSessionInitialized so that if they re-verify,
    // the "Successfully connected" message appears fresh for this "new" session setup.
    aiChatSessionInitialized = false;
}
