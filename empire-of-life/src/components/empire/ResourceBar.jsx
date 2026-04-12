// ═══════════════════════════════ BARRE DE RESSOURCES ═════════════════════════
// Ressources AoE2 — Nourriture, Bois, Or, Pierre (+ débloquées par âge)
import React from 'react';
import useGameStore from '../../stores/useGameStore';

const RESOURCE_META = {
  nourriture: { emoji: '🌾', couleur: 'text-green-400' },
  bois:       { emoji: '🪵', couleur: 'text-purple-400' },
  or:         { emoji: '💰', couleur: 'text-yellow-400' },
  pierre:     { emoji: '🪨', couleur: 'text-slate-400' },
  foi:        { emoji: '✨', couleur: 'text-pink-400' },
  relations:  { emoji: '👥', couleur: 'text-blue-400' },
  influence:  { emoji: '👑', couleur: 'text-amber-400' },
  heritage:   { emoji: '🏛️', couleur: 'text-slate-300' },
};

export default function ResourceBar() {
  const { ressources } = useGameStore();

  if (!ressources || ressources.length === 0) return null;

  return (
    <div className="bg-empire-bg border-b border-empire-border overflow-x-auto">
      <div className="max-w-5xl mx-auto px-4 py-1 flex items-center gap-4">
        {ressources.map(r => {
          const meta = RESOURCE_META[r.type] || { emoji: '📦', couleur: 'text-empire-sub' };
          return (
            <div key={r.type} className="flex items-center gap-1 shrink-0">
              <span className="text-sm">{meta.emoji}</span>
              <span className={`font-mono text-xs font-bold ${meta.couleur}`}>
                {Math.floor(r.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
