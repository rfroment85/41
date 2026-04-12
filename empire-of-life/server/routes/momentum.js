// ─── Routes du momentum ─────────────────────────────────────────────────
import { Router } from 'express';
import db from '../db.js';
import { updateMomentum, applyMomentumDecay } from '../services/gameEngine.js';

const router = Router();

// GET /api/momentum — Momentum actuel + historique (7 derniers jours)
router.get('/', (req, res) => {
  try {
    const profile = db.prepare('SELECT momentum, last_active_date FROM user_profile WHERE id = 1').get();
    if (!profile) {
      return res.status(404).json({ error: 'Profil introuvable' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Appliquer la décroissance pour les jours manqués
    if (profile.last_active_date && profile.last_active_date < today) {
      const lastActive = new Date(profile.last_active_date);
      const now = new Date(today);
      const daysMissed = Math.floor((now - lastActive) / 86400000);

      if (daysMissed > 0) {
        applyMomentumDecay(daysMissed);
        // Mettre à jour la date d'activité
        db.prepare("UPDATE user_profile SET last_active_date = ? WHERE id = 1").run(today);
      }
    }

    // Récupérer le momentum mis à jour
    const updatedProfile = db.prepare('SELECT momentum FROM user_profile WHERE id = 1').get();

    // Historique des 7 derniers jours
    const history = db.prepare(`
      SELECT * FROM momentum_logs
      ORDER BY logged_at DESC
      LIMIT 50
    `).all();

    // Agréger par jour pour les 7 derniers jours
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const dailyHistory = db.prepare(`
      SELECT date(logged_at) as date,
        MAX(value) as max_value,
        MIN(value) as min_value,
        SUM(change_amount) as total_change
      FROM momentum_logs
      WHERE date(logged_at) >= ?
      GROUP BY date(logged_at)
      ORDER BY date DESC
    `).all(sevenDaysAgo);

    // Déterminer le statut de la jauge
    let status;
    const momentum = updatedProfile.momentum;
    if (momentum >= 80) status = 'flamme'; // En feu !
    else if (momentum >= 60) status = 'fort'; // Bon rythme
    else if (momentum >= 40) status = 'stable'; // Stable
    else if (momentum >= 20) status = 'faible'; // Attention
    else status = 'critique'; // Danger !

    res.json({
      current: momentum,
      status,
      history: dailyHistory,
      recent_changes: history.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/momentum/action — Logger une action qui affecte le momentum
router.post('/action', (req, res) => {
  try {
    const { type, amount, reason } = req.body;

    if (amount === undefined || !reason) {
      return res.status(400).json({ error: 'Le montant et la raison sont requis' });
    }

    // Limiter les changements individuels
    const clampedAmount = Math.max(-50, Math.min(50, amount));

    const result = updateMomentum(clampedAmount, reason);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
