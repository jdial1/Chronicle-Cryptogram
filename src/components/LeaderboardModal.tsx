import React, { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { Trophy, Search, Shield, RefreshCw, Send, CheckCircle } from '../icons';
import { GoogleDeskButton } from './Header';
import { DeskActionDock } from './DeskActionDock';
import { DeskModal } from './DeskModal';
import { LeaderboardEntry, PuzzleData } from '../types';
import { readStoredCodename, writeStoredCodename } from '../utils/solverDisplayName';
import { fetchLeaderboard, submitLeaderboardEntry } from '../utils/firebaseStore';
import { logDesk, toUserMessage } from '../utils/deskError';
import { matchesMode } from '../utils/edition';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPuzzleId: string;
  currentPuzzleTitle: string;
  puzzles: PuzzleData[];
  user?: User | null;
  onSignIn?: () => void;
  currentSolveStats?: {
    timeSeconds: number;
    timeFormatted: string;
    hintsUsed: number;
    accuracy: number;
  } | null;
  onScoreSubmitted?: () => void;
}

const TITLE_BADGES = [
  'Grandmaster Cryptanalyst',
  'Senior Bureau Inspector',
  'Broadsheet Cipher Breaker',
  'Codebreaker Specialist',
  'Field Operative',
  'Cadet Decryptor',
];

