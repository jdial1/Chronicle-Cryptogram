import React, { useLayoutEffect, useRef } from 'react';
import { PuzzleData } from '../types';
import { FileText, BookOpen, Type } from '../deskIcons';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { editionLabel, isNightEdition } from '../utils/edition';
import { forgetCloud } from '../utils/deskError';

interface HeaderProps {
  currentPuzzle: PuzzleData;
  user?: { photoURL?: string | null; displayName?: string | null } | null;
  authConfigured?: boolean;
  onOpenBureau?: () => void;
  onOpenArchive?: () => void;
  onOpenCaseFiles?: () => void;
  onOpenHandbook?: () => void;
  showCaseFiles?: boolean;
}

function agentInitials(name?: string | null) {
  const parts = (name || 'Agent').trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || 'A';
  const last = (parts.length > 1 ? parts[parts.length - 1][0] : '') || '';
  return `${first}${last}`.toUpperCase();
}

export function AgentPlate({
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
  const box = size === 'lg' ? 'desk-hit w-10 h-10 text-xs sm:w-16 sm:h-16 sm:text-lg' : 'desk-hit w-8 h-8 text-xs';
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
      <span className="absolute inset-0 bg-black/50 mix-blend-multiply" />
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
      aria-label={`Open Bureau File for ${name || 'agent'}: field copy, dispatch, and credentials`}
      className={className}
    >
      {mark}
    </button>
  );
}

const navLinkClass =
  'desk-hit inline-flex items-center gap-1 font-semibold font-treatise uppercase tracking-widest underline decoration-dotted underline-offset-4 cursor-pointer hover:text-stone-950 whitespace-nowrap';

export function GoogleDeskButton({
  onClick,
  full = false,
  signedIn = false,
  identity = false,
}: {
  onClick?: () => void;
  night?: boolean;
  full?: boolean;
  signedIn?: boolean;
  identity?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fedcm = identity && !signedIn;

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!fedcm || !host) return;
    void import('../utils/googleIdentity').then(({ renderGoogleButton }) => {
      forgetCloud(renderGoogleButton(host, full), 'gis-button');
    });
  }, [fedcm, full]);

  if (fedcm) {
    return (
      <div
        ref={hostRef}
        className={full ? 'google-identity-btn google-identity-btn-full' : 'google-identity-btn'}
      />
    );
  }

  if (full) {
    return (
      <button
        type="button"
        onClick={signedIn ? undefined : onClick}
        disabled={signedIn}
        aria-pressed={signedIn}
        className={`${navLinkClass} w-full min-h-12 justify-center px-4 py-2.5 text-xs ${
          signedIn ? 'cursor-default' : ''
        }`}
      >
        <Type className="w-3.5 h-3.5 shrink-0" />
        {signedIn ? 'Signed in' : 'Sign in with Google'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={signedIn ? undefined : onClick}
      disabled={signedIn}
      aria-pressed={signedIn}
      className={signedIn ? `${navLinkClass} cursor-default` : navLinkClass}
    >
      <Type className="w-3.5 h-3.5 shrink-0" />
      {signedIn ? 'Signed in' : 'Sign in'}
    </button>
  );
}

export const Header: React.FC<HeaderProps> = ({
  currentPuzzle,
  user,
  authConfigured,
  onOpenBureau,
  onOpenArchive,
  onOpenCaseFiles,
  onOpenHandbook,
  showCaseFiles,
}) => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const night = isNightEdition(currentPuzzle);

  return (
    <header className="w-full select-none text-stone-950">
      <title>Chronicle Cryptogram</title>
      <div className="masthead-banner">
        <div>
          <div className="px-3 sm:px-6 py-4 sm:py-6 text-center overflow-hidden">
            <div className="w-full edition-measure flex flex-col items-center">
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
        </div>
      </div>

      <div className={night ? 'border-t border-amber-900/40' : 'border-t border-stone-800'}>
        <div className="relative edition-measure px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs font-newspaper tracking-wider">
          <div className="relative z-10 flex items-center justify-start shrink-0">
            {authConfigured ? (
              user ? (
                <AgentPlate
                  photoURL={user.photoURL}
                  name={user.displayName}
                  night={night}
                  onClick={onOpenBureau}
                />
              ) : (
                <GoogleDeskButton onClick={onOpenBureau} night={night} />
              )
            ) : null}
          </div>
          <nav className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none">
            <button
              type="button"
              onClick={onOpenHandbook}
              className={`${navLinkClass} pointer-events-auto`}
              title="Guide: how to break today's cipher"
              aria-label="Guide: how to break today's cipher"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              Guide
            </button>
            {showCaseFiles ? (
              <button
                type="button"
                onClick={onOpenCaseFiles}
                className={`${navLinkClass} pointer-events-auto`}
                title="Open detective case files"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                Files
              </button>
            ) : null}
          </nav>
          <div className="relative z-10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenArchive}
              className={navLinkClass}
              title="Archive: back issues"
              aria-label={`Archive, ${editionLabel(currentPuzzle.editionNumber)}`}
            >
              <span className="sm:hidden">Archive</span>
              <span className="hidden sm:inline">{editionLabel(currentPuzzle.editionNumber)}</span>
            </button>
            {isInstallable ? (
              <button
                type="button"
                onClick={promptInstall}
                className="hidden sm:inline-flex items-center hover:underline cursor-pointer uppercase tracking-widest font-bold text-emerald-700 whitespace-nowrap"
                title="Install the paper, then pack a field copy from Bureau File for offline play"
              >
                INSTALL APP
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
