(function () {
    'use strict';

    const db = window.BetoData?.client || null;
    const resourceBucket = 'lesson-files';

    function requireDatabase() {
        if (!db) throw new Error('إعدادات Supabase غير مكتملة.');
        return db;
    }

    async function requireInstructor() {
        if (!window.BetoData || !(await window.BetoData.getRole('instructor'))) {
            throw new Error('هذا القسم متاح للمدرس أو المدير فقط.');
        }
        return requireDatabase();
    }

    function requiredText(value, label, maxLength) {
        const text = String(value || '').trim();
        if (!text || text.length > maxLength) throw new TypeError(`${label} مطلوب وبحد أقصى ${maxLength} حرفًا.`);
        return text;
    }

    function validId(value, label) {
        const id = requiredText(value, label, 120);
        if (!/^[a-zA-Z0-9:_-]+$/.test(id)) throw new TypeError(`${label} يقبل الحروف الإنجليزية والأرقام والشرطة فقط.`);
        return id;
    }

    function resultOrThrow(result) {
        if (result.error) throw result.error;
        return result.data;
    }

    function groupBy(rows, key) {
        return rows.reduce((groups, row) => {
            (groups[row[key]] ||= []).push(row);
            return groups;
        }, {});
    }

    async function fetchCatalogRows() {
        const client = requireDatabase();
        const [grades, courses, units, lessons, quizzes] = await Promise.all([
            client.from('grades').select('id, title, systems').order('id'),
            client.from('courses').select('id, grade_id, title, description, systems').order('created_at'),
            client.from('units').select('id, course_id, title, position').order('position'),
            client.from('lessons').select('id, unit_id, title, description, formulas, video_url, summary, objectives, resources, position').order('position'),
            client.from('quizzes').select('id, unit_id, title, questions')
        ]);
        return {
            grades: resultOrThrow(grades) || [],
            courses: resultOrThrow(courses) || [],
            units: resultOrThrow(units) || [],
            lessons: resultOrThrow(lessons) || [],
            quizzes: resultOrThrow(quizzes) || []
        };
    }

    function mapManagedCatalog(rows) {
        const baseGrades = window.BETO_PHYSICS?.grades || [];
        const coursesByGrade = groupBy(rows.courses, 'grade_id');
        const unitsByCourse = groupBy(rows.units, 'course_id');
        const lessonsByUnit = groupBy(rows.lessons, 'unit_id');
        const quizzesByUnit = new Map(rows.quizzes.map((quiz) => [quiz.unit_id, quiz]));
        const grades = rows.grades.map((grade) => {
            const baseGrade = baseGrades.find((item) => item.id === grade.id);
            const gradeCourses = (coursesByGrade[grade.id] || []).map((course) => {
                const units = (unitsByCourse[course.id] || []).map((unit) => {
                    const quiz = quizzesByUnit.get(unit.id);
                    const unitLessons = (lessonsByUnit[unit.id] || []).map((lesson) => ({
                        id: lesson.id,
                        title: lesson.title,
                        description: lesson.description || '',
                        videoUrl: lesson.video_url || '',
                        summary: lesson.summary || '',
                        objectives: Array.isArray(lesson.objectives) ? lesson.objectives : [],
                        resources: Array.isArray(lesson.resources) ? lesson.resources : [],
                        formulas: Array.isArray(lesson.formulas) ? lesson.formulas : []
                    }));
                    return {
                        id: unit.id,
                        title: unit.title,
                        description: '',
                        lessons: unitLessons,
                        formulas: unitLessons.flatMap((lesson) => lesson.formulas),
                        quiz: quiz ? {
                            id: quiz.id,
                            title: quiz.title,
                            questions: Array.isArray(quiz.questions) ? quiz.questions : []
                        } : null
                    };
                });
                return {
                    id: course.id,
                    title: course.title,
                    description: course.description || '',
                    units,
                    systems: Array.isArray(course.systems) && course.systems.length
                        ? course.systems
                        : (baseGrade?.courses.find((item) => item.id === course.id)?.systems || baseGrade?.systems || grade.systems || []),
                    lessonsCount: units.reduce((count, unit) => count + unit.lessons.length, 0)
                };
            });
            return {
                id: grade.id,
                number: baseGrade?.number || grade.title,
                systems: Array.isArray(grade.systems) && grade.systems.length ? grade.systems : (baseGrade?.systems || []),
                courses: gradeCourses
            };
        });
        window.BETO_PHYSICS = {
            ...window.BETO_PHYSICS,
            grades,
            systems: window.BETO_PHYSICS?.systems || {}
        };
    }

    function showCatalogError(error) {
        console.error('تعذر تحميل المحتوى المُدار؛ سيُعرض المحتوى المحلي مؤقتًا:', error);
        const shell = document.querySelector('.courses-shell');
        if (!shell || document.getElementById('managed-catalog-error')) return;
        const notice = document.createElement('p');
        notice.id = 'managed-catalog-error';
        notice.className = 'physics-empty';
        notice.setAttribute('role', 'alert');
        notice.textContent = 'تعذر تحديث المحتوى من قاعدة البيانات. المعروض الآن هو المحتوى المحلي؛ أعد تحميل الصفحة أو راجع إعدادات Supabase.';
        shell.prepend(notice);
    }

    async function loadManagedCatalog() {
        if (!db) return;
        try {
            const rows = await fetchCatalogRows();
            if (rows.grades.length) mapManagedCatalog(rows);
        } catch (error) {
            showCatalogError(error);
        }
    }

    async function loadAdminContent() {
        await requireInstructor();
        return fetchCatalogRows();
    }

    async function seedStarterCatalog() {
        const client = await requireInstructor();
        const existing = resultOrThrow(await client.from('courses').select('id').limit(1));
        if (existing?.length) throw new Error('توجد مقررات بالفعل؛ لم يتم استبدال أو تعديل أي محتوى.');
        const physics = window.BETO_PHYSICS;
        if (!physics?.grades?.length) throw new Error('تعذر تحميل المنهج المبدئي.');

        const grades = physics.grades.map((grade) => ({ id: grade.id, title: grade.number, systems: grade.systems }));
        const courses = physics.grades.flatMap((grade) => grade.courses.map((course) => ({
            id: course.id,
            grade_id: grade.id,
            title: course.title,
            description: course.description || '',
            systems: course.systems || grade.systems
        })));
        const units = physics.grades.flatMap((grade) => grade.courses.flatMap((course) => course.units.map((unit, position) => ({
            id: unit.id,
            course_id: course.id,
            title: unit.title,
            position
        }))));
        const lessons = physics.grades.flatMap((grade) => grade.courses.flatMap((course) => course.units.flatMap((unit) => unit.lessons.map((lesson, position) => ({
            id: lesson.id,
            unit_id: unit.id,
            title: lesson.title,
            description: lesson.description || '',
            formulas: lesson.formulas || [],
            video_url: lesson.videoUrl || '',
            summary: lesson.summary || '',
            objectives: lesson.objectives || [],
            resources: lesson.resources || [],
            position
        })))));
        const quizzes = physics.grades.flatMap((grade) => grade.courses.flatMap((course) => course.units.filter((unit) => unit.quiz).map((unit) => ({
            id: unit.quiz.id,
            unit_id: unit.id,
            title: unit.quiz.title,
            questions: unit.quiz.questions
        }))));

        for (const [table, data] of [['grades', grades], ['courses', courses], ['units', units], ['lessons', lessons], ['quizzes', quizzes]]) {
            if (data.length) resultOrThrow(await client.from(table).upsert(data, { onConflict: 'id', ignoreDuplicates: true }));
        }
        return fetchCatalogRows();
    }

    async function saveCourse(course) {
        const client = await requireInstructor();
        const row = {
            id: validId(course.id, 'معرّف المقرر'),
            grade_id: validId(course.grade_id, 'الصف'),
            title: requiredText(course.title, 'اسم المقرر', 160),
            description: String(course.description || '').trim().slice(0, 2000),
            systems: Array.isArray(course.systems) && course.systems.length
                ? course.systems.filter((system) => Object.prototype.hasOwnProperty.call(window.BETO_PHYSICS.systems, system))
                : (window.BETO_PHYSICS.grades.find((grade) => grade.id === course.grade_id)?.systems || [])
        };
        if (!row.systems.length) throw new TypeError('اختر نظامًا دراسيًا واحدًا على الأقل.');
        resultOrThrow(await client.from('courses').upsert(row));
        return row;
    }

    async function deleteCourse(courseId) {
        const client = await requireInstructor();
        const units = resultOrThrow(await client.from('units').select('id').eq('course_id', validId(courseId, 'المقرر'))) || [];
        const lessons = units.length
            ? resultOrThrow(await client.from('lessons').select('resources').in('unit_id', units.map((unit) => unit.id))) || []
            : [];
        resultOrThrow(await client.from('courses').delete().eq('id', courseId));
        await removeStoredResources(lessons.flatMap((lesson) => lesson.resources || []));
    }

    async function saveUnit(unit) {
        const client = await requireInstructor();
        const row = {
            id: validId(unit.id, 'معرّف الوحدة'),
            course_id: validId(unit.course_id, 'المقرر'),
            title: requiredText(unit.title, 'اسم الوحدة', 160),
            position: Math.max(0, Number.parseInt(unit.position, 10) || 0)
        };
        resultOrThrow(await client.from('units').upsert(row));
        return row;
    }

    async function deleteUnit(unitId) {
        const client = await requireInstructor();
        const lessons = resultOrThrow(await client.from('lessons').select('resources').eq('unit_id', validId(unitId, 'الوحدة'))) || [];
        resultOrThrow(await client.from('units').delete().eq('id', unitId));
        await removeStoredResources(lessons.flatMap((lesson) => lesson.resources || []));
    }

    async function saveLesson(lesson) {
        const client = await requireInstructor();
        const videoUrl = String(lesson.video_url || '').trim();
        if (videoUrl && !isYouTubeUrl(videoUrl)) throw new TypeError('أدخل رابط فيديو يوتيوب صالحًا.');
        const resources = (Array.isArray(lesson.resources) ? lesson.resources : []).map((resource, index) => {
            const title = requiredText(resource?.title, `اسم الملف ${index + 1}`, 160);
            const url = String(resource?.url || '').trim();
            if (!isExternalResourceUrl(url)) throw new TypeError(`رابط الملف «${title}» غير صالح.`);
            if (resource.storagePath && typeof resource.storagePath !== 'string') {
                throw new TypeError(`مسار الملف «${title}» غير صالح.`);
            }
            return {
                title,
                url,
                ...(resource.storagePath ? { storagePath: resource.storagePath } : {})
            };
        });
        const row = {
            id: validId(lesson.id, 'معرّف الدرس'),
            unit_id: validId(lesson.unit_id, 'الوحدة'),
            title: requiredText(lesson.title, 'اسم الدرس', 180),
            description: String(lesson.description || '').trim().slice(0, 2000),
            video_url: videoUrl,
            summary: String(lesson.summary || '').trim().slice(0, 12000),
            objectives: (lesson.objectives || []).map((item) => String(item).trim()).filter(Boolean).slice(0, 30),
            formulas: Array.isArray(lesson.formulas) ? lesson.formulas : [],
            resources,
            position: Math.max(0, Number.parseInt(lesson.position, 10) || 0)
        };
        resultOrThrow(await client.from('lessons').upsert(row));
        return row;
    }

    function isYouTubeUrl(value) {
        try {
            const url = new URL(value);
            if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) return false;
            const videoId = url.hostname === 'youtu.be'
                ? url.pathname.split('/').filter(Boolean)[0]
                : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1];
            return /^[\w-]{11}$/.test(videoId || '');
        } catch {
            return false;
        }
    }

    function isExternalResourceUrl(value) {
        try {
            return ['http:', 'https:'].includes(new URL(value, window.location.origin).protocol);
        } catch {
            return false;
        }
    }

    async function deleteLesson(lessonId) {
        const client = await requireInstructor();
        const row = resultOrThrow(await client.from('lessons').select('resources').eq('id', validId(lessonId, 'الدرس')).maybeSingle());
        resultOrThrow(await client.from('lessons').delete().eq('id', lessonId));
        await removeStoredResources(row?.resources || []);
    }

    async function saveQuiz(unitId, quiz) {
        const client = await requireInstructor();
        const questions = quiz.questions;
        if (!Array.isArray(questions) || questions.length < 1 || questions.length > 50) {
            throw new TypeError('أضف سؤالًا واحدًا على الأقل، وبحد أقصى 50 سؤالًا.');
        }
        const validQuestions = questions.map((question, index) => {
            const prompt = requiredText(question.prompt, `نص السؤال ${index + 1}`, 1000);
            const options = question.options.map((option) => String(option).trim()).filter(Boolean);
            if (options.length < 2 || options.length > 10) throw new TypeError(`يجب أن يحتوي السؤال ${index + 1} على خيارين إلى 10 خيارات.`);
            if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= options.length) {
                throw new TypeError(`حدد الإجابة الصحيحة للسؤال ${index + 1}.`);
            }
            return {
                id: `${validId(unitId, 'الوحدة')}-q${index + 1}`,
                prompt,
                options,
                answer: question.answer,
                explanation: String(question.explanation || '').trim().slice(0, 2000)
            };
        });
        const row = {
            id: validId(quiz.id, 'معرّف الاختبار'),
            unit_id: validId(unitId, 'الوحدة'),
            title: requiredText(quiz.title, 'عنوان الاختبار', 180),
            questions: validQuestions,
            updated_at: new Date().toISOString()
        };
        resultOrThrow(await client.from('quizzes').upsert(row, { onConflict: 'unit_id' }));
        return row;
    }

    async function deleteQuiz(unitId) {
        const client = await requireInstructor();
        resultOrThrow(await client.from('quizzes').delete().eq('unit_id', validId(unitId, 'الوحدة')));
    }

    function validateResourceTitle(value) {
        return requiredText(value, 'اسم الملف', 160);
    }

    async function addResourceLink(title, url) {
        await requireInstructor();
        const safeUrl = String(url || '').trim();
        if (!isExternalResourceUrl(safeUrl)) throw new TypeError('رابط الملف يجب أن يبدأ بـ http أو https.');
        return { title: validateResourceTitle(title), url: safeUrl };
    }

    async function uploadResource(lesson, file) {
        const client = await requireInstructor();
        if (!file || file.size > 50 * 1024 * 1024) throw new TypeError('الحد الأقصى لحجم الملف 50 ميجابايت.');
        const allowedTypes = [
            'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        if (!allowedTypes.includes(file.type)) throw new TypeError('نوع الملف غير مدعوم. الصيغ المتاحة: PDF وJPG وPNG وWebP وDOCX وPPTX.');
        const safeName = file.name.normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu, '-').slice(-120) || 'resource';
        const objectPath = `${validId(lesson.courseId, 'المقرر')}/${validId(lesson.unitId, 'الوحدة')}/${validId(lesson.id, 'الدرس')}/${Date.now()}-${safeName}`;
        const uploaded = await client.storage.from(resourceBucket).upload(objectPath, file, {
            contentType: file.type,
            upsert: false
        });
        if (uploaded.error) throw uploaded.error;
        const { data } = client.storage.from(resourceBucket).getPublicUrl(objectPath);
        return { title: validateResourceTitle(file.name), url: data.publicUrl, storagePath: objectPath };
    }

    async function removeStoredResources(resources) {
        const paths = resources.filter((resource) => resource?.storagePath).map((resource) => resource.storagePath);
        if (!paths.length) return;
        const response = await requireDatabase().storage.from(resourceBucket).remove(paths);
        if (response.error) throw new Error(`تم حذف المحتوى، لكن تعذر حذف بعض الملفات المرفوعة: ${response.error.message}`);
    }

    async function deleteStoredResource(resource) {
        await requireInstructor();
        await removeStoredResources([resource]);
    }

    window.BETO_CATALOG_READY = loadManagedCatalog();
    window.BetoAdmin = {
        load: loadAdminContent,
        seedStarterCatalog,
        saveCourse,
        deleteCourse,
        saveUnit,
        deleteUnit,
        saveLesson,
        deleteLesson,
        saveQuiz,
        deleteQuiz,
        addResourceLink,
        uploadResource,
        deleteStoredResource
    };
})();
