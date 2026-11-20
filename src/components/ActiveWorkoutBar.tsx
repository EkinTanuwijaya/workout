import { Pause, Play, RotateCcw, Timer, X } from 'lucide-react';

interface ActiveWorkoutBarProps {
  completedSets: number;
  totalSets: number;
  restSecondsLeft: number;
  restRunning: boolean;
  onToggleRestRunning: () => void;
  onAdjustRest: (delta: number) => void;
  onStopRest: () => void;
  onResetProgress: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ActiveWorkoutBar({
  completedSets,
  totalSets,
  restSecondsLeft,
  restRunning,
  onToggleRestRunning,
  onAdjustRest,
  onStopRest,
  onResetProgress,
}: ActiveWorkoutBarProps) {
  const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  if (totalSets === 0) return null;

  return (
    <div className="active-bar" role="region" aria-label="Workout Progress & Rest Timer">
      <div className="active-bar-inner">
        <div className="progress-block">
          <div className="progress-meta">
            <span>
              <strong>{completedSets}</strong> / {totalSets} sets done
            </span>
            <span className="progress-pct">{pct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="timer-block">
          {restSecondsLeft > 0 || restRunning ? (
            <div className={`rest-timer ${restSecondsLeft === 0 ? 'done' : ''}`}>
              <Timer size={16} />
              <span className="timer-digits">{formatTime(restSecondsLeft)}</span>
              <button
                type="button"
                className="icon-btn-xs"
                onClick={() => onAdjustRest(-15)}
                title="Subtract 15 seconds"
              >
                -15s
              </button>
              <button
                type="button"
                className="icon-btn-xs"
                onClick={() => onAdjustRest(15)}
                title="Add 15 seconds"
              >
                +15s
              </button>
              <button
                type="button"
                className="icon-btn-xs"
                onClick={onToggleRestRunning}
                title={restRunning ? 'Pause timer' : 'Resume timer'}
              >
                {restRunning ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button
                type="button"
                className="icon-btn-xs"
                onClick={onStopRest}
                title="Dismiss timer"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <span className="timer-idle-hint">
              Check off a set to start the rest timer
            </span>
          )}

          {completedSets > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onResetProgress}
              title="Reset completed sets"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
