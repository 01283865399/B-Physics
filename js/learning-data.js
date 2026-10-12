(function () {
    'use strict';

    const config = window.SUPABASE_CONFIG || {};
    const client = window.BETO_SUPABASE_CLIENT || (
        window.supabase && config.url && config.anonKey
            ? window.supabase.createClient(config.url, config.anonKey)
            : null
    );
    const systems = window.BETO_PHYSICS?.systems || {};
    if (client) window.BETO_SUPABASE_CLIENT = client;

    function requireClient() {
        if (!client) throw new Error('إعدادات Supabase غير مكتملة.');
        return client;
    }

    function requireId(value, label) {
        if (typeof value !== 'string' || !/^[a-zA-Z0-9:_-]{1,120}$/.test(value)) {
            throw new TypeError(`${label} غير صالح.`);
        }
        return value;
    }

    function validateScore(score, total) {
        if (!Number.isInteger(score) || !Number.isInteger(total) || total < 1 || score < 0 || score > total) {
            throw new TypeError('نتيجة الاختبار غير صالحة.');
        }
    }

    async function getSession() {
        const db = requireClient();
        const { data, error } = await db.auth.getSession();
        if (error) throw error;
        return data.session || null;
    }

    async function requireOwner(userId) {
        const session = await getSession();
        if (!session?.user?.id) throw new Error('سجّل الدخول أولًا.');
        if (userId && session.user.id !== userId) throw new Error('لا يمكن الوصول إلى بيانات حساب آخر.');
        return session.user.id;
    }

    async function saveProgress(userId, lessonId, completed) {
        const ownerId = await requireOwner(userId);
        const row = {
            user_id: ownerId,
            lesson_id: requireId(lessonId, 'معرّف الدرس'),
            completed: Boolean(completed),
            updated_at: new Date().toISOString()
        };
        const { error } = await requireClient().from('student_progress')
            .upsert(row, { onConflict: 'user_id,lesson_id' });
        if (error) throw error;
    }

    async function loadProgress(userId) {
        const ownerId = await requireOwner(userId);
        const { data, error } = await requireClient().from('student_progress')
            .select('lesson_id, completed, updated_at')
            .eq('user_id', ownerId)
            .eq('completed', true)
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async function saveQuizResult(userId, quizId, score, total) {
        const ownerId = await requireOwner(userId);
        validateScore(score, total);
        const { error } = await requireClient().from('quiz_results').insert({
            user_id: ownerId,
            quiz_id: requireId(quizId, 'معرّف الاختبار'),
            score,
            total
        });
        if (error) throw error;
    }

    async function loadQuizResults(userId, limit) {
        const ownerId = await requireOwner(userId);
        const rowLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 100;
        const { data, error } = await requireClient().from('quiz_results')
            .select('quiz_id, score, total, completed_at')
            .eq('user_id', ownerId)
            .order('completed_at', { ascending: false })
            .limit(rowLimit);
        if (error) throw error;
        return data || [];
    }

    async function loadQuizSummary(userId) {
        const ownerId = await requireOwner(userId);
        const { data, count, error } = await requireClient().from('quiz_results')
            .select('quiz_id, score, total, completed_at', { count: 'exact' })
            .eq('user_id', ownerId)
            .order('completed_at', { ascending: false })
            .limit(1);
        if (error) throw error;
        return { latest: data?.[0] || null, count: count || 0 };
    }

    async function loadNote(userId, noteId) {
        const ownerId = await requireOwner(userId);
        const { data, error } = await requireClient().from('student_notes')
            .select('note, updated_at')
            .eq('user_id', ownerId)
            .eq('lesson_id', requireId(noteId, 'معرّف الملاحظة'))
            .maybeSingle();
        if (error) throw error;
        return data?.note || '';
    }

    async function saveNote(userId, noteId, note) {
        const ownerId = await requireOwner(userId);
        if (typeof note !== 'string' || note.length > 10000) throw new TypeError('الملاحظة أطول من الحد المسموح.');
        const { error } = await requireClient().from('student_notes').upsert({
            user_id: ownerId,
            lesson_id: requireId(noteId, 'معرّف الملاحظة'),
            note: note.trim(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,lesson_id' });
        if (error) throw error;
    }

    async function loadProfile(userId) {
        const ownerId = await requireOwner(userId);
        const { data, error } = await requireClient().from('profiles')
            .select('full_name, avatar_url, created_at, grade_id, study_system')
            .eq('id', ownerId)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    async function saveProfile(userId, profile) {
        const ownerId = await requireOwner(userId);
        const fullName = String(profile.full_name || '').trim();
        const gradeId = String(profile.grade_id || '');
        const studySystem = String(profile.study_system || '');
        const grade = window.BETO_PHYSICS?.grades.find((item) => item.id === gradeId);
        if (fullName.length < 2 || fullName.length > 80) throw new TypeError('الاسم يجب أن يكون بين حرفين و80 حرفًا.');
        if (gradeId && !grade) throw new TypeError('الصف الدراسي غير صالح.');
        if (studySystem && !systems[studySystem]) throw new TypeError('النظام الدراسي غير صالح.');
        const { data, error } = await requireClient().from('profiles').update({
            full_name: fullName,
            grade_id: gradeId || null,
            study_system: studySystem || null,
            updated_at: new Date().toISOString()
        }).eq('id', ownerId).select('full_name, grade_id, study_system').single();
        if (error) throw error;
        return data;
    }

    async function getRole(role) {
        if (!['instructor', 'admin'].includes(role)) throw new TypeError('الدور المطلوب غير صالح.');
        const session = await getSession();
        if (!session?.user?.id) return false;
        const { data, error } = await requireClient().from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .in('role', role === 'instructor' ? ['instructor', 'admin'] : ['admin'])
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return Boolean(data);
    }

    async function loadInstructorOverview() {
        if (!(await getRole('instructor'))) throw new Error('هذا القسم متاح للمدرس أو المدير فقط.');
        const db = requireClient();
        const countRows = async (table) => {
            const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
            if (error) throw error;
            return count || 0;
        };
        const [courses, units, lessons, enrollments, progress, quizResults] = await Promise.all([
            countRows('courses'),
            countRows('units'),
            countRows('lessons'),
            countRows('enrollments'),
            countRows('student_progress'),
            countRows('quiz_results')
        ]);
        return { courses, units, lessons, enrollments, progress, quizResults };
    }

    window.BetoData = {
        client,
        getSession,
        getUserId: async () => (await getSession())?.user?.id || null,
        saveProgress,
        loadProgress,
        saveQuizResult,
        loadQuizResults,
        loadQuizSummary,
        loadNote,
        saveNote,
        loadProfile,
        saveProfile,
        getRole,
        loadInstructorOverview
    };
})();
