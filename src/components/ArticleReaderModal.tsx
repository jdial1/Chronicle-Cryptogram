import React from 'react';
import { EditionPlate } from './EditionPlate';
import { DropCapParagraph } from './DropCapParagraph';
import { DeskModal } from './DeskModal';
import { ZoomControls } from './ZoomControls';
import { useZoom } from '../hooks/useZoom';

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

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  isOpen,
  onClose,
  headline,
  body,
  byline,
  night = false,
  plate,
}) => {
  const { zoom, zoomOut, zoomIn, canZoomOut, canZoomIn } = useZoom(ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT);
  return (
    <DeskModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="article-reader-title"
      title={headline}
      sheetClassName="max-w-2xl"
      titleClassName={`min-w-0 font-black uppercase tracking-tight leading-snug text-sm sm:text-base ${
        night ? 'font-letterpress' : 'font-headline'
      }`}
    >
        <div className="relative flex-1 min-h-0 flex flex-col bg-newsprint">
          <div className="absolute top-1.5 right-1.5 z-20 flex items-center bg-transparent">
            <ZoomControls
              canZoomOut={canZoomOut}
              canZoomIn={canZoomIn}
              onZoomOut={zoomOut}
              onZoomIn={zoomIn}
              outLabel="Decrease article text size"
              inLabel="Increase article text size"
              buttonClassName="desk-hit flex items-center justify-center bg-transparent border-0 text-stone-900 cursor-pointer disabled:opacity-30 disabled:cursor-default"
            />
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
    </DeskModal>
  );
};
