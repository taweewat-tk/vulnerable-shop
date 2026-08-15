// src/lib/minisql.ts
// A deliberately tiny SQL engine, so the app runs real SQL queries without
// pulling in a native database driver.

export type Row = Record<string, string | number | null>;
export type Table = Row[];
export type Database = Record<string, Table>;

type TokenKind = 'ident' | 'string' | 'number' | 'op' | 'punc';
interface Token {
  kind: TokenKind;
  value: string;
}

const OPERATORS = ['>=', '<=', '!=', '<>', '=', '>', '<'];

export function query(db: Database, sql: string, params: Array<string | number> = []): Row[] {
  return execSelect(db, tokenize(sql, params));
}

function tokenize(sql: string, params: Array<string | number>): Token[] {
  const out: Token[] = [];
  let i = 0;
  let paramIndex = 0;

  while (i < sql.length) {
    const c = sql[i];

    // Comment: everything up to the end of the line disappears.
    if (c === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    if (/\s/.test(c)) {
      i++;
      continue;
    }

    // Single-quoted string, with '' as the escape for a literal quote.
    if (c === "'") {
      let value = '';
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          value += "'";
          i += 2;
          continue;
        }
        if (sql[i] === "'") {
          i++;
          break;
        }
        value += sql[i++];
      }
      out.push({ kind: 'string', value });
      continue;
    }

    // A parameter is substituted after tokenising, so its content can never
    // become SQL. This is the whole point of parameterised queries.
    if (c === '?') {
      if (paramIndex >= params.length) throw new Error('minisql: not enough parameters');
      const value = params[paramIndex++];
      out.push(
        typeof value === 'number'
          ? { kind: 'number', value: String(value) }
          : { kind: 'string', value: String(value) },
      );
      i++;
      continue;
    }

    if (/[0-9]/.test(c)) {
      let value = '';
      while (i < sql.length && /[0-9.]/.test(sql[i])) value += sql[i++];
      out.push({ kind: 'number', value });
      continue;
    }

    if (/[A-Za-z_]/.test(c)) {
      let value = '';
      while (i < sql.length && /[A-Za-z0-9_]/.test(sql[i])) value += sql[i++];
      out.push({ kind: 'ident', value });
      continue;
    }

    const op = OPERATORS.find((candidate) => sql.startsWith(candidate, i));
    if (op) {
      out.push({ kind: 'op', value: op });
      i += op.length;
      continue;
    }

    if ('*,()'.includes(c)) {
      out.push({ kind: 'punc', value: c });
      i++;
      continue;
    }

    throw new Error(`minisql: unexpected character ${c}`);
  }

  return out;
}

class Cursor {
  private index = 0;
  constructor(private readonly tokens: Token[]) {}

  peek(): Token | undefined {
    return this.tokens[this.index];
  }

  next(): Token | undefined {
    return this.tokens[this.index++];
  }

  eatKeyword(word: string): boolean {
    const token = this.peek();
    if (token && token.kind === 'ident' && token.value.toUpperCase() === word) {
      this.index++;
      return true;
    }
    return false;
  }

  expectKeyword(word: string): void {
    if (!this.eatKeyword(word)) throw new Error(`minisql: expected ${word}`);
  }
}

type Predicate = (row: Row) => unknown;

function execSelect(db: Database, tokens: Token[]): Row[] {
  const cursor = new Cursor(tokens);
  cursor.expectKeyword('SELECT');

  const columns: string[] = [];
  if (cursor.peek()?.value === '*') {
    cursor.next();
    columns.push('*');
  } else {
    for (;;) {
      const token = cursor.next();
      if (!token || token.kind !== 'ident') throw new Error('minisql: expected a column name');
      columns.push(token.value);
      if (cursor.peek()?.value === ',') {
        cursor.next();
        continue;
      }
      break;
    }
  }

  cursor.expectKeyword('FROM');
  const tableToken = cursor.next();
  if (!tableToken || tableToken.kind !== 'ident') throw new Error('minisql: expected a table name');
  const table = db[tableToken.value];
  if (!table) throw new Error(`minisql: unknown table ${tableToken.value}`);

  let rows: Table = table;
  if (cursor.eatKeyword('WHERE')) {
    const predicate = parseExpression(cursor);
    rows = table.filter((row) => truthy(predicate(row)));
  }

  if (columns[0] === '*') return rows.map((row) => ({ ...row }));
  return rows.map((row) => Object.fromEntries(columns.map((key) => [key, row[key] ?? null])));
}

function parseExpression(cursor: Cursor): Predicate {
  let left = parseAnd(cursor);
  while (cursor.eatKeyword('OR')) {
    const right = parseAnd(cursor);
    const previous = left;
    left = (row) => truthy(previous(row)) || truthy(right(row));
  }
  return left;
}

function parseAnd(cursor: Cursor): Predicate {
  let left = parseComparison(cursor);
  while (cursor.eatKeyword('AND')) {
    const right = parseComparison(cursor);
    const previous = left;
    left = (row) => truthy(previous(row)) && truthy(right(row));
  }
  return left;
}

function parseComparison(cursor: Cursor): Predicate {
  if (cursor.peek()?.value === '(') {
    cursor.next();
    const inner = parseExpression(cursor);
    if (cursor.next()?.value !== ')') throw new Error('minisql: expected )');
    return inner;
  }

  const left = parseOperand(cursor);
  const token = cursor.peek();

  if (token && token.kind === 'op') {
    cursor.next();
    const right = parseOperand(cursor);
    return (row) => compare(left(row), token.value, right(row));
  }

  if (token && token.kind === 'ident' && token.value.toUpperCase() === 'LIKE') {
    cursor.next();
    const right = parseOperand(cursor);
    return (row) => like(String(left(row) ?? ''), String(right(row) ?? ''));
  }

  return left;
}

function parseOperand(cursor: Cursor): (row: Row) => unknown {
  const token = cursor.next();
  if (!token) throw new Error('minisql: unexpected end of query');
  if (token.kind === 'string') return () => token.value;
  if (token.kind === 'number') return () => Number(token.value);
  if (token.kind === 'ident') return (row) => (token.value in row ? row[token.value] : token.value);
  throw new Error(`minisql: unexpected token ${token.value}`);
}

function compare(left: unknown, op: string, right: unknown): boolean {
  if (op === '=') return String(left) === String(right);
  if (op === '!=' || op === '<>') return String(left) !== String(right);
  const a = Number(left);
  const b = Number(right);
  if (op === '>') return a > b;
  if (op === '<') return a < b;
  if (op === '>=') return a >= b;
  if (op === '<=') return a <= b;
  throw new Error(`minisql: unknown operator ${op}`);
}

function like(value: string, pattern: string): boolean {
  const source = pattern.split('%').map(escapeRegExp).join('.*');
  return new RegExp(`^${source}$`, 'i').test(value);
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truthy(value: unknown): boolean {
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value !== '' && value !== '0';
  return Boolean(value);
}
