export const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers });
export function authorized(request, env) {
  const expected = String(env.ADMIN_PASSWORD || '');
  const provided = String(request.headers.get('X-Admin-Password') || '');
  if (!expected || !provided || expected.length !== provided.length) return false;
  let mismatch = 0; for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return mismatch === 0;
}
export function safeText(value, max = 2000) { return String(value ?? '').trim().slice(0, max); }
export function validImageUrl(value) { return !value || /^https:\/\//i.test(value); }
