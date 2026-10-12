(async function () {
    'use strict';

    await window.BETO_CATALOG_READY;
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('course');
    const unitId = params.get('unit');
    const grade = window.BETO_PHYSICS?.grades.flatMap((item) => item.courses.map((course) => ({ grade: item, course })))
        .find((item) => item.course.id === courseId);
    const unit = grade?.course.units.find((item) => item.id === unitId);
    const questionsRoot = document.getElementById('quiz-questions');
    const form = document.getElementById('quiz-form');

    if (!unit || !questionsRoot || !form) {
        document.getElementById('quiz-title').textContent = 'لم يتم العثور على الاختبار';
        questionsRoot?.insertAdjacentHTML('beforeend', '<p class="physics-empty">تحقق من رابط الاختبار واختر وحدة من صفحة المقرر.</p>');
        form?.querySelector('button[type="submit"]')?.setAttribute('disabled', 'disabled');
        return;
    }

    document.title = `${unit.title} | اختبار بيتو فيزيكس`;
    document.getElementById('quiz-title').textContent = `اختبار: ${unit.title}`;
    document.getElementById('quiz-back').href = `course.html?course=${encodeURIComponent(courseId)}&v=30`;
    questionsRoot.innerHTML = unit.quiz.questions.map((question, questionIndex) => `
        <fieldset class="quiz-question">
            <legend><strong>${questionIndex + 1}. ${escapeHtml(question.prompt)}</strong></legend>
            ${question.options.map((option, optionIndex) => `<label class="quiz-option">
                <input type="radio" name="${escapeHtml(question.id)}" value="${optionIndex}" required>
                <span dir="ltr">${escapeHtml(option)}</span>
            </label>`).join('')}
            <p class="quiz-explanation" id="explanation-${escapeHtml(question.id)}" hidden>${escapeHtml(question.explanation)}</p>
        </fieldset>`).join('');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const answers = new FormData(form);
        const questions = unit.quiz.questions;
        const score = questions.reduce((total, question) => total + (Number(answers.get(question.id)) === question.answer ? 1 : 0), 0);
        form.querySelector('button[type="submit"]').disabled = true;
        questions.forEach((question) => {
            const explanation = document.getElementById(`explanation-${question.id}`);
            if (explanation) explanation.hidden = false;
        });
        document.getElementById('quiz-result').textContent = `نتيجتك: ${score} من ${questions.length}`;
        const saveStatus = document.getElementById('quiz-save-status');
        try {
            const userId = await window.BetoData.getUserId();
            if (!userId) {
                saveStatus.textContent = 'سجّل الدخول لحفظ نتيجتك على حسابك.';
                return;
            }
            await window.BetoData.saveQuizResult(userId, unit.quiz.id, score, questions.length);
            saveStatus.textContent = 'تم حفظ نتيجتك في حسابك.';
        } catch (error) {
            console.error('تعذر حفظ نتيجة الاختبار:', error);
            saveStatus.textContent = 'تعذر حفظ النتيجة. تحقق من الاتصال وإعدادات قاعدة البيانات.';
        }
    });

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }
})();
