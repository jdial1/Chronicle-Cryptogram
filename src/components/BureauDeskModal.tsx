import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { FileText, Send, X } from '../icons';
import { GameStats } from '../types';
import { formatTime } from '../utils/cipherEngine';
import { DEFAULT_GAME_STATS } from '../utils/firebaseStore';
import { AgentPlate, GoogleDeskButton } from './Header';

export const BUREAU_DESK_SEEN_KEY = 'cryptogram_bureau_desk_seen';

export function bureauDeskSeen() {
  try {
    return localStorage.getItem(BUREAU_DESK_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markBureauDeskSeen() {
  try {
    localStorage.setItem(BUREAU_DESK_SEEN_KEY, '1');
  } catch {
    return;
  }
}

export const CIPHER_KEYBOARD_KEY = 'cryptogram_cipher_keyboard';

export function usesGameKeyboard() {
  try {
    return localStorage.getItem(CIPHER_KEYBOARD_KEY) !== 'native';
  } catch {
    return true;
  }
}

export function toggleGameKeyboard() {
  const next = !usesGameKeyboard();
  try {
    localStorage.setItem(CIPHER_KEYBOARD_KEY, next ? 'game' : 'native');
  } catch {
    return next;
  }
  return next;
}

interface BureauDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  identified: boolean;
  user?: User | null;
  night?: boolean;
  gameStats?: GameStats;
  authConfigured: boolean;
  authError?: string | null;
  onIssueCredentials: () => void;
  onSignOut?: () => void;
  deliverySupported: boolean;
  deliverySubscribed: boolean;
  deliveryBlocked: boolean;
  deliveryError?: string | null;
  deliveryCopy: string;
  onToggleDelivery: () => void;
  onOpenSettings: () => void;
  darkPaper: boolean;
  onTogglePaper: () => void;
  gameKeyboard: boolean;
  onToggleKeyboard: () => void;
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
  authConfigured,
  authError,
  onIssueCredentials,
  onSignOut,
  deliverySupported,
  deliverySubscribed,
  deliveryBlocked,
  deliveryError,
  deliveryCopy,
  onToggleDelivery,
  onOpenSettings,
  darkPaper,
  onTogglePaper,
  gameKeyboard,
  onToggleKeyboard,
  onDeleteRecords,
}) => {
  const [wipeBusy, setWipeBusy] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) return;
    setWipeBusy(false);
    setWipeConfirm(false);
    setWipeError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const showFile = identified && user;
  const showCredentials = authConfigured && !showFile;
  const showDispatch = deliverySupported;
  const rows = [
    { short: 'Decoded', label: 'Editions decoded', value: String(gameStats.puzzlesSolved) },
    { short: 'Streak', label: 'Current streak', value: String(gameStats.currentStreak) },
    { short: 'Longest', label: 'Longest streak', value: String(gameStats.maxStreak) },
    { short: 'Quickest', label: 'Quickest solve', value: gameStats.fastestTime == null ? '—' : formatTime(gameStats.fastestTime) },
    { short: 'On desk', label: 'Time on desk', value: formatTime(gameStats.totalTimePlayed), wide: true },
  ];

  return (
    <div className="modal-backdrop z-[55] select-none" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bureau-desk-title"
        className="modal-sheet max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-masthead">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 shrink-0" />
            <h2
              id="bureau-desk-title"
              className="text-base sm:text-lg font-masthead font-bold tracking-wide uppercase leading-tight"
            >
              Bureau File
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="desk-hit shrink-0 flex items-center justify-center text-stone-700 hover:text-stone-950 rounded hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-newsprint space-y-3">
          <p className="font-treatise italic text-sm text-stone-700">
            Press pass and morning wire. Keep the file intact across desks.
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

          {showFile && user && (
            <article className="evidence-slip border border-stone-700 px-2.5 py-2 sm:px-3 sm:pt-2 sm:pb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <AgentPlate photoURL={user.photoURL} name={user.displayName} night={night} size="lg" />
                <div className="min-w-0">
                  <p className="font-typewriter font-black text-xs sm:text-sm uppercase tracking-widest text-stone-950 truncate">
                    {user.displayName || 'Agent'}
                  </p>
                  <p className="font-typewriter text-[11px] uppercase tracking-widest text-stone-700">
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
                    <p className="mt-2 font-typewriter text-[10px] uppercase tracking-widest text-red-800">
                      {wipeError}
                    </p>
                  )}
                </>
              )}
            </article>
          )}

          {showCredentials && (
            <article className="evidence-slip border border-stone-700 px-3 pt-2 pb-3">
              <p className="font-typewriter font-black text-[10px] uppercase tracking-widest text-stone-800">
                Issue Detective Credentials
              </p>
              <p className="mt-1.5 font-newspaper text-sm text-stone-700 leading-relaxed">
                Save investigation records, streak counts, and sync the case across devices.
              </p>
              <div className="mt-3">
                <GoogleDeskButton onClick={onIssueCredentials} full identity />
              </div>
              {authError && (
                <p className="mt-2 font-typewriter text-[10px] uppercase tracking-widest text-red-800">
                  {authError}
                </p>
              )}
            </article>
          )}

          {showDispatch && (
            <article className="evidence-slip border border-stone-700 px-3 pt-2 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 shrink-0" />
                <p className="font-typewriter font-black text-[10px] uppercase tracking-widest text-stone-800">
                  The Morning Dispatch
                </p>
              </div>
              <p className="mt-1.5 font-newspaper text-sm text-stone-700 leading-relaxed">
                {deliveryBlocked ? 'Notifications are off' : deliveryCopy}
              </p>
              {deliveryBlocked ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenSettings();
                  }}
                  className={`mt-3 ${slipPress} ${slipFill}`}
                >
                  Open settings
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleDelivery();
                  }}
                  aria-pressed={deliverySubscribed}
                  className={`mt-3 ${slipPress} ${
                    deliverySubscribed ? 'border-stone-800 bg-amber-200 text-stone-950' : slipFill
                  }`}
                >
                  {deliverySubscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
              )}
              {deliveryError && (
                <p className="mt-2 font-typewriter text-[10px] uppercase tracking-widest text-red-800">
                  {deliveryError}
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
      </section>
    </div>
  );
};
