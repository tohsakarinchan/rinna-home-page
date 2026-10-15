// Stateless JSON-RPC transport. Tools expose public site metadata only.
export async function handleMcp(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return new Response('Forbidden origin', {status: 403});
  if (request.method !== 'POST') return new Response(null, {status: 405, headers: {Allow: 'POST'}});
  let message;
  try { message = await request.json(); } catch { return Response.json({jsonrpc: '2.0', id: null, error: {code: -32700, message: 'Parse error'}}); }
  const reply = (value) => Response.json({jsonrpc: '2.0', id: message?.id ?? null, ...value});
  if (!message || Array.isArray(message) || message.jsonrpc !== '2.0' || typeof message.method !== 'string') return reply({error: {code: -32600, message: 'Invalid Request'}});
  if (!Object.hasOwn(message, 'id')) return new Response(null, {status: 202});
  switch (message.method) {
    case 'initialize': return reply({result: {protocolVersion: '2025-03-26', capabilities: {tools: {listChanged: false}}, serverInfo: {name: 'rinna-home-page', version: '1.0.0'}}});
    case 'ping': return reply({result: {}});
    case 'tools/list': return reply({result: {tools: [{name: 'get_site_info', description: 'Read public information about the Rinna homepage.', inputSchema: {type: 'object', properties: {}, additionalProperties: false}, annotations: {readOnlyHint: true, destructiveHint: false, openWorldHint: false}}]}});
    case 'tools/call': {
      if (message.params?.name !== 'get_site_info') return reply({error: {code: -32602, message: 'Unknown tool'}});
      if (message.params.arguments && (typeof message.params.arguments !== 'object' || Array.isArray(message.params.arguments) || Object.keys(message.params.arguments).length)) return reply({error: {code: -32602, message: 'This tool takes no arguments'}});
      return reply({result: {content: [{type: 'text', text: JSON.stringify({name: 'rinna-home-page', url: new URL('/', request.url).href, description: 'Rinna personal homepage, blog and travel journal.'})}]}});
    }
    default: return reply({error: {code: -32601, message: 'Method not found'}});
  }
}

