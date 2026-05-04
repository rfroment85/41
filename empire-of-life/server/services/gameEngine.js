// ─── Moteur de jeu — fonctions utilitaires centrales ─────────────────────
import db from '../db.js';

// ─── Constantes de jeu ───────────────────────────────────────────────────

// Seuils d'XP par niveau (progression non-linéaire)
const XP_PER_LEVEL = (level) => Math.floor(100 * Math.pow(1.15, level - 1));

// Seuils d'âge (Age of Empires style)
const AGES = [
  { age: 1, name: 'Âge Sombre', xp_required: 0, level_required: 1 },
  { age: 2, name: 'Âge Féodal', xp_required: 5000, level_required: 10 },
  { age: 3, name: 'Âge des Châteaux', xp_required: 25000, level_required: 25 },
  { age: 4, name: 'Âge Impérial', xp_required: 100000, level_required: 50 },
];

// Titres par tranche de niveau
const TITLES = [
  { min: 1, max: 5, title: 'Villageois' },
  { min: 6, max: 10, title: 'Milicien' },
  { min: 11, max: 15, title: 'Écuyer' },
  { min: 16, max: 20, title: 'Chevalier' },
  { min: 21, max: 30, title: 'Baron' },
  { min: 31, max: 40, title: 'Comte' },
  { min: 41, max: 50, title: 'Duc' },
  { min: 51, max: 75, title: 'Roi' },
  { min: 76, max: 100, title: 'Empereur' },
  { min: 101, max: Infinity, title: 'Empereur Légendaire' },
];

// Templates de quêtes quotidiennes par domaine
const QUEST_TEMPLATES = [
  // Santé
  { title: 'Marche de 30 minutes', domain: 'sante', type: 'daily', xp_reward: 30, difficulty: 3, description: 'Faire une marche rapide de 30 minutes' },
  { title: 'Boire 2L d\'eau', domain: 'sante', type: 'daily', xp_reward: 20, difficulty: 2, description: 'Hydrater ton corps correctement' },
  { title: 'Étirements matinaux', domain: 'sante', type: 'daily', xp_reward: 15, difficulty: 2, description: '10 minutes d\'étirements au réveil' },
  { title: 'Repas équilibré', domain: 'sante', type: 'daily', xp_reward: 25, difficulty: 3, description: 'Préparer un repas sain et équilibré' },
  // Mental
  { title: 'Lire 20 pages', domain: 'mental', type: 'daily', xp_reward: 30, difficulty: 3, description: 'Lire au moins 20 pages d\'un livre' },
  { title: 'Apprendre un concept', domain: 'mental', type: 'daily', xp_reward: 35, difficulty: 4, description: 'Étudier et maîtriser un nouveau concept' },
  { title: 'Méditation 10 min', domain: 'mental', type: 'daily', xp_reward: 25, difficulty: 3, description: 'Session de méditation guidée ou libre' },
  { title: 'Journaling', domain: 'mental', type: 'daily', xp_reward: 20, difficulty: 2, description: 'Écrire ses pensées et réflexions' },
  // Social
  { title: 'Contacter un ami', domain: 'social', type: 'daily', xp_reward: 25, difficulty: 3, description: 'Envoyer un message ou appeler un ami' },
  { title: 'Acte de gentillesse', domain: 'social', type: 'daily', xp_reward: 20, difficulty: 2, description: 'Faire une bonne action pour quelqu\'un' },
  // Spirituel
  { title: 'Réflexion stoïcienne', domain: 'spirituel', type: 'daily', xp_reward: 30, difficulty: 3, description: 'Méditer sur une citation de Marc Aurèle' },
  { title: 'Pratiquer la gratitude', domain: 'spirituel', type: 'daily', xp_reward: 20, difficulty: 2, description: 'Lister 3 choses pour lesquelles tu es reconnaissant' },
  // Financier
  { title: 'Vérifier les finances', domain: 'financier', type: 'daily', xp_reward: 20, difficulty: 2, description: 'Consulter et mettre à jour son budget' },
  { title: 'Session de travail profond', domain: 'financier', type: 'daily', xp_reward: 40, difficulty: 5, description: '2h de travail concentré sur un projet professionnel' },
  // Créatif
  { title: 'Session créative', domain: 'creatif', type: 'daily', xp_reward: 30, difficulty: 3, description: '30 minutes de création libre (écriture, code, art)' },
  { title: 'Brainstorm idées', domain: 'creatif', type: 'daily', xp_reward: 20, difficulty: 2, description: 'Générer 5 nouvelles idées sur un sujet' },
  // Environnement
  { title: 'Ranger une zone', domain: 'environnement', type: 'daily', xp_reward: 25, difficulty: 3, description: 'Ranger et organiser un espace de vie' },
  { title: 'Tâche ménagère', domain: 'environnement', type: 'daily', xp_reward: 20, difficulty: 2, description: 'Compléter une tâche ménagère importante' },
  // Loisirs
  { title: 'Pause intentionnelle', domain: 'loisirs', type: 'daily', xp_reward: 15, difficulty: 1, description: 'Prendre un moment de détente consciente' },
  { title: 'Activité plaisir', domain: 'loisirs', type: 'daily', xp_reward: 20, difficulty: 2, description: 'Faire une activité purement pour le plaisir' },
];

