// ============================================================
// VALIDATION MODULE - COMPETENCY TRAINING INTELLIGENCE HUB
// ============================================================

const ValidationModule = (function() {
    'use strict';
    
    let _data = [];
    let _validationResults = null;
    let _qualityScore = 0;
    let _listeners = {};
    let _isValidating = false;
    
    const VALIDATION_RULES = {
        id: { required: true, unique: true, pattern: /^[0-9]+$/, message: 'Invalid or missing ID' },
        name: { required: true, minLength: 2, maxLength: 100, message: 'Invalid or missing name' },
        department: { required: true, minLength: 2, maxLength: 50, message: 'Invalid or missing department' },
        grade: { required: false, message: 'Missing grade information' },
        status: { required: true, allowedValues: ['active', 'sick', 'legal', 'inactive', 'unknown'], message: 'Invalid or missing status' },
        sector: { required: false, message: 'Missing sector information' },
        trainingGroup: { required: false, message: 'Missing training group' },
        trainingPhase: { required: false, message: 'Missing training phase' }
    };
    
    const ISSUE_TYPES = {
        DUPLICATE_ID: 'duplicate_id',
        MISSING_ID: 'missing_id',
        MISSING_NAME: 'missing_name',
        MISSING_DEPARTMENT: 'missing_department',
        MISSING_GRADE: 'missing_grade',
        MISSING_STATUS: 'missing_status',
        INVALID_STATUS: 'invalid_status',
        MISSING_SECTOR: 'missing_sector',
        MISSING_TRAINING: 'missing_training',
        INVALID_PHASE: 'invalid_phase'
    };
    
    const ISSUE_SEVERITY = {
        [ISSUE_TYPES.DUPLICATE_ID]: 'critical',
        [ISSUE_TYPES.MISSING_ID]: 'critical',
        [ISSUE_TYPES.MISSING_NAME]: 'critical',
        [ISSUE_TYPES.MISSING_DEPARTMENT]: 'high',
        [ISSUE_TYPES.INVALID_STATUS]: 'high',
        [ISSUE_TYPES.MISSING_GRADE]: 'medium',
        [ISSUE_TYPES.MISSING_STATUS]: 'medium',
        [ISSUE_TYPES.MISSING_SECTOR]: 'low',
        [ISSUE_TYPES.MISSING_TRAINING]: 'low',
        [ISSUE_TYPES.INVALID_PHASE]: 'low'
    };
    
    function init(data) {
        console.log('[Validation] Initializing with', data ? data.length : 0, 'records');
        if (!data || data.length === 0) {
            console.warn('[Validation] No data provided');
            return;
        }
        _data = data;
        runValidation();
        console.log('[Validation] Initialization complete');
    }
    
    function runValidation() {
        if (_isValidating) return _validationResults;
        _isValidating = true;
        console.log('[Validation] Running validation...');
        
        const results = {
            total: _data.length,
            issues: [],
            summary: {},
            qualityScore: 0,
            validatedAt: new Date().toISOString()
        };
        
        validateDuplicateIDs(results);
        validateRequiredFields(results);
        validateStatusValues(results);
        validateTrainingData(results);
        validatePhaseData(results);
        
        results.qualityScore = calculateQualityScore(results);
        _qualityScore = results.qualityScore;
        results.summary = buildSummary(results);
        _validationResults = results;
        _isValidating = false;
        notifyListeners('validationComplete', results);
        console.log('[Validation] Complete. Score:', results.qualityScore, 'Issues:', results.issues.length);
        return results;
    }
    
    function validateDuplicateIDs(results) {
        const idMap = {};
        const duplicates = [];
        _data.forEach((record, index) => {
            const id = record.id;
            if (id && id !== '') {
                if (idMap[id] !== undefined) {
                    duplicates.push({ id: id, index: index, record: record });
                    if (!duplicates.some(d => d.index === idMap[id])) {
                        duplicates.push({ id: id, index: idMap[id], record: _data[idMap[id]] });
                    }
                } else {
                    idMap[id] = index;
                }
            }
        });
        if (duplicates.length > 0) {
            results.issues.push({
                type: ISSUE_TYPES.DUPLICATE_ID,
                severity: ISSUE_SEVERITY[ISSUE_TYPES.DUPLICATE_ID],
                count: duplicates.length,
                description: `Found ${duplicates.length} duplicate ID(s)`,
                details: duplicates.map(d => `ID ${d.id} at row ${d.index + 2}`)
            });
        }
    }
    
    function validateRequiredFields(results) {
        const fields = ['id', 'name', 'department', 'status'];
        fields.forEach(field => {
            const missing = [];
            _data.forEach((record, index) => {
                const value = record[field] || '';
                if (value.trim() === '') {
                    missing.push({ index, record });
                }
            });
            if (missing.length > 0) {
                const issueType = `missing_${field.toUpperCase()}`;
                const severity = ISSUE_SEVERITY[issueType] || 'medium';
                results.issues.push({
                    type: issueType,
                    severity: severity,
                    count: missing.length,
                    description: `Missing ${field} for ${missing.length} record(s)`,
                    details: missing.map(m => `Row ${m.index + 2}`)
                });
            }
        });
    }
    
    function validateStatusValues(results) {
        const allowed = ['active', 'sick', 'legal', 'inactive'];
        const invalid = [];
        _data.forEach((record, index) => {
            const status = record.status || '';
            if (status && !allowed.includes(status) && status !== 'unknown') {
                invalid.push({ index, record, value: status });
            }
        });
        if (invalid.length > 0) {
            results.issues.push({
                type: ISSUE_TYPES.INVALID_STATUS,
                severity: ISSUE_SEVERITY[ISSUE_TYPES.INVALID_STATUS],
                count: invalid.length,
                description: `Found ${invalid.length} invalid status value(s)`,
                details: invalid.map(i => `"${i.value}" at row ${i.index + 2}`)
            });
        }
    }
    
    function validateTrainingData(results) {
        const missing = [];
        const programs = ['sevenSensProgram', 'analyticalThinking', 'mindField', 'leadership', 'drivePerformance'];
        _data.forEach((record, index) => {
            const hasProgram = programs.some(prog => {
                const value = record[prog] || '';
                return value.trim() !== '';
            });
            if (!hasProgram) {
                missing.push({ index, record });
            }
        });
        if (missing.length > 0) {
            results.issues.push({
                type: ISSUE_TYPES.MISSING_TRAINING,
                severity: ISSUE_SEVERITY[ISSUE_TYPES.MISSING_TRAINING],
                count: missing.length,
                description: `Missing training data for ${missing.length} record(s)`,
                details: missing.map(m => `Row ${m.index + 2}`)
            });
        }
    }
    
    function validatePhaseData(results) {
        const invalid = [];
        const validPhases = ['Phase1', 'Phase2', 'Phase3', 'Phase4', 'Online-Phase4'];
        _data.forEach((record, index) => {
            const phase = record.trainingPhase || '';
            if (phase && !validPhases.includes(phase)) {
                invalid.push({ index, record, value: phase });
            }
        });
        if (invalid.length > 0) {
            results.issues.push({
                type: ISSUE_TYPES.INVALID_PHASE,
                severity: ISSUE_SEVERITY[ISSUE_TYPES.INVALID_PHASE],
                count: invalid.length,
                description: `Found ${invalid.length} invalid training phase(s)`,
                details: invalid.map(i => `"${i.value}" at row ${i.index + 2}`)
            });
        }
    }
    
    function calculateQualityScore(results) {
        const total = results.total;
        if (total === 0) return 0;
        const deductions = { critical: 15, high: 8, medium: 4, low: 2 };
        let score = 100;
        results.issues.forEach(issue => {
            const severity = issue.severity;
            const count = issue.count || 0;
            const deduction = deductions[severity] || 2;
            score -= deduction * Math.min(count, 10);
        });
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    
    function buildSummary(results) {
        const summary = {
            totalRecords: results.total,
            totalIssues: results.issues.reduce((sum, issue) => sum + (issue.count || 0), 0),
            bySeverity: {},
            byType: {}
        };
        results.issues.forEach(issue => {
            const severity = issue.severity;
            const type = issue.type;
            if (!summary.bySeverity[severity]) summary.bySeverity[severity] = 0;
            summary.bySeverity[severity] += (issue.count || 0);
            if (!summary.byType[type]) summary.byType[type] = 0;
            summary.byType[type] += (issue.count || 0);
        });
        return summary;
    }
    
    function generateReport(format = 'html') {
        if (!_validationResults) runValidation();
        switch (format) {
            case 'json': return JSON.stringify(_validationResults, null, 2);
            case 'html': return generateHTMLReport();
            case 'text': return generateTextReport();
            default: return JSON.stringify(_validationResults, null, 2);
        }
    }
    
    function generateHTMLReport() {
        const results = _validationResults;
        if (!results) return '<p>No validation data available</p>';
        const qualityColor = results.qualityScore >= 80 ? '#00C853' : results.qualityScore >= 60 ? '#FFB300' : '#FF1744';
        let html = `
            <div class="validation-report" style="font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto;">
                <div class="report-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 20px;">
                    <h2 style="font-size: 20px; font-weight: 700; margin: 0; color: #FFFFFF;">Data Quality Report</h2>
                    <div style="text-align: right;">
                        <div style="font-size: 36px; font-weight: 800; color: ${qualityColor}; line-height: 1;">${results.qualityScore}%</div>
                        <div style="font-size: 12px; color: #A0A0C0;">Quality Score</div>
                    </div>
                </div>
                <div class="report-summary" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div class="summary-card" style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: #FFFFFF;">${results.total}</div>
                        <div style="font-size: 12px; color: #A0A0C0;">Total Records</div>
                    </div>
                    <div class="summary-card" style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: ${results.issues.length > 0 ? '#FF1744' : '#00C853'};">${results.issues.length}</div>
                        <div style="font-size: 12px; color: #A0A0C0;">Issue Types</div>
                    </div>
                    <div class="summary-card" style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: #FFB300;">${results.summary.totalIssues}</div>
                        <div style="font-size: 12px; color: #A0A0C0;">Total Issues</div>
                    </div>
                </div>
                <div class="report-details" style="margin-top: 20px;">
                    <h3 style="font-size: 14px; font-weight: 600; color: #FFFFFF; margin-bottom: 12px;">Issues Breakdown</h3>
        `;
        if (results.issues.length === 0) {
            html += `
                <div style="background: rgba(0, 200, 83, 0.1); border: 1px solid rgba(0, 200, 83, 0.2); border-radius: 12px; padding: 20px; text-align: center;">
                    <i class="fas fa-check-circle" style="color: #00C853; font-size: 24px; margin-bottom: 8px; display: block;"></i>
                    <p style="color: #A0A0C0; margin: 0;">All validation checks passed! Data quality is excellent.</p>
                </div>
            `;
        } else {
            results.issues.forEach(issue => {
                const severityColor = issue.severity === 'critical' ? '#FF1744' :
                                     issue.severity === 'high' ? '#FF6B6B' :
                                     issue.severity === 'medium' ? '#FFB300' : '#A0A0C0';
                html += `
                    <div style="background: rgba(255,255,255,0.03); border-left: 3px solid ${severityColor}; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-weight: 500; color: #FFFFFF;">${issue.description}</span>
                                <span style="font-size: 11px; color: #A0A0C0; margin-left: 12px;">${issue.severity.toUpperCase()}</span>
                            </div>
                            <span style="font-size: 16px; font-weight: 700; color: ${severityColor};">${issue.count || 0}</span>
                        </div>
                        ${issue.details ? `
                            <div style="font-size: 12px; color: #66668A; margin-top: 4px;">
                                ${issue.details.slice(0, 5).join(', ')}${issue.details.length > 5 ? ` and ${issue.details.length - 5} more` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }
        html += `
                </div>
                <div class="report-footer" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; margin-top: 20px; font-size: 11px; color: #66668A; text-align: center;">
                    Validated on ${new Date().toLocaleString()}
                </div>
            </div>
        `;
        return html;
    }
    
    function generateTextReport() {
        const results = _validationResults;
        if (!results) return 'No validation data available';
        let text = '=== DATA QUALITY REPORT ===\n\n';
        text += `Quality Score: ${results.qualityScore}%\n`;
        text += `Total Records: ${results.total}\n`;
        text += `Total Issues: ${results.summary.totalIssues}\n`;
        text += `Issue Types: ${results.issues.length}\n\n`;
        if (results.issues.length > 0) {
            text += '--- ISSUES BREAKDOWN ---\n';
            results.issues.forEach(issue => {
                text += `\n[${issue.severity.toUpperCase()}] ${issue.description}\n`;
                text += `  Count: ${issue.count || 0}\n`;
                if (issue.details) {
                    text += `  Details: ${issue.details.slice(0, 5).join(', ')}`;
                    if (issue.details.length > 5) text += ` and ${issue.details.length - 5} more`;
                    text += '\n';
                }
            });
        } else {
            text += 'All validation checks passed! Data quality is excellent.\n';
        }
        text += `\nValidated on ${new Date().toLocaleString()}`;
        return text;
    }
    
    function getResults() { return _validationResults; }
    function getQualityScore() { return _qualityScore; }
    function getIssues() { return _validationResults ? _validationResults.issues : []; }
    function getIssuesBySeverity(severity) {
        if (!_validationResults) return [];
        return _validationResults.issues.filter(issue => issue.severity === severity);
    }
    
    function on(event, callback) {
        if (!_listeners[event]) _listeners[event] = [];
        _listeners[event].push(callback);
    }
    
    function notifyListeners(event, data) {
        if (!_listeners[event]) return;
        _listeners[event].forEach(callback => {
            try { callback(data); } catch (e) { console.error('[Validation] Listener error:', e); }
        });
    }
    
    return {
        init: init,
        runValidation: runValidation,
        getResults: getResults,
        getQualityScore: getQualityScore,
        getIssues: getIssues,
        getIssuesBySeverity: getIssuesBySeverity,
        generateReport: generateReport,
        on: on,
        ISSUE_TYPES: ISSUE_TYPES,
        ISSUE_SEVERITY: ISSUE_SEVERITY
    };
})();

if (typeof window !== 'undefined') {
    window.ValidationModule = ValidationModule;
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.CTIHApp && window.CTIHApp.getData) {
            const data = window.CTIHApp.getData();
            if (data && data.length > 0) {
                ValidationModule.init(data);
            }
        }
    }, 2000);
});