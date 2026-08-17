import React from 'react';
import { Zap, Users, TrendingUp, Award, Lock, Unlock } from 'lucide-react';
import { formatTime } from '../utils/cipherEngine';
import { PuzzleData } from '../types';

interface TodayStatsBulletinProps {
  currentPuzzle: PuzzleData;
  timerSeconds: number;
  onUnlockHardMode?: () => void;
  isHardUnlocked?: boolean;
}

export const TodayStatsBulletin: React.FC<TodayStatsBulletinProps> = ({
  currentPuzzle,
  timerSeconds,
  onUnlockHardMode,
  isHardUnlocked,
}) => {
  // Generate some semi-stable fake stats for today based on the puzzle ID
  const isHard = currentPuzzle.difficultyMode === 'Hard' || currentPuzzle.difficulty === 'Hard';
  const baseSolvers = isHard ? 890 : 1290;
  const baseRate = isHard ? 88.5 : 96.1;
  const baseAvg = isHard ? 214 : 108;
  const baseQuick = isHard ? 74.2 : 42.1;

  const currentStats = {
    quickestSolveTime: baseQuick,
    totalSolvers: baseSolvers + Math.floor(timerSeconds % 10),
    solveRatePercentage: baseRate,
    averageTimeSeconds: baseAvg,
  };

  return (
    <section className="w-full bg-[#fdfbf6] border-2 border-stone-900 rounded-xs shadow-xs bg-scanned-doc overflow-hidden mt-4 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-stone-900 text-[#f7f3e8] px-3 sm:px-4 py-1.5 flex items-center justify-between flex-wrap gap-2 text-xs font-typewriter">
        <div className="flex items-center gap-2 font-bold tracking-wider">
          <span className="bg-amber-500 text-stone-950 px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-xs">
            LIVE STATISTICS
          </span>
          <span className="text-amber-100 uppercase">
            Global Solves — {currentPuzzle.editionDate}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 border-b border-stone-400">
        <p className="font-treatise text-sm sm:text-base text-stone-900 leading-relaxed mb-3">
          <strong>Congratulations, Codebreaker.</strong> You have successfully decrypted today's {isHard ? 'Hard' : 'Easy'} edition cipher in <span className="font-typewriter font-bold bg-amber-200 px-1">{formatTime(timerSeconds)}</span>. Your time has been recorded in the national ledger.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="flex items-center gap-2 p-1.5 bg-[#f8f4ea] border border-stone-300 rounded-xs">
            <Zap className="w-4 h-4 text-amber-800 fill-amber-500 shrink-0" />
            <div className="overflow-hidden">
              <span className="block text-[9px] font-typewriter font-bold uppercase text-stone-600 truncate">
                Quickest Solve
              </span>
              <span className="text-sm sm:text-base font-typewriter font-bold text-stone-950">
                {formatTime(currentStats.quickestSolveTime)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-[#f8f4ea] border border-stone-300 rounded-xs">
            <Users className="w-4 h-4 text-stone-800 shrink-0" />
            <div className="overflow-hidden">
              <span className="block text-[9px] font-typewriter font-bold uppercase text-stone-600 truncate">
                Total Solvers
              </span>
              <span className="text-sm sm:text-base font-typewriter font-bold text-stone-950">
                {currentStats.totalSolvers.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-[#f8f4ea] border border-stone-300 rounded-xs">
            <TrendingUp className="w-4 h-4 text-emerald-800 shrink-0" />
            <div className="overflow-hidden">
              <span className="block text-[9px] font-typewriter font-bold uppercase text-stone-600 truncate">
                Solve Rate
              </span>
              <span className="text-sm sm:text-base font-typewriter font-bold text-stone-950">
                {currentStats.solveRatePercentage}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-[#f8f4ea] border border-stone-300 rounded-xs">
            <Award className="w-4 h-4 text-stone-800 shrink-0" />
            <div className="overflow-hidden">
              <span className="block text-[9px] font-typewriter font-bold uppercase text-stone-600 truncate">
                Average Time
              </span>
              <span className="text-sm sm:text-base font-typewriter font-bold text-stone-950">
                {formatTime(currentStats.averageTimeSeconds)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isHard && onUnlockHardMode && (
        <div className="p-3 sm:p-4 bg-[#f4ede0] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {isHardUnlocked ? (
              <Unlock className="w-5 h-5 text-emerald-700" />
            ) : (
              <Lock className="w-5 h-5 text-amber-700" />
            )}
            <div>
              <span className="block font-typewriter font-bold text-stone-950 text-sm">
                HARD EDITION {isHardUnlocked ? 'UNLOCKED' : 'AVAILABLE'}
              </span>
              <span className="block font-treatise text-stone-700 text-xs mt-0.5">
                The Bureau has authorized your access to the homophonic suppression variant.
              </span>
            </div>
          </div>
          <button
            onClick={onUnlockHardMode}
            className="px-4 py-2 bg-stone-950 hover:bg-stone-800 text-amber-100 font-typewriter font-bold text-xs uppercase rounded-xs cursor-pointer shadow-xs transition-colors whitespace-nowrap"
          >
            Play Hard Edition
          </button>
        </div>
      )}
    </section>
  );
};
