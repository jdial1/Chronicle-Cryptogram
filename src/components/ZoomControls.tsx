import React, { type PointerEventHandler } from 'react';
import { Search } from '../icons';

type ZoomControlsProps = {
  canZoomOut: boolean;
  canZoomIn: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
  outLabel: string;
  inLabel: string;
  outCaption?: string;
  inCaption?: string;
  buttonClassName?: string;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel?: PointerEventHandler<HTMLButtonElement>;
};

export function ZoomControls({
  canZoomOut,
  canZoomIn,
  onZoomOut,
  onZoomIn,
  outLabel,
  inLabel,
  outCaption,
  inCaption,
  buttonClassName,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}: ZoomControlsProps) {
  const pointer = { onPointerDown, onPointerUp, onPointerCancel };
  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        aria-label={outLabel}
        title={outLabel}
        data-caption={outCaption}
        disabled={!canZoomOut}
        onClick={onZoomOut}
        {...pointer}
      >
        <Search className="w-3 h-3" />
      </button>
      <button
        type="button"
        className={buttonClassName}
        aria-label={inLabel}
        title={inLabel}
        data-caption={inCaption}
        disabled={!canZoomIn}
        onClick={onZoomIn}
        {...pointer}
      >
        <Search className="w-5 h-5" />
      </button>
    </>
  );
}
