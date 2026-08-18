import React, { useState } from 'react';
import { Award, Zap, Users, TrendingUp, ChevronDown, ChevronUp, FileText } from '../icons';
import { PuzzleData } from '../types';
import { formatTime } from '../utils/cipherEngine';
import { usePuzzleStats } from '../utils/usePuzzleStats';
import { derivePublicStats } from '../utils/firebaseStore';

interface YesterdayBulletinProps {
  yesterdayStats?: PuzzleData['yesterdayStats'];
  yesterdayPuzzleId?: string;
  onViewYesterdayPuzzle?: (difficulty?: 'Easy' | 'Hard') => void;
}

export const YesterdayBulletin: React.FC<YesterdayBulletinProps> = ({
  yesterdayStats,
  yesterdayPuzzleId,
  onViewYesterdayPuzzle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const liveStats = usePuzzleStats(yesterdayPuzzleId || '');
  const currentStats = derivePublicStats(yesterdayPuzzleId ? liveStats : null);

  if (!yesterdayStats && !yesterdayPuzzleId) return null;

  return (
    <section className="w-full bg-[#f6f1e6] border-2 border-stone-900 rounded-xs shadow-xs bg-scanned-doc overflow-hidden mb-2">
      {/* Newspaper Top Dispatch Ribbon */}
      <div className="bg-[#ebe4d4] text-stone-950 px-3 sm:px-4 py-1.5 flex items-center justify-between flex-wrap gap-2 text-xs font-typewriter border-b border-stone-400">
        <div className="flex items-center gap-2 font-bold tracking-wider">
          <span className="bg-[#d6c9b0] text-stone-950 px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-xs">
            YESTERDAY'S REPORT
          </span>
          <span className="text-stone-600">
            Official Solution Transcript & Solve Records
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex items-center gap-1 text-stone-950 hover:text-stone-700 font-semibold cursor-pointer font-typewriter text-xs"
        >
          <span>{isExpanded ? 'Hide Record' : 'View Record & Quote'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Stats Row */}
      <div className="p-2.5 sm:p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#fdfbf6] border-b border-stone-400">
        {/* Fastest Solve */}
        <div className="flex items-center gap-2 p-1.5 bg-[#f8f4ea] border border-stone-300 rounded-xs">
          <Zap className="w-4 h-4 text-amber-800 fill-amber-500 shrink-0" />
          <div className="overflow-hidden">
            <span className="block text-[9px] font-typewriter font-bold uppercase text-stone-700 truncate">
              Quickest Solve
            </span>
              <span className="text-sm sm:text-base font-typewriter font-bold text-stone-950">
                {liveStats.completeCount > 0 ? formatTime(currentStats.quickestSolveTime) : '—'}
              </span>
          </div>
        </div>

        {/* Total Codebreakers */}
        <div className="flex items-center gap-2 p-1.5 bg-[#f8f4ea] border border-stone-300 rounded-xs">
          <Users className="w-4 h-4 text-stone-800 shrink-0" />
          <div className="overflow-hidden">
            <span className="block text-[9px] font-typewriter font-bold uppercase text-stone-700 truncate">
              Total Solvers
            </span>
            <span className="text-sm sm:text-base font-typewriter font-bold text-stone-950">
              {currentStats.totalSolvers.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Solve Rate */}
        <div className="flex items-center gap-2 p-1.5 bg-[#f8f4ea] border border-stone-300 rounded-xs">
          <TrendingUp className="w-4 h-4 text-emerald-800 shrink-0" />
          <div className="overflow-hidden">
            <span className="block text-[9px] font-typewriter font-bold uppercase text-stone-700 truncate">
              Solve Rate
            </span>
            <span className="text-sm sm:text-base font-typewriter font-bold text-stone-950">
              {currentStats.solveRatePercentage}%
            </span>
          </div>
        </div>

        {/* Average Time */}
        <div className="flex items-center gap-2 p-1.5 bg-[#f8f4ea] border border-stone-300 rounded-xs">
          <Award className="w-4 h-4 text-stone-800 shrink-0" />
          <div className="overflow-hidden">
            <span className="block text-[9px] font-typewriter font-bold uppercase text-stone-700 truncate">
              Average Time
            </span>
              <span className="text-sm sm:text-base font-typewriter font-bold text-stone-950">
                {liveStats.completeCount > 0 ? formatTime(currentStats.averageTimeSeconds) : '—'}
              </span>
          </div>
        </div>
      </div>

      {/* Expanded Briefing with Decoded Solution Story */}
      {isExpanded && yesterdayStats && (
        <div className="p-3 sm:p-4 bg-[#f4ede0] text-stone-900 font-treatise space-y-2.5 border-t border-stone-400 text-sm">
          <div>
            <h3 className="font-headline font-black text-sm sm:text-base text-stone-950 uppercase">
              "{yesterdayStats.title}"
            </h3>
          </div>

          <div className="p-2.5 bg-[#fbf8f1] border-l-4 border-stone-900 border-t border-r border-b border-stone-400 rounded-r-xs font-typewriter text-xs sm:text-sm text-stone-950">
            <p className="leading-relaxed">"{yesterdayStats.decodedQuote}"</p>
          </div>

          {onViewYesterdayPuzzle && (
            <div className="flex items-center justify-end gap-2 pt-1 font-typewriter">
              <button
                onClick={() => onViewYesterdayPuzzle('Easy')}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-stone-950 font-typewriter font-bold text-xs rounded-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Play Yesterday's Puzzle</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
