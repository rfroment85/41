// ═══════════════════════════════ STORE ZUSTAND ═══════════════════════════════
// État global du jeu — Empire of Life
import { create } from 'zustand';
import { api } from '../utils/api';

// Helpers pour extraire les données quelle que soit la forme de la réponse API
const extractArray = (res, ...keys) => {
  if (Array.isArray(res)) return res;
  for (const k of keys) {
    if (res?.[k] && Array.isArray(res[k])) return res[k];
  }
  return [];
};

const useGameStore = create((set, get) => ({
  // ─── État ───
  profil: null,
  habitudes: [],
  quetes: [],
  momentum: 50,
  xp: { total: 0, level: 1, title: 'Paysan', xpInLevel: 0, xpNextLevel: 100, history: [] },
  ressources: [],
  dailyLaw: null,
  vertu: null,
  rituels: { matin: null, soir: null },
  notifications: [],
  celebrationActive: null,
  vueActive: 'empire',
  chargement: true,
  erreur: null,

  // ─── Navigation ───
  setVue: (vue) => set({ vueActive: vue }),

  // ─── Chargement initial ───
  chargerTout: async () => {
    set({ chargement: true, erreur: null });
    try {
      const results = await Promise.allSettled([
        api.getStatus(),
        api.getHabitudes(),
        api.getQuetes(),
        api.getMomentum(),
        api.getXP(),
        api.getRessources(),
        api.getDailyLaw(),
        api.getVertu(),
        api.getRituelsAujourdhui(),
      ]);

      const [profilRes, habRes, quetesRes, momRes, xpRes, resRes, lawRes, vertuRes, ritRes] = results;

      // Extraire les données robustement (l'API peut retourner des formats variés)
      const profil = profilRes.status === 'fulfilled' ? profilRes.value : null;
      const habitudes = habRes.status === 'fulfilled' ? extractArray(habRes.value, 'habits') : [];
      const quetes = quetesRes.status === 'fulfilled' ? extractArray(quetesRes.value, 'quests') : [];
      const ressources = resRes.status === 'fulfilled' ? extractArray(resRes.value, 'ressources', 'resources') : [];

      // Momentum : peut être un objet {value, momentum, history} ou un nombre
      let momentum = 50;
      if (momRes.status === 'fulfilled') {
        const m = momRes.value;
        momentum = m?.value ?? m?.momentum ?? (typeof m === 'number' ? m : 50);
      }

      // XP : extraire les champs pertinents
      let xp = { total: 0, level: 1, title: 'Paysan', xpInLevel: 0, xpNextLevel: 100, history: [] };
      if (xpRes.status === 'fulfilled') {
        const x = xpRes.value;
        xp = {
          total: x?.total ?? x?.xp_total ?? 0,
          level: x?.level ?? 1,
          title: x?.title ?? 'Paysan',
          xpInLevel: x?.xpInLevel ?? x?.xp_in_level ?? 0,
          xpNextLevel: x?.xpNextLevel ?? x?.xp_next_level ?? 100,
          history: x?.history ?? x?.recent ?? [],
        };
      }

      set({
        profil,
        habitudes,
        quetes,
        momentum,
        xp,
        ressources,
        dailyLaw: lawRes.status === 'fulfilled' ? (lawRes.value?.dailyLaw ?? lawRes.value) : null,
        vertu: vertuRes.status === 'fulfilled' ? (vertuRes.value?.vertu ?? vertuRes.value) : null,
        rituels: ritRes.status === 'fulfilled' ? ritRes.value : { matin: null, soir: null },
        chargement: false,
      });
    } catch (err) {
      set({ erreur: err.message, chargement: false });
    }
  },

  // ─── Habitudes ───
  loggerHabitude: async (habitId) => {
    try {
      const result = await api.logHabitude(habitId);
      const xpAwarded = result?.xp_awarded ?? result?.xp?.xp_awarded ?? 0;
      if (xpAwarded > 0) {
        get().ajouterNotification(`+${xpAwarded} XP`, 'xp');
      }
      await get().rafraichirDonnees();
      return result;
    } catch (err) {
      get().ajouterNotification(err.message, 'erreur');
    }
  },

  creerHabitude: async (data) => {
    try {
      await api.creerHabitude(data);
      get().ajouterNotification('Habitude créée !', 'info');
      await get().rafraichirDonnees();
    } catch (err) {
      get().ajouterNotification(err.message, 'erreur');
    }
  },

  // ─── Quêtes ───
  genererQuetes: async () => {
    try {
      await api.genererQuetes();
      const quetesRes = await api.getQuetes();
      set({ quetes: extractArray(quetesRes, 'quests') });
    } catch (err) {
      console.error('Erreur génération quêtes:', err);
    }
  },

  creerQuete: async (data) => {
    try {
      await api.creerQuete(data);
      get().ajouterNotification('Quête créée !', 'info');
      // Recharger les quêtes
      const quetesRes = await api.getQuetes();
      set({ quetes: extractArray(quetesRes, 'quests') });
    } catch (err) {
      get().ajouterNotification(err.message, 'erreur');
    }
  },

  completerQuete: async (questId) => {
    try {
      const result = await api.completerQuete(questId);
      const xpAwarded = result?.xp?.xp_awarded ?? result?.xp_awarded ?? 0;
      if (xpAwarded > 0) {
        get().ajouterNotification(`+${xpAwarded} XP — Quête accomplie !`, 'xp');
      }
      // Recharger les quêtes + données
      const quetesRes = await api.getQuetes();
      set({ quetes: extractArray(quetesRes, 'quests') });
      await get().rafraichirDonnees();
      return result;
    } catch (err) {
      get().ajouterNotification(err.message, 'erreur');
    }
  },

  // ─── Hic Et Nunc ───
  actionHicEtNunc: async (actionType, description) => {
    try {
      // L'API attend 'type' pas 'actionType'
      const result = await api.hicEtNunc({ type: actionType, description });
      const msg = result?.message;
      const xpEarned = result?.xp?.xp_awarded ?? result?.xpEarned ?? 0;
      if (xpEarned > 0) {
        get().ajouterNotification(msg || `+${xpEarned} XP`, 'xp');
      } else if (msg) {
        get().ajouterNotification(msg, 'info');
      }
      await get().rafraichirDonnees();
      return result;
    } catch (err) {
      get().ajouterNotification(err.message, 'erreur');
    }
  },

  // ─── Rituels ───
  logRituelMatin: async (data) => {
    try {
      const result = await api.logRituelMatin(data);
      get().ajouterNotification('📜 Conseil de guerre du matin complété !', 'info');
      await get().rafraichirDonnees();
      return result;
    } catch (err) {
      get().ajouterNotification(err.message, 'erreur');
    }
  },

  logRituelSoir: async (data) => {
    try {
      const result = await api.logRituelSoir(data);
      get().ajouterNotification('📜 Chroniques du soir enregistrées !', 'info');
      await get().rafraichirDonnees();
      return result;
    } catch (err) {
      get().ajouterNotification(err.message, 'erreur');
    }
  },

  // ─── Daily Law ───
  completerDailyLaw: async () => {
    try {
      const result = await api.completeDailyLaw();
      get().ajouterNotification(`📜 Mini-défi complété ! +${result?.bonusXP || 25} XP`, 'xp');
      const lawRes = await api.getDailyLaw();
      set({ dailyLaw: lawRes?.dailyLaw ?? lawRes });
      await get().rafraichirDonnees();
    } catch (err) {
      get().ajouterNotification(err.message, 'erreur');
    }
  },

  // ─── Notifications (toasts TDAH-friendly) ───
  ajouterNotification: (texte, type = 'info') => {
    const id = Date.now() + Math.random();
    set(state => ({
      notifications: [...state.notifications, { id, texte, type, timestamp: Date.now() }],
    }));
    setTimeout(() => {
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id),
      }));
    }, 3000);
  },

  // ─── Célébration (level-up, badge) ───
  lancerCelebration: (type, data) => {
    set({ celebrationActive: { type, data } });
    setTimeout(() => set({ celebrationActive: null }), 4000);
  },

  // ─── Rafraîchissement partiel ───
  rafraichirDonnees: async () => {
    try {
      const [profilRes, momRes, xpRes, resRes, habRes] = await Promise.allSettled([
        api.getStatus(),
        api.getMomentum(),
        api.getXP(),
        api.getRessources(),
        api.getHabitudes(),
      ]);

      const updates = {};
      if (profilRes.status === 'fulfilled') updates.profil = profilRes.value;

      if (momRes.status === 'fulfilled') {
        const m = momRes.value;
        updates.momentum = m?.value ?? m?.momentum ?? (typeof m === 'number' ? m : 50);
      }

      if (xpRes.status === 'fulfilled') {
        const x = xpRes.value;
        const oldLevel = get().xp?.level;
        updates.xp = {
          total: x?.total ?? x?.xp_total ?? 0,
          level: x?.level ?? 1,
          title: x?.title ?? 'Paysan',
          xpInLevel: x?.xpInLevel ?? x?.xp_in_level ?? 0,
          xpNextLevel: x?.xpNextLevel ?? x?.xp_next_level ?? 100,
          history: x?.history ?? x?.recent ?? [],
        };
        if (updates.xp.level > (oldLevel || 1)) {
          get().lancerCelebration('levelUp', { level: updates.xp.level, title: updates.xp.title });
        }
      }

      if (resRes.status === 'fulfilled') {
        updates.ressources = extractArray(resRes.value, 'ressources', 'resources');
      }
      if (habRes.status === 'fulfilled') {
        updates.habitudes = extractArray(habRes.value, 'habits');
      }

      set(updates);
    } catch (err) {
      console.error('Erreur rafraîchissement:', err);
    }
  },
}));

export default useGameStore;
