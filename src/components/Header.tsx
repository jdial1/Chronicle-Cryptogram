import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { PuzzleData, GameStats } from '../types';
import { FileText, BookOpen, Type, X } from '../icons';
import { usePWAInstall } from '../utils/usePWAInstall';
import { isNightEdition } from '../utils/edition';
import { formatTime } from '../utils/cipherEngine';
import { DEFAULT_GAME_STATS } from '../utils/firebaseStore';

interface HeaderProps {
  currentPuzzle: PuzzleData;
  user?: User | null;
  authConfigured?: boolean;
  gameStats?: GameStats;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onOpenArchive?: () => void;
  onOpenCaseFiles?: () => void;
  onOpenHandbook?: () => void;
  showCaseFiles?: boolean;
  deliverySupported?: boolean;
  deliverySubscribed?: boolean;
  deliveryBlocked?: boolean;
  onToggleDelivery?: () => void;
}

function agentInitials(name?: string | null) {
  const parts = (name || 'Agent').trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || 'A';
  const last = (parts.length > 1 ? parts[parts.length - 1][0] : '') || '';
  return `${first}${last}`.toUpperCase();
}

function AgentPlate({
  photoURL,
  name,
  night = false,
  size = 'sm',
  onClick,
}: {
  photoURL?: string | null;
  name?: string | null;
  night?: boolean;
  size?: 'sm' | 'lg';
  onClick?: () => void;
}) {
  const initials = agentInitials(name);
  const box = size === 'lg' ? 'w-16 h-16 text-lg' : 'w-8 h-8 text-[10px]';
  const className = `relative ${box} border-2 overflow-hidden shrink-0 ${
    night ? 'border-amber-900' : 'border-stone-800'
  } ${onClick ? 'cursor-pointer' : ''}`;
  const mark = (
    <>
      {photoURL ? (
        <img
          src={photoURL}
          alt=""
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-125 brightness-90"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="absolute inset-0 bg-[#3a352c]" />
      )}
      <span className="absolute inset-0 bg-stone-950/50 mix-blend-multiply" />
      <span className="relative z-10 flex h-full w-full items-center justify-center font-typewriter font-black tracking-widest text-[#f7f3e8]">
        {initials}
      </span>
    </>
  );
  if (!onClick) {
    return <div className={className}>{mark}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open bureau file for ${name || 'agent'}`}
      className={className}
    >
      {mark}
    </button>
  );
}

export function GoogleDeskButton({
  onClick,
  night = false,
}: {
  onClick?: () => void;
  night?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border-2 px-2.5 py-1 font-typewriter font-black text-[10px] uppercase tracking-[0.12em] text-stone-950 cursor-pointer ${
        night
          ? 'border-amber-900 bg-[#efe4cc] hover:bg-[#e4d6b8]'
          : 'border-stone-800 bg-[#f8f3e8] hover:bg-[#ebe4d4]'
      }`}
    >
      <Type className="w-3.5 h-3.5" />
      <span className="sm:hidden">Sign in</span>
      <span className="hidden sm:inline">Sign in with Google</span>
    </button>
  );
}

