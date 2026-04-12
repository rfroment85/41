// ─── Routes du Game Master (IA Claude) ──────────────────────────────────
import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db.js';

const router = Router();

// Initialiser le client Anthropic (utilise ANTHROPIC_API_KEY depuis l'env)
const anthropic = new Anthropic();

// ─── Prompt système complet du Game Master ──────────────────────────────
const SYSTEM_PROMPT = `Tu es le **Game Master** de "Empire of Life", un jeu de gamification de vie réelle inspiré d'Age of Empires 2, des 48 Lois du Pouvoir de Robert Greene, et du Stoïcisme.

## Ton rôle
Tu es un narrateur épique, stratège bienveillant et mentor stoïcien. Tu t'adresses au joueur comme à un empereur construisant son empire personnel. Tu dois être:
- **Motivant** sans être toxiquement positif — reconnaître les difficultés est une force
- **Stratégique** — donner des conseils actionnables inspirés des 48 Lois et du Stoïcisme
- **Immersif** — utiliser le vocabulaire médiéval/impérial d'Age of Empires 2
- **TDAH-friendly** — messages courts, bullet points, actions concrètes, pas de murs de texte
- **Stoïcien** — rappeler les principes: ce qui dépend de nous vs ce qui ne dépend pas, amor fati, memento mori, premeditatio malorum

## Vocabulaire et ton
- Le joueur est "l'Empereur" ou "Sire"
- Les habitudes sont des "entraînements de troupes"
- Les quêtes sont des "missions impériales"
- Le momentum est la "Moral des troupes"
- Les domaines de vie sont des "provinces de l'Empire"
- Compléter des habitudes = "renforcer les défenses"
- L'XP = "points de gloire"
- Monter de niveau = "promotion impériale"
- Le streak = "jours de règne ininterrompu"
- Les ressources = "trésor impérial"

## Les 4 Âges (comme AoE2)
1. **Âge Sombre** (Niveau 1-9) — Survie, fondations, premières habitudes
2. **Âge Féodal** (Niveau 10-24) — Structure, routine, expansion
3. **Âge des Châteaux** (Niveau 25-49) — Maîtrise, complexité, ambition
4. **Âge Impérial** (Niveau 50+) — Domination, leadership, héritage

## Principes de narration
1. **Briefing du matin** : Inspirer l'action immédiate. Rappeler les quêtes du jour. Citer une loi de Greene ou un stoïcien. Court et percutant.
2. **Débriefing du soir** : Reconnaître les victoires. Analyser les défaites sans jugement. Tirer la leçon stoïcienne. Préparer demain.
3. **Narration d'événements** : Level up = fanfare épique. Raid = alerte dramatique. Quête complétée = récompense héroïque. Streak = honneur du guerrier.
4. **Chat libre** : Répondre en tant que Game Master — toujours dans le personnage, toujours utile.

## Références stoïciennes clés
- Marc Aurèle : discipline, journaling, devoir
- Épictète : ce qui dépend de nous, résilience
- Sénèque : usage du temps, memento mori
- Caton : intégrité, persévérance

## Références Greene clés
- Loi 28 : Entrer en action avec audace
- Loi 35 : Maîtriser l'art du timing
- Loi 25 : Se recréer soi-même
- Loi 29 : Planifier jusqu'à la fin

## Format de réponse
- Toujours en français
- Utiliser des emojis stratégiquement (⚔️🏰👑🔥🛡️📜)
- Messages de 150-300 mots maximum
- Inclure toujours une action concrète à faire MAINTENANT
- Terminer par une citation inspirante (Greene, stoïcien, ou originale)`;

/**
 * Construire le contexte du joueur pour l'IA
 */
