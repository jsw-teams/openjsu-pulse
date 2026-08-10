import test from 'node:test';
import assert from 'node:assert/strict';
import { parseYaml, YamlError } from '../src/lib/yaml.ts';
import { parseMarkdown, renderInline, flattenDirectives, MarkdownError } from '../src/lib/markdown.ts';
import { html, unsafeHtml, safeUrl } from '../src/lib/safe-html.ts';

test('frontmatter yaml parses nested maps, lists, and flow values', () => {
  const value = parseYaml('title: Hello\nactive: true\nitems:\n  - one\n  - two\nnav:\n  links:\n    - key: home\n      href: /\nflow: [one, two]\n');
  assert.equal(value.title, 'Hello');
  assert.equal(value.active, true);
  assert.deepEqual(value.items, ['one', 'two']);
  assert.equal(value.nav.links[0].key, 'home');
  assert.equal(value.nav.links[0].href, '/');
  assert.deepEqual(value.flow, ['one', 'two']);
});

test('markdown keeps prose around directives and parses GFM basics', () => {
  const nodes = parseMarkdown('# Title\n\nBefore.\n\n:::hero{tone="brand"}\n## Inside\n:::\n\n- one\n- two\n\n| A | B |\n| --- | --- |\n| 1 | 2 |', 'page.md');
  assert.equal(nodes[0].kind, 'heading');
  assert.equal(nodes[1].kind, 'paragraph');
  assert.equal(flattenDirectives(nodes).length, 1);
  assert.equal(nodes.at(-1).kind, 'table');
});

test('markdown escapes text and link protocols', () => {
  const html = renderInline('<script>alert(1)</script> [x](javascript:alert(1))');
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="#"/);
  assert.equal(safeUrl('data:text/html,evil'), '#');
});

test('directive diagnostics include source location', () => {
  assert.throws(() => parseMarkdown(':::hero{bad}\ntext\n:::', 'page.md'), (error) => error instanceof MarkdownError && error.message.includes('page.md:1:'));
});

test('GFM task lists, strikethrough, Unicode heading ids, and fenced directives are preserved', () => {
  const nodes = parseMarkdown('# 工具箱\n\n## 重复\n\n## 重复\n\n- [x] done\n\n~~old~~\n\n```md\n:::hero\n```', 'gfm.md');
  assert.equal(nodes[0].kind, 'heading');
  assert.equal(nodes[0].id, '工具箱');
  assert.equal(nodes[2].id, '重复-2');
  assert.match(nodes.map(node => node.kind === 'directive' ? '' : node.html).join(''), /task-list-item/);
  assert.match(nodes.map(node => node.kind === 'directive' ? '' : node.html).join(''), /<s>old<\/s>/);
  assert.equal(flattenDirectives(nodes).length, 0);
});

test('YAML rejects duplicate keys with a line and column', () => {
  assert.throws(() => parseYaml('title: one\ntitle: two\n'), error => error instanceof YamlError && error.line === 2 && error.column > 0);
});

test('SafeHtml escapes by default and only preserves explicit unsafeHtml values', () => {
  assert.equal(String(html`<p>${'<script>'}</p>`), '<p>&lt;script&gt;</p>');
  assert.equal(String(html`<p>${unsafeHtml('<strong>trusted</strong>')}</p>`), '<p><strong>trusted</strong></p>');
});
