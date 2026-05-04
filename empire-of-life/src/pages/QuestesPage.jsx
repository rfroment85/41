// ═══════════════════════════════ PAGE QUÊTES ══════════════════════════════════
// Système de quêtes : quotidiennes, hebdo, mensuelles, personnalisées
import React, { useState } from 'react';
import useGameStore from '../stores/useGameStore';

const TABS = [
  { id: 'daily', label: 'Quotidiennes', emoji: '📅' },
  { id: 'weekly', label: 'Hebdo', emoji: '📆' },
  { id: 'monthly', label: 'Mensuelles', emoji: '🗓️' },
  { id: 'custom', label: 'Perso', emoji: '✨' },
];

function QueteCard({ quete, onComplete }) {
  // sub_tasks peut être un tableau (déjà parsé) ou une string JSON
  let sousTaches = [];
  try {
    sousTaches = Array.isArray(quete.sub_tasks) ? quete.sub_tasks
      : (quete.sub_tasks ? JSON.parse(quete.sub_tasks) : []);
  } catch { sousTaches = []; }
  const completees = sousTaches.filter(s => s.done || s.completed).length;
  const progressPct = sousTaches.length > 0 ? (completees / sousTaches.length) * 100 : 0;

  const domainColors = {
    sante: 'border-l-green-500',
    carriere: 'border-l-blue-500',
    croissance: 'border-l-purple-500',
    relations: 'border-l-red-400',
    general: 'border-l-empire-gold',
  };

  return (
    <div className={`empire-card p-4 border-l-2 ${domainColors[quete.domain] || 'border-l-empire-border'} animate-fade-up`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-empire-text">{quete.title}</h4>
          {quete.description && (
            <p className="text-xs text-empire-sub mt-0.5">{quete.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="font-mono text-xs text-empire-gold">+{quete.xp_reward}</span>
          {quete.difficulty && (
            <span className="text-[10px] text-empire-muted">⚔️{quete.difficulty}</span>
          )}
        </div>
      </div>

      {/* Sous-tâches */}
      {sousTaches.length > 0 && (
        <div className="mb-3">
          <div className="progress-bar h-1 mb-2">
            <div className="progress-bar-fill bg-empire-green" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex flex-col gap-1">
            {sousTaches.map((st, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={(st.done || st.completed) ? 'text-empire-green' : 'text-empire-muted'}>
                  {(st.done || st.completed) ? '✓' : '○'}
                </span>
                <span className={(st.done || st.completed) ? 'text-empire-sub line-through' : 'text-empire-text'}>
                  {st.text || st.title || (typeof st === 'string' ? st : '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton compléter */}
      <button
        onClick={() => onComplete(quete.id)}
        className="w-full py-2 rounded-lg text-xs font-medium bg-empire-surface border border-empire-border hover:border-empire-gold hover:text-empire-gold transition-all"
      >
        ✓ Terminer cette quête
      </button>
    </div>
  );
}

function NouvelleQueteForm({ onClose }) {
  const { creerQuete: creerQueteStore } = useGameStore();
  const [titre, setTitre] = useState('');
  const [domaine, setDomaine] = useState('general');
  const [xp, setXp] = useState(50);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titre.trim()) return;
    await creerQueteStore({ title: titre, domain: domaine, xp_reward: xp, type: 'custom' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative empire-card p-6 w-full max-w-md animate-fade-up">
        <h3 className="font-royal text-lg text-empire-gold mb-4">✨ Nouvelle quête</h3>

        <input
          type="text" value={titre} onChange={e => setTitre(e.target.value)}
          placeholder="Titre de la quête..."
          className="w-full bg-empire-bg border border-empire-border rounded-lg px-3 py-2 text-sm text-empire-text mb-3"
          autoFocus
        />

        <select
          value={domaine} onChange={e => setDomaine(e.target.value)}
          className="w-full bg-empire-bg border border-empire-border rounded-lg px-3 py-2 text-sm text-empire-text mb-3"
        >
          <option value="general">Général</option>
          <option value="sante">Santé</option>
          <option value="carriere">Carrière</option>
          <option value="croissance">Croissance</option>
          <option value="relations">Relations</option>
        </select>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs text-empire-sub">XP :</label>
          <input
            type="number" value={xp} onChange={e => setXp(Number(e.target.value))}
            min={10} max={500} step={10}
            className="w-20 bg-empire-bg border border-empire-border rounded-lg px-2 py-1 text-sm text-empire-text font-mono"
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 btn-ghost">Annuler</button>
          <button type="submit" className="flex-1 btn-gold">Créer</button>
        </div>
      </form>
    </div>
  );
}

export default function QuestesPage() {
  const [tabActif, setTabActif] = useState('daily');
  const [creerOuvert, setCreerOuvert] = useState(false);
  const { quetes, completerQuete } = useGameStore();

  const filtrees = (quetes || []).filter(q => {
    if (tabActif === 'custom') return q.type === 'custom' && q.status === 'active';
    return q.type === tabActif && q.status === 'active';
  });

  return (
    <div className="space-y-4">
      <h2 className="font-royal text-xl text-empire-text">⚔️ Quêtes</h2>

      {/* Onglets */}
      <div className="flex gap-1 bg-empire-surface p-1 rounded-xl border border-empire-border overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActif(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              tabActif === tab.id
                ? 'bg-empire-border-light text-empire-text'
                : 'text-empire-sub hover:text-empire-text'
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Liste des quêtes */}
      <div className="space-y-3">
        {filtrees.length === 0 ? (
          <div className="empire-card p-8 text-center">
            <p className="text-empire-muted text-sm">
              {tabActif === 'custom'
                ? 'Pas encore de quêtes personnalisées. Créez-en une !'
                : 'Les quêtes se génèrent automatiquement. Revenez bientôt.'}
            </p>
          </div>
        ) : (
          filtrees.map(q => (
            <QueteCard key={q.id} quete={q} onComplete={completerQuete} />
          ))
        )}
      </div>

      {/* Bouton créer */}
      <button
        onClick={() => setCreerOuvert(true)}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full btn-gold flex items-center justify-center text-xl z-30"
      >
        +
      </button>

      {creerOuvert && <NouvelleQueteForm onClose={() => setCreerOuvert(false)} />}
    </div>
  );
}