// ─── Fonctions du moteur ─────────────────────────────────────────────────

/**
 * Attribuer de l'XP et mettre à jour le niveau/âge
 * @param {number} amount - quantité d'XP brute
 * @param {string} source - source de l'XP (habit, quest, hic_et_nunc, etc.)
 * @param {string} detail - détail textuel
 * @param {string} domain - domaine concerné
 * @returns {object} résultat avec XP final, level up, age up
 */
export function awardXP(amount, source, detail = '', domain = null) {
  const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  if (!profile) return { success: false, error: 'Profil introuvable' };

  // Calculer le multiplicateur de streak
  let multiplier = 1.0;
  if (profile.streak_days >= 7) multiplier += 0.1;
  if (profile.streak_days >= 14) multiplier += 0.1;
  if (profile.streak_days >= 30) multiplier += 0.2;
  if (profile.streak_days >= 60) multiplier += 0.3;

  // Bonus de momentum
  if (profile.momentum >= 80) multiplier += 0.2;
  else if (profile.momentum >= 60) multiplier += 0.1;

  const finalAmount = Math.floor(amount * multiplier);

  // Enregistrer le log XP
  db.prepare(`
    INSERT INTO xp_logs (amount, source, detail, domain, multiplier)
    VALUES (?, ?, ?, ?, ?)
  `).run(finalAmount, source, detail, domain, multiplier);

  // Mettre à jour l'XP total
  const newXP = profile.xp_total + finalAmount;
  const oldLevel = profile.level;

  // Calculer le nouveau niveau
  let newLevel = 1;
  let xpAccumulated = 0;
  while (xpAccumulated + XP_PER_LEVEL(newLevel) <= newXP) {
    xpAccumulated += XP_PER_LEVEL(newLevel);
    newLevel++;
  }

  // Calculer la progression dans le niveau actuel
  const xpForCurrentLevel = XP_PER_LEVEL(newLevel);
  const xpInCurrentLevel = newXP - xpAccumulated;

  // Mettre à jour le profil
  db.prepare('UPDATE user_profile SET xp_total = ?, level = ? WHERE id = 1').run(newXP, newLevel);

  // Mettre à jour le score du domaine si applicable
  if (domain) {
    db.prepare(`
      UPDATE domain_scores
      SET mastery_xp = mastery_xp + ?, updated_at = datetime('now')
      WHERE domain = ?
    `).run(finalAmount, domain);

    // Vérifier l'avancement de maîtrise
    checkMasteryAdvancement(domain);
  }

  // Vérifier l'avancement d'âge
  const ageResult = checkAgeAdvancement();

  const leveledUp = newLevel > oldLevel;
  const title = getTitle(newLevel);

  return {
    success: true,
    xp_awarded: finalAmount,
    multiplier,
    xp_total: newXP,
    level: newLevel,
    leveled_up: leveledUp,
    title,
    xp_for_next_level: xpForCurrentLevel,
    xp_in_current_level: xpInCurrentLevel,
    age_advanced: ageResult.advanced,
    new_age: ageResult.current_age,
  };
}

