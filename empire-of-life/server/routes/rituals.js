// ─── Routes des rituels stoïciens ────────────────────────────────────────
import { Router } from 'express';
import db from '../db.js';
import { awardXP, updateMomentum } from '../services/gameEngine.js';

const router = Router();

// GET /api/rituals/today — Obtenir le statut des rituels du jour
router.get('/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const morning = db.prepare(
      "SELECT * FROM rituals WHERE type = 'morning' AND date = ?"
    ).get(today);

    const evening = db.prepare(
      "SELECT * FROM rituals WHERE type = 'evening' AND date = ?"
    ).get(today);

    res.json({
      date: today,
      morning: morning || null,
      evening: evening || null,
      morning_completed: !!morning,
      evening_completed: !!evening,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rituals/morning — Logger le rituel du matin
router.post('/morning', (req, res) => {
  try {
    const { focus_domain, obstacle, response } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Vérifier si le rituel du matin a déjà été fait
    const existing = db.prepare(
      "SELECT * FROM rituals WHERE type = 'morning' AND date = ?"
    ).get(today);

    if (existing) {
      // Mettre à jour le rituel existant
      db.prepare(`
        UPDATE rituals
        SET focus_domain = ?, obstacle = ?, response = ?, logged_at = datetime('now')
        WHERE type = 'morning' AND date = ?
      `).run(focus_domain || null, obstacle || null, response || null, today);

      const updated = db.prepare(
        "SELECT * FROM rituals WHERE type = 'morning' AND date = ?"
      ).get(today);

      return res.json({
        success: true,
        ritual: updated,
        message: 'Rituel du matin mis à jour',
      });
    }

    // Créer le rituel du matin
    db.prepare(`
      INSERT INTO rituals (type, date, focus_domain, obstacle, response)
      VALUES ('morning', ?, ?, ?, ?)
    `).run(today, focus_domain || null, obstacle || null, response || null);

    // Attribuer l'XP pour le rituel du matin
    const xpResult = awardXP(25, 'ritual', 'Rituel du matin complété', 'spirituel');

    // Bonus de momentum pour commencer la journée avec intention
    const momentumResult = updateMomentum(10, 'Rituel du matin complété');

    const ritual = db.prepare(
      "SELECT * FROM rituals WHERE type = 'morning' AND date = ?"
    ).get(today);

    res.status(201).json({
      success: true,
      ritual,
      xp: xpResult,
      momentum: momentumResult,
      message: 'Rituel du matin enregistré — Memento Mori, seize the day!',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rituals/evening — Logger le rituel du soir
router.post('/evening', (req, res) => {
  try {
    const { accomplishments, stumbles, lesson, mood } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Vérifier si le rituel du soir a déjà été fait
    const existing = db.prepare(
      "SELECT * FROM rituals WHERE type = 'evening' AND date = ?"
    ).get(today);

    if (existing) {
      // Mettre à jour le rituel existant
      db.prepare(`
        UPDATE rituals
        SET accomplishments = ?, stumbles = ?, lesson = ?, mood = ?, logged_at = datetime('now')
        WHERE type = 'evening' AND date = ?
      `).run(
        accomplishments || null,
        stumbles || null,
        lesson || null,
        mood || null,
        today
      );

      const updated = db.prepare(
        "SELECT * FROM rituals WHERE type = 'evening' AND date = ?"
      ).get(today);

      return res.json({
        success: true,
        ritual: updated,
        message: 'Rituel du soir mis à jour',
      });
    }

    // Créer le rituel du soir
    db.prepare(`
      INSERT INTO rituals (type, date, accomplishments, stumbles, lesson, mood)
      VALUES ('evening', ?, ?, ?, ?, ?)
    `).run(today, accomplishments || null, stumbles || null, lesson || null, mood || null);

    // Attribuer l'XP pour le rituel du soir
    const xpResult = awardXP(25, 'ritual', 'Rituel du soir complété', 'spirituel');

    // Bonus de momentum pour la réflexion
    const momentumResult = updateMomentum(5, 'Rituel du soir complété');

    // Vérifier si les deux rituels ont été complétés aujourd'hui
    const morningDone = db.prepare(
      "SELECT * FROM rituals WHERE type = 'morning' AND date = ?"
    ).get(today);

    let bothCompleted = false;
    if (morningDone) {
      bothCompleted = true;
      // Bonus pour les deux rituels
      awardXP(15, 'ritual_bonus', 'Les deux rituels du jour complétés', 'spirituel');
      updateMomentum(5, 'Journée stoïcienne complète');
    }

    const ritual = db.prepare(
      "SELECT * FROM rituals WHERE type = 'evening' AND date = ?"
    ).get(today);

    res.status(201).json({
      success: true,
      ritual,
      xp: xpResult,
      momentum: momentumResult,
      both_completed: bothCompleted,
      message: 'Rituel du soir enregistré — Bonne nuit, Empereur.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rituals/history — Historique des 7 derniers jours
router.get('/history', (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const rituals = db.prepare(`
      SELECT * FROM rituals
      WHERE date >= ?
      ORDER BY date DESC, type ASC
    `).all(sevenDaysAgo);

    // Grouper par date
    const grouped = {};
    for (const ritual of rituals) {
      if (!grouped[ritual.date]) {
        grouped[ritual.date] = { date: ritual.date, morning: null, evening: null };
      }
      grouped[ritual.date][ritual.type] = ritual;
    }

    // Convertir en tableau ordonné
    const history = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
