import { Shuffle, Sparkles } from 'lucide-react';
import { MUSCLE_LABELS } from '../data/exercises';
import {
  MuscleGroup,
  SessionLength,
  WorkoutGoal,
  WorkoutSplit,
} from '../types/workout';

interface GeneratorControlsProps {
  split: WorkoutSplit;
  customMuscles: MuscleGroup[];
  goal: WorkoutGoal;
  length: SessionLength;
  onSplitChange: (split: WorkoutSplit) => void;
  onToggleCustomMuscle: (muscle: MuscleGroup) => void;
  onGoalChange: (goal: WorkoutGoal) => void;
  onLengthChange: (length: SessionLength) => void;
  onGenerate: () => void;
}

const SPLITS: { value: WorkoutSplit; label: string }[] = [
  { value: 'full-body', label: 'Full Body' },
  { value: 'upper', label: 'Upper Body' },
  { value: 'lower', label: 'Lower Body' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
  { value: 'custom', label: 'Custom' },
];

const GOALS: { value: WorkoutGoal; label: string; hint: string }[] = [
  { value: 'strength', label: 'Strength', hint: '5–6 reps' },
  { value: 'hypertrophy', label: 'Muscle', hint: '8–12 reps' },
  { value: 'endurance', label: 'Conditioning', hint: '12–15+ reps' },
];

const LENGTHS: { value: SessionLength; label: string; hint: string }[] = [
  { value: 'quick', label: 'Quick', hint: '4 exercises · ~25m' },
  { value: 'standard', label: 'Standard', hint: '6 exercises · ~45m' },
  { value: 'extended', label: 'Extended', hint: '8 exercises · ~60m' },
];

const ALL_MUSCLES: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'legs',
  'arms',
  'core',
];

export function GeneratorControls({
  split,
  customMuscles,
  goal,
  length,
  onSplitChange,
  onToggleCustomMuscle,
  onGoalChange,
  onLengthChange,
  onGenerate,
}: GeneratorControlsProps) {
  return (
    <section className="card generator-card" aria-label="Workout Generator">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">Menu Builder</span>
          <h3>Generate a balanced workout</h3>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onGenerate}
        >
          <Sparkles size={16} />
          Generate Menu
        </button>
      </div>

      <div className="control-group">
        <label className="control-label">Workout Split / Focus</label>
        <div className="pill-row">
          {SPLITS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`pill-btn ${split === s.value ? 'active' : ''}`}
              onClick={() => onSplitChange(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {split === 'custom' && (
        <div className="control-group">
          <label className="control-label">Select Target Muscle Groups</label>
          <div className="pill-row">
            {ALL_MUSCLES.map((m) => {
              const active = customMuscles.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  className={`pill-btn muscle-pill ${active ? 'active' : ''}`}
                  onClick={() => onToggleCustomMuscle(m)}
                >
                  {MUSCLE_LABELS[m]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="controls-two-col">
        <div className="control-group">
          <label className="control-label">Training Goal</label>
          <div className="segment-row">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                className={`segment-btn ${goal === g.value ? 'active' : ''}`}
                onClick={() => onGoalChange(g.value)}
              >
                <span className="segment-title">{g.label}</span>
                <span className="segment-hint">{g.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Session Length</label>
          <div className="segment-row">
            {LENGTHS.map((l) => (
              <button
                key={l.value}
                type="button"
                className={`segment-btn ${length === l.value ? 'active' : ''}`}
                onClick={() => onLengthChange(l.value)}
              >
                <span className="segment-title">{l.label}</span>
                <span className="segment-hint">{l.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="generator-footer-hint">
        <Shuffle size={14} />
        <span>
          Click <strong>Generate Menu</strong> again anytime to shuffle fresh
          variations for your active equipment.
        </span>
      </div>
    </section>
  );
}
