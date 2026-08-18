import React from 'react';
import type { User } from 'firebase/auth';
import { PuzzleData } from '../types';
import { FileText, BookOpen } from '../icons';
import { usePWAInstall } from '../utils/usePWAInstall';
import { isNightEdition } from '../utils/edition';

interface HeaderProps {
  currentPuzzle: PuzzleData;
  user?: User | null;
  authConfigured?: boolean;
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

export const Header: React.FC<HeaderProps> = ({
  currentPuzzle,
  user,
  authConfigured,
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
  const linkClass = `inline-flex items-center gap-1 uppercase tracking-widest underline decoration-dotted underline-offset-4 cursor-pointer ${
    night ? 'hover:text-amber-200' : 'hover:text-stone-950'
  }`;
  const dotClass = `hidden sm:inline ${night ? 'text-amber-700' : 'text-stone-400'}`;

  return (
    <header
      className={`w-full select-none ${
        night
          ? 'bg-stone-950 text-amber-100 border-b-4 border-amber-700'
          : 'bg-[#fbf7ee] text-stone-800 border-b-2 border-stone-900'
      }`}
    >
      <div
        className={`px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-newspaper tracking-wider ${
          night ? 'border-b border-amber-800/60 text-amber-100/90' : 'border-b border-stone-800'
        }`}
      >
        {authConfigured ? (
          <div className="hidden sm:flex items-center gap-2 font-semibold font-treatise">
            {user ? (
              <>
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt=""
                    className={`w-5 h-5 rounded-full ${night ? 'border border-amber-600' : 'border border-stone-700'}`}
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className={`uppercase tracking-widest max-w-[10rem] truncate ${night ? 'text-amber-100' : 'text-stone-900'}`}>
                  {user.displayName || 'Agent'}
                </span>
                <button
                  onClick={onSignOut}
                  className={`hover:underline cursor-pointer uppercase tracking-widest ${
                    night ? 'text-amber-400/80 hover:text-amber-200' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={onSignIn}
                className={`hover:underline cursor-pointer uppercase tracking-widest font-bold ${
                  night ? 'text-amber-300' : 'text-emerald-800'
                }`}
              >
                Sign In With Google
              </button>
            )}
          </div>
        ) : (
          <span className="hidden sm:block" />
        )}
        <div className="w-full sm:w-auto grid grid-cols-3 items-center sm:flex sm:justify-end sm:gap-3 font-semibold font-treatise">
          {isInstallable && (
            <>
              <button
                onClick={promptInstall}
                className={`hidden sm:inline hover:underline cursor-pointer uppercase tracking-widest font-bold ${
                  night ? 'text-amber-300' : 'text-emerald-700'
                }`}
                title="Install app to your device"
              >
                INSTALL APP
              </button>
              <span className={dotClass}>•</span>
            </>
          )}
          {deliverySupported && (
            <button
              type="button"
              onClick={onToggleDelivery}
              disabled={deliveryBlocked && !deliverySubscribed}
              className={`hover:underline cursor-pointer hidden sm:block uppercase tracking-widest ${
                deliveryBlocked && !deliverySubscribed
                  ? night
                    ? 'text-amber-700 cursor-not-allowed'
                    : 'text-stone-400 cursor-not-allowed'
                  : night
                    ? 'text-amber-500/80 hover:text-amber-200'
                    : 'text-stone-500 hover:text-stone-900'
              }`}
              title={
                deliveryBlocked && !deliverySubscribed
                  ? 'Notifications are blocked for this site in your browser settings'
                  : deliverySubscribed
                    ? 'Stop daily delivery notices'
                    : 'Subscribe to daily delivery notifications'
              }
            >
              {deliveryBlocked && !deliverySubscribed
                ? 'DELIVERY BLOCKED'
                : deliverySubscribed
                  ? 'DELIVERY ON'
                  : 'SUBSCRIBE TO DELIVERY'}
            </button>
          )}
          <span className={dotClass}>•</span>
          <button
            type="button"
            onClick={onOpenHandbook}
            className={`justify-self-start sm:justify-self-auto ${linkClass}`}
            title="Open the codebreaker's handbook"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Handbook
          </button>
          {showCaseFiles ? (
            <>
              <span className={dotClass}>•</span>
              <button
                type="button"
                onClick={onOpenCaseFiles}
                className={`justify-self-center sm:justify-self-auto ${linkClass}`}
                title="Open detective case files"
              >
                <FileText className="w-3.5 h-3.5" />
                Case Files
              </button>
            </>
          ) : (
            <span className="sm:hidden" />
          )}
          <span className={dotClass}>•</span>
          <button
            type="button"
            onClick={onOpenArchive}
            className={`justify-self-end sm:justify-self-auto ${linkClass}`}
            title="Browse previous Morning Editions and Night Extras"
          >
            {currentPuzzle.editionDate}
          </button>
        </div>
      </div>

      <div className={`px-3 sm:px-6 py-4 sm:py-6 text-center overflow-hidden ${night ? 'bg-stone-950' : ''}`}>
        <div className="w-full mx-auto flex flex-col items-center">
          {night ? (
            <>
              <span className="text-[10px] font-typewriter font-bold tracking-[0.35em] text-amber-600 uppercase mb-1">
                Late City Final
              </span>
              <p className="font-gothic text-3xl sm:text-5xl md:text-6xl text-amber-100 leading-none">
                The Chronicle
              </p>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-masthead font-black tracking-[0.35em] text-amber-500 uppercase mt-1">
                Night Post
              </h1>
            </>
          ) : (
            <>
              <span className="text-[10px] font-typewriter font-bold tracking-[0.35em] text-stone-500 uppercase mb-1">
                Morning Edition
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-black tracking-tight text-stone-950 drop-shadow-xs my-0 sm:my-1 uppercase whitespace-nowrap">
                The Chronicle Cryptogram
              </h1>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
