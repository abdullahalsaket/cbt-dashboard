// ============================================================
// CHARTS MODULE - COMPETENCY TRAINING INTELLIGENCE HUB
// ============================================================

/**
 * ChartsModule - Manages all ECharts visualizations
 * Handles rendering, updating, and resizing of charts
 */
const ChartsModule = (function() {
    'use strict';
    
    // ============================================================
    // PRIVATE STATE
    // ============================================================
    
    let _charts = {};
    let _data = [];
    let _isInitialized = false;
    let _resizeTimeout = null;
    
    // ============================================================
    // COLOR PALETTE
    // ============================================================
    
    const COLORS = {
        primary: '#6C63FF',
        primaryLight: '#8B83FF',
        secondary: '#00C853',
        warning: '#FFB300',
        danger: '#FF1744',
        info: '#00BCD4',
        
        palette: [
            '#6C63FF', '#00C853', '#FFB300', '#FF1744', '#00BCD4',
            '#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#4D96FF',
            '#FF6B9D', '#845EF7', '#FCC419', '#20C997', '#FF922B'
        ]
    };
    
    // ============================================================
    // PUBLIC METHODS
    // ============================================================
    
    /**
     * Initialize the charts module
     * @param {Array} data - The data to visualize
     */
    function init(data) {
        if (_isInitialized) {
            console.warn('[Charts] Already initialized');
            return;
        }
        
        console.log('[Charts] Initializing with', data.length, 'records');
        _data = data || [];
        _isInitialized = true;
        
        if (document.readyState === 'complete') {
            renderAllCharts();
        } else {
            window.addEventListener('load', renderAllCharts);
        }
        
        setupResizeHandler();
    }
    
    /**
     * Update charts with new data
     * @param {Array} data - New data array
     */
    function updateData(data) {
        if (!data || data.length === 0) {
            console.warn('[Charts] No data to update');
            return;
        }
        
        console.log('[Charts] Updating with', data.length, 'records');
        _data = data;
        destroyAllCharts();
        renderAllCharts();
    }
    
    /**
     * Render all charts
     */
    function renderAllCharts() {
        if (!_data || _data.length === 0) {
            console.warn('[Charts] No data to render');
            return;
        }
        
        console.log('[Charts] Rendering all charts');
        
        setTimeout(() => {
            renderTrendChart();
            renderTreemapChart();
            renderDoughnutChart();
            renderRadarChart();
            renderHeatmapChart();
            renderProgramsChart();
            renderProgramRanking();
            renderDepartmentRadar();
            renderDepartmentSize();
            renderDepartmentCompletion();
            renderQualityChart();
        }, 100);
    }
    
    // ============================================================
    // INDIVIDUAL CHART RENDERERS
    // ============================================================
    
    function renderTrendChart() {
        const container = document.getElementById('chart-trend');
        if (!container) return;
        
        const phaseCounts = {};
        _data.forEach(d => {
            const phase = d.trainingPhase || 'Unknown';
            phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
        });
        
        const sortedPhases = Object.keys(phaseCounts).sort();
        const values = sortedPhases.map(p => phaseCounts[p]);
        
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
                data: sortedPhases,
                axisLabel: {
                    color: '#A0A0C0',
                    fontSize: 11
                },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: '#A0A0C0' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            series: [{
                name: 'Employees',
                type: 'line',
                smooth: true,
                data: values,
                lineStyle: {
                    color: '#6C63FF',
                    width: 3
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(108, 99, 255, 0.3)' },
                        { offset: 1, color: 'rgba(108, 99, 255, 0.05)' }
                    ])
                },
                itemStyle: {
                    color: '#6C63FF'
                },
                symbol: 'circle',
                symbolSize: 8
            }]
        });
        
        _charts.trend = chart;
        chart.resize();
    }
    
    function renderTreemapChart() {
        const container = document.getElementById('chart-treemap');
        if (!container) return;
        
        const gradeCounts = {};
        _data.forEach(d => {
            const grade = d.grade || 'Unknown';
            gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        });
        
        const data = Object.entries(gradeCounts).map(([name, value]) => ({
            name: name,
            value: value
        }));
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} employees'
            },
            series: [{
                type: 'treemap',
                data: data,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: 'rgba(10, 10, 26, 0.5)',
                    borderWidth: 2,
                    gapWidth: 2
                },
                label: {
                    show: true,
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 500
                },
                roam: false,
                nodeClick: false
            }]
        });
        
        _charts.treemap = chart;
        chart.resize();
    }
    
    function renderDoughnutChart() {
        const container = document.getElementById('chart-doughnut');
        if (!container) return;
        
        const statusCounts = {};
        _data.forEach(d => {
            const status = d.status || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        const data = Object.entries(statusCounts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: value,
            itemStyle: {
                color: getStatusColor(name)
            }
        }));
        
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
                textStyle: { color: '#A0A0C0', fontSize: 12 },
                itemWidth: 12,
                itemHeight: 12
            },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
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
                data: data
            }]
        });
        
        _charts.doughnut = chart;
        chart.resize();
    }
    
    function getStatusColor(status) {
        const colors = {
            'active': '#00C853',
            'sick': '#FFB300',
            'legal': '#FF1744',
            'inactive': '#66668A'
        };
        return colors[status] || '#4D96FF';
    }
    
    function renderRadarChart() {
        const container = document.getElementById('chart-radar');
        if (!container) return;
        
        const total = _data.length;
        const completed = _data.filter(d => d.attendanceStatus === 'completed').length;
        const active = _data.filter(d => d.status === 'active').length;
        
        const deptCounts = {};
        _data.forEach(d => {
            const dept = d.department || 'Unknown';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        const deptVariety = Object.keys(deptCounts).length;
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'item'
            },
            legend: {
                data: ['Training Performance'],
                textStyle: { color: '#A0A0C0' },
                bottom: 0
            },
            radar: {
                indicator: [
                    { name: 'Attendance', max: 100 },
                    { name: 'Completion', max: 100 },
                    { name: 'Active Workforce', max: 100 },
                    { name: 'Department Variety', max: 20 },
                    { name: 'Engagement', max: 100 }
                ],
                shape: 'circle',
                axisName: {
                    color: '#A0A0C0',
                    fontSize: 11
                },
                splitArea: {
                    areaStyle: {
                        color: ['rgba(108, 99, 255, 0.02)', 'rgba(108, 99, 255, 0.05)']
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                }
            },
            series: [{
                type: 'radar',
                data: [{
                    value: [
                        total > 0 ? (completed / total) * 100 : 0,
                        total > 0 ? (completed / total) * 100 : 0,
                        total > 0 ? (active / total) * 100 : 0,
                        deptVariety,
                        total > 0 ? ((completed + active) / (total * 2)) * 100 : 0
                    ],
                    name: 'Performance',
                    areaStyle: {
                        color: 'rgba(108, 99, 255, 0.2)'
                    },
                    lineStyle: {
                        color: '#6C63FF',
                        width: 2
                    },
                    itemStyle: {
                        color: '#6C63FF'
                    }
                }]
            }]
        });
        
        _charts.radar = chart;
        chart.resize();
    }
    
    function renderHeatmapChart() {
        const container = document.getElementById('chart-heatmap');
        if (!container) return;
        
        const deptCounts = {};
        const progCounts = {};
        
        _data.forEach(d => {
            const dept = d.department || 'Unknown';
            const prog = d.trainingGroup || 'Unknown';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
            progCounts[prog] = (progCounts[prog] || 0) + 1;
        });
        
        const topDepts = Object.entries(deptCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name]) => name);
        
        const topProgs = Object.entries(progCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name]) => name);
        
        const heatmapData = [];
        const deptIndex = {};
        const progIndex = {};
        
        topDepts.forEach((d, i) => deptIndex[d] = i);
        topProgs.forEach((p, i) => progIndex[p] = i);
        
        _data.forEach(d => {
            const dept = d.department || 'Unknown';
            const prog = d.trainingGroup || 'Unknown';
            if (deptIndex[dept] !== undefined && progIndex[prog] !== undefined) {
                heatmapData.push([deptIndex[dept], progIndex[prog], 1]);
            }
        });
        
        const aggregated = {};
        heatmapData.forEach(([deptIdx, progIdx]) => {
            const key = `${deptIdx},${progIdx}`;
            aggregated[key] = (aggregated[key] || 0) + 1;
        });
        
        const finalData = Object.entries(aggregated).map(([key, value]) => {
            const [deptIdx, progIdx] = key.split(',').map(Number);
            return [deptIdx, progIdx, value];
        });
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                position: 'top',
                formatter: function(params) {
                    const dept = topDepts[params.value[0]];
                    const prog = topProgs[params.value[1]];
                    return `${dept}<br/>${prog}<br/><strong>${params.value[2]} employees</strong>`;
                }
            },
            grid: {
                left: '10%',
                right: '3%',
                bottom: '10%',
                top: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: topProgs,
                splitArea: { show: true },
                axisLabel: {
                    color: '#A0A0C0',
                    fontSize: 10,
                    rotate: 20
                },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
            },
            yAxis: {
                type: 'category',
                data: topDepts,
                splitArea: { show: true },
                axisLabel: {
                    color: '#A0A0C0',
                    fontSize: 10
                },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
            },
            visualMap: {
                min: 0,
                max: Math.max(3, ...finalData.map(d => d[2])),
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '0%',
                textStyle: {
                    color: '#A0A0C0'
                },
                inRange: {
                    color: ['#141428', '#6C63FF', '#8B83FF']
                }
            },
            series: [{
                type: 'heatmap',
                data: finalData,
                label: {
                    show: true,
                    color: '#FFFFFF',
                    fontSize: 10,
                    formatter: function(params) {
                        return params.value[2] > 0 ? params.value[2] : '';
                    }
                },
                itemStyle: {
                    borderColor: 'rgba(10, 10, 26, 0.3)',
                    borderWidth: 1,
                    borderRadius: 2
                }
            }]
        });
        
        _charts.heatmap = chart;
        chart.resize();
    }
    
    function renderProgramsChart() {
        const container = document.getElementById('chart-programs');
        if (!container) return;
        
        const programData = {};
        _data.forEach(d => {
            const prog = d.trainingGroup || 'Unknown';
            if (!programData[prog]) {
                programData[prog] = { total: 0, completed: 0, pending: 0 };
            }
            programData[prog].total++;
            if (d.attendanceStatus === 'completed') {
                programData[prog].completed++;
            } else if (d.attendanceStatus === 'pending') {
                programData[prog].pending++;
            }
        });
        
        const sorted = Object.entries(programData)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 8);
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                data: ['Completed', 'Pending', 'Total'],
                textStyle: { color: '#A0A0C0', fontSize: 12 },
                bottom: 0
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: sorted.map(([name]) => name),
                axisLabel: {
                    color: '#A0A0C0',
                    fontSize: 11,
                    rotate: 20
                },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: '#A0A0C0' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            series: [
                {
                    name: 'Completed',
                    type: 'bar',
                    stack: 'total',
                    data: sorted.map(([, stats]) => stats.completed),
                    itemStyle: { color: '#00C853', borderRadius: [0, 0, 0, 0] }
                },
                {
                    name: 'Pending',
                    type: 'bar',
                    stack: 'total',
                    data: sorted.map(([, stats]) => stats.pending),
                    itemStyle: { color: '#FFB300' }
                },
                {
                    name: 'Total',
                    type: 'bar',
                    stack: 'total',
                    data: sorted.map(([, stats]) => stats.total - stats.completed - stats.pending),
                    itemStyle: { color: 'rgba(255,255,255,0.05)' }
                }
            ]
        });
        
        _charts.programs = chart;
        chart.resize();
    }
    
    function renderProgramRanking() {
        const container = document.getElementById('chart-program-ranking');
        if (!container) return;
        
        const programData = {};
        _data.forEach(d => {
            const prog = d.trainingGroup || 'Unknown';
            if (!programData[prog]) {
                programData[prog] = { total: 0, completed: 0 };
            }
            programData[prog].total++;
            if (d.attendanceStatus === 'completed') {
                programData[prog].completed++;
            }
        });
        
        const sorted = Object.entries(programData)
            .map(([name, stats]) => ({
                name,
                rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
                total: stats.total
            }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 8);
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function(params) {
                    const data = params[0];
                    const item = sorted[data.dataIndex];
                    return `${item.name}<br/>Completion: ${item.rate}%<br/>Total: ${item.total} employees`;
                }
            },
            grid: {
                left: '3%',
                right: '10%',
                bottom: '3%',
                top: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                max: 100,
                axisLabel: {
                    color: '#A0A0C0',
                    formatter: '{value}%'
                },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            yAxis: {
                type: 'category',
                data: sorted.map(item => item.name),
                axisLabel: {
                    color: '#A0A0C0',
                    fontSize: 11
                },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
            },
            series: [{
                type: 'bar',
                data: sorted.map(item => ({
                    value: item.rate,
                    itemStyle: {
                        color: item.rate >= 80 ? '#00C853' :
                               item.rate >= 60 ? '#FFB300' : '#FF1744',
                        borderRadius: [0, 4, 4, 0]
                    }
                })),
                barWidth: '60%',
                label: {
                    show: true,
                    position: 'right',
                    color: '#A0A0C0',
                    fontSize: 11,
                    formatter: '{c}%'
                }
            }]
        });
        
        _charts.programRanking = chart;
        chart.resize();
    }
    
    function renderDepartmentRadar() {
        const container = document.getElementById('chart-department-radar');
        if (!container) return;
        
        const deptCounts = {};
        _data.forEach(d => {
            const dept = d.department || 'Unknown';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        
        const topDepts = Object.entries(deptCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name);
        
        const radarData = topDepts.map(dept => {
            const employees = _data.filter(d => d.department === dept);
            const total = employees.length;
            const completed = employees.filter(e => e.attendanceStatus === 'completed').length;
            const active = employees.filter(e => e.status === 'active').length;
            
            return {
                name: dept,
                value: [
                    total > 0 ? Math.round((completed / total) * 100) : 0,
                    total > 0 ? Math.round((active / total) * 100) : 0,
                    Math.min(100, total * 2),
                    total > 0 ? Math.round((employees.filter(e => e.hasAttended).length / total) * 100) : 0,
                    Math.min(100, total * 1.5)
                ]
            };
        });
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'item'
            },
            legend: {
                data: topDepts,
                textStyle: { color: '#A0A0C0', fontSize: 11 },
                bottom: 0,
                itemWidth: 12,
                itemHeight: 12
            },
            radar: {
                indicator: [
                    { name: 'Completion', max: 100 },
                    { name: 'Active Workforce', max: 100 },
                    { name: 'Team Size', max: 100 },
                    { name: 'Attendance', max: 100 },
                    { name: 'Engagement', max: 100 }
                ],
                shape: 'circle',
                axisName: {
                    color: '#A0A0C0',
                    fontSize: 10
                },
                splitArea: {
                    areaStyle: {
                        color: ['rgba(108, 99, 255, 0.02)']
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                }
            },
            series: [{
                type: 'radar',
                data: radarData.map((item, index) => ({
                    ...item,
                    lineStyle: {
                        color: COLORS.palette[index % COLORS.palette.length],
                        width: 2
                    },
                    areaStyle: {
                        color: COLORS.palette[index % COLORS.palette.length] + '33'
                    },
                    itemStyle: {
                        color: COLORS.palette[index % COLORS.palette.length]
                    }
                }))
            }]
        });
        
        _charts.departmentRadar = chart;
        chart.resize();
    }
    
    function renderDepartmentSize() {
        const container = document.getElementById('chart-dept-size');
        if (!container) return;
        
        const deptCounts = {};
        _data.forEach(d => {
            const dept = d.department || 'Unknown';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        
        const sorted = Object.entries(deptCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
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
                    rotate: 25
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
                data: sorted.map(([, count]) => ({
                    value: count,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#6C63FF' },
                            { offset: 1, color: '#8B83FF' }
                        ]),
                        borderRadius: [4, 4, 0, 0]
                    }
                })),
                barWidth: '50%',
                label: {
                    show: true,
                    position: 'top',
                    color: '#A0A0C0',
                    fontSize: 10
                }
            }]
        });
        
        _charts.deptSize = chart;
        chart.resize();
    }
    
    function renderDepartmentCompletion() {
        const container = document.getElementById('chart-dept-completion');
        if (!container) return;
        
        const deptData = {};
        _data.forEach(d => {
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
            .sort((a, b) => {
                const rateA = a[1].total > 0 ? (a[1].completed / a[1].total) : 0;
                const rateB = b[1].total > 0 ? (b[1].completed / b[1].total) : 0;
                return rateB - rateA;
            })
            .slice(0, 8);
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function(params) {
                    const data = params[0];
                    const item = sorted[data.dataIndex];
                    const rate = item[1].total > 0 ? Math.round((item[1].completed / item[1].total) * 100) : 0;
                    return `${item[0]}<br/>Completion: ${rate}%<br/>Total: ${item[1].total} employees`;
                }
            },
            grid: {
                left: '3%',
                right: '10%',
                bottom: '3%',
                top: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                max: 100,
                axisLabel: {
                    color: '#A0A0C0',
                    formatter: '{value}%'
                },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            yAxis: {
                type: 'category',
                data: sorted.map(([name]) => name),
                axisLabel: {
                    color: '#A0A0C0',
                    fontSize: 10
                },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
            },
            series: [{
                type: 'bar',
                data: sorted.map(([, stats]) => {
                    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                    return {
                        value: rate,
                        itemStyle: {
                            color: rate >= 80 ? '#00C853' :
                                   rate >= 60 ? '#FFB300' : '#FF1744',
                            borderRadius: [0, 4, 4, 0]
                        }
                    };
                }),
                barWidth: '60%',
                label: {
                    show: true,
                    position: 'right',
                    color: '#A0A0C0',
                    fontSize: 11,
                    formatter: '{c}%'
                }
            }]
        });
        
        _charts.deptCompletion = chart;
        chart.resize();
    }
    
    function renderQualityChart() {
        const container = document.getElementById('chart-quality');
        if (!container) return;
        
        const total = _data.length;
        const metrics = {
            'Valid IDs': _data.filter(d => d.id && d.id !== '').length,
            'Valid Names': _data.filter(d => d.name && d.name !== '').length,
            'Valid Departments': _data.filter(d => d.department && d.department !== '').length,
            'Valid Grades': _data.filter(d => d.grade && d.grade !== '').length,
            'Valid Status': _data.filter(d => d.status && d.status !== '').length
        };
        
        const chart = echarts.init(container);
        chart.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function(params) {
                    const data = params[0];
                    const key = data.name;
                    const value = metrics[key];
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    return `${key}<br/>${value} / ${total} (${percentage}%)`;
                }
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
                data: Object.keys(metrics),
                axisLabel: {
                    color: '#A0A0C0',
                    fontSize: 11
                },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
            },
            yAxis: {
                type: 'value',
                max: total,
                axisLabel: { color: '#A0A0C0' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            series: [{
                type: 'bar',
                data: Object.values(metrics).map(value => ({
                    value: value,
                    itemStyle: {
                        color: value === total ? '#00C853' :
                               value >= total * 0.8 ? '#FFB300' : '#FF1744',
                        borderRadius: [4, 4, 0, 0]
                    }
                })),
                barWidth: '50%',
                label: {
                    show: true,
                    position: 'top',
                    color: '#A0A0C0',
                    fontSize: 11,
                    formatter: function(params) {
                        return Math.round((params.value / total) * 100) + '%';
                    }
                }
            }]
        });
        
        _charts.quality = chart;
        chart.resize();
    }
    
    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    
    function setupResizeHandler() {
        window.addEventListener('resize', function() {
            if (_resizeTimeout) {
                clearTimeout(_resizeTimeout);
            }
            _resizeTimeout = setTimeout(function() {
                resizeAllCharts();
            }, 200);
        });
    }
    
    function resizeAllCharts() {
        Object.values(_charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                try {
                    chart.resize();
                } catch (e) {
                    console.warn('[Charts] Error resizing chart:', e);
                }
            }
        });
    }
    
    function destroyAllCharts() {
        Object.keys(_charts).forEach(key => {
            if (_charts[key] && typeof _charts[key].dispose === 'function') {
                try {
                    _charts[key].dispose();
                } catch (e) {
                    console.warn('[Charts] Error disposing chart:', e);
                }
            }
        });
        _charts = {};
    }
    
    function getChart(name) {
        return _charts[name] || null;
    }
    
    // ============================================================
    // PUBLIC API
    // ============================================================
    
    return {
        init: init,
        updateData: updateData,
        renderAll: renderAllCharts,
        resizeAll: resizeAllCharts,
        getChart: getChart,
        destroy: destroyAllCharts,
        COLORS: COLORS
    };
})();

if (typeof window !== 'undefined') {
    window.ChartsModule = ChartsModule;
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.CTIHApp && window.CTIHApp.getData) {
            const data = window.CTIHApp.getData();
            if (data && data.length > 0) {
                ChartsModule.init(data);
            }
        }
    }, 1000);
});