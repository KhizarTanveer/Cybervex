// The admin panel lives at a private address that is never written in the code: only a slow
// PBKDF2 hash of it is stored, so neither the public JavaScript nor the GitHub repo reveals it.
// To change the address, put the new path's hash here:
//   node -e "console.log(require('crypto').pbkdf2Sync('/new-path', 'cybervex-admin-path', 200000, 32, 'sha256').toString('hex'))"
const ADMIN_PATH_HASH = '07963e8c0268821957e0b21bfb07356ce50fc6dc789c9d0f611cc09f9c0e1c0d';
const SALT = 'cybervex-admin-path';
const ITERATIONS = 200000;

// Public pages; anything else might be the admin address and gets checked
export const PUBLIC_PATHS = new Set(['/', '/index.html', '/about', '/projects', '/careers', '/contact', '/terms', '/privacy-policy', '/cookies-policy']);

export async function isAdminPath(pathname) {
  let path;
  try {
    path = decodeURIComponent(pathname).replace(/\/+$/, '').toLowerCase();
  } catch {
    return false;
  }
  if (path.length < 2 || !window.crypto?.subtle) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(path), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(SALT), iterations: ITERATIONS },
    key,
    256
  );
  const hex = Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
  return hex === ADMIN_PATH_HASH;
}
