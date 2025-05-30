// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/features/fileTree/fileTreeBuilder.js
import { logger } from '../../utils/logger.js'; // Path is ../../utils/

export function buildFileTree(filePathMap) {
    const root = {};
    // Building file tree log removed

    for (const rawFilePath in filePathMap) {
        if (!filePathMap.hasOwnProperty(rawFilePath)) continue;

        // The rawFilePath from filePathMap is now already normalized (no leading /)
        const filePath = rawFilePath;

        let currentLevel = root;
        const parts = filePath.split('/').filter(part => part.length > 0); // parts will not have empty strings

        // Process directories
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            const currentPath = parts.slice(0, i + 1).join('/'); // Path for this directory part

            if (!currentLevel[part]) {
                currentLevel[part] = {
                    _isDir: true,
                    _children: {},
                    _path: currentPath 
                };
            } else if (!currentLevel[part]._isDir) {
                logger.log('warn', `FileTreeBuilder: Node ${part} was a file, now converting to dir for path ${filePath}`);
                currentLevel[part]._isDir = true;
                currentLevel[part]._children = currentLevel[part]._children || {};
                currentLevel[part]._path = currentLevel[part]._path || currentPath;
            }
            currentLevel = currentLevel[part]._children;
        }

        // Process file
        if (parts.length > 0) {
            const fileName = parts[parts.length - 1];
            // filePath is already normalized and is the full path to the file.
            if (currentLevel[fileName] && currentLevel[fileName]._isDir) {
                logger.log('warn', `FileTreeBuilder: File node ${fileName} conflicts with existing directory at path ${filePath}. Treating as file.`);
                currentLevel[fileName]._isFile = true;
                currentLevel[fileName]._path = filePath; // Use normalized filePath
                currentLevel[fileName]._lines = filePathMap[rawFilePath]; // Use original key for map lookup
                delete currentLevel[fileName]._isDir;
                delete currentLevel[fileName]._children;
            } else {
                currentLevel[fileName] = {
                    _isFile: true,
                    _path: filePath, // Use normalized filePath
                    _lines: filePathMap[rawFilePath] // Use original key for map lookup
                };
            }
        } else {
            logger.log('warn', `FileTreeBuilder: File path resulted in no parts (empty or root path?): ${filePath}`);
        }
    }
    // File tree construction complete log removed
    return root;
}