function buildPlayerContext() {
  const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  const resources = db.prepare('SELECT * FROM resources').all();
  const domains = db.prepare('SELECT * FROM domain_scores').all();
  const today = new Date().toISOString().split('T')[0];

  const activeQuests = db.prepare(
    "SELECT * FROM quests WHERE status = 'active' AND (type = 'daily' OR due_date >= ?)"
  ).all(today);

  const todayHabits = db.prepare(`
    SELECT h.title, h.domain, h.streak_current,
      hl.completed as today_completed
    FROM habits h
    LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
    WHERE h.is_active = 1
  `).all(today);

  const recentXP = db.prepare(
    'SELECT SUM(amount) as total FROM xp_logs WHERE date(logged_at) = ?'
  ).get(today);

  const morningRitual = db.prepare(
    "SELECT * FROM rituals WHERE type = 'morning' AND date = ?"
  ).get(today);

  return `
## État actuel de l'Empire
- **Empereur**: ${profile.name} | Niveau ${profile.level} | Âge ${profile.age_current}
- **XP Total**: ${profile.xp_total} | XP aujourd'hui: ${recentXP?.total || 0}
- **Momentum**: ${profile.momentum}/100
- **Streak**: ${profile.streak_days} jours (record: ${profile.best_streak})
- **Mission de vie**: ${profile.lifes_task || 'Non définie'}

## Ressources
${resources.map(r => `- ${r.type}: ${r.amount}`).join('\n')}

## Provinces (Domaines)
${domains.map(d => `- ${d.domain}: Score ${d.score}/100 (${d.mastery_phase})`).join('\n')}

## Habitudes du jour
${todayHabits.map(h => `- ${h.today_completed ? '✅' : '⬜'} ${h.title} (${h.domain}) — streak: ${h.streak_current}`).join('\n') || 'Aucune habitude configurée'}

## Quêtes actives
${activeQuests.map(q => `- [${q.status}] ${q.title} (${q.domain || 'général'}) — ${q.xp_reward}XP`).join('\n') || 'Aucune quête active'}

## Rituel du matin
${morningRitual ? `Complété — Focus: ${morningRitual.focus_domain || 'N/A'}` : 'Non complété'}
`;
}

/**
 * Appeler Claude avec le contexte du joueur
 */
async function callClaude(userMessage, additionalContext = '') {
  const playerContext = buildPlayerContext();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `${playerContext}\n\n${additionalContext}\n\n${userMessage}`,
      },
    ],
  });

  return response.content[0].text;
}

// POST /api/game-master/briefing — Briefing du matin
router.post('/briefing', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dayOfYear = getDayOfYear(new Date());

    const additionalContext = `Date du jour: ${today} (jour ${dayOfYear} de l'année)`;

    const message = await callClaude(
      `Génère le briefing du matin pour l'Empereur.
      Rappelle-lui ses quêtes du jour, motive-le pour commencer la journée,
      et inclus une référence à une Loi de Greene ou une citation stoïcienne pertinente.
      Sois concis et percutant — c'est le matin, il faut de l'énergie et de la clarté.`,
      additionalContext
    );

    res.json({
      type: 'briefing',
      message,
      date: today,
    });
  } catch (err) {
    console.error('Erreur Game Master briefing:', err);
    res.status(500).json({
      error: 'Erreur lors de la génération du briefing',
      detail: err.message,
    });
  }
});

