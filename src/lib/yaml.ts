import { parseDocument } from 'yaml';

export class YamlError extends Error {
  readonly line: number;
  readonly column: number;

  constructor(message: string, line: number, column: number) {
    super(`${message} (line ${line}, column ${column})`);
    this.name = 'YamlError';
    this.line = line;
    this.column = column;
  }
}

function parseValue(text: string): unknown {
  const document = parseDocument(text, {
    prettyErrors: false,
    strict: true,
    uniqueKeys: true
  });
  const error = document.errors[0];
  if (error) {
    const offset = Array.isArray(error.pos) ? error.pos[0] : 0;
    const before = text.slice(0, Math.max(0, offset));
    const lines = before.split('\n');
    const position = error.linePos?.[0] || { line: lines.length, col: (lines.at(-1)?.length || 0) + 1 };
    throw new YamlError(error.message, position.line, position.col);
  }
  return document.toJS({ mapAsMap: false });
}

export function parseYamlScalar(value: string): unknown {
  return parseValue(value);
}

export function parseYaml(text: string): Record<string, any> {
  const value = parseValue(text);
  if (value === null || value === undefined) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new YamlError('Expected a YAML mapping at the document root', 1, 1);
  return value as Record<string, any>;
}
