// ============================================================
// APP MODULE - COMPETENCY TRAINING INTELLIGENCE HUB
// ============================================================

/**
 * CTIHApp - Main application controller
 * Orchestrates all modules and handles data flow
 */
const CTIHApp = (function() {
    'use strict';
    
    // ============================================================
    // PRIVATE STATE
    // ============================================================
    
    let _state = {
        initialized: false,
        data: [],
        filteredData: [],
        currentSection: 'executive',
        currentPage: 1,
        pageSize: 25,
        searchQuery: '',
        filters: {
            department: '',
            grade: '',
            status: '',
            sector: '',
            program: ''
        },
        sort: {
            field: 'name',
            direction: 'asc'
        }
    };
    
    let _charts = {};
    let _isLoading = false;
    let _dataReady = false;
    
    // ============================================================
    // CONSTANTS
    // ============================================================
    
    const SECTIONS = {
        EXECUTIVE: 'executive',
        EMPLOYEES: 'employees',
        PROGRAMS: 'programs',
        DEPARTMENTS: 'departments',
        ANALYTICS: 'analytics',
        REPORTS: 'reports',
        QUALITY: 'quality'
    };
    
    // ============================================================
    // PUBLIC METHODS
    // ============================================================
    
    /**
     * Initialize the application
     */
    function init() {
        if (_state.initialized) {
            console.warn('[App] Already initialized');
            return;
        }
        
        console.log('[App] Initializing CTIH Application...');
        _isLoading = true;
        
        // Show loader progress
        updateLoaderProgress(60);
        
        // Initialize Google Sync
        if (window.GoogleSync) {
            window.GoogleSync.onDataUpdate(handleDataUpdate);
            
            // Check if data is already loaded
            const existingData = window.GoogleSync.getData();
            if (existingData && existingData.length > 0) {
                handleDataUpdate('success', existingData);
            } else {
                console.log('[App] Waiting for data...');
            }
        } else {
            console.error('[App] GoogleSync not found!');
            showToast('error', 'Failed to initialize data sync module');
        }
        
        // Setup event listeners
        setupEventListeners();
        
        _state.initialized = true;
        _isLoading = false;
        
        console.log('[App] Initialization complete');
        updateLoaderProgress(100);
    }
    
    /**
     * Handle data update from GoogleSync
     * @param {string} type - 'success' or 'error'
     * @param {*} data - Data or error
     */
    function handleDataUpdate(type, data) {
        if (type === 'success' && data && data.length > 0) {
            console.log(`[App] Data update: ${data.length} records`);
            _state.data = data;
            _state.filteredData = [...data];
            _dataReady = true;
            
            // Update UI with data
            renderAll();
            
            // Hide loader
            document.getElementById('app-loader')?.classList.add('hidden');
            document.getElementById('app-wrapper')?.style.setProperty('display', 'block');
            
            // Update badge counts
            updateBadges();
            
            showToast('success', `Loaded ${data.length} employee records`);
        } else if (type === 'error') {
            console.error('[App] Data error:', data);
            showToast('error', 'Failed to load data. Please refresh.');
            document.getElementById('app-loader')?.classList.add('hidden');
        }
    }
    
    // ============================================================
    // RENDER FUNCTIONS
    // ============================================================
    
    /**
     * Render all sections with current data
     */
    function renderAll() {
        if (!_dataReady || _state.data.length === 0) {
            console.warn('[App] No data to render');
            return;
        }
        
        console.log('[App] Rendering all sections');
        
        // Update KPIs
        renderKPIs();
        
        // Render charts
        renderCharts();
        
        // Render employee table
        renderEmployeeTable();
        
        // Render filters
        renderFilters();
        
        // Render quality metrics
        renderQualityMetrics();
    }
    
    /**
     * Render KPI cards
     */
    function renderKPIs() {
        const data = _state.filteredData;
        const total = data.length;
        
        // Calculate metrics
        const attended = data.filter(d => d.hasAttended === true).length;
        const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;
        
        const completed = data.filter(d => d.attendanceStatus === 'completed').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        const pending = data.filter(d => d.attendanceStatus === 'pending').length;
        
        // Count unique programs
        const programs = new Set(data.map(d => d.trainingGroup).filter(Boolean));
        const programCount = programs.size;
        
        // Quality score (simplified)
        const qualityScore = calculateQualityScore(data);
        
        // Update DOM
        setElementText('kpi-total-employees', total.toLocaleString());
        setElementText('kpi-attendance', `${attendanceRate}%`);
        setElementText('kpi-completion', `${completionRate}%`);
        setElementText('kpi-quality', `${qualityScore}%`);
        setElementText('kpi-programs', programCount.toString());
        setElementText('kpi-pending', pending.toLocaleString());
        
        // Update employee count badge
        setElementText('employee-count-badge', total.toLocaleString());
        setElementText('quality-badge', `${qualityScore}%`);
        
        // Update quality badge color
        const qualityBadge = document.getElementById('quality-badge');
        if (qualityBadge) {
            if (qualityScore >= 80) {
                qualityBadge.style.background = 'rgba(0, 200, 83, 0.2)';
                qualityBadge.style.color = '#00C853';
            } else if (qualityScore >= 60) {
                qualityBadge.style.background = 'rgba(255, 179, 0, 0.2)';
                qualityBadge.style.color = '#FFB300';
            } else {
                qualityBadge.style.background = 'rgba(255, 23, 68, 0.2)';
                qualityBadge.style.color = '#FF1744';
            }
        }
    }
    
    /**
     * Calculate data quality score
     * @param {Array} data - Data array
     * @returns {number} - Score 0-100
     */
    function calculateQualityScore(data) {
        if (!data || data.length === 0) return 0;
        
        let totalChecks = 0;
        let passedChecks = 0;
        
        data.forEach(record => {
            // Check required fields
            const fields = [
                { key: 'id', required: true },
                { key: 'name', required: true },
                { key: 'department', required: true },
                { key: 'grade', required: true },
                { key: 'status', required: true },
                { key: 'sector', required: false },
                { key: 'trainingGroup', required: false }
            ];
            
            fields.forEach(field => {
                totalChecks++;
                const value = record[field.key] || '';
                if (field.required) {
                    if (value && value.trim() !== '') {
                        passedChecks++;
                    }
                } else {
                    passedChecks++; // Non-required fields always pass
                }
            });
        });
        
        return totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    }
    
    // ============================================================
    // CHART RENDERING
    // ============================================================
    
    /**
     * Render all charts
     */
    function renderCharts() {
        if (typeof echarts === 'undefined') {
            console.warn('[App] ECharts not loaded');
            return;
        }
        
        const data = _state.filteredData;
        if (data.length === 0) return;
        
        // Create charts with delay to ensure DOM is ready
        setTimeout(() => {
            renderDistributionChart(data);
            renderAttendanceChart(data);
            renderDepartmentChart(data);
            renderGradeChart(data);
            renderGaugeChart(data);
            renderProgramsChart(data);
            renderProgramRanking(data);
            renderHeatmap(data);
            renderDepartmentRadar(data);
            renderDepartmentSize(data);
            renderDepartmentCompletion(data);
            renderTrendChart(data);
            renderTreemap(data);
            renderDoughnut(data);
            renderRadar(data);
            renderQualityChart(data);
        }, 100);
    }
    
    /**
     * Render distribution chart
     */
    function renderDistributionChart(data) {
        const container = document.getElementById('chart-distribution');
        if (!container) return;
        
        const deptCounts = {};
        data.forEach(d => {
            const dept = d.department || 'Unknown';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        
        const sorted = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: sorted.map(([name]) => name),
                axisLabel: {
                    color: '#A0A0C0',
                    fontSize: 11,
                    rotate: 30
                },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: '#A0A0C0' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            series: [{
                type: 'bar',
                data: sorted.map(([, count]) => count),
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#6C63FF' },
                        { offset: 1, color: '#8B83FF' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                barWidth: '60%'
            }]
        });
        
        _charts.distribution = chart;
        window.addEventListener('resize', () => chart.resize());
    }
    
    /**
     * Render attendance chart
     */
    function renderAttendanceChart(data) {
        const container = document.getElementById('chart-attendance');
        if (!container) return;
        
        const attendance = {
            'Completed': data.filter(d => d.attendanceStatus === 'completed').length,
            'Pending': data.filter(d => d.attendanceStatus === 'pending').length,
            'Not Started': data.filter(d => d.attendanceStatus === 'not-started').length
        };
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                right: '5%',
                top: 'center',
                textStyle: { color: '#A0A0C0', fontSize: 12 },
                itemWidth: 12,
                itemHeight: 12
            },
            series: [{
                name: 'Attendance',
                type: 'pie',
                radius: ['45%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 4,
                    borderColor: 'rgba(10, 10, 26, 0.5)',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    color: '#A0A0C0',
                    fontSize: 11,
                    formatter: '{b}\n{d}%'
                },
                labelLine: {
                    lineStyle: { color: 'rgba(255,255,255,0.1)' }
                },
                emphasis: {
                    scale: true,
                    scaleSize: 8
                },
                data: [
                    { value: attendance.Completed, name: 'Completed', itemStyle: { color: '#00C853' } },
                    { value: attendance.Pending, name: 'Pending', itemStyle: { color: '#FFB300' } },
                    { value: attendance['Not Started'], name: 'Not Started', itemStyle: { color: '#66668A' } }
                ]
            }]
        });
        
        _charts.attendance = chart;
        window.addEventListener('resize', () => chart.resize());
    }
    
    /**
     * Render department chart
     */
    function renderDepartmentChart(data) {
        const container = document.getElementById('chart-department');
        if (!container) return;
        
        const deptData = {};
        data.forEach(d => {
            const dept = d.department || 'Unknown';
            if (!deptData[dept]) {
                deptData[dept] = { total: 0, completed: 0 };
            }
            deptData[dept].total++;
            if (d.attendanceStatus === 'completed') {
                deptData[dept].completed++;
            }
        });
        
        const sorted = Object.entries(deptData)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 8);
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: sorted.map(([name]) => name),
                axisLabel: {
                    color: '#A0A0C0',
                    fontSize: 10,
                    rotate: 20
                },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
            },
            yAxis: {
                type: 'value',
                max: 100,
                axisLabel: {
                    color: '#A0A0C0',
                    formatter: '{value}%'
                },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            series: [{
                type: 'bar',
                data: sorted.map(([, stats]) => {
                    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                    return rate;
                }),
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#00C853' },
                        { offset: 1, color: '#33D975' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                barWidth: '50%',
                label: {
                    show: true,
                    position: 'top',
                    color: '#A0A0C0',
                    fontSize: 11,
                    formatter: '{c}%'
                }
            }]
        });
        
        _charts.department = chart;
        window.addEventListener('resize', () => chart.resize());
    }
    
    /**
     * Render grade chart
     */
    function renderGradeChart(data) {
        const container = document.getElementById('chart-grade');
        if (!container) return;
        
        const gradeCounts = {};
        data.forEach(d => {
            const grade = d.grade || 'Unknown';
            gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        });
        
        const sorted = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1]);
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                right: '5%',
                top: 'center',
                textStyle: { color: '#A0A0C0', fontSize: 11 },
                itemWidth: 10,
                itemHeight: 10
            },
            series: [{
                type: 'pie',
                radius: ['40%', '65%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 4,
                    borderColor: 'rgba(10, 10, 26, 0.5)',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    color: '#A0A0C0',
                    fontSize: 10,
                    formatter: '{b}\n{d}%'
                },
                labelLine: {
                    lineStyle: { color: 'rgba(255,255,255,0.1)' }
                },
                data: sorted.map(([name, count]) => ({
                    name: name,
                    value: count,
                    itemStyle: {
                        color: getColorForGrade(name)
                    }
                }))
            }]
        });
        
        _charts.grade = chart;
        window.addEventListener('resize', () => chart.resize());
    }
    
    function getColorForGrade(grade) {
        const colors = {
            'Executive': '#6C63FF',
            'Top Management': '#FF6B6B',
            'Middle Management': '#4ECDC4',
            'Supervisory': '#FFD93D',
            'Staff': '#6BCB77',
            'General Staff': '#4D96FF',
            'Clerical': '#FF6B9D'
        };
        return colors[grade] || '#66668A';
    }
    
    /**
     * Render gauge chart
     */
    function renderGaugeChart(data) {
        const container = document.getElementById('chart-gauge');
        if (!container) return;
        
        const qualityScore = calculateQualityScore(data);
        
        const chart = echarts.init(container);
        chart.setOption({
            series: [{
                type: 'gauge',
                startAngle: 210,
                endAngle: -30,
                min: 0,
                max: 100,
                splitNumber: 5,
                progress: {
                    show: true,
                    width: 12,
                    roundCap: true,
                    itemStyle: {
                        color: qualityScore >= 80 ? '#00C853' : 
                               qualityScore >= 60 ? '#FFB300' : '#FF1744'
                    }
                },
                axisLine: {
                    lineStyle: {
                        width: 12,
                        color: [
                            [0.3, '#FF1744'],
                            [0.6, '#FFB300'],
                            [1, '#00C853']
                        ]
                    }
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    length: 8,
                    lineStyle: {
                        width: 2,
                        color: '#A0A0C0'
                    }
                },
                axisLabel: {
                    color: '#A0A0C0',
                    fontSize: 10,
                    distance: 20
                },
                pointer: {
                    show: false
                },
                title: {
                    show: false
                },
                detail: {
                    valueAnimation: true,
                    formatter: '{value}%',
                    color: '#FFFFFF',
                    fontSize: 24,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    offsetCenter: [0, '30%']
                },
                data: [{
                    value: qualityScore
                }]
            }]
        });
        
        _charts.gauge = chart;
        window.addEventListener('resize', () => chart.resize());
    }
    
    // ============================================================
    // EMPLOYEE TABLE
    // ============================================================
    
    /**
     * Render employee table with current data
     */
    function renderEmployeeTable() {
        const tbody = document.getElementById('employee-table-body');
        if (!tbody) return;
        
        const data = getFilteredAndSortedData();
        const total = data.length;
        const start = (_state.currentPage - 1) * _state.pageSize;
        const end = Math.min(start + _state.pageSize, total);
        const pageData = data.slice(start, end);
        
        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-inbox me-2"></i> No employees found
                    </td>
                </tr>
            `;
            updatePagination(total);
            return;
        }
        
        tbody.innerHTML = pageData.map(emp => `
            <tr>
                <td><span class="text-muted">${emp.id || 'N/A'}</span></td>
                <td><strong>${emp.name || 'Unknown'}</strong></td>
                <td>${truncateText(emp.title || '', 30)}</td>
                <td>${emp.department || 'N/A'}</td>
                <td>${emp.grade || 'N/A'}</td>
                <td>${getStatusBadge(emp.status)}</td>
                <td>${getAttendanceBadge(emp.attendanceStatus)}</td>
                <td>
                    <button class="action-btn view-btn" data-id="${emp.id}" title="View Profile">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Update record count
        setElementText('employee-record-count', `Showing ${start + 1}-${end} of ${total} records`);
        
        // Update pagination
        updatePagination(total);
        
        // Add click listeners for view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                showEmployeeProfile(id);
            });
        });
    }
    
    /**
     * Get filtered and sorted data
     * @returns {Array} - Filtered and sorted data
     */
    function getFilteredAndSortedData() {
        let data = [..._state.filteredData];
        
        // Apply search
        if (_state.searchQuery) {
            const query = _state.searchQuery.toLowerCase();
            data = data.filter(emp => {
                return Object.values(emp).some(val => {
                    if (typeof val === 'string') {
                        return val.toLowerCase().includes(query);
                    }
                    return false;
                });
            });
        }
        
        // Apply sorting
        const { field, direction } = _state.sort;
        data.sort((a, b) => {
            let valA = a[field] || '';
            let valB = b[field] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return data;
    }
    
    /**
     * Update pagination controls
     * @param {number} total - Total items
     */
    function updatePagination(total) {
        const totalPages = Math.ceil(total / _state.pageSize) || 1;
        const current = Math.min(_state.currentPage, totalPages);
        
        setElementText('page-info', `Page ${current} of ${totalPages}`);
        
        const prevBtn = document.querySelector('[data-page="prev"]');
        const nextBtn = document.querySelector('[data-page="next"]');
        if (prevBtn) prevBtn.disabled = current <= 1;
        if (nextBtn) nextBtn.disabled = current >= totalPages;
    }
    
    // ============================================================
    // FILTERS
    // ============================================================
    
    /**
     * Render filter dropdowns
     */
    function renderFilters() {
        const data = _state.data;
        if (data.length === 0) return;
        
        // Departments
        const depts = [...new Set(data.map(d => d.department).filter(Boolean))].sort();
        populateFilter('filter-department', depts, 'All Departments');
        
        // Grades
        const grades = [...new Set(data.map(d => d.grade).filter(Boolean))].sort();
        populateFilter('filter-grade', grades, 'All Grades');
        
        // Status
        const statuses = [...new Set(data.map(d => d.status).filter(Boolean))].sort();
        populateFilter('filter-status', statuses, 'All Status');
    }
    
    /**
     * Populate a filter dropdown
     * @param {string} id - Element ID
     * @param {Array} options - Array of options
     * @param {string} placeholder - Default option text
     */
    function populateFilter(id, options, placeholder) {
        const select = document.getElementById(id);
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = `<option value="">${placeholder}</option>`;
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            select.appendChild(option);
        });
        if (currentValue) select.value = currentValue;
    }
    
    // ============================================================
    // QUALITY METRICS
    // ============================================================
    
    /**
     * Render quality metrics
     */
    function renderQualityMetrics() {
        const data = _state.data;
        if (data.length === 0) return;
        
        const metrics = {
            total: data.length,
            hasId: data.filter(d => d.id && d.id !== '').length,
            hasName: data.filter(d => d.name && d.name !== '').length,
            hasDepartment: data.filter(d => d.department && d.department !== '').length,
            hasGrade: data.filter(d => d.grade && d.grade !== '').length,
            hasStatus: data.filter(d => d.status && d.status !== '').length,
            duplicates: findDuplicates(data)
        };
        
        // Update quality score
        const score = calculateQualityScore(data);
        setElementText('quality-score-large .score-number', `${score}%`);
        
        // Update metrics grid
        const metricsContainer = document.getElementById('quality-metrics');
        if (metricsContainer) {
            metricsContainer.innerHTML = `
                <div class="quality-metric">
                    <div class="metric-label">Total Records</div>
                    <div class="metric-value">${metrics.total}</div>
                </div>
                <div class="quality-metric">
                    <div class="metric-label">Valid IDs</div>
                    <div class="metric-value">${metrics.hasId} (${Math.round(metrics.hasId/metrics.total*100)}%)</div>
                </div>
                <div class="quality-metric">
                    <div class="metric-label">Valid Names</div>
                    <div class="metric-value">${metrics.hasName} (${Math.round(metrics.hasName/metrics.total*100)}%)</div>
                </div>
                <div class="quality-metric">
                    <div class="metric-label">Valid Departments</div>
                    <div class="metric-value">${metrics.hasDepartment} (${Math.round(metrics.hasDepartment/metrics.total*100)}%)</div>
                </div>
            `;
        }
        
        // Update issues list
        const issuesList = document.getElementById('quality-issues-list');
        if (issuesList) {
            const issues = [];
            if (metrics.duplicates > 0) {
                issues.push({ icon: 'fa-exclamation-circle', text: `Duplicate IDs found`, count: metrics.duplicates });
            }
            if (metrics.total - metrics.hasId > 0) {
                issues.push({ icon: 'fa-times-circle', text: `Missing IDs`, count: metrics.total - metrics.hasId });
            }
            if (metrics.total - metrics.hasName > 0) {
                issues.push({ icon: 'fa-times-circle', text: `Missing Names`, count: metrics.total - metrics.hasName });
            }
            if (metrics.total - metrics.hasDepartment > 0) {
                issues.push({ icon: 'fa-times-circle', text: `Missing Departments`, count: metrics.total - metrics.hasDepartment });
            }
            
            if (issues.length === 0) {
                issuesList.innerHTML = `
                    <div class="issue-item">
                        <i class="fas fa-check-circle" style="color: #00C853;"></i>
                        <span>All data validation checks passed</span>
                    </div>
                `;
            } else {
                issuesList.innerHTML = issues.map(issue => `
                    <div class="issue-item">
                        <i class="fas ${issue.icon}"></i>
                        <span>${issue.text}</span>
                        <span class="issue-count">${issue.count}</span>
                    </div>
                `).join('');
            }
        }
    }
    
    /**
     * Find duplicate IDs in data
     * @param {Array} data - Data array
     * @returns {number} - Number of duplicate entries
     */
    function findDuplicates(data) {
        const idMap = {};
        let duplicates = 0;
        data.forEach(d => {
            const id = d.id;
            if (id && id !== '') {
                if (idMap[id]) {
                    duplicates++;
                } else {
                    idMap[id] = true;
                }
            }
        });
        return duplicates;
    }
    
    // ============================================================
    // EMPLOYEE PROFILE
    // ============================================================
    
    /**
     * Show employee profile in modal
     * @param {string} id - Employee ID
     */
    function showEmployeeProfile(id) {
        const emp = _state.data.find(d => d.id === id);
        if (!emp) {
            showToast('error', 'Employee not found');
            return;
        }
        
        const modalBody = document.getElementById('employeeModalBody');
        if (!modalBody) return;
        
        modalBody.innerHTML = `
            <div class="profile-header d-flex align-center gap-3 mb-4">
                <div class="user-avatar" style="width:56px;height:56px;font-size:20px;">
                    ${emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                    <h4 class="mb-0">${emp.name || 'Unknown'}</h4>
                    <p class="text-muted mb-0">${emp.title || 'No title'} · ${emp.id || 'No ID'}</p>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-6 col-md-4">
                    <div class="text-muted small">Department</div>
                    <div><strong>${emp.department || 'N/A'}</strong></div>
                </div>
                <div class="col-6 col-md-4">
                    <div class="text-muted small">Grade</div>
                    <div><strong>${emp.grade || 'N/A'}</strong></div>
                </div>
                <div class="col-6 col-md-4">
                    <div class="text-muted small">Status</div>
                    <div>${getStatusBadge(emp.status)}</div>
                </div>
                <div class="col-6 col-md-4">
                    <div class="text-muted small">Sector</div>
                    <div><strong>${emp.sector || 'N/A'}</strong></div>
                </div>
                <div class="col-6 col-md-4">
                    <div class="text-muted small">Training Group</div>
                    <div><strong>${emp.trainingGroup || 'N/A'}</strong></div>
                </div>
                <div class="col-6 col-md-4">
                    <div class="text-muted small">Training Phase</div>
                    <div><strong>${emp.trainingPhase || 'N/A'}</strong></div>
                </div>
                <div class="col-12">
                    <div class="text-muted small">Attendance Status</div>
                    <div class="mt-1">${getAttendanceBadge(emp.attendanceStatus)}</div>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
        modal.show();
    }
    
    // ============================================================
    // UI HELPERS
    // ============================================================
    
    function setElementText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
    
    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    function getStatusBadge(status) {
        const map = {
            'active': '<span class="status-badge active"><i class="fas fa-circle small"></i> Active</span>',
            'sick': '<span class="status-badge sick"><i class="fas fa-circle small"></i> Sick</span>',
            'legal': '<span class="status-badge legal"><i class="fas fa-circle small"></i> Legal</span>',
            'inactive': '<span class="status-badge inactive"><i class="fas fa-circle small"></i> Inactive</span>'
        };
        return map[status] || `<span class="status-badge inactive">${status || 'Unknown'}</span>`;
    }
    
    function getAttendanceBadge(status) {
        const map = {
            'completed': '<span class="attendance-badge completed"><i class="fas fa-check"></i> Completed</span>',
            'pending': '<span class="attendance-badge pending"><i class="fas fa-clock"></i> Pending</span>',
            'not-started': '<span class="attendance-badge missing"><i class="fas fa-minus"></i> Not Started</span>'
        };
        return map[status] || `<span class="attendance-badge missing">${status || 'Unknown'}</span>`;
    }
    
    function showToast(type, message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    function updateBadges() {
        const total = _state.data.length;
        const badge = document.getElementById('employee-count-badge');
        if (badge) badge.textContent = total.toLocaleString();
    }
    
    function updateLoaderProgress(percent) {
        const bar = document.getElementById('loader-progress-bar');
        if (bar) bar.style.width = Math.min(percent, 100) + '%';
    }
    
    // ============================================================
    // EVENT LISTENERS
    // ============================================================
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // ---- Navigation ---- //
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function() {
                const section = this.dataset.section;
                switchSection(section);
            });
        });
        
        // ---- Mobile Toggle ---- //
        const mobileToggle = document.getElementById('mobile-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', function() {
                document.getElementById('app-sidebar').classList.toggle('open');
            });
        }
        
        // ---- Global Search ---- //
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    _state.searchQuery = this.value.trim();
                    _state.currentPage = 1;
                    renderEmployeeTable();
                }, 300);
            });
        }
        
        // ---- Table Sort ---- //
        document.querySelectorAll('[data-sort]').forEach(th => {
            th.addEventListener('click', function() {
                const field = this.dataset.sort;
                if (_state.sort.field === field) {
                    _state.sort.direction = _state.sort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    _state.sort.field = field;
                    _state.sort.direction = 'asc';
                }
                _state.currentPage = 1;
                renderEmployeeTable();
                updateSortIndicators();
            });
        });
        
        // ---- Pagination ---- //
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const direction = this.dataset.page;
                const total = getFilteredAndSortedData().length;
                const totalPages = Math.ceil(total / _state.pageSize);
                if (direction === 'prev') {
                    _state.currentPage = Math.max(1, _state.currentPage - 1);
                } else if (direction === 'next') {
                    _state.currentPage = Math.min(totalPages, _state.currentPage + 1);
                }
                renderEmployeeTable();
            });
        });
        
        // ---- Page Size ---- //
        const pageSizeSelect = document.getElementById('page-size-select');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', function() {
                _state.pageSize = parseInt(this.value);
                _state.currentPage = 1;
                renderEmployeeTable();
            });
        }
        
        // ---- Filters ---- //
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', function() {
                const filterMap = {
                    'filter-department': 'department',
                    'filter-grade': 'grade',
                    'filter-status': 'status'
                };
                const key = filterMap[this.id];
                if (key) {
                    _state.filters[key] = this.value;
                    applyFilters();
                }
            });
        });
        
        // ---- Refresh Button ---- //
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                const icon = this.querySelector('.fa-sync-alt');
                if (icon) icon.classList.add('spinning');
                window.GoogleSync?.refresh()
                    .then(() => {
                        if (icon) icon.classList.remove('spinning');
                        showToast('success', 'Data refreshed successfully');
                    })
                    .catch(() => {
                        if (icon) icon.classList.remove('spinning');
                        showToast('error', 'Failed to refresh data');
                    });
            });
        }
        
        // ---- Fullscreen ---- //
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', function() {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }
        
        // ---- Theme Toggle ---- //
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                const icon = this.querySelector('i');
                if (icon.classList.contains('fa-moon')) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                    document.body.style.filter = 'invert(1) hue-rotate(180deg)';
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                    document.body.style.filter = '';
                }
            });
        }
        
        // ---- Report Buttons ---- //
        document.getElementById('export-excel')?.addEventListener('click', exportExcel);
        document.getElementById('export-pdf')?.addEventListener('click', exportPDF);
        document.getElementById('export-csv')?.addEventListener('click', exportCSV);
        document.getElementById('print-dashboard')?.addEventListener('click', printDashboard);
    }
    
    /**
     * Switch active section
     * @param {string} section - Section ID
     */
    function switchSection(section) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.section === section);
        });
        
        // Update sections
        document.querySelectorAll('.dashboard-section').forEach(el => {
            el.classList.toggle('active', el.id === `section-${section}`);
        });
        
        // Update header
        const titles = {
            executive: 'Executive Dashboard',
            employees: 'Workforce Management',
            programs: 'Training Programs',
            departments: 'Departments',
            analytics: 'Advanced Analytics',
            reports: 'Reports & Export',
            quality: 'Data Quality'
        };
        
        const subtitles = {
            executive: 'Real-time workforce intelligence overview',
            employees: 'Manage and filter employee records',
            programs: 'Program performance and attendance analysis',
            departments: 'Department competency comparison',
            analytics: 'In-depth data analysis and trends',
            reports: 'Export and print dashboard reports',
            quality: 'Data validation and quality metrics'
        };
        
        setElementText('section-title', titles[section] || 'Dashboard');
        setElementText('section-subtitle', subtitles[section] || '');
        
        _state.currentSection = section;
        
        // Close mobile sidebar
        document.getElementById('app-sidebar')?.classList.remove('open');
    }
    
    /**
     * Update sort indicators
     */
    function updateSortIndicators() {
        document.querySelectorAll('[data-sort]').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
            const field = th.dataset.sort;
            if (field === _state.sort.field) {
                th.classList.add(_state.sort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
        });
    }
    
    /**
     * Apply all filters
     */
    function applyFilters() {
        const { department, grade, status } = _state.filters;
        
        _state.filteredData = _state.data.filter(emp => {
            if (department && emp.department !== department) return false;
            if (grade && emp.grade !== grade) return false;
            if (status && emp.status !== status) return false;
            return true;
        });
        
        _state.currentPage = 1;
        renderAll();
    }
    
    // ============================================================
    // EXPORT FUNCTIONS
    // ============================================================
    
    function exportExcel() {
        showToast('info', 'Excel export feature coming soon');
    }
    
    function exportPDF() {
        showToast('info', 'PDF export feature coming soon');
    }
    
    function exportCSV() {
        showToast('info', 'CSV export feature coming soon');
    }
    
    function printDashboard() {
        window.print();
    }
    
    // ============================================================
    // PUBLIC API
    // ============================================================
    
    return {
        init: init,
        getState: () => ({ ..._state }),
        getData: () => _state.data,
        getFilteredData: () => _state.filteredData,
        switchSection: switchSection,
        refresh: () => window.GoogleSync?.refresh(),
        showToast: showToast
    };
})();

// ============================================================
// EXPOSE TO GLOBAL SCOPE
// ============================================================

if (typeof window !== 'undefined') {
    window.CTIHApp = CTIHApp;
}

// ============================================================
// AUTO-INITIALIZE
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        CTIHApp.init();
    }, 500);
});