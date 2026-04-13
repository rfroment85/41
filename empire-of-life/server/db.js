// ═══════════════════════════════ BASE DE DONNÉES ═════════════════════════════
// Wrapper sql.js (pur JavaScript, pas de compilation native)
// API compatible better-sqlite3 pour que les routes n'aient pas à changer
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'empire.db');

// ─── Wrapper qui émule l'API better-sqlite3 au-dessus de sql.js ───
class DbWrapper {
  constructor(sqlDb) {
    this.sqlDb = sqlDb;
    this._saveTimer = null;
  }

  // Sauvegarde sur disque (debounced)
  _scheduleSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      try {
        const data = this.sqlDb.export();
        writeFileSync(dbPath, Buffer.from(data));
      } catch (e) {
        console.error('Erreur sauvegarde DB:', e.message);
      }
    }, 500);
  }

  // Sauvegarde immédiate
  saveNow() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    const data = this.sqlDb.export();
    writeFileSync(dbPath, Buffer.from(data));
  }

  // Exécuter du SQL brut (CREATE TABLE, etc.)
  exec(sql) {
    this.sqlDb.run(sql);
    this._scheduleSave();
  }

  // Préparer une requête (retourne un objet compatible better-sqlite3)
  prepare(sql) {
    const self = this;
    return {
      // Retourne une seule ligne comme objet
      get(...params) {
        try {
          const stmt = self.sqlDb.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            stmt.free();
            const row = {};
            for (let i = 0; i < cols.length; i++) row[cols[i]] = vals[i];
            return row;
          }
          stmt.free();
          return undefined;
        } catch (e) {
          console.error('DB get error:', sql, params, e.message);
          return undefined;
        }
      },

      // Retourne toutes les lignes comme tableau d'objets
      all(...params) {
        try {
          const results = [];
          const stmt = self.sqlDb.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          while (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const row = {};
            for (let i = 0; i < cols.length; i++) row[cols[i]] = vals[i];
            results.push(row);
          }
          stmt.free();
          return results;
        } catch (e) {
          console.error('DB all error:', sql, params, e.message);
          return [];
        }
      },

      // Exécuter une requête de modification (INSERT, UPDATE, DELETE)
      run(...params) {
        try {
          self.sqlDb.run(sql, params);
          self._scheduleSave();
          return {
            changes: self.sqlDb.getRowsModified(),
            lastInsertRowid: self._getLastInsertRowid(),
          };
        } catch (e) {
          console.error('DB run error:', sql, params, e.message);
          return { changes: 0, lastInsertRowid: 0 };
        }
      },
    };
  }

  _getLastInsertRowid() {
    try {
      const stmt = this.sqlDb.prepare('SELECT last_insert_rowid() as id');
      stmt.step();
      const id = stmt.get()[0];
      stmt.free();
      return id;
    } catch {
      return 0;
    }
  }

  // Transaction simplifiée
  transaction(fn) {
    const self = this;
    return function (...args) {
      self.sqlDb.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        self.sqlDb.run('COMMIT');
        self._scheduleSave();
        return result;
      } catch (e) {
        self.sqlDb.run('ROLLBACK');
        throw e;
      }
    };
  }

  // Pragma (no-op pour compatibilité)
  pragma() {}
}

// ─── Initialisation (synchrone via top-level await) ───
const SQL = await initSqlJs();

let sqlDb;
if (existsSync(dbPath)) {
  const buffer = readFileSync(dbPath);
  sqlDb = new SQL.Database(buffer);
} else {
  sqlDb = new SQL.Database();
}

const db = new DbWrapper(sqlDb);

