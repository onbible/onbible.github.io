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
    // Apply persisted theme
    const savedTheme = localStorage.getItem('dark_mode') === '1' ? 'dark' : 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('dark_mode', next === 'dark' ? '1' : '0');
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <BrowserRouter>
      <Layout theme={theme} toggleTheme={toggleTheme}>
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/book/:abbrev"  element={<BookPage />} />
          <Route path="/markers"       element={<MarkersPage />} />
          <Route path="/play"          element={<PlayPage />} />
          <Route path="/settings"      element={<SettingsPage theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/changelog"     element={<ChangelogPage />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
