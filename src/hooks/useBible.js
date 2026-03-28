// src/hooks/useBible.js
import { useState, useEffect, useCallback } from 'react';
import { DB } from '../lib/db';
import { VERSIONS, DEFAULT_VERSION } from '../lib/bibleVersions';

const cache = {};

/** Load (and cache) any Bible version – returns the parsed JSON data */
export async function loadBibleVersion(ver) {
  if (cache[ver]) return cache[ver];
  const url = VERSIONS[ver]?.url ?? VERSIONS[DEFAULT_VERSION].url;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Falha ao carregar a Bíblia.');
  const data = await resp.json();
  cache[ver] = data;
  return data;
}

export function useBibleData() {
  const [bibleData, setBibleData] = useState(null);
  const [version, setVersion]     = useState(DEFAULT_VERSION);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const loadBible = useCallback(async (ver) => {
    setLoading(true);
    setError(null);
    try {
      if (cache[ver]) {
        setBibleData(cache[ver]);
      } else {
        const url = VERSIONS[ver]?.url ?? VERSIONS[DEFAULT_VERSION].url;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Falha ao carregar a Bíblia.');
        const data = await resp.json();
        cache[ver] = data;
        setBibleData(data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    DB.getPref('bible_version', DEFAULT_VERSION).then(v => {
      setVersion(v);
      loadBible(v);
    });
  }, [loadBible]);

  const changeVersion = useCallback(async (ver) => {
    await DB.setPref('bible_version', ver);
    setVersion(ver);
    loadBible(ver);
  }, [loadBible]);

  return { bibleData, version, loading, error, changeVersion };
}
