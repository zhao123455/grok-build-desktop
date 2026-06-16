import { useEffect } from 'react';
import { t, type Locale } from '../lib/i18n';

type ThemeMode = 'dark' | 'light';
type DockPosition = 'right' | 'bottom';

export type SettingsSection = 'general' | 'model' | 'permissions' | 'integrations' | 'about';

interface Option {
  value: string;
  label: string;
  detail?: string;
}

export interface SettingsPageProps {
  open: boolean;
  section: SettingsSection;
  onSection: (s: SettingsSection) => void;
  onClose: () => void;

  // General
  locale: Locale;
  setLocale: (l: Locale) => void;
  themeMode: ThemeMode;
  setThemeMode: (t: ThemeMode) => void;
  dockPosition: DockPosition;
  setDockPosition: (d: DockPosition) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;

  // Model & reasoning
  modelOptions: Option[];
  modelPreset: string;
  onModelPreset: (id: string) => void;
  customModel: string;
  setCustomModel: (v: string) => void;
  activeModel: string;
  effortOptions: Option[];
  effortLevel: string;
  setEffortLevel: (v: string) => void;
  reasoningOptions: Option[];
  reasoningEffort: string;
  setReasoningEffort: (v: string) => void;
  bestOfN: number;
  setBestOfN: (v: number) => void;
  experimentalMemory: boolean;
  setExperimentalMemory: (v: boolean) => void;

  // Permissions & policy
  actionPolicyOptions: { value: string; label: string; detail: string; risk: 'none' | 'low' | 'high' }[];
  actionPolicy: string;
  setActionPolicy: (v: string) => void;
  permissionOptions: Option[];
  permissionMode: string;
  setPermissionMode: (v: string) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (v: boolean) => void;
  subagentsEnabled: boolean;
  setSubagentsEnabled: (v: boolean) => void;
  selfCheck: boolean;
  setSelfCheck: (v: boolean) => void;

  // Workspace
  codingCwd: string;
  setCodingCwd: (v: string) => void;
  onPickFolder: () => void;

  // About
  appVersion: string;
  grokVersionLine: string;
}

const NAV: { id: SettingsSection; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'model', label: 'Model & reasoning' },
  { id: 'permissions', label: 'Permissions & policy' },
  { id: 'integrations', label: 'Workspace' },
  { id: 'about', label: 'About' },
];

/** A labelled row: title + description on the left, control on the right. */
function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="set-row">
      <div className="set-row-text">
        <span className="set-row-title">{title}</span>
        {hint ? <span className="set-row-hint">{hint}</span> : null}
      </div>
      <div className="set-row-control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`set-toggle${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="set-toggle-knob" />
    </button>
  );
}

/**
 * Claude-Desktop-style Settings modal: centered card, left section nav,
 * scrollable content on the right. All app configuration lives here — moved
 * out of the cramped inspector dock and the header toolbar.
 */
