// Helpers for seeding real data through the public API (no direct database writes).
export const API = process.env.E2E_API_URL || 'http://localhost:8081/api/v1';
export const CLERK = process.env.E2E_CLERK_URL || 'http://localhost:9999';

export async function token(sub) {
  const r = await fetch(`${CLERK}/token?sub=${encodeURIComponent(sub)}&ttl=3600`);
  return (await r.json()).token;
}

export async function call(method, path, tok, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(tok ? { authorization: `Bearer ${tok}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json?.data;
}

/** Creates and publishes a provider with the given services. Returns { id, token, services }. */
export async function publishedProvider(sub, { name, city, categories, cuisines = [], services }) {
  const tok = await token(sub);
  await call('POST', '/auth/sync', tok, { intendedRole: 'PROVIDER', fullName: name, city, roles: categories });
  await call('PUT', '/providers/me/profile', tok, {
    name, city, bio: `${name} — experienced professional serving events and family gatherings.`, experienceYears: 8, maxTravelDistanceKm: 30,
  });
  if (cuisines.length) await call('PUT', '/providers/me/cuisines', tok, { cuisines });
  for (const s of services) await call('POST', '/providers/me/services', tok, s);
  const me = await call('POST', '/providers/me/publish', tok);
  return { id: me.id, token: tok, services: me.services };
}

export async function customer(sub, name) {
  const tok = await token(sub);
  await call('POST', '/auth/sync', tok, { intendedRole: 'CUSTOMER', fullName: name, city: 'Hyderabad', phone: '9876500000' }).catch(async () =>
    call('POST', '/auth/sync', tok, { intendedRole: 'CUSTOMER', fullName: name, city: 'Hyderabad' }));
  return tok;
}

/** Makes the page send this bearer token, as Clerk would after sign-in. */
export async function signInAs(page, tok) {
  await page.addInitScript((t) => {
    window.Clerk = { session: { getToken: async () => t }, signOut: async () => {} };
  }, tok);
}
