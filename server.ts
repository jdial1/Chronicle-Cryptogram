import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { INITIAL_PUZZLES } from './src/data/puzzles.ts';
import { LeaderboardEntry, PuzzleData } from './src/types.ts';

dotenv.config();

// In-memory persistent database for leaderboard and dynamic puzzles
const puzzlesStore: PuzzleData[] = [...INITIAL_PUZZLES];

const leaderboardStore: Record<string, LeaderboardEntry[]> = {};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Generate Custom / AI Cipher with Gemini
  app.post('/api/generate-ai-cipher', async (req: Request, res: Response) => {
    try {
      const { theme = 'Vintage True Crime Mystery', difficulty = 'Intermediate', customPrompt } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback procedural puzzle generation if API key is not yet set
        const customId = `custom_${Date.now()}`;
        const fallbackPuzzle: PuzzleData = {
          id: customId,
          editionDate: new Date().toISOString().split('T')[0],
          editionNumber: 500 + Math.floor(Math.random() * 500),
          title: `SPECIAL DISPATCH — ${theme.toUpperCase()}`,
          headline: 'THE MIDNIGHT CIPHER CONFESSION',
          subheadline: 'An intercepted clandestine dispatch waiting to be cracked.',
          authorOrSource: 'Anonymous Informant',
          originalText: 'NOTHING ESCAPES THE VIGILANT EYE OF THE CIPHER DETECTIVE IN THE DEAD OF NIGHT.',
          difficulty: difficulty as any,
          theme,
          category: 'AI Generated',
          hints: [
            { letter: 'E', clue: 'The most frequent letter in the English language.' },
            { letter: 'T', clue: 'Forms common words like THE and NIGHT.' },
          ],
        };
        puzzlesStore.push(fallbackPuzzle);
        return res.json({ success: true, puzzle: fallbackPuzzle });
      }

      const promptText = `
You are a master cryptographer and 1960s-1970s vintage newspaper editor for "Chronicle Cryptogram" (inspired by historical mysterious Zodiac cipher dispatches, Bletchley Park, and espionage).

Generate a captivating, authentic cryptogram puzzle in valid JSON format.
The theme is: "${theme}".
Difficulty: "${difficulty}".
${customPrompt ? `Special instructions: ${customPrompt}` : ''}

Requirements:
1. "originalText": A compelling sentence or quote between 60 and 150 characters long in ALL-CAPS, standard English with common letters. Only letters A-Z and basic punctuation (periods, commas, apostrophes). No numbers.
2. "headline": An exciting 1960s sensational vintage newspaper front-page headline (ALL-CAPS).
3. "subheadline": A short news dispatch summary explaining where this coded message was discovered.
4. "authorOrSource": The fictitious source or investigator.
5. "hints": Array of 2 to 3 clue objects: { "letter": "E", "clue": "..." }.

Return ONLY valid JSON matching this exact structure:
{
  "headline": "STRING",
  "subheadline": "STRING",
  "authorOrSource": "STRING",
  "originalText": "STRING",
  "hints": [
    { "letter": "STRING", "clue": "STRING" }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      const generatedId = `ai_${Date.now()}`;
      const newPuzzle: PuzzleData = {
        id: generatedId,
        editionDate: new Date().toISOString().split('T')[0],
        editionNumber: 500 + Math.floor(Math.random() * 400),
        title: `SPECIAL AI DISPATCH — NO. ${generatedId.slice(-4)}`,
        headline: parsed.headline || 'CRYPTIC DISPATCH DISCOVERED IN OLD VAULT',
        subheadline: parsed.subheadline || 'A secret coded message has surfaced.',
        authorOrSource: parsed.authorOrSource || 'Bureau of Cryptographic Analysis',
        originalText: (parsed.originalText || 'THE SECRET TO CRACKING ANY CODE IS PERSISTENCE AND OBSERVATION').toUpperCase(),
        difficulty: difficulty as any,
        theme,
        category: 'AI Generated',
        hints: parsed.hints || [
          { letter: 'E', clue: 'Most common English vowel.' },
          { letter: 'T', clue: 'Pairs often with H and E.' },
        ],
      };

      puzzlesStore.push(newPuzzle);

      res.json({
        success: true,
        puzzle: newPuzzle,
      });
    } catch (error: any) {
      console.error('Error generating AI cipher:', error);
      res.status(500).json({ error: error.message || 'Failed to generate AI cryptogram' });
    }
  });

  // AI Detective Hint Assistant
  app.post('/api/gemini-hint', async (req: Request, res: Response) => {
    try {
      const { puzzleText, currentMappings, requestedLetter } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          hint: `Cryptanalyst Advice: Look for single-letter words or common 3-letter words like "THE", "AND", or "FOR" to find high-frequency consonants!`,
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `
You are a sharp 1960s newspaper cryptanalyst consultant helping a player crack a Zodiac-style cryptogram.
The target quote is: "${puzzleText}"
The player currently has mapped these letters: ${JSON.stringify(currentMappings || {})}
${requestedLetter ? `The player specifically wants guidance on letter: "${requestedLetter}"` : 'Give a clever, deductive clue (like word patterns, vowel frequencies, or letter combinations) without giving away the entire solution.'}

Write a short, engaging 1-2 sentence vintage detective-style hint.
`,
      });

      res.json({
        hint: response.text?.trim() || 'Focus on repeating letter patterns and short two-letter grammatical words.',
      });
    } catch (err: any) {
      res.json({
        hint: 'Analyze the most frequent symbols — in English, E, T, A, O, I, N appear most often!',
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chronicle Cryptogram server running on http://localhost:${PORT}`);
  });
}

startServer();
