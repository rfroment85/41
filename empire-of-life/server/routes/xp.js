// ─── Routes de l'XP (points de gloire) ──────────────────────────────────
import { Router } from 'express';
import db from '../db.js';
import { awardXP, getTitle, XP_PER_LEVEL } from '../services/gameEngine.js';

const router = Router();

// GET /api/xp — XP actuel, niveau, titre, historique (20 dernières entrées)
router.get('/', (req, res) => {
  try {
    const profile = db.prepare('SELECT xp_total, level, streak_days, momentum FROM user_profile WHERE id = 1').get();
    if (!profile) {
      return res.status(404).json({ error: 'Profil introuvable' });
    }

    // Calculer la progression dans le niveau actuel
    let xpAccumulated = 0;
    let level = 1;
    while (xpAccumulated + XP_PER_LEVEL(level) <= profile.xp_total) {
      xpAccumulated += XP_PER_LEVEL(level);
      level++;
    }

    const xpForCurrentLevel = XP_PER_LEVEL(level);
    const xpInCurrentLevel = profile.xp_total - xpAccumulated;
    const title = getTitle(profile.level);

    // Historique des 20 dernières entrées
    const history = db.prepare(`
      SELECT * FROM xp_logs
      ORDER BY logged_at DESC
      LIMIT 20
    `).all();

    res.json({
      xp_total: profile.xp_total,
      level: profile.level,
      title,
      xp_for_current_level: xpForCurrentLevel,
      xp_in_current_level: xpInCurrentLevel,
      xp_progress_percent: Math.floor((xpInCurrentLevel / xpForCurrentLevel) * 100),
      streak_multiplier: getStreakMultiplier(profile.streak_days),
      momentum_bonus: getMomentumBonus(profile.momentum),
      history,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/xp/award — Attribuer de l'XP (appelé par les autres routes)
router.post('/award', (req, res) => {
  try {
    const { amount, source, detail, domain } = req.body;

    if (!amount || !source) {
      return res.status(400).json({ error: "Le montant et la source sont requis" });
    }

    const result = awardXP(amount, source, detail || '', domain || null);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/xp/stats — Statistiques d'XP hebdomadaires et mensuelles
router.get('/stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // XP de la semaine
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const weeklyXP = db.prepare(`
      SELECT
        date(logged_at) as date,
        SUM(amount) as total_xp,
        COUNT(*) as actions
      FROM xp_logs
      WHERE date(logged_at) >= ?
      GROUP BY date(logged_at)
      ORDER BY date ASC
    `).all(weekAgo);

    const weeklyTotal = db.prepare(`
      SELECT SUM(amount) as total FROM xp_logs WHERE date(logged_at) >= ?
    `).get(weekAgo);

    // XP du mois
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const monthlyXP = db.prepare(`
      SELECT
        date(logged_at) as date,
        SUM(amount) as total_xp,
        COUNT(*) as actions
      FROM xp_logs
      WHERE date(logged_at) >= ?
      GROUP BY date(logged_at)
      ORDER BY date ASC
    `).all(monthAgo);

    const monthlyTotal = db.prepare(`
      SELECT SUM(amount) as total FROM xp_logs WHERE date(logged_at) >= ?
    `).get(monthAgo);

    // XP par domaine (tout temps)
    const byDomain = db.prepare(`
      SELECT
        domain,
        SUM(amount) as total_xp,
        COUNT(*) as actions
      FROM xp_logs
      WHERE domain IS NOT NULL
      GROUP BY domain
      ORDER BY total_xp DESC
    `).all();

    // XP par source (tout temps)
    const bySource = db.prepare(`
      SELECT
        source,
        SUM(amount) as total_xp,
        COUNT(*) as actions
      FROM xp_logs
      GROUP BY source
      ORDER BY total_xp DESC
    `).all();

    // Meilleur jour
    const bestDay = db.prepare(`
      SELECT
        date(logged_at) as date,
        SUM(amount) as total_xp
      FROM xp_logs
      GROUP BY date(logged_at)
      ORDER BY total_xp DESC
      LIMIT 1
    `).get();

    // Moyenne quotidienne (30 derniers jours)
    const dailyAvg = monthlyTotal?.total ? Math.floor(monthlyTotal.total / 30) : 0;

    res.json({
      today: {
        date: today,
        xp: db.prepare(
          'SELECT SUM(amount) as total FROM xp_logs WHERE date(logged_at) = ?'
        ).get(today)?.total || 0,
      },
      weekly: {
        total: weeklyTotal?.total || 0,
        daily_breakdown: weeklyXP,
        daily_average: weeklyTotal?.total ? Math.floor(weeklyTotal.total / 7) : 0,
      },
      monthly: {
        total: monthlyTotal?.total || 0,
        daily_breakdown: monthlyXP,
        daily_average: dailyAvg,
      },
      by_domain: byDomain,
      by_source: bySource,
      best_day: bestDay || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Fonctions utilitaires ──────────────────────────────────────────────

function getStreakMultiplier(streakDays) {
  if (streakDays >= 60) return 1.7;
  if (streakDays >= 30) return 1.5;
  if (streakDays >= 14) return 1.3;
  if (streakDays >= 7) return 1.2;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}

function getMomentumBonus(momentum) {
  if (momentum >= 80) return 1.2;
  if (momentum >= 60) return 1.1;
  return 1.0;
}

export default router;
