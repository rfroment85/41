// ─── Routes de philosophie (Daily Laws, Vertus, Arbre Technologique) ────
import { Router } from 'express';
import db from '../db.js';
import { awardXP, updateMomentum } from '../services/gameEngine.js';

const router = Router();

// ─── Les 48 Lois du Pouvoir (arbre technologique) ──────────────────────
const LAWS_OF_POWER = [
  { number: 1, title: 'Ne surpassez jamais le maître', domain: 'social', cost: { bois: 50, or: 30 }, effect: 'Social +5%' },
  { number: 2, title: 'Ne vous fiez pas trop à vos amis', domain: 'social', cost: { bois: 60, or: 40 }, effect: 'Perspicacité sociale' },
  { number: 3, title: 'Dissimulez vos intentions', domain: 'mental', cost: { or: 80 }, effect: 'Mental +5%' },
  { number: 4, title: 'Dites-en toujours moins que nécessaire', domain: 'social', cost: { bois: 40, or: 20 }, effect: 'Communication +5%' },
  { number: 5, title: 'Protégez votre réputation', domain: 'social', cost: { pierre: 100 }, effect: 'Défense sociale' },
  { number: 6, title: 'Attirez l\'attention', domain: 'creatif', cost: { or: 60, bois: 40 }, effect: 'Créatif +5%' },
  { number: 7, title: 'Laissez le travail aux autres', domain: 'financier', cost: { or: 100 }, effect: 'Productivité +10%' },
  { number: 8, title: 'Faites venir les autres à vous', domain: 'social', cost: { nourriture: 80, or: 50 }, effect: 'Influence +5%' },
  { number: 9, title: 'Gagnez par vos actes', domain: 'mental', cost: { bois: 70, pierre: 50 }, effect: 'Crédibilité +5%' },
  { number: 10, title: 'Évitez les malheureux', domain: 'mental', cost: { or: 40, bois: 30 }, effect: 'Mental +3%' },
  { number: 11, title: 'Rendez-vous indispensable', domain: 'financier', cost: { or: 120, pierre: 80 }, effect: 'Financier +10%' },
  { number: 12, title: 'Désarmez par la générosité', domain: 'social', cost: { nourriture: 100, or: 60 }, effect: 'Social +8%' },
  { number: 13, title: 'Faites appel à l\'intérêt', domain: 'financier', cost: { or: 80, bois: 40 }, effect: 'Négociation +5%' },
  { number: 14, title: 'Posez-vous en ami, agissez en espion', domain: 'mental', cost: { or: 90 }, effect: 'Intelligence +5%' },
  { number: 15, title: 'Écrasez totalement l\'ennemi', domain: 'mental', cost: { pierre: 120, bois: 80 }, effect: 'Résolution +10%' },
  { number: 16, title: 'Utilisez l\'absence', domain: 'social', cost: { or: 50 }, effect: 'Mystère +5%' },
  { number: 17, title: 'Cultivez l\'imprévisibilité', domain: 'creatif', cost: { or: 70, bois: 50 }, effect: 'Créatif +5%' },
  { number: 18, title: 'Ne construisez pas de forteresses', domain: 'social', cost: { pierre: 80, bois: 60 }, effect: 'Adaptabilité +5%' },
  { number: 19, title: 'Sachez à qui vous avez affaire', domain: 'social', cost: { or: 60, nourriture: 40 }, effect: 'Jugement +5%' },
  { number: 20, title: 'Ne vous engagez envers personne', domain: 'mental', cost: { or: 100 }, effect: 'Liberté +5%' },
  { number: 21, title: 'Jouez au plus bête', domain: 'mental', cost: { or: 40, bois: 30 }, effect: 'Ruse +5%' },
  { number: 22, title: 'Transformez la faiblesse en force', domain: 'mental', cost: { pierre: 80, or: 60 }, effect: 'Résilience +10%' },
  { number: 23, title: 'Concentrez vos forces', domain: 'mental', cost: { nourriture: 100, bois: 80 }, effect: 'Focus +10%' },
  { number: 24, title: 'Soyez un parfait courtisan', domain: 'social', cost: { or: 110, nourriture: 70 }, effect: 'Diplomatie +8%' },
  { number: 25, title: 'Recréez-vous', domain: 'spirituel', cost: { or: 150, pierre: 100 }, effect: 'Transformation +15%' },
  { number: 26, title: 'Gardez les mains propres', domain: 'mental', cost: { or: 80, bois: 50 }, effect: 'Image +5%' },
  { number: 27, title: 'Créez un culte', domain: 'social', cost: { or: 200, nourriture: 100 }, effect: 'Charisme +15%' },
  { number: 28, title: 'Agissez avec audace', domain: 'mental', cost: { bois: 60, pierre: 40 }, effect: 'Audace +10%' },
  { number: 29, title: 'Planifiez jusqu\'à la fin', domain: 'mental', cost: { or: 90, bois: 60 }, effect: 'Stratégie +10%' },
  { number: 30, title: 'Donnez l\'impression de facilité', domain: 'creatif', cost: { or: 70, nourriture: 50 }, effect: 'Élégance +5%' },
  { number: 31, title: 'Contrôlez les options', domain: 'financier', cost: { or: 130, pierre: 80 }, effect: 'Contrôle +10%' },
  { number: 32, title: 'Jouez avec les fantasmes', domain: 'creatif', cost: { or: 80, bois: 50 }, effect: 'Vision +5%' },
  { number: 33, title: 'Découvrez le point faible', domain: 'mental', cost: { or: 100, nourriture: 60 }, effect: 'Perspicacité +8%' },
  { number: 34, title: 'Soyez royal', domain: 'spirituel', cost: { or: 160, pierre: 100 }, effect: 'Présence +10%' },
  { number: 35, title: 'Maîtrisez l\'art du timing', domain: 'mental', cost: { or: 120, bois: 80 }, effect: 'Timing +15%' },
  { number: 36, title: 'Méprisez ce que vous ne pouvez avoir', domain: 'spirituel', cost: { or: 60, nourriture: 40 }, effect: 'Détachement stoïcien +10%' },
  { number: 37, title: 'Créez des spectacles', domain: 'creatif', cost: { or: 100, bois: 70 }, effect: 'Impact +8%' },
  { number: 38, title: 'Pensez comme vous voulez', domain: 'spirituel', cost: { or: 80, pierre: 50 }, effect: 'Indépendance +10%' },
  { number: 39, title: 'Agitez les eaux', domain: 'mental', cost: { or: 70, nourriture: 50 }, effect: 'Provocation +5%' },
  { number: 40, title: 'Méprisez le repas gratuit', domain: 'financier', cost: { or: 90, bois: 60 }, effect: 'Valeur +8%' },
  { number: 41, title: 'Évitez de marcher dans les pas d\'un grand homme', domain: 'creatif', cost: { or: 110, pierre: 70 }, effect: 'Originalité +10%' },
  { number: 42, title: 'Frappez le berger', domain: 'mental', cost: { pierre: 100, bois: 80 }, effect: 'Efficacité +10%' },
  { number: 43, title: 'Travaillez sur le cœur et l\'esprit', domain: 'social', cost: { or: 140, nourriture: 90 }, effect: 'Empathie +10%' },
  { number: 44, title: 'Effet miroir', domain: 'mental', cost: { or: 100, bois: 70 }, effect: 'Adaptation +8%' },
  { number: 45, title: 'Prêchez le changement', domain: 'spirituel', cost: { or: 120, pierre: 80 }, effect: 'Innovation +10%' },
  { number: 46, title: 'Ne soyez jamais trop parfait', domain: 'social', cost: { or: 60, nourriture: 40 }, effect: 'Humanité +5%' },
  { number: 47, title: 'N\'allez pas trop loin', domain: 'mental', cost: { or: 80, bois: 50 }, effect: 'Mesure +8%' },
  { number: 48, title: 'Soyez informe', domain: 'spirituel', cost: { or: 200, pierre: 150 }, effect: 'Maîtrise totale +20%' },
];

