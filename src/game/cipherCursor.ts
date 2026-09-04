import { SymbolMapping } from '../types';

export function dismissMobileKeyboard(input: HTMLInputElement | null) {
  input?.blur();
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
}

export function selectedGlyphTile(symbolId: string, cellId?: string | null) {
  if (cellId) {
    const cell = document.querySelector(`[data-cipher-cell="${CSS.escape(cellId)}"]`);
    if (cell instanceof HTMLElement && cell.getAttribute('data-cipher-symbol') === symbolId) {
      return cell;
    }
  }
  return document.querySelector(`[data-cipher-symbol="${CSS.escape(symbolId)}"]`);
}

export function placeCipherInput(symbolId: string, input: HTMLInputElement, cellId?: string | null) {
  const tile = selectedGlyphTile(symbolId, cellId);
  if (!(tile instanceof HTMLElement)) return null;
  const rect = tile.getBoundingClientRect();
  input.style.left = `${rect.left}px`;
  input.style.top = `${rect.top}px`;
  input.style.width = `${Math.max(16, rect.width)}px`;
  input.style.height = `${Math.max(16, rect.height)}px`;
  return tile;
}

export function letterCells(
  words: { id: string; symbols: { symbolId: string; isPunctuation?: boolean }[] }[]
) {
  const cells: { cellId: string; symbolId: string }[] = [];
  words.forEach((word) => {
    word.symbols.forEach((item, charIdx) => {
      if (!item.isPunctuation) cells.push({ cellId: `${word.id}_${charIdx}`, symbolId: item.symbolId });
    });
  });
  return cells;
}

export function cellCursor(
  cells: { cellId: string; symbolId: string }[],
  selectedSymbolId: string | null,
  selectedCellId?: string | null
) {
  if (selectedCellId) {
    const byCell = cells.findIndex((cell) => cell.cellId === selectedCellId);
    if (byCell >= 0) return byCell;
  }
  if (!selectedSymbolId) return 0;
  const bySymbol = cells.findIndex((cell) => cell.symbolId === selectedSymbolId);
  return bySymbol < 0 ? 0 : bySymbol;
}

export function nextOpenCell(
  cells: { cellId: string; symbolId: string }[],
  selectedSymbolId: string | null,
  selectedCellId: string | null,
  mappings: SymbolMapping
) {
  if (!cells.length) return null;
  const start = cellCursor(cells, selectedSymbolId, selectedCellId);
  for (let step = 1; step <= cells.length; step += 1) {
    const cell = cells[(start + step) % cells.length];
    if (!mappings[cell.symbolId]) return cell;
  }
  return null;
}

export function previousCell(
  cells: { cellId: string; symbolId: string }[],
  selectedSymbolId: string | null,
  selectedCellId?: string | null
) {
  const start = cellCursor(cells, selectedSymbolId, selectedCellId);
  if (start <= 0) return null;
  return cells[start - 1];
}

export function webTypeFeel(kind: 'tap' | 'key') {
  try {
    navigator.vibrate?.(kind === 'tap' ? 12 : 8);
  } catch {
    return;
  }
}
