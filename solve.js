// Fast drop-in for make.fun's csv-reader 1.0.0 (csv-reader-speed-01).
// Written from the reference semantics in the kit's RULES.txt / vendor/csv-reader/index.js:
// same {columns, rows, errors} for every {text, header}, same error order and line/row
// accounting. Speed comes from slicing fields out of the input instead of building
// them one character at a time, and from jumping straight to the next delimiter
// with indexOf (native) instead of scanning every character in JS.
//
// Semantics, mirrored exactly:
// - U+FEFF at the very start is dropped.
// - A record ends at LF or CRLF; a line left with no characters is no record.
// - Outside quotes a CR not followed by LF is dropped (error stray_cr).
// - A field opening with a quote runs to the next quote that is not doubled;
//   "" inside it is one quote, each CRLF or lone CR inside it reads as LF;
//   what follows its closing quote, up to the next comma or line break, is
//   appended as it stands (quote_junk, when the field ends); a quote that never
//   closes is a literal character and the text after it is read again as
//   unquoted (unterminated_quote).
// - A quote inside an unquoted field is a literal character.
// - Fields stay strings, never trimmed or converted.
// - columns is the first record when header is true, else null; rows are the
//   records after it, each padded with "" (short_row, fields: its count) or cut
//   (long_row, extra: the cut fields) to the first record's width.
// - Each error is {code, line, row}, in the order met; a record's short_row /
//   long_row when it ends; line is the 1-based line its record starts on,
//   counting every LF, CRLF and lone CR inside quotes; row is its record's
//   index in rows, null for the header.

const COMMA = 0;
const LINE_BREAK = 1;
const END = 2;

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const n = text.length;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  let pos = 0;
  let line = 1;
  if (n > 0 && text.charCodeAt(0) === 0xfeff) pos = 1;

  // Normalise one quoted-field segment [a, b): CRLF and lone CR each become LF,
  // and `line` advances once per line break inside it. Fast path (no CR/LF):
  // just slice.
  function segment(a, b) {
    const cr = text.indexOf('\r', a);
    if (cr !== -1 && cr < b) {
      // Slow path: contains a CR (and maybe LFs).
      let out = '';
      let start = a;
      let i = a;
      while (i < b) {
        const c = text.charCodeAt(i);
        if (c === 13) {
          out += text.slice(start, i) + '\n';
          line += 1;
          i += text.charCodeAt(i + 1) === 10 ? 2 : 1;
          start = i;
        } else if (c === 10) {
          out += text.slice(start, i) + '\n';
          line += 1;
          i += 1;
          start = i;
        } else {
          i += 1;
        }
      }
      return out + text.slice(start, b);
    }
    const lf = text.indexOf('\n', a);
    if (lf !== -1 && lf < b) {
      // Contains LF only: count them, value is the slice unchanged.
      let count = 0;
      let at = lf;
      while (at !== -1 && at < b) {
        count += 1;
        at = text.indexOf('\n', at + 1);
      }
      line += count;
      return text.slice(a, b);
    }
    return text.slice(a, b);
  }

  // Read an unquoted field starting at `pos`, with `initial` already in the
  // value ('' normally, '"' for the unterminated-quote re-read). Returns
  // [value, ended]. Stray CRs push errors in encounter order.
  function readUnquoted(initial, recLine, recRow) {
    let value = initial;
    for (;;) {
      let i = pos;
      while (i < n) {
        const c = text.charCodeAt(i);
        if (c === 44 || c === 10 || c === 13) break;
        i += 1;
      }
      if (i >= n) {
        if (pos < n) value = value === '' ? text.slice(pos, n) : value + text.slice(pos, n);
        pos = n;
        return [value, END];
      }
      const c = text.charCodeAt(i);
      if (c === 44) {
        value = value === '' ? text.slice(pos, i) : value + text.slice(pos, i);
        pos = i + 1;
        return [value, COMMA];
      }
      if (c === 10) {
        value = value === '' ? text.slice(pos, i) : value + text.slice(pos, i);
        pos = i + 1;
        line += 1;
        return [value, LINE_BREAK];
      }
      if (text.charCodeAt(i + 1) === 10) {
        value = value === '' ? text.slice(pos, i) : value + text.slice(pos, i);
        pos = i + 2;
        line += 1;
        return [value, LINE_BREAK];
      }
      if (pos < i) value = value === '' ? text.slice(pos, i) : value + text.slice(pos, i);
      errors.push({ code: 'stray_cr', line: recLine, row: recRow });
      pos = i + 1;
    }
  }

  // Read a quoted field whose opening quote is at `pos`. Returns [value, ended].
  function readQuoted(recLine, recRow) {
    const open = pos;
    const openLine = line;
    pos += 1;
    let segStart = pos;
    let parts = null;
    for (;;) {
      const q = text.indexOf('"', pos);
      if (q === -1) {
        // Never closes: literal quote, re-read the rest as unquoted.
        pos = open + 1;
        line = openLine;
        errors.push({ code: 'unterminated_quote', line: recLine, row: recRow });
        return readUnquoted('"', recLine, recRow);
      }
      if (q + 1 < n && text.charCodeAt(q + 1) === 34) {
        // Doubled quote: segment up to q, plus one literal quote.
        if (parts === null) parts = [];
        parts.push(segment(segStart, q));
        parts.push('"');
        pos = q + 2;
        segStart = pos;
        continue;
      }
      // Closing quote.
      let value;
      if (parts === null) {
        value = segment(segStart, q);
      } else {
        parts.push(segment(segStart, q));
        value = parts.join('');
      }
      pos = q + 1;
      if (pos >= n) return [value, END];
      const c = text.charCodeAt(pos);
      if (c === 44) { pos += 1; return [value, COMMA]; }
      if (c === 10) { pos += 1; line += 1; return [value, LINE_BREAK]; }
      if (c === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; return [value, LINE_BREAK]; }
      // Junk after the closing quote, appended as it stands.
      const junk = readUnquoted(value, recLine, recRow);
      // readUnquoted counts kept chars only via its return; recompute "added":
      // junk value longer than the quoted value means characters were kept.
      // (stray CRs dropped inside junk do not count; they add nothing.)
      // NOTE: junk[0] starts with `value`, so added = length difference only
      // when no stray CR was dropped — but a dropped CR also shortens nothing
      // else, so length difference is exactly the kept junk length.
      if (junk[0].length > value.length) {
        errors.push({ code: 'quote_junk', line: recLine, row: recRow });
      }
      return junk;
    }
  }

  for (;;) {
    // Lines with no characters are no records.
    while (pos < n) {
      const c = text.charCodeAt(pos);
      if (c === 10) { pos += 1; line += 1; }
      else if (c === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; }
      else break;
    }
    if (pos >= n) break;

    const recordLine = line;
    const recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let ended;
    let quoted = false;
    do {
      let field;
      if (text.charCodeAt(pos) === 34) {
        quoted = true;
        field = readQuoted(recordLine, recordRow);
      } else {
        quoted = false;
        field = readUnquoted('', recordLine, recordRow);
      }
      fields.push(field[0]);
      ended = field[1];
    } while (ended === COMMA);

    // A line that held only stray CRs is left with no characters: no record
    // (its stray_cr errors stay).
    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
