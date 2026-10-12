(function () {
    'use strict';

    loadPageScript('js/i18n.js?v=4');

    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
    localStorage.setItem('theme', 'light');
    if (document.body) {
        document.body.setAttribute('data-theme', 'light');
        document.body.classList.add('theme-light');
    } else document.addEventListener('DOMContentLoaded', function () {
        document.body.setAttribute('data-theme', 'light');
        document.body.classList.add('theme-light');
    });

    function applySharedTheme() {
        document.documentElement.setAttribute('data-theme', 'light');
        if (document.body) {
            document.body.setAttribute('data-theme', 'light');
            document.body.classList.add('theme-light');
        }
        localStorage.setItem('theme', 'light');
    }

    function bindSharedThemeControls() {
        applySharedTheme();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindSharedThemeControls);
    else bindSharedThemeControls();
    var themeControlStyles = document.createElement('style');
    themeControlStyles.textContent = '#theme-toggle,.theme-toggle{display:none!important}';
    (document.head || document.documentElement).appendChild(themeControlStyles);

    var navigationOverrides = document.createElement('style');
    navigationOverrides.textContent = '.site-back-link{position:fixed;right:24px;bottom:24px;z-index:90;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid rgba(0,212,255,.3);border-radius:10px;background:rgba(9,18,28,.9);color:#aab7c5;text-decoration:none;font:600 13px Cairo,sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.25);transition:transform .2s ease,border-color .2s ease,color .2s ease}.site-back-link:hover{transform:translateY(-3px);border-color:#00d4ff;color:#00d4ff}@media(max-width:680px){.site-back-link{right:14px;bottom:14px;padding:9px 11px;font-size:12px}}';
    document.documentElement.appendChild(navigationOverrides);

    function addBackLink() {
        var path = window.location.pathname.toLowerCase();
        if (!document.body || /index\.html$|login\.html$|^\/$/.test(path) || document.querySelector('.site-back-link')) return;
        var backLink = document.createElement('a');
        backLink.className = 'site-back-link';
        backLink.href = 'index.html';
        backLink.innerHTML = '<i class="fas fa-arrow-right"></i> العودة';
        backLink.addEventListener('click', function (event) {
            if (window.history.length > 1) {
                event.preventDefault();
                window.history.back();
            }
        });
        document.body.appendChild(backLink);
    }

    function loadPageScript(path) {
        var script = document.createElement('script');
        script.src = path;
        script.defer = true;
        (document.body || document.head).appendChild(script);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addBackLink);
    else addBackLink();

    var modernSyntax = false;
    var requiredFeatures = [
        'Promise',
        'fetch',
        'URLSearchParams',
        'localStorage',
        'addEventListener'
    ];
    var missingFeatures = [];
    var index;

    try {
        modernSyntax = new Function('const value = 1; const add = function (number) { return number + value; }; return add(1) === 2;')() === true;
    } catch (error) {
        modernSyntax = false;
    }

    for (index = 0; index < requiredFeatures.length; index += 1) {
        if (typeof window[requiredFeatures[index]] === 'undefined') {
            missingFeatures.push(requiredFeatures[index]);
        }
    }

    if (modernSyntax && missingFeatures.length === 0) {
        return;
    }

    function showCompatibilityMessage() {
        var notice = document.getElementById('browser-compat-notice');
        if (notice) {
            return;
        }

        notice = document.createElement('div');
        notice.id = 'browser-compat-notice';
        notice.innerHTML = '<div class="browser-compat-box"><strong>المتصفح يحتاج إلى تحديث</strong><p>للحصول على أفضل أداء، استخدم أحدث إصدار من Chrome أو Edge أو Firefox أو Safari.</p><a href="https://browsehappy.com/" target="_blank" rel="noopener noreferrer">معرفة طريقة التحديث</a></div>';
        document.body.appendChild(notice);
    }

    function hideSiteUntilUpdated() {
        var style = document.createElement('style');
        style.textContent = '#browser-compat-notice{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:#0a0a0f;color:#fff;font-family:Arial,sans-serif;direction:rtl;text-align:center}#browser-compat-notice .browser-compat-box{max-width:520px;padding:32px;border:1px solid #00d4ff;border-radius:12px;background:#12121a;box-shadow:0 0 30px rgba(0,212,255,.25)}#browser-compat-notice strong{display:block;margin-bottom:12px;font-size:24px}#browser-compat-notice p{line-height:1.8;color:#c5c9d3}#browser-compat-notice a{display:inline-block;margin-top:12px;padding:10px 18px;border-radius:8px;background:#00d4ff;color:#0a0a0f;text-decoration:none;font-weight:bold}';
        document.documentElement.appendChild(style);
        if (document.body) {
            showCompatibilityMessage();
        } else {
            document.addEventListener('DOMContentLoaded', showCompatibilityMessage);
        }
    }

    hideSiteUntilUpdated();
}());
