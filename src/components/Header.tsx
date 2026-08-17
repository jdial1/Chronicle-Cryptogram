import React from 'react';
import { PuzzleData } from '../types';
import { usePWAInstall } from '../utils/usePWAInstall';

interface HeaderProps {
  currentPuzzle: PuzzleData;
}

export const Header: React.FC<HeaderProps> = ({
  currentPuzzle,
}) => {
  const { isInstallable, promptInstall } = usePWAInstall();

  return (
    <header className="w-full bg-[#fbf7ee] border-b-2 border-stone-900 select-none">
      {/* Top Dateline Bar */}
      <div className="border-b border-stone-800 px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-end text-xs font-newspaper tracking-wider text-stone-800">
        <div className="flex items-center gap-3 font-semibold font-treatise">
          {isInstallable && (
            <>
              <button 
                onClick={promptInstall}
                className="hover:underline cursor-pointer uppercase tracking-widest text-emerald-700 font-bold"
                title="Install app to your device"
              >
                INSTALL APP
              </button>
              <span className="hidden sm:inline text-stone-400">•</span>
            </>
          )}
          <button 
            onClick={() => Notification.requestPermission().then(() => window.location.reload())}
            className="hover:underline cursor-pointer hidden sm:block uppercase tracking-widest text-stone-500 hover:text-stone-900"
            title="Subscribe to daily delivery notifications"
          >
            SUBSCRIBE TO DELIVERY
          </button>
          <span className="hidden sm:inline text-stone-400">•</span>
          <span className="uppercase tracking-widest">{currentPuzzle.editionDate}</span>
          <span className="text-stone-400">•</span>
          <span className="bg-stone-900 text-[#fbf7ee] px-2 py-0.5 text-[10px] font-typewriter font-bold tracking-widest rounded-xs">
            FIVE CENTS
          </span>
        </div>
      </div>

      {/* Main Authentic Broadsheet Masthead */}
      <div className="px-3 sm:px-6 py-4 sm:py-6 text-center overflow-hidden">
        <div className="w-full mx-auto flex flex-col items-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-black tracking-tight text-stone-950 drop-shadow-xs my-0 sm:my-1 uppercase whitespace-nowrap">
            The Chronicle Cryptogram
          </h1>
        </div>
      </div>
    </header>
  );
};

