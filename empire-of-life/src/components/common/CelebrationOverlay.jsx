// ═══════════════════════════════ CÉLÉBRATION ═════════════════════════════════
// Overlay confetti CSS pur — level-up et badges
import React from 'react';
import useGameStore from '../../stores/useGameStore';

const CONFETTI_COLORS = ['#FFD700', '#3D82F6', '#1CC98A', '#8B5CF6', '#F07240', '#EF4444', '#06B6D4', '#FFED4A'];

export default function CelebrationOverlay() {
  const { celebrationActive } = useGameStore();

  if (!celebrationActive) return null;

  const { type, data } = celebrationActive;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={() => useGameStore.setState({ celebrationActive: null })}
    >
      {/* Fond sombre */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Confetti */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Contenu central */}
      <div className="relative text-center z-10 animate-fade-up">
        {type === 'levelUp' && (
          <>
            <div className="text-7xl mb-4">👑</div>
            <h2 className="font-royal text-4xl gradient-gold-text mb-2">
              NIVEAU {data?.level} !
            </h2>
            <p className="text-empire-gold text-xl font-medium">{data?.title}</p>
            <p className="text-empire-sub text-sm mt-4">Touchez pour continuer</p>
          </>
        )}
        {type === 'badge' && (
          <>
            <div className="text-7xl mb-4 animate-pulse-glow">{data?.emoji}</div>
            <h2 className="font-royal text-3xl text-purple-400 mb-2">
              Badge débloqué !
            </h2>
            <p className="text-empire-text text-lg">{data?.name}</p>
            <p className="text-empire-sub text-sm mt-4">Touchez pour continuer</p>
          </>
        )}
        {type === 'age' && (
          <>
            <div className="text-7xl mb-4">🏰</div>
            <h2 className="font-royal text-4xl gradient-gold-text mb-2">
              {data?.ageName}
            </h2>
            <p className="text-empire-gold text-lg">Votre empire entre dans un nouvel âge !</p>
            <p className="text-empire-sub text-sm mt-4">Touchez pour continuer</p>
          </>
        )}
      </div>
    </div>
  );
}
