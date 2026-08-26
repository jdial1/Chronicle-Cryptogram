import { useState } from 'react';

export function useZoom(min: number, max: number, step: number, initial = 1) {
  const [zoom, setZoom] = useState(initial);
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    zoom,
    canZoomOut: zoom > min,
    canZoomIn: zoom < max,
    zoomOut: () => setZoom((value) => Math.max(min, round(value - step))),
    zoomIn: () => setZoom((value) => Math.min(max, round(value + step))),
  };
}
