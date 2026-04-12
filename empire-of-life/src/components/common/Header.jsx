// ═══════════════════════════════ HEADER ═══════════════════════════════════════
// Barre supérieure : Logo, niveau, XP, streak, vertu de la semaine
import React from 'react';
import useGameStore from '../../stores/useGameStore';

export default function Header() {
  const { profil, xp, vertu } = useGameStore();

  const level = xp?.level || 1;
  const title = xp?.title || 'Paysan';
  const xpTotal = xp?.total || 0;
  const xpInLevel = xp?.xpInLevel || 0;
  const xpNextLevel = xp?.xpNextLevel || 100;
  const progressPct = xpNextLevel > 0 ? Math.min(100, (xpInLevel / xpNextLevel) * 100) : 0;
  const streakDays = profil?.profile?.streak_days || 0;
  const ageName = profil?.age?.name || 'Âge Sombre';

  return (
    <header className="sticky top-0 z-30 bg-empire-surface/95 backdrop-blur-md border-b border-empire-border">
      <div className="max-w-5xl mx-auto px-4 py-2">
        {/* Ligne 1 : Logo + Niveau + Streak */}
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
              <span className="font-royal text-empire-bg font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="font-royal text-sm text-empire-text leading-tight">Empire of Life</h1>
              <p className="text-[10px] text-empire-muted">{ageName}</p>
            </div>
          </div>

          {/* Niveau et titre */}
          <div className="text-center">
            <div className="flex items-center gap-2">
              <span className="font-mono text-empire-gold font-bold text-sm">Niv. {level}</span>
              <span className="text-empire-sub text-xs">—</span>
              <span className="text-empire-text text-xs font-medium">{title}</span>
            </div>
          </div>

          {/* Streak + Vertu */}
          <div className="flex items-center gap-3">
            {streakDays > 0 && (
              <div className="flex items-center gap-1">
                <span className="animate-flamme inline-block">🔥</span>
                <span className="font-mono text-empire-momentum text-xs font-bold">{streakDays}j</span>
              </div>
            )}
            {vertu && (
              <div className="text-xs text-empire-sub" title={`Vertu: ${vertu.name}`}>
                {vertu.emoji}
              </div>
            )}
          </div>
        </div>

        {/* Ligne 2 : Barre XP */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 progress-bar h-1.5">
            <div
              className="progress-bar-fill gradient-gold"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-empire-muted whitespace-nowrap">
            {xpInLevel}/{xpNextLevel} XP
          </span>
        </div>
      </div>
    </header>
  );
}