// ─── Les 13 Vertus de Benjamin Franklin ─────────────────────────────────
const VIRTUES = [
  { id: 'temperance', name: 'Tempérance', description: 'Ne mange pas jusqu\'à la torpeur. Ne bois pas jusqu\'à l\'ivresse.' },
  { id: 'silence', name: 'Silence', description: 'Ne dis rien qui ne profite à autrui ou à toi-même. Évite les conversations insignifiantes.' },
  { id: 'order', name: 'Ordre', description: 'Que chaque chose ait sa place. Que chaque affaire ait son temps.' },
  { id: 'resolution', name: 'Résolution', description: 'Résous de faire ce que tu dois. Fais sans faillir ce que tu as résolu.' },
  { id: 'frugality', name: 'Frugalité', description: 'Ne dépense que pour faire du bien aux autres ou à toi-même.' },
  { id: 'industry', name: 'Industrie', description: 'Ne perds pas de temps. Sois toujours occupé à quelque chose d\'utile.' },
  { id: 'sincerity', name: 'Sincérité', description: 'N\'use d\'aucune tromperie nuisible. Pense innocemment et justement.' },
  { id: 'justice', name: 'Justice', description: 'Ne nuis à personne. Ne manque pas aux bienfaits qui sont de ton devoir.' },
  { id: 'moderation', name: 'Modération', description: 'Évite les extrêmes. Garde-toi de ressentir les injures autant qu\'elles le méritent.' },
  { id: 'cleanliness', name: 'Propreté', description: 'Ne souffre aucune malpropreté du corps, des vêtements ou de la demeure.' },
  { id: 'tranquility', name: 'Tranquillité', description: 'Ne te tracasse pas pour des riens ou des accidents ordinaires ou inévitables.' },
  { id: 'chastity', name: 'Chasteté', description: 'Discipline personnelle et maîtrise de soi.' },
  { id: 'humility', name: 'Humilité', description: 'Imite Jésus et Socrate.' },
];

