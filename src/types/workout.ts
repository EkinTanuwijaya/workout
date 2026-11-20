export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'legs'
  | 'arms'
  | 'core';

export type MovementType = 'compound' | 'isolation';

export type EquipmentTag = 'Dumbbell' | 'Bench' | 'Barbell';

export interface EquipmentConfig {
  useBench: boolean;
  includeBarbell: boolean;
}

export type WorkoutSplit =
  | 'full-body'
  | 'upper'
  | 'lower'
  | 'push'
  | 'pull'
  | 'legs'
  | 'custom';

export type WorkoutGoal = 'strength' | 'hypertrophy' | 'endurance';

export type SessionLength = 'quick' | 'standard' | 'extended';

export type WeightUnit = 'kg' | 'lb';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  movementType: MovementType;
  requiresBench: boolean;
  requiresBarbell: boolean;
  equipmentTags: EquipmentTag[];
  pattern: string;
  formCue: string;
}

export interface WorkoutItem {
  instanceId: string;
  exerciseId: string;
  sets: number;
  reps: string;
  weight: string;
  restSeconds: number;
  completedSets: boolean[];
}

export interface SavedMenu {
  id: string;
  name: string;
  createdAt: string;
  equipment: EquipmentConfig;
  split: WorkoutSplit;
  goal: WorkoutGoal;
  items: Omit<WorkoutItem, 'completedSets'>[];
}
