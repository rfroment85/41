// ═══════════════════════════════ CONSTANTES DU JEU ═══════════════════════════
// Empire of Life — Toutes les constantes, formules et données statiques

// ─── Couleurs (référence pour le JS, le CSS utilise les variables Tailwind) ───
export const COLORS = {
  gold: '#FFD700',
  goldDark: '#C8913A',
  blue: '#3D82F6',
  green: '#1CC98A',
  red: '#EF4444',
  purple: '#8B5CF6',
  orange: '#F07240',
  teal: '#06B6D4',
  momentum: '#FF6B35',
};

// ═══════════════════════════════ RESSOURCES ══════════════════════════════════
export const RESSOURCES = {
  nourriture: { nom: 'Nourriture', emoji: '🌾', couleur: '#4ADE80', age: 1 },
  bois:       { nom: 'Bois',       emoji: '🪵', couleur: '#A78BFA', age: 1 },
  or:         { nom: 'Or',         emoji: '💰', couleur: '#FFD700', age: 1 },
  pierre:     { nom: 'Pierre',     emoji: '🪨', couleur: '#94A3B8', age: 1 },
  foi:        { nom: 'Foi',        emoji: '✨', couleur: '#F9A8D4', age: 2 },
  relations:  { nom: 'Relations',  emoji: '👥', couleur: '#60A5FA', age: 2 },
  influence:  { nom: 'Influence',  emoji: '👑', couleur: '#FBBF24', age: 3 },
  heritage:   { nom: 'Héritage',   emoji: '🏛️', couleur: '#E2E8F0', age: 4 },
};

// ═══════════════════════════════ ÂGES ════════════════════════════════════════
export const AGES = [
  {
    numero: 1, nom: 'Âge Sombre', emoji: '🏚️',
    bonus: 1.0,
    condition: 'Début du jeu',
    description: 'Les fondations de votre empire. Habitudes simples, 3 domaines, rituels.',
  },
  {
    numero: 2, nom: 'Âge Féodal', emoji: '🏰',
    bonus: 1.15,
    condition: '7 jours de logging + 2 habitudes tenues 1 semaine',
    description: 'Votre royaume prend forme. Quêtes, arbre tech, nouvelles ressources.',
  },
  {
    numero: 3, nom: 'Âge des Châteaux', emoji: '⚔️',
    bonus: 1.30,
    condition: '1 mois + 1 OKR complété',
    description: 'Les raids menacent, mais vos stratégies sont redoutables.',
  },
  {
    numero: 4, nom: 'Âge Impérial', emoji: '👑',
    bonus: 1.50,
    condition: '3 mois + 3 OKRs + tous domaines actifs',
    description: 'Votre empire rayonne. Prestige, héritage et maîtrise absolue.',
  },
];

// ═══════════════════════════════ DOMAINES DE VIE ═════════════════════════════
export const DOMAINES = {
  sante:       { nom: 'Santé & Vitalité',     emoji: '💪', couleur: '#4ADE80', ressource: 'nourriture' },
  carriere:    { nom: 'Carrière & Mission',    emoji: '🎯', couleur: '#3D82F6', ressource: 'or' },
  finances:    { nom: 'Finances & Prospérité', emoji: '💰', couleur: '#FFD700', ressource: 'or' },
  relations:   { nom: 'Relations & Famille',   emoji: '❤️', couleur: '#F87171', ressource: 'relations' },
  croissance:  { nom: 'Croissance Perso',      emoji: '🧠', couleur: '#8B5CF6', ressource: 'foi' },
  loisirs:     { nom: 'Loisirs & Passion',     emoji: '🎨', couleur: '#F97316', ressource: 'bois' },
  environnement: { nom: 'Environnement',       emoji: '🏠', couleur: '#06B6D4', ressource: 'pierre' },
  spiritualite:  { nom: 'Sens & Spiritualité', emoji: '🕊️', couleur: '#E2E8F0', ressource: 'foi' },
};