const REGION_NAMES = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
const COUNTRIES = Array.from({ length: 676 }, (_, n) =>
  String.fromCharCode(65 + Math.floor(n / 26), 65 + (n % 26))
)
  .flatMap((code) => {
    const name = REGION_NAMES.of(code);
    return name ? [{ code, name }] : [];
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

function findPuzzleId(puzzles: PuzzleData[], edition: number, mode: 'Easy' | 'Hard') {
  return puzzles.find((puzzle) => puzzle.editionNumber === edition && matchesMode(puzzle, mode))?.id;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentPuzzleId,
  currentPuzzleTitle,
  puzzles,
  user,
  onSignIn,
  currentSolveStats,
  onScoreSubmitted,
}) => {
  const currentPuzzle = puzzles.find((puzzle) => puzzle.id === currentPuzzleId);
  const edition = currentPuzzle?.editionNumber ?? puzzles[0]?.editionNumber ?? 0;
  const previousEdition = edition - 1;
  const tabIds = useMemo(
    () => ({
      today_easy: findPuzzleId(puzzles, edition, 'Easy') || currentPuzzleId,
      today_hard: findPuzzleId(puzzles, edition, 'Hard') || currentPuzzleId,
      today_easy_prev: previousEdition >= 1 ? findPuzzleId(puzzles, previousEdition, 'Easy') : undefined,
      today_hard_prev: previousEdition >= 1 ? findPuzzleId(puzzles, previousEdition, 'Hard') : undefined,
    }),
    [puzzles, edition, previousEdition, currentPuzzleId]
  );

  const [activeTab, setActiveTab] = useState<string>(() =>
    currentPuzzleId.includes('hard') ? 'today_hard' : 'today_easy'
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [codename, setCodename] = useState(() => readStoredCodename());
  const [selectedBadge, setSelectedBadge] = useState(TITLE_BADGES[0]);
  const [countryCode, setCountryCode] = useState('US');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionRank, setSubmissionRank] = useState<number | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadBoard = async () => {
    setIsLoading(true);
    setBoardError(null);
    try {
      const targetId = tabIds[activeTab as keyof typeof tabIds] || currentPuzzleId;
      if (!targetId) {
        setLeaderboard([]);
        return;
      }
      setLeaderboard(await fetchLeaderboard(targetId));
    } catch (e) {
      logDesk('leaderboard-fetch', e);
      setBoardError(toUserMessage(e, 'The standings could not be fetched.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBoard();
    }
  }, [isOpen, activeTab, tabIds]);

  useEffect(() => {
    if (user?.displayName && !codename) {
      setCodename(user.displayName.slice(0, 20));
    }
  }, [user, codename]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codename.trim() || !currentSolveStats || isSubmitting || !user) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      writeStoredCodename(codename.trim());
      const { rank } = await submitLeaderboardEntry(user.uid, {
        puzzleId: currentPuzzleId,
        codename: codename.trim(),
        titleBadge: selectedBadge,
        timeSeconds: currentSolveStats.timeSeconds,
        timeFormatted: currentSolveStats.timeFormatted,
        hintsUsed: currentSolveStats.hintsUsed,
        accuracy: currentSolveStats.accuracy,
        countryCode,
      });
      setHasSubmitted(true);
      setSubmissionRank(rank);
      loadBoard();
      if (onScoreSubmitted) onScoreSubmitted();
    } catch (err) {
      logDesk('leaderboard-submit', err);
      setSubmitError(toUserMessage(err, 'The bureau would not take that posting.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEntries = leaderboard.filter(
    (entry) =>
      entry.codename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.countryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.titleBadge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DeskModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="leaderboard-title"
      title="Global Codebreaker Leaderboard"
      subtitle={
        <p className="modal-tagline text-xs font-mono-code text-stone-600 truncate">
          {currentPuzzleTitle}
        </p>
      }
      icon={<Trophy className="w-5 h-5 fill-current shrink-0" />}
      sheetClassName="max-w-3xl"
    >
        {/* Tab Selection */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[var(--paper-masthead)] border-b border-stone-400 gap-2 flex-wrap text-xs font-mono-code">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setActiveTab('today_easy')}
              className={`desk-hit inline-flex items-center px-2.5 py-1 font-bold rounded-xs transition-colors cursor-pointer ${
                activeTab === 'today_easy'
                  ? 'bg-emerald-700 text-[#f7f3e8] shadow-xs'
                  : 'bg-[#fdfbf6] text-stone-800 hover:bg-stone-200 border border-stone-400'
              }`}
            >
              ☀️ This Edition Easy (#428-A)
            </button>
            <button
              onClick={() => setActiveTab('today_hard')}
              className={`desk-hit inline-flex items-center px-2.5 py-1 font-bold rounded-xs transition-colors cursor-pointer ${
                activeTab === 'today_hard'
                  ? 'bg-amber-800 text-[#f7f3e8] shadow-xs'
                  : 'bg-[#fdfbf6] text-stone-800 hover:bg-stone-200 border border-stone-400'
              }`}
            >
              🌙 This Edition Hard (#428-B)
            </button>
            {tabIds.today_easy_prev && (
              <button
                onClick={() => setActiveTab('today_easy_prev')}
                className={`desk-hit inline-flex items-center px-2.5 py-1 font-bold rounded-xs transition-colors cursor-pointer ${
                  activeTab === 'today_easy_prev'
                    ? 'bg-amber-600 text-stone-950 shadow-xs'
                    : 'bg-[#fdfbf6] text-stone-800 hover:bg-stone-200 border border-stone-400'
                }`}
              >
                ☀️ Previous Easy
              </button>
            )}
            {tabIds.today_hard_prev && (
              <button
                onClick={() => setActiveTab('today_hard_prev')}
                className={`desk-hit inline-flex items-center px-2.5 py-1 font-bold rounded-xs transition-colors cursor-pointer ${
                  activeTab === 'today_hard_prev'
                    ? 'bg-amber-600 text-stone-950 shadow-xs'
                    : 'bg-[#fdfbf6] text-stone-800 hover:bg-stone-200 border border-stone-400'
                }`}
              >
                🌙 Previous Hard
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={loadBoard}
            className="desk-hit inline-flex items-center gap-1 text-stone-800 hover:text-stone-950 cursor-pointer"
            title="Refresh Live Standings"
            aria-label="Refresh live standings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Live Score Submission Box (if solved) */}
        {currentSolveStats && !hasSubmitted && !user && (
          <div className="p-3 sm:p-4 bg-[var(--paper)] border-b-2 border-stone-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-stone-800" />
              <span className="font-headline font-bold text-xs sm:text-sm text-stone-900 uppercase">
                Sign in to post {currentSolveStats.timeFormatted} to the bureau ledger
              </span>
            </div>
            <GoogleDeskButton onClick={onSignIn} identity />
          </div>
        )}

        {currentSolveStats && !hasSubmitted && user && (
          <div className="p-3 sm:p-4 bg-amber-50 border-b-2 border-amber-300">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-700" />
              <span className="font-headline font-bold text-xs sm:text-sm text-stone-900 uppercase">
                Submit Your Decryption Time: {currentSolveStats.timeFormatted}
              </span>
            </div>

            <form onSubmit={handleSubmitScore} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono-code">
              <div>
                <label htmlFor="agent-codename" className="block text-xs text-stone-700 font-bold uppercase mb-0.5">Agent Codename</label>
                <input
                  id="agent-codename"
                  name="nickname"
                  type="text"
                  autoComplete="nickname"
                  required
                  maxLength={20}
                  value={codename}
                  onChange={(e) => setCodename(e.target.value)}
                  placeholder="e.g. Agent_Shadow"
                  className="w-full px-2 py-1.5 bg-white border border-stone-400 rounded-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label htmlFor="bureau-title" className="block text-xs text-stone-700 font-bold uppercase mb-0.5">Bureau Title</label>
                <select
                  id="bureau-title"
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-stone-400 rounded-xs text-stone-900 font-semibold"
                >
                  {(TITLE_BADGES.includes(selectedBadge)
                    ? TITLE_BADGES
                    : [...TITLE_BADGES, selectedBadge]
                  ).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="agent-country" className="block text-xs text-stone-700 font-bold uppercase mb-0.5">Country / Region</label>
                <select
                  id="agent-country"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-stone-400 rounded-xs text-stone-900 font-semibold"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !codename.trim()}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold rounded-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Verifying...' : 'Post to Leaderboard'}</span>
                </button>
              </div>
            </form>
            {submitError ? (
              <p className="mt-2 font-typewriter text-[13px] uppercase tracking-widest text-red-800">{submitError}</p>
            ) : null}
          </div>
        )}

        {hasSubmitted && submissionRank && (
          <div className="p-3 bg-emerald-100 border-b border-emerald-300 text-emerald-900 text-xs font-mono-code flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>
                Verified! You are officially ranked <strong>#{submissionRank}</strong> on the global board!
              </span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-2 sm:p-3 bg-[#fdfbf6] border-b border-stone-300 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-700 absolute left-2.5 top-2.5" />
            <input
              id="leaderboard-search"
              type="search"
              placeholder="Search by agent codename, title, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search by agent codename, title, or country"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-400 rounded-xs font-newspaper text-stone-900"
            />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 bg-newsprint">
          {boardError ? (
            <p className="mb-2 font-typewriter text-[13px] uppercase tracking-widest text-red-800">{boardError}</p>
          ) : null}
          <div className="border border-stone-400 rounded-xs bg-[#fdfbf7] overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs font-mono-code">
              <thead>
                <tr className="bg-[var(--paper-masthead)] text-stone-950 border-b border-stone-400">
                  <th className="p-2 sm:p-2.5 text-center w-12">Rank</th>
                  <th className="p-2 sm:p-2.5">Agent Codename & Badge</th>
                  <th className="p-2 sm:p-2.5 text-right">Time</th>
                  <th className="p-2 sm:p-2.5 text-center hidden sm:table-cell">Hints</th>
                  <th className="p-2 sm:p-2.5 text-center hidden sm:table-cell">Accuracy</th>
                  <th className="p-2 sm:p-2.5 text-center w-14">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-300">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-stone-700 italic font-newspaper">
                      No matching records found in the cryptographic archives.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, idx) => {
                    const rank = idx + 1;
                    const isTop1 = rank === 1;
                    const isTop2 = rank === 2;
                    const isTop3 = rank === 3;

                    return (
                      <tr
                        key={entry.id}
                        className={`hover:bg-amber-50/80 transition-colors ${
                          isTop1 ? 'bg-amber-50/90 font-bold' : idx % 2 === 0 ? 'bg-[#fcfaf4]' : 'bg-[#f7f3e8]'
                        }`}
                      >
                        {/* Rank */}
                        <td className="p-2 sm:p-2.5 text-center font-bold">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-stone-950 font-black shadow-2xs">
                              1
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-300 text-stone-900 font-bold">
                              2
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-stone-950 font-bold">
                              3
                            </span>
                          ) : (
                            <span className="text-stone-600 font-semibold">{rank}</span>
                          )}
                        </td>

                        {/* Codename & Title */}
                        <td className="p-2 sm:p-2.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-stone-950 text-xs sm:text-sm">
                              {entry.codename}
                            </span>
                            <span className="text-xs text-stone-600 font-newspaper italic">
                              {entry.titleBadge}
                            </span>
                          </div>
                        </td>

                        {/* Time */}
                        <td className="p-2 sm:p-2.5 text-right font-bold text-stone-950 tabular-nums">
                          {entry.timeFormatted}
                        </td>

                        {/* Hints */}
                        <td className="p-2 sm:p-2.5 text-center text-stone-700 hidden sm:table-cell">
                          {entry.hintsUsed === 0 ? (
                            <span className="text-emerald-700 font-bold">0 Clean</span>
                          ) : (
                            <span>{entry.hintsUsed}</span>
                          )}
                        </td>

                        {/* Accuracy */}
                        <td className="p-2 sm:p-2.5 text-center hidden sm:table-cell">
                          <span
                            className={`font-semibold ${
                              entry.accuracy >= 95 ? 'text-emerald-800' : 'text-stone-700'
                            }`}
                          >
                            {entry.accuracy}%
                          </span>
                        </td>

                        {/* Country */}
                        <td className="p-2 sm:p-2.5 text-center">
                          <span className="inline-block px-1.5 py-0.5 bg-stone-200 text-stone-800 rounded font-bold text-xs">
                            {entry.countryCode}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <DeskActionDock>
          <span>Official Timings Certified by Bureau of Cryptanalysis</span>
          <button
            type="button"
            onClick={onClose}
            className="desk-hit inline-flex items-center px-3 py-1 bg-amber-600 hover:bg-amber-700 text-stone-950 rounded-xs font-bold cursor-pointer"
          >
            Close Records
          </button>
        </DeskActionDock>
    </DeskModal>
  );
};
