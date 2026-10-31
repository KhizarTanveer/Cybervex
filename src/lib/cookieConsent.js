// The visitor's cookie choice, shared with Google Tag Manager through Consent Mode v2.
// index.html sets everything optional to "denied" before GTM loads and re-applies a saved choice;
// this file saves new choices and tells GTM about them. Keep KEY and VERSION in sync with index.html.
const KEY = 'cvx_cookie_consent';
const VERSION = 1;

// { analytics, marketing, date } or null when the visitor hasn't chosen yet
export function getConsent() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    return saved && saved.v === VERSION ? saved : null;
  } catch {
    return null;
  }
}

export function saveConsent({ analytics, marketing }) {
  const choice = { v: VERSION, analytics: Boolean(analytics), marketing: Boolean(marketing), date: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(choice));
  } catch {
    // Storage blocked (private mode): the choice still applies for this visit
  }
  const ads = choice.marketing ? 'granted' : 'denied';
  window.gtag?.('consent', 'update', {
    analytics_storage: choice.analytics ? 'granted' : 'denied',
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
  // Lets tags in GTM fire right after the visitor agrees, without waiting for the next page
  window.dataLayer?.push({ event: 'cookie_consent_update', analytics: choice.analytics, marketing: choice.marketing });
  return choice;
}

// Reopens the banner on its preferences screen (the footer's "Cookie Settings" link)
export const OPEN_SETTINGS_EVENT = 'cvx:cookie-settings';
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
