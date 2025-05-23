// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/core/sourceDiscovery.js
import { CONSTANTS } from '../constants.js';
import { logger } from '../utils/logger.js';
import { state, updateState, elements } from '../state.js';
import { buildFileTree } from '../features/fileTree/fileTreeBuilder.js';
import { renderFileTree } from '../features/fileTree/fileTreeRenderer.js';
import { debounce } from '../utils/helpers.js';

export async function fetchSourceCode(path) {
    if (!path) { logger.log('warn', 'SourceDiscovery: fetchSourceCode called with no path.'); return null; }
    const url = `${CONSTANTS.URLS.BASE_API_URL}${path}`;
    logger.log('info', `SourceDiscovery: Fetching source code from: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) { logger.log('error', `SourceDiscovery: HTTP error fetching ${path}! Status: ${response.status} ${response.statusText}`); return null; }
        const text = await response.text();
        logger.log('debug', `SourceDiscovery: Fetched content for ${path} (length: ${text.length})`);
        return text;
    } catch (error) { logger.log('error', `SourceDiscovery: Error fetching source code for ${path}: ${error.message}`); console.error(error); return null; }
}

export function scanForSourceFilesOnPage() {
    logger.log('DEBUG_STATE', `SourceDiscovery - START OF scanForSourceFilesOnPage: elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`);
    if (!state.extensionEnabled) {
        logger.log('debug', 'SourceDiscovery: scanForSourceFilesOnPage - Extension not enabled, skipping scan.');
        return;
    }
    if (state.viewMode === 'domhierarchy' && !state.isRefreshingHierarchy) { // isRefreshingHierarchy is hypothetical
        logger.log('debug', 'SourceDiscovery: In DOM hierarchy view and not refreshing, skipping file scan.');
        return;
    }
    logger.log('info', `SourceDiscovery: Scanning page for source files... Current URL: ${location.href}`);
    try {
        const filePathMap = {};
        const elementsWithSource = document.querySelectorAll('[data-source-file]');
        logger.log('debug', `SourceDiscovery: Found ${elementsWithSource.length} elements with data-source-file attribute (via querySelectorAll).`);
        elementsWithSource.forEach(element => {
            const sourceFile = element.getAttribute('data-source-file');
            const sourceLine = element.getAttribute('data-source-line');
            if (sourceFile && sourceLine) {
                if (!filePathMap[sourceFile]) { filePathMap[sourceFile] = []; }
                if (!filePathMap[sourceFile].includes(sourceLine)) { filePathMap[sourceFile].push(sourceLine); }
            }
        });
        logger.log('debug', `SourceDiscovery: Scan via querySelectorAll complete. Found ${Object.keys(filePathMap).length} unique files so far.`);
        try {
            const pageHtml = document.documentElement.outerHTML;
            const dataSourceMatches = pageHtml.matchAll(/data-source-file=["']([^"']+)["']\s+data-source-line=["']([^"']+)["']/g);
            let rawHtmlMatchesCount = 0; let newFilesFromRawHtml = 0;
            for (const match of dataSourceMatches) {
                rawHtmlMatchesCount++;
                const filePath = match[1]; const line = match[2];
                if (filePath && line) {
                    if (!filePathMap[filePath]) { filePathMap[filePath] = []; newFilesFromRawHtml++; }
                    if (!filePathMap[filePath].includes(line)) { filePathMap[filePath].push(line); }
                }
            }
            logger.log('debug', `SourceDiscovery: Scanned raw HTML. Found ${rawHtmlMatchesCount} total data-source attribute pairs. Added ${newFilesFromRawHtml} new unique files.`);
        } catch (e) { logger.log('warn', `SourceDiscovery: Error scanning raw HTML for data-source attributes: ${e.message}`); }

        if (Object.keys(filePathMap).length > 0) {
            logger.log('info', `SourceDiscovery: Found ${Object.keys(filePathMap).length} unique source files after all scan methods.`);
            const treeData = buildFileTree(filePathMap);
            if (Object.keys(treeData).length !== Object.keys(state.fileTree).length || JSON.stringify(treeData) !== JSON.stringify(state.fileTree)) {
                logger.log('debug', 'SourceDiscovery: File tree data has changed or is new. Updating state and re-rendering.');
                updateState({ fileTree: treeData, originalFileTree: { ...treeData } }); // originalFileTree might be removed if DOM view is gone
                renderFileTree();
            } else { logger.log('debug', 'SourceDiscovery: File tree data is unchanged. Skipping state update and re-render.'); }
        } else {
            logger.log('info', 'SourceDiscovery: No source files found on the page after all scan methods.');
            if (Object.keys(state.fileTree).length > 0) { updateState({ fileTree: {}, originalFileTree: {} }); renderFileTree(); }
        }
    } catch (error) {
        logger.log('error', `SourceDiscovery: Error during source file scanning: ${error.message}`);
        console.error(error);
        if (Object.keys(state.fileTree).length > 0) { updateState({ fileTree: {}, originalFileTree: {} }); renderFileTree(); }
    }
    logger.log('DEBUG_STATE', `SourceDiscovery - END OF scanForSourceFilesOnPage: elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`);
}

export const debouncedScanForSourceFiles = debounce(() => {
    logger.log('DEBUG_STATE', `SourceDiscovery - START OF debouncedScan (actual call): elements.panel is ${elements.panel ? elements.panel.id : 'NULL'}`);
    logger.log('info', `SourceDiscovery: DEBOUNCED scan executing NOW. Current URL: ${location.href}. Extension enabled: ${state.extensionEnabled}`);
    if (!state.extensionEnabled) { logger.log('debug', 'SourceDiscovery: DEBOUNCED scan skipped, extension not enabled.'); return; }
    scanForSourceFilesOnPage();
}, 500);