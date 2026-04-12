// ─── Routes du profil utilisateur ────────────────────────────────────────
import { Router } from 'express';
import db from '../db.js';
import { getTitle, XP_PER_LEVEL, AGES } from '../services/gameEngine.js';

const router = Router();

// GET /api/profile — Récupérer le profil complet avec infos de niveau
router.get('/', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
    if (!profile) {
      return res.status(404).json({ error: 'Profil introuvable' });
    }

    // Calculer les infos de niveau
    let xpAccumulated = 0;
    let level = 1;
    while (xpAccumulated + XP_PER_LEVEL(level) <= profile.xp_total) {
      xpAccumulated += XP_PER_LEVEL(level);
      level++;
    }

    const xpForCurrentLevel = XP_PER_LEVEL(level);
    const xpInCurrentLevel = profile.xp_total - xpAccumulated;
    const title = getTitle(profile.level);

    // Trouver l'âge actuel
    const currentAge = AGES.find(a => a.age === profile.age_current);
    const nextAge = AGES.find(a => a.age === profile.age_current + 1);

    res.json({
      ...profile,
      title,
      xp_for_current_level: xpForCurrentLevel,
      xp_in_current_level: xpInCurrentLevel,
      xp_progress_percent: Math.floor((xpInCurrentLevel / xpForCurrentLevel) * 100),
      age_name: currentAge ? currentAge.name : 'Âge Sombre',
      next_age: nextAge || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile — Mettre à jour les champs du profil
router.put('/', (req, res) => {
  try {
    const allowedFields = ['name', 'avatar', 'lifes_task'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' });
    }

    values.push(1); // WHERE id = 1
    db.prepare(`UPDATE user_profile SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profile/status — Statut complet (profil + ressources + momentum + quêtes actives)
router.get('/status', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
    if (!profile) {
      return res.status(404).json({ error: 'Profil introuvable' });
    }

    const resources = db.prepare('SELECT * FROM resources').all();
    const activeQuests = db.prepare(
      "SELECT COUNT(*) as count FROM quests WHERE status = 'active'"
    ).get();
    const domainScores = db.prepare('SELECT * FROM domain_scores').all();

    // Dernier momentum
    const lastMomentum = db.prepare(
      'SELECT * FROM momentum_logs ORDER BY logged_at DESC LIMIT 1'
    ).get();

    const title = getTitle(profile.level);
    const currentAge = AGES.find(a => a.age === profile.age_current);

    // Calculer la progression dans le niveau
    let xpAccumulated = 0;
    let level = 1;
    while (xpAccumulated + XP_PER_LEVEL(level) <= profile.xp_total) {
      xpAccumulated += XP_PER_LEVEL(level);
      level++;
    }

    res.json({
      profile: {
        ...profile,
        title,
        age_name: currentAge ? currentAge.name : 'Âge Sombre',
        xp_for_current_level: XP_PER_LEVEL(level),
        xp_in_current_level: profile.xp_total - xpAccumulated,
      },
      resources,
      momentum: {
        current: profile.momentum,
        last_change: lastMomentum || null,
      },
      active_quests_count: activeQuests.count,
      domain_scores: domainScores,
      streak: {
        current: profile.streak_days,
        best: profile.best_streak,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
