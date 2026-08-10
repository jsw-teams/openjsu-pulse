export type RouteContext<Environment = Record<string, unknown>, ExecutionContext = unknown> = {
  request: Request;
  url: URL;
  params: Readonly<Record<string, string>>;
  env: Environment;
  executionContext: ExecutionContext;
};

export type RouteHandler<Environment = Record<string, unknown>, ExecutionContext = unknown> = (
  context: RouteContext<Environment, ExecutionContext>
) => Response | Promise<Response>;

type Route<Environment, ExecutionContext> = {
  method: string;
  pattern: string;
  segments: string[];
  handler: RouteHandler<Environment, ExecutionContext>;
};

function pathSegments(pathname: string): string[] | null {
  try {
    return pathname.split('/').filter(Boolean).map(segment => decodeURIComponent(segment));
  } catch {
    return null;
  }
}

function match(pattern: string[], pathname: string[]): Record<string, string> | null {
  if (pattern.length !== pathname.length) return null;
  const params: Record<string, string> = {};
  for (let index = 0; index < pattern.length; index += 1) {
    const expected = pattern[index];
    const actual = pathname[index];
    if (expected.startsWith(':')) params[expected.slice(1)] = actual;
    else if (expected !== actual) return null;
  }
  return params;
}

export class Router<Environment = Record<string, unknown>, ExecutionContext = unknown> {
  readonly routes: Route<Environment, ExecutionContext>[] = [];

  on(method: string, pattern: string, handler: RouteHandler<Environment, ExecutionContext>): this {
    if (!pattern.startsWith('/')) throw new TypeError(`Route pattern must start with "/": ${pattern}`);
    if (typeof handler !== 'function') throw new TypeError('Route handler must be a function');
    const segments = pathSegments(new URL(pattern, 'https://pagekiln.invalid').pathname);
    if (!segments) throw new TypeError(`Route pattern is not valid: ${pattern}`);
    this.routes.push({ method: method.toUpperCase(), pattern, segments, handler });
    return this;
  }

  get(pattern: string, handler: RouteHandler<Environment, ExecutionContext>): this { return this.on('GET', pattern, handler); }
  post(pattern: string, handler: RouteHandler<Environment, ExecutionContext>): this { return this.on('POST', pattern, handler); }
  all(pattern: string, handler: RouteHandler<Environment, ExecutionContext>): this { return this.on('*', pattern, handler); }

  async match(request: Request, env: Environment, executionContext: ExecutionContext): Promise<Response | null> {
    const url = new URL(request.url);
    const segments = pathSegments(url.pathname);
    if (!segments) return new Response('Bad request', { status: 400 });
    const method = request.method.toUpperCase();
    for (const route of this.routes) {
      if (route.method !== '*' && route.method !== method && !(method === 'HEAD' && route.method === 'GET')) continue;
      const params = match(route.segments, segments);
      if (!params) continue;
      const response = await route.handler({ request, url, params, env, executionContext });
      if (!(response instanceof Response)) throw new TypeError(`Route ${route.method} ${route.pattern} did not return a Response`);
      return method === 'HEAD' ? new Response(null, response) : response;
    }
    return null;
  }
}

type AssetBinding = { fetch(request: Request): Response | Promise<Response> };

export type SiteFetchOptions<Environment = Record<string, unknown>, ExecutionContext = unknown> = {
  router?: Router<Environment, ExecutionContext>;
  defaultLocale?: string;
  staticDirectory?: string;
  assets?: (request: Request, env: Environment) => Response | Promise<Response>;
};

function assetRequest(request: Request, defaultLocale: string): Request {
  const url = new URL(request.url);
  if (url.pathname === '/') url.pathname = '/index.html';
  else if (url.pathname.endsWith('/')) url.pathname += 'index.html';
  return new Request(url, request);
}

function assetRequests(request: Request, defaultLocale: string, staticDirectory = ''): Request[] {
  const standard = assetRequest(request, defaultLocale);
  const original = new Request(request);
  const candidates = [standard, original];
  const normalizedStaticDirectory = String(staticDirectory).replace(/^\/+|\/+$/g, '');
  if (normalizedStaticDirectory && !standard.url.includes(`/${normalizedStaticDirectory}/`)) {
    const staticUrl = new URL(standard.url);
    staticUrl.pathname = `/${normalizedStaticDirectory}${staticUrl.pathname}`;
    candidates.push(new Request(staticUrl, request));
  }
  const archivedUrl = new URL(standard.url);
  if (!archivedUrl.pathname.startsWith('/dist/')) archivedUrl.pathname = `/dist${archivedUrl.pathname}`;
  candidates.push(new Request(archivedUrl, request));
  const seen = new Set<string>();
  return candidates.filter(candidate => {
    const key = candidate.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function createSiteFetchHandler<Environment = Record<string, unknown>, ExecutionContext = unknown>(
  options: SiteFetchOptions<Environment, ExecutionContext> = {}
) {
  const defaultLocale = options.defaultLocale || 'en';
  return async (request: Request, env: Environment, executionContext: ExecutionContext): Promise<Response> => {
    const dynamic = options.router ? await options.router.match(request, env, executionContext) : null;
    if (dynamic) return dynamic;
    const explicitAssets = options.assets;
    if (explicitAssets) return explicitAssets(assetRequest(request, defaultLocale), env);
    const binding = (env as Record<string, unknown> | undefined)?.ASSETS as AssetBinding | undefined;
    if (binding && typeof binding.fetch === 'function') {
      let response = new Response('Not found', { status: 404 });
      for (const candidate of assetRequests(request, defaultLocale, options.staticDirectory)) {
        response = await binding.fetch(candidate);
        if (response.status !== 404) return response;
      }
      return response;
    }
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  };
}