// ─── Mini-défis quotidiens (Daily Laws) ─────────────────────────────────
const DAILY_CHALLENGES = [
  'Pratique 5 minutes de méditation silencieuse',
  'Écris 3 choses pour lesquelles tu es reconnaissant',
  'Fais un acte de gentillesse anonyme',
  'Lis une page de Marc Aurèle ou Sénèque',
  'Reste 1 heure sans téléphone',
  'Fais 20 pompes ou squats',
  'Apprends un mot nouveau dans une langue étrangère',
  'Organise un tiroir ou un espace de travail',
  'Écris une lettre de gratitude (même non envoyée)',
  'Mange un repas en pleine conscience',
  'Complimente sincèrement quelqu\'un',
  'Prends une douche froide de 30 secondes',
  'Marche 15 minutes dehors sans distraction',
  'Écris tes 3 priorités pour demain',
  'Fais un don ou aide quelqu\'un',
  'Abstiens-toi de te plaindre pendant 24h',
  'Enseigne quelque chose à quelqu\'un',
  'Fais quelque chose qui te fait peur',
  'Pardonne à quelqu\'un (intérieurement)',
  'Passe du temps dans la nature',
  'Désencombre un espace numérique (emails, apps)',
  'Pratique l\'écoute active dans une conversation',
  'Jeûne d\'un repas par choix conscient',
  'Visualise ta journée idéale pendant 5 minutes',
  'Fais un exercice de respiration (4-7-8)',
  'Refuse poliment une demande non-essentielle',
  'Tiens ta parole sur un engagement pris',
  'Fais un examen de conscience de 10 minutes',
  'Agis avec audace sur une tâche reportée (Loi 28)',
  'Planifie ta semaine en détail (Loi 29)',
  'Observe sans juger pendant 10 minutes',
];

// ─── Routes ─────────────────────────────────────────────────────────────

