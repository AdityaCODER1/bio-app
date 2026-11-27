import { useRef, useState } from 'react';
import {
  Check,
  Download,
  KeyRound,
  Loader2,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { testGeminiConnection } from '../../services/geminiClient';
import { useStudy } from '../../state/studyStore';
import { GEMINI_MODEL_PRESETS, type ClozeScope } from '../../types/study';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const {
    state,
    config,
    effectiveModelId,
    updateConfig,
    restoreAllPresetHighYield,
    diskSyncAvailable,
    exportBackup,
    importBackupJson,
  } = useStudy();

  const [apiKeyDraft, setApiKeyDraft] = useState(config.apiKey);
  const [customModelDraft, setCustomModelDraft] = useState(config.customModelId);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveKey = () => {
    updateConfig({ apiKey: apiKeyDraft.trim(), customModelId: customModelDraft.trim() });
    setTestResult({
      ok: true,
      text: diskSyncAvailable
        ? 'Saved locally to user-data/local-config.json + Browser IndexedDB.'
        : 'Saved privately in your browser (IndexedDB) — never uploaded anywhere.',
    });
  };

  const handleTest = async () => {
    const key = apiKeyDraft.trim();
    if (!key) {
      setTestResult({ ok: false, text: 'Paste a Gemini API key first.' });
      return;
    }
    updateConfig({ apiKey: key, customModelId: customModelDraft.trim() });
    setTesting(true);
    setTestResult(null);
    try {
      const modelToTest =
        config.useCustomModel && customModelDraft.trim()
          ? customModelDraft.trim()
          : config.selectedModel;
      const res = await testGeminiConnection(key, modelToTest);
      setTestResult({
        ok: true,
        text: `Connected to ${modelToTest} in ${res.latencyMs}ms — "${res.reply}"`,
      });
    } catch (err) {
      setTestResult({
        ok: false,
        text: err instanceof Error ? err.message : 'Connection failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="macos-modal"
        role="dialog"
        aria-modal="true"
        aria-label="BioStudio Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Settings — Gemini Models & Local Data</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* API Key */}
          <div className="field-group">
            <label className="field-label" htmlFor="gemini-api-key">
              <KeyRound size={12} style={{ marginRight: 5, verticalAlign: '-1px' }} />
              Gemini API Key (Google AI Studio)
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                id="gemini-api-key"
                type="password"
                className="macos-input"
                placeholder="AIzaSy…"
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
              />
              <button type="button" className="btn-primary" onClick={handleSaveKey}>
                Save
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={testing}
                onClick={() => void handleTest()}
              >
                {testing ? <Loader2 size={13} /> : 'Test'}
              </button>
            </div>
            <div className="field-help">
              Stored locally in <code>user-data/local-config.json</code> (automatically
              gitignored) or read from <code>GEMINI_API_KEY</code> in <code>.env.local</code>.
            </div>
            {testResult && (
              <div className={testResult.ok ? 'success-banner' : 'error-banner'}>
                {testResult.text}
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="field-group">
            <div className="field-label">
              Gemini Model Selection (Active: <code>{effectiveModelId}</code>)
            </div>
            <div className="model-radio-grid">
              {GEMINI_MODEL_PRESETS.map((preset) => {
                const isSelected = !config.useCustomModel && config.selectedModel === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`model-radio-card ${isSelected ? 'selected' : ''}`}
                    onClick={() =>
                      updateConfig({ useCustomModel: false, selectedModel: preset.id })
                    }
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <strong style={{ fontSize: 13 }}>{preset.label}</strong>
                        <span className="micro-badge">{preset.badge}</span>
                      </div>
                      <div className="field-help" style={{ marginTop: 2 }}>
                        <code>{preset.id}</code> — {preset.description}
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="var(--accent-blue)" />}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
                <input
                  type="checkbox"
                  checked={config.useCustomModel}
                  onChange={(e) => updateConfig({ useCustomModel: e.target.checked })}
                />
                Use a custom Gemini model ID (e.g. <code>gemini-4-neon</code>)
              </label>
              {config.useCustomModel && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="macos-input"
                    placeholder="Enter exact Gemini model string..."
                    value={customModelDraft}
                    onChange={(e) => setCustomModelDraft(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => updateConfig({ customModelId: customModelDraft.trim() })}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reader Typography */}
          <div className="field-group">
            <div className="field-label">Reader Typography</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div className="segmented-control">
                <button
                  type="button"
                  className={`segmented-btn ${config.readerFont === 'serif' ? 'active' : ''}`}
                  onClick={() => updateConfig({ readerFont: 'serif' })}
                >
                  Newsreader Serif
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${config.readerFont === 'sans' ? 'active' : ''}`}
                  onClick={() => updateConfig({ readerFont: 'sans' })}
                >
                  SF / Inter Sans
                </button>
              </div>
              <div className="segmented-control">
                {(['compact', 'comfortable', 'large'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`segmented-btn ${config.fontSize === sz ? 'active' : ''}`}
                    onClick={() => updateConfig({ fontSize: sz })}
                  >
                    {sz[0].toUpperCase() + sz.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Highlights & Active Recall Preferences */}
          <div className="field-group">
            <div className="field-label">Highlights & Active Recall Preferences</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div className="field-help" style={{ marginBottom: 5 }}>
                  Cloze Mode Scope — choose which sentences are masked when Active Recall Cloze Mode (<code>C</code>) is turned on:
                </div>
                <div className="segmented-control">
                  {(
                    [
                      { id: 'all', label: 'All Lines' },
                      { id: 'highlighted', label: 'Highlighted Only' },
                      { id: 'volatile_trap', label: 'Volatile & Trap Only' },
                    ] as Array<{ id: ClozeScope; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`segmented-btn ${config.clozeScope === opt.id ? 'active' : ''}`}
                      onClick={() => updateConfig({ clozeScope: opt.id })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
                  <input
                    type="checkbox"
                    checked={config.showPresetHighYield}
                    onChange={(e) =>
                      updateConfig({ showPresetHighYield: e.target.checked })
                    }
                  />
                  Show preset NCERT High-Yield badges in Reader
                </label>

                {state.dismissedHighYieldIds.length > 0 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => restoreAllPresetHighYield()}
                  >
                    <RotateCcw size={12.5} />
                    Restore {state.dismissedHighYieldIds.length} Dismissed Badge
                    {state.dismissedHighYieldIds.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Local Persistence & JSON Backup */}
          <div className="field-group">
            <div className="field-label">Study Data Persistence & Backup</div>
            <div className="field-help">
              Status:{' '}
              {diskSyncAvailable
                ? 'Dual sync active — saving to user-data/study-state.json + Browser IndexedDB.'
                : 'Private Browser Storage (IndexedDB) active — your notes, custom lines, pinned MCQs, and API key stay exclusively on this browser. Export a JSON backup anytime.'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" className="btn-secondary" onClick={exportBackup}>
                <Download size={13} /> Export JSON Backup
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={13} /> Import JSON Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  file.text().then((raw) => {
                    const res = importBackupJson(raw);
                    setImportFeedback({
                      ok: res.ok,
                      text: res.ok
                        ? 'Backup imported and synced!'
                        : res.error || 'Import failed.',
                    });
                  });
                }}
              />
            </div>
            {importFeedback && (
              <div className={importFeedback.ok ? 'success-banner' : 'error-banner'}>
                {importFeedback.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
