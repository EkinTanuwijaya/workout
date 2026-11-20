import { EXERCISES, EXERCISE_MAP } from '../data/exercises';
import {
  EquipmentConfig,
  Exercise,
  MuscleGroup,
  SessionLength,
  WorkoutGoal,
  WorkoutItem,
  WorkoutSplit,
} from '../types/workout';

export function isExerciseCompatible(
  exercise: Exercise,
  equipment: EquipmentConfig
): boolean {
  if (exercise.requiresBench && !equipment.useBench) return false;
  if (exercise.requiresBarbell && !equipment.includeBarbell) return false;
  return true;
}

export function getCompatibleExercises(equipment: EquipmentConfig): Exercise[] {
  return EXERCISES.filter((ex) => isExerciseCompatible(ex, equipment));
}

export function getGoalDefaults(
  goal: WorkoutGoal,
  movementType: 'compound' | 'isolation'
): { sets: number; reps: string; restSeconds: number } {
  switch (goal) {
    case 'strength':
      return movementType === 'compound'
        ? { sets: 4, reps: '5-6', restSeconds: 120 }
        : { sets: 3, reps: '8-10', restSeconds: 90 };
    case 'hypertrophy':
      return movementType === 'compound'
        ? { sets: 4, reps: '8-10', restSeconds: 90 }
        : { sets: 3, reps: '10-12', restSeconds: 60 };
    case 'endurance':
      return movementType === 'compound'
        ? { sets: 3, reps: '12-15', restSeconds: 60 }
        : { sets: 3, reps: '15-20', restSeconds: 45 };
  }
}

const SPLIT_MUSCLES: Record<Exclude<WorkoutSplit, 'custom'>, MuscleGroup[]> = {
  'full-body': ['legs', 'chest', 'back', 'shoulders', 'arms', 'core'],
  upper: ['chest', 'back', 'shoulders', 'arms'],
  lower: ['legs', 'core'],
  push: ['chest', 'shoulders', 'arms'],
  pull: ['back', 'arms', 'core'],
  legs: ['legs', 'core'],
};

const LENGTH_COUNTS: Record<SessionLength, number> = {
  quick: 4,
  standard: 6,
  extended: 8,
};

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function scoreExercise(ex: Exercise, equipment: EquipmentConfig): number {
  let score = Math.random() * 1.5;
  // Slightly reward exercises that take advantage of enabled optional equipment
  if (equipment.includeBarbell && ex.requiresBarbell) score += 0.9;
  if (equipment.useBench && ex.requiresBench) score += 0.7;
  if (ex.movementType === 'compound') score += 0.4;
  return score;
}

export function createWorkoutItem(
  exercise: Exercise,
  goal: WorkoutGoal
): WorkoutItem {
  const defaults = getGoalDefaults(goal, exercise.movementType);
  return {
    instanceId: uid(),
    exerciseId: exercise.id,
    sets: defaults.sets,
    reps: defaults.reps,
    weight: '',
    restSeconds: defaults.restSeconds,
    completedSets: Array(defaults.sets).fill(false),
  };
}

