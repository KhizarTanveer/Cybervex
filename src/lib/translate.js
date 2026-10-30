// Site translation through the Google Website Translator.
// The chosen language lives in Google's own `googtrans` cookie, so it survives page reloads.
// Google's script is only downloaded once a visitor picks a language other than English.

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: 'us' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: 'pk' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: 'sa' },
  { code: 'zh-CN', name: 'Chinese', native: '中文', flag: 'cn' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: 'es' },
  { code: 'fr', name: 'French', native: 'Français', flag: 'fr' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: 'de' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: 'tr' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: 'ru' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: 'pt' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: 'in' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: 'jp' },
];

const SCRIPT_URL = 'https://translate.google.com/translate_a/element.js?cb=cvxTranslateInit';
const CONTAINER_ID = 'cvx-translate';

export function getLanguage() {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]*\/([^;]+)/);
  const code = match && decodeURIComponent(match[1]);
  return LANGUAGES.some((l) => l.code === code) ? code : 'en';
}

// Google may set the cookie on the bare host and on ".host", so both are written / cleared
function writeCookie(value) {
  const expires = value ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const host = window.location.hostname;
  document.cookie = `googtrans=${value}; path=/${expires}`;
  if (host.includes('.')) document.cookie = `googtrans=${value}; path=/; domain=.${host}${expires}`;
}

// Google wraps translated text in <font> tags, which React doesn't know about. Without this,
// React throws when it later removes or moves one of those text nodes (facebook/react#11538).
let domPatched = false;
function patchDomForTranslation() {
  if (domPatched) return;
  domPatched = true;
  const { removeChild, insertBefore } = Node.prototype;
  Node.prototype.removeChild = function patchedRemoveChild(child) {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child);
  };
  Node.prototype.insertBefore = function patchedInsertBefore(node, reference) {
    if (reference && reference.parentNode !== this) return node;
    return insertBefore.call(this, node, reference);
  };
}

let loading = null;
function loadTranslator() {
  if (loading) return loading;
  patchDomForTranslation();
  loading = new Promise((resolve, reject) => {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = CONTAINER_ID;
      container.className = 'cvx-translate-host';
      container.setAttribute('aria-hidden', 'true');
      document.body.appendChild(container);
    }
    window.cvxTranslateInit = () => {
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: LANGUAGES.map((l) => l.code).join(','),
          autoDisplay: false,
        },
        CONTAINER_ID
      );
      resolve();
    };
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('translator unavailable'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

// Google's hidden language <select>; it appears shortly after the script initialises
function waitForCombo(timeout = 8000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo && combo.options.length > 1) return resolve(combo);
      if (Date.now() - started > timeout) return resolve(null);
      return setTimeout(check, 100);
    };
    check();
  });
}

export async function setLanguage(code) {
  if (code === 'en') {
    // Undoing a translation cleanly needs the original page back
    writeCookie('');
    window.location.reload();
    return;
  }
  writeCookie(`/en/${code}`);
  await loadTranslator();
  const combo = await waitForCombo();
  if (!combo) {
    window.location.reload(); // the cookie is set, so the page comes back translated
    return;
  }
  combo.value = code;
  combo.dispatchEvent(new Event('change'));
}

// Re-apply a language chosen on an earlier visit
export function restoreLanguage() {
  if (getLanguage() !== 'en') loadTranslator().catch(() => {});
}
