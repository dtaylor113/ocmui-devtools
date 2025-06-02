// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/utils/logger.js

export const showDebugLogs = true; // Set to true for development, false for production/check-in

// Centralized logging utility
export const logger = {
    logLevel: 'debug', // Default to debug; actual output controlled by showDebugLogs and this level
    levels: { error: 0, warn: 1, info: 2, debug: 3 },

    setLogLevel: function(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.logLevel = level;
            if (showDebugLogs && this.levels['info'] <= this.levels[this.logLevel]) {
                console.log(`[SourceViewer][${new Date().toLocaleTimeString()}] Log level set to: ${level}`);
            }
        } else {
            if (showDebugLogs && this.levels['warn'] <= this.levels[this.logLevel]) {
                console.warn(`[SourceViewer][${new Date().toLocaleTimeString()}] Invalid log level: ${level}. Keeping current: ${this.logLevel}`);
            }
        }
    },

    log: function(level, message) {
        if (!showDebugLogs) {
            return; // Suppress ALL messages from this logger if showDebugLogs is false
        }

        // If showDebugLogs is true, proceed with normal leveled logging
        if (this.levels[level] <= this.levels[this.logLevel]) {
            const timestamp = new Date().toLocaleTimeString();
            let prefix = `[SourceViewer][${timestamp}]`;
            if (level === 'debug' && this.logLevel === 'debug') prefix += '[Debug]';

            switch(level) {
                case 'error':
                    console.error(`${prefix} ${message}`);
                    break;
                case 'warn':
                    console.warn(`${prefix} ${message}`);
                    break;
                case 'info':
                    console.log(`${prefix} ${message}`);
                    break;
                case 'debug':
                    if (this.logLevel === 'debug') { 
                        console.log(`${prefix} ${message}`);
                    }
                    break;
                default:
                     console.log(`${prefix} [${level.toUpperCase()}] ${message}`);
            }
        }
    }
};