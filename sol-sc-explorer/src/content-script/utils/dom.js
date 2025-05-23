// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/utils/dom.js
import { logger } from './logger.js';
import { CONSTANTS } from '../constants.js'; // CONSTANTS is one level up

// DOM utility functions
export const domUtils = {
    // Create an element with attributes and properties
    createElement: function(tag, options = {}) {
        const element = document.createElement(tag);

        if (options.attributes) {
            for (const [key, value] of Object.entries(options.attributes)) {
                element.setAttribute(key, value);
            }
        }
        if (options.properties) {
            for (const [key, value] of Object.entries(options.properties)) {
                element[key] = value;
            }
        }
        if (options.classes) {
            options.classes.forEach(cls => element.classList.add(cls));
        }
        if (options.styles) {
            for (const [key, value] of Object.entries(options.styles)) {
                element.style[key] = value;
            }
        }
        if (options.textContent) {
            element.textContent = options.textContent;
        }
        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }
        if (options.eventListeners) {
            for (const [event, listener] of Object.entries(options.eventListeners)) {
                element.addEventListener(event, listener);
            }
        }
        return element;
    },

    // Show or hide an element
    setElementVisibility: function(element, isVisible) {
        if (element) {
            // For fileTreePanel, ensure it's display: flex when visible
            if (element.id === CONSTANTS.DOM_IDS.FILE_TREE_PANEL && isVisible) {
                 element.style.display = 'flex';
            } else {
                 element.style.display = isVisible ? 'block' : 'none';
            }
        } else {
            logger.log('warn', `domUtils.setElementVisibility: called with null element.`);
        }
    },

    // Safely append element to parent with fallback
    appendElement: function(element, parent = document.body) {
        if (!element) {
            logger.log('error', `domUtils.appendElement: called with null element.`);
            return false;
        }
        if (!parent) {
             logger.log('error', `domUtils.appendElement: called with null parent for element: ${element.tagName}`);
             // Fallback to document.body if parent is null but not explicitly document.body
             parent = document.body;
        }
        try {
            parent.appendChild(element);
            return true;
        } catch (error) {
            logger.log('warn', `domUtils.appendElement: Failed to append to provided parent. Error: ${error.message}. Trying document.documentElement.`);
            try {
                document.documentElement.appendChild(element);
                return true;
            } catch (fallbackError) {
                logger.log('error', `domUtils.appendElement: Failed to append element to document.documentElement. Error: ${fallbackError.message}`);
                return false;
            }
        }
    }
};