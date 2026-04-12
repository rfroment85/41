// ═══════════════════════════════ DASHBOARD EMPIRE ═════════════════════════════
// Vue principale — tableau de bord de l'empire
import React, { useState } from 'react';
import useGameStore from '../stores/useGameStore';

// ─── Carte KPI ───
function KPICard({ emoji, label, value, sous, couleur = 'text-empire-gold' }) {
  return (
    <div className="empire-card p-4 animate-fade-up">
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{emoji}</span>
        <span className={`font-mono text-xl font-bold ${couleur}`}>{value}</span>
      </div>
      <p className="text-xs text-empire-sub">{label}</p>
      {sous && <p className="text-[10px] text-empire-muted mt-0.5">{sous}</p>}
    </div>
  );
}

// ─── Daily Law widget ───
function DailyLawWidget() {
  const { dailyLaw, completerDailyLaw } = useGameStore();
  if (!dailyLaw) return null;

  return (
    <div className="empire-card p-4 border-l-2 border-l-empire-gold">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-royal text-sm text-empire-gold">📜 Loi du Jour</h3>
        {dailyLaw.completed && <span className="text-empire-green text-xs">✓ Fait</span>}
      </div>
      <p className="text-sm text-empire-text italic leading-relaxed mb-2">
        "{dailyLaw.lawText}"
      </p>
      <p className="text-[10px] text-empire-muted mb-3">— {dailyLaw.source}</p>
      {dailyLaw.miniChallenge && !dailyLaw.completed && (
        <div className="bg-empire-bg rounded-lg p-3 mb-3">
          <p className="text-xs text-empire-sub">
            <strong className="text-empire-gold">Mini-défi :</strong> {dailyLaw.miniChallenge}
          </p>
        </div>
      )}
      {!dailyLaw.completed && (
        <button onClick={completerDailyLaw} className="btn-gold text-xs w-full">
          Compléter le défi — +{dailyLaw.bonusXP} XP
        </button>
      )}
    </div>
  );
}

// ─── Liste des quêtes rapides du jour ───
function QuetesRapides() {
  const { quetes, completerQuete } = useGameStore();
  const [expanded, setExpanded] = useState(false);

  const quotidiennes = (quetes || []).filter(q => q.type === 'daily' && q.status === 'active');
  const visibles = expanded ? quotidiennes : quotidiennes.slice(0, 3);

  if (quotidiennes.length === 0) {
    return (
      <div className="empire-card p-4">
        <h3 className="font-royal text-sm text-empire-text mb-2">⚔️ Quêtes du jour</h3>
        <p className="text-xs text-empire-muted">Pas de quêtes actives — elles se génèrent automatiquement.</p>
      </div>
    );
  }

  return (
    <div className="empire-card p-4">
      <h3 className="font-royal text-sm text-empire-text mb-3">⚔️ Quêtes du jour</h3>
      <div className="flex flex-col gap-2">
        {visibles.map(q => (
          <div key={q.id} className="flex items-center gap-3 group">
            <button
              onClick={() => completerQuete(q.id)}
              className="w-5 h-5 rounded-full border-2 border-empire-border group-hover:border-empire-gold flex items-center justify-center shrink-0 transition-colors"
            >
              <span className="opacity-0 group-hover:opacity-100 text-empire-gold text-xs transition-opacity">✓</span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-empire-text truncate">{q.title}</p>
              {q.domain && (
                <span className="text-[10px] text-empire-muted">{q.domain}</span>
              )}
            </div>
            <span className="font-mono text-xs text-empire-gold shrink-0">+{q.xp_reward}</span>
          </div>
        ))}
      </div>
      {quotidiennes.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-empire-sub hover:text-empire-text mt-2 transition-colors"
        >
          {expanded ? 'Voir moins' : `Voir plus (${quotidiennes.length - 3})`}
        </button>
      )}
    </div>
  );
}

// ─── Activité récente ───
function ActiviteRecente() {
  const { xp } = useGameStore();
  const history = xp?.history || [];
  const recent = history.slice(0, 8);

  return (
    <div className="empire-card p-4">
      <h3 className="font-royal text-sm text-empire-text mb-3">📋 Activité récente</h3>
      {recent.length === 0 ? (
        <p className="text-xs text-empire-muted">Aucune activité — commencez une quête !</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {recent.map((entry, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-empire-sub truncate flex-1">{entry.detail || entry.source}</span>
              <span className="font-mono text-empire-gold shrink-0 ml-2">+{entry.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Message de retour (TDAH bienveillant) ───
function MessageRetour() {
  const { profil } = useGameStore();
  const lastActive = profil?.profile?.last_active_date;
  if (!lastActive) return null;

  const today = new Date().toISOString().split('T')[0];
  const lastDate = new Date(lastActive);
  const diffDays = Math.floor((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays < 2) return null;

  const messages = {
    2: 'Bienvenue, Sire. Votre empire vous attend quand vous êtes prêt.',
    3: 'Les jardins du palais sont paisibles. Une simple promenade de 5 min suffirait à réveiller vos troupes.',
    5: 'Votre peuple comprend. Les plus grands souverains connaissent des hivers. Quand le printemps viendra, nous serons là.',
  };

  const msg = diffDays >= 14
    ? 'Un nouveau chapitre commence. Tout est possible.'
    : diffDays >= 5 ? messages[5]
    : diffDays >= 3 ? messages[3]
    : messages[2];

  return (
    <div className="empire-card p-4 border-l-2 border-l-empire-teal mb-4">
      <p className="text-sm text-empire-text italic">{msg}</p>
      <p className="text-[10px] text-empire-muted mt-1">— Votre Game Master</p>
    </div>
  );
}

// ─── Dashboard principal ───
export default function EmpireDashboard() {
  const { profil, xp, momentum, quetes, habitudes } = useGameStore();

  const streakDays = profil?.profile?.streak_days || 0;
  const momValue = momentum?.value ?? momentum?.momentum ?? 50;
  const todayXP = (xp?.history || [])
    .filter(h => h.logged_at?.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, h) => sum + h.amount, 0);
  const dailyQuests = (quetes || []).filter(q => q.type === 'daily');
  const completedToday = dailyQuests.filter(q => q.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Message de retour bienveillant */}
      <MessageRetour />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard emoji="⚡" label="XP aujourd'hui" value={todayXP} couleur="text-empire-gold" />
        <KPICard emoji="⚔️" label="Quêtes du jour" value={`${completedToday}/${dailyQuests.length || '?'}`} couleur="text-purple-400" />
        <KPICard emoji="🧘" label="Habitudes" value={habitudes?.length || 0} sous="actives" couleur="text-empire-teal" />
        <KPICard
          emoji="🔥"
          label="Série active"
          value={streakDays > 0 ? `${streakDays}j` : '—'}
          sous={streakDays >= 3 ? `×${streakDays >= 30 ? '2.0' : streakDays >= 14 ? '1.8' : streakDays >= 7 ? '1.5' : '1.25'}` : null}
          couleur="text-empire-momentum"
        />
      </div>

      {/* Daily Law + Quêtes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DailyLawWidget />
        <QuetesRapides />
      </div>

      {/* Activité récente */}
      <ActiviteRecente />
    </div>
  );
}
