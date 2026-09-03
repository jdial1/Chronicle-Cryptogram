import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { FileText, Send } from '../icons';
import { GameStats } from '../types';
import { formatTime } from '../utils/cipherEngine';
import { DEFAULT_GAME_STATS } from '../utils/localStore';
import { AgentPlate, GoogleDeskButton } from './Header';
import { DeskModal } from './DeskModal';
import {
  formatPackBytes,
  formatPackedAt,
  useOfflinePack,
} from '../hooks/useOfflinePack';

interface BureauDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  identified: boolean;
  user?: User | null;
  night?: boolean;
  gameStats?: GameStats;
  seasonLength?: number;
  authConfigured: boolean;
  authError?: string | null;
  onIssueCredentials: () => void;
  onSignOut?: () => void;
  darkPaper: boolean;
  onTogglePaper: () => void;
  gameKeyboard: boolean;
  onToggleKeyboard: () => void;
  pressVersion?: string | null;
  todayClue?: { letter: string; clue: string } | null;
  onDeleteRecords?: () => Promise<void>;
}

const slipPress =
  'w-full min-h-12 px-3 py-1.5 border-2 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer';
const slipFill =
  'border-stone-800 bg-[color:var(--paper)] hover:bg-[color:var(--paper-reading)] text-stone-950';

