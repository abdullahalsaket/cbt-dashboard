// ============================================================
// GOOGLE SHEETS SYNC MODULE
// Competency Training Intelligence Hub
// ============================================================

/**
 * GoogleSync - Handles fetching and parsing data from published Google Sheets
 * Uses the Publish to Web URL to fetch data as HTML table
 */
const GoogleSync = (function() {
    'use strict';
    
    // ============================================================
    // PRIVATE STATE
    // ============================================================
    
    let _rawData = [];
    let _processedData = [];
    let _headers = [];
    let _lastFetchTime = null;
    let _isFetching = false;
    let _fetchInterval = null;
    let _callbacks = [];
    
    // ============================================================
    // CONSTANTS
    // ============================================================
    
    const CONFIG = window.CTIH_CONFIG || {};
    const PUBLISH_URL = CONFIG.SHEETS_PUBLISH_URL || '';
    const REFRESH_INTERVAL = CONFIG.AUTO_REFRESH_INTERVAL || 300000; // 5 minutes default
    
    // ============================================================
    // COLUMN MAPPING - Based on actual sheet structure
    // ============================================================
    
    const COLUMN_MAP = {
        0: 'id',
        1: 'name',
        2: 'title',
        3: 'hireDate',
        4: 'cLevel',
        5: 'level',
        6: 'title2026',
        7: 'reportingLine',
        8: 'grade',
        9: 'status',
        10: 'activity',
        11: 'sector',
        12: 'area',
        13: 'cc',
        14: 'department',
        15: 'trainingGroup',
        16: 'trainingPhase',
        17: 'trainingLocation',
        18: 'sevenSensProgram',
        19: 'analyticalThinking',
        20: 'mindField',
        21: 'leadership',
        22: 'drivePerformance',
        23: 'kickStartManager',
        24: 'twisted',
        25: 'kickStart',
        26: 'accommodation'
    };
    
    // ============================================================
    // PUBLIC METHODS
    // ============================================================
    
    /**
     * Initialize the sync module
     * @param {Object} options - Configuration options
     * @returns {Promise} - Resolves when initial fetch is complete
     */
    function init(options = {}) {
        console.log('[GoogleSync] Initializing...');
        
        // Set up refresh interval
        if (_fetchInterval) {
            clearInterval(_fetchInterval);
        }
        
        // Fetch data immediately
        return fetchData()
            .then(() => {
                // Start auto-refresh
                _fetchInterval = setInterval(() => {
                    console.log('[GoogleSync] Auto-refresh triggered');
                    fetchData().catch(err => {
                        console.warn('[GoogleSync] Auto-refresh failed:', err);
                    });
                }, REFRESH_INTERVAL);
                
                console.log(`[GoogleSync] Auto-refresh set to ${REFRESH_INTERVAL / 1000} seconds`);
                return _processedData;
            })
            .catch(err => {
                console.error('[GoogleSync] Initialization failed:', err);
                throw err;
            });
    }
    
    /**
     * Fetch data from Google Sheets publish URL
     * @returns {Promise<Array>} - Processed data array
     */
    function fetchData() {
        if (_isFetching) {
            console.log('[GoogleSync] Fetch already in progress, skipping...');
            return Promise.resolve(_processedData);
        }
        
        _isFetching = true;
        
        console.log('[GoogleSync] Fetching data from:', PUBLISH_URL);
        
        return fetch(PUBLISH_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                console.log('[GoogleSync] Data received, parsing...');
                const parsed = parseHTMLTable(html);
                _rawData = parsed.raw;
                _headers = parsed.headers;
                _processedData = processData(_rawData);
                _lastFetchTime = new Date();
                _isFetching = false;
                
                // Notify all callbacks
                notifyCallbacks('success', _processedData);
                
                console.log(`[GoogleSync] Parsed ${_processedData.length} records successfully`);
                return _processedData;
            })
            .catch(err => {
                _isFetching = false;
                console.error('[GoogleSync] Fetch error:', err);
                notifyCallbacks('error', err);
                throw err;
            });
    }
    
    /**
     * Parse HTML table from Google Sheets publish output
     * @param {string} html - HTML string from Google Sheets
     * @returns {Object} - { headers, raw }
     */
    function parseHTMLTable(html) {
        // Create a temporary DOM element to parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Find the table - Google Sheets uses <table> with <tbody>
        const table = doc.querySelector('table');
        if (!table) {
            console.warn('[GoogleSync] No table found in HTML');
            return { headers: [], raw: [] };
        }
        
        const rows = table.querySelectorAll('tr');
        if (rows.length === 0) {
            console.warn('[GoogleSync] No rows found in table');
            return { headers: [], raw: [] };
        }
        
        // Extract headers from first row (th elements)
        const headerRow = rows[0];
        const headerCells = headerRow.querySelectorAll('th');
        let headers = [];
        
        if (headerCells.length > 0) {
            headers = Array.from(headerCells).map(th => th.textContent.trim());
        } else {
            // Fallback: use td from first row as headers
            const firstDataRow = rows[1] || rows[0];
            const tdCells = firstDataRow.querySelectorAll('td');
            if (tdCells.length > 0) {
                headers = Array.from(tdCells).map((td, index) => {
                    return COLUMN_MAP[index] || `col_${index}`;
                });
            }
        }
        
        // Extract data rows (skip header row)
        const dataRows = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) continue;
            
            const rowData = Array.from(cells).map(cell => cell.textContent.trim());
            dataRows.push(rowData);
        }
        
        console.log(`[GoogleSync] Found ${dataRows.length} data rows, ${headers.length} columns`);
        
        return {
            headers: headers,
            raw: dataRows
        };
    }
    
    /**
     * Process raw data into structured objects
     * @param {Array<Array<string>>} rawData - Raw 2D array from sheet
     * @returns {Array<Object>} - Array of structured objects
     */
    function processData(rawData) {
        if (!rawData || rawData.length === 0) {
            return [];
        }
        
        return rawData
            .filter(row => row && row.length > 1 && row[0] !== '') // Filter empty rows
            .map((row, index) => {
                const obj = {};
                
                // Map each column to its key
                Object.keys(COLUMN_MAP).forEach(key => {
                    const colIndex = parseInt(key);
                    const fieldName = COLUMN_MAP[colIndex];
                    obj[fieldName] = row[colIndex] || '';
                });
                
                // Add a unique index
                obj._index = index;
                
                // Clean and normalize common fields
                obj.id = normalizeId(obj.id);
                obj.name = normalizeName(obj.name);
                obj.status = normalizeStatus(obj.status);
                obj.grade = normalizeGrade(obj.grade);
                obj.department = normalizeText(obj.department);
                obj.sector = normalizeText(obj.sector);
                obj.trainingGroup = normalizeText(obj.trainingGroup);
                obj.trainingPhase = normalizeText(obj.trainingPhase);
                
                // Calculate attendance metrics
                const attended = obj.sevenSensProgram || '';
                obj.hasAttended = attended.toLowerCase() === 'attend' || attended.toLowerCase() === 'attended';
                obj.attendanceStatus = getAttendanceStatus(attended);
                
                return obj;
            });
    }
    
    // ============================================================
    // DATA NORMALIZATION HELPERS
    // ============================================================
    
    function normalizeId(value) {
        if (!value) return '';
        // Remove trailing .0 and trim
        return String(value).replace(/\.0$/, '').trim();
    }
    
    function normalizeName(value) {
        if (!value) return '';
        // Remove extra spaces and special characters
        return String(value).replace(/\s+/g, ' ').trim();
    }
    
    function normalizeStatus(value) {
        if (!value) return 'unknown';
        const statusMap = {
            'يعمل': 'active',
            'مرضى': 'sick',
            'قانونيه': 'legal',
            'انقطاع': 'inactive',
            'قانوني': 'legal',
            'عامل': 'active'
        };
        return statusMap[value.trim()] || value.trim().toLowerCase() || 'unknown';
    }
    
    function normalizeGrade(value) {
        if (!value) return '';
        const gradeMap = {
            'Middle Management': 'Middle Management',
            'Supervisory': 'Supervisory',
            'Top Management': 'Top Management',
            'Staff': 'Staff',
            'GS': 'General Staff',
            'Clerical': 'Clerical',
            'Executives': 'Executive'
        };
        return gradeMap[value.trim()] || value.trim() || '';
    }
    
    function normalizeText(value) {
        if (!value) return '';
        return String(value).trim();
    }
    
    function getAttendanceStatus(value) {
        if (!value) return 'not-started';
        const lower = value.toLowerCase();
        if (lower === 'attend' || lower === 'attended') return 'completed';
        if (lower === 'not attend') return 'pending';
        return 'not-started';
    }
    
    // ============================================================
    // CALLBACK MANAGEMENT
    // ============================================================
    
    function notifyCallbacks(type, data) {
        _callbacks.forEach(cb => {
            try {
                cb(type, data);
            } catch (err) {
                console.error('[GoogleSync] Callback error:', err);
            }
        });
    }
    
    /**
     * Register a callback for data changes
     * @param {Function} callback - Function to call on data update
     */
    function onDataUpdate(callback) {
        if (typeof callback === 'function') {
            _callbacks.push(callback);
        }
    }
    
    /**
     * Get the currently processed data
     * @returns {Array<Object>} - Array of employee objects
     */
    function getData() {
        return _processedData;
    }
    
    /**
     * Get the raw data
     * @returns {Array<Array<string>>} - Raw 2D array
     */
    function getRawData() {
        return _rawData;
    }
    
    /**
     * Get the headers
     * @returns {Array<string>} - Column headers
     */
    function getHeaders() {
        return _headers;
    }
    
    /**
     * Get the last fetch time
     * @returns {Date|null} - Last fetch timestamp
     */
    function getLastFetchTime() {
        return _lastFetchTime;
    }
    
    /**
     * Force a refresh of data
     * @returns {Promise<Array>} - Fresh data
     */
    function refresh() {
        console.log('[GoogleSync] Manual refresh triggered');
        return fetchData();
    }
    
    /**
     * Clean up resources (stop interval, etc.)
     */
    function destroy() {
        if (_fetchInterval) {
            clearInterval(_fetchInterval);
            _fetchInterval = null;
        }
        _callbacks = [];
        console.log('[GoogleSync] Destroyed');
    }
    
    // ============================================================
    // PUBLIC API
    // ============================================================
    
    return {
        init: init,
        fetchData: fetchData,
        getData: getData,
        getRawData: getRawData,
        getHeaders: getHeaders,
        getLastFetchTime: getLastFetchTime,
        refresh: refresh,
        onDataUpdate: onDataUpdate,
        destroy: destroy
    };
})();

// ============================================================
// EXPOSE TO GLOBAL SCOPE
// ============================================================

if (typeof window !== 'undefined') {
    window.GoogleSync = GoogleSync;
}

// ============================================================
// AUTO-INITIALIZATION
// ============================================================

// Wait for DOM to be ready, then auto-init if config exists
document.addEventListener('DOMContentLoaded', function() {
    if (window.CTIH_CONFIG && window.CTIH_CONFIG.SHEETS_PUBLISH_URL) {
        console.log('[GoogleSync] Auto-initializing with config');
        GoogleSync.init().catch(err => {
            console.warn('[GoogleSync] Auto-init failed:', err);
        });
    }
});