import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleMcp} from '../worker/mcp.js';
const call = async (method, params) => (await handleMcp(new Request('https://example.com/mcp', {method: 'POST', body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params})}))).json();
test('MCP initialization, discovery and public tool execution', async () => {
  assert.equal((await call('initialize')).result.capabilities.tools.listChanged, false);
  const tool = (await call('tools/list')).result.tools[0];
  const result = await call('tools/call', {name: tool.name, arguments: {}});
  assert.equal(JSON.parse(result.result.content[0].text).url, 'https://example.com/');
  assert.equal((await call('tools/call', {name: 'delete'})).error.code, -32602);
});
test('MCP rejects foreign origins and acknowledges notifications', async () => {
  assert.equal((await handleMcp(new Request('https://example.com/mcp', {method: 'POST', headers: {origin: 'https://other.com'}}))).status, 403);
  assert.equal((await handleMcp(new Request('https://example.com/mcp', {method: 'POST', body: JSON.stringify({jsonrpc: '2.0', method: 'notifications/initialized'})}))).status, 202);
});