/**
 * Mettre à jour le momentum avec vérification des bornes
 * @param {number} change - changement (+/-)
 * @param {string} reason - raison du changement
 * @returns {object} nouveau momentum
 */
export function updateMomentum(change, reason = '') {
  const profile = db.prepare('SELECT momentum FROM user_profile WHERE id = 1').get();
  if (!profile) return { success: false, error: 'Profil introuvable' };

  // Borner entre 0 et 100
  const newMomentum = Math.max(0, Math.min(100, profile.momentum + change));
  const actualChange = newMomentum - profile.momentum;

  db.prepare('UPDATE user_profile SET momentum = ? WHERE id = 1').run(newMomentum);

  // Enregistrer le log
  db.prepare(`
    INSERT INTO momentum_logs (value, change_amount, reason)
    VALUES (?, ?, ?)
  `).run(newMomentum, actualChange, reason);

  return {
    success: true,
    momentum: newMomentum,
    change: actualChange,
    reason,
  };
}

/**
 * Mettre à jour le streak d'une habitude avec logique d'assurance
 * @param {number} habitId - ID de l'habitude
 * @returns {object} état du streak
 */
export function updateStreak(habitId) {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(habitId);
  if (!habit) return { success: false, error: 'Habitude introuvable' };

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Vérifier le log d'hier
  const yesterdayLog = db.prepare(
    'SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? AND completed = 1'
  ).get(habitId, yesterday);

  // Vérifier le log d'aujourd'hui
  const todayLog = db.prepare(
    'SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? AND completed = 1'
  ).get(habitId, today);

  let newStreak = habit.streak_current;

  if (todayLog) {
    if (yesterdayLog || habit.streak_current === 0) {
      // Continuation ou début de streak
      newStreak = habit.streak_current + 1;
    } else {
      // Journée manquée hier — vérifier les boucliers
      const weekStart = getWeekStart(today);
      let shield = db.prepare(
        'SELECT * FROM streak_shields WHERE habit_id = ? AND week_start = ?'
      ).get(habitId, weekStart);

      if (!shield) {
        // Créer l'entrée de bouclier pour cette semaine
        db.prepare(
          'INSERT INTO streak_shields (habit_id, week_start, shields_remaining, shields_used) VALUES (?, ?, 2, 0)'
        ).run(habitId, weekStart);
        shield = { shields_remaining: 2, shields_used: 0 };
      }

      if (shield.shields_remaining > 0) {
        // Utiliser un bouclier — le streak continue
        db.prepare(`
          UPDATE streak_shields
          SET shields_remaining = shields_remaining - 1, shields_used = shields_used + 1
          WHERE habit_id = ? AND week_start = ?
        `).run(habitId, weekStart);
        newStreak = habit.streak_current + 1;
      } else {
        // Pas de bouclier — le streak est cassé
        newStreak = 1;
      }
    }
  }

  // Mettre à jour le best streak si nécessaire
  const newBestStreak = Math.max(habit.streak_best, newStreak);

  db.prepare(`
    UPDATE habits
    SET streak_current = ?, streak_best = ?
    WHERE id = ?
  `).run(newStreak, newBestStreak, habitId);

  return {
    success: true,
    streak_current: newStreak,
    streak_best: newBestStreak,
    shield_used: newStreak > 1 && !yesterdayLog && habit.streak_current > 0,
  };
}

/**
 * Vérifier si les conditions pour avancer d'âge sont remplies
 * @returns {object} résultat de la vérification
 */