function AgentDossierModal({
  user,
  stats,
  night,
  onClose,
  onSignOut,
}: {
  user: User;
  stats: GameStats;
  night: boolean;
  onClose: () => void;
  onSignOut?: () => void;
}) {
  const rows = [
    { label: 'Editions decoded', value: String(stats.puzzlesSolved) },
    { label: 'Current streak', value: String(stats.currentStreak) },
    { label: 'Longest streak', value: String(stats.maxStreak) },
    { label: 'Quickest solve', value: stats.fastestTime == null ? '—' : formatTime(stats.fastestTime) },
    { label: 'Time on desk', value: formatTime(stats.totalTimePlayed) },
  ];

  return (
    <div className="modal-backdrop is-slip z-50 select-none" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-dossier-title"
        className="modal-sheet is-slip max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-masthead">
          <h2
            id="agent-dossier-title"
            className="text-base sm:text-lg font-masthead font-bold tracking-wide uppercase leading-tight"
          >
            Bureau File
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center text-stone-700 hover:text-stone-950 rounded hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 bg-newsprint">
          <div className="flex items-center gap-3 mb-4">
            <AgentPlate photoURL={user.photoURL} name={user.displayName} night={night} size="lg" />
            <div className="min-w-0">
              <p className="font-typewriter font-black text-sm uppercase tracking-widest text-stone-950 truncate">
                {user.displayName || 'Agent'}
              </p>
              <p className="font-typewriter text-[10px] uppercase tracking-widest text-stone-600">
                Field operative
              </p>
            </div>
          </div>
          <dl className="border-2 border-stone-800 divide-y divide-stone-400 bg-[#f8f3e8]">
            {rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-3 px-3 py-2">
                <dt className="font-typewriter text-[10px] uppercase tracking-widest text-stone-600">
                  {row.label}
                </dt>
                <dd className="font-typewriter font-black text-sm text-stone-950 tabular-nums">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="modal-action-dock p-3 sm:flex sm:justify-end sm:px-4 sm:py-2.5">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full sm:w-auto min-h-12 sm:min-h-0 px-4 py-2.5 border-2 border-stone-800 bg-[#f8f3e8] hover:bg-amber-100 text-stone-950 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </section>
    </div>
  );
}

export const Header: React.FC<HeaderProps> = ({
  currentPuzzle,
  user,
  authConfigured,
  gameStats = DEFAULT_GAME_STATS,
  onSignIn,
  onSignOut,
  onOpenArchive,
  onOpenCaseFiles,
  onOpenHandbook,
  showCaseFiles,
  deliverySupported,
  deliverySubscribed,
  deliveryBlocked,
  onToggleDelivery,
}) => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const night = isNightEdition(currentPuzzle);
  const [dossierOpen, setDossierOpen] = useState(false);
  const linkClass =
    'inline-flex items-center gap-1 uppercase tracking-widest underline decoration-dotted underline-offset-4 cursor-pointer hover:text-stone-950';
  const dotClass = 'hidden sm:inline text-stone-700';

  useEffect(() => {
    if (!user) setDossierOpen(false);
  }, [user]);

  return (
    <header
      className={`w-full select-none ${
        night
          ? 'bg-[#d6c9b0] text-stone-950 border-b-4 border-amber-800'
          : 'bg-[#fbf7ee] text-stone-800 border-b-2 border-stone-900'
      }`}
    >
      <title>Chronicle Cryptogram</title>
      <div className="px-3 sm:px-6 py-4 sm:py-6 text-center overflow-hidden">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
          {night ? (
            <h1 className="flex items-baseline justify-center gap-2 sm:gap-3 whitespace-nowrap">
              <span className="font-gothic text-3xl sm:text-5xl md:text-6xl text-stone-950 leading-none">
                The Chronicle
              </span>
              <span className="font-masthead font-black tracking-[0.18em] sm:tracking-[0.28em] text-sm sm:text-2xl md:text-3xl text-stone-950 uppercase">
                Night Post
              </span>
            </h1>
          ) : (
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-black tracking-tight text-stone-950 drop-shadow-xs my-0 sm:my-1 uppercase whitespace-nowrap">
              Chronicle Cryptogram
            </h1>
          )}
        </div>
      </div>

      <div className={night ? 'border-t border-amber-900/40' : 'border-t border-stone-800'}>
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-1.5 flex items-center gap-2 sm:gap-3 text-xs font-newspaper tracking-wider">
        {authConfigured ? (
          <div className="flex items-center shrink-0">
            {user ? (
              <AgentPlate
                photoURL={user.photoURL}
                name={user.displayName}
                night={night}
                onClick={() => setDossierOpen(true)}
              />
            ) : (
              <GoogleDeskButton onClick={onSignIn} night={night} />
            )}
          </div>
        ) : (
          <span className="hidden sm:block shrink-0" />
        )}
        <div className="flex-1 flex items-center justify-between sm:justify-center sm:gap-3 min-w-0 font-semibold font-treatise">
          <button
            type="button"
            onClick={onOpenHandbook}
            className={linkClass}
            title="Open the codebreaker's handbook"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            Handbook
          </button>
          {showCaseFiles ? (
            <>
              <span className={dotClass}>•</span>
              <button
                type="button"
                onClick={onOpenCaseFiles}
                className={`hidden sm:inline-flex ${linkClass}`}
                title="Open detective case files"
              >
                <FileText className="w-3.5 h-3.5" />
                Case Files
              </button>
            </>
          ) : null}
          <span className={dotClass}>•</span>
          <button
            type="button"
            onClick={onOpenArchive}
            className={linkClass}
            title="Browse previous Morning Editions and Night Extras"
          >
            {currentPuzzle.editionDate}
          </button>
        </div>
        <div className="hidden sm:flex items-center justify-end gap-3 shrink-0 font-semibold font-treatise">
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="hover:underline cursor-pointer uppercase tracking-widest font-bold text-emerald-700"
              title="Install app to your device"
            >
              INSTALL APP
            </button>
          )}
          {isInstallable && deliverySupported && onToggleDelivery && !(deliveryBlocked && !deliverySubscribed) && (
            <span className="text-stone-700">•</span>
          )}
          {deliverySupported && onToggleDelivery && !(deliveryBlocked && !deliverySubscribed) && (
            <button
              type="button"
              onClick={onToggleDelivery}
              className="hover:underline cursor-pointer uppercase tracking-widest text-stone-700 hover:text-stone-950"
              title={
                deliverySubscribed
                  ? 'Stop daily delivery notices'
                  : 'Subscribe to daily delivery notifications'
              }
            >
              {deliverySubscribed ? 'DELIVERY ON' : 'SUBSCRIBE TO DELIVERY'}
            </button>
          )}
        </div>
        </div>
      </div>
      {dossierOpen && user && (
        <AgentDossierModal
          user={user}
          stats={gameStats}
          night={night}
          onClose={() => setDossierOpen(false)}
          onSignOut={() => {
            setDossierOpen(false);
            onSignOut?.();
          }}
        />
      )}
    </header>
  );
};
