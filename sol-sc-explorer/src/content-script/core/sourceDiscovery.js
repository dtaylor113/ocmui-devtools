// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/core/sourceDiscovery.js
import { CONSTANTS } from '../constants.js';
import { logger } from '../utils/logger.js';
import { state, updateState, elements } from '../state.js';
import { buildFileTree } from '../features/fileTree/fileTreeBuilder.js';
import { renderFileTree } from '../features/fileTree/fileTreeRenderer.js';
import { debounce } from '../utils/helpers.js';

export async function fetchSourceCode(path) {
    if (!path) { 
        logger.log('warn', 'SourceDiscovery: fetchSourceCode called with no path.'); 
        return null; 
    }
    const fetchPath = path.startsWith('/') ? path : '/' + path;
    const url = `${CONSTANTS.URLS.BASE_API_URL}${fetchPath}`;
    logger.log('info', `SourceDiscovery: Fetching source for ${fetchPath}`);
    try {
        const response = await fetch(url);
        if (!response.ok) { 
            logger.log('error', `SourceDiscovery: HTTP error fetching ${fetchPath} (URL: ${url})! Status: ${response.status} ${response.statusText}`); 
            return null; 
        }
        const text = await response.text();
        return text;
    } catch (error) { 
        logger.log('error', `SourceDiscovery: Error fetching source code for ${fetchPath} (URL: ${url}): ${error.message}`); 
        console.error(error); 
        return null; 
    }
}

export function scanForSourceFilesOnPage() {
    if (!state.extensionEnabled) {
        return;
    }
    logger.log('info', `SourceDiscovery: Scanning page for source files.`);
    try {
        const filePathMap = {};
        const elementsWithSource = document.querySelectorAll('[data-source-file]');
        elementsWithSource.forEach(element => {
            let sourceFile = element.getAttribute('data-source-file');
            const sourceLine = element.getAttribute('data-source-line');
            if (sourceFile && sourceLine) {
                if (sourceFile.startsWith('/')) {
                    sourceFile = sourceFile.substring(1);
                }
                if (!filePathMap[sourceFile]) { filePathMap[sourceFile] = []; }
                if (!filePathMap[sourceFile].includes(sourceLine)) { filePathMap[sourceFile].push(sourceLine); }
            }
        });
        try {
            const pageHtml = document.documentElement.outerHTML;
            const dataSourceMatches = pageHtml.matchAll(/data-source-file=["']([^"']+)["']\s+data-source-line=["']([^"']+)["']/g);
            let rawHtmlMatchesCount = 0; let newFilesFromRawHtml = 0;
            for (const match of dataSourceMatches) {
                rawHtmlMatchesCount++;
                let filePath = match[1]; 
                const line = match[2];
                if (filePath && line) {
                    if (filePath.startsWith('/')) {
                        filePath = filePath.substring(1);
                    }
                    if (!filePathMap[filePath]) { filePathMap[filePath] = []; newFilesFromRawHtml++; }
                    if (!filePathMap[filePath].includes(line)) { filePathMap[filePath].push(line); }
                }
            }
        } catch (e) { logger.log('warn', `SourceDiscovery: Error scanning raw HTML: ${e.message}`); }

        if (Object.keys(filePathMap).length > 0) {
            logger.log('info', `SourceDiscovery: Found ${Object.keys(filePathMap).length} unique source files.`);
            const treeData = buildFileTree(filePathMap);
            if (Object.keys(treeData).length !== Object.keys(state.fileTree).length || JSON.stringify(treeData) !== JSON.stringify(state.fileTree)) {
                updateState({ fileTree: treeData });
                renderFileTree();
            }
        } else {
            logger.log('info', 'SourceDiscovery: No source files found on the page.');
            if (Object.keys(state.fileTree).length > 0) { updateState({ fileTree: {} }); renderFileTree(); }
        }
    } catch (error) {
        logger.log('error', `SourceDiscovery: Error during source file scanning: ${error.message}`);
        console.error(error);
        if (Object.keys(state.fileTree).length > 0) { updateState({ fileTree: {} }); renderFileTree(); }
    }
}

export const debouncedScanForSourceFiles = debounce(() => {
    logger.log('info', `SourceDiscovery: Debounced scan executing.`);
    if (!state.extensionEnabled) { 
        return; 
    }
    scanForSourceFilesOnPage();
}, 500);