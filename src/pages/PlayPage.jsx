import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBibleData } from '../hooks/useBible';
import { AUDIO_MAP, buildPlaylist } from '../lib/audioLibrary';

const OT_BOOKS = ['gn','ex','lv','nm','dt','js','jz','rt','1sm','2sm','1rs','2rs','1cr','2cr','ed','ne','et','jó','sl','pv','ec','ct','is','jr','lm','ez','dn','os','jl','am','ob','jn','mq','na','hc','sf','ag','zc','ml'];

const CATEGORY = {
  gn:'law',ex:'law',lv:'law',nm:'law',dt:'law',
  js:'hist',jz:'hist',rt:'hist','1sm':'hist','2sm':'hist','1rs':'hist','2rs':'hist','1cr':'hist','2cr':'hist',ed:'hist',ne:'hist',et:'hist',
  jó:'poet',sl:'poet',pv:'poet',ec:'poet',ct:'poet',
  is:'pmaj',jr:'pmaj',lm:'pmaj',ez:'pmaj',dn:'pmaj',
  os:'pmin',jl:'pmin',am:'pmin',ob:'pmin',jn:'pmin',mq:'pmin',na:'pmin',hc:'pmin',sf:'pmin',ag:'pmin',zc:'pmin',ml:'pmin',
  mt:'gosp',mc:'gosp',lc:'gosp',jo:'gosp',
  atos:'acts',at:'acts',
  rm:'paul','1co':'paul','2co':'paul',gl:'paul',ef:'paul',fp:'paul',cl:'paul','1ts':'paul','2ts':'paul','1tm':'paul','2tm':'paul',tt:'paul',fm:'paul',
  hb:'gen',tg:'gen','1pe':'gen','2pe':'gen','1jo':'gen','2jo':'gen','3jo':'gen',jd:'gen',
  ap:'rev',
};

