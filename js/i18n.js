(function () {
    'use strict';

    var translations = {
        'الرئيسية': 'Home',
        'الدروس': 'Lessons',
        'عن المدرب': 'About the Instructor',
        'قناة يوتيوب': 'YouTube Channel',
        'عن المنصة': 'About the Platform',
        'الكورسات': 'Courses',
        'التواصل': 'Contact',
        'حسابي': 'My Account',
        'تبديل اللغة': 'Switch language',
        'تبديل الوضع': 'Toggle theme',
        'منصة تعليمية': 'Learning platform',
        'تفاعلي': 'Interactive',
        'ابدأ التعلم': 'Start Learning',
        'تعرف على المدرب': 'Meet the Instructor',
        'اسحب للأسفل': 'Scroll down',
        'داخل B2 Physics': 'Inside B2 Physics',
        'شاهد الدروس': 'View lessons',
        'نبذة عن المدرب': 'About the instructor',
        'أحمد ديب': 'Ahmed Deeb',
        'تصفح الكورسات': 'Browse courses',
        'أدوات المنصة': 'Platform tools',
        'الأسئلة الشائعة': 'FAQ',
        'تواصل معي': 'Contact me',
        'تواصل معنا': 'Contact us',
        'أدوات تساعدك على التقدم': 'Tools that help you progress',
        'أسئلة شائعة': 'Frequently asked questions',
        'قبل أن تبدأ': 'Before you start',
        'التعليم والخبرة': 'Education and experience',
        'رحلتي التعليمية': 'My learning journey',
        'المهارات التقنية': 'Technical skills',
        'ما أقدمه': 'What I offer',
        'تابع المحتوى الجديد': 'Follow the latest content',
        'محتوى إضافي': 'More content',
        'زيارة القناة': 'Visit the channel',
        'عودة للرئيسية': 'Back to home',
        'سيُضاف قريبًا': 'Coming soon'
    };

    var reverseTranslations = {};
    Object.keys(translations).forEach(function (arabic) {
        reverseTranslations[translations[arabic]] = arabic;
    });

    function translateText(text, lang) {
        var value = text.trim();
        if (!value) return text;
        var translated = lang === 'en' ? translations[value] : reverseTranslations[value];
        if (!translated) return text;
        return text.replace(value, translated);
    }

    function translateNode(node, lang) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = translateText(node.nodeValue, lang);
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE || node.matches('script, style, textarea, input')) return;
        Array.prototype.forEach.call(node.childNodes, function (child) {
            translateNode(child, lang);
        });
    }

    function updateDocumentTitle(lang) {
        var titles = {
            'index.html': ['B2 Physics | منصة تعليم مقررات الفيزياء', 'B2 Physics | Physics courses and lessons'],
            'about.html': ['عن المدرب | B2 Physics', 'About the Instructor | B2 Physics'],
            'courses.html': ['الكورسات | B2 Physics', 'Courses | B2 Physics'],
            'lessons.html': ['الدروس | B2 Physics', 'Lessons | B2 Physics'],
            'help.html': ['مركز المساعدة | B2 Physics', 'Help Center | B2 Physics']
        };
        var key = location.pathname.split('/').pop() || 'index.html';
        if (titles[key]) document.title = titles[key][lang === 'en' ? 1 : 0];
    }

    function ensureGlobalToggle() {
        if (document.getElementById('lang-toggle') || document.querySelector('.global-lang-toggle')) return;
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'global-lang-toggle';
        button.setAttribute('aria-label', 'Switch language');
        button.innerHTML = '<i class="fas fa-globe"></i><span>EN</span>';
        document.body.appendChild(button);
        button.addEventListener('click', function () {
            var next = document.documentElement.lang === 'ar' ? 'en' : 'ar';
            window.applyDeebLanguage(next);
            localStorage.setItem('lang', next);
        });
    }

    window.applyDeebLanguage = function (lang) {
        var nextLang = lang === 'en' ? 'en' : 'ar';
        document.documentElement.lang = nextLang;
        document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
        document.body.classList.toggle('language-en', nextLang === 'en');
        document.body.classList.toggle('language-ar', nextLang === 'ar');
        var button = document.getElementById('lang-toggle') || document.querySelector('.global-lang-toggle');
        if (button) {
            var span = button.querySelector('span');
            if (span) span.textContent = nextLang === 'ar' ? 'EN' : 'AR';
            button.setAttribute('aria-label', nextLang === 'ar' ? 'تبديل اللغة' : 'Switch language');
        }
        translateNode(document.body, nextLang);
        updateDocumentTitle(nextLang);
        localStorage.setItem('lang', nextLang);
    };

    function init() {
        ensureGlobalToggle();
        window.applyDeebLanguage(localStorage.getItem('lang') || 'ar');
        var button = document.getElementById('lang-toggle');
        if (button && !button.dataset.i18nBound) {
            button.dataset.i18nBound = 'true';
            button.addEventListener('click', function () {
                var next = document.documentElement.lang === 'ar' ? 'en' : 'ar';
                window.applyDeebLanguage(next);
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}());