// ─── Création des tables ────────────────────────────────────────────
db.exec(`
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

  CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER REFERENCES habits(id),
    date TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    value REAL,
    logged_at TEXT DEFAULT (datetime('now')),
    UNIQUE(habit_id, date)
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL UNIQUE,
    amount REAL DEFAULT 0,
    production_rate REAL DEFAULT 1.0
  );

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

  CREATE TABLE IF NOT EXISTS momentum_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value INTEGER NOT NULL,
    change_amount INTEGER,
    reason TEXT,
    logged_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS xp_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    detail TEXT,
    domain TEXT,
    multiplier REAL DEFAULT 1.0,
    logged_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS technologies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_number INTEGER NOT NULL UNIQUE,
    is_researched INTEGER DEFAULT 0,
    researched_at TEXT
  );

  CREATE TABLE IF NOT EXISTS virtue_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    virtue_id TEXT NOT NULL,
    date TEXT NOT NULL,
    practiced INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(virtue_id, date)
  );

  CREATE TABLE IF NOT EXISTS daily_law_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_year INTEGER NOT NULL,
    year INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at TEXT,
    UNIQUE(day_of_year, year)
  );

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

  CREATE TABLE IF NOT EXISTS hic_et_nunc_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    task_description TEXT,
    momentum_change INTEGER,
    xp_earned INTEGER,
    response_time_seconds INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_key TEXT NOT NULL UNIQUE,
    level INTEGER DEFAULT 1,
    built_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS domain_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    score INTEGER DEFAULT 50,
    mastery_phase TEXT DEFAULT 'apprentice',
    mastery_xp INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(domain)
  );

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

  CREATE TABLE IF NOT EXISTS focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT DEFAULT 'pomodoro',
    duration_minutes INTEGER DEFAULT 25,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    status TEXT DEFAULT 'active',
    quest_id INTEGER REFERENCES quests(id)
  );

  CREATE TABLE IF NOT EXISTS streak_shields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER REFERENCES habits(id),
    week_start TEXT,
    shields_remaining INTEGER DEFAULT 2,
    shields_used INTEGER DEFAULT 0,
    UNIQUE(habit_id, week_start)
  );
`);

// ─── Données initiales (seed) ───────────────────────────────────────
const userExists = db.prepare('SELECT COUNT(*) as count FROM user_profile').get();
if (!userExists || userExists.count === 0) {
  db.prepare(`
    INSERT INTO user_profile (id, name, avatar, age_current, xp_total, level, momentum, streak_days, best_streak, last_active_date, lifes_task)
    VALUES (1, 'Romain', '🧠', 1, 0, 1, 50, 0, 0, date('now'), 'Devenir la meilleure version de moi-même')
  `).run();
}

const resourceExists = db.prepare('SELECT COUNT(*) as count FROM resources').get();
if (!resourceExists || resourceExists.count === 0) {
  db.prepare('INSERT INTO resources (type, amount, production_rate) VALUES (?, ?, ?)').run('nourriture', 100, 1.0);
  db.prepare('INSERT INTO resources (type, amount, production_rate) VALUES (?, ?, ?)').run('bois', 100, 1.0);
  db.prepare('INSERT INTO resources (type, amount, production_rate) VALUES (?, ?, ?)').run('or', 100, 1.0);
  db.prepare('INSERT INTO resources (type, amount, production_rate) VALUES (?, ?, ?)').run('pierre', 100, 1.0);
}

const domainExists = db.prepare('SELECT COUNT(*) as count FROM domain_scores').get();
if (!domainExists || domainExists.count === 0) {
  const domains = ['sante', 'mental', 'social', 'spirituel', 'financier', 'creatif', 'environnement', 'loisirs'];
  for (const domain of domains) {
    db.prepare('INSERT INTO domain_scores (domain, score, mastery_phase, mastery_xp) VALUES (?, 50, ?, 0)').run(domain, 'apprentice');
  }
}

// Sauvegarde immédiate après le seed
db.saveNow();

console.log('✅ Base de données initialisée (sql.js — pur JavaScript)');

// ─── Exports ────────────────────────────────────────────────────────
export function initDb() { return db; }
export function getDb() { return db; }
export default db;
