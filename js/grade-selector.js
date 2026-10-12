(async function () {
    'use strict';

    await window.BETO_CATALOG_READY;
    const data = window.BETO_PHYSICS;
    if (!data) return;

    const gradeSelects = document.querySelectorAll('[data-grade-select]');
    const systemSelects = document.querySelectorAll('[data-system-select]');
    const saved = readSelection();

    gradeSelects.forEach((select) => {
        select.innerHTML = '<option value="">كل الصفوف</option>' + data.grades
            .map((grade) => `<option value="${grade.id}">${grade.number}</option>`).join('');
        if (saved.gradeId && Array.from(select.options).some((option) => option.value === saved.gradeId)) {
            select.value = saved.gradeId;
        }
        select.addEventListener('change', saveSelection);
    });

    systemSelects.forEach((select) => {
        const systemOptions = Object.entries(data.systems)
            .map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
        select.innerHTML = '<option value="">كل الأنظمة</option>' + systemOptions;
        if (saved.system && Array.from(select.options).some((option) => option.value === saved.system)) {
            select.value = saved.system;
        }
        select.addEventListener('change', saveSelection);
    });

    function saveSelection() {
        const gradeId = document.querySelector('[data-grade-select]')?.value || '';
        const system = document.querySelector('[data-system-select]')?.value || '';
        try {
            localStorage.setItem('beto-physics-selection', JSON.stringify({ gradeId, system }));
        } catch (error) {
            console.warn('تعذر حفظ اختيار الصف على هذا الجهاز.', error);
        }
        updateCourseLinks(gradeId, system);
        document.dispatchEvent(new CustomEvent('beto:selection-change', { detail: { gradeId, system } }));
    }

    function updateCourseLinks(gradeId, system) {
        const params = new URLSearchParams();
        if (gradeId) params.set('grade', gradeId);
        if (system) params.set('system', system);
        const query = params.toString();
        document.querySelectorAll('[data-course-filter-link]').forEach((link) => {
            link.href = `courses.html${query ? `?${query}` : ''}`;
        });
    }

    function readSelection() {
        try {
            return JSON.parse(localStorage.getItem('beto-physics-selection') || '{}');
        } catch (error) {
            console.warn('تعذر قراءة اختيار الصف المحفوظ.', error);
            return {};
        }
    }

    updateCourseLinks(
        document.querySelector('[data-grade-select]')?.value || '',
        document.querySelector('[data-system-select]')?.value || ''
    );
})();
