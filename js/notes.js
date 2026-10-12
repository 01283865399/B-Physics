(function () {
    'use strict';

    const noteField = document.getElementById('student-notes');
    const saveButton = document.getElementById('save-student-notes');
    const status = document.getElementById('notes-status');
    const learningData = window.BetoData;
    let userId = null;

    function showStatus(message, isError) {
        status.textContent = message;
        status.classList.toggle('error', Boolean(isError));
    }

    async function loadNotes() {
        if (!learningData) {
            showStatus('إعدادات Supabase غير مكتملة؛ لم يتم تحميل الملاحظات.', true);
            return;
        }
        try {
            userId = await learningData.getUserId();
            if (!userId) {
                showStatus('سجّل الدخول لتحميل ملاحظاتك وحفظها بين الزيارات.', false);
                return;
            }
            noteField.value = await learningData.loadNote(userId, 'student:general');
            showStatus('تم تحميل ملاحظات حسابك.', false);
        } catch (error) {
            console.error('تعذر تحميل الملاحظات:', error);
            showStatus('تعذر تحميل الملاحظات من قاعدة البيانات.', true);
        }
    }

    saveButton.addEventListener('click', async () => {
        if (!learningData) {
            showStatus('إعدادات Supabase غير مكتملة؛ لم تُحفظ الملاحظات.', true);
            return;
        }
        if (!userId) {
            showStatus('سجّل الدخول أولًا لحفظ ملاحظاتك على حسابك.', true);
            return;
        }
        saveButton.disabled = true;
        try {
            await learningData.saveNote(userId, 'student:general', noteField.value);
            showStatus('تم حفظ ملاحظاتك على حسابك.', false);
        } catch (error) {
            console.error('تعذر حفظ الملاحظات:', error);
            showStatus('تعذر حفظ الملاحظات. تحقق من الاتصال وإعداد قاعدة البيانات.', true);
        } finally {
            saveButton.disabled = false;
        }
    });

    loadNotes();
})();
