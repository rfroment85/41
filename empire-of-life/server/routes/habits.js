// ─── Routes des habitudes ────────────────────────────────────────────────
import { Router } from 'express';
import db from '../db.js';
import { awardXP, updateMomentum, updateStreak } from '../services/gameEngine.js';

const router = Router();

// GET /api/habits — Lister toutes les habitudes actives avec le statut du jour
router.get('/', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const habits = db.prepare(`
      SELECT h.*,
        hl.completed as today_completed,
        hl.value as today_value
      FROM habits h
      LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
      WHERE h.is_active = 1
      ORDER BY h.created_at ASC
    `).all(today);

    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/habits — Créer une nouvelle habitude
router.post('/', (req, res) => {
  try {
    const { title, domain, frequency, type, target_value, xp_reward } = req.body;

    if (!title || !domain) {
      return res.status(400).json({ error: 'Le titre et le domaine sont requis' });
    }

    const result = db.prepare(`
      INSERT INTO habits (title, domain, frequency, type, target_value, xp_reward)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      title,
      domain,
      frequency || 'daily',
      type || 'boolean',
      target_value || null,
      xp_reward || 20
    );

    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(habit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/habits/:id — Mettre à jour une habitude
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['title', 'domain', 'frequency', 'type', 'target_value', 'xp_reward'];
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

    values.push(id);
    db.prepare(`UPDATE habits SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
    if (!habit) {
      return res.status(404).json({ error: 'Habitude introuvable' });
    }

    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/habits/:id/log — Logger une habitude (toggle boolean ou valeur)
router.post('/:id/log', (req, res) => {
  try {
    const { id } = req.params;
    const { value, completed } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND is_active = 1').get(id);
    if (!habit) {
      return res.status(404).json({ error: 'Habitude introuvable ou inactive' });
    }

    // Vérifier si un log existe déjà pour aujourd'hui
    const existingLog = db.prepare(
      'SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?'
    ).get(id, today);

    let isCompleted;
    let logValue = value || null;

    if (habit.type === 'boolean') {
      // Toggle si pas de valeur explicite
      if (completed !== undefined) {
        isCompleted = completed ? 1 : 0;
      } else if (existingLog) {
        isCompleted = existingLog.completed ? 0 : 1; // Toggle
      } else {
        isCompleted = 1;
      }
    } else {
      // Type numérique — vérifier si la cible est atteinte
      isCompleted = (logValue !== null && habit.target_value && logValue >= habit.target_value) ? 1 : (completed ? 1 : 0);
    }

    // Créer ou mettre à jour le log
    if (existingLog) {
      db.prepare(`
        UPDATE habit_logs
        SET completed = ?, value = ?, logged_at = datetime('now')
        WHERE habit_id = ? AND date = ?
      `).run(isCompleted, logValue, id, today);
    } else {
      db.prepare(`
        INSERT INTO habit_logs (habit_id, date, completed, value)
        VALUES (?, ?, ?, ?)
      `).run(id, today, isCompleted, logValue);
    }

    let xpResult = null;
    let momentumResult = null;
    let streakResult = null;

    // Si l'habitude vient d'être complétée (et n'était pas déjà complétée)
    if (isCompleted && (!existingLog || !existingLog.completed)) {
      // Attribuer l'XP
      xpResult = awardXP(
        habit.xp_reward,
        'habit',
        `Habitude complétée: ${habit.title}`,
        habit.domain
      );

      // Mettre à jour le momentum (+5 par habitude complétée)
      momentumResult = updateMomentum(5, `Habitude complétée: ${habit.title}`);

      // Mettre à jour le streak
      streakResult = updateStreak(parseInt(id));

      // Mettre à jour le streak global du profil
      const allHabitsToday = db.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN hl.completed = 1 THEN 1 ELSE 0 END) as done
        FROM habits h
        LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
        WHERE h.is_active = 1 AND h.frequency = 'daily'
      `).get(today);

      if (allHabitsToday.total > 0 && allHabitsToday.done === allHabitsToday.total) {
        // Toutes les habitudes du jour sont complétées — incrémenter le streak global
        const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
        const newStreak = profile.streak_days + 1;
        const newBest = Math.max(profile.best_streak, newStreak);
        db.prepare(
          "UPDATE user_profile SET streak_days = ?, best_streak = ?, last_active_date = ? WHERE id = 1"
        ).run(newStreak, newBest, today);
      }
    } else if (!isCompleted && existingLog && existingLog.completed) {
      // L'habitude vient d'être dé-complétée — retirer l'XP et le momentum
      // On ne retire pas l'XP pour simplifier, mais on note le changement
      momentumResult = updateMomentum(-5, `Habitude annulée: ${habit.title}`);
    }

    // Mettre à jour la date d'activité
    db.prepare("UPDATE user_profile SET last_active_date = ? WHERE id = 1").run(today);

    // Récupérer l'état mis à jour
    const updatedHabit = db.prepare(`
      SELECT h.*,
        hl.completed as today_completed,
        hl.value as today_value
      FROM habits h
      LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
      WHERE h.id = ?
    `).get(today, id);

    res.json({
      habit: updatedHabit,
      xp: xpResult,
      momentum: momentumResult,
      streak: streakResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/habits/:id — Suppression douce (is_active = 0)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
    if (!habit) {
      return res.status(404).json({ error: 'Habitude introuvable' });
    }

    db.prepare('UPDATE habits SET is_active = 0 WHERE id = ?').run(id);
    res.json({ success: true, message: `Habitude "${habit.title}" désactivée` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
