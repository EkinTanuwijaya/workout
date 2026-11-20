import { useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, X } from 'lucide-react';
import { MUSCLE_LABELS } from '../data/exercises';
import { EquipmentConfig, Exercise, MuscleGroup } from '../types/workout';
import { getCompatibleExercises } from '../utils/generator';

interface ExercisePickerModalProps {
  mode: 'add' | 'swap';
  equipment: EquipmentConfig;
  initialMuscle?: MuscleGroup | 'all';
  existingExerciseIds: string[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

const MUSCLE_FILTERS: (MuscleGroup | 'all')[] = [
  'all',
  'chest',
  'back',
  'shoulders',
  'legs',
  'arms',
  'core',
];

export function ExercisePickerModal({
  mode,
  equipment,
  initialMuscle = 'all',
  existingExerciseIds,
  onSelect,
  onClose,
}: ExercisePickerModalProps) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>(initialMuscle);

  const compatible = useMemo(
    () => getCompatibleExercises(equipment),
    [equipment]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return compatible.filter((ex) => {
      if (muscle !== 'all' && ex.muscleGroup !== muscle) return false;
      if (
        q &&
        !ex.name.toLowerCase().includes(q) &&
        !ex.formCue.toLowerCase().includes(q) &&
        !ex.equipmentTags.some((t) => t.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [compatible, muscle, query]);

  const existingSet = new Set(existingExerciseIds);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'add' ? 'Add Exercise' : 'Swap Exercise'}
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{mode === 'add' ? 'Add Exercise' : 'Swap Exercise'}</h3>
            <p className="muted small">
              Showing {filtered.length} exercises matching your equipment (
              {[
                'Dumbbells',
                equipment.useBench ? 'Bench' : null,
                equipment.includeBarbell ? 'Barbell' : null,
              ]
                .filter(Boolean)
                .join(' + ')}
              )
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises (e.g. press, row, squat, barbell)..."
              autoFocus
            />
          </div>
          <div className="pill-row compact">
            {MUSCLE_FILTERS.map((m) => (
              <button
                key={m}
                type="button"
                className={`pill-btn ${muscle === m ? 'active' : ''}`}
                onClick={() => setMuscle(m)}
              >
                {m === 'all' ? 'All Muscles' : MUSCLE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>No matching exercises for your current equipment filter.</p>
            </div>
          ) : (
            filtered.map((ex) => {
              const inMenu = existingSet.has(ex.id);
              return (
                <div key={ex.id} className="picker-row">
                  <div className="picker-info">
                    <div className="exercise-name-row">
                      <span className="picker-name">{ex.name}</span>
                      {inMenu && (
                        <span className="badge in-menu-badge">In Menu</span>
                      )}
                    </div>
                    <div className="tag-row">
                      <span className={`badge muscle-${ex.muscleGroup}`}>
                        {MUSCLE_LABELS[ex.muscleGroup]}
                      </span>
                      {ex.equipmentTags.map((tag) => (
                        <span
                          key={tag}
                          className={`badge eq-${tag.toLowerCase()}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="muted small">{ex.formCue}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelect(ex)}
                  >
                    {mode === 'add' ? (
                      <>
                        <Plus size={14} /> Add
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} /> Swap
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