export const BureauDeskModal: React.FC<BureauDeskModalProps> = ({
  isOpen,
  onClose,
  identified,
  user,
  night = false,
  gameStats = DEFAULT_GAME_STATS,
  seasonLength,
  authConfigured,
  authError,
  onIssueCredentials,
  onSignOut,
  darkPaper,
  onTogglePaper,
  gameKeyboard,
  onToggleKeyboard,
  pressVersion = null,
  todayClue,
  onDeleteRecords,
}) => {
  const pack = useOfflinePack(pressVersion);
  const [wipeBusy, setWipeBusy] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);
  const [showClue, setShowClue] = useState(false);

  useEffect(() => {
    if (isOpen) return;
    setWipeBusy(false);
    setWipeConfirm(false);
    setWipeError(null);
    setShowClue(false);
  }, [isOpen]);

  useEffect(() => {
    setShowClue(false);
  }, [todayClue?.letter, todayClue?.clue]);

  if (!isOpen) return null;

  const showFile = identified && user;
  const showCredentials = authConfigured && !showFile && pack.online;
  const rows = [
    {
      short: 'Decoded',
      label: 'Editions decoded',
      value: seasonLength ? `${gameStats.puzzlesSolved} / ${seasonLength}` : String(gameStats.puzzlesSolved),
    },
    { short: 'Quickest', label: 'Quickest solve', value: gameStats.fastestTime == null ? '—' : formatTime(gameStats.fastestTime) },
    { short: 'On desk', label: 'Time on desk', value: formatTime(gameStats.totalTimePlayed), wide: true },
  ];

  return (
    <DeskModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="bureau-desk-title"
      title="Bureau File"
      icon={<FileText className="w-5 h-5 shrink-0" />}
      zClass="z-[55]"
      sheetClassName="max-w-md"
    >
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-newsprint space-y-3">
          <p className="font-treatise italic text-sm text-stone-700">
            Press pass, morning wire, and a packed copy for the field. Keep the file intact across desks.
          </p>
          <button
            type="button"
            onClick={onTogglePaper}
            aria-pressed={darkPaper}
            aria-label={darkPaper ? 'Switch to morning paper' : 'Switch to lampblack stock'}
            className={`${slipPress} ${slipFill}`}
          >
            {darkPaper ? 'Morning paper' : 'Lampblack stock'}
          </button>
          <button
            type="button"
            onClick={onToggleKeyboard}
            aria-pressed={gameKeyboard}
            aria-label={gameKeyboard ? 'Switch to native keyboard' : 'Switch to typewriter keys'}
            className={`${slipPress} ${slipFill}`}
          >
            {gameKeyboard ? 'Native keyboard' : 'Typewriter keys'}
          </button>
          <button
            type="button"
            onClick={() => {
              void pack.download();
            }}
            disabled={pack.status === 'packing' || pack.status === 'unsupported'}
            aria-pressed={pack.status === 'packed'}
            aria-label="Keep a full copy of the press"
            className={`${slipPress} ${
              pack.status === 'packed' ? 'border-stone-800 bg-amber-200 text-stone-950' : slipFill
            } disabled:opacity-50`}
          >
            {pack.status === 'packing'
              ? 'Setting the type…'
              : pack.status === 'packed'
                ? 'Press packed'
                : pack.status === 'stale'
                  ? 'Refresh the packed press'
                  : pack.status === 'unsupported'
                    ? 'Press copy unavailable'
                    : 'Keep a full copy of the press'}
          </button>
          <p className="font-newspaper text-xs text-stone-600 leading-relaxed">
            {pack.status === 'packed' && pack.record
              ? `Field copy ready. Packed ${formatPackedAt(pack.record.packedAt)}${
                  pack.bytes != null ? ` · ${formatPackBytes(pack.bytes)} on this desk` : ''
                }. Edition ${pack.record.version}. Offline play uses this copy; the bureau board still needs the wire.`
              : pack.status === 'stale'
                ? 'A newer press is on the stands. Pack again to take it into the field.'
                : pack.status === 'unsupported'
                  ? 'This desk cannot store a press copy.'
                  : 'Offline field copy. Save type, plates, and the serial on this desk so Morning and Night Extra still open with the wire down. Sign-in and the bureau board stay on the network.'}
          </p>
          {pack.error && (
            <p className="font-typewriter text-[13px] uppercase tracking-widest text-red-800">
              {pack.error}
            </p>
          )}
          {todayClue ? (
            <>
              <button
                type="button"
                onClick={() => setShowClue((open) => !open)}
                aria-pressed={showClue}
                aria-label={showClue ? "Hide today's clue" : "Show today's clue"}
                className={`${slipPress} ${
                  showClue ? 'border-stone-800 bg-amber-200 text-stone-950' : slipFill
                }`}
              >
                {showClue ? "Hide today's clue" : "Today's clue"}
              </button>
              {showClue ? (
                <article className="evidence-slip border border-stone-700 px-3 pt-2 pb-3">
                  <p className="font-typewriter font-black text-[13px] uppercase tracking-widest text-stone-800">
                    Copy desk
                  </p>
                  <p className="mt-1.5 font-newspaper text-sm text-stone-700 leading-relaxed">
                    {todayClue.clue}
                  </p>
                  <p className="mt-2 font-typewriter text-[13px] uppercase tracking-widest text-stone-600">
                    A mark stands for {todayClue.letter}
                  </p>
                </article>
              ) : null}
            </>
          ) : null}

          {showFile && user && (
            <article className="evidence-slip border border-stone-700 px-2.5 py-2 sm:px-3 sm:pt-2 sm:pb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <AgentPlate photoURL={user.photoURL} name={user.displayName} night={night} size="lg" />
                <div className="min-w-0">
                  <p className="font-typewriter font-black text-xs sm:text-sm uppercase tracking-widest text-stone-950 truncate">
                    {user.displayName || 'Agent'}
                  </p>
                  <p className="font-typewriter text-xs uppercase tracking-widest text-stone-700">
                    Field operative
                  </p>
                </div>
              </div>
              <dl className="mt-2 sm:mt-3 border-2 border-stone-800 bg-[color:var(--paper)] grid grid-cols-2 sm:grid-cols-1">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-baseline justify-between gap-2 px-2 py-1.5 sm:px-3 sm:py-2 border-stone-400 border-b last:border-b-0 ${
                      row.wide ? 'col-span-2 sm:col-span-1' : 'odd:border-r sm:odd:border-r-0'
                    }`}
                  >
                    <dt className="font-typewriter text-xs uppercase tracking-widest text-stone-600">
                      <span className="sm:hidden">{row.short}</span>
                      <span className="hidden sm:inline">{row.label}</span>
                    </dt>
                    <dd className="font-typewriter font-black text-xs sm:text-sm text-stone-950 tabular-nums">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className={`mt-2 ${slipPress} ${slipFill}`}
                >
                  Sign Out
                </button>
              )}
              {onDeleteRecords && (
                <>
                  {wipeConfirm ? (
                    <div className="mt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                      <button
                        type="button"
                        disabled={wipeBusy}
                        onClick={() => setWipeConfirm(false)}
                        className={`${slipPress} ${slipFill}`}
                      >
                        Keep records
                      </button>
                      <button
                        type="button"
                        disabled={wipeBusy}
                        onClick={() => {
                          setWipeBusy(true);
                          setWipeError(null);
                          onDeleteRecords()
                            .then(() => onClose())
                            .catch(() => {
                              setWipeError('Could not wipe the bureau file.');
                              setWipeBusy(false);
                            });
                        }}
                        className="woodblock-stamp w-full min-h-12 px-3 py-1.5 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                      >
                        {wipeBusy ? 'Wiping file…' : 'Wipe records'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setWipeConfirm(true)}
                      className={`mt-2 ${slipPress} border-[color:var(--ink-cinnabar)] bg-[color:var(--paper)] hover:bg-red-50 text-stone-950`}
                    >
                      Delete cloud records
                    </button>
                  )}
                  <p className="mt-1.5 font-newspaper text-xs text-stone-600 leading-relaxed">
                    Removes cloud progress, dispatch tokens, and your leaderboard entries. Notes on this desk stay until you clear the site.
                  </p>
                  {wipeError && (
                    <p className="mt-2 font-typewriter text-[13px] uppercase tracking-widest text-red-800">
                      {wipeError}
                    </p>
                  )}
                </>
              )}
            </article>
          )}

          {showCredentials && (
            <article className="evidence-slip border border-stone-700 px-3 pt-2 pb-3">
              <p className="font-typewriter font-black text-[13px] uppercase tracking-widest text-stone-800">
                Issue Detective Credentials
              </p>
              <p className="mt-1.5 font-newspaper text-sm text-stone-700 leading-relaxed">
                Save investigation records and sync the case across devices.
              </p>
              <div className="mt-3">
                <GoogleDeskButton onClick={onIssueCredentials} full identity />
              </div>
              {authError && (
                <p className="mt-2 font-typewriter text-[13px] uppercase tracking-widest text-red-800">
                  {authError}
                </p>
              )}
            </article>
          )}
        </div>

        <div className="modal-action-dock p-3 sm:flex sm:justify-end sm:px-4 sm:py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="woodblock-stamp w-full sm:w-auto min-h-12 px-4 py-1.5 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Report to the field
          </button>
        </div>
    </DeskModal>
  );
};
