import express, { Request, Response } from 'express';
import http from 'node:http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PUZZLES } from './src/data/puzzles.ts';
import { LeaderboardEntry, PuzzleData } from './src/types.ts';

const puzzlesStore: PuzzleData[] = [...INITIAL_PUZZLES];

const leaderboardStore: Record<string, LeaderboardEntry[]> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', puzzlesCount: puzzlesStore.length });
  });

  // Get Today's Daily Puzzle
  app.get('/api/daily', (req: Request, res: Response) => {
    const todayPuzzle = puzzlesStore[0];
    res.json({
      success: true,
      puzzle: todayPuzzle,
    });
  });

  // Get All Puzzles / Archive
  app.get('/api/archive', (req: Request, res: Response) => {
    res.json({
      success: true,
      puzzles: puzzlesStore.map((p) => ({
        id: p.id,
        editionDate: p.editionDate,
        editionNumber: p.editionNumber,
        title: p.title,
        headline: p.headline,
        difficulty: p.difficulty,
        theme: p.theme,
        category: p.category,
      })),
    });
  });

  // Get Specific Puzzle
  app.get('/api/puzzle/:id', (req: Request, res: Response) => {
    const puzzle = puzzlesStore.find((p) => p.id === req.params.id);
    if (!puzzle) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }
    res.json({ success: true, puzzle });
  });

  // Get Leaderboard for a Puzzle
  app.get('/api/leaderboard', (req: Request, res: Response) => {
    const puzzleId = (req.query.puzzleId as string) || puzzlesStore[0].id;
    const entries = leaderboardStore[puzzleId] || [];

    // Sort by timeSeconds ascending, then hintsUsed ascending
    const sorted = [...entries].sort((a, b) => {
      if (a.timeSeconds !== b.timeSeconds) return a.timeSeconds - b.timeSeconds;
      return a.hintsUsed - b.hintsUsed;
    });

    res.json({
      success: true,
      puzzleId,
      totalEntries: sorted.length,
      leaderboard: sorted,
    });
  });

  // Submit Leaderboard Entry
  app.post('/api/leaderboard/submit', (req: Request, res: Response) => {
    const { puzzleId, codename, titleBadge, timeSeconds, timeFormatted, hintsUsed, accuracy, countryCode } = req.body;

    if (!puzzleId || !codename || typeof timeSeconds !== 'number') {
      return res.status(400).json({ error: 'Invalid submission data' });
    }

    if (!leaderboardStore[puzzleId]) {
      leaderboardStore[puzzleId] = [];
    }

    const newEntry: LeaderboardEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      puzzleId,
      codename: String(codename).trim().substring(0, 24) || 'Anonymous Sleuth',
      titleBadge: titleBadge || 'Codebreaker',
      timeSeconds: Number(timeSeconds),
      timeFormatted: timeFormatted || `${Math.floor(timeSeconds / 60)}:${(timeSeconds % 60).toFixed(1)}`,
      hintsUsed: Number(hintsUsed) || 0,
      accuracy: Math.min(100, Math.max(0, Number(accuracy) || 100)),
      countryCode: (countryCode || 'US').toUpperCase().substring(0, 2),
      timestamp: new Date().toISOString(),
      isToday: true,
    };

    leaderboardStore[puzzleId].push(newEntry);

    // Re-sort
    leaderboardStore[puzzleId].sort((a, b) => {
      if (a.timeSeconds !== b.timeSeconds) return a.timeSeconds - b.timeSeconds;
      return a.hintsUsed - b.hintsUsed;
    });

    const rank = leaderboardStore[puzzleId].findIndex((e) => e.id === newEntry.id) + 1;

    res.json({
      success: true,
      entry: newEntry,
      rank,
      totalRanked: leaderboardStore[puzzleId].length,
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Chronicle Cryptogram server running on http://localhost:${PORT}`);
  });
}

startServer();
