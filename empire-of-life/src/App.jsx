// ═══════════════════════════════ EMPIRE OF LIFE — APP ═════════════════════════
// Application principale — PWA de gestion de vie gamifiée AoE2
import React, { useEffect } from 'react';
import useGameStore from './stores/useGameStore';
import Header from './components/common/Header';
import MomentumBar from './components/momentum/MomentumBar';
import ResourceBar from './components/empire/ResourceBar';
import NotificationToast from './components/common/NotificationToast';
import CelebrationOverlay from './components/common/CelebrationOverlay';
import HicEtNuncFAB from './components/hicEtNunc/HicEtNuncFAB';
import EmpireDashboard from './pages/EmpireDashboard';
import QuestesPage from './pages/QuestesPage';
import TrackPage from './pages/TrackPage';
import StatsPage from './pages/StatsPage';
import ProfilPage from './pages/ProfilPage';

// ─── Icônes de navigation ───
const NAV_ITEMS = [
  { id: 'empire', label: 'Empire', emoji: '🏰' },
  { id: 'quetes', label: 'Quêtes', emoji: '⚔️' },
  { id: 'track',  label: 'Track',  emoji: '⚡' },
  { id: 'stats',  label: 'Stats',  emoji: '📊' },
  { id: 'profil', label: 'Profil', emoji: '👤' },
];

export default function App() {
  const { vueActive, setVue, chargerTout, chargement, erreur, genererQuetes } = useGameStore();

  // Chargement initial
  useEffect(() => {
    chargerTout().then(() => {
      genererQuetes(); // Générer les quêtes du jour si nécessaire
    });
  }, []);

  // ─── Écran de chargement ───
  if (chargement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="text-6xl animate-pulse">🏰</div>
        <h1 className="font-royal text-3xl gradient-gold-text">Empire of Life</h1>
        <p className="text-empire-sub text-sm">Chargement de votre empire...</p>
        <div className="w-48 h-1 bg-empire-border rounded-full overflow-hidden">
          <div className="h-full gradient-gold rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  // ─── Écran d'erreur ───
  if (erreur) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-4xl">⚠️</div>
        <h2 className="font-royal text-xl text-empire-gold">Problème de connexion</h2>
        <p className="text-empire-sub text-sm text-center max-w-md">
          Le serveur ne répond pas. Assurez-vous que le backend tourne avec <code className="font-mono text-empire-gold">npm run dev</code>
        </p>
        <p className="text-empire-muted text-xs">{erreur}</p>
        <button onClick={chargerTout} className="btn-gold mt-4">Réessayer</button>
      </div>
    );
  }

  // ─── Rendu de la vue active ───
  const renderVue = () => {
    switch (vueActive) {
      case 'empire': return <EmpireDashboard />;
      case 'quetes': return <QuestesPage />;
      case 'track':  return <TrackPage />;
      case 'stats':  return <StatsPage />;
      case 'profil': return <ProfilPage />;
      default: return <EmpireDashboard />;
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header avec XP et niveau */}
      <Header />

      {/* Barres de ressources et momentum */}
      <ResourceBar />
      <MomentumBar />

      {/* Contenu principal */}
      <main className="max-w-5xl mx-auto px-4 pt-4 animate-fade-up">
        {renderVue()}
      </main>

      {/* FAB Hic Et Nunc — toujours visible */}
      <HicEtNuncFAB />

      {/* Navigation mobile (tabs en bas) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-empire-surface/95 backdrop-blur-md border-t border-empire-border">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setVue(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all ${
                vueActive === item.id
                  ? 'text-empire-gold'
                  : 'text-empire-muted hover:text-empire-sub'
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Overlays */}
      <NotificationToast />
      <CelebrationOverlay />
    </div>
  );
}
