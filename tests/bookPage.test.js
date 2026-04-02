import { describe, it, expect } from 'vitest';
import { applyHighlightMap, expandSelectionRange } from '../src/pages/BookPage';

describe('BookPage helpers', () => {
  it('should apply highlight color to multiple verses', () => {
    const result = applyHighlightMap({ 1: 'yellow' }, [2, 3], 'blue');
    expect(result).toEqual({ 1: 'yellow', 2: 'blue', 3: 'blue' });
  });

  it('should clear highlight from multiple verses', () => {
    const result = applyHighlightMap({ 1: 'yellow', 2: 'green', 3: 'pink' }, [1, 3], 'clear');
    expect(result).toEqual({ 2: 'green' });
  });

  it('should expand selection into continuous range', () => {
    expect(expandSelectionRange(new Set([10, 12]))).toEqual([10, 11, 12]);
  });

  it('should keep selection unchanged when less than two verses', () => {
    expect(expandSelectionRange(new Set([7]))).toEqual([7]);
    expect(expandSelectionRange(new Set())).toEqual([]);
  });
});