export function checkAgeAdvancement() {
  const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  const currentAge = profile.age_current;

  // Trouver le prochain âge
  const nextAge = AGES.find(a => a.age === currentAge + 1);
  if (!nextAge) {
    return { advanced: false, current_age: currentAge, message: 'Âge maximum atteint' };
  }

  // Vérifier les conditions
  if (profile.xp_total >= nextAge.xp_required && profile.level >= nextAge.level_required) {
    db.prepare('UPDATE user_profile SET age_current = ? WHERE id = 1').run(nextAge.age);
    return {
      advanced: true,
      current_age: nextAge.age,
      age_name: nextAge.name,
      message: `Avancement à l'${nextAge.name} !`,
    };
  }

  return {
    advanced: false,
    current_age: currentAge,
    next_age: nextAge,
    xp_remaining: nextAge.xp_required - profile.xp_total,
    levels_remaining: Math.max(0, nextAge.level_required - profile.level),
  };
}

/**
 * Générer les quêtes quotidiennes de manière déterministe
 * @param {string} dateStr - date au format YYYY-MM-DD
 * @returns {object[]} quêtes générées
 */
export function generateDailyQuests(dateStr) {
  const today = dateStr || new Date().toISOString().split('T')[0];

  // Vérifier si des quêtes ont déjà été générées aujourd'hui
  const existingQuests = db.prepare(
    "SELECT COUNT(*) as count FROM quests WHERE type = 'daily' AND date(created_at) = ? AND status = 'active'"
  ).get(today);

  if (existingQuests.count > 0) {
    return {
      generated: false,
      message: 'Les quêtes quotidiennes ont déjà été générées aujourd\'hui',
      quests: db.prepare(
        "SELECT * FROM quests WHERE type = 'daily' AND date(created_at) = ?"
      ).all(today),
    };
  }

  // Seed déterministe basé sur la date
  const seed = hashDate(today);
  const shuffled = seededShuffle([...QUEST_TEMPLATES], seed);

  // Sélectionner 5 quêtes de domaines variés
  const selected = [];
  const usedDomains = new Set();

  for (const template of shuffled) {
    if (selected.length >= 5) break;
    // Favoriser la diversité des domaines
    if (usedDomains.has(template.domain) && selected.length < shuffled.length) {
      if (selected.length >= 3) continue; // Après 3, on peut répéter
    }
    selected.push(template);
    usedDomains.add(template.domain);
  }

  // Insérer les quêtes
  const insertQuest = db.prepare(`
    INSERT INTO quests (title, description, domain, type, xp_reward, difficulty, status, sub_tasks, due_date)
    VALUES (?, ?, ?, 'daily', ?, ?, 'active', '[]', ?)
  `);

  const insertAll = db.transaction(() => {
    for (const quest of selected) {
      insertQuest.run(
        quest.title,
        quest.description,
        quest.domain,
        quest.xp_reward,
        quest.difficulty,
        today
      );
    }
  });
  insertAll();

  const generatedQuests = db.prepare(
    "SELECT * FROM quests WHERE type = 'daily' AND date(created_at) = ?"
  ).all(today);

  return {
    generated: true,
    message: `${generatedQuests.length} quêtes quotidiennes générées`,
    quests: generatedQuests,
  };
}

/**
 * Calculer la production de ressources avec tous les multiplicateurs
 * @param {string} resourceType - type de ressource
 * @param {number} baseAmount - quantité de base
 * @returns {object} résultat de la production
 */
