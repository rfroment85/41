// ═══════════════════════════════ PAGE PROFIL ══════════════════════════════════
// Profil, paramètres, données, vertu de la semaine
import React, { useState } from 'react';
import useGameStore from '../stores/useGameStore';

const AVATARS = ['🧠', '💡', '🎯', '🔥', '⚡', '🚀', '💪', '🎮', '🏆', '👑', '🌟', '💎', '🦁', '🐉', '⚔️', '🛡️'];

export default function ProfilPage() {
  const { profil, vertu, xp, momentum } = useGameStore();
  const [editNom, setEditNom] = useState(false);
  const [nom, setNom] = useState(profil?.profile?.name || 'Romain');

  const profile = profil?.profile || {};
  const level = xp?.level || 1;
  const title = xp?.title || 'Paysan';

  return (
    <div className="space-y-4">
      <h2 className="font-royal text-xl text-empire-text">👤 Profil</h2>

      {/* Carte profil */}
      <div className="empire-card p-6 text-center">
        <div className="text-5xl mb-3">{profile.avatar || '🧠'}</div>
        <h3 className="font-royal text-xl text-empire-text mb-1">
          Sire {profile.name || 'Romain'}
        </h3>
        <p className="text-sm text-empire-gold font-medium">
          Niveau {level} — {title}
        </p>
        <p className="text-xs text-empire-muted mt-1">
          {profil?.age?.name || 'Âge Sombre'} · {profil?.age?.emoji || '🏚️'}
        </p>

        {/* Avatars */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {AVATARS.map(a => (
            <button
              key={a}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                profile.avatar === a
                  ? 'bg-empire-gold/20 border border-empire-gold/40'
                  : 'bg-empire-surface border border-empire-border hover:border-empire-border-light'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Vertu de la semaine */}
      {vertu && (
        <div className="empire-card p-4 border-l-2 border-l-empire-purple">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{vertu.emoji}</span>
            <h3 className="font-royal text-sm text-purple-400">Vertu de la semaine</h3>
          </div>
          <p className="text-sm text-empire-text font-medium">{vertu.name}</p>
          <p className="text-xs text-empire-sub mt-1">{vertu.description}</p>
          {vertu.stoicQuote && (
            <p className="text-xs text-empire-muted italic mt-2">"{vertu.stoicQuote}"</p>
          )}
          {vertu.dailyChallenge && (
            <div className="bg-empire-bg rounded-lg p-3 mt-3">
              <p className="text-xs text-empire-sub">
                <strong className="text-purple-400">Défi :</strong> {vertu.dailyChallenge}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Résumé rapide */}
      <div className="empire-card p-4">
        <h3 className="text-sm font-medium text-empire-sub mb-3">Résumé de l'empire</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-empire-sub">XP Total</span>
            <span className="font-mono text-empire-gold">{xp?.total || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-empire-sub">Série active</span>
            <span className="font-mono text-empire-momentum">{profile.streak_days || 0} jours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-empire-sub">Meilleure série</span>
            <span className="font-mono text-empire-text">{profile.best_streak || 0} jours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-empire-sub">Momentum</span>
            <span className="font-mono text-empire-text">{momentum?.value ?? momentum?.momentum ?? 50}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-empire-sub">Membre depuis</span>
            <span className="font-mono text-empire-muted">{profile.created_at?.split('T')[0] || '—'}</span>
          </div>
        </div>
      </div>

      {/* Life's Task */}
      <div className="empire-card p-4">
        <h3 className="font-royal text-sm text-empire-gold mb-2">🌟 Life's Task</h3>
        <p className="text-sm text-empire-text italic">
          "{profile.lifes_task || 'Devenir la meilleure version de moi-même'}"
        </p>
        <p className="text-[10px] text-empire-muted mt-2">
          Vous pouvez redéfinir votre Life's Task à tout moment. C'est votre boussole.
        </p>
      </div>

      {/* Philosophie */}
      <div className="empire-card p-4">
        <h3 className="text-sm font-medium text-empire-sub mb-2">📚 Philosophie active</h3>
        <div className="flex flex-wrap gap-2">
          <span className="domain-tag bg-empire-gold/10 text-empire-gold">Hic Et Nunc</span>
          <span className="domain-tag bg-purple-500/10 text-purple-400">Stoïcisme</span>
          <span className="domain-tag bg-empire-blue/10 text-empire-blue">Robert Greene</span>
          <span className="domain-tag bg-empire-green/10 text-empire-green">Atomic Habits</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-empire-muted">Empire of Life v1.0</p>
        <p className="text-[10px] text-empire-muted mt-1">
          TDAH-friendly · Zéro culpabilité · Hic Et Nunc
        </p>
      </div>
    </div>
  );
}
