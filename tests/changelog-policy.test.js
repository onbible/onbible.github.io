import { describe, it, expect } from 'vitest';
import { needsChangelogEntry } from '../scripts/changelog-policy.mjs';

describe('changelog-policy', () => {
  it('returns false when nothing relevant is staged', () => {
    expect(needsChangelogEntry(['README.md'])).toBe(false);
    expect(needsChangelogEntry([])).toBe(false);
  });

  it('returns true when src/ changed but CHANGELOG not staged', () => {
    expect(needsChangelogEntry(['src/pages/BookPage.jsx'])).toBe(true);
  });

  it('returns true when tests/ changed but CHANGELOG not staged', () => {
    expect(needsChangelogEntry(['tests/foo.test.js'])).toBe(true);
  });

  it('returns false when src/ and CHANGELOG are staged', () => {
    expect(needsChangelogEntry(['src/App.jsx', 'CHANGELOG.md'])).toBe(false);
  });

  it('returns false when only CHANGELOG is staged', () => {
    expect(needsChangelogEntry(['CHANGELOG.md'])).toBe(false);
  });
});
