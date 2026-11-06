// TOP Speaker: statické soubory + jeden společný záznam konfigurátoru v KV.
// GET  /api/konfigurace  -> vrátí uložené odpovědi (stejné pro každého, kdo zná heslo)
// POST /api/konfigurace  -> uloží odpovědi; po odeslání navíc uloží kopii "odeslano:<čas>"
const KEY = 'konfigurace:sdilena';
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/konfigurace') {
      if (request.method === 'GET') {
        const data = await env.KONFIGURACE.get(KEY);
        return new Response(data || '{}', {
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
        });
      }
      if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, error: 'json' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ ok: false, error: 'body' }, 400);
      const now = new Date().toISOString();
      const record = JSON.stringify({ ...body, savedAt: now });
      if (record.length > 100000) return json({ ok: false, error: 'size' }, 413);
      await env.KONFIGURACE.put(KEY, record, { metadata: { status: body.status || 'draft', savedAt: now } });
      if (body.status === 'sent' && body.justSent) {
        await env.KONFIGURACE.put(`odeslano:${now}`, record);
      }
      return json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  },
};
