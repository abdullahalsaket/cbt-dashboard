// ============================================================
// EMPLOYEES MODULE - COMPETENCY TRAINING INTELLIGENCE HUB
// ============================================================

const EmployeesModule = (function() {
    'use strict';
    
    let _data = [];
    let _filteredData = [];
    let _currentPage = 1;
    let _pageSize = 25;
    let _sortField = 'name';
    let _sortDirection = 'asc';
    let _searchQuery = '';
    let _filters = {
        department: '',
        grade: '',
        status: '',
        sector: '',
        program: ''
    };
    let _isRendering = false;
    let _renderTimeout = null;
    
    const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
    
    function init(data) {
        console.log('[Employees] Initializing with', data ? data.length : 0, 'records');
        if (!data || data.length === 0) {
            console.warn('[Employees] No data provided');
            return;
        }
        _data = data;
        _filteredData = [...data];
        setupEventListeners();
        render();
        console.log('[Employees] Initialization complete');
    }
    
    function updateData(data) {
        if (!data) return;
        _data = data;
        _filteredData = [...data];
        _currentPage = 1;
        render();
    }
    
    function render() {
        if (_isRendering) return;
        _isRendering = true;
        applyFilters();
        applySorting();
        const paginated = getPaginatedData();
        renderTable(paginated);
        renderPagination();
        updateRecordCount(paginated);
        _isRendering = false;
    }
    
    function applyFilters() {
        let filtered = [..._data];
        if (_searchQuery) {
            const query = _searchQuery.toLowerCase().trim();
            filtered = filtered.filter(emp => {
                return Object.values(emp).some(value => {
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(query);
                });
            });
        }
        if (_filters.department) {
            filtered = filtered.filter(emp => emp.department === _filters.department);
        }
        if (_filters.grade) {
            filtered = filtered.filter(emp => emp.grade === _filters.grade);
        }
        if (_filters.status) {
            filtered = filtered.filter(emp => emp.status === _filters.status);
        }
        if (_filters.sector) {
            filtered = filtered.filter(emp => emp.sector === _filters.sector);
        }
        if (_filters.program) {
            filtered = filtered.filter(emp => emp.trainingGroup === _filters.program);
        }
        _filteredData = filtered;
    }
    
    function applySorting() {
        const field = _sortField;
        const direction = _sortDirection;
        _filteredData.sort((a, b) => {
            let valA = a[field] || '';
            let valB = b[field] || '';
            if (!isNaN(valA) && !isNaN(valB)) {
                valA = Number(valA);
                valB = Number(valB);
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    function getPaginatedData() {
        const total = _filteredData.length;
        const totalPages = Math.ceil(total / _pageSize) || 1;
        const currentPage = Math.min(_currentPage, totalPages);
        const start = (currentPage - 1) * _pageSize;
        const end = Math.min(start + _pageSize, total);
        return {
            data: _filteredData.slice(start, end),
            total: total,
            totalPages: totalPages,
            currentPage: currentPage,
            pageSize: _pageSize,
            start: start,
            end: end,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1
        };
    }
    
    function renderTable(paginated) {
        const tbody = document.getElementById('employee-table-body');
        if (!tbody) return;
        const { data, total, start, end } = paginated;
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-inbox me-2"></i> No employees found matching your criteria
                    </td>
                </tr>
            `;
            return;
        }
        let html = '';
        for (let i = 0; i < data.length; i++) {
            const emp = data[i];
            html += `
                <tr>
                    <td><span class="text-muted">${emp.id || 'N/A'}</span></td>
                    <td><strong>${emp.name || 'Unknown'}</strong></td>
                    <td>${Utils.truncate(emp.title || '', 30)}</td>
                    <td>${emp.department || 'N/A'}</td>
                    <td>${emp.grade || 'N/A'}</td>
                    <td>${getStatusBadge(emp.status)}</td>
                    <td>${getAttendanceBadge(emp.attendanceStatus)}</td>
                    <td>
                        <button class="action-btn view-btn" data-id="${emp.id}" title="View Profile">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn print-btn" data-id="${emp.id}" title="Print Profile">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
        tbody.innerHTML = html;
        tbody.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                showEmployeeProfile(id);
            });
        });
        tbody.querySelectorAll('.print-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                printEmployeeProfile(id);
            });
        });
    }
    
    function renderPagination() {
        const total = _filteredData.length;
        const totalPages = Math.ceil(total / _pageSize) || 1;
        const currentPage = Math.min(_currentPage, totalPages);
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
        const prevBtn = document.querySelector('[data-page="prev"]');
        const nextBtn = document.querySelector('[data-page="next"]');
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }
    
    function updateRecordCount(paginated) {
        const countDisplay = document.getElementById('employee-record-count');
        if (!countDisplay) return;
        if (paginated) {
            const { total, start, end } = paginated;
            if (total === 0) {
                countDisplay.textContent = 'No records found';
            } else {
                countDisplay.textContent = `Showing ${start + 1}-${end} of ${total} records`;
            }
        }
    }
    
    function showEmployeeProfile(id) {
        const emp = _data.find(d => d.id === id);
        if (!emp) {
            showToast('error', 'Employee not found');
            return;
        }
        const modalBody = document.getElementById('employeeModalBody');
        if (!modalBody) return;
        modalBody.innerHTML = `
            <div class="profile-container">
                <div class="profile-header d-flex align-center gap-3 mb-4">
                    <div class="profile-avatar" style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#6C63FF,#8B83FF);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;flex-shrink:0;">
                        ${emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <h4 class="mb-0">${emp.name || 'Unknown'}</h4>
                        <p class="text-muted mb-0">${emp.title || 'No title'} · ID: ${emp.id || 'N/A'}</p>
                    </div>
                </div>
                <div class="profile-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
                    <div class="profile-field"><div class="text-muted small">Department</div><div><strong>${emp.department || 'N/A'}</strong></div></div>
                    <div class="profile-field"><div class="text-muted small">Grade</div><div><strong>${emp.grade || 'N/A'}</strong></div></div>
                    <div class="profile-field"><div class="text-muted small">Sector</div><div><strong>${emp.sector || 'N/A'}</strong></div></div>
                    <div class="profile-field"><div class="text-muted small">Status</div><div>${getStatusBadge(emp.status)}</div></div>
                    <div class="profile-field"><div class="text-muted small">Training Group</div><div><strong>${emp.trainingGroup || 'N/A'}</strong></div></div>
                    <div class="profile-field"><div class="text-muted small">Training Phase</div><div><strong>${emp.trainingPhase || 'N/A'}</strong></div></div>
                    <div class="profile-field"><div class="text-muted small">Attendance Status</div><div>${getAttendanceBadge(emp.attendanceStatus)}</div></div>
                    <div class="profile-field"><div class="text-muted small">Training Location</div><div><strong>${emp.trainingLocation || 'N/A'}</strong></div></div>
                </div>
                <div class="profile-programs" style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">
                    <h5 style="font-size:14px;font-weight:600;margin-bottom:12px;">Training Programs</h5>
                    <div class="program-list" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div class="program-item" style="display:flex;justify-content:space-between;padding:4px 8px;border-radius:6px;background:rgba(255,255,255,0.03);">
                            <span>7 Sens Program</span>
                            <span>${getProgramBadge(emp.sevenSensProgram)}</span>
                        </div>
                        <div class="program-item" style="display:flex;justify-content:space-between;padding:4px 8px;border-radius:6px;background:rgba(255,255,255,0.03);">
                            <span>Analytical Thinking</span>
                            <span>${getProgramBadge(emp.analyticalThinking)}</span>
                        </div>
                        <div class="program-item" style="display:flex;justify-content:space-between;padding:4px 8px;border-radius:6px;background:rgba(255,255,255,0.03);">
                            <span>Mind Field</span>
                            <span>${getProgramBadge(emp.mindField)}</span>
                        </div>
                        <div class="program-item" style="display:flex;justify-content:space-between;padding:4px 8px;border-radius:6px;background:rgba(255,255,255,0.03);">
                            <span>Leadership</span>
                            <span>${getProgramBadge(emp.leadership)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
        modal.show();
    }
    
    function printEmployeeProfile(id) {
        showEmployeeProfile(id);
        setTimeout(() => {
            const modalContent = document.querySelector('#employeeModal .modal-content');
            if (modalContent) {
                const printWindow = window.open('', '_blank', 'width=600,height=600');
                if (printWindow) {
                    printWindow.document.write(`
                        <html><head><title>Employee Profile</title></head>
                        <body><div style="font-family: Arial, sans-serif; padding: 20px;">${modalContent.innerHTML}</div></body></html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                }
            }
        }, 500);
    }
    
    function getStatusBadge(status) {
        const map = {
            'active': '<span class="status-badge active"><i class="fas fa-circle small"></i> Active</span>',
            'sick': '<span class="status-badge sick"><i class="fas fa-circle small"></i> Sick</span>',
            'legal': '<span class="status-badge legal"><i class="fas fa-circle small"></i> Legal</span>',
            'inactive': '<span class="status-badge inactive"><i class="fas fa-circle small"></i> Inactive</span>'
        };
        return map[status] || '<span class="status-badge inactive">Unknown</span>';
    }
    
    function getAttendanceBadge(status) {
        const map = {
            'completed': '<span class="attendance-badge completed"><i class="fas fa-check"></i> Completed</span>',
            'pending': '<span class="attendance-badge pending"><i class="fas fa-clock"></i> Pending</span>',
            'not-started': '<span class="attendance-badge missing"><i class="fas fa-minus"></i> Not Started</span>'
        };
        return map[status] || '<span class="attendance-badge missing">Unknown</span>';
    }
    
    function getProgramBadge(value) {
        if (!value) return '<span class="badge bg-secondary">Not Started</span>';
        const lower = value.toLowerCase();
        if (lower === 'attend' || lower === 'attended') {
            return '<span class="badge bg-success">Completed</span>';
        }
        if (lower === 'not attend') {
            return '<span class="badge bg-warning">Pending</span>';
        }
        return '<span class="badge bg-secondary">Not Started</span>';
    }
    
    function showToast(type, message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    function setupEventListeners() {
        document.querySelectorAll('[data-sort]').forEach(th => {
            th.addEventListener('click', function() {
                const field = this.dataset.sort;
                if (_sortField === field) {
                    _sortDirection = _sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    _sortField = field;
                    _sortDirection = 'asc';
                }
                _currentPage = 1;
                render();
                document.querySelectorAll('[data-sort]').forEach(th => {
                    th.classList.remove('sorted-asc', 'sorted-desc');
                    if (th.dataset.sort === _sortField) {
                        th.classList.add(_sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
                    }
                });
            });
        });
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const direction = this.dataset.page;
                const total = _filteredData.length;
                const totalPages = Math.ceil(total / _pageSize) || 1;
                if (direction === 'prev') {
                    _currentPage = Math.max(1, _currentPage - 1);
                } else if (direction === 'next') {
                    _currentPage = Math.min(totalPages, _currentPage + 1);
                }
                render();
            });
        });
        const pageSizeSelect = document.getElementById('page-size-select');
        if (pageSizeSelect) {
            pageSizeSelect.value = _pageSize;
            pageSizeSelect.addEventListener('change', function() {
                _pageSize = parseInt(this.value);
                _currentPage = 1;
                render();
            });
        }
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', function() {
                const filterMap = {
                    'filter-department': 'department',
                    'filter-grade': 'grade',
                    'filter-status': 'status',
                    'filter-sector': 'sector',
                    'filter-program': 'program'
                };
                const key = filterMap[this.id];
                if (key) {
                    _filters[key] = this.value;
                    _currentPage = 1;
                    render();
                }
            });
        });
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                if (_renderTimeout) clearTimeout(_renderTimeout);
                _renderTimeout = setTimeout(() => {
                    _searchQuery = this.value;
                    _currentPage = 1;
                    render();
                    _renderTimeout = null;
                }, 200);
            });
        }
        const exportBtn = document.getElementById('export-employees-csv');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                exportEmployeesCSV();
            });
        }
    }
    
    function exportEmployeesCSV() {
        const data = _filteredData;
        if (!data || data.length === 0) {
            showToast('warning', 'No data to export');
            return;
        }
        const fields = ['id', 'name', 'title', 'department', 'grade', 'status', 'sector', 'trainingGroup', 'trainingPhase', 'attendanceStatus'];
        const headers = ['ID', 'Name', 'Title', 'Department', 'Grade', 'Status', 'Sector', 'Training Group', 'Training Phase', 'Attendance'];
        const csvData = data.map(emp => fields.map(field => emp[field] || ''));
        const csvRows = [headers.join(','), ...csvData.map(row => row.join(','))];
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employees_export_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('success', `Exported ${data.length} employees to CSV`);
    }
    
    return {
        init: init,
        updateData: updateData,
        render: render,
        setFilter: (key, value) => { _filters[key] = value; _currentPage = 1; render(); },
        setSearch: (query) => { _searchQuery = query; _currentPage = 1; render(); },
        clearFilters: () => {
            _filters = { department: '', grade: '', status: '', sector: '', program: '' };
            _searchQuery = '';
            _currentPage = 1;
            document.querySelectorAll('.filter-select').forEach(select => select.value = '');
            document.getElementById('global-search').value = '';
            render();
        },
        getFilteredData: () => [..._filteredData],
        exportCSV: exportEmployeesCSV
    };
})();

if (typeof window !== 'undefined') {
    window.EmployeesModule = EmployeesModule;
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.CTIHApp && window.CTIHApp.getData) {
            const data = window.CTIHApp.getData();
            if (data && data.length > 0) {
                EmployeesModule.init(data);
            }
        }
    }, 1500);
});