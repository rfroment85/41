// ═══════════════════════════════ PAGE TRACK ═══════════════════════════════════
// Check-in rapide — habitudes 1-tap + rituels stoïques + focus timer
// RÈGLE TDAH : chaque action < 2 clics, chaque logging < 30 secondes
import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../stores/useGameStore';

// ─── Toggle d'habitude (1 tap) ───
function HabitToggle({ habit, onToggle }) {
  const isLogged = habit.logged_today;

  return (
    <button
      onClick={() => !isLogged && onToggle(habit.id)}
      className={`empire-card p-3 flex items-center gap-3 transition-all ${
        isLogged ? 'border-empire-green/30 bg-empire-green/5' : 'hover:border-empire-gold/30'
      }`}
      disabled={isLogged}
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        isLogged
          ? 'border-empire-green bg-empire-green text-empire-bg animate-check-pop'
          : 'border-empire-border'
      }`}>
        {isLogged && <span className="text-xs font-bold">✓</span>}
      </div>
      <div className="flex-1 text-left">
        <p className={`text-sm ${isLogged ? 'text-empire-sub line-through' : 'text-empire-text'}`}>
          {habit.title}
        </p>
        <p className="text-[10px] text-empire-muted">{habit.domain} · +{habit.xp_reward} XP</p>
      </div>
      {habit.streak_current > 0 && (
        <span className="text-xs text-empire-momentum font-mono">🔥{habit.streak_current}</span>
      )}
    </button>
  );
}

// ─── Formulaire nouvelle habitude ───
function NouvelleHabitudeForm({ onClose }) {
  const { creerHabitude } = useGameStore();
  const [titre, setTitre] = useState('');
  const [domaine, setDomaine] = useState('general');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titre.trim()) return;
    await creerHabitude({ title: titre, domain: domaine });
    onClose();
  };

  return (
    <div className="empire-card p-4 animate-fade-up">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text" value={titre} onChange={e => setTitre(e.target.value)}
          placeholder="Nouvelle habitude..."
          className="bg-empire-bg border border-empire-border rounded-lg px-3 py-2 text-sm text-empire-text"
          autoFocus
        />
        <div className="flex gap-2">
          <select
            value={domaine} onChange={e => setDomaine(e.target.value)}
            className="flex-1 bg-empire-bg border border-empire-border rounded-lg px-2 py-1.5 text-xs text-empire-text"
          >
            <option value="sante">💪 Santé</option>
            <option value="carriere">🎯 Carrière</option>
            <option value="croissance">🧠 Croissance</option>
            <option value="relations">❤️ Relations</option>
            <option value="general">📋 Général</option>
          </select>
          <button type="button" onClick={onClose} className="btn-ghost text-xs">✕</button>
          <button type="submit" className="btn-gold text-xs">Ajouter</button>
        </div>
      </form>
    </div>
  );
}

// ─── Timer Pomodoro ───
function FocusTimer() {
  const [actif, setActif] = useState(false);
  const [restant, setRestant] = useState(25 * 60); // 25 min par défaut
  const [duree, setDuree] = useState(25);
  const intervalRef = useRef(null);
  const debutRef = useRef(null);
  const { ajouterNotification } = useGameStore();

  useEffect(() => {
    if (actif) {
      debutRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - debutRef.current) / 1000);
        const remaining = duree * 60 - elapsed;
        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          setActif(false);
          setRestant(0);
          ajouterNotification(`🍅 Session de ${duree} min terminée ! +30 XP`, 'xp');
        } else {
          setRestant(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [actif, duree]);

  // Recalculer sur focus tab (time blindness TDAH)
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && actif && debutRef.current) {
        const elapsed = Math.floor((Date.now() - debutRef.current) / 1000);
        setRestant(Math.max(0, duree * 60 - elapsed));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [actif, duree]);

  const minutes = Math.floor(restant / 60);
  const secondes = restant % 60;
  const progressPct = duree > 0 ? ((duree * 60 - restant) / (duree * 60)) * 100 : 0;

  // Couleur du timer selon le temps restant
  const timerColor = restant < 120 ? '#EF4444' : restant < duree * 30 ? '#FFD700' : '#06B6D4';

  const circumference = 2 * Math.PI * 85;

  return (
    <div className="empire-card p-6 flex flex-col items-center">
      <h3 className="font-royal text-sm text-empire-text mb-4">🎯 Focus</h3>

      {/* Timer circulaire SVG */}
      <div className="relative w-48 h-48 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="85" fill="none" stroke="#1E2538" strokeWidth="8" />
          <circle
            cx="100" cy="100" r="85" fill="none"
            stroke={timerColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progressPct / 100)}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl text-empire-text font-bold" style={{ color: timerColor }}>
            {String(minutes).padStart(2, '0')}:{String(secondes).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-empire-muted mt-1">
            {actif ? 'En cours...' : 'Prêt'}
          </span>
        </div>
      </div>

      {/* Contrôles durée */}
      {!actif && (
        <div className="flex gap-2 mb-4">
          {[15, 25, 45, 90].map(d => (
            <button
              key={d}
              onClick={() => { setDuree(d); setRestant(d * 60); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                duree === d
                  ? 'bg-empire-gold/20 text-empire-gold border border-empire-gold/30'
                  : 'bg-empire-surface border border-empire-border text-empire-sub hover:text-empire-text'
              }`}
            >
              {d}min
            </button>
          ))}
        </div>
      )}

      {/* Boutons start/stop */}
      <div className="flex gap-3">
        {!actif ? (
          <button onClick={() => { setRestant(duree * 60); setActif(true); }} className="btn-gold px-8">
            Démarrer
          </button>
        ) : (
          <>
            <button onClick={() => setActif(false)} className="btn-ghost px-6">
              Pause
            </button>
            <button
              onClick={() => { setActif(false); setRestant(duree * 60); debutRef.current = null; }}
              className="btn-ghost px-4 text-empire-red"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Rituel du matin ───
function RituelMatin({ rituel }) {
  const { logRituelMatin } = useGameStore();
  const [focus, setFocus] = useState('');
  const [obstacle, setObstacle] = useState('');

  if (rituel?.matin) {
    return (
      <div className="empire-card p-4 border-l-2 border-l-amber-500/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">📜</span>
          <h3 className="text-xs font-medium text-empire-gold">Conseil de guerre — complété ✓</h3>
        </div>
        <p className="text-xs text-empire-sub">Focus : {rituel.matin.focus_domain || '—'}</p>
      </div>
    );
  }

  return (
    <div className="empire-card p-4 border-l-2 border-l-amber-500">
      <h3 className="font-royal text-sm text-empire-gold mb-3">📜 Conseil de guerre du matin</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-empire-sub block mb-1">Quel est ton FOCUS unique aujourd'hui ?</label>
          <select value={focus} onChange={e => setFocus(e.target.value)}
            className="w-full bg-empire-bg border border-empire-border rounded-lg px-3 py-2 text-sm text-empire-text">
            <option value="">Choisir un domaine...</option>
            <option value="sante">💪 Santé</option>
            <option value="carriere">🎯 Carrière</option>
            <option value="croissance">🧠 Croissance</option>
            <option value="relations">❤️ Relations</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-empire-sub block mb-1">Quel obstacle vas-tu rencontrer ?</label>
          <input type="text" value={obstacle} onChange={e => setObstacle(e.target.value)}
            placeholder="En 1 phrase..."
            className="w-full bg-empire-bg border border-empire-border rounded-lg px-3 py-2 text-sm text-empire-text" />
        </div>
        <button
          onClick={() => logRituelMatin({ focus_domain: focus, obstacle })}
          disabled={!focus}
          className="w-full btn-gold text-xs disabled:opacity-40"
        >
          Compléter le rituel — +10 Momentum
        </button>
      </div>
    </div>
  );
}

// ─── Rituel du soir ───
function RituelSoir({ rituel }) {
  const { logRituelSoir } = useGameStore();
  const [lesson, setLesson] = useState('');
  const [mood, setMood] = useState(7);

  if (rituel?.soir) {
    return (
      <div className="empire-card p-4 border-l-2 border-l-indigo-500/50">
        <div className="flex items-center gap-2">
          <span className="text-sm">🌙</span>
          <h3 className="text-xs font-medium text-indigo-400">Chroniques du soir — complété ✓</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="empire-card p-4 border-l-2 border-l-indigo-500">
      <h3 className="font-royal text-sm text-indigo-400 mb-3">🌙 Chroniques du soir</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-empire-sub block mb-1">Quelle leçon tires-tu de cette journée ?</label>
          <input type="text" value={lesson} onChange={e => setLesson(e.target.value)}
            placeholder="En 1 phrase..."
            className="w-full bg-empire-bg border border-empire-border rounded-lg px-3 py-2 text-sm text-empire-text" />
        </div>
        <div>
          <label className="text-xs text-empire-sub block mb-1">Humeur du soir : {mood}/10</label>
          <input type="range" min="1" max="10" value={mood} onChange={e => setMood(Number(e.target.value))}
            className="w-full accent-indigo-500" />
        </div>
        <button
          onClick={() => logRituelSoir({ lesson, mood })}
          className="w-full btn-gold text-xs"
        >
          Clore la journée — +15 Momentum
        </button>
      </div>
    </div>
  );
}

// ─── Page Track principale ───
export default function TrackPage() {
  const { habitudes, loggerHabitude, rituels } = useGameStore();
  const [ajouterOuvert, setAjouterOuvert] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="font-royal text-xl text-empire-text">⚡ Check-in rapide</h2>
      <p className="text-xs text-empire-muted">1 tap = 1 habitude. Moins de 30 secondes.</p>

      {/* Rituels stoïques */}
      <RituelMatin rituel={rituels} />

      {/* Habitudes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-empire-sub">Habitudes du jour</h3>
          <button onClick={() => setAjouterOuvert(!ajouterOuvert)} className="btn-ghost text-xs">
            {ajouterOuvert ? '✕' : '+ Ajouter'}
          </button>
        </div>
        {ajouterOuvert && <NouvelleHabitudeForm onClose={() => setAjouterOuvert(false)} />}
        {(habitudes || []).map(h => (
          <HabitToggle key={h.id} habit={h} onToggle={loggerHabitude} />
        ))}
        {(!habitudes || habitudes.length === 0) && (
          <div className="empire-card p-6 text-center">
            <p className="text-empire-muted text-sm mb-2">Pas encore d'habitudes.</p>
            <p className="text-empire-muted text-xs">Commencez simple : 1 seule habitude.</p>
          </div>
        )}
      </div>

      {/* Timer focus */}
      <FocusTimer />

      {/* Rituel du soir */}
      <RituelSoir rituel={rituels} />
    </div>
  );
}
