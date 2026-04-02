import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import BookPage from './pages/BookPage';
import MarkersPage from './pages/MarkersPage';
import PlayPage from './pages/PlayPage';
import SettingsPage from './pages/SettingsPage';
import ChangelogPage from './pages/ChangelogPage';
import ReadingPlanPage from './pages/ReadingPlanPage';
import AboutPage from './pages/AboutPage';
import SermonsPage from './pages/SermonsPage';
import ProjectorPage from './pages/ProjectorPage';
import DictionaryPage from './pages/DictionaryPage';
import ConcordancePage from './pages/ConcordancePage';
import HymnalPage from './pages/HymnalPage';
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
    // Apply saved font family
    const ff = localStorage.getItem('reading_font_family');
    if (ff) document.documentElement.style.setProperty('--reading-font-family', ff);
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
          <Route path="/"              element={<DashboardPage />} />
          <Route path="/bible"         element={<HomePage />} />
          <Route path="/book/:abbrev"  element={<BookPage />} />
          <Route path="/markers"       element={<MarkersPage />} />
          <Route path="/plan"          element={<ReadingPlanPage />} />
          <Route path="/play"          element={<PlayPage />} />
          <Route path="/settings"      element={<SettingsPage theme={theme} setAppTheme={setAppTheme} />} />
          <Route path="/changelog"     element={<ChangelogPage />} />
          <Route path="/sermons"      element={<SermonsPage />} />
          <Route path="/projector"    element={<ProjectorPage />} />
          <Route path="/dictionary"   element={<DictionaryPage />} />
          <Route path="/concordance" element={<ConcordancePage />} />
          <Route path="/hymnal"      element={<HymnalPage />} />
          <Route path="/about"         element={<AboutPage />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
