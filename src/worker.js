// TOP Speaker: statické soubory + uložení odpovědí z konfigurátoru do KV.
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/konfigurace') {
      if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, error: 'json' }, 400); }
      const id = String(body.id || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
      if (!id) return json({ ok: false, error: 'id' }, 400);
      const record = JSON.stringify({ ...body, id, savedAt: new Date().toISOString() });
      if (record.length > 100000) return json({ ok: false, error: 'size' }, 413);
      await env.KONFIGURACE.put(`konfigurace:${id}`, record, {
        metadata: { status: body.status || 'draft', savedAt: new Date().toISOString() },
      });
      return json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  },
};
