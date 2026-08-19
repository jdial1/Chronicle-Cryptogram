import React from 'react';
import { plateSrc } from '../data/plates';

export function EditionPlate({
  plate,
  night = false,
  className = '',
  alt = '',
}: {
  plate?: string | null;
  night?: boolean;
  className?: string;
  alt?: string;
}) {
  const src = plateSrc(plate);
  if (!src) return null;
  return (
    <figure className={`edition-plate${night ? ' is-night' : ''} ${className}`.trim()} aria-hidden={!alt}>
      <img src={src} alt={alt} />
    </figure>
  );
}