export function calculateResourceProduction(resourceType, baseAmount = 10) {
  const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  const resource = db.prepare('SELECT * FROM resources WHERE type = ?').get(resourceType);

  if (!resource) return { success: false, error: 'Ressource introuvable' };

  // Multiplicateur de streak
  let streakMulti = 1.0;
  if (profile.streak_days >= 7) streakMulti = 1.1;
  if (profile.streak_days >= 14) streakMulti = 1.2;
  if (profile.streak_days >= 30) streakMulti = 1.5;

  // Bonus d'âge
  const ageBonus = 1 + (profile.age_current - 1) * 0.15;

  // Bonus de bâtiments (compter les bâtiments pertinents)
  const buildingCount = db.prepare('SELECT COUNT(*) as count FROM buildings').get().count;
  const buildingBonus = 1 + buildingCount * 0.05;

  // Moral (basé sur le momentum)
  const morale = profile.momentum / 100;

  // Bonus de momentum
  let momentumBonus = 1.0;
  if (profile.momentum >= 80) momentumBonus = 1.3;
  else if (profile.momentum >= 60) momentumBonus = 1.15;
  else if (profile.momentum >= 40) momentumBonus = 1.0;
  else momentumBonus = 0.8;

  // Taux de production de la ressource
  const productionRate = resource.production_rate;

  // Formule finale
  const totalProduction = Math.floor(
    baseAmount * productionRate * streakMulti * ageBonus * buildingBonus * morale * momentumBonus
  );

  return {
    success: true,
    resource_type: resourceType,
    base_amount: baseAmount,
    multipliers: {
      production_rate: productionRate,
      streak: streakMulti,
      age: ageBonus,
      building: buildingBonus,
      morale,
      momentum: momentumBonus,
    },
    total_production: totalProduction,
  };
}

/**
 * Appliquer la décroissance quotidienne du momentum
 * @param {number} daysMissed - nombre de jours manqués
 * @returns {object} résultat de la décroissance
 */
export function applyMomentumDecay(daysMissed) {
  if (daysMissed <= 0) return { decayed: false, decay_amount: 0 };

  const decayPerDay = 10;
  const totalDecay = daysMissed * decayPerDay;

  const result = updateMomentum(-totalDecay, `Décroissance: ${daysMissed} jour(s) d'inactivité`);

  return {
    decayed: true,
    days_missed: daysMissed,
    decay_amount: totalDecay,
    new_momentum: result.momentum,
  };
}

/**
 * Vérifier l'avancement de maîtrise d'un domaine
 * @param {string} domain - le domaine à vérifier
 */
function checkMasteryAdvancement(domain) {
  const domainScore = db.prepare('SELECT * FROM domain_scores WHERE domain = ?').get(domain);
  if (!domainScore) return;

  // Seuils de maîtrise
  const phases = [
    { phase: 'apprentice', xp_threshold: 0 },
    { phase: 'journeyman', xp_threshold: 1000 },
    { phase: 'expert', xp_threshold: 5000 },
    { phase: 'master', xp_threshold: 15000 },
    { phase: 'grandmaster', xp_threshold: 50000 },
  ];

  let currentPhase = 'apprentice';
  for (const p of phases) {
    if (domainScore.mastery_xp >= p.xp_threshold) {
      currentPhase = p.phase;
    }
  }

  if (currentPhase !== domainScore.mastery_phase) {
    db.prepare(
      "UPDATE domain_scores SET mastery_phase = ?, updated_at = datetime('now') WHERE domain = ?"
    ).run(currentPhase, domain);
  }
}

/**
 * Obtenir le titre correspondant au niveau
 * @param {number} level
 * @returns {string} titre
 */
export function getTitle(level) {
  const entry = TITLES.find(t => level >= t.min && level <= t.max);
  return entry ? entry.title : 'Villageois';
}

// ─── Fonctions utilitaires ───────────────────────────────────────────────

/**
 * Hash simple d'une date pour le seed
 */
function hashDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en 32bit int
  }
  return Math.abs(hash);
}

/**
 * Shuffle déterministe avec seed (Fisher-Yates)
 */
function seededShuffle(array, seed) {
  let m = array.length;
  let s = seed;
  while (m) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const i = s % m--;
    [array[m], array[i]] = [array[i], array[m]];
  }
  return array;
}

/**
 * Obtenir le lundi de la semaine courante
 */
function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Exporter les constantes aussi
export { AGES, TITLES, XP_PER_LEVEL, QUEST_TEMPLATES };
