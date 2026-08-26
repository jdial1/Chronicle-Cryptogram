import type { ReactNode } from 'react';

export function DeskActionDock({ children }: { children: ReactNode }) {
  return <div className="modal-action-dock">{children}</div>;
}
