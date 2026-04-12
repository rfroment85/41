// ═══════════════════════════════ FAB HIC ET NUNC ═════════════════════════════
// Bouton flottant d'action immédiate — cœur de la mécanique anti-procrastination
// "Fais-le ici et maintenant."
import React, { useState } from 'react';
import useGameStore from '../../stores/useGameStore';

export default function HicEtNuncFAB() {
  const [ouvert, setOuvert] = useState(false);
  const [description, setDescription] = useState('');
  const { actionHicEtNunc } = useGameStore();

  const handleAction = async (type) => {
    await actionHicEtNunc(type, description);
    setDescription('');
    setOuvert(false);
  };

  return (
    <>
      {/* FAB principal */}
      <button
        className="fab-hic-et-nunc"
        onClick={() => setOuvert(!ouvert)}
        title="Hic Et Nunc — Action immédiate"
      >
        ⚡
      </button>

      {/* Modal d'action rapide */}
      {ouvert && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[55]" onClick={() => setOuvert(false)} />
          <div className="fixed bottom-36 left-4 right-4 max-w-md mx-auto z-[60] empire-card p-5 animate-fade-up">
            <h3 className="font-royal text-lg text-empire-gold mb-1">⚡ Hic Et Nunc</h3>
            <p className="text-empire-sub text-xs mb-4">
              Une idée, une tâche ? Agis maintenant ou capture-la.
            </p>

            {/* Input description */}
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Qu'est-ce qui te vient à l'esprit ?"
              className="w-full bg-empire-bg border border-empire-border rounded-lg px-3 py-2 text-sm text-empire-text placeholder:text-empire-muted focus:border-empire-gold/50 mb-4"
              autoFocus
            />

            {/* 3 boutons d'action */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleAction('act_now')}
                className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-empire-momentum to-empire-gold text-empire-bg hover:opacity-90 transition-opacity"
              >
                ⚡ Agir MAINTENANT — +30 XP + Momentum
              </button>
              <button
                onClick={() => handleAction('capture')}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-empire-surface border border-empire-border text-empire-text hover:border-empire-border-light transition-colors"
              >
                📝 Capturer pour plus tard — +5 XP
              </button>
              <button
                onClick={() => handleAction('delay')}
                className="w-full py-2 rounded-xl text-xs text-empire-muted hover:text-empire-sub transition-colors"
              >
                ⏰ Plus tard (pas de pénalité)
              </button>
            </div>

            <p className="text-[10px] text-empire-muted text-center mt-3">
              Le momentum récompense l'action, jamais ne punit l'inaction.
            </p>
          </div>
        </>
      )}
    </>
  );
}