export function generateWorkoutMenu(params: {
  equipment: EquipmentConfig;
  split: WorkoutSplit;
  customMuscles: MuscleGroup[];
  goal: WorkoutGoal;
  length: SessionLength;
}): WorkoutItem[] {
  const { equipment, split, customMuscles, goal, length } = params;
  const targetCount = LENGTH_COUNTS[length];
  const compatible = getCompatibleExercises(equipment);

  const muscles: MuscleGroup[] =
    split === 'custom'
      ? customMuscles.length > 0
        ? customMuscles
        : ['chest', 'back', 'legs']
      : SPLIT_MUSCLES[split];

  // Filter arms for push/pull so push gets triceps and pull gets biceps/forearms
  const filterForSplit = (ex: Exercise): boolean => {
    if (split === 'push' && ex.muscleGroup === 'arms') {
      return ex.pattern === 'tricep-ext' || ex.pattern === 'tricep-kickback';
    }
    if (split === 'pull' && ex.muscleGroup === 'arms') {
      return (
        ex.pattern === 'bicep-curl' ||
        ex.pattern === 'concentration-curl' ||
        ex.pattern === 'wrist-curl'
      );
    }
    return true;
  };

  const chosen: Exercise[] = [];
  const usedIds = new Set<string>();
  const usedPatterns = new Set<string>();

  // Round-robin across selected muscle groups to ensure balanced coverage
  let pass = 0;
  while (chosen.length < targetCount && pass < 6) {
    let addedInPass = false;
    for (const muscle of muscles) {
      if (chosen.length >= targetCount) break;

      const candidates = compatible.filter(
        (ex) =>
          ex.muscleGroup === muscle &&
          !usedIds.has(ex.id) &&
          filterForSplit(ex)
      );

      if (candidates.length === 0) continue;

      // Prefer unseen movement patterns first
      const freshPattern = candidates.filter((ex) => !usedPatterns.has(ex.pattern));
      const pool = freshPattern.length > 0 ? freshPattern : candidates;

      // First pass favors compounds; later passes allow isolations
      const preferredPool =
        pass === 0
          ? pool.filter((ex) => ex.movementType === 'compound')
          : pool;

      const finalPool = preferredPool.length > 0 ? preferredPool : pool;

      const sorted = [...finalPool].sort(
        (a, b) => scoreExercise(b, equipment) - scoreExercise(a, equipment)
      );

      const pick = sorted[0];
      if (pick) {
        chosen.push(pick);
        usedIds.add(pick.id);
        usedPatterns.add(pick.pattern);
        addedInPass = true;
      }
    }
    if (!addedInPass) break;
    pass++;
  }

  // Order compounds first, isolations after, core last
  chosen.sort((a, b) => {
    if (a.muscleGroup === 'core' && b.muscleGroup !== 'core') return 1;
    if (b.muscleGroup === 'core' && a.muscleGroup !== 'core') return -1;
    if (a.movementType !== b.movementType) {
      return a.movementType === 'compound' ? -1 : 1;
    }
    return 0;
  });

  return chosen.map((ex) => createWorkoutItem(ex, goal));
}

export function findReplacementExercise(
  currentExerciseId: string,
  equipment: EquipmentConfig,
  existingExerciseIds: string[]
): Exercise | null {
  const current = EXERCISE_MAP[currentExerciseId];
  if (!current) return null;

  const compatible = getCompatibleExercises(equipment);
  const existingSet = new Set(existingExerciseIds);

  // 1. Same muscle group & same pattern, not already in menu
  const exactPattern = compatible.find(
    (ex) =>
      ex.muscleGroup === current.muscleGroup &&
      ex.pattern === current.pattern &&
      ex.id !== current.id &&
      !existingSet.has(ex.id)
  );
  if (exactPattern) return exactPattern;

  // 2. Same muscle group & same movement type, not already in menu
  const sameType = compatible.find(
    (ex) =>
      ex.muscleGroup === current.muscleGroup &&
      ex.movementType === current.movementType &&
      ex.id !== current.id &&
      !existingSet.has(ex.id)
  );
  if (sameType) return sameType;

  // 3. Any compatible exercise in the same muscle group
  const sameMuscle = compatible.find(
    (ex) =>
      ex.muscleGroup === current.muscleGroup &&
      ex.id !== current.id &&
      !existingSet.has(ex.id)
  );
  if (sameMuscle) return sameMuscle;

  // 4. Fallback even if duplicate pattern
  return (
    compatible.find(
      (ex) => ex.muscleGroup === current.muscleGroup && ex.id !== current.id
    ) ?? null
  );
}

export function formatMenuAsText(
  title: string,
  equipment: EquipmentConfig,
  items: WorkoutItem[],
  unit: 'kg' | 'lb'
): string {
  const eqList = [
    'Dumbbells',
    equipment.useBench ? 'Bench' : null,
    equipment.includeBarbell ? 'Barbell' : null,
  ]
    .filter(Boolean)
    .join(' + ');

  const lines = [`${title}`, `Equipment: ${eqList}`, ''];

  items.forEach((item, idx) => {
    const ex = EXERCISE_MAP[item.exerciseId];
    if (!ex) return;
    const weightStr = item.weight ? ` @ ${item.weight} ${unit}` : '';
    lines.push(
      `${idx + 1}. ${ex.name} — ${item.sets} × ${item.reps}${weightStr} (Rest ${item.restSeconds}s)`
    );
  });

  return lines.join('\n');
}
