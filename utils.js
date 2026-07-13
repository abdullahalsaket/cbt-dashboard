// ============================================================
// UTILITIES MODULE - COMPETENCY TRAINING INTELLIGENCE HUB
// ============================================================

/**
 * Utils - Collection of helper functions
 * Provides reusable utilities for data processing, formatting, and DOM manipulation
 */
const Utils = (function() {
    'use strict';
    
    // ============================================================
    // STRING UTILITIES
    // ============================================================
    
    /**
     * Truncate a string to a maximum length
     * @param {string} str - The string to truncate
     * @param {number} maxLength - Maximum length
     * @param {string} suffix - Suffix to add (default: '...')
     * @returns {string} - Truncated string
     */
    function truncate(str, maxLength = 50, suffix = '...') {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + suffix;
    }
    
    /**
     * Capitalize the first letter of a string
     * @param {string} str - The string to capitalize
     * @returns {string} - Capitalized string
     */
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    /**
     * Capitalize each word in a string
     * @param {string} str - The string to capitalize
     * @returns {string} - Title-cased string
     */
    function titleCase(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    /**
     * Normalize a string for comparison (lowercase, trim, remove extra spaces)
     * @param {string} str - The string to normalize
     * @returns {string} - Normalized string
     */
    function normalizeString(str) {
        if (!str) return '';
        return str.toLowerCase().replace(/\s+/g, ' ').trim();
    }
    
    /**
     * Check if a string contains a search query (case-insensitive)
     * @param {string} str - The string to search in
     * @param {string} query - The search query
     * @returns {boolean} - True if contains
     */
    function stringContains(str, query) {
        if (!str || !query) return false;
        return normalizeString(str).includes(normalizeString(query));
    }
    
    // ============================================================
    // NUMBER UTILITIES
    // ============================================================
    
    /**
     * Format a number with commas
     * @param {number} num - The number to format
     * @returns {string} - Formatted number
     */
    function formatNumber(num) {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString('en-US');
    }
    
    /**
     * Format a number as a percentage
     * @param {number} num - The number (0-1 or 0-100)
     * @param {boolean} isDecimal - If true, num is 0-1; if false, num is 0-100
     * @param {number} decimals - Number of decimal places
     * @returns {string} - Formatted percentage
     */
    function formatPercentage(num, isDecimal = false, decimals = 0) {
        if (num === undefined || num === null) return '0%';
        let value = isDecimal ? num * 100 : num;
        return value.toFixed(decimals) + '%';
    }
    
    /**
     * Clamp a number between min and max
     * @param {number} num - The number to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Clamped number
     */
    function clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }
    
    /**
     * Calculate the percentage of a part relative to a whole
     * @param {number} part - The part value
     * @param {number} whole - The whole value
     * @param {number} decimals - Number of decimal places
     * @returns {number} - Percentage
     */
    function calculatePercentage(part, whole, decimals = 1) {
        if (!whole || whole === 0) return 0;
        return parseFloat(((part / whole) * 100).toFixed(decimals));
    }
    
    // ============================================================
    // DATE UTILITIES
    // ============================================================
    
    /**
     * Parse a date string to a Date object
     * @param {string} dateStr - Date string (supports various formats)
     * @returns {Date|null} - Parsed date or null
     */
    function parseDate(dateStr) {
        if (!dateStr) return null;
        
        // Try parsing as ISO or standard format
        let date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date;
        
        // Try parsing as dd/mm/yyyy or mm/dd/yyyy
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
            const year = parseInt(parts[2]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[0]);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                date = new Date(year, month, day);
                if (!isNaN(date.getTime())) return date;
            }
        }
        
        return null;
    }
    
    /**
     * Format a date to a readable string
     * @param {Date|string} date - Date object or string
     * @param {string} format - Format (short, medium, long, iso)
     * @returns {string} - Formatted date
     */
    function formatDate(date, format = 'medium') {
        const d = typeof date === 'string' ? parseDate(date) : date;
        if (!d || isNaN(d.getTime())) return 'N/A';
        
        const options = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            medium: { day: 'numeric', month: 'short', year: 'numeric' },
            long: { day: 'numeric', month: 'long', year: 'numeric' },
            iso: { year: 'numeric', month: '2-digit', day: '2-digit' }
        };
        
        return d.toLocaleDateString('en-US', options[format] || options.medium);
    }
    
    /**
     * Get the relative time from a date (e.g., "2 days ago")
     * @param {Date|string} date - Date object or string
     * @returns {string} - Relative time string
     */
    function timeAgo(date) {
        const d = typeof date === 'string' ? parseDate(date) : date;
        if (!d || isNaN(d.getTime())) return 'N/A';
        
        const now = new Date();
        const diffMs = now - d;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);
        
        if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
        if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
        if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
        if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
    
    // ============================================================
    // ARRAY UTILITIES
    // ============================================================
    
    /**
     * Group an array by a key
     * @param {Array} arr - The array to group
     * @param {string|Function} key - Key to group by or function that returns the key
     * @returns {Object} - Grouped object
     */
    function groupBy(arr, key) {
        if (!arr || !Array.isArray(arr)) return {};
        
        return arr.reduce((result, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    }
    
    /**
     * Get unique values from an array
     * @param {Array} arr - The array
     * @param {string|Function} key - Optional key or function to get the value
     * @returns {Array} - Array of unique values
     */
    function unique(arr, key = null) {
        if (!arr || !Array.isArray(arr)) return [];
        
        if (!key) {
            return [...new Set(arr)];
        }
        
        const seen = new Set();
        return arr.filter(item => {
            const value = typeof key === 'function' ? key(item) : item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }
    
    /**
     * Sort an array by a key or function
     * @param {Array} arr - The array to sort
     * @param {string|Function} key - Key or function to sort by
     * @param {string} direction - 'asc' or 'desc'
     * @returns {Array} - Sorted array (new array)
     */
    function sortBy(arr, key, direction = 'asc') {
        if (!arr || !Array.isArray(arr)) return [];
        
        const sorted = [...arr];
        const dir = direction === 'asc' ? 1 : -1;
        
        sorted.sort((a, b) => {
            const valA = typeof key === 'function' ? key(a) : a[key];
            const valB = typeof key === 'function' ? key(b) : b[key];
            
            if (typeof valA === 'string') {
                return valA.localeCompare(valB) * dir;
            }
            return (valA - valB) * dir;
        });
        
        return sorted;
    }
    
    /**
     * Paginate an array
     * @param {Array} arr - The array to paginate
     * @param {number} page - Current page (1-indexed)
     * @param {number} pageSize - Number of items per page
     * @returns {Object} - { data, total, totalPages, hasNext, hasPrev }
     */
    function paginate(arr, page = 1, pageSize = 25) {
        if (!arr || !Array.isArray(arr)) {
            return { data: [], total: 0, totalPages: 0, hasNext: false, hasPrev: false };
        }
        
        const total = arr.length;
        const totalPages = Math.ceil(total / pageSize) || 1;
        const currentPage = clamp(page, 1, totalPages);
        const start = (currentPage - 1) * pageSize;
        const end = Math.min(start + pageSize, total);
        
        return {
            data: arr.slice(start, end),
            total: total,
            totalPages: totalPages,
            currentPage: currentPage,
            pageSize: pageSize,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1
        };
    }
    
    // ============================================================
    // OBJECT UTILITIES
    // ============================================================
    
    /**
     * Deep clone an object
     * @param {Object} obj - The object to clone
     * @returns {Object} - Cloned object
     */
    function deepClone(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        return JSON.parse(JSON.stringify(obj));
    }
    
    /**
     * Safely get a nested property from an object
     * @param {Object} obj - The object
     * @param {string} path - Dot-separated path (e.g., 'user.profile.name')
     * @param {*} defaultValue - Default value if path doesn't exist
     * @returns {*} - Value at path or default
     */
    function getNested(obj, path, defaultValue = undefined) {
        if (!obj || !path) return defaultValue;
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === undefined || current === null || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[key];
        }
        
        return current !== undefined ? current : defaultValue;
    }
    
    /**
     * Pick specific keys from an object
     * @param {Object} obj - The object
     * @param {Array<string>} keys - Keys to pick
     * @returns {Object} - New object with picked keys
     */
    function pick(obj, keys) {
        if (!obj || !keys || !Array.isArray(keys)) return {};
        
        const result = {};
        keys.forEach(key => {
            if (obj[key] !== undefined) {
                result[key] = obj[key];
            }
        });
        return result;
    }
    
    /**
     * Omit specific keys from an object
     * @param {Object} obj - The object
     * @param {Array<string>} keys - Keys to omit
     * @returns {Object} - New object without omitted keys
     */
    function omit(obj, keys) {
        if (!obj || !keys || !Array.isArray(keys)) return { ...obj };
        
        const result = { ...obj };
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    }
    
    // ============================================================
    // DOM UTILITIES
    // ============================================================
    
    /**
     * Get an element by ID with error handling
     * @param {string} id - Element ID
     * @param {boolean} throwError - Throw error if not found
     * @returns {HTMLElement|null} - Element or null
     */
    function getElement(id, throwError = false) {
        const el = document.getElementById(id);
        if (!el && throwError) {
            throw new Error(`Element with ID "${id}" not found`);
        }
        return el;
    }
    
    /**
     * Set text content of an element
     * @param {string|HTMLElement} selector - Element ID or DOM element
     * @param {string} text - Text to set
     * @returns {boolean} - True if successful
     */
    function setText(selector, text) {
        const el = typeof selector === 'string' ? getElement(selector) : selector;
        if (!el) return false;
        el.textContent = text;
        return true;
    }
    
    /**
     * Set HTML content of an element
     * @param {string|HTMLElement} selector - Element ID or DOM element
     * @param {string} html - HTML to set
     * @returns {boolean} - True if successful
     */
    function setHTML(selector, html) {
        const el = typeof selector === 'string' ? getElement(selector) : selector;
        if (!el) return false;
        el.innerHTML = html;
        return true;
    }
    
    /**
     * Show an element
     * @param {string|HTMLElement} selector - Element ID or DOM element
     * @param {string} display - Display style (default: 'block')
     */
    function show(selector, display = 'block') {
        const el = typeof selector === 'string' ? getElement(selector) : selector;
        if (!el) return;
        el.style.display = display;
    }
    
    /**
     * Hide an element
     * @param {string|HTMLElement} selector - Element ID or DOM element
     */
    function hide(selector) {
        const el = typeof selector === 'string' ? getElement(selector) : selector;
        if (!el) return;
        el.style.display = 'none';
    }
    
    /**
     * Toggle visibility of an element
     * @param {string|HTMLElement} selector - Element ID or DOM element
     */
    function toggle(selector) {
        const el = typeof selector === 'string' ? getElement(selector) : selector;
        if (!el) return;
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
    
    /**
     * Add a class to an element
     * @param {string|HTMLElement} selector - Element ID or DOM element
     * @param {string} className - Class to add
     */
    function addClass(selector, className) {
        const el = typeof selector === 'string' ? getElement(selector) : selector;
        if (!el) return;
        el.classList.add(className);
    }
    
    /**
     * Remove a class from an element
     * @param {string|HTMLElement} selector - Element ID or DOM element
     * @param {string} className - Class to remove
     */
    function removeClass(selector, className) {
        const el = typeof selector === 'string' ? getElement(selector) : selector;
        if (!el) return;
        el.classList.remove(className);
    }
    
    /**
     * Toggle a class on an element
     * @param {string|HTMLElement} selector - Element ID or DOM element
     * @param {string} className - Class to toggle
     */
    function toggleClass(selector, className) {
        const el = typeof selector === 'string' ? getElement(selector) : selector;
        if (!el) return;
        el.classList.toggle(className);
    }
    
    // ============================================================
    // DEBOUNCE & THROTTLE
    // ============================================================
    
    /**
     * Debounce a function call
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} - Debounced function
     */
    function debounce(fn, delay = 300) {
        let timeoutId = null;
        
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    }
    
    /**
     * Throttle a function call (execute at most once per interval)
     * @param {Function} fn - Function to throttle
     * @param {number} interval - Interval in milliseconds
     * @returns {Function} - Throttled function
     */
    function throttle(fn, interval = 300) {
        let lastCall = 0;
        let timeoutId = null;
        
        return function(...args) {
            const now = Date.now();
            
            if (now - lastCall >= interval) {
                lastCall = now;
                fn.apply(this, args);
            } else if (!timeoutId) {
                timeoutId = setTimeout(() => {
                    lastCall = Date.now();
                    timeoutId = null;
                    fn.apply(this, args);
                }, interval - (now - lastCall));
            }
        };
    }
    
    // ============================================================
    // COLOR UTILITIES
    // ============================================================
    
    /**
     * Generate a random hex color
     * @returns {string} - Random hex color
     */
    function randomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }
    
    /**
     * Generate a color from a string (consistent output for same input)
     * @param {string} str - Input string
     * @returns {string} - Hex color
     */
    function colorFromString(str) {
        if (!str) return '#66668A';
        
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 55%)`;
    }
    
    /**
     * Get a color from a palette by index
     * @param {number} index - Index into palette
     * @param {Array<string>} palette - Color palette (default: standard palette)
     * @returns {string} - Color
     */
    function paletteColor(index, palette = null) {
        const defaultPalette = [
            '#6C63FF', '#00C853', '#FFB300', '#FF1744', '#00BCD4',
            '#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#4D96FF',
            '#FF6B9D', '#845EF7', '#FCC419', '#20C997', '#FF922B'
        ];
        
        const p = palette || defaultPalette;
        return p[index % p.length];
    }
    
    // ============================================================
    // LOCAL STORAGE UTILITIES
    // ============================================================
    
    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {*} data - Data to store (will be JSON stringified)
     * @param {number} ttl - Time-to-live in milliseconds (optional)
     */
    function localStorageSet(key, data, ttl = null) {
        try {
            const item = {
                data: data,
                timestamp: Date.now()
            };
            if (ttl) {
                item.ttl = ttl;
            }
            localStorage.setItem(key, JSON.stringify(item));
        } catch (e) {
            console.warn('[Utils] localStorageSet error:', e);
        }
    }
    
    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found or expired
     * @returns {*} - Stored data or default
     */
    function localStorageGet(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return defaultValue;
            
            const item = JSON.parse(raw);
            
            // Check if expired
            if (item.ttl && (Date.now() - item.timestamp) > item.ttl) {
                localStorage.removeItem(key);
                return defaultValue;
            }
            
            return item.data;
        } catch (e) {
            console.warn('[Utils] localStorageGet error:', e);
            return defaultValue;
        }
    }
    
    /**
     * Remove an item from localStorage
     * @param {string} key - Storage key
     */
    function localStorageRemove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('[Utils] localStorageRemove error:', e);
        }
    }
    
    // ============================================================
    // EXPORT UTILITIES
    // ============================================================
    
    /**
     * Convert an array of objects to CSV format
     * @param {Array<Object>} data - Array of objects
     * @param {Array<string>} headers - Optional headers (uses object keys if not provided)
     * @returns {string} - CSV string
     */
    function toCSV(data, headers = null) {
        if (!data || !Array.isArray(data) || data.length === 0) return '';
        
        const keys = headers || Object.keys(data[0]);
        const headerRow = keys.join(',');
        
        const rows = data.map(item => {
            return keys.map(key => {
                const value = item[key] || '';
                // Escape commas and quotes
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',');
        });
        
        return [headerRow, ...rows].join('\n');
    }
    
    /**
     * Download a file as a Blob
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type (default: 'text/plain')
     */
    function downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // ============================================================
    // PUBLIC API
    // ============================================================
    
    return {
        // String
        truncate: truncate,
        capitalize: capitalize,
        titleCase: titleCase,
        normalizeString: normalizeString,
        stringContains: stringContains,
        
        // Number
        formatNumber: formatNumber,
        formatPercentage: formatPercentage,
        clamp: clamp,
        calculatePercentage: calculatePercentage,
        
        // Date
        parseDate: parseDate,
        formatDate: formatDate,
        timeAgo: timeAgo,
        
        // Array
        groupBy: groupBy,
        unique: unique,
        sortBy: sortBy,
        paginate: paginate,
        
        // Object
        deepClone: deepClone,
        getNested: getNested,
        pick: pick,
        omit: omit,
        
        // DOM
        getElement: getElement,
        setText: setText,
        setHTML: setHTML,
        show: show,
        hide: hide,
        toggle: toggle,
        addClass: addClass,
        removeClass: removeClass,
        toggleClass: toggleClass,
        
        // Performance
        debounce: debounce,
        throttle: throttle,
        
        // Color
        randomColor: randomColor,
        colorFromString: colorFromString,
        paletteColor: paletteColor,
        
        // Storage
        localStorageSet: localStorageSet,
        localStorageGet: localStorageGet,
        localStorageRemove: localStorageRemove,
        
        // Export
        toCSV: toCSV,
        downloadFile: downloadFile
    };
})();

// ============================================================
// EXPOSE TO GLOBAL SCOPE
// ============================================================

if (typeof window !== 'undefined') {
    window.Utils = Utils;
}

// ============================================================
// AUTO-INITIALIZE
// ============================================================

console.log('[Utils] Module loaded successfully');