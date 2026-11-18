import { describe, expect, it } from 'vitest';
import { toCsv } from '@/lib/utils/toCsv';

describe('toCsv', () => {
  it('joins a header and rows with commas and CRLF line endings', () => {
    expect(toCsv(['Name', 'Hours'], [['Avery', 3]])).toBe(
      'Name,Hours\r\nAvery,3',
    );
  });

  it('quotes cells containing commas, quotes, or line breaks', () => {
    expect(toCsv(['A'], [['Kim, Avery'], ['Say "hi"'], ['line\nbreak']])).toBe(
      'A\r\n"Kim, Avery"\r\n"Say ""hi"""\r\n"line\nbreak"',
    );
  });

  it('writes null and undefined as empty cells', () => {
    expect(toCsv(['A', 'B', 'C'], [[null, undefined, 0]])).toBe('A,B,C\r\n,,0');
  });

  it('prefixes text that a spreadsheet would run as a formula', () => {
    expect(toCsv(['A'], [['=SUM(1,2)'], ['@cmd'], ['+1'], ['-1']])).toBe(
      "A\r\n\"'=SUM(1,2)\"\r\n'@cmd\r\n'+1\r\n'-1",
    );
  });

  it('leaves negative numbers alone', () => {
    expect(toCsv(['A'], [[-2]])).toBe('A\r\n-2');
  });
});
