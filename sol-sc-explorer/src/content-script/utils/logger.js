// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/utils/logger.js

// Centralized logging utility
export const logger = {
    // Log levels: error, warn, info, debug
    logLevel: 'info', // Default, can be changed dynamically
    levels: { error: 0, warn: 1, info: 2, debug: 3 },

    setLogLevel: function(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.logLevel = level;
            this.log('info', `Log level set to: ${level}`);
        } else {
            this.log('warn', `Invalid log level: ${level}. Keeping current: ${this.logLevel}`);
        }
    },

    log: function(level, message) {
        if (this.levels[level] <= this.levels[this.logLevel]) {
            const timestamp = new Date().toLocaleTimeString();
            let prefix = `[SourceViewer][${timestamp}]`;
            if (level === 'debug' && this.logLevel === 'debug') prefix += '[Debug]'; // Make debug prefix conditional

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
                    // Only log debug if explicitly set
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