// ═══════════════════════════════ STORE ZUSTAND ═══════════════════════════════
// État global du jeu — Empire of Life
import { create } from 'zustand';
import { api } from '../utils/api';

const useGameStore = create((set, get) => ({
  // ─── État ───
  profil: null,
  habitudes: [],
  quetes: [],
  momentum: { value: 50, history: [] },
  xp: { total: 0, level: 1, title: 'Paysan', history: [] },
  ressources: [],
  dailyLaw: null,
  vertu: null,
  rituels: { matin: null, soir: null },
  notifications: [],
  celebrationActive: null,
  vueActive: 'empire', // 'empire' | 'quetes' | 'track' | 'stats' | 'profil'
  chargement: true,
  erreur: null,

  // ─── Navigation ───
  setVue: (vue) => set({ vueActive: vue }),

  // ─── Chargement initial ───
  chargerTout: async () => {
    set({ chargement: true, erreur: null });
    try {
      const [profilRes, habRes, quetesRes, momRes, xpRes, resRes, lawRes, vertuRes, ritRes] = await Promise.allSettled([
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

      set({
        profil: profilRes.status === 'fulfilled' ? profilRes.value : null,
        habitudes: habRes.status === 'fulfilled' ? (habRes.value.habits || []) : [],
        quetes: quetesRes.status === 'fulfilled' ? (quetesRes.value.quests || []) : [],
        momentum: momRes.status === 'fulfilled' ? momRes.value : { value: 50, history: [] },
        xp: xpRes.status === 'fulfilled' ? xpRes.value : { total: 0, level: 1, title: 'Paysan', history: [] },
        ressources: resRes.status === 'fulfilled' ? (resRes.value.ressources || []) : [],
        dailyLaw: lawRes.status === 'fulfilled' ? lawRes.value.dailyLaw : null,
        vertu: vertuRes.status === 'fulfilled' ? vertuRes.value.vertu : null,
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
      // Notification XP
      if (result.xp_awarded) {
        get().ajouterNotification(`+${result.xp_awarded} XP`, 'xp');
      }
      // Recharger les données impactées
      await get().rafraichirDonnees();
      return result;
    } catch (err) {
      get().ajouterNotification(err.message, 'erreur');
    }
  },

  creerHabitude: async (data) => {
    try {
      await api.creerHabitude(data);
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
      set({ quetes: quetesRes.quests || [] });
    } catch (err) {
      console.error('Erreur génération quêtes:', err);
    }
  },

  completerQuete: async (questId) => {
    try {
      const result = await api.completerQuete(questId);
      if (result.xp_awarded) {
        get().ajouterNotification(`+${result.xp_awarded} XP — Quête accomplie !`, 'xp');
      }
      await get().rafraichirDonnees();
      return result;
    } catch (err) {
      get().ajouterNotification(err.message, 'erreur');
    }
  },

  // ─── Hic Et Nunc ───
  actionHicEtNunc: async (actionType, description) => {
    try {
      const result = await api.hicEtNunc({ actionType, description });
      if (result.xpEarned > 0) {
        get().ajouterNotification(`⚡ ${result.message}`, 'xp');
      } else if (result.message) {
        get().ajouterNotification(result.message, 'info');
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
      get().ajouterNotification(`📜 Mini-défi complété ! +${result.bonusXP} XP`, 'xp');
      const lawRes = await api.getDailyLaw();
      set({ dailyLaw: lawRes.dailyLaw });
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
    // Auto-supprimer après 3 secondes
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
      if (momRes.status === 'fulfilled') updates.momentum = momRes.value;
      if (xpRes.status === 'fulfilled') {
        const oldLevel = get().xp?.level;
        updates.xp = xpRes.value;
        // Détecter level-up
        if (xpRes.value.level > (oldLevel || 1)) {
          get().lancerCelebration('levelUp', { level: xpRes.value.level, title: xpRes.value.title });
        }
      }
      if (resRes.status === 'fulfilled') updates.ressources = resRes.value.ressources || [];
      if (habRes.status === 'fulfilled') updates.habitudes = habRes.value.habits || [];

      set(updates);
    } catch (err) {
      console.error('Erreur rafraîchissement:', err);
    }
  },
}));

export default useGameStore;
