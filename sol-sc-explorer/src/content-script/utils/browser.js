// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/utils/browser.js
import { logger } from './logger.js';
import { CONSTANTS } from '../constants.js'; // CONSTANTS is one level up

// Browser compatibility layer
export const browserCompat = {
    detectBrowser: function () {
        const isBrowser = typeof window !== 'undefined';
        const isChrome = isBrowser && !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
        const isFirefox = isBrowser && typeof InstallTrigger !== 'undefined';
        const isEdge = isBrowser && navigator.userAgent.indexOf("Edg") !== -1;
        const isArc = isBrowser && navigator.userAgent.indexOf("Arc") !== -1;

        return {
            isChrome,
            isFirefox,
            isEdge,
            isArc,
            name: isChrome ? 'Chrome' :
                isFirefox ? 'Firefox' :
                    isEdge ? 'Edge' :
                        isArc ? 'Arc' :
                            'Unknown'
        };
    },

    loadStateFromStorage: function (callback) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED, function (data) {
                    const isEnabled = data[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED] !== undefined ?
                        Boolean(data[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED]) : true; // Default to true
                    logger.log('info', `Loaded extensionEnabled state from chrome.storage: ${isEnabled}`);
                    callback(isEnabled);
                });

                chrome.storage.onChanged.addListener(function (changes, namespace) {
                    if (namespace === 'local' && changes[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED]) {
                        const isEnabled = Boolean(changes[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED].newValue);
                        logger.log('info', `extensionEnabled state changed in chrome.storage: ${isEnabled}`);
                        callback(isEnabled); // Propagate change
                    }
                });
                return true;
            }
            else if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) { // Firefox
                browser.storage.local.get(CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED).then(data => {
                    const isEnabled = data[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED] !== undefined ?
                        Boolean(data[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED]) : true; // Default to true
                    logger.log('info', `Loaded extensionEnabled state from browser.storage: ${isEnabled}`);
                    callback(isEnabled);
                }, error => {
                     logger.log('error', `Error loading state from browser.storage: ${error.message}`);
                     callback(true); // Fallback on error
                });

                browser.storage.onChanged.addListener(function (changes, namespace) {
                    if (namespace === 'local' && changes[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED]) {
                        const isEnabled = Boolean(changes[CONSTANTS.STORAGE_KEYS.EXTENSION_ENABLED].newValue);
                        logger.log('info', `extensionEnabled state changed in browser.storage: ${isEnabled}`);
                        callback(isEnabled); // Propagate change
                    }
                });
                return true;
            }
            else {
                logger.log('warn', 'No suitable browser storage API detected (chrome.storage or browser.storage). Defaulting extension to enabled.');
                callback(true); // Default to true if no storage API
                return false;
            }
        } catch (error) {
            logger.log('error', `Error accessing storage API: ${error.message}`);
            logger.log('info', 'Defaulting extension to enabled state due to storage access error.');
            callback(true); // Default to enabled on error
            return false;
        }
    },

    setupMessageListeners: function(callback) { // callback here is toggleExtensionPlugin
        const runtimeAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : (typeof chrome !== 'undefined' ? chrome.runtime : null);

        if (!runtimeAPI || !runtimeAPI.onMessage) {
            logger.log('warn', 'No runtime API (chrome.runtime or browser.runtime) available for messaging.');
            return false;
        }

        // Remove previous listener if any to prevent duplicates, good practice.
        if (window._extensionMessageHandler && runtimeAPI.onMessage.hasListener(window._extensionMessageHandler)) {
            try {
                runtimeAPI.onMessage.removeListener(window._extensionMessageHandler);
                logger.log('debug', 'Removed existing message listener.');
            } catch (e) {
                logger.log('warn', `Could not remove existing message listener: ${e.message}`);
            }
        }

        window._extensionMessageHandler = function(message, sender, sendResponse) {
            logger.log('debug', `Content script received message: ${JSON.stringify(message)}`);
            if (message && message.action === "toggleExtensionPlugin") {
                logger.log('info', `Received toggleExtensionPlugin message with checked: ${message.checked}`);
                callback(Boolean(message.checked)); // This calls toggleExtensionPlugin from initializer.js
                if (sendResponse) sendResponse({ status: "OK", from: "content-script" });
                // For Manifest V3, returning true is important if sendResponse is async,
                // but here it's sync. For V2, it's less critical but good practice.
                return true;
            } else if (message && message.action === "ping") {
                if (sendResponse) sendResponse({ status: "pong", from: "content-script" });
                return true;
            }
            // If you expect other messages, handle them here.
            // Otherwise, indicate you're not handling it or it's an unknown action.
            // if (sendResponse) sendResponse({ status: "Unknown action", from: "content-script" });
            return false; // Or true if you might respond asynchronously later for other actions
        };

        runtimeAPI.onMessage.addListener(window._extensionMessageHandler);
        logger.log('info', 'Content script message listener attached.');
        return true;
    }
};