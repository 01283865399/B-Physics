const config = window.SUPABASE_CONFIG || {};
const supabaseClient = window.supabase?.createClient(config.url, config.anonKey);

const form = document.getElementById('auth-form');
const nameField = document.getElementById('auth-name');
const emailField = document.getElementById('auth-email');
const passwordField = document.getElementById('auth-password');
const submitButton = document.getElementById('auth-submit');
const toggleButton = document.getElementById('auth-toggle');
const formTitle = document.getElementById('auth-title');
const formHint = document.getElementById('auth-hint');
const nameGroup = document.getElementById('name-group');
const passwordGroup = passwordField?.closest('.auth-field');
const message = document.getElementById('auth-message');
const googleButton = document.getElementById('google-submit');
const forgotButton = document.getElementById('forgot-password');
const passwordToggle = document.getElementById('toggle-password');
let isSignup = false;
let isResetRequest = false;
const isRecovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
const requestedRedirect = new URLSearchParams(window.location.search).get('redirect');

function getPostAuthRedirect() {
    if (!requestedRedirect) return 'index.html';
    try {
        const target = new URL(requestedRedirect, window.location.origin);
        return target.origin === window.location.origin ? target.pathname + target.search + target.hash : 'index.html';
    } catch (error) {
        return 'index.html';
    }
}

function showMessage(text, type) {
    message.textContent = text;
    message.className = `auth-message ${type || ''}`;
}

function friendlyAuthError(error) {
    const errors = { invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', email_not_confirmed: 'أكد بريدك الإلكتروني أولًا ثم حاول الدخول.', user_already_exists: 'هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.', weak_password: 'اختر كلمة مرور أقوى لا تقل عن 6 أحرف.' };
    return errors[error?.code] || (error?.message?.includes('Invalid login credentials') ? errors.invalid_credentials : error?.message || 'تعذر تنفيذ العملية. حاول مرة أخرى.');
}

function isConfigured() {
    return Boolean(
        supabaseClient
        && typeof config.url === 'string'
        && typeof config.anonKey === 'string'
        && !config.url.includes('YOUR_PROJECT')
        && !config.anonKey.includes('YOUR_')
    );
}

async function redirectIfLoggedIn() {
    if (!isConfigured()) return;
    try {
        const { data } = await supabaseClient.auth.getSession();
        if (data.session && !isRecovery) window.location.replace(getPostAuthRedirect());
    } catch (error) {
        console.error('Session error:', error);
    }
}

function prepareResetRequest() {
    isResetRequest = true;
    isSignup = false;
    formTitle.textContent = 'استعادة كلمة المرور';
    formHint.textContent = 'أدخل بريدك وسنرسل لك رابط الاستعادة';
    passwordGroup.hidden = true;
    passwordField.required = false;
    nameGroup.hidden = true;
    googleButton.hidden = true;
    toggleButton.hidden = true;
    forgotButton.hidden = true;
    submitButton.textContent = 'إرسال رابط الاستعادة';
}

function prepareRecovery() {
    formTitle.textContent = 'تعيين كلمة مرور جديدة';
    formHint.textContent = 'اكتب كلمة المرور الجديدة لحسابك';
    nameGroup.hidden = true;
    passwordGroup.hidden = false;
    passwordField.required = true;
    passwordField.autocomplete = 'new-password';
    googleButton.hidden = true;
    toggleButton.hidden = true;
    forgotButton.hidden = true;
    submitButton.textContent = 'حفظ كلمة المرور';
}

form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isConfigured()) {
        showMessage('أضف بيانات Supabase في ملف auth-config.js أولاً.', 'error');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'جاري التنفيذ...';
    showMessage('', '');

    try {
        const email = emailField.value.trim();
        const password = passwordField.value;
        let result;

        if (isRecovery) {
            result = await supabaseClient.auth.updateUser({ password });
        } else if (isResetRequest) {
            result = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: config.redirectUrl
            });
        } else if (isSignup) {
            result = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: nameField.value.trim() } } });
        } else {
            result = await supabaseClient.auth.signInWithPassword({ email, password });
        }

        if (result.error) {
            showMessage(friendlyAuthError(result.error), 'error');
            return;
        }
        if (isRecovery) {
            showMessage('تم تغيير كلمة المرور بنجاح. يمكنك الدخول الآن.', 'success');
            window.history.replaceState({}, document.title, 'login.html');
            setTimeout(() => window.location.replace('index.html'), 1200);
        } else if (isResetRequest) {
            showMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك.', 'success');
        } else if (isSignup && !result.data.session) {
            showMessage('تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيد الحساب.', 'success');
        } else {
            window.location.replace(getPostAuthRedirect());
        }
    } catch (error) {
        console.error('Auth error:', error);
        showMessage('تعذر الاتصال بخدمة الحساب. حاول مرة أخرى.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = isRecovery
            ? 'حفظ كلمة المرور'
            : isResetRequest
                ? 'إرسال رابط الاستعادة'
                : isSignup
                    ? 'إنشاء الحساب'
                    : 'تسجيل الدخول';
    }
});

toggleButton?.addEventListener('click', () => {
    isSignup = !isSignup;
    nameGroup.hidden = !isSignup;
    nameField.required = isSignup;
    passwordField.autocomplete = isSignup ? 'new-password' : 'current-password';
    formTitle.textContent = isSignup ? 'إنشاء حساب جديد' : 'مرحبًا بعودتك';
    formHint.textContent = isSignup ? 'أنشئ حسابك لمتابعة مقررات الفيزياء وتقدمك الدراسي' : 'سجّل دخولك للوصول إلى حسابك';
    submitButton.textContent = isSignup ? 'إنشاء الحساب' : 'تسجيل الدخول';
    toggleButton.textContent = isSignup ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ أنشئ حسابًا';
    showMessage('', '');
});

forgotButton?.addEventListener('click', () => {
    prepareResetRequest();
    showMessage('', '');
});

googleButton?.addEventListener('click', async () => {
    if (!isConfigured()) {
        showMessage('أضف بيانات Supabase في ملف auth-config.js أولاً.', 'error');
        return;
    }
    googleButton.disabled = true;
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: config.redirectUrl }
        });
        if (!error) return;
        googleButton.disabled = false;
        const providerDisabled = error.message.toLowerCase().includes('provider is not enabled');
        showMessage(providerDisabled
            ? 'تسجيل الدخول بجوجل غير مفعّل بعد. فعّله من Supabase ثم حاول مرة أخرى.'
            : error.message, 'error');
    } catch (error) {
        console.error('Google sign-in error:', error);
        googleButton.disabled = false;
        showMessage('تعذر بدء تسجيل الدخول بجوجل. حاول مرة أخرى.', 'error');
    }
});

passwordToggle?.addEventListener('click', () => {
    const visible = passwordField.type === 'text';
    passwordField.type = visible ? 'password' : 'text';
    passwordToggle.innerHTML = visible ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
    passwordToggle.setAttribute('aria-label', visible ? 'إظهار كلمة المرور' : 'إخفاء كلمة المرور');
});

if (isRecovery) prepareRecovery();
redirectIfLoggedIn();
