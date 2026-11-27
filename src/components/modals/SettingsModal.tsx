import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  HardDriveDownload,
  KeyRound,
  Loader2,
  Smartphone,
  Upload,
  X,
} from 'lucide-react';
import { testGeminiConnection } from '../../services/geminiClient';
import {
  downloadAllOfflineMedia,
  getOfflineMediaStatus,
  usePwaInstall,
} from '../../services/pwa';
import { useStudy } from '../../state/studyStore';
import { GEMINI_MODEL_PRESETS, type ClozeScope } from '../../types/study';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const {
    config,
    effectiveModelId,
    updateConfig,
    diskSyncAvailable,
    exportBackup,
    importBackupJson,
  } = useStudy();

  const { canInstall, isStandalone, platformHint, promptInstall } = usePwaInstall();

  const [apiKeyDraft, setApiKeyDraft] = useState(config.apiKey);
  const [customModelDraft, setCustomModelDraft] = useState(config.customModelId);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<{
    supported: boolean;
    cached: number;
    total: number;
  } | null>(null);
  const [downloadingMedia, setDownloadingMedia] = useState(false);
  const [offlineFeedback, setOfflineFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    void getOfflineMediaStatus().then((status) => {
      if (active) setOfflineStatus(status);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleInstallApp = async () => {
    setInstallFeedback(null);
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstallFeedback('BioStudio is installing to your device.');
    } else if (outcome === 'dismissed') {
      setInstallFeedback('Install prompt dismissed — you can install anytime from here or the browser menu.');
    }
  };

  const handleDownloadOfflineMedia = async () => {
    if (downloadingMedia) return;
    setDownloadingMedia(true);
    setOfflineFeedback(null);
    try {
      const res = await downloadAllOfflineMedia((progress) => {
        setOfflineStatus({ supported: true, cached: progress.cached, total: progress.total });
      });
      setOfflineStatus({ supported: true, cached: res.cached, total: res.total });
      setOfflineFeedback(
        res.failed === 0
          ? { ok: true, text: `All ${res.cached} NCERT diagrams & PDF pages cached for offline use.` }
          : {
              ok: false,
              text: `Cached ${res.cached} of ${res.total} images (${res.failed} failed — check connection and retry).`,
            },
      );
    } catch (err) {
      setOfflineFeedback({
        ok: false,
        text: err instanceof Error ? err.message : 'Offline media download failed.',
      });
    } finally {
      setDownloadingMedia(false);
    }
  };

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

          {/* Active Recall Preferences */}
          <div className="field-group">
            <div className="field-label">Active Recall Preferences</div>
            <div className="field-help">
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

          {/* Local Persistence & JSON Backup */}
          <div className="field-group">
            <div className="field-label">Study Data Persistence & Backup</div>
            <div className="field-help">
              Status:{' '}
              {diskSyncAvailable
                ? 'Dual sync active — saving to user-data/study-state.json + Browser IndexedDB.'
                : 'Private Browser Storage (IndexedDB) active — your notes, custom lines, pinned MCQs, and API key stay exclusively on this browser. Export a JSON backup anytime.'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
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

          {/* App Install & Offline Access (PWA) */}
          <div className="field-group">
            <div className="field-label">
              <Smartphone size={12} style={{ marginRight: 5, verticalAlign: '-1px' }} />
              App Install &amp; Offline Access (PWA)
            </div>
            <div className="pwa-settings-card">
              <div className="pwa-settings-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12.8 }}>
                    {isStandalone ? 'Installed as Standalone App' : 'Install BioStudio on This Device'}
                  </div>
                  <div className="field-help" style={{ marginTop: 2 }}>
                    {isStandalone
                      ? 'Running as an installed app. All 6 NCERT chapters, highlights, Cloze mode, and vault work offline.'
                      : canInstall
                        ? 'Install BioStudio directly from your browser for full-screen Android/desktop launch and offline study.'
                        : platformHint === 'ios'
                          ? 'In Safari, tap the Share button and choose "Add to Home Screen" to install BioStudio.'
                          : platformHint === 'android'
                            ? 'In Chrome on Android, tap the browser menu (⋮) and choose "Install app" or "Add to Home screen".'
                            : 'Use your browser address bar Install icon or browser menu to install BioStudio locally.'}
                  </div>
                </div>
                {isStandalone ? (
                  <span className="micro-badge" style={{ color: 'var(--accent-green)', background: 'var(--accent-green-soft)' }}>
                    <Check size={11} /> Installed
                  </span>
                ) : canInstall ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => void handleInstallApp()}
                  >
                    <Download size={13} /> Install App
                  </button>
                ) : null}
              </div>

              {installFeedback && <div className="success-banner">{installFeedback}</div>}

              {offlineStatus?.supported && offlineStatus.total > 0 && (
                <div className="pwa-offline-divider">
                  <div className="pwa-settings-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                        Offline NCERT Diagrams &amp; PDF Pages
                      </div>
                      <div className="field-help" style={{ marginTop: 2 }}>
                        All chapter text works offline automatically. Diagrams &amp; PDF pages cache as you view them ({offlineStatus.cached} / {offlineStatus.total} cached).
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={
                        downloadingMedia ||
                        (offlineStatus.total > 0 && offlineStatus.cached >= offlineStatus.total)
                      }
                      onClick={() => void handleDownloadOfflineMedia()}
                    >
                      {downloadingMedia ? (
                        <>
                          <Loader2 size={13} className="spin" />
                          {offlineStatus.cached}/{offlineStatus.total}
                        </>
                      ) : offlineStatus.cached >= offlineStatus.total ? (
                        <>
                          <Check size={13} /> All Cached
                        </>
                      ) : (
                        <>
                          <HardDriveDownload size={13} /> Download All (~30 MB)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {offlineFeedback && (
                <div className={offlineFeedback.ok ? 'success-banner' : 'error-banner'}>
                  {offlineFeedback.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
