const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('portal probes the current Shadow runtime port', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.match(html, /3004/);
  assert.match(html, /FALLBACK_ORIGIN = 'http:\/\/127\.0\.0\.1:3004'/);
});
