// ─── Routes Hic Et Nunc — mécanique anti-procrastination ────────────────
// "Fais-le ici et maintenant." — Sénèque
import { Router } from 'express';
import db from '../db.js';
import { awardXP, updateMomentum } from '../services/gameEngine.js';

const router = Router();

// POST /api/hic-et-nunc — Logger une action
// Types : 'act_now' (agir immédiatement), 'capture' (noter pour plus tard), 'delay' (reporter)
router.post('/', (req, res) => {
  try {
    const { type, description, response_time_seconds } = req.body;

    if (!type || !['act_now', 'capture', 'delay'].includes(type)) {
      return res.status(400).json({
        error: "Type d'action invalide. Valeurs acceptées: 'act_now', 'capture', 'delay'",
      });
    }

    let momentumChange = 0;
    let xpAmount = 0;
    let message = '';

    switch (type) {
      case 'act_now':
        // Action immédiate — gros bonus, c'est le comportement désiré
        xpAmount = 30;
        momentumChange = 10;
        message = '⚡ Hic Et Nunc ! Action immédiate — le momentum est avec vous, Sire !';
        break;

      case 'capture':
        // Capturer pour plus tard — petit bonus (mieux que rien)
        xpAmount = 5;
        momentumChange = 2;
        message = '📝 Capturé ! Cette idée est en sécurité. Vous y reviendrez au moment opportun.';
        break;

      case 'delay':
        // Reporter — pas de pénalité immédiate (anti-culpabilité TDAH)
        // Mais on enregistre pour créer une taxe d'activation future
        xpAmount = 0;
        momentumChange = 0;
        message = '⏰ Noté. Pas de pression — quand vous serez prêt, Sire.';
        break;
    }

    // Attribuer l'XP si applicable
    let xpResult = null;
    if (xpAmount > 0) {
      xpResult = awardXP(xpAmount, 'hic_et_nunc', `${type}: ${description || ''}`, null);
    }

    // Mettre à jour le momentum si applicable
    let momentumResult = null;
    if (momentumChange > 0) {
      momentumResult = updateMomentum(momentumChange, `hic_et_nunc_${type}`);
    }

    // Enregistrer l'action dans la table
    db.prepare(`
      INSERT INTO hic_et_nunc_actions (action_type, task_description, momentum_change, xp_earned, response_time_seconds)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      type,
      description || '',
      momentumChange,
      xpResult ? xpResult.xp_awarded : 0,
      response_time_seconds || 0
    );

    res.json({
      success: true,
      action_type: type,
      momentum_change: momentumChange,
      xp: xpResult,
      momentum: momentumResult,
      message,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hic-et-nunc/stats — Statistiques d'actions immédiates vs retardées
router.get('/stats', (req, res) => {
  try {
    // Stats globales
    const total = db.prepare('SELECT COUNT(*) as count FROM hic_et_nunc_actions').get();

    const byType = db.prepare(`
      SELECT
        action_type,
        COUNT(*) as count,
        SUM(xp_earned) as total_xp,
        SUM(momentum_change) as total_momentum
      FROM hic_et_nunc_actions
      GROUP BY action_type
    `).all();

    // Stats des 7 derniers jours
    const recentByType = db.prepare(`
      SELECT
        action_type,
        COUNT(*) as count,
        SUM(xp_earned) as total_xp
      FROM hic_et_nunc_actions
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY action_type
    `).all();

    // Stats par jour (7 derniers jours)
    const dailyBreakdown = db.prepare(`
      SELECT
        date(created_at) as date,
        action_type,
        COUNT(*) as count
      FROM hic_et_nunc_actions
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at), action_type
      ORDER BY date ASC
    `).all();

    // Taux d'action immédiate
    const actNow = byType.find(t => t.action_type === 'act_now')?.count || 0;
    const immediateRate = total.count > 0 ? Math.round((actNow / total.count) * 100) : 0;

    // Temps de réponse moyen pour act_now
    const avgResponseTime = db.prepare(`
      SELECT AVG(response_time_seconds) as avg_time
      FROM hic_et_nunc_actions
      WHERE action_type = 'act_now' AND response_time_seconds > 0
    `).get();

    // Actions reportées récentes (taxe d'activation potentielle)
    const pendingDelays = db.prepare(`
      SELECT COUNT(*) as count
      FROM hic_et_nunc_actions
      WHERE action_type = 'delay'
      AND created_at >= datetime('now', '-7 days')
    `).get();

    // Actions capturées récentes (en attente de traitement)
    const pendingCaptures = db.prepare(`
      SELECT * FROM hic_et_nunc_actions
      WHERE action_type = 'capture'
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    res.json({
      total_actions: total.count,
      by_type: byType,
      recent_by_type: recentByType,
      daily_breakdown: dailyBreakdown,
      immediate_rate: immediateRate,
      avg_response_time_seconds: avgResponseTime?.avg_time || 0,
      pending_delays: pendingDelays.count,
      pending_captures: pendingCaptures,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
