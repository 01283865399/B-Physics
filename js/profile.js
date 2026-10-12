const learningData = window.BetoData;
const client = learningData?.client || null;

const statusText = document.getElementById('profile-status');
const nameText = document.getElementById('profile-title');
const emailText = document.getElementById('profile-email');
const createdText = document.getElementById('profile-created');
const avatar = document.getElementById('profile-avatar');
const logoutButton = document.getElementById('logout-button');
const avatarInput = document.getElementById('avatar-input');
const avatarMessage = document.getElementById('avatar-message');
const profileForm = document.getElementById('profile-form');
const profileNameInput = document.getElementById('profile-name-input');
const formMessage = document.getElementById('profile-form-message');
const welcomeName = document.getElementById('welcome-name');
const profileCard = document.querySelector('.profile-card');
let currentUser;

function finishLoading() {
    profileCard?.classList.remove('is-loading');
}

function withTimeout(promise, milliseconds = 10000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase request timed out')), milliseconds))
    ]);
}

function getUserName(user, profile) {
    return profile?.full_name
        || user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split('@')[0]
        || 'طالب بيتو فيزيكس';
}

async function updateLessonSummary(userId, profile) {
    const nextLesson = document.getElementById('profile-next-lesson');
    const progressBar = document.getElementById('learning-progress');
    const progressLabel = document.getElementById('learning-progress-label');
    const physics = window.BETO_PHYSICS;
    const gradeSelect = document.querySelector('[data-grade-select]');
    const systemSelect = document.querySelector('[data-system-select]');
    const selectedGrade = physics?.grades.find((grade) => grade.id === (profile?.grade_id || ''));
    const selectedSystem = profile?.study_system || '';
    if (gradeSelect) gradeSelect.value = profile?.grade_id || '';
    if (systemSelect) systemSelect.value = selectedSystem;
    document.getElementById('profile-grade-label').textContent = selectedGrade?.number || 'لم يتم الاختيار';
    document.getElementById('profile-system-label').textContent = physics?.systems[selectedSystem] || 'لم يتم الاختيار';

    try {
        const progressRows = await learningData.loadProgress(userId);
        const completedIds = new Set((progressRows || []).map((row) => row.lesson_id));
        const allCourses = physics.grades
            .filter((grade) => !profile?.grade_id || grade.id === profile.grade_id)
            .filter((grade) => !selectedSystem || grade.systems.includes(selectedSystem))
            .flatMap((grade) => grade.courses);
        document.getElementById('stat-courses').textContent = String(allCourses.length);
        const lessons = allCourses.flatMap((course) => course.units.flatMap((unit) => unit.lessons));
        const completedCount = lessons.filter((lesson) => completedIds.has(lesson.id)).length;
        const percent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
        const latestLessonId = progressRows?.[0]?.lesson_id;
        const latestLesson = lessons.find((lesson) => lesson.id === latestLessonId);
        document.getElementById('profile-lesson-count').textContent = String(completedCount);
        document.getElementById('profile-last-lesson').textContent = latestLesson?.title || 'لا يوجد بعد';
        if (nextLesson) nextLesson.textContent = latestLesson ? `آخر درس: ${latestLesson.title}` : 'ابدأ أول درس في مقررك';
        if (latestLesson) {
            document.getElementById('profile-resume-title').textContent = 'أكمل من حيث توقفت';
            document.getElementById('profile-resume-text').textContent = `آخر درس مكتمل: ${latestLesson.title}`;
            unlockProfileBadge('badge-first-lesson');
        }
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressLabel) progressLabel.textContent = `${percent}% من الدروس`;

        const quizSummary = await learningData.loadQuizSummary(userId);
        document.getElementById('profile-quiz-count').textContent = String(quizSummary.count);
        document.getElementById('stat-quizzes').textContent = String(quizSummary.count);
        const latestResult = quizSummary.latest;
        document.getElementById('profile-last-quiz').textContent = latestResult
            ? `${latestResult.score} من ${latestResult.total}`
            : 'لا توجد نتائج بعد';
        if (latestResult) unlockProfileBadge('badge-first-quiz');
    } catch (error) {
        console.error('تعذر تحميل تقدم الطالب ونتائج الاختبارات:', error);
        if (nextLesson) nextLesson.textContent = 'تعذر تحميل التقدم؛ حاول تحديث الصفحة.';
        if (progressLabel) progressLabel.textContent = 'غير متاح';
        document.getElementById('profile-last-lesson').textContent = 'غير متاح';
        document.getElementById('profile-last-quiz').textContent = 'غير متاح';
    }

    function unlockProfileBadge(id) {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.classList.add('unlocked');
        const icon = badge.querySelector('i');
        if (icon) icon.className = 'fas fa-check';
    }
}

function showAvatarFallback(displayName) {
    avatar.textContent = displayName.trim().charAt(0).toUpperCase() || '؟';
    avatar.style.backgroundImage = '';
    avatar.classList.remove('has-image');
}

function showAvatar(url, displayName) {
    if (!url) {
        showAvatarFallback(displayName);
        return;
    }

    const image = new Image();
    image.onload = () => {
        avatar.textContent = '';
        avatar.style.backgroundImage = `url("${url}")`;
        avatar.classList.add('has-image');
    };
    image.onerror = () => showAvatarFallback(displayName);
    image.src = url;
}

