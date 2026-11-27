import {
  BookOpen,
  Cpu,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  PanelLeft,
  PanelRight,
  RotateCw,
  Search,
  Settings,
  Type as TypeIcon,
} from 'lucide-react';
import { useStudy } from '../../state/studyStore';
import {
  GEMINI_MODEL_PRESETS,
  type ActiveWorkspaceMode,
  type ClozeScope,
} from '../../types/study';

interface TopToolbarProps {
  revisionQueueCount: number;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
}

export function TopToolbar({
  revisionQueueCount,
  onOpenSettings,
  onOpenSearch,
}: TopToolbarProps) {
  const {
    config,
    effectiveModelId,
    updateConfig,
    activeMode,
    setActiveMode,
    sidebarOpen,
    setSidebarOpen,
    inspectorOpen,
    setInspectorOpen,
    syncStatus,
    diskSyncAvailable,
  } = useStudy();

  const modes: Array<{ id: ActiveWorkspaceMode; label: string; icon: typeof BookOpen }> = [
    { id: 'read', label: 'Line Reader', icon: BookOpen },
    { id: 'diagrams', label: 'Diagrams', icon: ImageIcon },
    { id: 'vault', label: 'End Vault', icon: Layers },
    { id: 'revise', label: 'Revise Queue', icon: RotateCw },
  ];

  return (
    <header className="macos-toolbar">
      <div className="toolbar-left">
        <div className="traffic-lights" aria-hidden="true">
          <span className="traffic-dot red" />
          <span className="traffic-dot yellow" />
          <span className="traffic-dot green" />
        </div>
        <button
          type="button"
          className={`icon-btn ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen((v) => !v)}
          title="Toggle Sidebar (⌘\)"
        >
          <PanelLeft size={15} />
        </button>
        <div className="app-brand">
          <span>BioStudio</span>
          <span className="app-brand-badge">NCERT</span>
        </div>
      </div>

      <div className="toolbar-center">
        <div className="segmented-control" role="tablist" aria-label="Workspace mode">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={activeMode === m.id}
                className={`segmented-btn ${activeMode === m.id ? 'active' : ''}`}
                onClick={() => setActiveMode(m.id)}
              >
                <Icon size={13.5} />
                <span>{m.label}</span>
                {m.id === 'revise' && (
                  <span
                    className={`segmented-count ${revisionQueueCount === 0 ? 'clear' : ''}`}
                  >
                    {revisionQueueCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="toolbar-right">
        <div className="cloze-control-group">
          <button
            type="button"
            className={`icon-btn ${config.clozeMode ? 'cloze-on' : ''}`}
            onClick={() => updateConfig({ clozeMode: !config.clozeMode })}
            title="Toggle Active Recall Cloze Mode (C)"
          >
            {config.clozeMode ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>Cloze</span>
          </button>
          {config.clozeMode && (
            <select
              className="cloze-scope-select"
              aria-label="Cloze recall scope"
              title="Choose which lines are masked in Cloze Mode"
              value={config.clozeScope}
              onChange={(e) =>
                updateConfig({ clozeScope: e.target.value as ClozeScope })
              }
            >
              <option value="all">All Lines</option>
              <option value="highlighted">Highlighted</option>
              <option value="volatile_trap">Volatile + Trap</option>
            </select>
          )}
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={() =>
            updateConfig({ readerFont: config.readerFont === 'serif' ? 'sans' : 'serif' })
          }
          title={`Switch reading font (currently ${config.readerFont})`}
        >
          <TypeIcon size={14} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSearch}
          title="Search all NCERT lines, diagrams & vault (⌘K)"
        >
          <Search size={14} />
        </button>

        <label className="model-select-pill" title="Active Gemini model for Q&A & MCQs">
          <Cpu size={13} color="var(--accent-blue)" />
          <select
            aria-label="Select Gemini model"
            value={config.useCustomModel ? '__custom__' : config.selectedModel}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                onOpenSettings();
              } else {
                updateConfig({ useCustomModel: false, selectedModel: e.target.value });
              }
            }}
          >
            {GEMINI_MODEL_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.shortLabel}
              </option>
            ))}
            {config.useCustomModel && config.customModelId.trim() && (
              <option value="__custom__">{effectiveModelId} (custom)</option>
            )}
          </select>
        </label>

        <div
          className="sync-indicator"
          title={
            diskSyncAvailable
              ? 'Synced to user-data/study-state.json + IndexedDB'
              : 'Synced to browser IndexedDB'
          }
        >
          <span
            className={`sync-dot ${
              syncStatus === 'saving'
                ? 'saving'
                : syncStatus === 'error'
                  ? 'error'
                  : diskSyncAvailable
                    ? ''
                    : 'browser'
            }`}
          />
          <span>
            {syncStatus === 'saving'
              ? 'Saving…'
              : diskSyncAvailable
                ? 'Disk Sync'
                : 'Local DB'}
          </span>
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSettings}
          title="Gemini API Key, Models & Backup Settings (⌘,)"
        >
          <Settings size={15} />
        </button>

        <button
          type="button"
          className={`icon-btn ${inspectorOpen ? 'active' : ''}`}
          onClick={() => setInspectorOpen((v) => !v)}
          title="Toggle Right Inspector"
        >
          <PanelRight size={15} />
        </button>
      </div>
    </header>
  );
}
