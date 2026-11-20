import { Bookmark, FolderOpen, Save, Trash2 } from 'lucide-react';
import { SavedMenu } from '../types/workout';

interface SavedMenusPanelProps {
  savedMenus: SavedMenu[];
  canSave: boolean;
  justSaved: boolean;
  onSaveCurrent: () => void;
  onLoadMenu: (menu: SavedMenu) => void;
  onDeleteMenu: (id: string) => void;
}

export function SavedMenusPanel({
  savedMenus,
  canSave,
  justSaved,
  onSaveCurrent,
  onLoadMenu,
  onDeleteMenu,
}: SavedMenusPanelProps) {
  return (
    <aside className="card saved-card" aria-label="Saved Workout Menus">
      <div className="saved-header">
        <div>
          <span className="eyebrow">Your Library</span>
          <h3>Saved Menus</h3>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onSaveCurrent}
          disabled={!canSave}
        >
          <Save size={14} />
          {justSaved ? 'Saved!' : 'Save Current'}
        </button>
      </div>

      {savedMenus.length === 0 ? (
        <div className="saved-empty">
          <Bookmark size={20} />
          <p>
            Save your favorite routines here (e.g. <em>Push — DB + Bench</em> or{' '}
            <em>Quick Floor Full Body</em>) so you can load them anytime.
          </p>
        </div>
      ) : (
        <ul className="saved-list">
          {savedMenus.map((menu) => (
            <li key={menu.id} className="saved-item">
              <div className="saved-item-info">
                <strong>{menu.name}</strong>
                <div className="tag-row">
                  <span className="badge eq-dumbbell">DB</span>
                  {menu.equipment.useBench && (
                    <span className="badge eq-bench">Bench</span>
                  )}
                  {menu.equipment.includeBarbell && (
                    <span className="badge eq-barbell">Barbell</span>
                  )}
                  <span className="muted small">
                    · {menu.items.length} exercises
                  </span>
                </div>
              </div>
              <div className="saved-item-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onLoadMenu(menu)}
                  title="Load menu"
                >
                  <FolderOpen size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => onDeleteMenu(menu.id)}
                  title="Delete saved menu"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
