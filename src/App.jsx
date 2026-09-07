import { useEffect, useMemo, useRef, useState } from 'react';
import { passages } from './passages';

const modes = [15, 30, 60];
const levels = ['Easy', 'Medium', 'Hard'];

function getPassage(level, avoid = '') {
  const options = passages[level].filter((item) => item !== avoid);
  const pool = options.length ? options : passages[level];
  return pool[Math.floor(Math.random() * pool.length)];
}

function StatCard({ label, value, unit = '' }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>;
}

export default function App() {
  const [difficulty, setDifficulty] = useState('Medium');
  const [duration, setDuration] = useState(30);
  const [passage, setPassage] = useState(() => getPassage('Medium'));
  const [typed, setTyped] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('typeflow-theme') || 'light');
  const [best, setBest] = useState(() => Number(localStorage.getItem('typeflow-best-wpm') || 0));
  const inputRef = useRef(null);

  const errors = useMemo(() => [...typed].reduce((count, char, i) => count + (char !== passage[i] ? 1 : 0), 0), [typed, passage]);
  const accuracy = typed.length ? Math.round(((typed.length - errors) / typed.length) * 100) : 100;
  const elapsed = duration - secondsLeft;
  const wpm = elapsed > 0 ? Math.round((typed.length / 5) / (elapsed / 60)) : 0;

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('typeflow-theme', theme); }, [theme]);
  useEffect(() => {
    if (!started || finished) return undefined;
    const timer = window.setInterval(() => setSecondsLeft((time) => time <= 1 ? 0 : time - 1), 1000);
    return () => window.clearInterval(timer);
  }, [started, finished]);
  useEffect(() => { if (started && secondsLeft === 0) setFinished(true); }, [secondsLeft, started]);
  useEffect(() => {
    if (!finished) return;
    setStarted(false);
    if (wpm > best) { setBest(wpm); localStorage.setItem('typeflow-best-wpm', String(wpm)); }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = (newPassage = false, nextDifficulty = difficulty, nextDuration = duration) => {
    setPassage((current) => newPassage ? getPassage(nextDifficulty, current) : current);
    setTyped(''); setSecondsLeft(nextDuration); setStarted(false); setFinished(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const chooseDifficulty = (level) => { setDifficulty(level); reset(true, level); };
  const chooseDuration = (time) => { setDuration(time); reset(false, difficulty, time); };
  const handleChange = (event) => {
    if (finished) return;
    const value = event.target.value;
    if (value.length > passage.length) return;
    if (!started && value.length) setStarted(true);
    setTyped(value);
    if (value === passage) setFinished(true);
  };

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#game" aria-label="Typeflow home"><i>⌁</i> Typeflow</a>
      <button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle color theme">{theme === 'light' ? '☾' : '☀'}</button>
    </header>

    <section className="hero">
      <p className="eyebrow">FOCUS · FLOW · FINISH</p>
      <h1>Find your <em>typing rhythm.</em></h1>
      <p className="subtitle">Race the clock, sharpen your skills, and beat your personal best.</p>
    </section>

    <section className="game-card" id="game">
      <div className="controls">
        <div><span className="control-label">Time</span><div className="segmented">{modes.map((time) => <button key={time} className={duration === time ? 'active' : ''} onClick={() => chooseDuration(time)} disabled={started}>{time}s</button>)}</div></div>
        <div><span className="control-label">Difficulty</span><div className="segmented">{levels.map((level) => <button key={level} className={difficulty === level ? 'active' : ''} onClick={() => chooseDifficulty(level)} disabled={started}>{level}</button>)}</div></div>
      </div>
      <div className="stats-row">
        <StatCard label="TIME LEFT" value={secondsLeft} unit="s" />
        <StatCard label="WPM" value={wpm} />
        <StatCard label="ACCURACY" value={accuracy} unit="%" />
        <StatCard label="ERRORS" value={errors} />
      </div>
      <div className="typing-area" onClick={() => inputRef.current?.focus()}>
        <p className="passage" aria-label="Typing passage">{[...passage].map((char, i) => <span key={i} className={i < typed.length ? (typed[i] === char ? 'correct' : 'incorrect') : i === typed.length ? 'current' : ''}>{char}</span>)}</p>
        <textarea ref={inputRef} value={typed} onChange={handleChange} disabled={finished} spellCheck="false" autoComplete="off" aria-label="Type the passage here" placeholder={finished ? 'Game complete' : 'Start typing here…'} />
      </div>
      <div className="actions"><button className="secondary-button" onClick={() => reset(false)}>↻ Restart</button><button className="primary-button" onClick={() => reset(true)}>New game <span>→</span></button></div>
    </section>

    <section className="bottom-stats"><div><span>PERSONAL BEST</span><strong>{best} <small>WPM</small></strong></div><div><span>MODE</span><strong>{difficulty} <small>· {duration} seconds</small></strong></div></section>
    {finished && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title"><div className="result-card"><p className="eyebrow">SESSION COMPLETE</p><h2 id="result-title">Great <em>work!</em></h2><div className="result-grid"><StatCard label="WPM" value={wpm} /><StatCard label="ACCURACY" value={accuracy} unit="%" /><StatCard label="ERRORS" value={errors} /></div>{wpm >= best && wpm > 0 && <p className="best-note">★ New personal best!</p>}<button className="primary-button full" onClick={() => reset(true)}>Try again <span>→</span></button></div></div>}
  </main>;
}
