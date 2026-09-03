export type Difficulty = 'Easy' | 'Hard' | 'Beginner' | 'Intermediate' | 'Master' | 'Historical';

export interface CipherSymbol {
  id: string; // Unique identifier (e.g., 'sym_1', 'sym_2')
  glyph: string; // Visual representation (e.g., '⊕', '◬', '◩', '⊞', '♈', etc.)
  name: string; // Readable name (e.g., 'Crosshairs', 'Eye Triangle', 'Half Box')
  category: 'zodiac' | 'geometric' | 'alchemical' | 'runic' | 'inverted';
}

export interface CryptogramWord {
  id: string;
  symbols: {
    symbolId: string;
    targetLetter: string; // 'A'-'Z'
    isPunctuation?: boolean;
    char?: string;
  }[];
}

export interface PuzzleData {
  id: string;
  editionNumber: number;
  title: string;
  headline: string;
  subheadline: string;
  authorOrSource: string;
  originalText: string;
  /** Legacy display copy. Play mode is `difficultyMode` or `puzzleMode()`. */
  difficulty: Difficulty;
  difficultyMode?: 'Easy' | 'Hard';
  editionSlot?: 'Morning' | 'Evening';
  theme: string;
  category: string;
  silhouette?: string;
  hints: {
    letter: string;
    clue: string;
  }[];
  yesterdayStats?: {
    date: string;
    title: string;
    originalQuote: string;
    decodedQuote: string;
    quickestSolveTime: number; // in seconds
    quickestSolverName: string;
    totalSolvers: number;
    solveRatePercentage: number;
    averageTimeSeconds: number;
    easyStats?: {
      quickestSolveTime: number;
      quickestSolverName: string;
      totalSolvers: number;
      solveRatePercentage: number;
    };
    hardStats?: {
      quickestSolveTime: number;
      quickestSolverName: string;
      totalSolvers: number;
      solveRatePercentage: number;
    };
  };
}

export interface LeaderboardEntry {
  id: string;
  puzzleId: string;
  codename: string;
  titleBadge: string; // e.g. 'Master Cryptanalyst', 'Inspector', 'Rookie Decryptor'
  timeSeconds: number; // in seconds
  timeFormatted: string; // '01:42.5'
  hintsUsed: number;
  accuracy: number; // 0-100%
  countryCode: string;
  timestamp: string;
  isToday?: boolean;
}

export type SymbolMapping = Record<string, string>;

export interface GameStats {
  puzzlesPlayed: number;
  puzzlesSolved: number;
  fastestTime: number | null;
  totalTimePlayed: number;
  averageAccuracy: number;
  leaderboardSubmissions: number;
}

export interface DailyHintWallet {
  edition: number;
  used: number;
  remaining: number;
}

export interface PuzzleProgress {
  mappings: SymbolMapping;
  timerSeconds: number;
  hintsUsed: number;
  hintsRemaining: number;
  hintedSymbolIds: string[];
  checksUsed: number;
  checksRemaining: number;
  verifiedSymbolIds: string[];
  flaggedSymbolIds: string[];
  selectedSymbolId: string | null;
  isSolved: boolean;
  updatedAt?: number;
}

export interface PuzzleLiveStats {
  puzzleId: string;
  startedCount: number;
  completeCount: number;
  totalTimeSeconds: number;
  fastestTime: number | null;
  fastestSolverName: string | null;
}
