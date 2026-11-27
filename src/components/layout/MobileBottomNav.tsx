import { BookOpen, Image as ImageIcon, Layers, RotateCw } from 'lucide-react';
import { isCompactViewport, useStudy } from '../../state/studyStore';
import type { ActiveWorkspaceMode } from '../../types/study';

interface MobileBottomNavProps {
  revisionQueueCount: number;
}

const MOBILE_MODES: Array<{
  id: ActiveWorkspaceMode;
  label: string;
  icon: typeof BookOpen;
}> = [
  { id: 'read', label: 'Read', icon: BookOpen },
  { id: 'diagrams', label: 'Diagrams', icon: ImageIcon },
  { id: 'vault', label: 'Vault', icon: Layers },
  { id: 'revise', label: 'Revise', icon: RotateCw },
];

export function MobileBottomNav({ revisionQueueCount }: MobileBottomNavProps) {
  const { activeMode, setActiveMode, setSidebarOpen, setInspectorOpen } = useStudy();

  const handleSelectMode = (mode: ActiveWorkspaceMode) => {
    setActiveMode(mode);
    if (isCompactViewport()) {
      setSidebarOpen(false);
      setInspectorOpen(false);
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Workspace mode navigation">
      {MOBILE_MODES.map((m) => {
        const Icon = m.icon;
        const isActive = activeMode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => handleSelectMode(m.id)}
          >
            <span className="mobile-nav-icon-wrap">
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              {m.id === 'revise' && revisionQueueCount > 0 && (
                <span className="mobile-nav-badge" aria-label={`${revisionQueueCount} pending`}>
                  {revisionQueueCount > 99 ? '99+' : revisionQueueCount}
                </span>
              )}
            </span>
            <span className="mobile-nav-label">{m.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