// GET /api/philosophy/daily-law — Loi du jour (basée sur le jour de l'année)
router.get('/daily-law', (req, res) => {
  try {
    const today = new Date();
    const dayOfYear = getDayOfYear(today);
    const year = today.getFullYear();

    // Sélectionner une loi basée sur le jour (cycle de 48)
    const lawIndex = (dayOfYear - 1) % 48;
    const law = LAWS_OF_POWER[lawIndex];

    // Sélectionner un mini-défi basé sur le jour (cycle de 31)
    const challengeIndex = (dayOfYear - 1) % DAILY_CHALLENGES.length;
    const challenge = DAILY_CHALLENGES[challengeIndex];

    // Vérifier si le défi a été complété aujourd'hui
    const completion = db.prepare(
      'SELECT * FROM daily_law_completions WHERE day_of_year = ? AND year = ?'
    ).get(dayOfYear, year);

    // Vérifier si la loi a été recherchée
    const tech = db.prepare(
      'SELECT * FROM technologies WHERE law_number = ?'
    ).get(law.number);

    res.json({
      day_of_year: dayOfYear,
      law: {
        ...law,
        is_researched: tech ? !!tech.is_researched : false,
      },
      challenge: {
        text: challenge,
        completed: completion ? !!completion.completed : false,
        completed_at: completion?.completed_at || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/philosophy/daily-law/complete — Marquer le mini-défi comme complété
router.post('/daily-law/complete', (req, res) => {
  try {
    const today = new Date();
    const dayOfYear = getDayOfYear(today);
    const year = today.getFullYear();

    // Vérifier si déjà complété
    const existing = db.prepare(
      'SELECT * FROM daily_law_completions WHERE day_of_year = ? AND year = ?'
    ).get(dayOfYear, year);

    if (existing && existing.completed) {
      return res.json({
        success: false,
        message: 'Le défi du jour a déjà été complété',
        already_completed: true,
      });
    }

    if (existing) {
      db.prepare(`
        UPDATE daily_law_completions
        SET completed = 1, completed_at = datetime('now')
        WHERE day_of_year = ? AND year = ?
      `).run(dayOfYear, year);
    } else {
      db.prepare(`
        INSERT INTO daily_law_completions (day_of_year, year, completed, completed_at)
        VALUES (?, ?, 1, datetime('now'))
      `).run(dayOfYear, year);
    }

    // Attribuer l'XP pour le défi quotidien
    const xpResult = awardXP(35, 'daily_law', 'Défi quotidien complété', 'spirituel');
    const momentumResult = updateMomentum(5, 'Défi quotidien complété');

    res.json({
      success: true,
      xp: xpResult,
      momentum: momentumResult,
      message: 'Défi quotidien complété ! L\'Empereur progresse dans la sagesse.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/philosophy/virtue — Vertu de la semaine courante
router.get('/virtue', (req, res) => {
  try {
    const today = new Date();
    const weekOfYear = getWeekOfYear(today);
    const todayStr = today.toISOString().split('T')[0];

    // Sélectionner la vertu de la semaine (cycle de 13)
    const virtueIndex = (weekOfYear - 1) % VIRTUES.length;
    const virtue = VIRTUES[virtueIndex];

    // Vérifier le log de pratique pour aujourd'hui
    const todayLog = db.prepare(
      'SELECT * FROM virtue_logs WHERE virtue_id = ? AND date = ?'
    ).get(virtue.id, todayStr);

    // Compter les jours de pratique cette semaine
    const weekStart = getWeekStartDate(today);
    const weekLogs = db.prepare(`
      SELECT COUNT(*) as practiced_days FROM virtue_logs
      WHERE virtue_id = ? AND date >= ? AND practiced = 1
    `).get(virtue.id, weekStart);

    res.json({
      week_of_year: weekOfYear,
      virtue: {
        ...virtue,
        practiced_today: todayLog ? !!todayLog.practiced : false,
        notes_today: todayLog?.notes || null,
        practiced_days_this_week: weekLogs.practiced_days,
      },
      all_virtues: VIRTUES,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/philosophy/virtue/log — Logger la pratique d'une vertu
router.post('/virtue/log', (req, res) => {
  try {
    const { virtue_id, practiced, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (!virtue_id) {
      return res.status(400).json({ error: "L'identifiant de la vertu est requis" });
    }

    // Vérifier que la vertu existe
    const virtue = VIRTUES.find(v => v.id === virtue_id);
    if (!virtue) {
      return res.status(404).json({ error: 'Vertu inconnue' });
    }

    // Créer ou mettre à jour le log
    const existing = db.prepare(
      'SELECT * FROM virtue_logs WHERE virtue_id = ? AND date = ?'
    ).get(virtue_id, today);

    const isPracticed = practiced !== undefined ? (practiced ? 1 : 0) : 1;

    if (existing) {
      db.prepare(`
        UPDATE virtue_logs
        SET practiced = ?, notes = ?
        WHERE virtue_id = ? AND date = ?
      `).run(isPracticed, notes || existing.notes, virtue_id, today);
    } else {
      db.prepare(`
        INSERT INTO virtue_logs (virtue_id, date, practiced, notes)
        VALUES (?, ?, ?, ?)
      `).run(virtue_id, today, isPracticed, notes || null);
    }

    // Attribuer l'XP si pratiquée et pas encore loggée
    let xpResult = null;
    if (isPracticed && !existing?.practiced) {
      xpResult = awardXP(15, 'virtue', `Vertu pratiquée: ${virtue.name}`, 'spirituel');
    }

    res.json({
      success: true,
      virtue_id,
      practiced: !!isPracticed,
      notes: notes || null,
      xp: xpResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/philosophy/tech-tree — Arbre technologique complet avec statut de recherche
router.get('/tech-tree', (req, res) => {
  try {
    // Récupérer toutes les technologies recherchées
    const researched = db.prepare('SELECT * FROM technologies WHERE is_researched = 1').all();
    const researchedNumbers = new Set(researched.map(t => t.law_number));

    // Enrichir les lois avec le statut de recherche
    const techTree = LAWS_OF_POWER.map(law => ({
      ...law,
      is_researched: researchedNumbers.has(law.number),
      researched_at: researched.find(t => t.law_number === law.number)?.researched_at || null,
    }));

    // Statistiques
    const totalResearched = researched.length;
    const totalLaws = LAWS_OF_POWER.length;
    const progressPercent = Math.floor((totalResearched / totalLaws) * 100);

    res.json({
      tech_tree: techTree,
      stats: {
        researched: totalResearched,
        total: totalLaws,
        progress_percent: progressPercent,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/philosophy/tech-tree/:lawNumber/research — Rechercher une loi
router.post('/tech-tree/:lawNumber/research', (req, res) => {
  try {
    const lawNumber = parseInt(req.params.lawNumber);

    // Trouver la loi
    const law = LAWS_OF_POWER.find(l => l.number === lawNumber);
    if (!law) {
      return res.status(404).json({ error: 'Loi introuvable' });
    }

    // Vérifier si déjà recherchée
    const existing = db.prepare(
      'SELECT * FROM technologies WHERE law_number = ? AND is_researched = 1'
    ).get(lawNumber);

    if (existing) {
      return res.json({
        success: false,
        message: 'Cette loi a déjà été recherchée',
        already_researched: true,
      });
    }

    // Vérifier les coûts
    const insufficients = [];
    for (const [resourceType, amount] of Object.entries(law.cost)) {
      const resource = db.prepare('SELECT * FROM resources WHERE type = ?').get(resourceType);
      if (!resource || resource.amount < amount) {
        insufficients.push({
          type: resourceType,
          required: amount,
          available: resource?.amount || 0,
        });
      }
    }

    if (insufficients.length > 0) {
      return res.status(400).json({
        error: 'Ressources insuffisantes pour cette recherche',
        insufficients,
        cost: law.cost,
      });
    }

    // Dépenser les ressources et rechercher la loi (transaction)
    const researchTransaction = db.transaction(() => {
      // Dépenser
      for (const [resourceType, amount] of Object.entries(law.cost)) {
        db.prepare('UPDATE resources SET amount = amount - ? WHERE type = ?')
          .run(amount, resourceType);
      }

      // Rechercher
      const existingTech = db.prepare('SELECT * FROM technologies WHERE law_number = ?').get(lawNumber);
      if (existingTech) {
        db.prepare(`
          UPDATE technologies SET is_researched = 1, researched_at = datetime('now')
          WHERE law_number = ?
        `).run(lawNumber);
      } else {
        db.prepare(`
          INSERT INTO technologies (law_number, is_researched, researched_at)
          VALUES (?, 1, datetime('now'))
        `).run(lawNumber);
      }
    });
    researchTransaction();

    // Attribuer l'XP pour la recherche
    const xpResult = awardXP(100, 'tech_research', `Loi ${lawNumber} recherchée: ${law.title}`, law.domain);
    const momentumResult = updateMomentum(10, `Nouvelle loi maîtrisée: ${law.title}`);

    // Mettre à jour le score du domaine
    db.prepare(`
      UPDATE domain_scores SET score = MIN(100, score + 2), updated_at = datetime('now')
      WHERE domain = ?
    `).run(law.domain);

    // Récupérer les ressources mises à jour
    const updatedResources = db.prepare('SELECT * FROM resources').all();

    res.json({
      success: true,
      law: { ...law, is_researched: true },
      xp: xpResult,
      momentum: momentumResult,
      remaining_resources: updatedResources,
      effect: law.effect,
      message: `Loi ${lawNumber} maîtrisée: "${law.title}" — ${law.effect}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Fonctions utilitaires ──────────────────────────────────────────────

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getWeekOfYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getWeekStartDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

export default router;
