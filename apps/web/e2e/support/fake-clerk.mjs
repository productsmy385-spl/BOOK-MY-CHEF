// Local stand-ins for external services, used ONLY for automated end-to-end tests.
// The backend runs its production code paths against these; only base URLs differ.
//
// Clerk
//   GET  /.well-known/jwks.json           RSA public key (JWKS)
//   GET  /token?sub=user_x                RS256 session token (iss = this server)
//   GET  /v1/users/:id                    Clerk Backend API user with a verified email
// ImageKit (private key = FAKE_IMAGEKIT_PRIVATE_KEY, default "private_test_key")
//   POST /imagekit/upload                 signed client upload or Basic-auth server upload
//   GET  /imagekit/v1/files/:id/details   file metadata (Basic auth)
//   DELETE /imagekit/v1/files/:id         delete (Basic auth)
//   GET  /imagekit/img/:id                the stored bytes
// OpenAI Images
//   POST /openai/images/generations       returns a small PNG as b64_json
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = 9999;
const ISS = `http://localhost:${PORT}`;
const IK_PRIVATE = process.env.FAKE_IMAGEKIT_PRIVATE_KEY || 'private_test_key';
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' };
const b64u = (b) => Buffer.from(b).toString('base64url');
const files = new Map();

// 1x1 PNG, enough for the image pipeline
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

function sign(sub, opts = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: 'test-key' };
  const payload = { sub, iss: opts.iss || ISS, iat: now, nbf: now - 5, exp: now + (opts.ttl ?? 600), azp: 'http://localhost:5173' };
  const data = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(payload))}`;
  return `${data}.${b64u(crypto.sign('RSA-SHA256', Buffer.from(data), privateKey))}`;
}

const basicOk = (req) => req.headers.authorization === `Basic ${Buffer.from(`${IK_PRIVATE}:`).toString('base64')}`;
const readBody = (req) => new Promise((resolve) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => resolve(Buffer.concat(c))); });
const details = (f) => ({ fileId: f.fileId, name: f.name, filePath: f.filePath, url: f.url, mime: f.mime, fileType: 'image',
  size: f.size, width: 1, height: 1 });

http.createServer(async (req, res) => {
  const url = new URL(req.url, ISS);
  const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(JSON.stringify(body)); };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' });
    return res.end();
  }
  if (url.pathname === '/.well-known/jwks.json') return send(200, { keys: [jwk] });
  if (url.pathname === '/token') {
    return send(200, { token: sign(url.searchParams.get('sub'), {
      ttl: url.searchParams.has('ttl') ? Number(url.searchParams.get('ttl')) : undefined,
      iss: url.searchParams.get('iss') || undefined }) });
  }
  let m = url.pathname.match(/^\/v1\/users\/(.+)$/);
  if (m) {
    const id = m[1];
    return send(200, { id, first_name: 'Test', last_name: id, primary_email_address_id: 'em1',
      email_addresses: [{ id: 'em1', email_address: `${id}@example.test`, verification: { status: 'verified' } }], phone_numbers: [] });
  }

  // ---- ImageKit
  if (url.pathname === '/imagekit/upload' && req.method === 'POST') {
    const body = await readBody(req);
    const form = await new Response(body, { headers: { 'content-type': req.headers['content-type'] } }).formData();
    if (!basicOk(req)) {
      const token = form.get('token'); const expire = form.get('expire'); const signature = form.get('signature');
      const expected = crypto.createHmac('sha1', IK_PRIVATE).update(`${token}${expire}`).digest('hex');
      if (signature !== expected || Number(expire) < Date.now() / 1000) return send(403, { message: 'Invalid signature' });
    }
    const file = form.get('file');
    const bytes = Buffer.from(await file.arrayBuffer());
    const fileId = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    const name = `${fileId}-${form.get('fileName') || 'file'}`;
    const folder = (form.get('folder') || '/').replace(/\/$/, '');
    const f = { fileId, name, filePath: `${folder}/${name}`, url: `${ISS}/imagekit/img/${fileId}`,
      mime: file.type || 'application/octet-stream', size: bytes.length, bytes };
    files.set(fileId, f);
    return send(200, details(f));
  }
  m = url.pathname.match(/^\/imagekit\/v1\/files\/([^/]+)(\/details)?$/);
  if (m) {
    if (!basicOk(req)) return send(403, { message: 'Your account cannot be authenticated.' });
    const f = files.get(m[1]);
    if (!f) return send(404, { message: 'No file found' });
    if (req.method === 'DELETE') { files.delete(m[1]); res.writeHead(204); return res.end(); }
    return send(200, details(f));
  }
  m = url.pathname.match(/^\/imagekit\/img\/([^/]+)$/);
  if (m && files.has(m[1])) {
    const f = files.get(m[1]);
    res.writeHead(200, { 'content-type': f.mime });
    return res.end(f.bytes);
  }

  // ---- OpenAI Images
  if (url.pathname === '/openai/images/generations' && req.method === 'POST') {
    if (req.headers.authorization !== 'Bearer sk-test-openai') return send(401, { error: { message: 'bad key' } });
    return send(200, { data: [{ b64_json: PNG.toString('base64') }] });
  }
  send(404, {});
}).listen(PORT, () => console.log(`fake services on ${PORT}`));
