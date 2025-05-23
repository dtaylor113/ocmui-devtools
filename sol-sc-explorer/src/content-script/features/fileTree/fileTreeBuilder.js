// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/features/fileTree/fileTreeBuilder.js
import { logger } from '../../utils/logger.js'; // Path is ../../utils/

export function buildFileTree(filePathMap) {
    const root = {};
    logger.log('debug', `FileTreeBuilder: Building file tree from ${Object.keys(filePathMap).length} paths.`);

    for (const filePath in filePathMap) {
        if (!filePathMap.hasOwnProperty(filePath)) continue;

        let currentLevel = root;
        const parts = filePath.split('/').filter(part => part.length > 0);

        // Process directories
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!currentLevel[part]) {
                currentLevel[part] = {
                    _isDir: true,
                    _children: {},
                    _path: '/' + parts.slice(0, i + 1).join('/')
                };
            } else if (!currentLevel[part]._isDir) {
                // This case handles if a file was mistakenly treated as a dir earlier
                // Or if a path like /foo exists and then /foo/bar comes along
                logger.log('warn', `FileTreeBuilder: Node ${part} was a file, now converting to dir for path ${filePath}`);
                currentLevel[part]._isDir = true;
                currentLevel[part]._children = currentLevel[part]._children || {};
                currentLevel[part]._path = currentLevel[part]._path || ('/' + parts.slice(0, i + 1).join('/'));
            }
            currentLevel = currentLevel[part]._children;
        }

        // Process file
        if (parts.length > 0) {
            const fileName = parts[parts.length - 1];
            if (currentLevel[fileName] && currentLevel[fileName]._isDir) {
                // If a directory with the same name as the file exists (e.g. /foo/bar dir and /foo/bar file)
                // This is an edge case, decide how to handle. Suffixing file? Logging error?
                // For now, let's log and potentially overwrite if it wasn't marked as a file yet.
                logger.log('warn', `FileTreeBuilder: File node ${fileName} conflicts with existing directory at path ${filePath}. Treating as file.`);
                currentLevel[fileName]._isFile = true;
                currentLevel[fileName]._path = filePath;
                currentLevel[fileName]._lines = filePathMap[filePath];
                // Remove _isDir and _children if it was mistakenly a dir
                delete currentLevel[fileName]._isDir;
                delete currentLevel[fileName]._children;

            } else {
                currentLevel[fileName] = {
                    _isFile: true,
                    _path: filePath,
                    _lines: filePathMap[filePath]
                };
            }
        } else {
            logger.log('warn', `FileTreeBuilder: File path resulted in no parts (empty or root path?): ${filePath}`);
        }
    }
    logger.log('debug', `FileTreeBuilder: File tree construction complete.`);
    return root;
}