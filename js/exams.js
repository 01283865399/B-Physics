(async function () {
    'use strict';

    await window.BETO_CATALOG_READY;
    const root = document.getElementById('exam-list');
    const physics = window.BETO_PHYSICS;
    if (!root || !physics) return;

    function renderExams() {
        const gradeId = document.querySelector('[data-grade-select]')?.value || '';
        const system = document.querySelector('[data-system-select]')?.value || '';
        const exams = physics.grades.flatMap((grade) => grade.courses
            .filter(() => (!gradeId || grade.id === gradeId) && (!system || grade.systems.includes(system)))
            .flatMap((course) => course.units
                .filter((unit) => unit.quiz)
                .map((unit) => ({ grade, course, unit }))));

        if (!exams.length) {
            root.innerHTML = '<p class="physics-empty">لا توجد اختبارات متاحة لهذا الاختيار حتى الآن.</p>';
            return;
        }
        root.innerHTML = exams.map(({ grade, course, unit }) => `
            <article class="exam-item">
                <span class="exam-mark" aria-hidden="true"><i class="fas fa-atom"></i><small>تدريب</small></span>
                <div>
                    <h2>${escapeHtml(unit.title)}</h2>
                    <p>${escapeHtml(grade.number)} · ${escapeHtml(course.title)} · ${unit.quiz.questions.length} أسئلة تدريبية</p>
                </div>
                <a class="physics-button" href="quiz.html?course=${encodeURIComponent(course.id)}&amp;unit=${encodeURIComponent(unit.id)}">ابدأ الاختبار <i class="fas fa-arrow-left" aria-hidden="true"></i></a>
            </article>`).join('');
        window.BetoMotion?.refresh(root);
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    document.querySelectorAll('[data-grade-select], [data-system-select]').forEach((select) => {
        select.addEventListener('change', renderExams);
    });
    document.addEventListener('beto:selection-change', renderExams);
    renderExams();
})();
