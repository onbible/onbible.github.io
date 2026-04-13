import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../src/components/Layout.jsx';

describe('Layout — link Projeção', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('abre Projeção numa nova aba (target _blank e rel seguro)', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Layout theme="light" setAppTheme={() => {}}>
            <div>child</div>
          </Layout>
        </MemoryRouter>
      );
    });

    const projectorLink = container.querySelector('a[href="/projector"]');
    expect(projectorLink).toBeTruthy();
    expect(projectorLink.getAttribute('target')).toBe('_blank');
    const rel = projectorLink.getAttribute('rel') || '';
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });
});
