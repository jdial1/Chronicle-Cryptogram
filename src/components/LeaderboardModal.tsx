import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Award, Search, Globe, Shield, RefreshCw, Send, CheckCircle } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPuzzleId: string;
  currentPuzzleTitle: string;
  currentSolveStats?: {
    timeSeconds: number;
    timeFormatted: string;
    hintsUsed: number;
    accuracy: number;
    penMode: 'pen' | 'pencil';
  } | null;
  onScoreSubmitted?: () => void;
}

const TITLE_BADGES = [
  'Grandmaster Cryptanalyst',
  'Senior Bureau Inspector',
  'Zodiac Cipher Breaker',
  'Codebreaker Specialist',
  'Field Operative',
  'Cadet Decryptor',
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'IN', name: 'India' },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentPuzzleId,
  currentPuzzleTitle,
  currentSolveStats,
  onScoreSubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (currentPuzzleId.includes('hard')) return 'today_hard';
    if (currentPuzzleId.includes('2026_08_16_easy')) return 'yesterday_easy';
    if (currentPuzzleId.includes('2026_08_16_hard')) return 'yesterday_hard';
    return 'today_easy';
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Submission Form State
  const [codename, setCodename] = useState(() => localStorage.getItem('cryptogram_codename') || '');
  const [selectedBadge, setSelectedBadge] = useState(TITLE_BADGES[0]);
  const [countryCode, setCountryCode] = useState('US');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionRank, setSubmissionRank] = useState<number | null>(null);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      let targetId = 'daily_2026_08_17_easy';
      if (activeTab === 'today_easy') targetId = 'daily_2026_08_17_easy';
      else if (activeTab === 'today_hard') targetId = 'daily_2026_08_17_hard';
      else if (activeTab === 'yesterday_easy') targetId = 'daily_2026_08_16_easy';
      else if (activeTab === 'yesterday_hard') targetId = 'daily_2026_08_16_hard';
      else if (activeTab === 'historical') targetId = 'daily_2026_08_15_hard';
      else targetId = currentPuzzleId;

      const res = await fetch(`/api/leaderboard?puzzleId=${targetId}`);
      const data = await res.json();
      if (data.success && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, activeTab]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codename.trim() || !currentSolveStats || isSubmitting) return;

    setIsSubmitting(true);
    try {
      localStorage.setItem('cryptogram_codename', codename.trim());
      const res = await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: currentPuzzleId,
          codename: codename.trim(),
          titleBadge: selectedBadge,
          timeSeconds: currentSolveStats.timeSeconds,
          timeFormatted: currentSolveStats.timeFormatted,
          hintsUsed: currentSolveStats.hintsUsed,
          accuracy: currentSolveStats.accuracy,
          penMode: currentSolveStats.penMode,
          countryCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHasSubmitted(true);
        setSubmissionRank(data.rank);
        fetchLeaderboard();
        if (onScoreSubmitted) onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredEntries = leaderboard.filter(
    (entry) =>
      entry.codename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.countryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.titleBadge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-[#fcf9f2] w-full max-w-3xl rounded-sm border-2 border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Newspaper Masthead Modal Header */}
        <div className="bg-stone-900 text-stone-100 p-3 sm:p-4 flex items-center justify-between border-b-2 border-amber-600">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400 fill-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-masthead font-bold tracking-wide text-amber-100 uppercase">
                Global Codebreaker Leaderboard
              </h2>
              <p className="text-[11px] font-mono-code text-stone-400">
                Official Bureau Records & Competitive Rankings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#f4eee1] border-b border-stone-400 gap-2 flex-wrap text-xs font-mono-code">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setActiveTab('today_easy')}
              className={`px-2.5 py-1 font-bold rounded-xs transition-colors cursor-pointer ${
                activeTab === 'today_easy'
                  ? 'bg-emerald-800 text-emerald-100 shadow-xs'
                  : 'bg-[#fdfbf6] text-stone-700 hover:bg-stone-200 border border-stone-400'
              }`}
            >
              ☀️ Today Easy (#428-A)
            </button>
            <button
              onClick={() => setActiveTab('today_hard')}
              className={`px-2.5 py-1 font-bold rounded-xs transition-colors cursor-pointer ${
                activeTab === 'today_hard'
                  ? 'bg-amber-900 text-amber-100 shadow-xs'
                  : 'bg-[#fdfbf6] text-stone-700 hover:bg-stone-200 border border-stone-400'
              }`}
            >
              🌙 Today Hard (#428-B)
            </button>
            <button
              onClick={() => setActiveTab('yesterday_easy')}
              className={`px-2.5 py-1 font-bold rounded-xs transition-colors cursor-pointer ${
                activeTab === 'yesterday_easy'
                  ? 'bg-stone-900 text-amber-100 shadow-xs'
                  : 'bg-[#fdfbf6] text-stone-700 hover:bg-stone-200 border border-stone-400'
              }`}
            >
              ☀️ Yesterday Easy
            </button>
            <button
              onClick={() => setActiveTab('yesterday_hard')}
              className={`px-2.5 py-1 font-bold rounded-xs transition-colors cursor-pointer ${
                activeTab === 'yesterday_hard'
                  ? 'bg-stone-900 text-amber-100 shadow-xs'
                  : 'bg-[#fdfbf6] text-stone-700 hover:bg-stone-200 border border-stone-400'
              }`}
            >
              🌙 Yesterday Hard
            </button>
            <button
              onClick={() => setActiveTab('historical')}
              className={`px-2.5 py-1 font-bold rounded-xs transition-colors cursor-pointer ${
                activeTab === 'historical'
                  ? 'bg-stone-900 text-amber-100 shadow-xs'
                  : 'bg-[#fdfbf6] text-stone-700 hover:bg-stone-200 border border-stone-400'
              }`}
            >
              Zodiac 340 Legends
            </button>
          </div>

          <button
            onClick={fetchLeaderboard}
            className="flex items-center gap-1 text-stone-600 hover:text-stone-900 p-1 cursor-pointer"
            title="Refresh Live Standings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Live Score Submission Box (if solved) */}
        {currentSolveStats && !hasSubmitted && (
          <div className="p-3 sm:p-4 bg-amber-50 border-b-2 border-amber-300">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-700" />
              <span className="font-headline font-bold text-xs sm:text-sm text-stone-900 uppercase">
                Submit Your Decryption Time: {currentSolveStats.timeFormatted}
              </span>
            </div>

            <form onSubmit={handleSubmitScore} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono-code">
              <div>
                <label className="block text-[10px] text-stone-600 font-bold uppercase mb-0.5">Agent Codename</label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={codename}
                  onChange={(e) => setCodename(e.target.value)}
                  placeholder="e.g. Agent_Shadow"
                  className="w-full px-2 py-1.5 bg-white border border-stone-400 rounded-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-600 font-bold uppercase mb-0.5">Bureau Title</label>
                <select
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-stone-400 rounded-xs text-stone-900 font-semibold"
                >
                  {TITLE_BADGES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-stone-600 font-bold uppercase mb-0.5">Country / Region</label>
                <select
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
                  className="w-full py-1.5 bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold rounded-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Verifying...' : 'Post to Leaderboard'}</span>
                </button>
              </div>
            </form>
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
            <Search className="w-4 h-4 text-stone-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by agent codename, title, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-400 rounded-xs font-newspaper text-stone-900"
            />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-newsprint">
          <div className="border border-stone-400 rounded-xs bg-[#fdfbf7] overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs font-mono-code">
              <thead>
                <tr className="bg-stone-800 text-stone-100 border-b border-stone-700">
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
                    <td colSpan={6} className="p-6 text-center text-stone-500 italic font-newspaper">
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
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-bold">
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
                            <span className="text-[10px] text-stone-600 font-newspaper italic">
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
                          <span className="inline-block px-1.5 py-0.5 bg-stone-200 text-stone-800 rounded font-bold text-[10px]">
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
        <div className="p-3 bg-[#f4eee1] border-t border-stone-400 flex items-center justify-between text-xs font-mono-code text-stone-600">
          <span>Official Timings Certified by Bureau of Cryptanalysis</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-stone-100 rounded-xs font-bold cursor-pointer"
          >
            Close Records
          </button>
        </div>
      </div>
    </div>
  );
};
