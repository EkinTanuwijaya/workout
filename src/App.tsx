import { useEffect, useMemo, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { ActiveWorkoutBar } from './components/ActiveWorkoutBar';
import { EquipmentBar } from './components/EquipmentBar';
import { ExerciseMotionModal } from './components/ExerciseMotionModal';
import { ExercisePickerModal } from './components/ExercisePickerModal';
import { GeneratorControls } from './components/GeneratorControls';
import { SavedMenusPanel } from './components/SavedMenusPanel';
import { WorkoutMenuList } from './components/WorkoutMenuList';
import { EXERCISE_MAP } from './data/exercises';
import {
  EquipmentConfig,
  Exercise,
  MuscleGroup,
  SavedMenu,
  SessionLength,
  WeightUnit,
  WorkoutGoal,
  WorkoutItem,
  WorkoutSplit,
} from './types/workout';
import {
  createWorkoutItem,
  findReplacementExercise,
  formatMenuAsText,
  generateWorkoutMenu,
  getCompatibleExercises,
  isExerciseCompatible,
} from './utils/generator';

const STORAGE_KEYS = {
  savedMenus: 'hwm_saved_menus_v1',
  equipment: 'hwm_equipment_v1',
  unit: 'hwm_unit_v1',
};

const SPLIT_TITLES: Record<WorkoutSplit, string> = {
  'full-body': 'Full Body',
  upper: 'Upper Body',
  lower: 'Lower Body',
  push: 'Push Day',
  pull: 'Pull Day',
  legs: 'Leg Day',
  custom: 'Custom Workout',
};

function buildDefaultTitle(split: WorkoutSplit, eq: EquipmentConfig): string {
  const eqSuffix = [
    'DB',
    eq.useBench ? 'Bench' : null,
    eq.includeBarbell ? 'Barbell' : null,
  ]
    .filter(Boolean)
    .join(' + ');
  return `${SPLIT_TITLES[split]} (${eqSuffix})`;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function App() {
  const [equipment, setEquipment] = useState<EquipmentConfig>(() =>
    loadJson<EquipmentConfig>(STORAGE_KEYS.equipment, {
      useBench: false,
      includeBarbell: false,
    })
  );
  const [unit, setUnit] = useState<WeightUnit>(() =>
    loadJson<WeightUnit>(STORAGE_KEYS.unit, 'kg')
  );
  const [split, setSplit] = useState<WorkoutSplit>('full-body');
  const [customMuscles, setCustomMuscles] = useState<MuscleGroup[]>([
    'chest',
    'back',
    'legs',
  ]);
  const [goal, setGoal] = useState<WorkoutGoal>('hypertrophy');
  const [length, setLength] = useState<SessionLength>('standard');

  const [menuTitle, setMenuTitle] = useState<string>(() =>
    buildDefaultTitle('full-body', equipment)
  );
  const [items, setItems] = useState<WorkoutItem[]>(() =>
    generateWorkoutMenu({
      equipment,
      split: 'full-body',
      customMuscles: ['chest', 'back', 'legs'],
      goal: 'hypertrophy',
      length: 'standard',
    })
  );

  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>(() =>
    loadJson<SavedMenu[]>(STORAGE_KEYS.savedMenus, [])
  );

  const [pickerState, setPickerState] = useState<
    | { open: false }
    | { open: true; mode: 'add' }
    | {
        open: true;
        mode: 'swap';
        targetInstanceId: string;
        muscle: MuscleGroup;
      }
  >({ open: false });

  const [motionExercise, setMotionExercise] = useState<Exercise | null>(null);
  const [copied, setCopied] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Rest timer state
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [restRunning, setRestRunning] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.equipment, JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.unit, JSON.stringify(unit));
  }, [unit]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.savedMenus, JSON.stringify(savedMenus));
  }, [savedMenus]);

  useEffect(() => {
    if (!restRunning) return;
    if (restSecondsLeft <= 0) {
      setRestRunning(false);
      return;
    }
    const id = window.setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          setRestRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [restRunning, restSecondsLeft]);

  const compatibleCount = useMemo(
    () => getCompatibleExercises(equipment).length,
    [equipment]
  );

  const incompatibleInMenuCount = useMemo(
    () =>
      items.filter((item) => {
        const ex = EXERCISE_MAP[item.exerciseId];
        return ex ? !isExerciseCompatible(ex, equipment) : false;
      }).length,
    [items, equipment]
  );

  const { totalSets, completedSets } = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const item of items) {
      total += item.completedSets.length;
      done += item.completedSets.filter(Boolean).length;
    }
    return { totalSets: total, completedSets: done };
  }, [items]);

  const handleGenerate = () => {
    const next = generateWorkoutMenu({
      equipment,
      split,
      customMuscles,
      goal,
      length,
    });
    setItems(next);
    setMenuTitle(buildDefaultTitle(split, equipment));
    setRestRunning(false);
    setRestSecondsLeft(0);
  };

  const handleToggleCustomMuscle = (muscle: MuscleGroup) => {
    setCustomMuscles((prev) => {
      if (prev.includes(muscle)) {
        return prev.length > 1 ? prev.filter((m) => m !== muscle) : prev;
      }
      return [...prev, muscle];
    });
  };

  const handleAutoSwapIncompatible = () => {
    setItems((prev) => {
      const currentIds = prev.map((i) => i.exerciseId);
      return prev.map((item) => {
        const ex = EXERCISE_MAP[item.exerciseId];
        if (!ex || isExerciseCompatible(ex, equipment)) return item;
        const replacement = findReplacementExercise(
          item.exerciseId,
          equipment,
          currentIds
        );
        if (!replacement) return item;
        currentIds.push(replacement.id);
        return {
          ...item,
          exerciseId: replacement.id,
        };
      });
    });
  };

  const handleQuickSwap = (instanceId: string) => {
    setItems((prev) => {
      const currentIds = prev.map((i) => i.exerciseId);
      return prev.map((item) => {
        if (item.instanceId !== instanceId) return item;
        const replacement = findReplacementExercise(
          item.exerciseId,
          equipment,
          currentIds
        );
        if (!replacement) return item;
        return { ...item, exerciseId: replacement.id };
      });
    });
  };

  const handleUpdateItem = (
    instanceId: string,
    patch: Partial<WorkoutItem>
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.instanceId === instanceId ? { ...item, ...patch } : item
      )
    );
  };

  const handleToggleSet = (instanceId: string, setIndex: number) => {
    let startRestSec: number | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (item.instanceId !== instanceId) return item;
        const nextCompleted = [...item.completedSets];
        const markingDone = !nextCompleted[setIndex];
        nextCompleted[setIndex] = markingDone;
        if (markingDone && item.restSeconds > 0) {
          startRestSec = item.restSeconds;
        }
        return { ...item, completedSets: nextCompleted };
      })
    );
    if (startRestSec !== null) {
      setRestSecondsLeft(startRestSec);
      setRestRunning(true);
    }
  };

  const handleMoveItem = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  };

  const handleRemoveItem = (instanceId: string) => {
    setItems((prev) => prev.filter((item) => item.instanceId !== instanceId));
  };

  const handlePickerSelect = (exercise: Exercise) => {
    if (!pickerState.open) return;
    if (pickerState.mode === 'add') {
      setItems((prev) => [...prev, createWorkoutItem(exercise, goal)]);
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.instanceId === pickerState.targetInstanceId
            ? { ...item, exerciseId: exercise.id }
            : item
        )
      );
    }
    setPickerState({ open: false });
  };

  const handleSaveCurrent = () => {
    if (items.length === 0) return;
    const trimmed = menuTitle.trim() || buildDefaultTitle(split, equipment);
    const saved: SavedMenu = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      createdAt: new Date().toISOString(),
      equipment: { ...equipment },
      split,
      goal,
      items: items.map(({ completedSets: _c, ...rest }) => rest),
    };
    setSavedMenus((prev) => [saved, ...prev]);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1800);
  };

  const handleLoadMenu = (menu: SavedMenu) => {
    setEquipment({ ...menu.equipment });
    setSplit(menu.split);
    setGoal(menu.goal);
    setMenuTitle(menu.name);
    setItems(
      menu.items.map((it) => ({
        ...it,
        completedSets: Array(it.sets).fill(false),
      }))
    );
    setRestRunning(false);
    setRestSecondsLeft(0);
  };

  const handleDeleteSaved = (id: string) => {
    setSavedMenus((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCopyMenu = async () => {
    const text = formatMenuAsText(menuTitle, equipment, items, unit);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback if clipboard API is unavailable
      window.prompt('Copy your workout menu:', text);
    }
  };

  const handleResetProgress = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        completedSets: Array(item.sets).fill(false),
      }))
    );
    setRestRunning(false);
    setRestSecondsLeft(0);
  };

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon">
              <Dumbbell size={20} />
            </div>
            <div>
              <h1>Home Workout Menu</h1>
              <p className="brand-sub">
                Dumbbell-first personal routine builder
              </p>
            </div>
          </div>

          <div className="unit-toggle" role="group" aria-label="Weight unit">
            <button
              type="button"
              className={unit === 'kg' ? 'active' : ''}
              onClick={() => setUnit('kg')}
            >
              kg
            </button>
            <button
              type="button"
              className={unit === 'lb' ? 'active' : ''}
              onClick={() => setUnit('lb')}
            >
              lb
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <EquipmentBar
          equipment={equipment}
          compatibleCount={compatibleCount}
          incompatibleInMenuCount={incompatibleInMenuCount}
          onChange={setEquipment}
          onAutoSwapIncompatible={handleAutoSwapIncompatible}
        />

        <div className="workspace-grid">
          <div className="primary-col">
            <GeneratorControls
              split={split}
              customMuscles={customMuscles}
              goal={goal}
              length={length}
              onSplitChange={setSplit}
              onToggleCustomMuscle={handleToggleCustomMuscle}
              onGoalChange={setGoal}
              onLengthChange={setLength}
              onGenerate={handleGenerate}
            />

            <WorkoutMenuList
              menuTitle={menuTitle}
              items={items}
              equipment={equipment}
              unit={unit}
              copied={copied}
              onMenuTitleChange={setMenuTitle}
              onUpdateItem={handleUpdateItem}
              onToggleSet={handleToggleSet}
              onMoveItem={handleMoveItem}
              onRemoveItem={handleRemoveItem}
              onQuickSwap={handleQuickSwap}
              onOpenSwapModal={(instanceId) => {
                const target = items.find((i) => i.instanceId === instanceId);
                const ex = target ? EXERCISE_MAP[target.exerciseId] : undefined;
                setPickerState({
                  open: true,
                  mode: 'swap',
                  targetInstanceId: instanceId,
                  muscle: ex?.muscleGroup ?? 'chest',
                });
              }}
              onOpenMotionModal={(exercise) => setMotionExercise(exercise)}
              onOpenAddModal={() => setPickerState({ open: true, mode: 'add' })}
              onCopyMenu={handleCopyMenu}
            />
          </div>

          <div className="side-col">
            <SavedMenusPanel
              savedMenus={savedMenus}
              canSave={items.length > 0}
              justSaved={justSaved}
              onSaveCurrent={handleSaveCurrent}
              onLoadMenu={handleLoadMenu}
              onDeleteMenu={handleDeleteSaved}
            />
          </div>
        </div>
      </main>

      <ActiveWorkoutBar
        completedSets={completedSets}
        totalSets={totalSets}
        restSecondsLeft={restSecondsLeft}
        restRunning={restRunning}
        onToggleRestRunning={() => setRestRunning((r) => !r)}
        onAdjustRest={(delta) =>
          setRestSecondsLeft((s) => Math.max(0, s + delta))
        }
        onStopRest={() => {
          setRestRunning(false);
          setRestSecondsLeft(0);
        }}
        onResetProgress={handleResetProgress}
      />

      {pickerState.open && (
        <ExercisePickerModal
          mode={pickerState.mode}
          equipment={equipment}
          initialMuscle={
            pickerState.mode === 'swap' ? pickerState.muscle : 'all'
          }
          existingExerciseIds={items.map((i) => i.exerciseId)}
          onSelect={handlePickerSelect}
          onClose={() => setPickerState({ open: false })}
        />
      )}

      {motionExercise && (
        <ExerciseMotionModal
          exercise={motionExercise}
          onClose={() => setMotionExercise(null)}
        />
      )}
    </div>
  );
}

export default App;
