(function () {
    'use strict';

    const doc = document;
    const body = doc.body;
    if (!body) return;

    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setupCourseRail() {
        const sequence = doc.querySelector('.course-rail-sequence');
        const stage = sequence?.querySelector('.course-rail-stage');
        const track = sequence?.querySelector('.course-rail-track');
        if (!sequence || !stage || !track) return;

        const physics = window.BETO_PHYSICS;
        if (!physics?.grades?.length) {
            console.error('تعذر إنشاء شريط المقررات: بيانات BETO_PHYSICS غير متاحة.');
            return;
        }

        const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
        const courseCards = physics.grades.flatMap((grade) => grade.courses.map((course) => {
            const courseSystems = Object.values(physics.systems).filter((system) => course.title.includes(system));
            const systems = (courseSystems.length ? courseSystems : grade.systems.map((system) => physics.systems[system]).filter(Boolean))
                .join(' / ');
            const lessonCount = course.lessonsCount ?? course.units.reduce((total, unit) => total + unit.lessons.length, 0);
            const title = escapeHtml(course.title);
            return `<a class="course-rail-card" href="course.html?course=${encodeURIComponent(course.id)}&amp;v=30" dir="rtl">
                <span class="course-rail-card-number">${String(grade.number).includes('الأول') ? '01' : String(grade.number).includes('الثاني') ? '02' : '03'} / B²</span>
                <span class="course-rail-card-icon" aria-hidden="true"><i class="fas fa-atom"></i></span>
                <span class="course-rail-card-kicker">${escapeHtml(grade.number)} / ${escapeHtml(systems)}</span>
                <h3>${title}</h3>
                <p>${grade.courses.length > 1 ? 'مسار من مسارات الصف الدراسي' : 'مسار الفيزياء المتاح لهذا الصف'}</p>
                <span class="course-rail-card-meta">${course.units.length} وحدات <i aria-hidden="true">/</i> ${lessonCount} دروس</span>
                <span class="course-rail-card-action">استكشف المقرر <i class="fas fa-arrow-left" aria-hidden="true"></i></span>
            </a>`;
        }));
        if (!courseCards.length) {
            console.error('تعذر إنشاء شريط المقررات: لا توجد مقررات متاحة.');
            return;
        }
        track.innerHTML = courseCards.join('');

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reducedMotion.matches) return;

        sequence.classList.add('is-course-rail-active');
        const progressFill = sequence.querySelector('.course-rail-progress > span');
        const clamp = (value) => Math.min(Math.max(value, 0), 1);
        let frame = 0;

        const getDistance = () => Math.max(0, track.scrollWidth - sequence.clientWidth);
        const updateSequenceSize = () => {
            const distance = getDistance();
            sequence.style.height = `${window.innerHeight + distance}px`;
            requestRender();
        };
        const render = () => {
            frame = 0;
            const distance = getDistance();
            const scrollRange = sequence.offsetHeight - window.innerHeight;
            const sequenceTop = sequence.getBoundingClientRect().top;
            const progress = scrollRange > 0 ? clamp(-sequenceTop / scrollRange) : 0;
            const translate = distance * progress;
            const isPinned = sequenceTop <= 0 && sequenceTop > -scrollRange;
            sequence.classList.toggle('is-pinned', isPinned);
            sequence.classList.toggle('is-released', sequenceTop <= -scrollRange);
            body.classList.toggle('course-rail-scroll-active', isPinned);
            track.style.transform = `translate3d(${-translate}px, 0, 0)`;
            if (progressFill) progressFill.style.transform = `scaleX(${progress})`;
        };
        const requestRender = () => {
            if (!frame) frame = requestAnimationFrame(render);
        };
        const cleanup = () => {
            window.removeEventListener('scroll', requestRender);
            window.removeEventListener('resize', updateSequenceSize);
            reducedMotion.removeEventListener('change', stopForReducedMotion);
            body.classList.remove('course-rail-scroll-active');
            cancelAnimationFrame(frame);
        };
        const stopForReducedMotion = (event) => {
            if (!event.matches) return;
            cleanup();
            sequence.classList.remove('is-course-rail-active', 'is-pinned', 'is-released');
            sequence.style.removeProperty('height');
            track.style.removeProperty('transform');
            if (progressFill) progressFill.style.removeProperty('transform');
        };

        window.addEventListener('scroll', requestRender, { passive: true });
        window.addEventListener('resize', updateSequenceSize);
        window.addEventListener('pagehide', cleanup, { once: true });
        reducedMotion.addEventListener?.('change', stopForReducedMotion);
        updateSequenceSize();
    }

    function setupCinematicHero() {
        const sequence = doc.querySelector('.hero-scroll-sequence');
        const hero = sequence?.querySelector('.home-hero');
        const blackScreen = hero?.querySelector('.hero-cinematic');
        const monogram = hero?.querySelector('.hero-monogram');
        if (!sequence || !hero || !blackScreen || !monogram || prefersReducedMotion()) return;

        const cinematicWelcome = blackScreen.querySelector('.hero-cinematic-welcome');

        sequence.classList.add('is-cinematic');
        const clamp = (value) => Math.min(Math.max(value, 0), 1);
        const progressBetween = (value, start, end) => clamp((value - start) / (end - start));
        const smooth = (value) => value * value * (3 - 2 * value);
        let frame = 0;

        const render = () => {
            frame = 0;
            const scrollRange = sequence.offsetHeight - hero.offsetHeight;
            const sequenceTop = sequence.getBoundingClientRect().top;
            const progress = scrollRange > 0
                ? clamp(-sequenceTop / scrollRange)
                : 0;
            const isPinned = sequenceTop <= 0 && sequenceTop > -scrollRange;
            hero.classList.toggle('is-pinned', isPinned);
            hero.classList.toggle('is-card-settled', progress >= 0.94);
            hero.classList.toggle('is-released', sequenceTop <= -scrollRange);
            body.classList.toggle('hero-scroll-active', isPinned);
            const textFade = smooth(progressBetween(progress, 0.04, 0.22));
            const monogramEnter = smooth(progressBetween(progress, 0.12, 0.25));
            const monogramGrow = smooth(progressBetween(progress, 0.25, 0.4));
            const monogramFade = smooth(progressBetween(progress, 0.39, 0.48));
            const screenReveal = smooth(progressBetween(progress, 0.46, 0.64));
            const slicesEnter = smooth(progressBetween(progress, 0.4, 0.58));
            const welcomeReveal = smooth(progressBetween(progress, 0.4, 0.65));
            const cardSettle = smooth(progressBetween(progress, 0.78, 0.94));

            hero.style.setProperty('--hero-text-opacity', `${1 - textFade}`);
            hero.style.setProperty('--hero-text-shift', `${-34 * textFade}px`);
            hero.style.setProperty('--hero-image-opacity', `${1 - textFade}`);
            monogram.style.opacity = `${monogramEnter * (1 - monogramFade)}`;
            monogram.style.transform = `scale(${1 + monogramGrow * 26})`;
            blackScreen.style.opacity = '1';
            blackScreen.style.setProperty('--hero-screen-opacity', `${screenReveal}`);
            blackScreen.style.transform = `scale(${1 - cardSettle * 0.5})`;
            blackScreen.style.borderRadius = `${24 * cardSettle}px`;
            blackScreen.style.boxShadow = `0 ${40 * cardSettle}px ${100 * cardSettle}px rgba(0, 0, 0, ${0.82 * cardSettle})`;
            if (cinematicWelcome) {
                cinematicWelcome.style.opacity = `${welcomeReveal}`;
                cinematicWelcome.style.transform = `translate(-50%, ${12 * (1 - welcomeReveal)}px)`;
            }
            blackScreen.querySelector('.hero-cinematic-portrait').style.opacity = `${slicesEnter}`;
            blackScreen.querySelector('.hero-cinematic-meta-top').style.opacity = `${smooth(progressBetween(progress, 0.46, 0.6))}`;
            blackScreen.querySelector('.hero-cinematic-meta-bottom').style.opacity = `${smooth(progressBetween(progress, 0.5, 0.64))}`;
            blackScreen.querySelector('.hero-slice-top').style.transform = `translateX(${(1 - slicesEnter) * -36}%)`;
            blackScreen.querySelector('.hero-slice-middle').style.transform = `translateX(${(1 - slicesEnter) * 36}%)`;
            blackScreen.querySelector('.hero-slice-bottom').style.transform = `translateX(${(1 - slicesEnter) * -36}%)`;
        };

        const requestRender = () => {
            if (!frame) frame = requestAnimationFrame(render);
        };
        hero.querySelector('.hero-scroll')?.addEventListener('click', (event) => {
            event.preventDefault();
            const scrollRange = sequence.offsetHeight - hero.offsetHeight;
            window.scrollTo({
                top: sequence.offsetTop + scrollRange * 0.12,
                behavior: 'smooth'
            });
        });
        const stopForReducedMotion = (event) => {
            if (!event.matches) return;
            window.removeEventListener('scroll', requestRender);
            window.removeEventListener('resize', requestRender);
            window.removeEventListener('pagehide', cleanup);
            hero.classList.remove('is-pinned', 'is-card-settled', 'is-released');
            sequence.classList.remove('is-cinematic');
            body.classList.remove('hero-scroll-active');
            [hero, monogram, blackScreen, ...blackScreen.querySelectorAll('*')].forEach((element) => {
                element.removeAttribute('style');
            });
            cancelAnimationFrame(frame);
            motionPreference.removeEventListener('change', stopForReducedMotion);
        };
        const cleanup = () => {
            window.removeEventListener('scroll', requestRender);
            window.removeEventListener('resize', requestRender);
            motionPreference.removeEventListener('change', stopForReducedMotion);
            cancelAnimationFrame(frame);
            hero.classList.remove('is-card-settled');
            body.classList.remove('hero-scroll-active');
        };
        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

        window.addEventListener('scroll', requestRender, { passive: true });
        window.addEventListener('resize', requestRender);
        window.addEventListener('pagehide', cleanup, { once: true });
        motionPreference.addEventListener?.('change', stopForReducedMotion);
        requestRender();
    }

    // =========================
    // 1) شاشة التحميل (Preloader)
    // =========================
    function setupPreloader() {
        const existing = doc.getElementById('site-preloader');
        const preloader = existing || doc.createElement('div');
        const hasMarkup = !!existing;

        if (!hasMarkup) {
            preloader.id = 'site-preloader';
            preloader.setAttribute('aria-live', 'polite');
            preloader.setAttribute('aria-busy', 'true');
            preloader.innerHTML = [
                '<div class="site-preloader-inner">',
                '  <span class="site-preloader-label">SYSTEM READY // INITIALIZING...</span>',
                '  <strong id="preloader-progress">00<small>%</small></strong>',
                '  <span class="site-preloader-line"><i></i></span>',
                '</div>'
            ].join('');
            body.appendChild(preloader);
        }

        body.classList.add('preloader-visible');
        preloader.setAttribute('aria-busy', 'true');
        preloader.classList.remove('is-hidden');

        const progress = doc.getElementById('preloader-progress');
        const line = preloader.querySelector('.site-preloader-line') || preloader.querySelector('.preloader-bar');
        const fill = line?.querySelector('i, span') || null;
        const formulas = ['E = mc²', 'F = ma', 'v = u + at', 'λ = h/p', 'Δx·Δp ≥ ħ/2', 'V = IR'];
        let current = 0;

        const finish = () => {
            preloader.setAttribute('aria-busy', 'false');
            preloader.classList.add('is-hidden');
            body.classList.remove('preloader-visible');
            setTimeout(() => {
                preloader.classList.add('hidden');
                if (!existing) preloader.remove();
            }, 600);
        };

        const timer = setInterval(() => {
            current += Math.random() * 18;
            if (current >= 100) {
                current = 100;
                clearInterval(timer);
                setTimeout(finish, 420);
            }

            const value = Math.min(Math.max(Math.round(current), 0), 100);
            if (progress) {
                progress.innerHTML = `${String(value).padStart(2, '0')}<small>%</small>`;
            }
            if (fill) fill.style.width = `${value}%`;
            if (line) {
                const label = formulas[Math.min(Math.floor(value / 18), formulas.length - 1)];
                line.setAttribute('data-formula', label);
            }
        }, 120);
    }

    // =========================
    // 2) حركات عند فتح الصفحة
    // =========================
    function setupEntranceAnimations() {
        const revealNodes = [];
        const hero = doc.querySelector('.home-hero');

        if (hero && !prefersReducedMotion()) {
            requestAnimationFrame(() => hero.classList.add('is-animating'));
        }

        const push = (selector, direction, delayBase) => {
            doc.querySelectorAll(selector).forEach((node, index) => {
                node.classList.add('reveal');
                node.setAttribute('data-direction', direction || 'bottom');
                node.style.setProperty('--delay', `${(index * 120) + delayBase}ms`);
                revealNodes.push(node);
            });
        };

        push('.home-section', 'bottom', 80);
        push('.home-section-kicker', 'left', 60);
        push('.home-section h2', 'bottom', 100);
        push('.grade-card', 'zoom', 80);
        push('.home-feature-card', 'zoom', 80);
        push('.counter-item', 'zoom', 80);
        push('.feature-marquee', 'bottom', 80);
        push('.courses-hero, .course-detail-hero', 'bottom', 80);
        push('.course-card, .lesson-card, .exam-item, .note-card, .resource-card', 'bottom', 60);

        if (prefersReducedMotion()) {
            revealNodes.forEach((node) => node.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observerInstance.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -8% 0px'
        });

        revealNodes.forEach((node) => observer.observe(node));

        if (typeof window.BetoMotion?.refresh === 'function') {
            const dynamicContentObserver = new MutationObserver((records) => {
                records.forEach((record) => {
                    record.addedNodes.forEach((node) => {
                        if (node instanceof Element) window.BetoMotion.refresh(node);
                    });
                });
            });
            dynamicContentObserver.observe(doc.querySelector('main') || body, { childList: true, subtree: true });
            window.addEventListener('pagehide', () => dynamicContentObserver.disconnect(), { once: true });
        }
    }

    // =========================
    // 3) حركات السكرول + شريط تقدم + parallax
    // =========================
    function setupScrollProgressAndParallax() {
        if (!doc.getElementById('scroll-progress')) {
            const progress = doc.createElement('div');
            progress.id = 'scroll-progress';
            body.insertBefore(progress, body.firstChild);
        }

        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const maxHeight = doc.documentElement.scrollHeight - window.innerHeight;
            const progressValue = maxHeight > 0 ? (scrollTop / maxHeight) : 0;
            const value = Math.min(Math.max(progressValue, 0), 1);
            document.documentElement.style.setProperty('--site-progress', `${value}`);
            const progressBar = doc.getElementById('scroll-progress');
            if (progressBar) {
                progressBar.style.transform = `scaleX(${value})`;
            }

            const header = doc.querySelector('.site-header');
            if (header) {
                header.classList.toggle('is-scrolled', window.scrollY > 30);
            }
        };

        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
    }

    // =========================
    // 4) انتقالات الصفحات
    // =========================
    function setupPageTransitions() {
        const overlay = doc.getElementById('page-transition-overlay') || (() => {
            const layer = doc.createElement('div');
            layer.id = 'page-transition-overlay';
            body.appendChild(layer);
            return layer;
        })();

        const shouldTransition = (href) => {
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
                return false;
            }
            try {
                const url = new URL(href, window.location.href);
                return url.origin === window.location.origin && !url.pathname.endsWith('.pdf');
            } catch (error) {
                return false;
            }
        };

        doc.querySelectorAll('a[href]').forEach((link) => {
            if (link.target === '_blank' || link.hasAttribute('data-no-transition')) return;
            link.addEventListener('click', (event) => {
                if (!shouldTransition(link.getAttribute('href'))) return;
                event.preventDefault();
                overlay.classList.add('is-visible');
                setTimeout(() => {
                    window.location.href = link.href;
                }, 260);
            });
        });
    }

    // =========================
    // 5) تفاعلات الماوس + أزرار + شريط تنقل + العودة للأعلى
    // =========================
    function setupMicroInteractions() {
        const navLinks = doc.querySelectorAll('.site-nav a');
        navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href && window.location.pathname.endsWith(href)) {
                link.classList.add('active-link');
            }
        });

        const backToTop = doc.createElement('button');
        backToTop.id = 'back-to-top';
        backToTop.type = 'button';
        backToTop.setAttribute('aria-label', 'العودة للأعلى');
        backToTop.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
        body.appendChild(backToTop);

        const updateBackToTop = () => {
            backToTop.classList.toggle('visible', window.scrollY > 420);
        };
        updateBackToTop();
        window.addEventListener('scroll', updateBackToTop, { passive: true });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        const cursor = doc.querySelector('.custom-cursor');
        const cursorDot = cursor?.querySelector('.cursor-dot');
        const pointerAvailable = window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion();
        if (cursor && cursorDot && pointerAvailable) {
            if (!cursor.querySelector('.cursor-ring')) {
                const ring = doc.createElement('span');
                ring.className = 'cursor-ring';
                ring.setAttribute('aria-hidden', 'true');
                cursor.appendChild(ring);
            }

            const interactiveSelector = 'a, button, input, select, textarea, .home-feature-card, .grade-card, .course-card, .lesson-card, .exam-item';
            doc.addEventListener('pointerover', (event) => {
                if (event.target instanceof Element && event.target.closest(interactiveSelector)) {
                    cursor.classList.add('is-hovering');
                }
            });
            doc.addEventListener('pointerout', (event) => {
                if (!(event.target instanceof Element)) return;
                const target = event.target.closest(interactiveSelector);
                if (target && !(event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) {
                    cursor.classList.remove('is-hovering');
                }
            });
        }

        if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion()) {
            const tiltSelector = '.home-feature-card, .grade-card, .course-card, .lesson-card, .exam-item';
            doc.addEventListener('pointermove', (event) => {
                if (event.pointerType !== 'mouse' || !(event.target instanceof Element)) return;
                const card = event.target.closest(tiltSelector);
                if (!card) return;
                const bounds = card.getBoundingClientRect();
                if (!bounds.width || !bounds.height) return;
                const x = (event.clientX - bounds.left) / bounds.width - 0.5;
                const y = (event.clientY - bounds.top) / bounds.height - 0.5;
                card.setAttribute('data-tilt-card', '');
                card.style.setProperty('--card-tilt-x', `${(y * -4).toFixed(2)}deg`);
                card.style.setProperty('--card-tilt-y', `${(x * 4).toFixed(2)}deg`);
                card.classList.add('is-tilting');
            });
            doc.addEventListener('pointerout', (event) => {
                if (!(event.target instanceof Element)) return;
                const card = event.target.closest(tiltSelector);
                if (!card || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) return;
                card.style.removeProperty('--card-tilt-x');
                card.style.removeProperty('--card-tilt-y');
                card.classList.remove('is-tilting');
            });

            doc.querySelectorAll('.start-learning').forEach((button) => {
                button.addEventListener('pointermove', (event) => {
                    if (event.pointerType !== 'mouse') return;
                    const bounds = button.getBoundingClientRect();
                    const x = event.clientX - bounds.left - bounds.width / 2;
                    const y = event.clientY - bounds.top - bounds.height / 2;
                    button.style.setProperty('--magnetic-x', `${(x * 0.12).toFixed(1)}px`);
                    button.style.setProperty('--magnetic-y', `${(y * 0.12).toFixed(1)}px`);
                });
                button.addEventListener('pointerleave', () => {
                    button.style.removeProperty('--magnetic-x');
                    button.style.removeProperty('--magnetic-y');
                });
            });
        }

        const nav = doc.querySelector('.site-nav');
        nav?.querySelectorAll('a').forEach((link, index) => {
            link.style.setProperty('--menu-link-index', String(index));
            link.addEventListener('pointermove', (event) => {
                if (event.pointerType !== 'mouse') return;
                const bounds = link.getBoundingClientRect();
                const offset = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
                link.style.setProperty('--menu-link-shift', `${offset.toFixed(1)}px`);
            });
            link.addEventListener('pointerleave', () => link.style.removeProperty('--menu-link-shift'));
        });
    }

    function setupMarquee() {
        if (!doc.querySelector('.home-hero') || doc.querySelector('.feature-marquee')) return;

        const marquee = doc.createElement('section');
        marquee.className = 'feature-marquee';
        marquee.setAttribute('aria-label', 'مميزات منصة B² Physics');
        marquee.innerHTML = [
            '<div class="feature-marquee-track">',
            '  <span>شرح مبسط</span>',
            '  <span>مراجعة مستمرة</span>',
            '  <span>اختبارات</span>',
            '  <span>ملخصات</span>',
            '  <span>شرح مبسط</span>',
            '  <span>مراجعة مستمرة</span>',
            '  <span>اختبارات</span>',
            '  <span>ملخصات</span>',
            '</div>'
        ].join('');

        const main = doc.querySelector('main');
        if (main) {
            main.insertBefore(marquee, main.lastElementChild || null);
        }
    }

    // =========================
    // 7) تشغيل كل المكونات عند جاهزية الصفحة
    // =========================
    function initialize() {
        setupPreloader();
        setupScrollProgressAndParallax();
        setupCinematicHero();
        setupCourseRail();
        setupMarquee();
        setupEntranceAnimations();
        setupPageTransitions();
        setupMicroInteractions();

        if (!prefersReducedMotion()) {
            doc.documentElement.classList.add('motion-enabled');
        }
    }

    if (doc.readyState === 'loading') {
        doc.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
