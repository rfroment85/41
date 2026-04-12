// ═══════════════════════════════ PAGE STATS ═══════════════════════════════════
// Statistiques et progression — graphiques Recharts
import React from 'react';
import useGameStore from '../stores/useGameStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';

// ─── Tooltip custom dark theme ───
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-xs">
      <p className="text-empire-sub mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono font-bold">
          {p.value} {p.name}
        </p>
      ))}
    </div>
  );
}

// ─── Vue stats globale ───
export default function StatsPage() {
  const { xp, profil, momentum, habitudes } = useGameStore();

  const level = xp?.level || 1;
  const title = xp?.title || 'Paysan';
  const xpTotal = xp?.total || 0;
  const streakDays = profil?.profile?.streak_days || 0;
  const bestStreak = profil?.profile?.best_streak || 0;
  const momValue = momentum?.value ?? momentum?.momentum ?? 50;

  // Simuler les données XP des 7 derniers jours à partir de l'historique
  const xpHistory = xp?.history || [];
  const today = new Date();
  const derniers7Jours = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const jourXP = xpHistory
      .filter(h => h.logged_at?.startsWith(dateStr))
      .reduce((sum, h) => sum + h.amount, 0);
    return {
      jour: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
      xp: jourXP,
    };
  });

  // Habitudes stats
  const habitudesTotal = habitudes?.length || 0;
  const habitudesLogged = (habitudes || []).filter(h => h.logged_today).length;

  return (
    <div className="space-y-4">
      <h2 className="font-royal text-xl text-empire-text">📊 Statistiques</h2>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3">
        <div className="empire-card p-4 text-center">
          <p className="font-mono text-2xl text-empire-gold font-bold">{xpTotal}</p>
          <p className="text-xs text-empire-sub">XP Total</p>
        </div>
        <div className="empire-card p-4 text-center">
          <p className="font-mono text-2xl text-empire-text font-bold">{level}</p>
          <p className="text-xs text-empire-sub">{title}</p>
        </div>
        <div className="empire-card p-4 text-center">
          <p className="font-mono text-2xl text-empire-momentum font-bold">{streakDays}</p>
          <p className="text-xs text-empire-sub">Jours de série</p>
          <p className="text-[10px] text-empire-muted">Record : {bestStreak}</p>
        </div>
        <div className="empire-card p-4 text-center">
          <p className="font-mono text-2xl font-bold" style={{ color: momValue >= 70 ? '#1CC98A' : momValue >= 30 ? '#FFD700' : '#EF4444' }}>
            {momValue}%
          </p>
          <p className="text-xs text-empire-sub">Momentum</p>
        </div>
      </div>

      {/* Graphique XP 7 jours */}
      <div className="empire-card p-4">
        <h3 className="text-sm font-medium text-empire-sub mb-3">XP des 7 derniers jours</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={derniers7Jours} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fill: '#607D9B', fontSize: 11 }} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="xp" name="XP" fill="#FFD700" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Habitudes */}
      <div className="empire-card p-4">
        <h3 className="text-sm font-medium text-empire-sub mb-3">Habitudes aujourd'hui</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#1E2538" strokeWidth="5" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke="#1CC98A"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - (habitudesTotal > 0 ? habitudesLogged / habitudesTotal : 0))}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs text-empire-text font-bold">
                {habitudesLogged}/{habitudesTotal}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-empire-text">
              {habitudesLogged === habitudesTotal && habitudesTotal > 0
                ? 'Toutes complétées ! 🎉'
                : `${habitudesTotal - habitudesLogged} restante${habitudesTotal - habitudesLogged > 1 ? 's' : ''}`}
            </p>
            <p className="text-xs text-empire-muted">
              {habitudesTotal === 0 ? 'Ajoutez des habitudes dans Track' : 'Continuez comme ça, Sire.'}
            </p>
          </div>
        </div>
      </div>

      {/* Âge actuel */}
      <div className="empire-card p-4">
        <h3 className="text-sm font-medium text-empire-sub mb-2">Progression de l'Empire</h3>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{profil?.age?.emoji || '🏚️'}</span>
          <div>
            <p className="text-sm text-empire-text font-medium">{profil?.age?.name || 'Âge Sombre'}</p>
            <p className="text-xs text-empire-muted">{profil?.age?.description || 'Les fondations de votre empire.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
