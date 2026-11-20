import { Check, Dumbbell, Lock } from 'lucide-react';
import { EquipmentConfig } from '../types/workout';

interface EquipmentBarProps {
  equipment: EquipmentConfig;
  compatibleCount: number;
  incompatibleInMenuCount: number;
  onChange: (next: EquipmentConfig) => void;
  onAutoSwapIncompatible: () => void;
}

export function EquipmentBar({
  equipment,
  compatibleCount,
  incompatibleInMenuCount,
  onChange,
  onAutoSwapIncompatible,
}: EquipmentBarProps) {
  return (
    <section className="equipment-bar" aria-label="Equipment Setup">
      <div className="equipment-header">
        <div>
          <span className="eyebrow">Your Home Equipment</span>
          <h2>Choose what you have available today</h2>
        </div>
        <div className="exercise-count-pill">
          <Dumbbell size={15} />
          <span>{compatibleCount} exercises unlocked</span>
        </div>
      </div>

      <div className="equipment-grid">
        {/* Dumbbells — Always On */}
        <div className="equipment-card active locked">
          <div className="equipment-card-top">
            <span className="equipment-title">Dumbbells</span>
            <span className="status-badge locked-badge">
              <Lock size={12} /> Always On
            </span>
          </div>
          <p className="equipment-desc">
            Core foundation for every home workout menu.
          </p>
        </div>

        {/* Bench Toggle */}
        <button
          type="button"
          className={`equipment-card toggleable ${equipment.useBench ? 'active' : ''}`}
          onClick={() =>
            onChange({ ...equipment, useBench: !equipment.useBench })
          }
          aria-pressed={equipment.useBench}
        >
          <div className="equipment-card-top">
            <span className="equipment-title">Weight Bench</span>
            <span
              className={`toggle-pill ${equipment.useBench ? 'on' : 'off'}`}
            >
              {equipment.useBench ? (
                <>
                  <Check size={13} /> Using Bench
                </>
              ) : (
                'No Bench'
              )}
            </span>
          </div>
          <p className="equipment-desc">
            {equipment.useBench
              ? 'Includes flat/incline presses, chest-supported rows, split squats & hip thrusts.'
              : 'Floor & standing exercises only — no bench required.'}
          </p>
        </button>

        {/* Barbell Toggle */}
        <button
          type="button"
          className={`equipment-card toggleable ${equipment.includeBarbell ? 'active' : ''}`}
          onClick={() =>
            onChange({
              ...equipment,
              includeBarbell: !equipment.includeBarbell,
            })
          }
          aria-pressed={equipment.includeBarbell}
        >
          <div className="equipment-card-top">
            <span className="equipment-title">Barbell</span>
            <span
              className={`toggle-pill ${equipment.includeBarbell ? 'on' : 'off'}`}
            >
              {equipment.includeBarbell ? (
                <>
                  <Check size={13} /> Included
                </>
              ) : (
                'Dumbbells Only'
              )}
            </span>
          </div>
          <p className="equipment-desc">
            {equipment.includeBarbell
              ? 'Unlocks barbell squats, deadlifts, rows, presses & curls alongside dumbbells.'
              : 'Strictly dumbbell-based movements — no barbell included.'}
          </p>
        </button>
      </div>

      {incompatibleInMenuCount > 0 && (
        <div className="compat-banner" role="status">
          <span>
            <strong>{incompatibleInMenuCount}</strong>{' '}
            {incompatibleInMenuCount === 1 ? 'exercise' : 'exercises'} in your
            current menu require equipment you turned off.
          </span>
          <button
            type="button"
            className="btn btn-warning btn-sm"
            onClick={onAutoSwapIncompatible}
          >
            Auto-swap to compatible
          </button>
        </div>
      )}
    </section>
  );
}
