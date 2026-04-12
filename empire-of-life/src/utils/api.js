// ═══════════════════════════════ CLIENT API ═══════════════════════════════════
// Fonctions d'appel à l'API backend Empire of Life

const BASE = '/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

// ─── Profil ───
export const api = {
  // Profil
  getProfil: () => fetchJSON('/profile'),
  getStatus: () => fetchJSON('/profile/status'),
  updateProfil: (champs) => fetchJSON('/profile', { method: 'PUT', body: JSON.stringify(champs) }),

  // Habitudes
  getHabitudes: () => fetchJSON('/habits'),
  creerHabitude: (data) => fetchJSON('/habits', { method: 'POST', body: JSON.stringify(data) }),
  logHabitude: (id) => fetchJSON(`/habits/${id}/log`, { method: 'POST', body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }) }),
  supprimerHabitude: (id) => fetchJSON(`/habits/${id}`, { method: 'DELETE' }),

  // Momentum
  getMomentum: () => fetchJSON('/momentum'),
  logMomentumAction: (data) => fetchJSON('/momentum/action', { method: 'POST', body: JSON.stringify(data) }),

  // Quêtes
  getQuetes: () => fetchJSON('/quests'),
  genererQuetes: () => fetchJSON('/quests/generate', { method: 'POST' }),
  completerQuete: (id) => fetchJSON(`/quests/${id}/complete`, { method: 'POST' }),
  toggleSousTache: (questId, index) => fetchJSON(`/quests/${questId}/subtask/${index}`, { method: 'POST' }),
  creerQuete: (data) => fetchJSON('/quests', { method: 'POST', body: JSON.stringify(data) }),

  // XP
  getXP: () => fetchJSON('/xp'),
  getXPStats: () => fetchJSON('/xp/stats'),

  // Ressources
  getRessources: () => fetchJSON('/resources'),
  produireRessource: (data) => fetchJSON('/resources/produce', { method: 'POST', body: JSON.stringify(data) }),

  // Rituels stoïques
  getRituelsAujourdhui: () => fetchJSON('/rituals/today'),
  logRituelMatin: (data) => fetchJSON('/rituals/morning', { method: 'POST', body: JSON.stringify(data) }),
  logRituelSoir: (data) => fetchJSON('/rituals/evening', { method: 'POST', body: JSON.stringify(data) }),

  // Philosophie
  getDailyLaw: () => fetchJSON('/philosophy/daily-law'),
  completeDailyLaw: () => fetchJSON('/philosophy/daily-law/complete', { method: 'POST' }),
  getVertu: () => fetchJSON('/philosophy/virtue'),
  logVertu: (data) => fetchJSON('/philosophy/virtue/log', { method: 'POST', body: JSON.stringify(data) }),
  getTechTree: () => fetchJSON('/philosophy/tech-tree'),
  researchLaw: (lawNumber) => fetchJSON(`/philosophy/tech-tree/${lawNumber}/research`, { method: 'POST' }),

  // Hic Et Nunc
  hicEtNunc: (data) => fetchJSON('/hic-et-nunc', { method: 'POST', body: JSON.stringify(data) }),
  getHicEtNuncStats: () => fetchJSON('/hic-et-nunc/stats'),
  getHicEtNuncPending: () => fetchJSON('/hic-et-nunc/pending'),

  // Game Master
  getBriefing: (data) => fetchJSON('/game-master/briefing', { method: 'POST', body: JSON.stringify(data) }),
  getDebrief: (data) => fetchJSON('/game-master/debrief', { method: 'POST', body: JSON.stringify(data) }),
  narrateEvent: (data) => fetchJSON('/game-master/narrate', { method: 'POST', body: JSON.stringify(data) }),
  chatGameMaster: (data) => fetchJSON('/game-master/chat', { method: 'POST', body: JSON.stringify(data) }),

  // Santé
  health: () => fetchJSON('/health'),
};
