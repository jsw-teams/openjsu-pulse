const blocks = {
  hero: {
    name: 'hero',
    schema: { tone: 'string', align: 'string' },
    defaults: { tone: 'default', align: 'left' },
    render: (node, context) => `<section class="block hero tone-${context.escapeHtml(node.attrs.tone || 'default')} align-${context.escapeHtml(node.attrs.align || 'left')}">${context.renderNodes(node.children)}</section>`
  },
  'feature-grid': {
    name: 'feature-grid',
    schema: { columns: 'number' },
    defaults: { columns: '3' },
    render: (node, context) => `<section class="block feature-grid" style="--columns:${context.escapeHtml(node.attrs.columns || '3')}">${context.renderNodes(node.children)}</section>`
  },
  'post-list': {
    name: 'post-list',
    schema: { limit: 'number' },
    defaults: { limit: '6' },
    dependencies: (_node, context) => [`collection:posts:${context.doc.locale}`],
    render: (node, context) => `<section class="block post-list"><h2>Latest posts</h2>${context.collection('posts').slice(0, Number(node.attrs.limit || 6)).map(post => `<article><h3><a href="${context.safeUrl(context.routeFor(post))}">${context.escapeHtml(post.title)}</a></h3><p>${context.escapeHtml(post.description)}</p></article>`).join('')}</section>`
  }
};

export default {
  patterns: {
    landing: { name: 'landing', contexts: ['page'], render: content => content },
    document: { name: 'document', contexts: ['page', 'custom'], render: content => `<article class="document-body">${content}</article>` },
    blog: { name: 'blog', contexts: ['post', 'blog'], render: content => `<article class="post">${content}</article>` }
  },
  blocks
};
