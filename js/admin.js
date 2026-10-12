(async function () {
    'use strict';

    const statusTitle = document.getElementById('admin-status-title');
    const statusText = document.getElementById('admin-status');
    const overview = document.getElementById('admin-overview');
    const seedPanel = document.getElementById('admin-seed-panel');
    const workspace = document.getElementById('admin-workspace');
    const message = document.getElementById('admin-message');
    const state = { rows: null, courseId: '', unitId: '', lessonId: '', quizUnitId: '', resources: [] };
    const byId = (id) => document.getElementById(id);

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    function showMessage(text, isError) {
        message.textContent = text;
        message.classList.toggle('is-error', Boolean(isError));
        message.classList.toggle('is-success', !isError && Boolean(text));
    }

    function selectedCourse() {
        return state.rows?.courses.find((course) => course.id === state.courseId) || null;
    }

    function selectedUnit() {
        return state.rows?.units.find((unit) => unit.id === state.unitId) || null;
    }

    function selectedLesson() {
        return state.rows?.lessons.find((lesson) => lesson.id === state.lessonId) || null;
    }

    function unitsForCourse(courseId) {
        return (state.rows?.units || []).filter((unit) => unit.course_id === courseId)
            .sort((first, second) => first.position - second.position);
    }

    function lessonsForUnit(unitId) {
        return (state.rows?.lessons || []).filter((lesson) => lesson.unit_id === unitId)
            .sort((first, second) => first.position - second.position);
    }

    function setSelectOptions(select, rows, placeholder, value, labelFor) {
        select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + rows
            .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(labelFor(row))}</option>`).join('');
        if (rows.some((row) => row.id === value)) select.value = value;
    }

    function renderStats(rows) {
        byId('admin-courses').textContent = String(rows.courses.length);
        byId('admin-units').textContent = String(rows.units.length);
        byId('admin-lessons').textContent = String(rows.lessons.length);
        byId('admin-quizzes').textContent = String(rows.quizzes.length);
        byId('admin-resources').textContent = String(rows.lessons.reduce((total, lesson) => total + (lesson.resources || []).length, 0));
        overview.hidden = false;
    }

    function renderCourseForm() {
        const course = selectedCourse();
        byId('course-form').reset();
        byId('course-grade').value = course?.grade_id || state.rows.grades[0]?.id || '';
        const grade = state.rows.grades.find((item) => item.id === byId('course-grade').value);
        const systems = window.BETO_PHYSICS.systems || {};
        byId('course-systems').innerHTML = Object.entries(systems)
            .map(([id, title]) => `<option value="${escapeHtml(id)}">${escapeHtml(title)}</option>`).join('');
        const selectedSystems = course?.systems?.length ? course.systems : (grade?.systems || []);
        Array.from(byId('course-systems').options).forEach((option) => {
            option.selected = selectedSystems.includes(option.value);
        });
        byId('course-id').value = course?.id || '';
        byId('course-title').value = course?.title || '';
        byId('course-description').value = course?.description || '';
        byId('delete-course').hidden = !course;
        renderChildSelects();
    }

    function renderChildSelects() {
        const course = selectedCourse();
        const units = course ? unitsForCourse(course.id) : [];
        if (!units.some((unit) => unit.id === state.unitId)) state.unitId = '';
        setSelectOptions(byId('unit-select'), units, course ? 'اختر وحدة' : 'اختر مقررًا أولًا', state.unitId, (unit) => unit.title);
        const unit = selectedUnit();
        byId('unit-form').reset();
        byId('unit-id').value = unit?.id || '';
        byId('unit-title').value = unit?.title || '';
        byId('unit-position').value = unit?.position ?? units.length;
        byId('unit-form').querySelectorAll('input, button').forEach((control) => {
            control.disabled = !course;
        });
        byId('delete-unit').hidden = !unit;

        const lessons = unit ? lessonsForUnit(unit.id) : [];
        if (!lessons.some((lesson) => lesson.id === state.lessonId)) state.lessonId = '';
        setSelectOptions(byId('lesson-select'), lessons, unit ? 'اختر درسًا' : 'اختر وحدة أولًا', state.lessonId, (lesson) => lesson.title);
        renderLessonForm();
        renderQuizUnits();
    }

    function renderLessonForm() {
        const lesson = selectedLesson();
        state.resources = Array.isArray(lesson?.resources) ? lesson.resources.map((resource) => ({ ...resource })) : [];
        byId('lesson-form').reset();
        byId('lesson-id').value = lesson?.id || '';
        byId('lesson-title').value = lesson?.title || '';
        byId('lesson-position').value = lesson?.position ?? lessonsForUnit(state.unitId).length;
        byId('lesson-video').value = lesson?.video_url || '';
        byId('lesson-description').value = lesson?.description || '';
        byId('lesson-summary').value = lesson?.summary || '';
        byId('lesson-objectives').value = Array.isArray(lesson?.objectives) ? lesson.objectives.join('\n') : '';
        byId('lesson-form').querySelectorAll('input, textarea, button').forEach((control) => {
            control.disabled = !selectedUnit();
        });
        byId('delete-lesson').hidden = !lesson;
        renderResources();
    }

    function renderResources() {
        const list = byId('resource-list');
        if (!state.resources.length) {
            list.innerHTML = '<li class="admin-resource-empty">لم تتم إضافة ملفات لهذا الدرس بعد.</li>';
            return;
        }
        list.innerHTML = state.resources.map((resource, index) => `
            <li>
                <a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.title)}</a>
                <span>${resource.storagePath ? 'ملف مرفوع' : 'رابط خارجي'}</span>
                <button type="button" data-remove-resource="${index}" aria-label="حذف ${escapeHtml(resource.title)}">حذف</button>
            </li>`).join('');
    }

    function renderQuizUnits() {
        const units = state.rows.units;
        if (!units.some((unit) => unit.id === state.quizUnitId)) state.quizUnitId = '';
        setSelectOptions(byId('quiz-unit-select'), units, 'اختر وحدة', state.quizUnitId, (unit) => {
            const course = state.rows.courses.find((item) => item.id === unit.course_id);
            return `${course?.title || ''} · ${unit.title}`;
        });
        byId('quiz-empty').hidden = units.length > 0;
        byId('quiz-form').hidden = !units.length || !state.quizUnitId;
        const quiz = state.rows.quizzes.find((item) => item.unit_id === state.quizUnitId);
        byId('quiz-id').value = quiz?.id || (state.quizUnitId ? `${state.quizUnitId}-quiz` : '');
        byId('quiz-title').value = quiz?.title || '';
        byId('delete-quiz').hidden = !quiz;
        byId('quiz-questions').innerHTML = '';
        (quiz?.questions || []).forEach((question) => addQuestion(question));
    }

    function addQuestion(question = {}) {
        const index = byId('quiz-questions').children.length;
        const card = document.createElement('article');
        card.className = 'admin-question';
        card.innerHTML = `
            <div class="admin-question-title"><strong>سؤال ${index + 1}</strong><button type="button" data-remove-question aria-label="حذف السؤال ${index + 1}">حذف السؤال</button></div>
            <label>نص السؤال<textarea data-question-prompt rows="2" maxlength="1000" required></textarea></label>
            <label>الاختيارات، كل اختيار في سطر<textarea data-question-options rows="4" placeholder="الاختيار الأول&#10;الاختيار الثاني" required></textarea></label>
            <label>رقم الإجابة الصحيحة<select data-question-answer required></select></label>
            <label>تفسير الإجابة<textarea data-question-explanation rows="2" maxlength="2000"></textarea></label>`;
        card.querySelector('[data-question-prompt]').value = question.prompt || '';
        card.querySelector('[data-question-options]').value = (question.options || []).join('\n');
        card.querySelector('[data-question-explanation]').value = question.explanation || '';
        byId('quiz-questions').append(card);
        updateAnswerOptions(card, question.answer ?? 0);
    }

    function updateAnswerOptions(card, selectedIndex) {
        const options = card.querySelector('[data-question-options]').value.split('\n').map((value) => value.trim()).filter(Boolean);
        const select = card.querySelector('[data-question-answer]');
        const previous = Number.isInteger(selectedIndex) ? selectedIndex : Number(select.value);
        select.innerHTML = options.map((option, index) => `<option value="${index}">${index + 1}. ${escapeHtml(option)}</option>`).join('');
        if (options.length && previous < options.length) select.value = String(previous);
    }

    function renderAll(rows, preferred = {}) {
        state.rows = rows;
        state.courseId = preferred.courseId || state.courseId;
        state.unitId = preferred.unitId || state.unitId;
        state.lessonId = preferred.lessonId || state.lessonId;
        state.quizUnitId = preferred.quizUnitId || state.quizUnitId;
        renderStats(rows);
        setSelectOptions(byId('course-select'), rows.courses, 'اختر مقررًا', state.courseId, (course) => course.title);
        setSelectOptions(byId('course-grade'), rows.grades, 'اختر الصف', rows.grades[0]?.id || '', (grade) => grade.title);
        if (!rows.courses.some((course) => course.id === state.courseId)) state.courseId = '';
        byId('course-select').value = state.courseId;
        renderCourseForm();
        renderQuizUnits();
    }

    async function refresh(preferred = {}) {
        const rows = await window.BetoAdmin.load();
        const hasCourses = rows.courses.length > 0;
        seedPanel.hidden = hasCourses;
        workspace.hidden = !hasCourses;
        if (hasCourses) {
            statusTitle.textContent = 'تم التحقق من صلاحية المدرس';
            statusText.textContent = 'التغييرات هنا تُحفظ في قاعدة البيانات وتظهر للطلاب بعد تحديث الصفحة.';
            renderAll(rows, preferred);
        } else {
            statusTitle.textContent = 'ابدأ بتهيئة كتالوج المقررات';
            statusText.textContent = 'استيراد المنهج الحالي اختياري ويُنفّذ مرة واحدة لإعداد قاعدة البيانات.';
        }
    }

    async function withAction(action, successMessage, preferred) {
        showMessage('', false);
        try {
            await action();
            await refresh(preferred);
            if (successMessage) showMessage(successMessage, false);
        } catch (error) {
            console.error('تعذر تنفيذ إجراء لوحة التحكم:', error);
            showMessage(error.message || 'تعذر إكمال العملية. تحقق من الاتصال والصلاحيات.', true);
            if (/تم حذف المحتوى، لكن تعذر حذف/.test(error.message || '')) {
                try { await refresh(preferred); } catch (refreshError) { console.error('تعذر تحديث اللوحة بعد حذف المحتوى:', refreshError); }
            }
        }
    }

    byId('admin-seed').addEventListener('click', () => withAction(
        async () => { await window.BetoAdmin.seedStarterCatalog(); },
        'تم استيراد المنهج المبدئي. يمكنك الآن تعديل المحتوى.',
        {}
    ));

    byId('course-select').addEventListener('change', () => {
        state.courseId = byId('course-select').value;
        state.unitId = '';
        state.lessonId = '';
        renderCourseForm();
    });
    byId('course-grade').addEventListener('change', () => {
        if (selectedCourse()) return;
        const grade = state.rows.grades.find((item) => item.id === byId('course-grade').value);
        Array.from(byId('course-systems').options).forEach((option) => {
            option.selected = (grade?.systems || []).includes(option.value);
        });
    });
    byId('new-course').addEventListener('click', () => {
        state.courseId = '';
        state.unitId = '';
        state.lessonId = '';
        byId('course-select').value = '';
        renderCourseForm();
        byId('course-id').value = `course-${Date.now()}`;
        byId('course-title').focus();
    });
    byId('course-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const course = {
            id: byId('course-id').value,
            grade_id: byId('course-grade').value,
            systems: Array.from(byId('course-systems').selectedOptions).map((option) => option.value),
            title: byId('course-title').value,
            description: byId('course-description').value
        };
        withAction(() => window.BetoAdmin.saveCourse(course), 'تم حفظ المقرر.', { courseId: course.id });
    });
    byId('delete-course').addEventListener('click', () => {
        const course = selectedCourse();
        if (!course || !window.confirm(`سيُحذف المقرر «${course.title}» وكل وحداته ودروسه واختباراته. هل تريد المتابعة؟`)) return;
        withAction(() => window.BetoAdmin.deleteCourse(course.id), 'تم حذف المقرر.', {});
    });

    byId('unit-select').addEventListener('change', () => {
        state.unitId = byId('unit-select').value;
        state.lessonId = '';
        renderChildSelects();
    });
    byId('new-unit').addEventListener('click', () => {
        if (!selectedCourse()) return showMessage('اختر مقررًا أولًا.', true);
        state.unitId = '';
        state.lessonId = '';
        byId('unit-select').value = '';
        renderChildSelects();
        byId('unit-id').value = `unit-${Date.now()}`;
        byId('unit-title').focus();
    });
    byId('unit-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const unit = {
            id: byId('unit-id').value,
            course_id: selectedCourse()?.id,
            title: byId('unit-title').value,
            position: byId('unit-position').value
        };
        withAction(() => window.BetoAdmin.saveUnit(unit), 'تم حفظ الوحدة.', { courseId: state.courseId, unitId: unit.id });
    });
    byId('delete-unit').addEventListener('click', () => {
        const unit = selectedUnit();
        if (!unit || !window.confirm(`سيُحذف «${unit.title}» وكل دروسها واختبارها. هل تريد المتابعة؟`)) return;
        withAction(() => window.BetoAdmin.deleteUnit(unit.id), 'تم حذف الوحدة.', { courseId: state.courseId });
    });

    byId('lesson-select').addEventListener('change', () => {
        state.lessonId = byId('lesson-select').value;
        renderLessonForm();
    });
    byId('new-lesson').addEventListener('click', () => {
        if (!selectedUnit()) return showMessage('اختر وحدة أولًا.', true);
        state.lessonId = '';
        byId('lesson-select').value = '';
        renderLessonForm();
        byId('lesson-id').value = `lesson-${Date.now()}`;
        byId('lesson-title').focus();
    });

    function lessonFormData(resources = state.resources) {
        const unit = selectedUnit();
        return {
            id: byId('lesson-id').value,
            unit_id: unit?.id,
            title: byId('lesson-title').value,
            description: byId('lesson-description').value,
            video_url: byId('lesson-video').value,
            summary: byId('lesson-summary').value,
            objectives: byId('lesson-objectives').value.split('\n').map((value) => value.trim()).filter(Boolean),
            formulas: selectedLesson()?.formulas || [],
            resources,
            position: byId('lesson-position').value
        };
    }

    byId('lesson-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const lesson = lessonFormData();
        withAction(() => window.BetoAdmin.saveLesson(lesson), 'تم حفظ الدرس ومحتواه.', {
            courseId: state.courseId, unitId: state.unitId, lessonId: lesson.id
        });
    });
    byId('delete-lesson').addEventListener('click', () => {
        const lesson = selectedLesson();
        if (!lesson || !window.confirm(`هل تريد حذف الدرس «${lesson.title}»؟`)) return;
        withAction(() => window.BetoAdmin.deleteLesson(lesson.id), 'تم حذف الدرس.', {
            courseId: state.courseId, unitId: state.unitId
        });
    });

    byId('add-resource-link').addEventListener('click', async () => {
        try {
            const resource = await window.BetoAdmin.addResourceLink(byId('resource-title').value, byId('resource-url').value);
            state.resources.push(resource);
            byId('resource-title').value = '';
            byId('resource-url').value = '';
            renderResources();
            showMessage('أُضيف الرابط إلى مسودة الدرس؛ اضغط «حفظ الدرس» لتثبيته.', false);
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    byId('upload-resource').addEventListener('click', async () => {
        const file = byId('resource-file').files[0];
        const lesson = lessonFormData();
        if (!selectedUnit()) return showMessage('اختر وحدة قبل رفع الملفات.', true);
        if (!lesson.id || !lesson.title) return showMessage('أدخل معرّف الدرس وعنوانه قبل رفع ملف.', true);
        let uploadedResource;
        try {
            await window.BetoAdmin.saveLesson(lesson);
            uploadedResource = await window.BetoAdmin.uploadResource({
                id: lesson.id,
                unitId: state.unitId,
                courseId: state.courseId
            }, file);
            const resources = [...state.resources, uploadedResource];
            await window.BetoAdmin.saveLesson(lessonFormData(resources));
            state.resources = resources;
            state.lessonId = lesson.id;
            byId('lesson-select').value = lesson.id;
            byId('resource-file').value = '';
            renderResources();
            await refresh({ courseId: state.courseId, unitId: state.unitId, lessonId: lesson.id });
            showMessage('تم رفع الملف وربطه بالدرس.', false);
        } catch (error) {
            if (uploadedResource) {
                try { await window.BetoAdmin.deleteStoredResource(uploadedResource); }
                catch (cleanupError) { console.error('تعذر تنظيف الملف بعد فشل حفظه:', cleanupError); }
            }
            console.error('تعذر رفع ملف الدرس:', error);
            showMessage(error.message || 'تعذر رفع الملف. تحقق من إعدادات التخزين.', true);
        }
    });

    byId('resource-list').addEventListener('click', async (event) => {
        const button = event.target.closest('[data-remove-resource]');
        if (!button) return;
        const index = Number(button.dataset.removeResource);
        const resource = state.resources[index];
        try {
            const resources = state.resources.filter((item, itemIndex) => itemIndex !== index);
            if (resource.storagePath && selectedLesson()) {
                await window.BetoAdmin.saveLesson(lessonFormData(resources));
                await window.BetoAdmin.deleteStoredResource(resource);
            } else if (resource.storagePath) {
                await window.BetoAdmin.deleteStoredResource(resource);
            }
            state.resources.splice(index, 1);
            renderResources();
            showMessage('حُذف الملف من التخزين عند كونه مرفوعًا؛ احفظ الدرس لتثبيت التعديل.', false);
        } catch (error) {
            console.error('تعذر حذف الملف:', error);
            showMessage(error.message || 'تعذر حذف الملف.', true);
        }
    });

    byId('quiz-unit-select').addEventListener('change', () => {
        state.quizUnitId = byId('quiz-unit-select').value;
        renderQuizUnits();
    });
    byId('add-question').addEventListener('click', () => addQuestion());
    byId('quiz-questions').addEventListener('input', (event) => {
        if (event.target.matches('[data-question-options]')) updateAnswerOptions(event.target.closest('.admin-question'));
    });
    byId('quiz-questions').addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove-question]');
        if (button) button.closest('.admin-question').remove();
        Array.from(byId('quiz-questions').children).forEach((question, index) => {
            question.querySelector('.admin-question-title strong').textContent = `سؤال ${index + 1}`;
        });
    });
    byId('quiz-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const questions = Array.from(byId('quiz-questions').querySelectorAll('.admin-question')).map((card) => ({
            prompt: card.querySelector('[data-question-prompt]').value,
            options: card.querySelector('[data-question-options]').value.split('\n').map((value) => value.trim()).filter(Boolean),
            answer: Number(card.querySelector('[data-question-answer]').value),
            explanation: card.querySelector('[data-question-explanation]').value
        }));
        const quiz = { id: byId('quiz-id').value, title: byId('quiz-title').value, questions };
        withAction(() => window.BetoAdmin.saveQuiz(state.quizUnitId, quiz), 'تم حفظ الاختبار.', { quizUnitId: state.quizUnitId });
    });
    byId('delete-quiz').addEventListener('click', () => {
        if (!state.quizUnitId || !window.confirm('هل تريد حذف اختبار هذه الوحدة؟')) return;
        withAction(() => window.BetoAdmin.deleteQuiz(state.quizUnitId), 'تم حذف الاختبار.', { quizUnitId: state.quizUnitId });
    });

    document.querySelectorAll('[data-admin-tab]').forEach((tab) => tab.addEventListener('click', () => {
        document.querySelectorAll('[data-admin-tab]').forEach((item) => item.classList.toggle('is-active', item === tab));
        document.querySelectorAll('[data-panel]').forEach((panel) => {
            panel.hidden = panel.dataset.panel !== tab.dataset.adminTab;
        });
    }));

    try {
        await window.BETO_CATALOG_READY;
        await refresh();
    } catch (error) {
        console.error('تعذر تحميل لوحة إدارة المحتوى:', error);
        statusTitle.textContent = 'تعذر فتح لوحة التحكم';
        statusText.textContent = error.message === 'هذا القسم متاح للمدرس أو المدير فقط.'
            ? 'سجّل الدخول بحساب مُنح دور المدرس أو المدير.'
            : 'تحقق من إعداد Supabase ومن تشغيل database/database-schema.sql ثم حاول مجددًا.';
    }
})();
