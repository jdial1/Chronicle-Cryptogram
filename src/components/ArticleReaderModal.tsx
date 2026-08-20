import React, { useState } from 'react';
import { Search, X } from '../icons';
import { EditionPlate } from './EditionPlate';

interface ArticleReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  headline: string;
  body: string;
  byline: string;
  night?: boolean;
  plate?: string | null;
}

const ZOOM_MIN = 0.9;
const ZOOM_MAX = 1.8;
const ZOOM_STEP = 0.15;
const ZOOM_DEFAULT = 1;

export function DropCapParagraph({
  text,
  className = '',
  night = false,
}: {
  text: string;
  className?: string;
  night?: boolean;
}) {
  const kickerMatch = text.match(/^\([^)]*\)\s*/);
  const kicker = kickerMatch?.[0].trim();
  const story = (kickerMatch ? text.slice(kickerMatch[0].length) : text).trimStart();
  const letter = story.match(/^[A-Za-z]/)?.[0];
  const rest = letter ? story.slice(1) : story;

  return (
    <>
      {kicker && <p className={className}>{kicker}</p>}
      <p className={className}>
        {letter && (
          <span className={`article-dropcap-letter ${night ? 'is-night' : ''}`}>{letter}</span>
        )}
        {rest}
      </p>
    </>
  );
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  isOpen,
  onClose,
  headline,
  body,
  byline,
  night = false,
  plate,
}) => {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop z-50 select-none" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-reader-title"
        className="modal-sheet max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-masthead">
          <h2
            id="article-reader-title"
            className={`min-w-0 font-black uppercase tracking-tight leading-snug text-sm sm:text-base ${
              night ? 'font-letterpress' : 'font-headline'
            }`}
          >
            {headline}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="desk-hit shrink-0 flex items-center justify-center text-stone-700 hover:text-stone-950 rounded hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 min-h-0 flex flex-col bg-newsprint">
          <div className="absolute top-1.5 right-1.5 z-20 flex items-center bg-transparent">
            <button
              type="button"
              className="desk-hit flex items-center justify-center bg-transparent border-0 text-stone-900 cursor-pointer disabled:opacity-30 disabled:cursor-default"
              aria-label="Decrease article text size"
              disabled={zoom <= ZOOM_MIN}
              onClick={() =>
                setZoom((value) => Math.max(ZOOM_MIN, Math.round((value - ZOOM_STEP) * 100) / 100))
              }
            >
              <Search className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="desk-hit flex items-center justify-center bg-transparent border-0 text-stone-900 cursor-pointer disabled:opacity-30 disabled:cursor-default"
              aria-label="Increase article text size"
              disabled={zoom >= ZOOM_MAX}
              onClick={() =>
                setZoom((value) => Math.min(ZOOM_MAX, Math.round((value + ZOOM_STEP) * 100) / 100))
              }
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-y-auto px-5 pt-11 pb-5 sm:px-8 sm:pt-12 sm:pb-6 text-stone-950"
            style={{ fontSize: `calc(${zoom}rem + 2pt)` }}
          >
            <EditionPlate plate={plate} night={night} className="article-reader-plate" />
            <DropCapParagraph
              text={body}
              night={night}
              className="reading-measure font-treatise italic text-[1.05em] leading-[1.65]"
            />
          </div>
        </div>

        <div className="modal-action-dock px-3 py-2.5 sm:px-4">
          <p className="font-newspaper font-semibold text-sm text-stone-950">
            — {byline}
          </p>
        </div>
      </section>
    </div>
  );
};
