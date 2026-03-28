import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BookPage from './pages/BookPage';
import MarkersPage from './pages/MarkersPage';
import PlayPage from './pages/PlayPage';
import SettingsPage from './pages/SettingsPage';
import ChangelogPage from './pages/ChangelogPage';
import { DB } from './lib/db';

export default function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('app_theme') || (localStorage.getItem('dark_mode') === '1' ? 'dark' : 'light');
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
    // Apply saved font size
    const fs = localStorage.getItem('reading_font_size');
    if (fs) document.documentElement.style.setProperty('--reading-font-size', fs + 'px');
  }, []);

  const setAppTheme = (t) => {
    setTheme(t);
    localStorage.setItem('app_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  return (
    <BrowserRouter>
      <Layout theme={theme} setAppTheme={setAppTheme}>
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/book/:abbrev"  element={<BookPage />} />
          <Route path="/markers"       element={<MarkersPage />} />
          <Route path="/play"          element={<PlayPage />} />
          <Route path="/settings"      element={<SettingsPage theme={theme} setAppTheme={setAppTheme} />} />
          <Route path="/changelog"     element={<ChangelogPage />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
