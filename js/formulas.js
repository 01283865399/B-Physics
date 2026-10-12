(function () {
    'use strict';

    window.renderFormula = function renderFormula(formula, description) {
        if (!formula) return '';
        const equation = formula.equation || formula.symbol || '';
        const note = description || formula.description || '';
        const unit = formula.unit ? `<small>الوحدات: ${escapeHtml(formula.unit)}</small>` : '';
        return `<div class="formula-box" dir="rtl"><strong>${escapeHtml(formula.symbol || 'القانون')}</strong><code dir="ltr">${escapeHtml(equation)}</code><p>${escapeHtml(note)}</p>${unit}</div>`;
    };

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }
})();