function formatTime(sec) {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PlayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bibleData, loading } = useBibleData();

  const [selectedBook, setSelectedBook] = useState(null);
  const [playlist, setPlaylist]         = useState([]);
  const [trackIndex, setTrackIndex]     = useState(0);
  const [playing, setPlaying]           = useState(false);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [volume, setVolume]             = useState(() => {
    const saved = localStorage.getItem('player_volume');
    return saved ? +saved : 0.8;
  });
  const [repeat, setRepeat]             = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef(new Audio());
  const progressRef = useRef(null);

  const books = useMemo(() => {
    if (!bibleData) return [];
    return Object.values(bibleData).filter(b => AUDIO_MAP[b.abbrev]);
  }, [bibleData]);

  // Handle initial query param ?book=gn
  useEffect(() => {
    const bookParam = searchParams.get('book');
    if (bookParam && bibleData) {
      const b = Object.values(bibleData).find(v => v.abbrev === bookParam);
      if (b && AUDIO_MAP[b.abbrev]) {
        selectBook(b);
        setSearchParams({}, { replace: true });
      }
    }
  }, [bibleData, searchParams]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else if (trackIndex < playlist.length - 1) {
        setTrackIndex(i => i + 1);
      } else {
        setPlaying(false);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [repeat, trackIndex, playlist.length]);

  // Load track when trackIndex changes
  useEffect(() => {
    if (playlist.length === 0) return;
    const audio = audioRef.current;
    const track = playlist[trackIndex];
    if (!track) return;
    audio.src = track.file;
    audio.load();
    if (playing) audio.play().catch(() => {});
  }, [trackIndex, playlist]);

  // Volume
  useEffect(() => {
    audioRef.current.volume = volume;
    localStorage.setItem('player_volume', String(volume));
  }, [volume]);

  // Playback rate
  useEffect(() => {
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Cleanup
  useEffect(() => {
    const audio = audioRef.current;
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  const selectBook = useCallback((book) => {
    setSelectedBook(book);
    const pl = buildPlaylist(book.abbrev, book.name, book.chapters.length);
    setPlaylist(pl);
    setTrackIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setShowPlaylist(false);
    audioRef.current.pause();
    audioRef.current.src = '';
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio.src || playlist.length === 0) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [playlist]);

  const prevTrack = useCallback(() => {
    if (trackIndex > 0) setTrackIndex(i => i - 1);
  }, [trackIndex]);

  const nextTrack = useCallback(() => {
    if (trackIndex < playlist.length - 1) setTrackIndex(i => i + 1);
  }, [trackIndex, playlist.length]);

  const seekTo = useCallback((e) => {
    const bar = progressRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  }, [duration]);

  const playTrack = useCallback((idx) => {
    setTrackIndex(idx);
    setPlaying(true);
    setTimeout(() => audioRef.current.play().catch(() => {}), 100);
  }, []);

  const goBackToBooks = useCallback(() => {
    audioRef.current.pause();
    audioRef.current.src = '';
    setSelectedBook(null);
    setPlaylist([]);
    setPlaying(false);
    setShowPlaylist(false);
  }, []);

  const cycleRate = useCallback(() => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const idx = rates.indexOf(playbackRate);
    setPlaybackRate(rates[(idx + 1) % rates.length]);
  }, [playbackRate]);

  // Book selection view
  if (!selectedBook) {
    const otBooks = books.filter(b => OT_BOOKS.includes(b.abbrev));
    const ntBooks = books.filter(b => !OT_BOOKS.includes(b.abbrev));
    let num = 0;

    return (
      <>
        <div className="page-header">
          <h1><i className="fas fa-headphones" style={{ marginRight: '8px' }} />Bíblia Play</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Ouça a Bíblia narrada — Selecione um livro
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '28px' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-line" style={{ width: `${50 + (i % 3) * 15}%` }} />
            ))}
          </div>
        ) : (
          <>
            {otBooks.length > 0 && (
              <>
                <div className="testament-divider">Antigo Testamento</div>
                <div className="book-grid">
                  {otBooks.map(b => {
                    num++;
                    const cat = CATEGORY[b.abbrev] || 'default';
                    return (
                      <button
                        key={b.abbrev}
                        className={`book-card pt-element cat-${cat}`}
                        onClick={() => selectBook(b)}
                        title={`${b.name}\n${num}º livro\n${b.chapters.length} capítulos`}
                      >
                        <div className="pt-top">
                          <span className="pt-number">{num}</span>
                          <span className="pt-chapters">{b.chapters.length}</span>
                        </div>
                        <div className="pt-symbol">{b.abbrev.toUpperCase()}</div>
                        <div className="pt-name">{b.name}</div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {ntBooks.length > 0 && (
              <>
                <div className="testament-divider">Novo Testamento</div>
                <div className="book-grid">
                  {ntBooks.map(b => {
                    num++;
                    const cat = CATEGORY[b.abbrev] || 'default';
                    return (
                      <button
                        key={b.abbrev}
                        className={`book-card pt-element cat-${cat}`}
                        onClick={() => selectBook(b)}
                        title={`${b.name}\n${num}º livro\n${b.chapters.length} capítulos`}
                      >
                        <div className="pt-top">
                          <span className="pt-number">{num}</span>
                          <span className="pt-chapters">{b.chapters.length}</span>
                        </div>
                        <div className="pt-symbol">{b.abbrev.toUpperCase()}</div>
                        <div className="pt-name">{b.name}</div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </>
    );
  }

  // Player view
  const track = playlist[trackIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={goBackToBooks} className="player-back-btn">
            <i className="fas fa-arrow-left" />
          </button>
          <h1 style={{ display: 'inline', fontSize: '18px' }}>
            <i className="fas fa-headphones" style={{ marginRight: '8px', color: 'var(--primary)' }} />
            {selectedBook.name}
          </h1>
        </div>
        <button
          className={`player-playlist-toggle${showPlaylist ? ' active' : ''}`}
          onClick={() => setShowPlaylist(s => !s)}
          title="Playlist"
        >
          <i className="fas fa-list-ul" />
        </button>
      </div>

      {/* Now Playing Card */}
      <div className="player-card">
        <div className="player-artwork">
          <i className={`fas fa-bible player-artwork-icon${playing ? ' pulse' : ''}`} />
        </div>

        <div className="player-info">
          <div className="player-track-title">{track?.title || 'Selecione um capítulo'}</div>
          <div className="player-track-sub">{selectedBook.name}</div>
        </div>

        {/* Progress bar */}
        <div className="player-progress-wrap">
          <span className="player-time">{formatTime(currentTime)}</span>
          <div className="player-progress-bar" ref={progressRef} onClick={seekTo}>
            <div className="player-progress-fill" style={{ width: `${progress}%` }}>
              <div className="player-progress-thumb" />
            </div>
          </div>
          <span className="player-time">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="player-controls">
          <button className={`player-ctrl-btn small${repeat ? ' active' : ''}`} onClick={() => setRepeat(r => !r)} title="Repetir">
            <i className="fas fa-redo-alt" />
          </button>
          <button className="player-ctrl-btn" onClick={prevTrack} disabled={trackIndex === 0}>
            <i className="fas fa-step-backward" />
          </button>
          <button className="player-ctrl-btn play-btn" onClick={togglePlay}>
            <i className={`fas fa-${playing ? 'pause' : 'play'}`} />
          </button>
          <button className="player-ctrl-btn" onClick={nextTrack} disabled={trackIndex >= playlist.length - 1}>
            <i className="fas fa-step-forward" />
          </button>
          <button className="player-ctrl-btn small" onClick={cycleRate} title="Velocidade">
            <span className="player-rate-label">{playbackRate}x</span>
          </button>
        </div>

        {/* Volume */}
        <div className="player-volume-row">
          <i className={`fas fa-volume-${volume === 0 ? 'mute' : volume < 0.5 ? 'down' : 'up'}`} style={{ color: 'var(--text-muted)', fontSize: '13px' }} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(+e.target.value)}
            className="player-volume-slider"
          />
        </div>
      </div>

      {/* Playlist */}
      {showPlaylist && (
        <div className="player-playlist">
          <div className="player-playlist-header">
            <h6><i className="fas fa-list-ul" style={{ marginRight: '6px' }} />Capítulos — {selectedBook.name}</h6>
            <span className="cross-ref-badge">{playlist.length}</span>
          </div>
          <div className="player-playlist-list">
            {playlist.map((t, i) => (
              <div
                key={i}
                className={`player-playlist-item${i === trackIndex ? ' current' : ''}`}
                onClick={() => playTrack(i)}
              >
                <span className="player-pl-num">{t.chapter}</span>
                <span className="player-pl-title">{t.title}</span>
                {i === trackIndex && playing && (
                  <span className="player-pl-eq">
                    <span /><span /><span />
                  </span>
                )}
                {i === trackIndex && !playing && <i className="fas fa-pause" style={{ fontSize: '10px', color: 'var(--primary)' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick chapter grid */}
      {!showPlaylist && (
        <div style={{ padding: '0 28px 28px' }}>
          <h6 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Selecionar Capítulo
          </h6>
          <div className="chapter-picker">
            {playlist.map((t, i) => (
              <button
                key={i}
                className="chapter-btn"
                onClick={() => playTrack(i)}
                style={i === trackIndex ? { borderColor: 'var(--primary)', color: 'var(--primary)', background: 'rgba(79,70,229,0.08)' } : {}}
              >
                {t.chapter}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