export function SettingsPage(props: SettingsPageProps) {
  const { open, section, onSection, onClose } = props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true" aria-label="Settings" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <aside className="settings-nav">
          <div className="settings-nav-head">{t('Settings')}</div>
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`settings-nav-item${section === n.id ? ' is-active' : ''}`}
              onClick={() => onSection(n.id)}
            >
              {t(n.label)}
            </button>
          ))}
        </aside>

        <div className="settings-content">
          <button type="button" className="settings-close" aria-label={t('Close settings')} onClick={onClose}>
            ✕
          </button>

          {section === 'general' ? (
            <section className="settings-section">
              <h2>{t('General')}</h2>
              <Row title={t('Appearance')} hint={t('Light uses a warm parchment palette; dark is graphite.')}>
                <div className="set-segmented">
                  <button
                    type="button"
                    className={props.themeMode === 'dark' ? 'is-active' : ''}
                    onClick={() => props.setThemeMode('dark')}
                  >
                    {t('Dark')}
                  </button>
                  <button
                    type="button"
                    className={props.themeMode === 'light' ? 'is-active' : ''}
                    onClick={() => props.setThemeMode('light')}
                  >
                    {t('Light')}
                  </button>
                </div>
              </Row>
              <Row title={t('Language')} hint={t('Choose the interface language.')}>
                <select value={props.locale} onChange={(e) => props.setLocale(e.currentTarget.value as Locale)}>
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </Row>
              <Row title={t('Dock position')} hint={t('Where the Tools / Terminal docks attach.')}>
                <select value={props.dockPosition} onChange={(e) => props.setDockPosition(e.currentTarget.value as DockPosition)}>
                  <option value="right">{t('Right')}</option>
                  <option value="bottom">{t('Bottom')}</option>
                </select>
              </Row>
              <Row title={t('Collapse sidebar by default')} hint={t('Hide the left rail to focus on the conversation (⌘B toggles).')}>
                <Toggle checked={props.sidebarCollapsed} onChange={props.setSidebarCollapsed} label={t('Collapse sidebar')} />
              </Row>
            </section>
          ) : null}

          {section === 'model' ? (
            <section className="settings-section">
              <h2>{t('Model & reasoning')}</h2>
              <Row title={t('Model')} hint={t('Active engine: {model}', { model: props.activeModel })}>
                <select value={props.modelPreset} onChange={(e) => props.onModelPreset(e.currentTarget.value)}>
                  {props.modelOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {t(o.label)}
                    </option>
                  ))}
                </select>
              </Row>
              {props.modelPreset === 'custom' ? (
                <Row title={t('Custom model id')} hint={t('Any model id your Grok CLI accepts.')}>
                  <input
                    value={props.customModel}
                    placeholder="e.g. grok-4.3-latest"
                    onChange={(e) => props.setCustomModel(e.currentTarget.value)}
                  />
                </Row>
              ) : null}
              <Row title={t('Effort')} hint={t('How hard Grok works per turn.')}>
                <select value={props.effortLevel} onChange={(e) => props.setEffortLevel(e.currentTarget.value)}>
                  {props.effortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {t(o.label)}
                    </option>
                  ))}
                </select>
              </Row>
              <Row title={t('Reasoning effort')} hint={t('Extra thinking budget on hard code paths.')}>
                <select value={props.reasoningEffort} onChange={(e) => props.setReasoningEffort(e.currentTarget.value)}>
                  {props.reasoningOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {t(o.label)}
                    </option>
                  ))}
                </select>
              </Row>
              <Row title={t('Best-of-N')} hint={t('Run the task N ways in parallel and keep the best (headless).')}>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={props.bestOfN}
                  onChange={(e) => props.setBestOfN(Math.max(1, Math.min(5, Number(e.currentTarget.value) || 1)))}
                />
              </Row>
              <Row title={t('Cross-session memory')} hint={t('Experimental: let Grok remember across sessions.')}>
                <Toggle checked={props.experimentalMemory} onChange={props.setExperimentalMemory} label={t('Experimental memory')} />
              </Row>
            </section>
          ) : null}

          {section === 'permissions' ? (
            <section className="settings-section">
              <h2>{t('Permissions & policy')}</h2>
              <Row title={t('Action policy')} hint={t('How much Grok is allowed to do on its own.')}>
                <select value={props.actionPolicy} onChange={(e) => props.setActionPolicy(e.currentTarget.value)}>
                  {props.actionPolicyOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {t(o.label)}
                    </option>
                  ))}
                </select>
              </Row>
              {(() => {
                const cur = props.actionPolicyOptions.find((o) => o.value === props.actionPolicy);
                if (!cur) return null;
                return (
                  <p className={`set-policy-detail risk-${cur.risk}`}>
                    {cur.risk === 'high' ? '⚠ ' : ''}
                    {t(cur.detail)}
                  </p>
                );
              })()}
              <Row title={t('Permission mode')} hint={t('Advanced: maps to grok --permission-mode (Plan/Autopilot override this).')}>
                <select value={props.permissionMode} onChange={(e) => props.setPermissionMode(e.currentTarget.value)}>
                  {props.permissionOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {t(o.label)}
                    </option>
                  ))}
                </select>
              </Row>
              <Row title={t('Web search')} hint={t('Allow Grok to fetch current docs / version-sensitive facts.')}>
                <Toggle checked={props.webSearchEnabled} onChange={props.setWebSearchEnabled} label={t('Web search')} />
              </Row>
              <Row title={t('Subagents')} hint={t('Let Grok fan work out to parallel subagents.')}>
                <Toggle checked={props.subagentsEnabled} onChange={props.setSubagentsEnabled} label={t('Subagents')} />
              </Row>
              <Row title={t('Self-check')} hint={t('Append grok --check self-verification loop (headless).')}>
                <Toggle checked={props.selfCheck} onChange={props.setSelfCheck} label={t('Self-check')} />
              </Row>
            </section>
          ) : null}

          {section === 'integrations' ? (
            <section className="settings-section">
              <h2>{t('Workspace')}</h2>
              <Row title={t('Project folder')} hint={t('Working directory Grok runs in (coding mode).')}>
                <div className="set-inline">
                  <input
                    value={props.codingCwd}
                    placeholder="/path/to/your/project"
                    onChange={(e) => props.setCodingCwd(e.currentTarget.value)}
                  />
                  <button type="button" onClick={props.onPickFolder}>
                    {t('Pick…')}
                  </button>
                </div>
              </Row>
            </section>
          ) : null}

          {section === 'about' ? (
            <section className="settings-section">
              <h2>{t('About')}</h2>
              <div className="set-about">
                <div className="set-about-mark">G</div>
                <div>
                  <div className="set-about-name">{t('Grok Build Desktop')}</div>
                  <div className="set-about-ver">v{props.appVersion}</div>
                  <div className="set-about-grok">{props.grokVersionLine}</div>
                </div>
              </div>
              <p className="set-about-blurb">
                {t('A premium desktop client for the Grok Build CLI — non-blocking streaming, multi-session tabs, and a prompt library.')}
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