async function loadProfile() {
    if (!learningData || !client) {
        statusText.textContent = 'إعدادات Supabase غير مكتملة.';
        finishLoading();
        return;
    }

    try {
    const session = await withTimeout(learningData.getSession());
    if (!session) {
        window.location.replace('login.html');
        return;
    }

    const user = session.user;
    currentUser = user;
    let profile = null;
    try {
        profile = await withTimeout(learningData.loadProfile(user.id));
    } catch (error) {
        console.warn('Optional profile data unavailable:', error.message);
    }
    const displayName = getUserName(user, profile);
    nameText.textContent = displayName;
    welcomeName.textContent = displayName.split(' ')[0];
    emailText.textContent = user.email || '-';
    createdText.textContent = new Date(profile?.created_at || user.created_at).toLocaleDateString('ar-EG');
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;
    showAvatar(avatarUrl, displayName);
    profileNameInput.value = displayName;
    if (document.querySelector('[data-grade-select]')) document.querySelector('[data-grade-select]').value = profile?.grade_id || '';
    if (document.querySelector('[data-system-select]')) document.querySelector('[data-system-select]').value = profile?.study_system || '';
    document.getElementById('profile-verified').textContent = user.email_confirmed_at ? 'مؤكد' : 'غير مؤكد';
    statusText.textContent = 'حسابك نشط ويمكنك متابعة رحلة التعلم.';
    finishLoading();
    await updateLessonSummary(user.id, profile);
    } catch (error) {
        console.error('Profile loading error:', error);
        statusText.textContent = 'الحساب نشط. بعض الإحصاءات غير متاحة حاليًا.';
        if (currentUser) {
            const displayName = getUserName(currentUser);
            nameText.textContent = displayName;
            welcomeName.textContent = displayName.split(' ')[0];
            emailText.textContent = currentUser.email || '-';
            profileNameInput.value = displayName;
            showAvatar(currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture, displayName);
        }
        finishLoading();
    }
}

profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fullName = profileNameInput.value.trim();
    if (!currentUser || fullName.length < 2) return;
    const gradeId = document.querySelector('[data-grade-select]')?.value || null;
    const studySystem = document.querySelector('[data-system-select]')?.value || null;
    try {
        await learningData.saveProfile(currentUser.id, {
            full_name: fullName,
            grade_id: gradeId,
            study_system: studySystem
        });
        document.getElementById('profile-title').textContent = fullName;
        welcomeName.textContent = fullName.split(' ')[0];
        if (!avatar.classList.contains('has-image')) avatar.textContent = fullName.charAt(0).toUpperCase();
        await updateLessonSummary(currentUser.id, { grade_id: gradeId, study_system: studySystem });
        formMessage.textContent = 'تم حفظ التعديلات.';
        formMessage.className = 'auth-message success';
    } catch (error) {
        console.error('تعذر حفظ بيانات الطالب:', error);
        formMessage.textContent = 'تعذر حفظ التغييرات. تحقق من الاتصال وحاول مرة أخرى.';
        formMessage.className = 'auth-message error';
    }
});

avatarInput.addEventListener('change', async () => {
    const file = avatarInput.files?.[0];
    if (!file || !currentUser) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        avatarMessage.textContent = 'اختر صورة JPG أو PNG أو WebP بحجم أقل من 5MB.';
        avatarMessage.className = 'profile-inline-message';
        return;
    }

    const previewUrl = URL.createObjectURL(file);
    showAvatar(previewUrl, getUserName(currentUser));
    avatarMessage.textContent = 'جاري رفع الصورة...';
    avatarMessage.className = 'profile-inline-message';
    document.querySelector('.avatar-upload').classList.add('is-uploading');
    const extension = file.name.split('.').pop().toLowerCase();
    const path = `${currentUser.id}/avatar.${extension}`;
    try {
        const { error: uploadError } = await client.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;

        const { data: publicData } = client.storage.from('avatars').getPublicUrl(path);
        const avatarUrl = `${publicData.publicUrl}?v=${Date.now()}`;
        const { error: profileError } = await client.from('profiles').update({ avatar_url: avatarUrl }).eq('id', currentUser.id);
        if (profileError) throw profileError;

        showAvatar(avatarUrl, getUserName(currentUser));
        avatarMessage.textContent = 'تم تحديث صورة الحساب.';
        avatarMessage.className = 'profile-inline-message success';
    } catch (error) {
        console.warn('Optional avatar upload unavailable:', error.message);
        avatarMessage.textContent = 'تعذر تغيير الصورة الآن. ستظل صورة Google أو الصورة الافتراضية ظاهرة.';
        avatarMessage.className = 'profile-inline-message';
    } finally {
        document.querySelector('.avatar-upload').classList.remove('is-uploading');
        URL.revokeObjectURL(previewUrl);
    }
});

logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    const { error } = await client.auth.signOut();
    if (error) {
        statusText.textContent = 'تعذر تسجيل الخروج. حاول مرة أخرى.';
        logoutButton.disabled = false;
        return;
    }
    window.location.replace('login.html');
});

loadProfile();
