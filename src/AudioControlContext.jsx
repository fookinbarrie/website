import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AudioControlContext = createContext(null);

const PRIMARY_TRACK_SRC = '/audio/close-to-you.mp3';
const FALLBACK_TRACK_SRC = '/audio/no-one-noticed.mp3';

export function AudioControlProvider({ children }) {
  const audioRef = useRef(null);
  const startedRef = useRef(false);
  const manualPausedRef = useRef(false);
  const externalReasonsRef = useRef(new Set());

  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [externallyPaused, setExternallyPaused] = useState(false);
  const srcRef = useRef(PRIMARY_TRACK_SRC);

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      await audio.play();
      startedRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  // Do NOT auto-start music — it will be started explicitly via startMusic()

  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    manualPausedRef.current = false;
    const s = srcRef.current;
    if (!audio.src || audio.src === 'about:blank' || !audio.src.endsWith(s)) {
      audio.src = s;
    }
    try { audio.currentTime = 0; } catch { /* ignore */ }
    audio.play().then(() => { startedRef.current = true; }).catch(() => {});
  }, []);

  const unlock = useCallback(() => {
    setIsUnlocked(true);
    startMusic();
  }, [startMusic]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      if (srcRef.current !== FALLBACK_TRACK_SRC) {
        srcRef.current = FALLBACK_TRACK_SRC;
        audio.src = FALLBACK_TRACK_SRC;
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    setIsPlaying(!audio.paused);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      manualPausedRef.current = true;
      audio.pause();
      return;
    }

    manualPausedRef.current = false;
    if (externalReasonsRef.current.size > 0) {
      setExternallyPaused(true);
      return;
    }

    await tryPlay();
  }, [tryPlay]);

  const pauseFor = useCallback((reason = 'external') => {
    const audio = audioRef.current;
    externalReasonsRef.current.add(reason);
    setExternallyPaused(true);

    if (audio && !audio.paused) {
      audio.pause();
    }
  }, []);

  const resumeFor = useCallback(
    async (reason = 'external') => {
      externalReasonsRef.current.delete(reason);

      if (externalReasonsRef.current.size > 0) {
        setExternallyPaused(true);
        return;
      }

      setExternallyPaused(false);

      if (manualPausedRef.current) return;

      await tryPlay();
    },
    [tryPlay]
  );

  const value = useMemo(
    () => ({
      isPlaying,
      isUnlocked,
      externallyPaused,
      toggle,
      pauseFor,
      resumeFor,
      startMusic,
      unlock,
    }),
    [externallyPaused, isPlaying, isUnlocked, pauseFor, resumeFor, toggle, startMusic, unlock]
  );

  return (
    <AudioControlContext.Provider value={value}>
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        loop
        style={{ display: 'none' }}
      />

      {!externallyPaused && isUnlocked && (
        <div className="mini-player">
          <img
            className="mini-player-cover"
            src="/audio/cover.jpg"
            alt="Album cover"
            draggable={false}
          />
          <div className="mini-player-info">
            <span className="mini-player-label">now playing</span>
            <span className="mini-player-title">Close To You - Jauh [Reality Club]</span>
          </div>
          <button
            type="button"
            className="mini-player-btn"
            onClick={toggle}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? 'pause music' : 'play music'}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="5" height="18" rx="1"/><rect x="14" y="3" width="5" height="18" rx="1"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3.5v17a1 1 0 0 0 1.5.87l14-8.5a1 1 0 0 0 0-1.74l-14-8.5A1 1 0 0 0 6 3.5z"/></svg>
            )}
          </button>
        </div>
      )}

      {children}
    </AudioControlContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAudioControl() {
  const ctx = useContext(AudioControlContext);
  return ctx;
}
