// ============================================================
// FILTERS MODULE - COMPETENCY TRAINING INTELLIGENCE HUB
// ============================================================

const FiltersModule = (function() {
    'use strict';
    
    let _data = [];
    let _filteredData = [];
    let _activeFilters = {};
    let _filterConfig = {};
    let _listeners = {};
    let _isUpdating = false;
    
    const FILTER_TYPES = {
        SELECT: 'select',
        MULTI_SELECT: 'multi-select',
        SEARCH: 'search',
        RANGE: 'range',
        DATE: 'date',
        CHECKBOX: 'checkbox',
        RADIO: 'radio'
    };
    
    const DEFAULT_FILTERS = {
        department: { type: FILTER_TYPES.SELECT, label: 'Department', field: 'department', options: [] },
        grade: { type: FILTER_TYPES.SELECT, label: 'Grade', field: 'grade', options: [] },
        status: { type: FILTER_TYPES.SELECT, label: 'Status', field: 'status', options: [] },
        sector: { type: FILTER_TYPES.SELECT, label: 'Sector', field: 'sector', options: [] },
        program: { type: FILTER_TYPES.SELECT, label: 'Training Program', field: 'trainingGroup', options: [] },
        phase: { type: FILTER_TYPES.SELECT, label: 'Training Phase', field: 'trainingPhase', options: [] },
        attendance: { type: FILTER_TYPES.SELECT, label: 'Attendance', field: 'attendanceStatus', options: ['completed', 'pending', 'not-started'] },
        search: { type: FILTER_TYPES.SEARCH, label: 'Search', field: '_search', options: [] }
    };
    
    function init(data, config = {}) {
        console.log('[Filters] Initializing with', data ? data.length : 0, 'records');
        if (!data || data.length === 0) {
            console.warn('[Filters] No data provided');
            return;
        }
        _data = data;
        _filteredData = [...data];
        buildFilterConfig(data);
        _filterConfig = { ..._filterConfig, ...config };
        _activeFilters = {};
        Object.keys(_filterConfig).forEach(key => {
            _activeFilters[key] = '';
        });
        renderFilters();
        setupEventListeners();
        console.log('[Filters] Initialization complete');
    }
    
    function buildFilterConfig(data) {
        _filterConfig = { ...DEFAULT_FILTERS };
        _filterConfig.department.options = getUniqueValues(data, 'department').sort();
        _filterConfig.grade.options = getUniqueValues(data, 'grade').sort();
        _filterConfig.status.options = getUniqueValues(data, 'status').sort();
        _filterConfig.sector.options = getUniqueValues(data, 'sector').sort();
        _filterConfig.program.options = getUniqueValues(data, 'trainingGroup').sort();
        _filterConfig.phase.options = getUniqueValues(data, 'trainingPhase').sort();
    }
    
    function getUniqueValues(data, field) {
        if (!data || !field) return [];
        const values = data
            .map(item => item[field])
            .filter(value => value && value.trim() !== '');
        return [...new Set(values)];
    }
    
    function renderFilters() {
        const container = document.getElementById('filter-container');
        if (!container) {
            renderIndividualFilters();
            return;
        }
        let html = '<div class="filters-grid">';
        Object.keys(_filterConfig).forEach(key => {
            if (key === 'search') return;
            const config = _filterConfig[key];
            const value = _activeFilters[key] || '';
            html += `
                <div class="filter-item">
                    <label for="filter-${key}" class="filter-label">${config.label}</label>
                    <select id="filter-${key}" class="filter-select" data-filter="${key}">
                        <option value="">All</option>
                        ${config.options.map(opt => 
                            `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        });
        html += `
            <div class="filter-actions">
                <button class="btn-filter-apply" id="apply-filters">Apply Filters</button>
                <button class="btn-filter-clear" id="clear-filters">Clear All</button>
            </div>
        </div>`;
        container.innerHTML = html;
        Object.keys(_activeFilters).forEach(key => {
            const select = document.getElementById(`filter-${key}`);
            if (select && _activeFilters[key]) {
                select.value = _activeFilters[key];
            }
        });
    }
    
    function renderIndividualFilters() {
        populateSelect('filter-department', _filterConfig.department.options, 'All Departments');
        populateSelect('filter-grade', _filterConfig.grade.options, 'All Grades');
        populateSelect('filter-status', _filterConfig.status.options, 'All Status');
        populateSelect('filter-sector', _filterConfig.sector.options, 'All Sectors');
        populateSelect('filter-program', _filterConfig.program.options, 'All Programs');
        populateSelect('filter-attendance', _filterConfig.attendance.options, 'All Attendance');
    }
    
    function populateSelect(id, options, placeholder = 'All') {
        const select = document.getElementById(id);
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = `<option value="">${placeholder}</option>`;
        if (options && options.length > 0) {
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                select.appendChild(option);
            });
        }
        if (currentValue) select.value = currentValue;
    }
    
    function setFilter(key, value, apply = true) {
        if (_isUpdating) return;
        _activeFilters[key] = value;
        if (apply) {
            applyFilters();
        }
        notifyListeners('filterChanged', { key, value });
    }
    
    function getFilter(key) {
        return _activeFilters[key];
    }
    
    function applyFilters() {
        if (_isUpdating) return _filteredData;
        _isUpdating = true;
        let filtered = [..._data];
        Object.keys(_activeFilters).forEach(key => {
            const value = _activeFilters[key];
            if (!value || value === '') return;
            const config = _filterConfig[key];
            if (!config) return;
            const field = config.field;
            if (config.type === FILTER_TYPES.SELECT) {
                filtered = filtered.filter(item => {
                    const itemValue = item[field] || '';
                    return itemValue === value;
                });
            } else if (config.type === FILTER_TYPES.SEARCH) {
                const searchValue = value.toLowerCase().trim();
                if (searchValue) {
                    filtered = filtered.filter(item => {
                        return Object.values(item).some(val => {
                            if (val === null || val === undefined) return false;
                            return String(val).toLowerCase().includes(searchValue);
                        });
                    });
                }
            }
        });
        _filteredData = filtered;
        _isUpdating = false;
        notifyListeners('filtersApplied', { 
            filters: { ..._activeFilters }, 
            resultCount: _filteredData.length 
        });
        return _filteredData;
    }
    
    function clearFilters() {
        if (_isUpdating) return;
        _activeFilters = {};
        Object.keys(_filterConfig).forEach(key => {
            _activeFilters[key] = '';
        });
        _filteredData = [..._data];
        document.querySelectorAll('.filter-select').forEach(select => select.value = '');
        document.querySelectorAll('.filter-input').forEach(input => input.value = '');
        document.getElementById('global-search').value = '';
        notifyListeners('filtersCleared', { resultCount: _filteredData.length });
    }
    
    function getFilteredData() {
        return [..._filteredData];
    }
    
    function getOriginalData() {
        return [..._data];
    }
    
    function getActiveFilters() {
        return { ..._activeFilters };
    }
    
    function getStats() {
        return {
            total: _data.length,
            filtered: _filteredData.length,
            activeFilterCount: Object.values(_activeFilters).filter(v => v && v !== '').length
        };
    }
    
    function on(event, callback) {
        if (!_listeners[event]) {
            _listeners[event] = [];
        }
        _listeners[event].push(callback);
    }
    
    function notifyListeners(event, data) {
        if (!_listeners[event]) return;
        _listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error('[Filters] Listener error:', e);
            }
        });
    }
    
    function setupEventListeners() {
        document.querySelectorAll('.filter-select[data-filter]').forEach(select => {
            select.addEventListener('change', function() {
                const key = this.dataset.filter;
                setFilter(key, this.value);
            });
        });
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            const debouncedSearch = Utils.debounce(function() {
                const key = 'search';
                setFilter(key, this.value);
            }, 300);
            globalSearch.addEventListener('input', debouncedSearch);
        }
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                clearFilters();
            });
        }
    }
    
    function filterByDepartment(department) { setFilter('department', department); }
    function filterByGrade(grade) { setFilter('grade', grade); }
    function filterByStatus(status) { setFilter('status', status); }
    function filterBySector(sector) { setFilter('sector', sector); }
    function filterByProgram(program) { setFilter('program', program); }
    function filterByAttendance(status) { setFilter('attendance', status); }
    
    return {
        init: init,
        setFilter: setFilter,
        getFilter: getFilter,
        applyFilters: applyFilters,
        clearFilters: clearFilters,
        getFilteredData: getFilteredData,
        getOriginalData: getOriginalData,
        getActiveFilters: getActiveFilters,
        getStats: getStats,
        filterByDepartment: filterByDepartment,
        filterByGrade: filterByGrade,
        filterByStatus: filterByStatus,
        filterBySector: filterBySector,
        filterByProgram: filterByProgram,
        filterByAttendance: filterByAttendance,
        on: on,
        getConfig: () => ({ ..._filterConfig }),
        FILTER_TYPES: FILTER_TYPES
    };
})();

if (typeof window !== 'undefined') {
    window.FiltersModule = FiltersModule;
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.CTIHApp && window.CTIHApp.getData) {
            const data = window.CTIHApp.getData();
            if (data && data.length > 0) {
                FiltersModule.init(data);
                if (window.CTIHApp.onDataUpdate) {
                    window.CTIHApp.onDataUpdate(function(type, newData) {
                        if (type === 'success' && newData) {
                            FiltersModule.init(newData);
                        }
                    });
                }
            }
        }
    }, 1500);
});