import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Info,
  PlayCircle,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { EXERCISE_MAP, MUSCLE_LABELS } from '../data/exercises';
import {
  EquipmentConfig,
  Exercise,
  WeightUnit,
  WorkoutItem,
} from '../types/workout';
import { isExerciseCompatible } from '../utils/generator';
import { ExerciseMotion } from './ExerciseMotion';

interface WorkoutMenuListProps {
  menuTitle: string;
  items: WorkoutItem[];
  equipment: EquipmentConfig;
  unit: WeightUnit;
  copied: boolean;
  onMenuTitleChange: (title: string) => void;
  onUpdateItem: (instanceId: string, patch: Partial<WorkoutItem>) => void;
  onToggleSet: (instanceId: string, setIndex: number) => void;
  onMoveItem: (index: number, direction: -1 | 1) => void;
  onRemoveItem: (instanceId: string) => void;
  onQuickSwap: (instanceId: string) => void;
  onOpenSwapModal: (instanceId: string) => void;
  onOpenMotionModal: (exercise: Exercise) => void;
  onOpenAddModal: () => void;
  onCopyMenu: () => void;
}

export function WorkoutMenuList({
  menuTitle,
  items,
  equipment,
  unit,
  copied,
  onMenuTitleChange,
  onUpdateItem,
  onToggleSet,
  onMoveItem,
  onRemoveItem,
  onQuickSwap,
  onOpenSwapModal,
  onOpenMotionModal,
  onOpenAddModal,
  onCopyMenu,
}: WorkoutMenuListProps) {
  const handleSetsChange = (item: WorkoutItem, raw: string) => {
    const num = Math.max(1, Math.min(10, parseInt(raw, 10) || 1));
    const nextCompleted = Array.from({ length: num }, (_, i) =>
      Boolean(item.completedSets[i])
    );
    onUpdateItem(item.instanceId, {
      sets: num,
      completedSets: nextCompleted,
    });
  };

  return (
    <section className="card menu-card" aria-label="Your Workout Menu">
      <div className="menu-header">
        <div className="menu-title-wrap">
          <span className="eyebrow">Active Menu</span>
          <input
            type="text"
            className="menu-title-input"
            value={menuTitle}
            onChange={(e) => onMenuTitleChange(e.target.value)}
            aria-label="Workout menu name"
            placeholder="Name your workout..."
          />
        </div>
        <div className="menu-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCopyMenu}
            disabled={items.length === 0}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenAddModal}
          >
            <Plus size={15} />
            Add Exercise
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your workout menu is empty.</p>
          <p className="muted">
            Click <strong>Generate Menu</strong> above or{' '}
            <strong>Add Exercise</strong> to start building.
          </p>
        </div>
      ) : (
        <div className="exercise-list">
          {items.map((item, idx) => {
            const exercise = EXERCISE_MAP[item.exerciseId];
            if (!exercise) return null;
            const compatible = isExerciseCompatible(exercise, equipment);
            const allDone =
              item.completedSets.length > 0 &&
              item.completedSets.every(Boolean);

            return (
              <article
                key={item.instanceId}
                className={`exercise-item ${!compatible ? 'incompatible' : ''} ${
                  allDone ? 'completed' : ''
                }`}
              >
                <div className="exercise-item-top">
                  <div className="exercise-index">{idx + 1}</div>
                  <button
                    type="button"
                    className="motion-thumb-btn"
                    onClick={() => onOpenMotionModal(exercise)}
                    title={`View how to do ${exercise.name}`}
                  >
                    <ExerciseMotion exercise={exercise} size="sm" />
                    <span className="motion-thumb-label">
                      <PlayCircle size={11} /> How to
                    </span>
                  </button>
                  <div className="exercise-info">
                    <div className="exercise-name-row">
                      <h4>{exercise.name}</h4>
                      <div className="tag-row">
                        <span className={`badge muscle-${exercise.muscleGroup}`}>
                          {MUSCLE_LABELS[exercise.muscleGroup]}
                        </span>
                        {exercise.equipmentTags.map((tag) => (
                          <span
                            key={tag}
                            className={`badge eq-${tag.toLowerCase()}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="form-cue">
                      <Info size={13} />
                      <span>{exercise.formCue}</span>
                    </p>
                  </div>

                  <div className="exercise-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => onOpenSwapModal(item.instanceId)}
                      title="Swap exercise"
                    >
                      <RefreshCw size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => onMoveItem(idx, -1)}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => onMoveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      title="Move down"
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => onRemoveItem(item.instanceId)}
                      title="Remove exercise"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {!compatible && (
                  <div className="item-warning">
                    <AlertTriangle size={14} />
                    <span>
                      Requires{' '}
                      {[
                        exercise.requiresBarbell && !equipment.includeBarbell
                          ? 'Barbell'
                          : null,
                        exercise.requiresBench && !equipment.useBench
                          ? 'Bench'
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' & ')}
                      .
                    </span>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => onQuickSwap(item.instanceId)}
                    >
                      Swap automatically
                    </button>
                  </div>
                )}

                <div className="exercise-inputs">
                  <label className="mini-field">
                    <span>Sets</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={item.sets}
                      onChange={(e) => handleSetsChange(item, e.target.value)}
                    />
                  </label>
                  <label className="mini-field">
                    <span>Reps</span>
                    <input
                      type="text"
                      value={item.reps}
                      onChange={(e) =>
                        onUpdateItem(item.instanceId, { reps: e.target.value })
                      }
                      placeholder="8-12"
                    />
                  </label>
                  <label className="mini-field">
                    <span>Weight ({unit})</span>
                    <input
                      type="text"
                      value={item.weight}
                      onChange={(e) =>
                        onUpdateItem(item.instanceId, {
                          weight: e.target.value,
                        })
                      }
                      placeholder="e.g. 12.5"
                    />
                  </label>
                  <label className="mini-field">
                    <span>Rest (sec)</span>
                    <input
                      type="number"
                      min={15}
                      max={300}
                      step={15}
                      value={item.restSeconds}
                      onChange={(e) =>
                        onUpdateItem(item.instanceId, {
                          restSeconds: Math.max(
                            0,
                            parseInt(e.target.value, 10) || 0
                          ),
                        })
                      }
                    />
                  </label>
                </div>

                <div className="set-tracker">
                  <span className="set-tracker-label">Track Sets:</span>
                  <div className="set-checks">
                    {item.completedSets.map((done, setIdx) => (
                      <button
                        key={setIdx}
                        type="button"
                        className={`set-chip ${done ? 'done' : ''}`}
                        onClick={() => onToggleSet(item.instanceId, setIdx)}
                        aria-pressed={done}
                      >
                        {done ? <Check size={13} /> : setIdx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
