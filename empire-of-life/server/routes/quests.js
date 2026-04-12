// ─── Routes des quêtes ──────────────────────────────────────────────────
import { Router } from 'express';
import db from '../db.js';
import { awardXP, updateMomentum, generateDailyQuests, calculateResourceProduction } from '../services/gameEngine.js';

const router = Router();

// GET /api/quests — Lister les quêtes actives par type
router.get('/', (req, res) => {
  try {
    const { type, status } = req.query;

    let query = 'SELECT * FROM quests WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    } else {
      query += " AND status = 'active'";
    }

    query += ' ORDER BY created_at DESC';

    const quests = db.prepare(query).all(...params);

    // Parser les sub_tasks JSON pour chaque quête
    const questsWithSubTasks = quests.map(q => ({
      ...q,
      sub_tasks: q.sub_tasks ? JSON.parse(q.sub_tasks) : [],
    }));

    res.json(questsWithSubTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quests/generate — Générer les quêtes quotidiennes
router.post('/generate', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = generateDailyQuests(today);

    // Parser les sub_tasks pour chaque quête
    if (result.quests) {
      result.quests = result.quests.map(q => ({
        ...q,
        sub_tasks: q.sub_tasks ? JSON.parse(q.sub_tasks) : [],
      }));
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quests/:id/complete — Compléter une quête
router.post('/:id/complete', (req, res) => {
  try {
    const { id } = req.params;

    const quest = db.prepare("SELECT * FROM quests WHERE id = ? AND status = 'active'").get(id);
    if (!quest) {
      return res.status(404).json({ error: 'Quête introuvable ou déjà complétée' });
    }

    // Marquer la quête comme complétée
    db.prepare(`
      UPDATE quests
      SET status = 'completed', completed_at = datetime('now')
      WHERE id = ?
    `).run(id);

    // Attribuer l'XP
    const xpResult = awardXP(
      quest.xp_reward,
      'quest',
      `Quête complétée: ${quest.title}`,
      quest.domain
    );

    // Bonus de momentum pour complétion de quête
    const momentumBonus = Math.floor(quest.difficulty / 2) + 3;
    const momentumResult = updateMomentum(momentumBonus, `Quête complétée: ${quest.title}`);

    // Production de ressources en récompense
    const resourceRewards = [];
    const resourceTypes = ['nourriture', 'bois', 'or', 'pierre'];
    const rewardType = resourceTypes[Math.floor(quest.difficulty % resourceTypes.length)];
    const production = calculateResourceProduction(rewardType, quest.difficulty * 2);

    if (production.success) {
      db.prepare('UPDATE resources SET amount = amount + ? WHERE type = ?')
        .run(production.total_production, rewardType);
      resourceRewards.push({
        type: rewardType,
        amount: production.total_production,
      });
    }

    // Vérifier si toutes les quêtes quotidiennes sont complétées (bonus)
    const today = new Date().toISOString().split('T')[0];
    const dailyStatus = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM quests
      WHERE type = 'daily' AND date(created_at) = ?
    `).get(today);

    let allDailyCompleted = false;
    if (dailyStatus.total > 0 && dailyStatus.completed === dailyStatus.total) {
      allDailyCompleted = true;
      // Bonus pour avoir complété toutes les quêtes quotidiennes
      awardXP(50, 'quest_bonus', 'Toutes les quêtes quotidiennes complétées!', null);
      updateMomentum(10, 'Toutes les quêtes quotidiennes complétées!');
    }

    res.json({
      success: true,
      quest: db.prepare('SELECT * FROM quests WHERE id = ?').get(id),
      xp: xpResult,
      momentum: momentumResult,
      resources: resourceRewards,
      all_daily_completed: allDailyCompleted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quests/:id/subtask/:index — Toggle une sous-tâche
router.post('/:id/subtask/:index', (req, res) => {
  try {
    const { id, index } = req.params;
    const idx = parseInt(index);

    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(id);
    if (!quest) {
      return res.status(404).json({ error: 'Quête introuvable' });
    }

    const subTasks = quest.sub_tasks ? JSON.parse(quest.sub_tasks) : [];

    if (idx < 0 || idx >= subTasks.length) {
      return res.status(400).json({ error: 'Index de sous-tâche invalide' });
    }

    // Toggle la sous-tâche
    subTasks[idx].completed = !subTasks[idx].completed;

    db.prepare('UPDATE quests SET sub_tasks = ? WHERE id = ?')
      .run(JSON.stringify(subTasks), id);

    res.json({
      success: true,
      sub_tasks: subTasks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quests — Créer une quête personnalisée
router.post('/', (req, res) => {
  try {
    const { title, description, domain, type, xp_reward, difficulty, sub_tasks, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }

    // Formater les sous-tâches
    let formattedSubTasks = '[]';
    if (sub_tasks && Array.isArray(sub_tasks)) {
      formattedSubTasks = JSON.stringify(
        sub_tasks.map(st => ({
          title: typeof st === 'string' ? st : st.title,
          completed: false,
        }))
      );
    }

    const result = db.prepare(`
      INSERT INTO quests (title, description, domain, type, xp_reward, difficulty, status, sub_tasks, due_date)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      title,
      description || '',
      domain || 'mental',
      type || 'custom',
      xp_reward || 50,
      difficulty || 5,
      formattedSubTasks,
      due_date || null
    );

    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(result.lastInsertRowid);
    quest.sub_tasks = JSON.parse(quest.sub_tasks);

    res.status(201).json(quest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/quests/:id — Supprimer/annuler une quête
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(id);
    if (!quest) {
      return res.status(404).json({ error: 'Quête introuvable' });
    }

    db.prepare("UPDATE quests SET status = 'cancelled' WHERE id = ?").run(id);

    res.json({ success: true, message: `Quête "${quest.title}" annulée` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
