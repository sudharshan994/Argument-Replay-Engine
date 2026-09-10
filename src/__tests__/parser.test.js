import { describe, it, expect } from 'vitest';
import { parseDebateText } from '../../server/parser.js';

describe('parseDebateText', () => {
  it('returns array of {speaker, text} for standard input', () => {
    const input = "Alice: X\nBob: Y";
    const result = parseDebateText(input);
    expect(result).toEqual([
      { speaker: "Alice", text: "X" },
      { speaker: "Bob", text: "Y" }
    ]);
  });

  it('handles empty string -> returns []', () => {
    expect(parseDebateText("")).toEqual([]);
    expect(parseDebateText("   \n  ")).toEqual([]);
  });

  it('handles single speaker -> returns [{speaker:"Alice", text:"X"}]', () => {
    expect(parseDebateText("Alice: X")).toEqual([{ speaker: "Alice", text: "X" }]);
  });

  it('strips extra whitespace', () => {
    const input = "Alice:    This   is   X   ";
    expect(parseDebateText(input)).toEqual([{ speaker: "Alice", text: "This is X" }]);
  });
});
