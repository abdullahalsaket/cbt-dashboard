// ============================================================
// REPORTS MODULE - COMPETENCY TRAINING INTELLIGENCE HUB
// ============================================================

const ReportsModule = (function() {
    'use strict';
    
    let _data = [];
    let _filteredData = [];
    let _isExporting = false;
    let _listeners = {};
    
    const EXPORT_FORMATS = {
        EXCEL: 'excel',
        PDF: 'pdf',
        CSV: 'csv',
        JSON: 'json'
    };
    
    function init(data) {
        console.log('[Reports] Initializing with', data ? data.length : 0, 'records');
        if (!data || data.length === 0) {
            console.warn('[Reports] No data provided');
            return;
        }
        _data = data;
        _filteredData = [...data];
        setupEventListeners();
        console.log('[Reports] Initialization complete');
    }
    
    function updateData(data, filteredData) {
        if (data) _data = data;
        if (filteredData) _filteredData = filteredData;
    }
    
    function exportExcel(data = null, options = {}) {
        if (_isExporting) return;
        _isExporting = true;
        
        try {
            const exportData = data || _filteredData;
            if (!exportData || exportData.length === 0) {
                showToast('warning', 'No data to export');
                _isExporting = false;
                return;
            }
            
            const filename = options.filename || `CTIH_Export_${new Date().toISOString().slice(0,10)}`;
            
            if (typeof XLSX === 'undefined') {
                exportCSV(exportData, { filename });
                _isExporting = false;
                return;
            }
            
            const excelData = prepareExcelData(exportData);
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);
            
            // Auto-column widths
            const colWidths = getColumnWidths(excelData);
            ws['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(wb, ws, 'Employees');
            
            // Add summary sheet
            const summaryData = getSummaryData(exportData);
            const wsSummary = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
            
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            downloadFile(wbout, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            
            showToast('success', `Exported ${exportData.length} records to Excel`);
            notifyListeners('exportComplete', { format: 'excel', count: exportData.length });
            
        } catch (error) {
            console.error('[Reports] Excel export error:', error);
            showToast('error', 'Failed to export Excel file');
        }
        
        _isExporting = false;
    }
    
    function exportPDF(data = null, options = {}) {
        if (_isExporting) return;
        _isExporting = true;
        
        try {
            const exportData = data || _filteredData;
            if (!exportData || exportData.length === 0) {
                showToast('warning', 'No data to export');
                _isExporting = false;
                return;
            }
            
            const filename = options.filename || `CTIH_Report_${new Date().toISOString().slice(0,10)}`;
            
            if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
                showToast('error', 'PDF library not loaded');
                _isExporting = false;
                return;
            }
            
            const { jsPDF } = window.jspdf || jspdf;
            const doc = new jsPDF('landscape', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // Add title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Competency Training Intelligence Hub', pageWidth / 2, 20, { align: 'center' });
            
            // Add subtitle
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Report Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
            
            // Add summary
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Records: ${exportData.length}`, 20, 38);
            
            const summary = getSummaryData(exportData)[0];
            if (summary) {
                doc.text(`Departments: ${summary.departments || 0}`, 20, 44);
                doc.text(`Programs: ${summary.programs || 0}`, 20, 50);
                doc.text(`Completion Rate: ${summary.completionRate || '0%'}`, 20, 56);
            }
            
            // Add table
            const headers = ['ID', 'Name', 'Title', 'Department', 'Grade', 'Status', 'Attendance'];
            const rows = exportData.slice(0, 50).map(emp => [
                emp.id || 'N/A',
                emp.name || 'Unknown',
                (emp.title || '').substring(0, 30),
                emp.department || 'N/A',
                emp.grade || 'N/A',
                emp.status || 'Unknown',
                emp.attendanceStatus || 'Not Started'
            ]);
            
            const tableColumnWidths = [20, 30, 40, 30, 25, 25, 30];
            const startY = 64;
            const rowHeight = 8;
            let currentY = startY;
            
            // Draw table header
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            let xPos = 15;
            headers.forEach((header, i) => {
                doc.text(header, xPos, currentY);
                xPos += tableColumnWidths[i];
            });
            currentY += rowHeight;
            
            // Draw table rows
            doc.setFont('helvetica', 'normal');
            rows.forEach((row) => {
                if (currentY > pageHeight - 20) {
                    doc.addPage();
                    currentY = 20;
                    doc.setFont('helvetica', 'bold');
                    let xPos2 = 15;
                    headers.forEach((header, i) => {
                        doc.text(header, xPos2, currentY);
                        xPos2 += tableColumnWidths[i];
                    });
                    currentY += rowHeight;
                    doc.setFont('helvetica', 'normal');
                }
                
                let xPosRow = 15;
                row.forEach((cell, i) => {
                    doc.text(String(cell).substring(0, 20), xPosRow, currentY);
                    xPosRow += tableColumnWidths[i];
                });
                currentY += rowHeight;
            });
            
            // Add footer
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Generated by CTIH Enterprise Dashboard', pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            doc.save(`${filename}.pdf`);
            
            showToast('success', `Exported ${Math.min(exportData.length, 50)} records to PDF`);
            notifyListeners('exportComplete', { format: 'pdf', count: Math.min(exportData.length, 50) });
            
        } catch (error) {
            console.error('[Reports] PDF export error:', error);
            showToast('error', 'Failed to export PDF file');
        }
        
        _isExporting = false;
    }
    
    function exportCSV(data = null, options = {}) {
        if (_isExporting) return;
        _isExporting = true;
        
        try {
            const exportData = data || _filteredData;
            if (!exportData || exportData.length === 0) {
                showToast('warning', 'No data to export');
                _isExporting = false;
                return;
            }
            
            const filename = options.filename || `CTIH_Export_${new Date().toISOString().slice(0,10)}`;
            
            const headers = ['ID', 'Name', 'Title', 'Department', 'Grade', 'Status', 'Sector', 'Training Program', 'Attendance'];
            const rows = exportData.map(emp => [
                emp.id || 'N/A',
                `"${(emp.name || 'Unknown').replace(/"/g, '""')}"`,
                `"${(emp.title || '').replace(/"/g, '""')}"`,
                `"${(emp.department || 'N/A').replace(/"/g, '""')}"`,
                `"${(emp.grade || 'N/A').replace(/"/g, '""')}"`,
                emp.status || 'Unknown',
                `"${(emp.sector || 'N/A').replace(/"/g, '""')}"`,
                `"${(emp.trainingGroup || 'N/A').replace(/"/g, '""')}"`,
                emp.attendanceStatus || 'Not Started'
            ]);
            
            let csvContent = headers.join(',') + '\n';
            rows.forEach(row => {
                csvContent += row.join(',') + '\n';
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('success', `Exported ${exportData.length} records to CSV`);
            notifyListeners('exportComplete', { format: 'csv', count: exportData.length });
            
        } catch (error) {
            console.error('[Reports] CSV export error:', error);
            showToast('error', 'Failed to export CSV file');
        }
        
        _isExporting = false;
    }
    
    function exportJSON(data = null, options = {}) {
        if (_isExporting) return;
        _isExporting = true;
        
        try {
            const exportData = data || _filteredData;
            if (!exportData || exportData.length === 0) {
                showToast('warning', 'No data to export');
                _isExporting = false;
                return;
            }
            
            const filename = options.filename || `CTIH_Export_${new Date().toISOString().slice(0,10)}`;
            const pretty = options.pretty !== undefined ? options.pretty : true;
            
            const jsonContent = JSON.stringify(exportData, null, pretty ? 2 : 0);
            downloadFile(jsonContent, `${filename}.json`, 'application/json');
            
            showToast('success', `Exported ${exportData.length} records to JSON`);
            notifyListeners('exportComplete', { format: 'json', count: exportData.length });
            
        } catch (error) {
            console.error('[Reports] JSON export error:', error);
            showToast('error', 'Failed to export JSON file');
        }
        
        _isExporting = false;
    }
    
    function printDashboard() {
        const originalTitle = document.title;
        document.title = 'CTIH Dashboard Print';
        window.print();
        document.title = originalTitle;
    }
    
    function printEmployeeProfile(id) {
        const emp = _data.find(d => d.id === id);
        if (!emp) {
            showToast('error', 'Employee not found');
            return;
        }
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            showToast('error', 'Please allow popups for printing');
            return;
        }
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Employee Profile - ${emp.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
                    .header { display: flex; align-items: center; gap: 20px; border-bottom: 2px solid #6C63FF; padding-bottom: 20px; margin-bottom: 20px; }
                    .avatar { width: 60px; height: 60px; border-radius: 50%; background: #6C63FF; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
                    .field { background: #f5f5f5; padding: 12px; border-radius: 8px; }
                    .field .label { font-size: 11px; color: #666; text-transform: uppercase; }
                    .field .value { font-size: 14px; font-weight: 500; margin-top: 4px; }
                    .programs { border-top: 1px solid #eee; padding-top: 20px; }
                    .program-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
                    .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
                    .badge-success { background: #00C853; color: white; }
                    .badge-warning { background: #FFB300; color: white; }
                    .badge-secondary { background: #666; color: white; }
                    .footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 11px; color: #999; text-align: center; }
                    @media print { body { padding: 20px; } .field { background: #f9f9f9; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="avatar">${emp.name ? emp.name.charAt(0).toUpperCase() : '?'}</div>
                    <div>
                        <h1 style="margin: 0; font-size: 24px;">${emp.name || 'Unknown'}</h1>
                        <p style="margin: 4px 0 0; color: #666;">${emp.title || 'No title'} · ID: ${emp.id || 'N/A'}</p>
                    </div>
                </div>
                <div class="grid">
                    <div class="field"><div class="label">Department</div><div class="value">${emp.department || 'N/A'}</div></div>
                    <div class="field"><div class="label">Grade</div><div class="value">${emp.grade || 'N/A'}</div></div>
                    <div class="field"><div class="label">Sector</div><div class="value">${emp.sector || 'N/A'}</div></div>
                    <div class="field"><div class="label">Status</div><div class="value">${getStatusLabel(emp.status)}</div></div>
                    <div class="field"><div class="label">Training Group</div><div class="value">${emp.trainingGroup || 'N/A'}</div></div>
                    <div class="field"><div class="label">Training Phase</div><div class="value">${emp.trainingPhase || 'N/A'}</div></div>
                    <div class="field"><div class="label">Attendance Status</div><div class="value">${getAttendanceLabel(emp.attendanceStatus)}</div></div>
                    <div class="field"><div class="label">Training Location</div><div class="value">${emp.trainingLocation || 'N/A'}</div></div>
                </div>
                <div class="programs">
                    <h3 style="font-size: 16px; margin-bottom: 12px;">Training Programs</h3>
                    <div class="program-item"><span>7 Sens Program</span><span>${getProgramBadge(emp.sevenSensProgram)}</span></div>
                    <div class="program-item"><span>Analytical Thinking</span><span>${getProgramBadge(emp.analyticalThinking)}</span></div>
                    <div class="program-item"><span>Mind Field</span><span>${getProgramBadge(emp.mindField)}</span></div>
                    <div class="program-item"><span>Leadership</span><span>${getProgramBadge(emp.leadership)}</span></div>
                </div>
                <div class="footer">Generated by CTIH Enterprise Dashboard · ${new Date().toLocaleString()}</div>
            </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
    }
    
    function prepareExcelData(data) {
        return data.map(emp => ({
            'ID': emp.id || 'N/A',
            'Name': emp.name || 'Unknown',
            'Title': emp.title || '',
            'Department': emp.department || 'N/A',
            'Grade': emp.grade || 'N/A',
            'Status': emp.status || 'Unknown',
            'Sector': emp.sector || 'N/A',
            'Training Program': emp.trainingGroup || 'N/A',
            'Training Phase': emp.trainingPhase || 'N/A',
            'Attendance': emp.attendanceStatus || 'Not Started'
        }));
    }
    
    function getSummaryData(data) {
        if (!data || data.length === 0) return [];
        const departments = new Set(data.map(d => d.department).filter(Boolean));
        const programs = new Set(data.map(d => d.trainingGroup).filter(Boolean));
        const completed = data.filter(d => d.attendanceStatus === 'completed').length;
        const rate = data.length > 0 ? Math.round((completed / data.length) * 100) : 0;
        return [{
            'Total Records': data.length,
            'Departments': departments.size,
            'Programs': programs.size,
            'Completion Rate': `${rate}%`,
            'Active Employees': data.filter(d => d.status === 'active').length,
            'Data Quality': `${ValidationModule ? ValidationModule.getQualityScore() : 0}%`
        }];
    }
    
    function getColumnWidths(data) {
        if (!data || data.length === 0) return [];
        const headers = Object.keys(data[0] || {});
        return headers.map(() => ({ wch: 18 }));
    }
    
    function getStatusLabel(status) {
        const map = { 'active': 'Active', 'sick': 'Sick', 'legal': 'Legal', 'inactive': 'Inactive', 'unknown': 'Unknown' };
        return map[status] || status || 'Unknown';
    }
    
    function getAttendanceLabel(status) {
        const map = { 'completed': 'Completed', 'pending': 'Pending', 'not-started': 'Not Started' };
        return map[status] || status || 'Unknown';
    }
    
    function getProgramBadge(value) {
        if (!value) return '<span class="badge badge-secondary">Not Started</span>';
        const lower = value.toLowerCase();
        if (lower === 'attend' || lower === 'attended') return '<span class="badge badge-success">Completed</span>';
        if (lower === 'not attend') return '<span class="badge badge-warning">Pending</span>';
        return '<span class="badge badge-secondary">Not Started</span>';
    }
    
    function downloadFile(content, filename, mimeType) {
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
    
    function on(event, callback) {
        if (!_listeners[event]) _listeners[event] = [];
        _listeners[event].push(callback);
    }
    
    function notifyListeners(event, data) {
        if (!_listeners[event]) return;
        _listeners[event].forEach(callback => {
            try { callback(data); } catch (e) { console.error('[Reports] Listener error:', e); }
        });
    }
    
    function setupEventListeners() {
        document.getElementById('export-excel')?.addEventListener('click', () => exportExcel());
        document.getElementById('export-pdf')?.addEventListener('click', () => exportPDF());
        document.getElementById('export-csv')?.addEventListener('click', () => exportCSV());
        document.getElementById('print-dashboard')?.addEventListener('click', () => printDashboard());
    }
    
    return {
        init: init,
        updateData: updateData,
        exportExcel: exportExcel,
        exportPDF: exportPDF,
        exportCSV: exportCSV,
        exportJSON: exportJSON,
        printDashboard: printDashboard,
        printEmployeeProfile: printEmployeeProfile,
        on: on,
        EXPORT_FORMATS: EXPORT_FORMATS
    };
})();

if (typeof window !== 'undefined') {
    window.ReportsModule = ReportsModule;
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.CTIHApp && window.CTIHApp.getData) {
            const data = window.CTIHApp.getData();
            if (data && data.length > 0) {
                ReportsModule.init(data);
            }
        }
    }, 2000);
});