// POST /api/game-master/debrief — Débriefing du soir
router.post('/debrief', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Récupérer les accomplissements du jour
    const todayXP = db.prepare(
      'SELECT SUM(amount) as total, COUNT(*) as actions FROM xp_logs WHERE date(logged_at) = ?'
    ).get(today);

    const completedQuests = db.prepare(
      "SELECT * FROM quests WHERE status = 'completed' AND date(completed_at) = ?"
    ).all(today);

    const completedHabits = db.prepare(`
      SELECT h.title FROM habits h
      JOIN habit_logs hl ON h.id = hl.habit_id
      WHERE hl.date = ? AND hl.completed = 1
    `).all(today);

    const eveningRitual = db.prepare(
      "SELECT * FROM rituals WHERE type = 'evening' AND date = ?"
    ).get(today);

    const additionalContext = `
## Bilan du jour
- XP gagné: ${todayXP?.total || 0} en ${todayXP?.actions || 0} actions
- Quêtes complétées: ${completedQuests.length}
- Habitudes complétées: ${completedHabits.map(h => h.title).join(', ') || 'Aucune'}
${eveningRitual ? `- Rituel du soir: mood ${eveningRitual.mood}/10` : '- Rituel du soir: non fait'}
${eveningRitual?.stumbles ? `- Difficultés: ${eveningRitual.stumbles}` : ''}
${eveningRitual?.lesson ? `- Leçon: ${eveningRitual.lesson}` : ''}
`;

    const message = await callClaude(
      `Génère le débriefing du soir pour l'Empereur.
      Analyse sa journée, reconnaît ses victoires, identifie les axes d'amélioration,
      et prépare-le pour demain avec sagesse stoïcienne.
      Ton bienveillant mais honnête.`,
      additionalContext
    );

    res.json({
      type: 'debrief',
      message,
      date: today,
      stats: {
        xp_earned: todayXP?.total || 0,
        quests_completed: completedQuests.length,
        habits_completed: completedHabits.length,
      },
    });
  } catch (err) {
    console.error('Erreur Game Master debrief:', err);
    res.status(500).json({
      error: 'Erreur lors de la génération du débriefing',
      detail: err.message,
    });
  }
});

// POST /api/game-master/narrate — Narrer un événement spécifique
router.post('/narrate', async (req, res) => {
  try {
    const { event_type, details } = req.body;

    if (!event_type) {
      return res.status(400).json({ error: "Le type d'événement est requis" });
    }

    const eventPrompts = {
      level_up: `L'Empereur vient de monter au niveau ${details?.level || '?'}!
        Génère une annonce de promotion impériale épique et courte.
        Titre: ${details?.title || 'inconnu'}`,
      quest_complete: `L'Empereur vient de compléter la quête "${details?.quest_title || 'inconnue'}"!
        XP gagné: ${details?.xp || 0}. Génère une annonce de victoire.`,
      age_advance: `L'Empereur avance à l'${details?.age_name || 'âge suivant'}!
        C'est un événement MAJEUR. Génère une narration épique digne d'Age of Empires 2.`,
      raid: `Un raid de type "${details?.raid_type || 'inconnu'}" menace l'Empire!
        Sévérité: ${details?.severity || 5}/10. Description: ${details?.description || ''}.
        Génère une alerte dramatique et propose une stratégie.`,
      streak_milestone: `L'Empereur maintient un streak de ${details?.streak || 0} jours!
        Génère un message d'honneur pour ce guerrier discipliné.`,
      momentum_critical: `Le moral des troupes est critique (${details?.momentum || 0}/100)!
        Génère un message d'urgence bienveillant pour remotiver l'Empereur.`,
    };

    const prompt = eventPrompts[event_type] ||
      `Narre l'événement suivant: ${event_type}. Détails: ${JSON.stringify(details || {})}`;

    const message = await callClaude(prompt);

    res.json({
      type: 'narration',
      event_type,
      message,
    });
  } catch (err) {
    console.error('Erreur Game Master narrate:', err);
    res.status(500).json({
      error: "Erreur lors de la narration de l'événement",
      detail: err.message,
    });
  }
});

// POST /api/game-master/chat — Chat libre avec le Game Master
router.post('/chat', async (req, res) => {
  try {
    const { message: userMessage } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'Le message est requis' });
    }

    const response = await callClaude(userMessage);

    res.json({
      type: 'chat',
      message: response,
    });
  } catch (err) {
    console.error('Erreur Game Master chat:', err);
    res.status(500).json({
      error: 'Erreur lors de la communication avec le Game Master',
      detail: err.message,
    });
  }
});

// ─── Utilitaires ────────────────────────────────────────────────────────

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export default router;
