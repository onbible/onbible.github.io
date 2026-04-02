import { useMemo } from 'react';
import changelogMd from '../../CHANGELOG.md?raw';
import {
  parseChangelog,
  renderChangelogItemHtml,
  CATEGORY_CONFIG,
} from '../lib/changelogParser';

export default function ChangelogPage() {
  const versions = useMemo(() => parseChangelog(changelogMd), []);

  return (
    <div className="changelog-page">
      <div className="changelog-hero">
        <div className="changelog-badge-hero">
          <i className="fas fa-scroll" /> CHANGELOG
        </div>
        <h2 className="changelog-hero-title">Histórico de Atualizações</h2>
        <p className="changelog-hero-sub">
          Acompanhe cada melhoria, correção e funcionalidade nova do OnBible.
        </p>
      </div>

      <div className="changelog-content">
        {versions.map((version) => {
          const isUnreleased = version.name.toLowerCase() === 'unreleased';
          const dotClass = isUnreleased ? 'changelog-version-dot changelog-version-dot--unreleased' : 'changelog-version-dot';
          const tagClass = isUnreleased
            ? 'changelog-version-tag changelog-version-tag--unreleased'
            : 'changelog-version-tag';
          const tagLabel = isUnreleased ? '⚡ Em desenvolvimento' : `v${version.name}`;
          const dotIcon = isUnreleased ? 'fas fa-bolt' : 'fas fa-tag';

          const categoriesWithItems = version.categories.filter((c) => c.items.length > 0);

          return (
            <div key={version.name} className="changelog-version-block">
              <div className={dotClass}>
                <i className={dotIcon} />
              </div>
              <div className="changelog-version-header">
                <span className={tagClass}>{tagLabel}</span>
                {version.date ? (
                  <span className="changelog-version-date">
                    <i className="fas fa-calendar-alt" style={{ marginRight: 4 }} />
                    {version.date}
                  </span>
                ) : null}
              </div>

              {categoriesWithItems.length === 0 ? (
                <p className="changelog-empty-cat">Nenhuma mudança registrada ainda.</p>
              ) : (
                categoriesWithItems.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat.key] || {
                    label: cat.raw,
                    cls: '',
                  };
                  return (
                    <div key={cat.key + cat.raw} className="changelog-category-block">
                      <div className={`changelog-category-title ${cfg.cls}`}>{cfg.label}</div>
                      <ul className="changelog-category-list">
                        {cat.items.map((item, i) => (
                          <li key={i}>
                            <span
                              className="changelog-item-body"
                              dangerouslySetInnerHTML={{ __html: renderChangelogItemHtml(item) }}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
