import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '../hooks/useLocale';
import { t } from '../lib/i18n';
import { deletePrompt, listPrompts, upsertPrompt, type Prompt } from '../lib/prompts';

interface Props {
  /** Called when the user picks a prompt to insert into the composer. */
  onInsert: (body: string) => void;
  /** Optional initial filter (e.g. "/" prefix from composer slash trigger). */
  filter?: string;
}

interface EditorState {
  id?: string;
  name: string;
  category: string;
  body: string;
}

const EMPTY_EDITOR: EditorState = { name: '', category: '', body: '' };

export function PromptLibrary({ onInsert, filter }: Props) {
  useLocale();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [query, setQuery] = useState(filter ?? '');

  useEffect(() => {
    let alive = true;
    listPrompts()
      .then((list) => {
        if (alive) {
          setPrompts(list);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (filter !== undefined) setQuery(filter);
  }, [filter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q),
    );
  }, [prompts, query]);

  const handleSave = async () => {
    if (!editor || !editor.name.trim() || !editor.body.trim()) return;
    const saved = await upsertPrompt({
      id: editor.id,
      name: editor.name.trim(),
      body: editor.body,
      category: editor.category.trim() || null,
    });
    setPrompts((prev) => {
      const without = prev.filter((p) => p.id !== saved.id);
      return [saved, ...without];
    });
    setEditor(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Delete this prompt?'))) return;
    const ok = await deletePrompt(id);
    if (ok) setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="prompt-library">
      <header className="prompt-library-header">
        <input
          type="search"
          placeholder={t('Search prompts…')}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          className="prompt-library-search"
        />
        <button
          className="prompt-library-add"
          onClick={() => setEditor({ ...EMPTY_EDITOR })}
          title={t('New prompt')}
        >
          + {t('New')}
        </button>
      </header>

      {loading ? (
        <div className="prompt-library-empty">{t('Loading…')}</div>
      ) : filtered.length === 0 ? (
        <div className="prompt-library-empty">
          {prompts.length === 0
            ? t('No prompts yet. Click + New to save your first.')
            : t('No matches.')}
        </div>
      ) : (
        <ul className="prompt-library-list">
          {filtered.map((p) => (
            <li key={p.id} className="prompt-library-item">
              <button
                className="prompt-library-pick"
                onClick={() => onInsert(p.body)}
                title={t('Insert into composer')}
              >
                <div className="prompt-library-name">{p.name}</div>
                {p.category ? (
                  <div className="prompt-library-cat">{p.category}</div>
                ) : null}
                <div className="prompt-library-preview">
                  {p.body.slice(0, 80)}
                  {p.body.length > 80 ? '…' : ''}
                </div>
              </button>
              <div className="prompt-library-actions">
                <button
                  onClick={() =>
                    setEditor({
                      id: p.id,
                      name: p.name,
                      category: p.category ?? '',
                      body: p.body,
                    })
                  }
                  className="prompt-library-edit"
                  title={t('Edit')}
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="prompt-library-del"
                  title={t('Delete')}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editor ? (
        <div
          className="prompt-library-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditor(null);
          }}
        >
          <div className="prompt-library-modal">
            <h3>{editor.id ? t('Edit prompt') : t('New prompt')}</h3>
            <label>
              {t('Name')}
              <input
                autoFocus
                value={editor.name}
                onChange={(e) =>
                  setEditor({ ...editor, name: e.currentTarget.value })
                }
                placeholder={t("e.g. 'Review PR'")}
              />
            </label>
            <label>
              {t('Category')} <span className="prompt-library-hint">{t('(optional)')}</span>
              <input
                value={editor.category}
                onChange={(e) =>
                  setEditor({ ...editor, category: e.currentTarget.value })
                }
                placeholder={t("e.g. 'reviews'")}
              />
            </label>
            <label>
              {t('Body')}
              <textarea
                rows={10}
                value={editor.body}
                onChange={(e) =>
                  setEditor({ ...editor, body: e.currentTarget.value })
                }
                placeholder={t('The full prompt text. Inserted into the composer as-is.')}
              />
            </label>
            <div className="prompt-library-modal-actions">
              <button
                className="prompt-library-cancel"
                onClick={() => setEditor(null)}
              >
                {t('Cancel')}
              </button>
              <button
                className="prompt-library-save"
                disabled={!editor.name.trim() || !editor.body.trim()}
                onClick={handleSave}
              >
                {t('Save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
