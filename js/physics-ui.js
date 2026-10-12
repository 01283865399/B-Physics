(function () {
    'use strict';

    if (!window.__b2LoaderReady) {
        const preloader = document.getElementById('site-preloader');
        const progressNode = document.getElementById('preloader-progress');
        const lineNode = preloader?.querySelector('.site-preloader-line');
        const fillNode = lineNode?.querySelector('i, span');
        if (preloader && !preloader.dataset.initialized) {
            preloader.dataset.initialized = 'true';
            document.body.classList.add('preloader-visible');
            let current = 0;
            const timer = setInterval(() => {
                current += Math.random() * 18;
                if (current >= 100) {
                    current = 100;
                    clearInterval(timer);
                    setTimeout(() => {
                        preloader.classList.add('is-hidden');
                        document.body.classList.remove('preloader-visible');
                        setTimeout(() => preloader.remove(), 700);
                    }, 260);
                }
                if (progressNode) {
                    progressNode.innerHTML = `${String(Math.min(Math.round(current), 100)).padStart(2, '0')}<small>%</small>`;
                }
                if (fillNode) {
                    fillNode.style.width = `${Math.min(Math.round(current), 100)}%`;
                }
            }, 120);
            window.__b2LoaderReady = true;
        }
    }

    const nav = document.getElementById('primary-navigation');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    let menuPreviousOverflow = '';
    const searchToggle = document.querySelector('[data-search-toggle]');
    const searchPanel = document.getElementById('site-search-panel');
    const searchInput = document.getElementById('site-search-input');
    const searchForm = document.querySelector('.site-search-form');
    const results = document.querySelector('.site-search-results');
    const navTargets = {
        'course.html': 'courses.html',
        'lessons.html': 'courses.html',
        'quiz.html': 'exams.html'
    };

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navTarget = navTargets[currentPage] || currentPage;
    nav?.querySelectorAll('a').forEach((link) => {
        if (link.getAttribute('href') === navTarget) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });

    function setMenuOpen(isOpen) {
        if (!nav || !menuToggle) return;
        if (isOpen) {
            menuPreviousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = menuPreviousOverflow;
        }
        nav.classList.toggle('is-open', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        menuToggle.innerHTML = `<i class="fas ${isOpen ? 'fa-xmark' : 'fa-bars'}" aria-hidden="true"></i>`;
        if (isOpen) nav.querySelector('a')?.focus();
    }

    menuToggle?.addEventListener('click', () => setMenuOpen(!nav.classList.contains('is-open')));
    nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
        setMenuOpen(false);
    }));

    function closeSearch() {
        if (!searchPanel || !searchToggle) return;
        searchPanel.hidden = true;
        searchToggle.setAttribute('aria-expanded', 'false');
    }

    searchToggle?.addEventListener('click', () => {
        if (!searchPanel) return;
        searchPanel.hidden = !searchPanel.hidden;
        searchToggle.setAttribute('aria-expanded', String(!searchPanel.hidden));
        if (!searchPanel.hidden) searchInput?.focus();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeSearch();
            if (nav?.classList.contains('is-open')) {
                setMenuOpen(false);
                menuToggle?.focus();
            }
        }
    });
    document.addEventListener('click', (event) => {
        const clickedMenuToggle = menuToggle && event.composedPath().includes(menuToggle);
        if (nav?.classList.contains('is-open') && (event.target === nav || (!nav.contains(event.target) && !clickedMenuToggle))) {
            setMenuOpen(false);
            menuToggle?.focus();
        }
    });

    function getSearchItems(query) {
        const physics = window.BETO_PHYSICS;
        if (!physics) return [];
        const normalized = query.trim().toLocaleLowerCase();
        if (!normalized) return [];
        return physics.grades.flatMap((grade) => grade.courses.flatMap((course) => {
            const courseHref = `course.html?course=${encodeURIComponent(course.id)}&v=30`;
            const courseItem = {
                title: course.title,
                detail: `${grade.number} · ${grade.systems.map((system) => physics.systems[system]).join(' / ')}`,
                href: courseHref
            };
            const matches = `${course.title} ${grade.number} ${course.units.map((unit) => unit.title).join(' ')}`.toLocaleLowerCase().includes(normalized);
            const lessonItems = course.units.flatMap((unit) => unit.lessons
                .filter((lesson) => `${lesson.title} ${unit.title} ${course.title} ${grade.number}`.toLocaleLowerCase().includes(normalized))
                .map((lesson) => ({
                    title: lesson.title,
                    detail: `${grade.number} · ${unit.title}`,
                    href: courseHref
                })));
            return [...(matches ? [courseItem] : []), ...lessonItems];
        })).slice(0, 12);
    }

    function renderResults() {
        if (!results || !searchInput) return [];
        const matches = getSearchItems(searchInput.value);
        results.replaceChildren();
        if (!searchInput.value.trim()) return matches;
        if (!matches.length) {
            const empty = document.createElement('p');
            empty.className = 'site-search-hint';
            empty.textContent = 'لا توجد نتائج مطابقة. جرّب اسم صف أو وحدة أو درس.';
            results.append(empty);
            return matches;
        }
        matches.forEach((item) => {
            const link = document.createElement('a');
            link.href = item.href;
            const title = document.createElement('strong');
            title.textContent = item.title;
            const detail = document.createElement('small');
            detail.textContent = item.detail;
            link.append(title, detail);
            link.addEventListener('click', closeSearch);
            results.append(link);
        });
        return matches;
    }

    searchInput?.addEventListener('input', renderResults);
    searchForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const matches = renderResults();
        if (matches.length === 1) window.location.href = matches[0].href;
    });

    const customCursor = document.querySelector('.custom-cursor');
    const cursorDot = document.querySelector('.cursor-dot');
    if (customCursor && cursorDot && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('site-loaded');
        const updateCursor = (event) => {
            customCursor.style.left = `${event.clientX}px`;
            customCursor.style.top = `${event.clientY}px`;
        };
        window.addEventListener('pointermove', updateCursor, { passive: true });
        window.addEventListener('pointerdown', () => cursorDot.style.transform = 'translate(-50%, -50%) scale(0.8)');
        window.addEventListener('pointerup', () => cursorDot.style.transform = 'translate(-50%, -50%) scale(1)');
    }

    const motionTargets = [
        '.courses-hero',
        '.course-detail-hero',
        '.course-card',
        '#course-grid .physics-empty',
        '.notes-editor',
        '.page-notice',
        '.exam-item',
        '.physics-page-shell > section',
        '.home-section-inner',
        '.grade-card',
        '.physics-system-picker',
        '.home-feature-card',
        '#contact-details .physics-socials'
    ].join(',');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let revealObserver = null;
    let revealCount = 0;

    function refreshMotion(root = document) {
        if (reducedMotion.matches) return;
        const elements = [];
        if (root instanceof Element && root.matches(motionTargets)) elements.push(root);
        if (root.querySelectorAll) elements.push(...root.querySelectorAll(motionTargets));

        elements.forEach((element) => {
            if (element.hasAttribute('data-motion')) return;
            element.setAttribute('data-motion', '');
            element.style.setProperty('--motion-delay', `${Math.min(revealCount % 5, 4) * 55}ms`);
            revealCount += 1;
            if (revealObserver) revealObserver.observe(element);
            else element.classList.add('is-visible');
        });
    }

    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
        refreshMotion();
        document.documentElement.classList.add('motion-enabled');
    } else {
        refreshMotion();
    }

    window.BetoMotion = Object.freeze({ refresh: refreshMotion });
    function resumeMotion() {
        if (!revealObserver || reducedMotion.matches) return;
        document.querySelectorAll(`${motionTargets}:not(.is-visible)`).forEach((element) => revealObserver.observe(element));
    }

    function handleMotionPreference(event) {
        if (!event.matches) return;
        revealObserver?.disconnect();
        document.querySelectorAll('[data-motion]').forEach((element) => element.classList.add('is-visible'));
    }

    reducedMotion.addEventListener?.('change', handleMotionPreference);
    window.addEventListener('pagehide', (event) => {
        revealObserver?.disconnect();
        if (!event.persisted) reducedMotion.removeEventListener?.('change', handleMotionPreference);
    });
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) resumeMotion();
    });

    if (!document.querySelector('script[src*="animations.js"]')) {
        const animationsScript = document.createElement('script');
        animationsScript.src = 'js/animations.js?v=18';
        animationsScript.async = false;
        document.body.appendChild(animationsScript);
    }
})();
