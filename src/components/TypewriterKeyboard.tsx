import React from 'react';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const PRESS_MS = 150;
const armedAt = new WeakMap<HTMLButtonElement, number>();
const pendingUp = new WeakMap<HTMLButtonElement, number>();

interface TypewriterKeyboardProps {
  onLetter: (letter: string) => void;
  onBackspace: () => void;
}

export function armKey(event: React.PointerEvent<HTMLButtonElement>) {
  event.preventDefault();
  const key = event.currentTarget;
  if (key.disabled) return;
  const pending = pendingUp.get(key);
  if (pending) {
    window.clearTimeout(pending);
    pendingUp.delete(key);
  }
  key.classList.add('is-pressed');
  key.setPointerCapture(event.pointerId);
  armedAt.set(key, performance.now());
}

export function releaseKey(event: React.PointerEvent<HTMLButtonElement>) {
  const key = event.currentTarget;
  const started = armedAt.get(key) ?? performance.now();
  const wait = Math.max(0, PRESS_MS - (performance.now() - started));
  const later = window.setTimeout(() => {
    key.classList.remove('is-pressed');
    pendingUp.delete(key);
    armedAt.delete(key);
  }, wait);
  pendingUp.set(key, later);
}

export const TypewriterKeyboard: React.FC<TypewriterKeyboardProps> = ({ onLetter, onBackspace }) => {
  return (
    <div className="typewriter-bank" role="group" aria-label="Typewriter keyboard">
      {ROWS.map((row, index) => (
        <div key={row} className="typewriter-row">
          {row.split('').map((letter) => (
            <button
              key={letter}
              type="button"
              className="typewriter-key"
              aria-label={letter}
              onPointerDown={armKey}
              onPointerUp={releaseKey}
              onPointerCancel={releaseKey}
              onClick={() => onLetter(letter)}
            >
              {letter}
            </button>
          ))}
          {index === 2 ? (
            <button
              type="button"
              className="typewriter-key typewriter-key-bksp"
              aria-label="Backspace"
              onPointerDown={armKey}
              onPointerUp={releaseKey}
              onPointerCancel={releaseKey}
              onClick={onBackspace}
            >
              BKSP
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
};
