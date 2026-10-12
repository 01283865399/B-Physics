(function () {
    'use strict';

    const physics = window.BETO_PHYSICS;
    const learningData = window.BetoData;

    function displaySelection(gradeId, system, name) {
        const grade = physics?.grades.find((item) => item.id === gradeId);
        document.querySelectorAll('[data-student-name]').forEach((element) => {
            if (name) element.textContent = name;
        });
        document.querySelectorAll('[data-student-grade]').forEach((element) => {
            element.textContent = grade ? `· ${grade.number}` : '';
        });
        document.querySelectorAll('[data-student-system]').forEach((element) => {
            element.textContent = physics?.systems[system] ? `· ${physics.systems[system]}` : '';
        });
    }

    async function loadStudent() {
        let gradeId = '';
        let system = '';
        try {
            const selection = JSON.parse(localStorage.getItem('beto-physics-selection') || '{}');
            gradeId = selection.gradeId || '';
            system = selection.system || '';
        } catch (error) {
            console.warn('تعذر قراءة اختيار الصف المحفوظ.', error);
        }
        if (!learningData) {
            displaySelection(gradeId, system);
            return;
        }
        try {
            const session = await learningData.getSession();
            const user = session?.user;
            if (!user) {
                displaySelection(gradeId, system);
                return;
            }
            const profile = await learningData.loadProfile(user.id);
            gradeId = profile?.grade_id || gradeId;
            system = profile?.study_system || system;
            const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'طالب';
            displaySelection(gradeId, system, name);
        } catch (error) {
            console.error('تعذر تحميل بيانات الطالب:', error);
            displaySelection(gradeId, system);
            const status = document.querySelector('[data-student-status]');
            if (status) status.textContent = 'تعذر تحميل بيانات الحساب؛ يمكنك متابعة تصفح الدروس.';
        }
    }

    document.addEventListener('beto:selection-change', (event) => {
        const selection = event.detail || {};
        displaySelection(selection.gradeId, selection.system);
    });
    loadStudent();
})();
