// Thin Node/Vercel bridge; domain handlers use standard Request/Response for Sites.
export function nodeHandler(handler, path) {
  return async (req, res) => {
    const url = new URL(req.url || path, 'https://localhost');
    for (const [key, value] of Object.entries(req.query || {})) if (value != null) url.searchParams.set(key, String(value));
    const response = await handler({ request: new Request(url, { method: req.method }), env: process.env });
    for (const [key, value] of response.headers) res.setHeader(key, value);
    res.status(response.status);
    if (response.status === 204) return res.end();
    if (response.headers.get('content-type')?.includes('application/json')) return res.json(await response.json());
    return res.send(await response.text());
  };
}
