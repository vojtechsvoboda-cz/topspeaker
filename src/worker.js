// TOP Speaker: statické soubory + jeden společný záznam konfigurátoru v KV.
// GET  /api/konfigurace        -> uložené odpovědi (stejné pro každého, kdo zná heslo)
// GET  /api/konfigurace?vse=1  -> aktuální stav + všechny odeslané verze (stránka /odpovedi)
// DELETE /api/konfigurace      -> smaže vše (tlačítko na /odpovedi)
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
      if (request.method === 'GET' && url.searchParams.has('vse')) {
        const current = JSON.parse((await env.KONFIGURACE.get(KEY)) || '{}');
        const list = await env.KONFIGURACE.list({ prefix: 'odeslano:' });
        const sent = [];
        for (const k of list.keys) {
          const v = await env.KONFIGURACE.get(k.name);
          if (v) sent.push({ at: k.name.slice('odeslano:'.length), data: JSON.parse(v) });
        }
        sent.sort((x, y) => (x.at < y.at ? 1 : -1));
        return json({ current, sent });
      }
      if (request.method === 'DELETE') {
        await env.KONFIGURACE.delete(KEY);
        const list = await env.KONFIGURACE.list({ prefix: 'odeslano:' });
        for (const k of list.keys) await env.KONFIGURACE.delete(k.name);
        return json({ ok: true });
      }
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
