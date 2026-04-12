// ═══════════════════════════════ EMPIRE OF LIFE — SERVEUR ═════════════════════
// Point d'entrée Express — API backend pour le jeu de gestion de vie
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Importer la base de données (initialise les tables au chargement)
import db from './db.js';

// Importer les routes
import profileRoutes from './routes/profile.js';
import habitsRoutes from './routes/habits.js';
import momentumRoutes from './routes/momentum.js';
import questsRoutes from './routes/quests.js';
import ritualsRoutes from './routes/rituals.js';
import xpRoutes from './routes/xp.js';
import gameMasterRoutes from './routes/gameMaster.js';
import resourcesRoutes from './routes/resources.js';
import philosophyRoutes from './routes/philosophy.js';
import hicEtNuncRoutes from './routes/hicEtNunc.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes API ──────────────────────────────────────────────────────────
app.use('/api/profile', profileRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/momentum', momentumRoutes);
app.use('/api/quests', questsRoutes);
app.use('/api/rituals', ritualsRoutes);
app.use('/api/xp', xpRoutes);
app.use('/api/game-master', gameMasterRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/philosophy', philosophyRoutes);
app.use('/api/hic-et-nunc', hicEtNuncRoutes);

// ─── Route de santé ──────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', name: 'Empire of Life' });
});

// ─── Démarrage du serveur ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🏰 Empire of Life — Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
});
