// /repos/ocmui-devtools/sol-sc-explorer/src/content-script/utils/helpers.js

import { CONSTANTS } from '../constants.js';
import { domUtils } from './dom.js';
// import { logger } from './logger.js'; // Using console.warn for early utils as logger might not be ready

export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

export function escapeHtml(html) {
    if (typeof html !== 'string') {
        console.warn(`[SourceViewer][escapeHtml] received non-string input type: ${typeof html}. Returning empty string.`);
        return '';
    }

    // Constructing the replacement strings programmatically
    // to avoid any typing/pasting issues with quotes.
    const amp = String.fromCharCode(38) + "amp;"; // &
    const lt = String.fromCharCode(38) + "lt;";   // <
    const gt = String.fromCharCode(38) + "gt;";   // >
    const quot = String.fromCharCode(38) + "quot;"; // "
    const apos = String.fromCharCode(38) + "#039;"; // ' (or String.fromCharCode(38) + "apos;")

    return html
        .replace(/&/g, amp)    // Must be first
        .replace(/</g, lt)
        .replace(/>/g, gt)
        .replace(/"/g, quot)   // Replace " with what evaluates to """
        .replace(/'/g, apos);  // Replace ' with what evaluates to "'"
}

export function getElementIdentifier(element) {
    if (!element || typeof element.tagName !== 'string') {
        // console.warn(`[SourceViewer][getElementIdentifier] Invalid element provided or no tagName.`);
        return 'unknown-element';
    }
    let identifier = element.tagName.toLowerCase();

    if (element.id) {
        identifier += `#${element.id}`;
    } else if (element.className && typeof element.className === 'string') {
        // Defensive access to CONSTANTS.CLASSES
        const extHighlight = CONSTANTS?.CLASSES?.EXTENSION_HIGHLIGHT || 'my-extension-highlight';
        const lockedHighlight = CONSTANTS?.CLASSES?.LOCKED_HIGHLIGHT || 'locked-highlight';
        const fileLockedHighlight = CONSTANTS?.CLASSES?.FILE_LOCKED_HIGHLIGHT || 'file-locked-highlight';

        const classList = element.className.split(' ')
            .map(cls => cls.trim())
            .filter(cls => cls &&
                           !cls.startsWith('my-extension-') &&
                           cls !== extHighlight &&
                           cls !== lockedHighlight &&
                           cls !== fileLockedHighlight)
            .join('.');
        if (classList) {
            identifier += `.${classList}`;
        }
    }

    const text = element.textContent;
    if (text) {
        const trimmedText = text.trim();
        if (trimmedText.length > 0) {
            const shortText = trimmedText.substring(0, 20).replace(/\s+/g, ' ');
            identifier += ` "${shortText}${trimmedText.length > 20 ? '...' : ''}"`;
        }
    }
    return identifier;
}

export function getLineHeight(element) {
    if (!element || typeof element.appendChild !== 'function' || typeof element.removeChild !== 'function') {
        // console.warn(`[SourceViewer][getLineHeight] Invalid element provided. Element: ${element}`);
        if (document.body) {
            try {
                const bodyStyle = window.getComputedStyle(document.body);
                const bodyLineHeight = parseFloat(bodyStyle.lineHeight);
                if (!isNaN(bodyLineHeight) && bodyLineHeight > 0) return bodyLineHeight;
            } catch(e) {
                // console.warn("[SourceViewer][getLineHeight] Error getting body line height:", e);
            }
        }
        return 16; // Fallback default line height
    }

    let tempDiv;
    try {
        // Defensive check for domUtils, providing a minimal fallback if it's not yet initialized
        // This is highly unlikely with ES6 module loading order but adds robustness.
        const dUtils = (typeof domUtils !== 'undefined' && domUtils && typeof domUtils.createElement === 'function') ? domUtils : {
            createElement: (tag, opts) => {
                const el = document.createElement(tag);
                if(opts && opts.styles) Object.assign(el.style, opts.styles);
                if(opts && opts.textContent) el.textContent = opts.textContent;
                return el;
            }
        };

        tempDiv = dUtils.createElement('div', {
            styles: {
                visibility: 'hidden',
                position: 'absolute',
                height: 'auto',
                width: 'auto',
                whiteSpace: 'nowrap',
                padding: '0',
                border: '0',
                fontFamily: window.getComputedStyle(element).fontFamily,
                fontSize: window.getComputedStyle(element).fontSize,
                lineHeight: 'normal', // Use 'normal' to measure intrinsic line height
            },
            textContent: 'Tg' // 'Tg' helps measure full height including ascenders/descenders
        });

        element.appendChild(tempDiv);
        const lineHeight = tempDiv.clientHeight;
        element.removeChild(tempDiv);

        return lineHeight > 0 ? lineHeight : 16; // Fallback if calculated height is 0
    } catch (error) {
        // console.error(`[SourceViewer][getLineHeight] error: ${error.message}. Element: ${element.tagName}`);
        if (tempDiv && tempDiv.parentElement) { // Ensure cleanup if error occurred after append
            try {
                tempDiv.parentElement.removeChild(tempDiv);
            } catch (e_remove) {
                // console.error(`[SourceViewer][getLineHeight] Error removing tempDiv in catch: ${e_remove.message}`);
            }
        }
        return 16; // Fallback default line height
    }
}