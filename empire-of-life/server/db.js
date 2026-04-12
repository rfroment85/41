// Base de données SQLite — configuration et schéma complet
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'empire.db');
const db = new Database(dbPath);

// Activer le mode WAL pour de meilleures performances
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Création des tables ───────────────────────────────────────────

db.exec(`
  -- Profil utilisateur
  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT DEFAULT 'Romain',
    avatar TEXT DEFAULT '🧠',
    age_current INTEGER DEFAULT 1,
    xp_total INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    momentum INTEGER DEFAULT 50,
    streak_days INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_active_date TEXT,
    lifes_task TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Habitudes
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    frequency TEXT DEFAULT 'daily',
    type TEXT DEFAULT 'boolean',
    target_value REAL,
    xp_reward INTEGER DEFAULT 20,
    streak_current INTEGER DEFAULT 0,
    streak_best INTEGER DEFAULT 0,
    streak_shields_remaining INTEGER DEFAULT 2,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Logs d'habitudes
  CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER REFERENCES habits(id),
    date TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    value REAL,
    logged_at TEXT DEFAULT (datetime('now')),
    UNIQUE(habit_id, date)
  );

  -- Ressources
  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL UNIQUE,
    amount REAL DEFAULT 0,
    production_rate REAL DEFAULT 1.0
  );

  -- Quêtes actives
  CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    domain TEXT,
    type TEXT DEFAULT 'daily',
    xp_reward INTEGER DEFAULT 50,
    difficulty INTEGER DEFAULT 5,
    status TEXT DEFAULT 'active',
    sub_tasks TEXT,
    due_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
  );

  -- Logs de momentum
  CREATE TABLE IF NOT EXISTS momentum_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value INTEGER NOT NULL,
    change_amount INTEGER,
    reason TEXT,
    logged_at TEXT DEFAULT (datetime('now'))
  );

  -- Historique XP
  CREATE TABLE IF NOT EXISTS xp_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    detail TEXT,
    domain TEXT,
    multiplier REAL DEFAULT 1.0,
    logged_at TEXT DEFAULT (datetime('now'))
  );

  -- Technologies (48 Lois du Pouvoir)
  CREATE TABLE IF NOT EXISTS technologies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_number INTEGER NOT NULL UNIQUE,
    is_researched INTEGER DEFAULT 0,
    researched_at TEXT
  );

  -- Vertus stoïciennes
  CREATE TABLE IF NOT EXISTS virtue_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    virtue_id TEXT NOT NULL,
    date TEXT NOT NULL,
    practiced INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(virtue_id, date)
  );

  -- Complétion des Daily Laws
  CREATE TABLE IF NOT EXISTS daily_law_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_year INTEGER NOT NULL,
    year INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at TEXT,
    UNIQUE(day_of_year, year)
  );

  -- Rituels stoïciens (matin/soir)
  CREATE TABLE IF NOT EXISTS rituals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    focus_domain TEXT,
    obstacle TEXT,
    response TEXT,
    accomplishments TEXT,
    stumbles TEXT,
    lesson TEXT,
    mood INTEGER,
    logged_at TEXT DEFAULT (datetime('now')),
    UNIQUE(type, date)
  );

  -- Actions Hic Et Nunc
  CREATE TABLE IF NOT EXISTS hic_et_nunc_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    task_description TEXT,
    momentum_change INTEGER,
    xp_earned INTEGER,
    response_time_seconds INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Bâtiments construits
  CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_key TEXT NOT NULL UNIQUE,
    level INTEGER DEFAULT 1,
    built_at TEXT DEFAULT (datetime('now'))
  );

  -- Scores par domaine (Roue de la Vie)
  CREATE TABLE IF NOT EXISTS domain_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    score INTEGER DEFAULT 50,
    mastery_phase TEXT DEFAULT 'apprentice',
    mastery_xp INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(domain)
  );

  -- Raids (événements aléatoires)
  CREATE TABLE IF NOT EXISTS raids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity INTEGER DEFAULT 5,
    status TEXT DEFAULT 'active',
    strategy_used TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
  );

  -- Sessions de focus (Pomodoro/Hyperfocus)
  CREATE TABLE IF NOT EXISTS focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT DEFAULT 'pomodoro',
    duration_minutes INTEGER DEFAULT 25,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    status TEXT DEFAULT 'active',
    quest_id INTEGER REFERENCES quests(id)
  );

  -- Boucliers de streak
  CREATE TABLE IF NOT EXISTS streak_shields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER REFERENCES habits(id),
    week_start TEXT,
    shields_remaining INTEGER DEFAULT 2,
    shields_used INTEGER DEFAULT 0,
    UNIQUE(habit_id, week_start)
  );
`);

// ─── Données initiales (seed) ──────────────────────────────────────

// Profil par défaut
const userExists = db.prepare('SELECT COUNT(*) as count FROM user_profile').get();
if (userExists.count === 0) {
  db.prepare(`
    INSERT INTO user_profile (id, name, avatar, age_current, xp_total, level, momentum, streak_days, best_streak, last_active_date, lifes_task)
    VALUES (1, 'Romain', '🧠', 1, 0, 1, 50, 0, 0, date('now'), 'Devenir la meilleure version de moi-même')
  `).run();
}

// Ressources initiales
const resourceExists = db.prepare('SELECT COUNT(*) as count FROM resources').get();
if (resourceExists.count === 0) {
  const insertResource = db.prepare('INSERT INTO resources (type, amount, production_rate) VALUES (?, ?, ?)');
  const seedResources = db.transaction(() => {
    insertResource.run('nourriture', 100, 1.0);
    insertResource.run('bois', 100, 1.0);
    insertResource.run('or', 100, 1.0);
    insertResource.run('pierre', 100, 1.0);
  });
  seedResources();
}

// Scores des 8 domaines de la Roue de la Vie
const domainExists = db.prepare('SELECT COUNT(*) as count FROM domain_scores').get();
if (domainExists.count === 0) {
  const insertDomain = db.prepare('INSERT INTO domain_scores (domain, score, mastery_phase, mastery_xp) VALUES (?, 50, ?, 0)');
  const domains = [
    'sante',        // Santé & Fitness
    'mental',       // Mental & Apprentissage
    'social',       // Social & Relations
    'spirituel',    // Spirituel & Purpose
    'financier',    // Financier & Carrière
    'creatif',      // Créatif & Projets
    'environnement', // Environnement & Ordre
    'loisirs'       // Loisirs & Fun
  ];
  const seedDomains = db.transaction(() => {
    for (const domain of domains) {
      insertDomain.run(domain, 'apprentice');
    }
  });
  seedDomains();
}

// ─── Fonction d'init (appelée par index.js au démarrage) ───
export function initDb() {
  // Les tables et seeds sont déjà créées au chargement du module
  // Cette fonction sert de point d'entrée explicite
  return db;
}

// ─── Accessor (utilisé par les routes) ───
export function getDb() {
  return db;
}

export default db;
