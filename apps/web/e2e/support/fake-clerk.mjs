// Local stand-in for Clerk used only for end-to-end verification.
// - GET /.well-known/jwks.json      -> RSA public key (JWKS)
// - GET /token?sub=user_x           -> RS256 session token (iss = this server)
// - GET /v1/users/:id               -> Clerk Backend API user with a verified email
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = 9999;
const ISS = `http://localhost:${PORT}`;
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' };
const b64u = (b) => Buffer.from(b).toString('base64url');

function sign(sub, opts = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: 'test-key' };
  const payload = { sub, iss: opts.iss || ISS, iat: now, nbf: now - 5, exp: now + (opts.ttl ?? 600), azp: 'http://localhost:5173' };
  const data = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(payload))}`;
  const sig = crypto.sign('RSA-SHA256', Buffer.from(data), privateKey);
  return `${data}.${b64u(sig)}`;
}

http.createServer((req, res) => {
  const url = new URL(req.url, ISS);
  const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (url.pathname === '/.well-known/jwks.json') return send(200, { keys: [jwk] });
  if (url.pathname === '/token') {
    return send(200, { token: sign(url.searchParams.get('sub'), {
      ttl: url.searchParams.has('ttl') ? Number(url.searchParams.get('ttl')) : undefined,
      iss: url.searchParams.get('iss') || undefined }) });
  }
  const m = url.pathname.match(/^\/v1\/users\/(.+)$/);
  if (m) {
    const id = m[1];
    return send(200, {
      id, first_name: 'Test', last_name: id,
      primary_email_address_id: 'em1',
      email_addresses: [{ id: 'em1', email_address: `${id}@example.test`, verification: { status: 'verified' } }],
      phone_numbers: [],
    });
  }
  send(404, {});
}).listen(PORT, () => console.log(`fake clerk on ${PORT}`));