// ═══════════════════════════════ XP & NIVEAUX ════════════════════════════════
export const XP_REWARDS = {
  checkin: 15,
  habitude: 20,
  microTache: 10,
  queteQuotidienne: 50,
  queteHebdo: 150,
  queteMensuelle: 500,
  pomodoro: 30,
  tachePriorite: 25,
  rituelMatin: 10,
  rituelSoir: 15,
  hicEtNuncBonus: 10,    // Bonus action immédiate
  captureIdee: 5,
};

// Formule : XP pour passer au niveau suivant (courbe exponentielle douce)
// Niveaux rapides au début = dopamine TDAH
export function xpPourNiveauSuivant(niveau) {
  return Math.floor(100 * Math.pow(1.15, niveau - 1));
}

// Calcule le niveau à partir du XP total
export function calculerNiveau(xpTotal) {
  let niveau = 1;
  let xpCumule = 0;
  while (true) {
    const xpNecessaire = xpPourNiveauSuivant(niveau);
    if (xpCumule + xpNecessaire > xpTotal) {
      return {
        niveau,
        xpDansNiveau: xpTotal - xpCumule,
        xpProchainNiveau: xpNecessaire,
      };
    }
    xpCumule += xpNecessaire;
    niveau++;
  }
}

// Titres selon le niveau (thématique empire)
export const TITRES_NIVEAUX = {
  1:  'Paysan',
  3:  'Milicien',
  5:  'Écuyer',
  8:  'Chevalier',
  10: 'Baron',
  13: 'Vicomte',
  15: 'Comte',
  18: 'Duc',
  20: 'Archiduc',
  25: 'Prince',
  30: 'Roi',
  40: 'Empereur',
  50: 'Légende',
};

export function titreNiveau(niveau) {
  const niveaux = Object.keys(TITRES_NIVEAUX).map(Number).sort((a, b) => b - a);
  for (const n of niveaux) {
    if (niveau >= n) return TITRES_NIVEAUX[n];
  }
  return 'Paysan';
}

// ═══════════════════════════════ MOMENTUM ════════════════════════════════════
export const MOMENTUM = {
  max: 100,
  min: 0,
  resetLundi: 50,        // Reset minimum le lundi
  decroissanceJour: 10,  // -10 par jour sans action
  bonusAction: { min: 5, max: 15 },
  bonusHicEtNunc: 10,
  bonusRituelMatin: 10,
  bonusRituelSoir: 15,
  seuilHaut: 70,          // Momentum haut : bonus +20% prod
  seuilBas: 30,           // Momentum bas : starter quests uniquement
};

// Multiplicateur de streak
export function multiplicateurSerie(jours) {
  if (jours >= 30) return 2.0;
  if (jours >= 14) return 1.8;
  if (jours >= 7)  return 1.5;
  if (jours >= 3)  return 1.25;   // Plus doux que 1.2 — TDAH = gratification rapide
  return 1.0;
}

// ═══════════════════════════════ VERTUS (Franklin adapté) ═════════════════════
export const VERTUS = [
  { id: 'discipline', nom: 'Discipline', emoji: '🗡️',  description: 'Constance dans l\'action', tracking: 'Habitudes complétées / total' },
  { id: 'sagesse',    nom: 'Sagesse',    emoji: '📜',  description: 'Apprentissage et réflexion', tracking: 'Heures d\'étude + journaling' },
  { id: 'courage',    nom: 'Courage',    emoji: '🛡️',  description: 'Audace et prise de risque', tracking: 'Tâches difficiles tentées' },
  { id: 'temperance', nom: 'Tempérance', emoji: '⚖️',  description: 'Équilibre et modération', tracking: 'Score Wheel of Life' },
  { id: 'justice',    nom: 'Justice',    emoji: '⚔️',  description: 'Relations et intégrité', tracking: 'Actions sociales positives' },
  { id: 'patience',   nom: 'Patience',   emoji: '🕰️',  description: 'Vision long terme', tracking: 'Progression campagnes OKR' },
  { id: 'curiosite',  nom: 'Curiosité',  emoji: '🔭',  description: 'Exploration et nouveauté', tracking: 'Nouvelles expériences' },
];

