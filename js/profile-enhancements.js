(function () {
    'use strict';

    var avatar = document.getElementById('profile-avatar');
    if (avatar) {
        avatar.setAttribute('tabindex', '0');
        avatar.setAttribute('role', 'button');
        avatar.setAttribute('aria-label', 'عرض صورة الحساب');
        var openAvatar = function () {
            var imageUrl = (avatar.style.backgroundImage || '').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
            if (!imageUrl) return;
            var modal = document.createElement('div');
            modal.className = 'avatar-preview-modal';
            modal.innerHTML = '<div class="avatar-preview-backdrop"></div><div class="avatar-preview-panel" role="dialog" aria-modal="true" aria-label="صورة الحساب"><button type="button" class="avatar-preview-close" aria-label="إغلاق"><i class="fas fa-times"></i></button><img alt="صورة الحساب"></div>';
            modal.querySelector('img').src = imageUrl;
            document.body.appendChild(modal);
            var close = function () { modal.remove(); };
            modal.querySelector('.avatar-preview-close').onclick = close;
            modal.querySelector('.avatar-preview-backdrop').onclick = close;
            document.addEventListener('keydown', function escape(event) { if (event.key === 'Escape') { close(); document.removeEventListener('keydown', escape); } });
            modal.querySelector('.avatar-preview-close').focus();
        };
        avatar.addEventListener('click', openAvatar);
        avatar.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openAvatar(); } });
    }

}());
