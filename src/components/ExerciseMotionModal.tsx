import { useState } from 'react';
import { ExternalLink, Pause, Play, X } from 'lucide-react';
import { MUSCLE_LABELS } from '../data/exercises';
import { Exercise } from '../types/workout';
import { ExerciseMotion, getMotionSteps } from './ExerciseMotion';

interface ExerciseMotionModalProps {
  exercise: Exercise;
  onClose: () => void;
}

export function ExerciseMotionModal({
  exercise,
  onClose,
}: ExerciseMotionModalProps) {
  const steps = getMotionSteps(exercise);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const [manualProgress, setManualProgress] = useState<number | null>(null);
  const [phaseLabel, setPhaseLabel] = useState('Starting Position');

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${exercise.name} proper form tutorial`
  )}`;

  const handleScrub = (value: number) => {
    setPaused(true);
    setManualProgress(value);
    if (value < 0.2) setPhaseLabel('Start Position');
    else if (value > 0.8) setPhaseLabel('Peak Position');
    else setPhaseLabel('Mid-Rep Motion');
  };

  const handleTogglePlay = () => {
    if (paused || manualProgress !== null) {
      setManualProgress(null);
      setPaused(false);
    } else {
      setPaused(true);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`How to do ${exercise.name}`}
      onClick={onClose}
    >
      <div
        className="modal-card motion-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">Movement Guide</span>
            <h3>{exercise.name}</h3>
            <div className="tag-row" style={{ marginTop: 6 }}>
              <span className={`badge muscle-${exercise.muscleGroup}`}>
                {MUSCLE_LABELS[exercise.muscleGroup]}
              </span>
              {exercise.equipmentTags.map((tag) => (
                <span key={tag} className={`badge eq-${tag.toLowerCase()}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close movement guide"
          >
            <X size={18} />
          </button>
        </div>

        <div className="motion-modal-body">
          <div className="motion-viewer-wrap">
            <span className="phase-pill">{phaseLabel}</span>
            <ExerciseMotion
              exercise={exercise}
              size="lg"
              paused={paused}
              speed={speed}
              manualProgress={manualProgress}
              onPhaseChange={setPhaseLabel}
            />
          </div>

          <div className="motion-controls-bar">
            <div className="motion-btn-group">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleTogglePlay}
              >
                {paused || manualProgress !== null ? (
                  <>
                    <Play size={14} /> Play
                  </>
                ) : (
                  <>
                    <Pause size={14} /> Pause
                  </>
                )}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  speed === 0.5 ? 'btn-primary' : 'btn-ghost'
                }`}
                onClick={() => {
                  setSpeed((s) => (s === 1 ? 0.5 : 1));
                  setManualProgress(null);
                  setPaused(false);
                }}
              >
                {speed === 0.5 ? '0.5x Slow' : '1x Speed'}
              </button>
            </div>

            <div className="scrubber-wrap">
              <button
                type="button"
                className="scrub-anchor"
                onClick={() => handleScrub(0)}
              >
                Start
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((manualProgress ?? 0) * 100)}
                onChange={(e) => handleScrub(Number(e.target.value) / 100)}
                aria-label="Scrub exercise rep position"
              />
              <button
                type="button"
                className="scrub-anchor"
                onClick={() => handleScrub(1)}
              >
                Peak
              </button>
            </div>
          </div>

          <div className="motion-steps">
            <h4>Step-by-Step Form</h4>
            <ol>
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="motion-tip-box">
            <strong>Coaching Cue:</strong> {exercise.formCue}
          </div>

          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary video-link-btn"
          >
            <ExternalLink size={15} />
            Watch real-life form video on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