// ═══════════════════════════════ BÂTIMENTS ═══════════════════════════════════
export const BATIMENTS = {
  // Âge Sombre (âge 1)
  ferme:      { nom: 'Ferme',       emoji: '🌾', age: 1, cout: { nourriture: 0, bois: 60 },  effet: '+20% nourriture', ressource: 'nourriture', bonus: 0.2 },
  scierie:    { nom: 'Scierie',     emoji: '🪓', age: 1, cout: { nourriture: 50, bois: 0 },   effet: '+20% bois', ressource: 'bois', bonus: 0.2 },
  mine_or:    { nom: 'Mine d\'or',  emoji: '⛏️', age: 1, cout: { bois: 80, pierre: 40 },      effet: '+20% or', ressource: 'or', bonus: 0.2 },
  carriere:   { nom: 'Carrière',    emoji: '🏗️', age: 1, cout: { bois: 60, nourriture: 40 },  effet: '+20% pierre', ressource: 'pierre', bonus: 0.2 },
  // Âge Féodal (âge 2)
  temple:     { nom: 'Temple',      emoji: '⛪', age: 2, cout: { pierre: 150, or: 100 },       effet: '+25% foi', ressource: 'foi', bonus: 0.25 },
  taverne:    { nom: 'Taverne',     emoji: '🍺', age: 2, cout: { bois: 120, or: 80 },         effet: '+25% relations', ressource: 'relations', bonus: 0.25 },
  bibliotheque: { nom: 'Bibliothèque de Greene', emoji: '📚', age: 2, cout: { pierre: 150, or: 100 }, effet: 'Débloque l\'arbre tech', ressource: null, bonus: 0 },
  // Âge des Châteaux (âge 3)
  chateau:    { nom: 'Château fort', emoji: '🏰', age: 3, cout: { pierre: 300, or: 200, bois: 150 }, effet: '+30% influence', ressource: 'influence', bonus: 0.3 },
  universite: { nom: 'Université',   emoji: '🎓', age: 3, cout: { or: 250, pierre: 200 },      effet: 'Recherche +50% plus rapide', ressource: null, bonus: 0 },
  // Âge Impérial (âge 4)
  merveille:  { nom: 'Merveille',    emoji: '🏛️', age: 4, cout: { nourriture: 500, bois: 500, or: 500, pierre: 500 }, effet: 'Victoire — Héritage éternel', ressource: 'heritage', bonus: 0.5 },
};

// ═══════════════════════════════ RÉPONSES MAUVAIS JOURS (TDAH) ═══════════════
// JAMAIS de culpabilité — voir CdC section 2.5
export const MESSAGES_RETOUR = {
  0: null, // Pas de message si actif
  1: null, // 1 jour : silence respectueux
  2: 'Bienvenue, Sire. Votre empire vous attend quand vous êtes prêt.',
  3: 'Les jardins du palais sont paisibles. Une simple promenade de 5 minutes suffirait à réveiller vos troupes.',
  5: 'Votre peuple comprend. Les plus grands souverains connaissent des hivers. Quand le printemps viendra, nous serons là.',
  14: null, // Fresh Start automatique — géré par le système
};

export function messageRetour(joursInactifs) {
  if (joursInactifs <= 1) return null;
  if (joursInactifs <= 2) return MESSAGES_RETOUR[2];
  if (joursInactifs <= 4) return MESSAGES_RETOUR[3];
  if (joursInactifs <= 13) return MESSAGES_RETOUR[5];
  return 'Un nouveau chapitre commence. Tout est possible. Votre empire renaît de ses cendres.';
}
