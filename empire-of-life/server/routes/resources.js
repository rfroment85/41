// ─── Routes des ressources (trésor impérial) ────────────────────────────
import { Router } from 'express';
import db from '../db.js';
import { calculateResourceProduction } from '../services/gameEngine.js';

const router = Router();

// GET /api/resources — Toutes les ressources avec montants et taux de production
router.get('/', (req, res) => {
  try {
    const resources = db.prepare('SELECT * FROM resources').all();
    const profile = db.prepare('SELECT age_current, streak_days, momentum FROM user_profile WHERE id = 1').get();
    const buildingCount = db.prepare('SELECT COUNT(*) as count FROM buildings').get().count;

    // Calculer les multiplicateurs actuels pour chaque ressource
    const enrichedResources = resources.map(r => {
      const production = calculateResourceProduction(r.type, 10);
      return {
        ...r,
        effective_production: production.success ? production.total_production : 0,
        multipliers: production.success ? production.multipliers : null,
      };
    });

    res.json({
      resources: enrichedResources,
      context: {
        age: profile.age_current,
        streak: profile.streak_days,
        momentum: profile.momentum,
        buildings: buildingCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resources/produce — Déclencher la production de ressources
router.post('/produce', (req, res) => {
  try {
    const { resource_type, base_amount, reason } = req.body;

    if (!resource_type) {
      return res.status(400).json({ error: 'Le type de ressource est requis' });
    }

    const resource = db.prepare('SELECT * FROM resources WHERE type = ?').get(resource_type);
    if (!resource) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }

    // Calculer la production avec tous les multiplicateurs
    const production = calculateResourceProduction(resource_type, base_amount || 10);

    if (!production.success) {
      return res.status(500).json({ error: 'Erreur de calcul de production' });
    }

    // Ajouter les ressources produites
    db.prepare('UPDATE resources SET amount = amount + ? WHERE type = ?')
      .run(production.total_production, resource_type);

    // Récupérer l'état mis à jour
    const updated = db.prepare('SELECT * FROM resources WHERE type = ?').get(resource_type);

    res.json({
      success: true,
      resource: updated,
      produced: production.total_production,
      multipliers: production.multipliers,
      reason: reason || 'Production manuelle',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resources/spend — Dépenser des ressources (construction/recherche)
router.post('/spend', (req, res) => {
  try {
    const { costs } = req.body;

    // costs = [{ type: 'bois', amount: 50 }, { type: 'pierre', amount: 30 }]
    if (!costs || !Array.isArray(costs) || costs.length === 0) {
      return res.status(400).json({ error: 'Les coûts sont requis (tableau de {type, amount})' });
    }

    // Vérifier que toutes les ressources sont suffisantes
    const insufficients = [];
    for (const cost of costs) {
      const resource = db.prepare('SELECT * FROM resources WHERE type = ?').get(cost.type);
      if (!resource) {
        return res.status(404).json({ error: `Ressource inconnue: ${cost.type}` });
      }
      if (resource.amount < cost.amount) {
        insufficients.push({
          type: cost.type,
          required: cost.amount,
          available: resource.amount,
          deficit: cost.amount - resource.amount,
        });
      }
    }

    if (insufficients.length > 0) {
      return res.status(400).json({
        error: 'Ressources insuffisantes',
        insufficients,
      });
    }

    // Dépenser les ressources (transaction)
    const spendAll = db.transaction(() => {
      for (const cost of costs) {
        db.prepare('UPDATE resources SET amount = amount - ? WHERE type = ?')
          .run(cost.amount, cost.type);
      }
    });
    spendAll();

    // Récupérer l'état mis à jour
    const updatedResources = db.prepare('SELECT * FROM resources').all();

    res.json({
      success: true,
      spent: costs,
      resources: updatedResources,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
