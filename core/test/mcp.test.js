// The MCP server, driven by a real MCP client over stdio, the way Kiro talks to it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('MCP server lists five tools and validates ghosts', async () => {
  const client = new Client({ name: 'ghost-crew-test', version: '1.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: ['core/bin/ghost-crew.js', 'mcp'] }));
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), ['check_ghost', 'list_ghosts', 'read_report', 'summon', 'write_ghost']);

    const good = await client.callTool({ name: 'check_ghost', arguments: { yaml: 'ghost: The Probe\nhaunts: /\nsenses: [axe]' } });
    assert.match(good.content[0].text, /^Valid\. The Probe/);

    const bad = await client.callTool({ name: 'write_ghost', arguments: { path: 'ghosts/x.ghost.yaml', yaml: 'ghost: The Probe\nsenses: [telepathy]' } });
    assert.match(bad.content[0].text, /^Not written/);
    assert.match(bad.content[0].text, /unknown sense "telepathy"/);

    const listed = await client.callTool({ name: 'list_ghosts', arguments: { dir: 'app-poltergeist' } });
    assert.match(listed.content[0].text, /The Lantern Dimmer haunts \/index.html/);

    const escape = await client.callTool({ name: 'write_ghost', arguments: { path: '../outside.ghost.yaml', yaml: 'ghost: The Probe\nhaunts: /\nsenses: [axe]' } });
    assert.ok(escape.isError || /outside the project/.test(escape.content[0].text));
  } finally {
    await client.close();
  }
});
