/**
 * Regra: alterações em src/ ou tests/ exigem CHANGELOG.md no mesmo commit (staged).
 */
export function needsChangelogEntry(stagedFiles) {
  if (!stagedFiles?.length) return false;
  const relevant = stagedFiles.some(
    (f) => f.startsWith('src/') || f.startsWith('tests/')
  );
  const hasChangelog = stagedFiles.includes('CHANGELOG.md');
  return relevant && !hasChangelog;
}
