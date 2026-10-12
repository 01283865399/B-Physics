(async function () {
    'use strict';

    await window.BETO_CATALOG_READY;
    const physics = window.BETO_PHYSICS;
    if (!physics) {
        console.error('تعذر تحميل بيانات بيتو فيزيكس.');
        return;
    }

    const learningData = window.BetoData;
    const client = learningData?.client || null;
    const page = document.body.dataset.coursePage;
    const courses = physics.grades.flatMap((grade) => grade.courses.map((course) => ({
        ...course,
        gradeId: grade.id,
        gradeNumber: grade.number,
        systems: course.systems || grade.systems
    })));
    let currentCourse = null;
    let completedLessons = new Set();
    let currentUserId = null;

    async function getUserId() {
        currentUserId = learningData ? await learningData.getUserId() : null;
        return currentUserId;
    }

    async function saveProgress(userId, lessonId, completed) {
        if (!learningData) throw new Error('طبقة بيانات التعلم غير متاحة.');
        await learningData.saveProgress(userId, lessonId, completed);
        if (completed) completedLessons.add(lessonId);
        else completedLessons.delete(lessonId);
        updateProgressUI();
    }

    async function loadProgress(userId) {
        if (!learningData) throw new Error('طبقة بيانات التعلم غير متاحة.');
        return learningData.loadProgress(userId);
    }

    async function saveQuizResult(userId, quizId, score, total) {
        if (!learningData) throw new Error('طبقة بيانات التعلم غير متاحة.');
        return learningData.saveQuizResult(userId, quizId, score, total);
    }

    function updateProgressUI() {
        if (!currentCourse) return;
        const total = currentCourse.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
        const completed = currentCourse.units.reduce((sum, unit) => sum + unit.lessons.filter((lesson) => completedLessons.has(lesson.id)).length, 0);
        const percent = total ? Math.round((completed / total) * 100) : 0;
        const label = document.getElementById('course-progress-label');
        const bar = document.getElementById('course-progress-bar');
        const track = bar?.parentElement;
        if (label) label.textContent = `${percent}% · ${completed} من ${total} درس`;
        if (bar) bar.style.width = `${percent}%`;
        if (track) track.setAttribute('aria-valuenow', String(percent));
        document.querySelectorAll('[data-lesson-complete]').forEach((button) => {
            const done = completedLessons.has(button.dataset.lessonComplete);
            button.classList.toggle('is-complete', done);
            button.innerHTML = done
                ? '<i class="fas fa-check-circle"></i> تم إكمال الدرس'
                : '<i class="far fa-circle-check"></i> تسجيل إكمال الدرس';
        });
    }

    function showMessage(elementId, message, isError) {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.textContent = message;
        element.classList.toggle('error', Boolean(isError));
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    function categoryFor(text) {
        if (/حديث|ليزر|إلكترون|إلكتروني|ذري|كمية|فوتون|أشعة سينية|موجة والجسيم/.test(text)) return 'modern';
        if (/مغناط|كهرومغناط|حث/.test(text)) return 'magnetism';
        if (/موج|صوت|دوبلر|انكسار|انعكاس|شق مزدوج/.test(text)) return 'waves';
        if (/حرار|غاز/.test(text)) return 'heat';
        if (/كهرب|كيرشوف|أوم|كولوم|كثف/.test(text)) return 'electricity';
        if (/حركة|سرعة|قوة|عزم|قدرة|تحرك|كبلر|جاذبية|بندول|مقذوف|قياس|كميات|كثافة|علوم متكاملة/.test(text)) return 'mechanics';
        return '';
    }

    function formatArabicCount(count, forms) {
        if (count === 0) return forms.zero;
        if (count === 1) return forms.one;
        if (count === 2) return forms.two;
        if (count <= 10) return `${count} ${forms.few}`;
        return `${count} ${forms.many}`;
    }

    function lessonUrl(lessonId) {
        return `lesson.html?lesson=${encodeURIComponent(lessonId)}&amp;v=30`;
    }

    function courseUrl(courseId) {
        return `course.html?course=${encodeURIComponent(courseId)}&amp;v=30`;
    }

    function renderCatalog() {
        const grid = document.getElementById('course-grid');
        if (!grid) return;
        const gradeSelect = document.querySelector('[data-grade-select]');
        const systemSelect = document.querySelector('[data-system-select]');
        const searchInput = document.getElementById('course-search');
        const query = (searchInput?.value || '').trim().toLowerCase();
        const gradeId = gradeSelect?.value || '';
        const system = systemSelect?.value || '';
        const visible = courses.filter((course) => {
            const searchable = `${course.title} ${course.gradeNumber} ${course.systems.map((item) => physics.systems[item]).join(' ')} ${course.units.map((unit) => unit.title).join(' ')}`.toLowerCase();
            return (!gradeId || course.gradeId === gradeId)
                && (!system || course.systems.includes(system))
                && (!query || searchable.includes(query));
        });
        grid.innerHTML = visible.length ? visible.map((course) => {
            const lessonCount = course.lessonsCount;
            const topic = categoryFor(`${course.title} ${course.units.map((unit) => unit.title).join(' ')}`) || 'mechanics';
            const artwork = {
                modern: ['E = h f', 'الفيزياء الحديثة'],
                magnetism: ['Φ = B A cos θ', 'المغناطيسية'],
                waves: ['v = f λ', 'الموجات'],
                heat: ['Q = m c ΔT', 'الحرارة'],
                electricity: ['V = I R', 'الكهرباء'],
                mechanics: ['F = m a', 'الميكانيكا']
            }[topic];
            const unitTopics = course.units.slice(0, 3).map((unit) => {
                const title = unit.title.replace(/^(الوحدة|الجزء)\s+(الأولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة|التاسعة|العاشرة):?\s*/, '');
                return `<span>${escapeHtml(title)}</span>`;
            }).join('');
            return `<a class="course-card" href="${courseUrl(course.id)}">
                <figure class="course-art" data-topic="${topic}" aria-hidden="true">
                    <figcaption><span>${artwork[1]}</span><code>${artwork[0]}</code></figcaption>
                </figure>
                <div class="course-card-head"><span class="course-icon"><i class="fas fa-atom" aria-hidden="true"></i></span><span class="course-status">هيكل أولي</span></div>
                <span class="physics-course-chip">${escapeHtml(course.gradeNumber)} · ${escapeHtml(course.systems.map((item) => physics.systems[item]).join(' / '))}</span>
                <h2>${escapeHtml(course.title)}</h2>
                <div class="course-meta"><span><i class="fas fa-layer-group" aria-hidden="true"></i> ${formatArabicCount(course.units.length, { zero: 'لا توجد وحدات', one: 'وحدة واحدة', two: 'وحدتان', few: 'وحدات', many: 'وحدة' })}</span><span><i class="fas fa-book-open" aria-hidden="true"></i> ${formatArabicCount(lessonCount, { zero: 'لا توجد دروس', one: 'درس واحد', two: 'درسان', few: 'دروس', many: 'درسًا' })}</span></div>
                <div class="skill-list" aria-label="موضوعات في المقرر">${unitTopics}</div>
                <div class="course-card-action"><span>استكشف وحدات المقرر</span><i class="fas fa-arrow-left" aria-hidden="true"></i></div>
            </a>`;
        }).join('') : '<p class="physics-empty" role="status">لا توجد مقررات تطابق بحثك واختياراتك الحالية.</p>';
        window.BetoMotion?.refresh(grid);
        const count = document.getElementById('course-count');
        if (count) count.textContent = formatArabicCount(visible.length, { zero: 'لا توجد مقررات', one: 'مقرر واحد', two: 'مقرران', few: 'مقررات', many: 'مقررًا' });
        const reset = document.getElementById('course-reset');
        if (reset) reset.hidden = !gradeId && !system && !query;
    }

    function renderCourseDetail() {
        const id = new URLSearchParams(window.location.search).get('course');
        currentCourse = courses.find((course) => course.id === id);
        const container = document.getElementById('course-units');
        if (!container) return;
        if (!currentCourse) {
            container.innerHTML = '<p class="physics-empty">لم يتم العثور على هذا المقرر. ارجع إلى قائمة المقررات.</p>';
            return;
        }
        document.title = `${currentCourse.title} | بيتو فيزيكس`;
        document.getElementById('course-title').textContent = currentCourse.title;
        document.getElementById('course-grade-label').textContent = `${currentCourse.gradeNumber} · ${currentCourse.systems.map((system) => physics.systems[system]).join(' / ')}`;
        document.getElementById('course-description').textContent = 'هيكل أولي للدروس والقوانين والاختبارات. تُراجع المواد التفصيلية مع المنهج الرسمي قبل النشر.';
        const stats = document.getElementById('course-stats');
        stats.innerHTML = `<div class="detail-stat"><strong>${currentCourse.units.length}</strong><span>وحدات</span></div><div class="detail-stat"><strong>${currentCourse.lessonsCount}</strong><span>دروس</span></div>`;
        container.innerHTML = currentCourse.units.map((unit) => `<details class="course-unit" open>
            <summary><strong>${escapeHtml(unit.title)}</strong><span>${unit.lessons.length} دروس</span></summary>
            <p class="unit-description">${escapeHtml(unit.description)}</p>
            <div class="material-list">${unit.lessons.map((lesson) => `<article class="lesson-card">
                <h3><a href="${lessonUrl(lesson.id)}">${escapeHtml(lesson.title)}</a></h3>
                <p>${escapeHtml(lesson.description || 'صفحة درس مستقلة تضم الفيديو والملخص والقوانين والمواد المساندة.')}</p>
                ${(lesson.formulas || []).map((formula) => window.renderFormula(formula)).join('')}
                <a class="physics-button lesson-open-link" href="${lessonUrl(lesson.id)}">افتح صفحة الدرس</a>
                <button class="physics-button" type="button" data-lesson-complete="${escapeHtml(lesson.id)}">تسجيل إكمال الدرس</button>
            </article>`).join('')}</div>
            <div class="unit-description"><h3>تدريب الوحدة</h3><p>أسئلة مبدئية للتجربة، وتحتاج إلى مراجعة مدرس المادة قبل اعتمادها.</p>
                <a class="physics-button" href="quiz.html?course=${encodeURIComponent(currentCourse.id)}&amp;unit=${encodeURIComponent(unit.id)}">ابدأ الاختبار</a>
            </div>
        </details>`).join('');
        container.addEventListener('click', async (event) => {
            const button = event.target.closest('[data-lesson-complete]');
            if (!button) return;
            try {
                const userId = await getUserId();
                if (!userId) {
                    showMessage('course-message', 'سجّل الدخول لحفظ تقدمك على حسابك.', true);
                    return;
                }
                const lessonId = button.dataset.lessonComplete;
                await saveProgress(userId, lessonId, !completedLessons.has(lessonId));
                showMessage('course-message', 'تم تحديث تقدمك.', false);
            } catch (error) {
                console.error('تعذر حفظ تقدم الدرس:', error);
                showMessage('course-message', 'تعذر حفظ التقدم. تحقق من اتصال Supabase وسياسات قاعدة البيانات.', true);
            }
        });
        loadCourseProgress();
        bindCourseNotes();
    }

    async function loadCourseProgress() {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const progress = await loadProgress(userId);
            completedLessons = new Set(progress.map((row) => row.lesson_id));
            updateProgressUI();
        } catch (error) {
            console.error('تعذر تحميل تقدم الطالب:', error);
            showMessage('course-message', 'تعذر تحميل تقدمك من قاعدة البيانات.', true);
        }
    }

    async function bindCourseNotes() {
        const notes = document.getElementById('course-notes');
        const button = document.getElementById('save-course-notes');
        if (!notes || !button || !currentCourse) return;
        const noteId = `course:${currentCourse.id}`;
        try {
            const userId = await getUserId();
            if (userId) {
                notes.value = await learningData.loadNote(userId, noteId);
            }
        } catch (error) {
            console.error('تعذر تحميل ملاحظات المقرر:', error);
            showMessage('notes-message', 'تعذر تحميل الملاحظات المحفوظة.', true);
        }
        button.addEventListener('click', async () => {
            try {
                const userId = await getUserId();
                if (!userId) {
                    showMessage('notes-message', 'سجّل الدخول لحفظ ملاحظاتك على حسابك.', true);
                    return;
                }
                await learningData.saveNote(userId, noteId, notes.value);
                showMessage('notes-message', 'تم حفظ ملاحظاتك.', false);
            } catch (error) {
                console.error('تعذر حفظ الملاحظات:', error);
                showMessage('notes-message', 'تعذر حفظ الملاحظات. حاول مرة أخرى.', true);
            }
        });
    }

    function renderLessons() {
        const grid = document.getElementById('lesson-grid');
        if (!grid) return;
        const allLessons = courses.flatMap((course) => course.units.flatMap((unit) => unit.lessons.map((lesson) => ({
            ...lesson,
            category: categoryFor(lesson.title) || categoryFor(unit.title) || 'modern',
            courseTitle: course.title,
            courseId: course.id,
            gradeId: course.gradeId,
            gradeNumber: course.gradeNumber,
            unitTitle: unit.title
        }))));
        const search = document.getElementById('lesson-search');
        const gradeSelect = document.querySelector('[data-grade-select]');
        const systemSelect = document.querySelector('[data-system-select]');
        function drawLessons() {
            const query = (search?.value || '').trim().toLowerCase();
            const gradeId = gradeSelect?.value || '';
            const system = systemSelect?.value || '';
            const activeCategory = document.querySelector('[data-physics-category].active')?.dataset.physicsCategory || 'all';
            const visible = allLessons.filter((lesson) => {
                const course = courses.find((item) => item.id === lesson.courseId);
                const matchesQuery = `${lesson.title} ${lesson.unitTitle} ${lesson.courseTitle}`.toLowerCase().includes(query);
                return (!gradeId || lesson.gradeId === gradeId)
                    && (!system || course.systems.includes(system))
                    && (activeCategory === 'all' || lesson.category === activeCategory)
                    && matchesQuery;
            });
            grid.innerHTML = visible.length ? visible.map((lesson) => `<article class="lesson-card">
                <span class="physics-course-chip">${escapeHtml(lesson.gradeNumber)} · ${escapeHtml(lesson.unitTitle)}</span>
                <h2>${escapeHtml(lesson.title)}</h2><p>${escapeHtml(lesson.courseTitle)}</p>
                ${(lesson.formulas || []).map((formula) => window.renderFormula(formula)).join('')}
                <a class="physics-button" href="${lessonUrl(lesson.id)}">افتح صفحة الدرس</a>
            </article>`).join('') : '<p class="physics-empty">لا توجد دروس مطابقة لهذا الاختيار.</p>';
        }

        search?.addEventListener('input', drawLessons);
        gradeSelect?.addEventListener('change', drawLessons);
        systemSelect?.addEventListener('change', drawLessons);
        document.querySelectorAll('[data-physics-category]').forEach((button) => {
            button.addEventListener('click', () => {
                document.querySelectorAll('[data-physics-category]').forEach((item) => item.classList.toggle('active', item === button));
                drawLessons();
            });
        });
        document.addEventListener('beto:selection-change', drawLessons);
        drawLessons();
    }

    function youtubeEmbedUrl(videoUrl) {
        if (!videoUrl) return '';
        try {
            const url = new URL(videoUrl);
            let videoId = '';
            if (url.hostname === 'youtu.be') {
                videoId = url.pathname.split('/').filter(Boolean)[0] || '';
            } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
                videoId = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1] || '';
            }
            return /^[\w-]{11}$/.test(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}` : '';
        } catch (error) {
            return '';
        }
    }

    function renderLessonPage() {
        const content = document.getElementById('lesson-page-content');
        if (!content) return;
        const lessonId = new URLSearchParams(window.location.search).get('lesson');
        const orderedLessons = courses.flatMap((course) => course.units.flatMap((unit) => unit.lessons.map((lesson) => ({
            ...lesson,
            course,
            unit
        }))));
        const lessonIndex = orderedLessons.findIndex((item) => item.id === lessonId);
        const current = orderedLessons[lessonIndex];
        if (!current) {
            content.innerHTML = '<section class="lesson-unavailable" role="status"><h1>لم يتم العثور على الدرس</h1><p>قد يكون الرابط غير صحيح أو أن الدرس لم يعد متاحًا.</p><a class="physics-button" href="courses.html">العودة إلى المقررات</a></section>';
            return;
        }

        currentCourse = courses.find((course) => course.id === current.course.id) || current.course;
        document.title = `${current.title} | بيتو فيزيكس`;
        const courseLessons = orderedLessons.filter((item) => item.course.id === current.course.id);
        const courseLessonIndex = courseLessons.findIndex((item) => item.id === current.id);
        const previous = courseLessons[courseLessonIndex - 1];
        const next = courseLessons[courseLessonIndex + 1];
        const videoUrl = youtubeEmbedUrl(current.videoUrl);
        const hasVideoUrl = Boolean(current.videoUrl);
        const formulas = current.formulas || [];
        const objectives = current.objectives || [];
        const resources = current.resources || [];
        const summary = current.summary || current.description;

        content.innerHTML = `
            <nav class="lesson-breadcrumb" aria-label="مسار التنقل">
                <a href="courses.html">المقررات</a><span aria-hidden="true">/</span>
                <a href="${courseUrl(current.course.id)}">${escapeHtml(current.course.title)}</a><span aria-hidden="true">/</span>
                <span>${escapeHtml(current.unit.title)}</span>
            </nav>
            <header class="lesson-page-header">
                <span class="courses-kicker">${escapeHtml(current.course.gradeNumber)} · ${escapeHtml(current.unit.title)}</span>
                <h1>${escapeHtml(current.title)}</h1>
                <p>${escapeHtml(current.description || current.course.title)}</p>
            </header>
            <div class="lesson-page-layout">
                <div class="lesson-page-main">
                    <section class="lesson-video-panel" aria-label="فيديو الدرس">
                        <div class="lesson-section-heading"><h2>شرح الدرس</h2><span>${videoUrl ? 'فيديو الدرس' : 'الفيديو سيضاف قريبًا'}</span></div>
                        ${videoUrl
                ? `<div class="lesson-video-frame"><iframe src="${videoUrl}" title="فيديو درس: ${escapeHtml(current.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`
                : `<div class="lesson-video-placeholder"><i class="fas fa-circle-play" aria-hidden="true"></i><strong>${hasVideoUrl ? 'رابط الفيديو غير صالح' : 'سيظهر فيديو الدرس هنا'}</strong><p>${hasVideoUrl ? 'أضف رابط فيديو يوتيوب صحيحًا إلى بيانات هذا الدرس.' : 'عند إضافة رابط فيديو يوتيوب إلى بيانات الدرس، سيُعرض تلقائيًا في هذه المساحة.'}</p></div>`}
                    </section>
                    <section class="lesson-content-panel" aria-labelledby="lesson-summary-heading">
                        <h2 id="lesson-summary-heading">ملخص الدرس</h2>
                        <p>${escapeHtml(summary || 'سيُضاف ملخص الدرس ونقاطه الأساسية بعد اعتماد المحتوى التعليمي.')}</p>
                    </section>
                    <section class="lesson-content-panel" aria-labelledby="lesson-objectives-heading">
                        <h2 id="lesson-objectives-heading">أهداف التعلّم</h2>
                        ${objectives.length
                ? `<ul class="lesson-objective-list">${objectives.map((objective) => `<li>${escapeHtml(objective)}</li>`).join('')}</ul>`
                : '<p>ستُضاف أهداف هذا الدرس التعليمية عند اعتماد محتواه.</p>'}
                    </section>
                    <section class="lesson-content-panel" aria-labelledby="lesson-formulas-heading">
                        <h2 id="lesson-formulas-heading">القوانين والرموز</h2>
                        ${formulas.length
                ? formulas.map((formula) => window.renderFormula(formula)).join('')
                : '<p>ستُضاف القوانين والرموز المرتبطة بهذا الدرس هنا.</p>'}
                    </section>
                    <section class="lesson-content-panel" aria-labelledby="lesson-resources-heading">
                        <h2 id="lesson-resources-heading">ملفات ومواد مساندة</h2>
                        ${resources.length
                ? `<ul class="lesson-resource-list">${resources.map((resource) => `<li><a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.title)}</a></li>`).join('')}</ul>`
                : '<p>لا توجد ملفات مرفقة حاليًا. ستظهر أوراق العمل والمسائل هنا عند إضافتها.</p>'}
                    </section>
                    <section class="lesson-content-panel lesson-note-panel" aria-labelledby="lesson-note-heading">
                        <h2 id="lesson-note-heading">ملاحظاتي على الدرس</h2>
                        <label for="lesson-notes">اكتب ملاحظاتك</label>
                        <textarea id="lesson-notes" rows="5" placeholder="دوّن أفكارك أو الأسئلة التي تريد مراجعتها."></textarea>
                        <button class="physics-button" id="save-lesson-notes" type="button">حفظ الملاحظات</button>
                        <p id="lesson-note-message" role="status"></p>
                    </section>
                </div>
                <aside class="lesson-page-sidebar">
                    <section class="lesson-content-panel lesson-tools-panel">
                        <h2>أدوات الدرس</h2>
                        <button class="physics-button lesson-complete-button" type="button" data-lesson-complete="${escapeHtml(current.id)}">تسجيل إكمال الدرس</button>
                        <a class="physics-button" href="quiz.html?course=${encodeURIComponent(current.course.id)}&amp;unit=${encodeURIComponent(current.unit.id)}">تدريب الوحدة</a>
                        <a class="physics-button" href="${courseUrl(current.course.id)}">العودة إلى المقرر</a>
                    </section>
                    <section class="lesson-content-panel lesson-navigation-panel">
                        <h2>التنقل بين الدروس</h2>
                        ${previous
                ? `<a class="lesson-step-link" rel="prev" href="${lessonUrl(previous.id)}"><small>الدرس السابق</small><strong>${escapeHtml(previous.title)}</strong></a>`
                : '<span class="lesson-step-disabled">هذا أول درس في القائمة.</span>'}
                        ${next
                ? `<a class="lesson-step-link" rel="next" href="${lessonUrl(next.id)}"><small>الدرس التالي</small><strong>${escapeHtml(next.title)}</strong></a>`
                : '<span class="lesson-step-disabled">وصلت إلى آخر درس في القائمة.</span>'}
                    </section>
                </aside>
            </div>`;

        bindLessonActions(current);
    }

    async function bindLessonActions(lesson) {
        const noteId = `lesson:${lesson.id}`;
        const notes = document.getElementById('lesson-notes');
        const saveButton = document.getElementById('save-lesson-notes');
        try {
            const userId = await getUserId();
            if (userId) {
                const progress = await loadProgress(userId);
                completedLessons = new Set(progress.map((row) => row.lesson_id));
                updateProgressUI();
                if (notes) notes.value = await learningData.loadNote(userId, noteId);
            }
        } catch (error) {
            console.error('تعذر تحميل بيانات الدرس المحفوظة:', error);
            showMessage('lesson-note-message', 'تعذر تحميل تقدمك أو ملاحظاتك المحفوظة.', true);
        }

        saveButton?.addEventListener('click', async () => {
            try {
                const userId = await getUserId();
                if (!userId) {
                    showMessage('lesson-note-message', 'سجّل الدخول لحفظ ملاحظاتك على حسابك.', true);
                    return;
                }
                await learningData.saveNote(userId, noteId, notes?.value || '');
                showMessage('lesson-note-message', 'تم حفظ ملاحظاتك.', false);
            } catch (error) {
                console.error('تعذر حفظ ملاحظات الدرس:', error);
                showMessage('lesson-note-message', 'تعذر حفظ الملاحظات. حاول مرة أخرى.', true);
            }
        });

        document.querySelector('[data-lesson-complete]')?.addEventListener('click', async (event) => {
            const button = event.currentTarget;
            try {
                const userId = await getUserId();
                if (!userId) {
                    showMessage('lesson-note-message', 'سجّل الدخول لحفظ تقدمك على حسابك.', true);
                    return;
                }
                await saveProgress(userId, lesson.id, !completedLessons.has(lesson.id));
                showMessage('lesson-note-message', 'تم تحديث تقدمك في هذا الدرس.', false);
            } catch (error) {
                console.error('تعذر حفظ تقدم الدرس:', error);
                showMessage('lesson-note-message', 'تعذر حفظ التقدم. تحقق من اتصال قاعدة البيانات.', true);
            }
        });
    }

    const api = { getUserId, saveProgress, loadProgress, saveQuizResult };
    window.BetoLearning = api;
    window.saveProgress = saveProgress;
    window.loadProgress = loadProgress;
    window.saveQuizResult = saveQuizResult;

    if (page === 'catalog') {
        const params = new URLSearchParams(window.location.search);
        const grade = document.querySelector('[data-grade-select]');
        const system = document.querySelector('[data-system-select]');
        if (params.has('grade') && grade) grade.value = params.get('grade');
        if (params.has('system') && system) system.value = params.get('system');
        document.getElementById('course-search')?.addEventListener('input', renderCatalog);
        grade?.addEventListener('change', renderCatalog);
        system?.addEventListener('change', renderCatalog);
        document.getElementById('course-reset')?.addEventListener('click', () => {
            const search = document.getElementById('course-search');
            if (search) search.value = '';
            if (grade && grade.value) {
                grade.value = '';
                grade.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (system && system.value) {
                system.value = '';
                system.dispatchEvent(new Event('change', { bubbles: true }));
            }
            const url = new URL(window.location.href);
            url.searchParams.delete('grade');
            url.searchParams.delete('system');
            window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
            renderCatalog();
            search?.focus();
        });
        document.addEventListener('beto:selection-change', renderCatalog);
        renderCatalog();
    } else if (page === 'detail') {
        renderCourseDetail();
    } else if (page === 'lessons') {
        renderLessons();
    } else if (page === 'lesson') {
        renderLessonPage();
    }
})();
