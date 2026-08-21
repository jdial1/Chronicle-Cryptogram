import React from 'react';
import { Newspaper } from '../icons';
import { reloadEdition } from '../utils/useEditionUpdate';

interface EditionUpdateBannerProps {
  localVersion: string;
  serverVersion: string;
}

export const EditionUpdateBanner: React.FC<EditionUpdateBannerProps> = ({
  localVersion,
  serverVersion,
}) => {
  return (
    <aside className="late-edition-banner" role="status" aria-live="polite">
      <div className="late-edition-kicker">
        <Newspaper className="w-4 h-4 shrink-0" />
        <span>Late Edition</span>
      </div>
      <p className="late-edition-dek">A newer plate is on the wire. Reload to take the fresh sheets.</p>
      <p className="late-edition-versions">
        <span>
          This desk <strong>{localVersion}</strong>
        </span>
        <span aria-hidden className="late-edition-rule">
          |
        </span>
        <span>
          The press <strong>{serverVersion}</strong>
        </span>
      </p>
      <button type="button" className="woodblock-stamp late-edition-reload" onClick={() => reloadEdition()}>
        Reload the page
      </button>
    </aside>
  );
};
