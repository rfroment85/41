// ═══════════════════════════════ BARRE DE MOMENTUM ═══════════════════════════
// Jauge 0-100 — représente l'élan psychologique TDAH
import React from 'react';
import useGameStore from '../../stores/useGameStore';

export default function MomentumBar() {
  const { momentum } = useGameStore();
  const value = momentum?.value ?? momentum?.momentum ?? 50;

  // Couleur dynamique selon le niveau
  const getColor = (v) => {
    if (v >= 70) return { bar: 'from-emerald-500 to-emerald-300', text: 'text-emerald-400', label: 'Élan puissant' };
    if (v >= 30) return { bar: 'from-amber-500 to-amber-300', text: 'text-amber-400', label: 'Momentum stable' };
    return { bar: 'from-red-500 to-red-300', text: 'text-red-400', label: 'Besoin d\'élan' };
  };

  const style = getColor(value);

  return (
    <div className="bg-empire-surface border-b border-empire-border">
      <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center gap-3">
        <span className="text-[10px] text-empire-muted uppercase tracking-wider font-medium">Momentum</span>
        <div className="flex-1 h-1.5 bg-empire-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${style.bar} transition-all duration-700 ease-out ${value >= 70 ? 'animate-momentum' : ''}`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className={`font-mono text-xs font-bold ${style.text}`}>{value}%</span>
      </div>
    </div>
  );
}
