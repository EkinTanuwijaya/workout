import { useEffect, useState } from 'react';
import { Exercise } from '../types/workout';

interface Point {
  x: number;
  y: number;
}

interface Pose {
  head: Point;
  shoulder: Point;
  hip: Point;
  elbow: Point;
  wrist: Point;
  // Optional second arm (for front-facing exercises like lateral raise / fly / OHP)
  elbow2?: Point;
  wrist2?: Point;
  knee: Point;
  ankle: Point;
  // Optional back leg for split-stance / side-view depth
  knee2?: Point;
  ankle2?: Point;
  // Weight center(s) — defaults to wrist(s) if omitted
  weight?: Point;
  weight2?: Point;
  view?: 'side' | 'front';
}

interface ExerciseAnimationSpec {
  start: Pose;
  peak: Pose;
  bench?: 'flat' | 'incline' | 'upright' | 'hip-thrust' | 'split-squat';
  arrow?: { from: Point; to: Point };
  phaseLabels: [string, string, string];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPt(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function interpolatePose(a: Pose, b: Pose, t: number): Pose {
  return {
    head: lerpPt(a.head, b.head, t),
    shoulder: lerpPt(a.shoulder, b.shoulder, t),
    hip: lerpPt(a.hip, b.hip, t),
    elbow: lerpPt(a.elbow, b.elbow, t),
    wrist: lerpPt(a.wrist, b.wrist, t),
    elbow2: a.elbow2 && b.elbow2 ? lerpPt(a.elbow2, b.elbow2, t) : undefined,
    wrist2: a.wrist2 && b.wrist2 ? lerpPt(a.wrist2, b.wrist2, t) : undefined,
    knee: lerpPt(a.knee, b.knee, t),
    ankle: lerpPt(a.ankle, b.ankle, t),
    knee2: a.knee2 && b.knee2 ? lerpPt(a.knee2, b.knee2, t) : undefined,
    ankle2: a.ankle2 && b.ankle2 ? lerpPt(a.ankle2, b.ankle2, t) : undefined,
    weight: a.weight && b.weight ? lerpPt(a.weight, b.weight, t) : undefined,
    weight2: a.weight2 && b.weight2 ? lerpPt(a.weight2, b.weight2, t) : undefined,
    view: a.view ?? 'side',
  };
}

// Smooth ease-in-out with brief pauses at start (0) and peak (1)
function cycleProgress(phase01: number): number {
  // 0..0.12 hold start, 0.12..0.46 lift, 0.46..0.58 hold peak, 0.58..0.96 lower, 0.96..1 hold start
  let raw = 0;
  if (phase01 < 0.12) raw = 0;
  else if (phase01 < 0.46) raw = (phase01 - 0.12) / 0.34;
  else if (phase01 < 0.58) raw = 1;
  else if (phase01 < 0.96) raw = 1 - (phase01 - 0.58) / 0.38;
  else raw = 0;
  // Smoothstep
  return raw * raw * (3 - 2 * raw);
}

export function getMotionSteps(exercise: Exercise): [string, string, string] {
  switch (exercise.pattern) {
    case 'horizontal-push':
      return exercise.requiresBench
        ? [
            'Lie flat on the bench, feet planted firmly on the floor, shoulder blades pinched.',
            'Press the weight straight up over your chest until arms extend smoothly.',
            'Lower under control to chest level with elbows angled ~45° from your torso.',
          ]
        : [
            'Lie flat on the floor with knees bent, feet planted, and elbows at 45°.',
            'Drive the weight straight up over your chest and squeeze.',
            'Lower slowly until the backs of your upper arms lightly touch the floor.',
          ];
    case 'incline-push':
      return [
        'Set bench to ~30° incline, brace core, and hold weight at upper chest.',
        'Press straight up over your upper chest without flaring elbows.',
        'Lower slowly with control back to upper chest height.',
      ];
    case 'chest-fly':
      return [
        'Hold dumbbells above your chest with a slight, fixed bend in your elbows.',
        'Open your arms wide in a smooth arc until you feel a chest stretch.',
        'Squeeze your chest to bring the dumbbells back together at the top.',
      ];
    case 'pullover':
      return exercise.requiresBench
        ? [
            'Lie on the bench holding one dumbbell with both hands straight over your chest.',
            'Keep your ribs tucked and arc the dumbbell slowly back behind your head.',
            'Pull the dumbbell back over your chest using your lats and chest.',
          ]
        : [
            'Lie flat on the floor with knees bent, holding one dumbbell above your chest.',
            'Keep your lower back pressed down and arc the dumbbell behind your head.',
            'Pull smoothly back over your chest without flaring your ribs.',
          ];
    case 'pushup':
      return [
        'Grip dumbbells on the floor shoulder-width apart in a rigid straight-line plank.',
        'Lower your chest down between the dumbbells for a deeper stretch.',
        'Drive firmly through the handles to press back up to full lockout.',
      ];
    case 'renegade-row':
      return [
        'Set up in a wide-foot high plank with hands gripping dumbbells under shoulders.',
        'Brace your core tight to prevent hips from twisting as you pull one dumbbell.',
        'Lower the dumbbell under control and switch sides smoothly.',
      ];
    case 'push-press':
      return [
        'Stand tall with weights at shoulder height and feet hip-width apart.',
        'Dip your knees ~4–6 inches straight down while keeping your torso upright.',
        'Drive explosively through your legs to launch the weight overhead and lock out.',
      ];
    case 'single-leg-hinge':
      return [
        'Balance on one slightly bent leg holding dumbbells in front of your thighs.',
        'Hinge at the hip while extending your back leg straight behind you in one line.',
        'Drive through your planted heel and squeeze your glute to stand tall.',
      ];
    case 'side-lunge':
      return [
        'Stand tall holding dumbbells, then take a wide step out to one side.',
        'Sit your hips back over the bent leg while keeping the opposite leg straight.',
        'Push powerfully off the bent leg to return to the center.',
      ];
    case 'good-morning':
      return [
        'Rest the barbell securely across your upper traps with feet hip-width apart.',
        'Keep knees soft and spine rigid as you push your hips straight backward.',
        'Stop when you feel a strong hamstring stretch, then drive hips forward to stand.',
      ];
    case 'tricep-kickback':
      return [
        'Hinge forward ~45° and pin your upper arms parallel to your torso.',
        'Extend your forearms straight back until your arms are fully locked out.',
        'Squeeze your triceps at the top, then bend elbows slowly back to 90°.',
      ];
    case 'wrist-curl':
      return [
        'Rest your forearms flat on your thighs or bench with wrists hanging off the edge.',
        'Let the dumbbells roll gently down toward your fingertips.',
        'Curl your wrists upward smoothly and squeeze your forearms at the top.',
      ];
    case 'concentration-curl':
      return [
        'Sit on the bench with knees wide and brace your elbow against your inner thigh.',
        'Curl the dumbbell slowly toward your shoulder without moving your upper arm.',
        'Squeeze your bicep hard at the top, then lower with a 2-second tempo.',
      ];
    case 'woodchopper':
      return [
        'Hold one dumbbell with both hands outside your hip in an athletic stance.',
        'Rotate your torso and pivot your back foot to chop diagonally up across your chest.',
        'Control the weight back down along the exact same diagonal path.',
      ];
    case 'crunch':
      return [
        'Lie on your back with knees bent and hold a dumbbell at your chest or straight up.',
        'Exhale and curl your shoulder blades off the floor by squeezing your abs.',
        'Lower your upper back down slowly without pulling on your neck.',
      ];
    case 'side-bend':
      return [
        'Stand tall holding one dumbbell at your side and your other hand behind your head.',
        'Bend strictly sideways at the waist toward the weighted side.',
        'Pull yourself upright smoothly by contracting your opposite oblique.',
      ];
    case 'knee-tuck':
      return [
        'Sit near the bench edge, grip the sides behind you, and lean back slightly.',
        'Extend legs straight out in front of you while bracing your abs.',
        'Pull knees in toward your chest smoothly, then extend back out under control.',
      ];
    case 'horizontal-pull':
    case 'unilateral-pull':
      return exercise.requiresBench
        ? [
            'Brace your torso on the bench with a flat, neutral spine and arm hanging down.',
            'Pull your elbow back toward your hip, squeezing your shoulder blade.',
            'Lower the weight slowly to a full stretch without twisting.',
          ]
        : [
            'Hinge forward at the hips (~45°) with a flat back and braced core.',
            'Row the weight toward your lower ribs/hips, leading with your elbows.',
            'Lower slowly under control while keeping your torso steady.',
          ];
    case 'trap-shrug':
      return [
        'Stand tall with weights at your sides and arms straight.',
        'Elevate your shoulders straight up toward your ears and pause 1 second.',
        'Lower your shoulders all the way back down smoothly.',
      ];
    case 'rear-delt':
      return [
        'Hinge forward with a flat back and dumbbells hanging beneath your chest.',
        'Sweep arms wide out to shoulder height, squeezing your rear shoulders.',
        'Lower back slowly without using body momentum.',
      ];
    case 'vertical-push':
      return [
        exercise.requiresBench
          ? 'Sit upright on the bench with back supported and weights at shoulder height.'
          : 'Stand tall, brace abs and glutes, holding weights at shoulder level.',
        'Press straight overhead until arms are extended near your ears.',
        'Lower back to shoulder level with full control.',
      ];
    case 'lateral-raise':
      return [
        'Hold dumbbells at your sides with a slight bend in your elbows.',
        'Raise both arms out to the sides until parallel with the floor.',
        'Lower slowly over 2 seconds without shrugging your neck.',
      ];
    case 'front-raise':
      return [
        'Stand tall with dumbbells resting in front of your thighs.',
        'Raise arms straight forward to shoulder height with straight wrists.',
        'Lower back smoothly without swinging your torso.',
      ];
    case 'upright-row':
      return [
        'Hold weight in front of your thighs with a shoulder-width grip.',
        'Pull elbows up and slightly out to chest/shoulder height.',
        'Lower slowly keeping the weight close to your torso.',
      ];
    case 'squat':
      return [
        'Stand shoulder-width apart, brace your core, and keep chest proud.',
        'Sit hips back and bend knees until thighs reach parallel, heels flat.',
        'Drive through mid-foot to stand tall and lock hips at the top.',
      ];
    case 'hinge':
      return [
        'Stand hip-width with soft knees and weight close to your thighs.',
        'Push hips straight backward with a flat spine until hamstrings stretch.',
        'Drive hips forward and squeeze glutes to stand back up tall.',
      ];
    case 'unilateral-leg':
      return [
        exercise.requiresBench
          ? 'Place your back foot securely on the bench and keep torso balanced.'
          : 'Step into a tall split stance with core braced and weights at your sides.',
        'Lower hips straight down until your front thigh is parallel to the floor.',
        'Drive through your front heel to return to the top.',
      ];
    case 'glute-thrust':
      return exercise.requiresBench
        ? [
            'Rest upper back against the bench edge, knees bent, weight on hips.',
            'Drive through heels to lift hips until torso and thighs form a flat line.',
            'Squeeze glutes hard at the top, then lower hips smoothly.',
          ]
        : [
            'Lie flat on the floor with knees bent, feet planted, and dumbbell across hips.',
            'Drive through your heels to lift hips until knees, hips, and shoulders align.',
            'Squeeze glutes hard at the top, then lower back to the floor smoothly.',
          ];
    case 'calf':
      return [
        'Stand tall holding dumbbells at your sides with feet hip-width.',
        'Rise as high as possible onto the balls of your feet and pause.',
        'Lower heels slowly back to the floor.',
      ];
    case 'bicep-curl':
      return [
        'Keep elbows pinned close to your ribs with arms fully extended.',
        'Curl the weight up toward your shoulders and squeeze your biceps.',
        'Lower slowly over 2 seconds without swinging your back.',
      ];
    case 'tricep-ext':
      return [
        'Keep upper arms locked in place so only your elbows bend.',
        'Extend forearms smoothly until triceps are fully contracted.',
        'Lower slowly back to a deep tricep stretch.',
      ];
    case 'rotation':
      return [
        'Sit with knees bent, lean back slightly with a tall spine, weight at chest.',
        'Rotate your ribcage smoothly from side to side under control.',
        'Keep abs braced and avoid rounding your lower back.',
      ];
    case 'anti-extension':
      return [
        'Brace your abs tight and keep your lower back flat (zero sagging).',
        'Extend slowly forward/outward while holding full core tension.',
        'Pull smoothly back to the starting position.',
      ];
    case 'anti-lateral':
      return [
        'Stand tall holding one dumbbell at your side, shoulders completely level.',
        'Lift one knee up to hip height slowly without leaning sideways.',
        'Lower foot with control and alternate legs.',
      ];
    case 'flexion':
      return [
        'Lie back on the bench gripping the edge behind your head.',
        'Raise straight legs up toward vertical and gently curl your hips.',
        'Lower legs slowly while keeping your lower back pressed down.',
      ];
    default:
      return [
        'Set a stable posture and brace your core.',
        'Move smoothly through the full range of motion.',
        'Return with control to the starting position.',
      ];
  }
}

function getAnimationSpec(exercise: Exercise): ExerciseAnimationSpec {
  const p = exercise.pattern;

  // 1. Horizontal Push (Bench Press / Floor Press)
  if (p === 'horizontal-push') {
    const isBench = exercise.requiresBench;
    const y = isBench ? 102 : 132;
    return {
      bench: isBench ? 'flat' : undefined,
      arrow: { from: { x: 112, y: y - 16 }, to: { x: 112, y: y - 50 } },
      phaseLabels: ['Lowered at Chest', 'Pressing Up', 'Locked Out'],
      start: {
        head: { x: 64, y: y - 5 },
        shoulder: { x: 86, y: y },
        hip: { x: 136, y: y },
        elbow: { x: 96, y: y + (isBench ? 10 : 0) },
        wrist: { x: 96, y: y - 18 },
        knee: { x: 164, y: isBench ? y + 2 : y - 22 },
        ankle: { x: 164, y: 140 },
        knee2: { x: 160, y: isBench ? y + 4 : y - 20 },
        ankle2: { x: 160, y: 140 },
      },
      peak: {
        head: { x: 64, y: y - 5 },
        shoulder: { x: 86, y: y },
        hip: { x: 136, y: y },
        elbow: { x: 92, y: y - 22 },
        wrist: { x: 94, y: y - 46 },
        knee: { x: 164, y: isBench ? y + 2 : y - 22 },
        ankle: { x: 164, y: 140 },
        knee2: { x: 160, y: isBench ? y + 4 : y - 20 },
        ankle2: { x: 160, y: 140 },
      },
    };
  }

  // 2. Incline Push
  if (p === 'incline-push') {
    return {
      bench: 'incline',
      arrow: { from: { x: 118, y: 66 }, to: { x: 118, y: 32 } },
      phaseLabels: ['Upper Chest Start', 'Pressing Up', 'Top Extension'],
      start: {
        head: { x: 74, y: 64 },
        shoulder: { x: 90, y: 78 },
        hip: { x: 132, y: 108 },
        elbow: { x: 100, y: 94 },
        wrist: { x: 106, y: 68 },
        knee: { x: 160, y: 108 },
        ankle: { x: 164, y: 140 },
      },
      peak: {
        head: { x: 74, y: 64 },
        shoulder: { x: 90, y: 78 },
        hip: { x: 132, y: 108 },
        elbow: { x: 98, y: 56 },
        wrist: { x: 104, y: 32 },
        knee: { x: 160, y: 108 },
        ankle: { x: 164, y: 140 },
      },
    };
  }

  // 3. Chest Fly (Front-facing lying view so wide arc is crystal clear!)
  if (p === 'chest-fly') {
    const isBench = exercise.requiresBench;
    const y = isBench ? 106 : 128;
    return {
      bench: isBench ? 'flat' : undefined,
      arrow: { from: { x: 64, y: y - 16 }, to: { x: 106, y: y - 48 } },
      phaseLabels: ['Wide Stretch', 'Squeezing In', 'Top Squeeze'],
      start: {
        view: 'front',
        head: { x: 120, y: y - 18 },
        shoulder: { x: 120, y: y },
        hip: { x: 120, y: y + 10 },
        elbow: { x: 86, y: y + 2 },
        wrist: { x: 68, y: y - 10 },
        elbow2: { x: 154, y: y + 2 },
        wrist2: { x: 172, y: y - 10 },
        knee: { x: 106, y: 136 },
        ankle: { x: 102, y: 142 },
        knee2: { x: 134, y: 136 },
        ankle2: { x: 138, y: 142 },
      },
      peak: {
        view: 'front',
        head: { x: 120, y: y - 18 },
        shoulder: { x: 120, y: y },
        hip: { x: 120, y: y + 10 },
        elbow: { x: 104, y: y - 24 },
        wrist: { x: 112, y: y - 48 },
        elbow2: { x: 136, y: y - 24 },
        wrist2: { x: 128, y: y - 48 },
        knee: { x: 106, y: 136 },
        ankle: { x: 102, y: 142 },
        knee2: { x: 134, y: 136 },
        ankle2: { x: 138, y: 142 },
      },
    };
  }

  // 4. Dumbbell Pullover (Bench or Floor)
  if (p === 'pullover') {
    const isBench = exercise.requiresBench;
    const y = isBench ? 102 : 132;
    return {
      bench: isBench ? 'flat' : undefined,
      arrow: { from: { x: 54, y: y - 18 }, to: { x: 96, y: y - 48 } },
      phaseLabels: ['Overhead Stretch', 'Pulling Over', 'Over Chest'],
      start: {
        head: { x: 68, y: y - 5 },
        shoulder: { x: 90, y },
        hip: { x: 140, y },
        elbow: { x: 66, y: y - 16 },
        wrist: { x: 46, y: y - 18 },
        knee: { x: 166, y: isBench ? y + 2 : y - 22 },
        ankle: { x: 166, y: 140 },
      },
      peak: {
        head: { x: 68, y: y - 5 },
        shoulder: { x: 90, y },
        hip: { x: 140, y },
        elbow: { x: 94, y: y - 24 },
        wrist: { x: 96, y: y - 46 },
        knee: { x: 166, y: isBench ? y + 2 : y - 22 },
        ankle: { x: 166, y: 140 },
      },
    };
  }

  // 4b. Deficit Push-Up on Dumbbells
  if (p === 'pushup') {
    return {
      arrow: { from: { x: 170, y: 92 }, to: { x: 170, y: 128 } },
      phaseLabels: ['High Plank', 'Lowering Chest', 'Deep Deficit Push'],
      start: {
        head: { x: 166, y: 82 },
        shoulder: { x: 148, y: 92 },
        hip: { x: 102, y: 108 },
        elbow: { x: 148, y: 114 },
        wrist: { x: 148, y: 136 },
        knee: { x: 74, y: 122 },
        ankle: { x: 48, y: 138 },
      },
      peak: {
        head: { x: 168, y: 114 },
        shoulder: { x: 148, y: 124 },
        hip: { x: 102, y: 126 },
        elbow: { x: 134, y: 114 },
        wrist: { x: 148, y: 136 },
        knee: { x: 74, y: 132 },
        ankle: { x: 48, y: 138 },
      },
    };
  }

  // 4c. Renegade Row / Plank Pull-Through
  if (p === 'renegade-row') {
    return {
      arrow: { from: { x: 148, y: 132 }, to: { x: 126, y: 100 } },
      phaseLabels: ['Rigid Plank', 'Rowing to Hip', 'Peak Contraction'],
      start: {
        head: { x: 166, y: 82 },
        shoulder: { x: 148, y: 92 },
        hip: { x: 102, y: 108 },
        elbow: { x: 148, y: 114 },
        wrist: { x: 148, y: 136 },
        knee: { x: 74, y: 122 },
        ankle: { x: 48, y: 138 },
      },
      peak: {
        head: { x: 166, y: 82 },
        shoulder: { x: 148, y: 92 },
        hip: { x: 102, y: 108 },
        elbow: { x: 128, y: 86 },
        wrist: { x: 126, y: 106 },
        knee: { x: 74, y: 122 },
        ankle: { x: 48, y: 138 },
      },
    };
  }

  // 4d. Push Press (Dip & Explosive Overhead Drive)
  if (p === 'push-press') {
    return {
      arrow: { from: { x: 166, y: 56 }, to: { x: 166, y: 14 } },
      phaseLabels: ['Knee Dip', 'Explosive Drive', 'Overhead Lockout'],
      start: {
        view: 'front',
        head: { x: 120, y: 46 },
        shoulder: { x: 120, y: 62 },
        hip: { x: 120, y: 100 },
        elbow: { x: 94, y: 74 },
        wrist: { x: 92, y: 56 },
        elbow2: { x: 146, y: 74 },
        wrist2: { x: 148, y: 56 },
        knee: { x: 102, y: 120 },
        ankle: { x: 104, y: 140 },
        knee2: { x: 138, y: 120 },
        ankle2: { x: 136, y: 140 },
      },
      peak: {
        view: 'front',
        head: { x: 120, y: 36 },
        shoulder: { x: 120, y: 52 },
        hip: { x: 120, y: 90 },
        elbow: { x: 100, y: 36 },
        wrist: { x: 102, y: 14 },
        elbow2: { x: 140, y: 36 },
        wrist2: { x: 138, y: 14 },
        knee: { x: 108, y: 116 },
        ankle: { x: 106, y: 140 },
        knee2: { x: 132, y: 116 },
        ankle2: { x: 134, y: 140 },
      },
    };
  }

  // 5. Rows (Bent-over / Chest-supported / Single-arm)
  if (p === 'horizontal-pull' || p === 'unilateral-pull') {
    return {
      bench: exercise.requiresBench ? 'incline' : undefined,
      arrow: { from: { x: 150, y: 114 }, to: { x: 132, y: 84 } },
      phaseLabels: ['Arms Extended', 'Rowing to Hip', 'Back Squeeze'],
      start: {
        head: { x: 152, y: 60 },
        shoulder: { x: 134, y: 72 },
        hip: { x: 94, y: 88 },
        elbow: { x: 134, y: 96 },
        wrist: { x: 134, y: 118 },
        knee: { x: 104, y: 116 },
        ankle: { x: 100, y: 140 },
        knee2: { x: 88, y: 116 },
        ankle2: { x: 84, y: 140 },
      },
      peak: {
        head: { x: 152, y: 60 },
        shoulder: { x: 134, y: 72 },
        hip: { x: 94, y: 88 },
        elbow: { x: 112, y: 64 },
        wrist: { x: 118, y: 86 },
        knee: { x: 104, y: 116 },
        ankle: { x: 100, y: 140 },
        knee2: { x: 88, y: 116 },
        ankle2: { x: 84, y: 140 },
      },
    };
  }

  // 6. Rear Delt Fly
  if (p === 'rear-delt') {
    return {
      bench: exercise.requiresBench ? 'incline' : undefined,
      arrow: { from: { x: 140, y: 116 }, to: { x: 166, y: 76 } },
      phaseLabels: ['Hanging Down', 'Sweeping Out', 'Upper Back Squeeze'],
      start: {
        head: { x: 154, y: 62 },
        shoulder: { x: 136, y: 72 },
        hip: { x: 94, y: 88 },
        elbow: { x: 136, y: 96 },
        wrist: { x: 136, y: 118 },
        knee: { x: 104, y: 116 },
        ankle: { x: 100, y: 140 },
        knee2: { x: 88, y: 116 },
        ankle2: { x: 84, y: 140 },
      },
      peak: {
        head: { x: 154, y: 62 },
        shoulder: { x: 136, y: 72 },
        hip: { x: 94, y: 88 },
        elbow: { x: 152, y: 72 },
        wrist: { x: 170, y: 72 },
        knee: { x: 104, y: 116 },
        ankle: { x: 100, y: 140 },
        knee2: { x: 88, y: 116 },
        ankle2: { x: 84, y: 140 },
      },
    };
  }

  // 7. Overhead Press (Front-facing so symmetry & lockout are super clear!)
  if (p === 'vertical-push') {
    const seated = exercise.requiresBench;
    const hipY = seated ? 106 : 92;
    const shY = seated ? 68 : 54;
    return {
      bench: seated ? 'upright' : undefined,
      arrow: { from: { x: 162, y: shY - 2 }, to: { x: 162, y: shY - 38 } },
      phaseLabels: ['At Shoulders', 'Pressing Overhead', 'Full Lockout'],
      start: {
        view: 'front',
        head: { x: 120, y: shY - 16 },
        shoulder: { x: 120, y: shY },
        hip: { x: 120, y: hipY },
        elbow: { x: 92, y: shY + 10 },
        wrist: { x: 90, y: shY - 8 },
        elbow2: { x: 148, y: shY + 10 },
        wrist2: { x: 150, y: shY - 8 },
        knee: { x: 106, y: seated ? 114 : 118 },
        ankle: { x: 104, y: 140 },
        knee2: { x: 134, y: seated ? 114 : 118 },
        ankle2: { x: 136, y: 140 },
      },
      peak: {
        view: 'front',
        head: { x: 120, y: shY - 16 },
        shoulder: { x: 120, y: shY },
        hip: { x: 120, y: hipY },
        elbow: { x: 100, y: shY - 16 },
        wrist: { x: 102, y: shY - 38 },
        elbow2: { x: 140, y: shY - 16 },
        wrist2: { x: 138, y: shY - 38 },
        knee: { x: 106, y: seated ? 114 : 118 },
        ankle: { x: 104, y: 140 },
        knee2: { x: 134, y: seated ? 114 : 118 },
        ankle2: { x: 136, y: 140 },
      },
    };
  }

  // 8. Lateral Raise (Front-facing!)
  if (p === 'lateral-raise') {
    const seated = exercise.requiresBench;
    const hipY = seated ? 106 : 92;
    const shY = seated ? 68 : 54;
    return {
      bench: seated ? 'upright' : undefined,
      arrow: { from: { x: 150, y: shY + 34 }, to: { x: 174, y: shY + 2 } },
      phaseLabels: ['At Sides', 'Raising Out', 'Shoulder Height'],
      start: {
        view: 'front',
        head: { x: 120, y: shY - 16 },
        shoulder: { x: 120, y: shY },
        hip: { x: 120, y: hipY },
        elbow: { x: 100, y: shY + 20 },
        wrist: { x: 96, y: shY + 40 },
        elbow2: { x: 140, y: shY + 20 },
        wrist2: { x: 144, y: shY + 40 },
        knee: { x: 108, y: 118 },
        ankle: { x: 106, y: 140 },
        knee2: { x: 132, y: 118 },
        ankle2: { x: 134, y: 140 },
      },
      peak: {
        view: 'front',
        head: { x: 120, y: shY - 16 },
        shoulder: { x: 120, y: shY },
        hip: { x: 120, y: hipY },
        elbow: { x: 84, y: shY + 2 },
        wrist: { x: 64, y: shY + 2 },
        elbow2: { x: 156, y: shY + 2 },
        wrist2: { x: 176, y: shY + 2 },
        knee: { x: 108, y: 118 },
        ankle: { x: 106, y: 140 },
        knee2: { x: 132, y: 118 },
        ankle2: { x: 134, y: 140 },
      },
    };
  }

  // 9. Front Raise (Side view)
  if (p === 'front-raise') {
    return {
      arrow: { from: { x: 136, y: 92 }, to: { x: 164, y: 54 } },
      phaseLabels: ['At Thighs', 'Lifting Forward', 'Shoulder Level'],
      start: {
        head: { x: 112, y: 36 },
        shoulder: { x: 112, y: 52 },
        hip: { x: 110, y: 90 },
        elbow: { x: 116, y: 72 },
        wrist: { x: 124, y: 92 },
        knee: { x: 114, y: 116 },
        ankle: { x: 112, y: 140 },
        knee2: { x: 104, y: 116 },
        ankle2: { x: 102, y: 140 },
      },
      peak: {
        head: { x: 112, y: 36 },
        shoulder: { x: 112, y: 52 },
        hip: { x: 110, y: 90 },
        elbow: { x: 134, y: 52 },
        wrist: { x: 156, y: 52 },
        knee: { x: 114, y: 116 },
        ankle: { x: 112, y: 140 },
        knee2: { x: 104, y: 116 },
        ankle2: { x: 102, y: 140 },
      },
    };
  }

  // 10. Upright Row / Shrug (Front view)
  if (p === 'upright-row' || p === 'trap-shrug') {
    const isShrug = p === 'trap-shrug';
    return {
      arrow: { from: { x: 154, y: 86 }, to: { x: 154, y: isShrug ? 72 : 54 } },
      phaseLabels: ['Arms Relaxed', isShrug ? 'Shrugging Up' : 'Pulling Elbows High', 'Peak Hold'],
      start: {
        view: 'front',
        head: { x: 120, y: 36 },
        shoulder: { x: 120, y: 54 },
        hip: { x: 120, y: 92 },
        elbow: { x: 102, y: 74 },
        wrist: { x: isShrug ? 98 : 108, y: 94 },
        elbow2: { x: 138, y: 74 },
        wrist2: { x: isShrug ? 142 : 132, y: 94 },
        knee: { x: 108, y: 118 },
        ankle: { x: 106, y: 140 },
        knee2: { x: 132, y: 118 },
        ankle2: { x: 134, y: 140 },
      },
      peak: {
        view: 'front',
        head: { x: 120, y: 36 },
        shoulder: { x: 120, y: isShrug ? 47 : 54 },
        hip: { x: 120, y: 92 },
        elbow: { x: isShrug ? 100 : 88, y: isShrug ? 67 : 50 },
        wrist: { x: isShrug ? 98 : 108, y: isShrug ? 86 : 62 },
        elbow2: { x: isShrug ? 140 : 152, y: isShrug ? 67 : 50 },
        wrist2: { x: isShrug ? 142 : 132, y: isShrug ? 86 : 62 },
        knee: { x: 108, y: 118 },
        ankle: { x: 106, y: 140 },
        knee2: { x: 132, y: 118 },
        ankle2: { x: 134, y: 140 },
      },
    };
  }

  // 11. Squat (Side view — feet stay strictly planted at y=140!)
  if (p === 'squat') {
    const isBB = exercise.requiresBarbell;
    return {
      arrow: { from: { x: 74, y: 74 }, to: { x: 74, y: 108 } },
      phaseLabels: ['Standing Tall', 'Sitting Back & Down', 'Parallel Depth'],
      start: {
        head: { x: 118, y: 34 },
        shoulder: { x: 116, y: 50 },
        hip: { x: 112, y: 88 },
        elbow: { x: isBB ? 110 : 124, y: isBB ? 64 : 68 },
        wrist: { x: isBB ? 114 : 134, y: isBB ? 50 : 58 },
        knee: { x: 116, y: 115 },
        ankle: { x: 114, y: 140 },
        knee2: { x: 108, y: 115 },
        ankle2: { x: 106, y: 140 },
      },
      peak: {
        head: { x: 116, y: 64 },
        shoulder: { x: 110, y: 78 },
        hip: { x: 88, y: 110 },
        elbow: { x: isBB ? 104 : 120, y: isBB ? 92 : 96 },
        wrist: { x: isBB ? 108 : 130, y: isBB ? 78 : 86 },
        knee: { x: 128, y: 114 },
        ankle: { x: 114, y: 140 },
        knee2: { x: 120, y: 114 },
        ankle2: { x: 106, y: 140 },
      },
    };
  }

  // 12. Hinge (RDL / Deadlift — hips push back, spine flat, feet planted!)
  if (p === 'hinge') {
    return {
      arrow: { from: { x: 148, y: 86 }, to: { x: 148, y: 124 } },
      phaseLabels: ['Standing Tall', 'Hinging Hips Back', 'Hamstring Stretch'],
      start: {
        head: { x: 116, y: 34 },
        shoulder: { x: 114, y: 50 },
        hip: { x: 112, y: 88 },
        elbow: { x: 118, y: 70 },
        wrist: { x: 122, y: 92 },
        knee: { x: 116, y: 115 },
        ankle: { x: 114, y: 140 },
        knee2: { x: 108, y: 115 },
        ankle2: { x: 106, y: 140 },
      },
      peak: {
        head: { x: 152, y: 68 },
        shoulder: { x: 136, y: 76 },
        hip: { x: 96, y: 92 },
        elbow: { x: 132, y: 100 },
        wrist: { x: 128, y: 122 },
        knee: { x: 112, y: 116 },
        ankle: { x: 114, y: 140 },
        knee2: { x: 104, y: 116 },
        ankle2: { x: 106, y: 140 },
      },
    };
  }

  // 13. Unilateral Leg (Reverse Lunge / Bulgarian Split Squat / Step-up)
  if (p === 'unilateral-leg') {
    const isBench = exercise.requiresBench;
    return {
      bench: isBench ? 'split-squat' : undefined,
      arrow: { from: { x: 162, y: 66 }, to: { x: 162, y: 100 } },
      phaseLabels: ['Split Stance', 'Dropping Straight Down', '90° Knee Depth'],
      start: {
        head: { x: 124, y: 36 },
        shoulder: { x: 122, y: 52 },
        hip: { x: 118, y: 88 },
        elbow: { x: 122, y: 72 },
        wrist: { x: 122, y: 92 },
        knee: { x: 138, y: 114 },
        ankle: { x: 142, y: 140 },
        knee2: { x: 96, y: 110 },
        ankle2: { x: 74, y: isBench ? 114 : 140 },
      },
      peak: {
        head: { x: 126, y: 60 },
        shoulder: { x: 122, y: 76 },
        hip: { x: 114, y: 110 },
        elbow: { x: 120, y: 96 },
        wrist: { x: 120, y: 116 },
        knee: { x: 144, y: 112 },
        ankle: { x: 142, y: 140 },
        knee2: { x: 98, y: 132 },
        ankle2: { x: 74, y: isBench ? 114 : 140 },
      },
    };
  }

  // 14. Hip Thrust / Floor Glute Bridge
  if (p === 'glute-thrust') {
    const isBench = exercise.requiresBench;
    const shY = isBench ? 98 : 132;
    return {
      bench: isBench ? 'hip-thrust' : undefined,
      arrow: { from: { x: 124, y: 130 }, to: { x: 124, y: isBench ? 96 : 108 } },
      phaseLabels: ['Hips Lowered', 'Driving Hips Up', 'Glute Bridge Peak'],
      start: {
        head: { x: 74, y: shY - 8 },
        shoulder: { x: 90, y: shY },
        hip: { x: 126, y: 132 },
        elbow: { x: 106, y: isBench ? 112 : 134 },
        wrist: { x: 124, y: 124 },
        weight: { x: 126, y: 122 },
        knee: { x: 154, y: 106 },
        ankle: { x: 158, y: 140 },
      },
      peak: {
        head: { x: 76, y: shY - 8 },
        shoulder: { x: 92, y: shY },
        hip: { x: 130, y: isBench ? 100 : 112 },
        elbow: { x: 110, y: isBench ? 96 : 122 },
        wrist: { x: 128, y: isBench ? 96 : 108 },
        weight: { x: 130, y: isBench ? 93 : 106 },
        knee: { x: 162, y: isBench ? 102 : 104 },
        ankle: { x: 162, y: 140 },
      },
    };
  }

  // 14b. Single-Leg Dumbbell RDL
  if (p === 'single-leg-hinge') {
    return {
      arrow: { from: { x: 136, y: 92 }, to: { x: 146, y: 126 } },
      phaseLabels: ['Balanced Tall', 'Hinging & Extending Back Leg', 'Horizontal T-Hold'],
      start: {
        head: { x: 118, y: 34 },
        shoulder: { x: 116, y: 50 },
        hip: { x: 114, y: 88 },
        elbow: { x: 118, y: 70 },
        wrist: { x: 122, y: 92 },
        knee: { x: 116, y: 115 },
        ankle: { x: 116, y: 140 },
        knee2: { x: 108, y: 115 },
        ankle2: { x: 104, y: 138 },
      },
      peak: {
        head: { x: 166, y: 78 },
        shoulder: { x: 148, y: 82 },
        hip: { x: 110, y: 88 },
        elbow: { x: 146, y: 104 },
        wrist: { x: 144, y: 124 },
        knee: { x: 116, y: 115 },
        ankle: { x: 116, y: 140 },
        knee2: { x: 78, y: 88 },
        ankle2: { x: 48, y: 88 },
      },
    };
  }

  // 14c. Side Lunge (Front view)
  if (p === 'side-lunge') {
    return {
      arrow: { from: { x: 120, y: 86 }, to: { x: 152, y: 106 } },
      phaseLabels: ['Standing Tall', 'Stepping & Sitting Back', 'Deep Lateral Lunge'],
      start: {
        view: 'front',
        head: { x: 120, y: 36 },
        shoulder: { x: 120, y: 52 },
        hip: { x: 120, y: 90 },
        elbow: { x: 102, y: 72 },
        wrist: { x: 100, y: 92 },
        elbow2: { x: 138, y: 72 },
        wrist2: { x: 140, y: 92 },
        knee: { x: 110, y: 116 },
        ankle: { x: 108, y: 140 },
        knee2: { x: 130, y: 116 },
        ankle2: { x: 132, y: 140 },
      },
      peak: {
        view: 'front',
        head: { x: 144, y: 56 },
        shoulder: { x: 142, y: 72 },
        hip: { x: 142, y: 108 },
        elbow: { x: 126, y: 92 },
        wrist: { x: 126, y: 114 },
        elbow2: { x: 158, y: 92 },
        wrist2: { x: 158, y: 114 },
        knee: { x: 108, y: 124 },
        ankle: { x: 76, y: 140 },
        knee2: { x: 164, y: 112 },
        ankle2: { x: 162, y: 140 },
      },
    };
  }

  // 14d. Barbell Good Morning
  if (p === 'good-morning') {
    return {
      arrow: { from: { x: 128, y: 50 }, to: { x: 160, y: 78 } },
      phaseLabels: ['Standing Upright', 'Hinging Forward', 'Hamstring Stretch'],
      start: {
        head: { x: 116, y: 34 },
        shoulder: { x: 114, y: 50 },
        hip: { x: 112, y: 88 },
        elbow: { x: 108, y: 62 },
        wrist: { x: 112, y: 48 },
        weight: { x: 112, y: 48 },
        knee: { x: 116, y: 115 },
        ankle: { x: 114, y: 140 },
        knee2: { x: 108, y: 115 },
        ankle2: { x: 106, y: 140 },
      },
      peak: {
        head: { x: 160, y: 70 },
        shoulder: { x: 144, y: 76 },
        hip: { x: 100, y: 90 },
        elbow: { x: 136, y: 86 },
        wrist: { x: 142, y: 74 },
        weight: { x: 142, y: 74 },
        knee: { x: 114, y: 116 },
        ankle: { x: 114, y: 140 },
        knee2: { x: 106, y: 116 },
        ankle2: { x: 106, y: 140 },
      },
    };
  }

  // 15. Calf Raise
  if (p === 'calf') {
    return {
      arrow: { from: { x: 148, y: 136 }, to: { x: 148, y: 116 } },
      phaseLabels: ['Heels Flat', 'Rising onto Toes', 'Peak Calf Squeeze'],
      start: {
        head: { x: 118, y: 38 },
        shoulder: { x: 118, y: 54 },
        hip: { x: 118, y: 92 },
        elbow: { x: 118, y: 74 },
        wrist: { x: 118, y: 94 },
        knee: { x: 118, y: 116 },
        ankle: { x: 118, y: 140 },
      },
      peak: {
        head: { x: 118, y: 26 },
        shoulder: { x: 118, y: 42 },
        hip: { x: 118, y: 80 },
        elbow: { x: 118, y: 62 },
        wrist: { x: 118, y: 82 },
        knee: { x: 118, y: 106 },
        ankle: { x: 118, y: 130 },
      },
    };
  }

  // 16. Bicep Curl (Side view — elbow pinned!)
  if (p === 'bicep-curl') {
    return {
      arrow: { from: { x: 136, y: 94 }, to: { x: 142, y: 56 } },
      phaseLabels: ['Arms Extended', 'Curling Up', 'Bicep Squeeze'],
      start: {
        head: { x: 114, y: 34 },
        shoulder: { x: 112, y: 50 },
        hip: { x: 110, y: 90 },
        elbow: { x: 114, y: 72 },
        wrist: { x: 118, y: 94 },
        knee: { x: 114, y: 116 },
        ankle: { x: 112, y: 140 },
        knee2: { x: 104, y: 116 },
        ankle2: { x: 102, y: 140 },
      },
      peak: {
        head: { x: 114, y: 34 },
        shoulder: { x: 112, y: 50 },
        hip: { x: 110, y: 90 },
        elbow: { x: 116, y: 72 },
        wrist: { x: 128, y: 54 },
        knee: { x: 114, y: 116 },
        ankle: { x: 112, y: 140 },
        knee2: { x: 104, y: 116 },
        ankle2: { x: 102, y: 140 },
      },
    };
  }

  // 17. Tricep Extension (Overhead or Lying Skull Crusher)
  if (p === 'tricep-ext') {
    const isLying =
      exercise.id.includes('skull') || exercise.id.includes('close-grip');
    if (isLying) {
      const isBench = exercise.requiresBench;
      const y = isBench ? 102 : 132;
      return {
        bench: isBench ? 'flat' : undefined,
        arrow: { from: { x: 74, y: y - 16 }, to: { x: 96, y: y - 48 } },
        phaseLabels: ['Elbows Bent', 'Extending Arms', 'Tricep Lockout'],
        start: {
          head: { x: 66, y: y - 5 },
          shoulder: { x: 88, y: y },
          hip: { x: 138, y: y },
          elbow: { x: 88, y: y - 24 },
          wrist: { x: 68, y: y - 18 },
          knee: { x: 164, y: isBench ? y + 2 : y - 22 },
          ankle: { x: 164, y: 140 },
        },
        peak: {
          head: { x: 66, y: y - 5 },
          shoulder: { x: 88, y: y },
          hip: { x: 138, y: y },
          elbow: { x: 88, y: y - 24 },
          wrist: { x: 90, y: y - 46 },
          knee: { x: 164, y: isBench ? y + 2 : y - 22 },
          ankle: { x: 164, y: 140 },
        },
      };
    }
    return {
      arrow: { from: { x: 96, y: 46 }, to: { x: 116, y: 14 } },
      phaseLabels: ['Behind Head', 'Extending Up', 'Full Lockout'],
      start: {
        head: { x: 118, y: 40 },
        shoulder: { x: 116, y: 56 },
        hip: { x: 114, y: 92 },
        elbow: { x: 116, y: 34 },
        wrist: { x: 100, y: 46 },
        knee: { x: 118, y: 116 },
        ankle: { x: 116, y: 140 },
      },
      peak: {
        head: { x: 118, y: 40 },
        shoulder: { x: 116, y: 56 },
        hip: { x: 114, y: 92 },
        elbow: { x: 116, y: 34 },
        wrist: { x: 116, y: 14 },
        knee: { x: 118, y: 116 },
        ankle: { x: 116, y: 140 },
      },
    };
  }

  // 17b. Tricep Kickback
  if (p === 'tricep-kickback') {
    return {
      arrow: { from: { x: 124, y: 100 }, to: { x: 92, y: 74 } },
      phaseLabels: ['Elbows Bent 90°', 'Extending Straight Back', 'Tricep Lockout'],
      start: {
        head: { x: 154, y: 60 },
        shoulder: { x: 136, y: 72 },
        hip: { x: 96, y: 88 },
        elbow: { x: 118, y: 74 },
        wrist: { x: 120, y: 96 },
        knee: { x: 106, y: 116 },
        ankle: { x: 102, y: 140 },
        knee2: { x: 90, y: 116 },
        ankle2: { x: 86, y: 140 },
      },
      peak: {
        head: { x: 154, y: 60 },
        shoulder: { x: 136, y: 72 },
        hip: { x: 96, y: 88 },
        elbow: { x: 118, y: 74 },
        wrist: { x: 94, y: 72 },
        knee: { x: 106, y: 116 },
        ankle: { x: 102, y: 140 },
        knee2: { x: 90, y: 116 },
        ankle2: { x: 86, y: 140 },
      },
    };
  }

  // 17c. Seated Concentration Curl
  if (p === 'concentration-curl') {
    return {
      bench: 'hip-thrust',
      arrow: { from: { x: 128, y: 124 }, to: { x: 128, y: 84 } },
      phaseLabels: ['Arm Extended', 'Curling Up Strictly', 'Peak Bicep Squeeze'],
      start: {
        head: { x: 114, y: 54 },
        shoulder: { x: 102, y: 68 },
        hip: { x: 76, y: 100 },
        elbow: { x: 114, y: 96 },
        wrist: { x: 116, y: 124 },
        knee: { x: 118, y: 102 },
        ankle: { x: 122, y: 140 },
      },
      peak: {
        head: { x: 114, y: 54 },
        shoulder: { x: 102, y: 68 },
        hip: { x: 76, y: 100 },
        elbow: { x: 114, y: 96 },
        wrist: { x: 122, y: 74 },
        knee: { x: 118, y: 102 },
        ankle: { x: 122, y: 140 },
      },
    };
  }

  // 17d. Forearm Wrist Curl
  if (p === 'wrist-curl') {
    return {
      arrow: { from: { x: 152, y: 112 }, to: { x: 152, y: 92 } },
      phaseLabels: ['Wrists Extended', 'Curling Wrists Up', 'Forearm Squeeze'],
      start: {
        head: { x: 96, y: 56 },
        shoulder: { x: 88, y: 72 },
        hip: { x: 76, y: 108 },
        elbow: { x: 112, y: 102 },
        wrist: { x: 140, y: 104 },
        weight: { x: 148, y: 112 },
        knee: { x: 122, y: 108 },
        ankle: { x: 124, y: 140 },
      },
      peak: {
        head: { x: 96, y: 56 },
        shoulder: { x: 88, y: 72 },
        hip: { x: 76, y: 108 },
        elbow: { x: 112, y: 102 },
        wrist: { x: 140, y: 100 },
        weight: { x: 146, y: 92 },
        knee: { x: 122, y: 108 },
        ankle: { x: 124, y: 140 },
      },
    };
  }

  // 18. Core: Bench Leg Raise
  if (p === 'flexion') {
    return {
      bench: 'flat',
      arrow: { from: { x: 174, y: 102 }, to: { x: 146, y: 56 } },
      phaseLabels: ['Legs Extended', 'Raising Legs Up', 'Vertical Hold'],
      start: {
        head: { x: 66, y: 97 },
        shoulder: { x: 86, y: 102 },
        hip: { x: 130, y: 102 },
        elbow: { x: 72, y: 96 },
        wrist: { x: 58, y: 102 },
        knee: { x: 158, y: 104 },
        ankle: { x: 184, y: 106 },
      },
      peak: {
        head: { x: 66, y: 97 },
        shoulder: { x: 86, y: 102 },
        hip: { x: 130, y: 100 },
        elbow: { x: 72, y: 96 },
        wrist: { x: 58, y: 102 },
        knee: { x: 134, y: 74 },
        ankle: { x: 134, y: 48 },
      },
    };
  }

  // 19. Core: Suitcase March
  if (p === 'anti-lateral') {
    return {
      arrow: { from: { x: 134, y: 124 }, to: { x: 134, y: 90 } },
      phaseLabels: ['Standing Tall', 'Marching Knee Up', 'Core Braced'],
      start: {
        head: { x: 116, y: 34 },
        shoulder: { x: 116, y: 50 },
        hip: { x: 116, y: 88 },
        elbow: { x: 116, y: 70 },
        wrist: { x: 116, y: 92 },
        knee: { x: 118, y: 114 },
        ankle: { x: 118, y: 140 },
        knee2: { x: 112, y: 114 },
        ankle2: { x: 112, y: 140 },
      },
      peak: {
        head: { x: 116, y: 34 },
        shoulder: { x: 116, y: 50 },
        hip: { x: 116, y: 88 },
        elbow: { x: 116, y: 70 },
        wrist: { x: 116, y: 92 },
        knee: { x: 142, y: 88 },
        ankle: { x: 142, y: 114 },
        knee2: { x: 112, y: 114 },
        ankle2: { x: 112, y: 140 },
      },
    };
  }

  // 20. Core: Barbell Ab Rollout
  if (exercise.id === 'bb-rollout') {
    return {
      arrow: { from: { x: 136, y: 134 }, to: { x: 178, y: 134 } },
      phaseLabels: ['Kneeling Start', 'Rolling Forward', 'Extended Core Hold'],
      start: {
        head: { x: 114, y: 74 },
        shoulder: { x: 114, y: 90 },
        hip: { x: 96, y: 116 },
        elbow: { x: 124, y: 112 },
        wrist: { x: 130, y: 134 },
        knee: { x: 90, y: 138 },
        ankle: { x: 64, y: 138 },
      },
      peak: {
        head: { x: 154, y: 106 },
        shoulder: { x: 142, y: 114 },
        hip: { x: 110, y: 128 },
        elbow: { x: 162, y: 124 },
        wrist: { x: 180, y: 134 },
        knee: { x: 90, y: 138 },
        ankle: { x: 64, y: 138 },
      },
    };
  }

  // 20b. Core: Diagonal Woodchopper (Front view)
  if (p === 'woodchopper') {
    return {
      arrow: { from: { x: 84, y: 102 }, to: { x: 158, y: 38 } },
      phaseLabels: ['Low Hip Load', 'Diagonal Chop', 'High Finish'],
      start: {
        view: 'front',
        head: { x: 114, y: 42 },
        shoulder: { x: 114, y: 58 },
        hip: { x: 118, y: 94 },
        elbow: { x: 96, y: 78 },
        wrist: { x: 88, y: 98 },
        elbow2: { x: 108, y: 80 },
        wrist2: { x: 92, y: 98 },
        weight: { x: 88, y: 100 },
        knee: { x: 104, y: 118 },
        ankle: { x: 98, y: 140 },
        knee2: { x: 134, y: 118 },
        ankle2: { x: 140, y: 140 },
      },
      peak: {
        view: 'front',
        head: { x: 124, y: 36 },
        shoulder: { x: 124, y: 52 },
        hip: { x: 122, y: 90 },
        elbow: { x: 136, y: 44 },
        wrist: { x: 156, y: 36 },
        elbow2: { x: 142, y: 48 },
        wrist2: { x: 156, y: 38 },
        weight: { x: 158, y: 36 },
        knee: { x: 106, y: 116 },
        ankle: { x: 98, y: 140 },
        knee2: { x: 134, y: 116 },
        ankle2: { x: 140, y: 140 },
      },
    };
  }

  // 20c. Core: Weighted Crunch
  if (p === 'crunch') {
    return {
      arrow: { from: { x: 76, y: 114 }, to: { x: 100, y: 86 } },
      phaseLabels: ['Back Flat', 'Curling Shoulders Up', 'Ab Squeeze'],
      start: {
        head: { x: 64, y: 128 },
        shoulder: { x: 84, y: 132 },
        hip: { x: 126, y: 134 },
        elbow: { x: 92, y: 114 },
        wrist: { x: 98, y: 98 },
        knee: { x: 152, y: 108 },
        ankle: { x: 168, y: 140 },
      },
      peak: {
        head: { x: 84, y: 94 },
        shoulder: { x: 98, y: 106 },
        hip: { x: 126, y: 134 },
        elbow: { x: 110, y: 92 },
        wrist: { x: 122, y: 78 },
        knee: { x: 152, y: 108 },
        ankle: { x: 168, y: 140 },
      },
    };
  }

  // 20d. Core: Standing Side Bend (Front view)
  if (p === 'side-bend') {
    return {
      arrow: { from: { x: 150, y: 88 }, to: { x: 156, y: 110 } },
      phaseLabels: ['Standing Tall', 'Bending Sideways', 'Oblique Stretch'],
      start: {
        view: 'front',
        head: { x: 120, y: 36 },
        shoulder: { x: 120, y: 52 },
        hip: { x: 120, y: 90 },
        elbow: { x: 98, y: 42 },
        wrist: { x: 110, y: 34 },
        elbow2: { x: 140, y: 72 },
        wrist2: { x: 142, y: 92 },
        weight: { x: 142, y: 94 },
        knee: { x: 110, y: 116 },
        ankle: { x: 108, y: 140 },
        knee2: { x: 130, y: 116 },
        ankle2: { x: 132, y: 140 },
      },
      peak: {
        view: 'front',
        head: { x: 136, y: 42 },
        shoulder: { x: 132, y: 58 },
        hip: { x: 120, y: 90 },
        elbow: { x: 108, y: 44 },
        wrist: { x: 124, y: 38 },
        elbow2: { x: 148, y: 82 },
        wrist2: { x: 150, y: 106 },
        weight: { x: 150, y: 108 },
        knee: { x: 110, y: 116 },
        ankle: { x: 108, y: 140 },
        knee2: { x: 130, y: 116 },
        ankle2: { x: 132, y: 140 },
      },
    };
  }

  // 20e. Core: Seated Bench Knee Tuck
  if (p === 'knee-tuck') {
    return {
      bench: 'flat',
      arrow: { from: { x: 170, y: 106 }, to: { x: 134, y: 88 } },
      phaseLabels: ['Legs Extended', 'Tucking Knees In', 'Core Crunch'],
      start: {
        head: { x: 74, y: 76 },
        shoulder: { x: 86, y: 88 },
        hip: { x: 114, y: 102 },
        elbow: { x: 82, y: 100 },
        wrist: { x: 90, y: 106 },
        knee: { x: 148, y: 106 },
        ankle: { x: 178, y: 108 },
      },
      peak: {
        head: { x: 88, y: 66 },
        shoulder: { x: 98, y: 78 },
        hip: { x: 114, y: 102 },
        elbow: { x: 88, y: 94 },
        wrist: { x: 92, y: 106 },
        knee: { x: 130, y: 82 },
        ankle: { x: 136, y: 106 },
      },
    };
  }

  // 21. Core: Seated Twist / Dead Bug default
  return {
    arrow: { from: { x: 108, y: 96 }, to: { x: 142, y: 96 } },
    phaseLabels: ['Core Braced', 'Controlled Motion', 'Full Tension'],
    start: {
      head: { x: 84, y: 84 },
      shoulder: { x: 94, y: 98 },
      hip: { x: 118, y: 132 },
      elbow: { x: 104, y: 110 },
      wrist: { x: 114, y: 102 },
      knee: { x: 144, y: 114 },
      ankle: { x: 160, y: 138 },
    },
    peak: {
      head: { x: 84, y: 84 },
      shoulder: { x: 94, y: 98 },
      hip: { x: 118, y: 132 },
      elbow: { x: 116, y: 110 },
      wrist: { x: 138, y: 100 },
      knee: { x: 144, y: 114 },
      ankle: { x: 160, y: 138 },
    },
  };
}

interface ExerciseMotionProps {
  exercise: Exercise;
  size?: 'sm' | 'lg';
  paused?: boolean;
  speed?: number;
  manualProgress?: number | null;
  onPhaseChange?: (label: string) => void;
}

export function ExerciseMotion({
  exercise,
  size = 'sm',
  paused = false,
  speed = 1,
  manualProgress = null,
  onPhaseChange,
}: ExerciseMotionProps) {
  const [animT, setAnimT] = useState(0);
  const spec = getAnimationSpec(exercise);

  useEffect(() => {
    if (paused || manualProgress !== null) return;
    let rafId = 0;
    let startTime = performance.now();
    const durationMs = 2800 / speed;

    const tick = (now: number) => {
      const elapsed = (now - startTime) % durationMs;
      const phase01 = elapsed / durationMs;
      const t = cycleProgress(phase01);
      setAnimT(t);

      if (onPhaseChange) {
        if (t < 0.15) onPhaseChange(spec.phaseLabels[0]);
        else if (t > 0.85) onPhaseChange(spec.phaseLabels[2]);
        else onPhaseChange(spec.phaseLabels[1]);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [paused, speed, manualProgress, exercise.id]);

  const t = manualProgress !== null ? manualProgress : animT;
  const pose = interpolatePose(spec.start, spec.peak, t);

  const isFront = pose.view === 'front';
  const eqColor = exercise.requiresBarbell ? '#a78bfa' : '#22c55e';
  const eqDark = exercise.requiresBarbell ? '#6d28d9' : '#15803d';

  const renderBench = () => {
    if (!spec.bench) return null;
    if (spec.bench === 'flat') {
      return (
        <g>
          {/* Steel frame */}
          <rect x="64" y="112" width="6" height="30" rx="2" fill="#475569" />
          <rect x="138" y="112" width="6" height="30" rx="2" fill="#475569" />
          <rect x="58" y="139" width="18" height="4" rx="2" fill="#334155" />
          <rect x="132" y="139" width="18" height="4" rx="2" fill="#334155" />
          {/* Padded cushion */}
          <rect x="52" y="105" width="102" height="9" rx="4" fill="#1e3a5f" stroke="#38bdf8" strokeWidth="1.5" />
        </g>
      );
    }
    if (spec.bench === 'incline') {
      return (
        <g>
          <line x1="88" y1="92" x2="88" y2="141" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
          <line x1="142" y1="116" x2="142" y2="141" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
          {/* Incline backrest */}
          <line x1="70" y1="74" x2="124" y2="112" stroke="#1e3a5f" strokeWidth="10" strokeLinecap="round" />
          <line x1="70" y1="74" x2="124" y2="112" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          {/* Seat */}
          <line x1="124" y1="112" x2="152" y2="112" stroke="#1e3a5f" strokeWidth="9" strokeLinecap="round" />
          <line x1="124" y1="112" x2="152" y2="112" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    }
    if (spec.bench === 'upright') {
      return (
        <g>
          <rect x="102" y="56" width="36" height="58" rx="6" fill="#1e3a5f" stroke="#38bdf8" strokeWidth="1.5" opacity="0.65" />
          <rect x="96" y="110" width="48" height="8" rx="3" fill="#1e3a5f" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="104" y="118" width="5" height="24" fill="#475569" />
          <rect x="131" y="118" width="5" height="24" fill="#475569" />
        </g>
      );
    }
    if (spec.bench === 'hip-thrust' || spec.bench === 'split-squat') {
      return (
        <g>
          <rect x="44" y="102" width="44" height="10" rx="4" fill="#1e3a5f" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="50" y="112" width="6" height="30" rx="2" fill="#475569" />
          <rect x="78" y="112" width="6" height="30" rx="2" fill="#475569" />
        </g>
      );
    }
    return null;
  };

  const renderEquipment = () => {
    const w1 = pose.weight ?? pose.wrist;
    const w2 = pose.weight ? pose.weight2 : pose.wrist2;

    if (exercise.requiresBarbell) {
      if (isFront && w2) {
        return (
          <g>
            <line x1={w1.x - 16} y1={w1.y} x2={w2.x + 16} y2={w2.y} stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
            <rect x={w1.x - 18} y={w1.y - 10} width="6" height="20" rx="2" fill={eqColor} stroke={eqDark} strokeWidth="1" />
            <rect x={w2.x + 12} y={w2.y - 10} width="6" height="20" rx="2" fill={eqColor} stroke={eqDark} strokeWidth="1" />
          </g>
        );
      }
      // Side view barbell plate circle
      return (
        <g>
          <circle cx={w1.x} cy={w1.y} r="11" fill={eqDark} stroke={eqColor} strokeWidth="2.5" />
          <circle cx={w1.x} cy={w1.y} r="3.5" fill="#e2e8f0" />
        </g>
      );
    }

    // Dumbbells
    const drawDumbbell = (pt: Point) => (
      <g>
        <line x1={pt.x - 9} y1={pt.y} x2={pt.x + 9} y2={pt.y} stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
        <rect x={pt.x - 11} y={pt.y - 5.5} width="5.5" height="11" rx="2" fill={eqColor} stroke={eqDark} strokeWidth="1" />
        <rect x={pt.x + 5.5} y={pt.y - 5.5} width="5.5" height="11" rx="2" fill={eqColor} stroke={eqDark} strokeWidth="1" />
      </g>
    );

    return (
      <g>
        {drawDumbbell(w1)}
        {w2 && drawDumbbell(w2)}
      </g>
    );
  };

  // Highlight active muscle zone subtly on the body
  const muscleHighlight = () => {
    const m = exercise.muscleGroup;
    if (m === 'chest') {
      return <circle cx={lerp(pose.shoulder.x, pose.hip.x, 0.25)} cy={lerp(pose.shoulder.y, pose.hip.y, 0.25)} r="8" fill="#22c55e" opacity="0.28" />;
    }
    if (m === 'back') {
      return <circle cx={lerp(pose.shoulder.x, pose.hip.x, 0.35)} cy={lerp(pose.shoulder.y, pose.hip.y, 0.35)} r="9" fill="#38bdf8" opacity="0.28" />;
    }
    if (m === 'shoulders') {
      return <circle cx={pose.shoulder.x} cy={pose.shoulder.y} r="8" fill="#f59e0b" opacity="0.3" />;
    }
    if (m === 'legs') {
      return <circle cx={lerp(pose.hip.x, pose.knee.x, 0.5)} cy={lerp(pose.hip.y, pose.knee.y, 0.5)} r="10" fill="#22c55e" opacity="0.26" />;
    }
    if (m === 'arms') {
      return <circle cx={lerp(pose.shoulder.x, pose.elbow.x, 0.55)} cy={lerp(pose.shoulder.y, pose.elbow.y, 0.55)} r="7.5" fill="#a78bfa" opacity="0.32" />;
    }
    return <circle cx={lerp(pose.shoulder.x, pose.hip.x, 0.65)} cy={lerp(pose.shoulder.y, pose.hip.y, 0.65)} r="8" fill="#f59e0b" opacity="0.28" />;
  };

  return (
    <div className={`motion-stage motion-${size}`} aria-hidden="true">
      <svg viewBox="0 0 240 156" className="motion-svg">
        <defs>
          <marker
            id={`arrow-${exercise.id}-${size}`}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="#22c55e" opacity="0.75" />
          </marker>
        </defs>

        {/* Gym floor with subtle perspective line */}
        <rect x="0" y="142" width="240" height="14" fill="#0b111d" />
        <line x1="14" y1="142" x2="226" y2="142" stroke="#334155" strokeWidth="2" />

        {/* Motion direction guide arrow */}
        {spec.arrow && (
          <line
            x1={spec.arrow.from.x}
            y1={spec.arrow.from.y}
            x2={spec.arrow.to.x}
            y2={spec.arrow.to.y}
            stroke="#22c55e"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            opacity="0.55"
            markerEnd={`url(#arrow-${exercise.id}-${size})`}
          />
        )}

        {/* Bench behind athlete */}
        {renderBench()}

        {/* Back leg (darker for realistic 3D depth) */}
        {pose.knee2 && pose.ankle2 && (
          <g strokeLinecap="round" strokeLinejoin="round">
            <line x1={pose.hip.x} y1={pose.hip.y} x2={pose.knee2.x} y2={pose.knee2.y} stroke="#475569" strokeWidth="11" />
            <line x1={pose.knee2.x} y1={pose.knee2.y} x2={pose.ankle2.x} y2={pose.ankle2.y} stroke="#64748b" strokeWidth="8.5" />
            <line x1={pose.ankle2.x - 3} y1={pose.ankle2.y + 1} x2={pose.ankle2.x + 8} y2={pose.ankle2.y + 1} stroke="#334155" strokeWidth="5" />
          </g>
        )}

        {/* Torso (Athletic shirt silhouette) */}
        {isFront ? (
          <g>
            {/* Shoulders & ribcage trapezoid */}
            <path
              d={`M ${pose.shoulder.x - 16} ${pose.shoulder.y}
                  L ${pose.shoulder.x + 16} ${pose.shoulder.y}
                  L ${pose.hip.x + 11} ${pose.hip.y}
                  L ${pose.hip.x - 11} ${pose.hip.y} Z`}
              fill="#334155"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>
        ) : (
          <line
            x1={pose.shoulder.x}
            y1={pose.shoulder.y}
            x2={pose.hip.x}
            y2={pose.hip.y}
            stroke="#334155"
            strokeWidth="16"
            strokeLinecap="round"
          />
        )}

        {/* Target muscle glow */}
        {muscleHighlight()}

        {/* Front leg (shorts + calf + sneaker) */}
        <g strokeLinecap="round" strokeLinejoin="round">
          <line x1={pose.hip.x} y1={pose.hip.y} x2={pose.knee.x} y2={pose.knee.y} stroke="#64748b" strokeWidth="11.5" />
          <line x1={pose.knee.x} y1={pose.knee.y} x2={pose.ankle.x} y2={pose.ankle.y} stroke="#cbd5e1" strokeWidth="8.5" />
          <line x1={pose.ankle.x - 3} y1={pose.ankle.y + 1} x2={pose.ankle.x + 9} y2={pose.ankle.y + 1} stroke="#0f172a" strokeWidth="5.5" />
          <line x1={pose.ankle.x - 2} y1={pose.ankle.y + 1} x2={pose.ankle.x + 8} y2={pose.ankle.y + 1} stroke="#94a3b8" strokeWidth="2" />
        </g>

        {/* Head & neck */}
        <line
          x1={pose.shoulder.x}
          y1={pose.shoulder.y}
          x2={pose.head.x}
          y2={pose.head.y}
          stroke="#cbd5e1"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx={pose.head.x} cy={pose.head.y} r="9.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" />

        {/* Second Arm (if front view) */}
        {pose.elbow2 && pose.wrist2 && (
          <g strokeLinecap="round">
            <line
              x1={pose.shoulder.x + (isFront ? 14 : 0)}
              y1={pose.shoulder.y + 2}
              x2={pose.elbow2.x}
              y2={pose.elbow2.y}
              stroke="#cbd5e1"
              strokeWidth="8"
            />
            <line
              x1={pose.elbow2.x}
              y1={pose.elbow2.y}
              x2={pose.wrist2.x}
              y2={pose.wrist2.y}
              stroke="#e2e8f0"
              strokeWidth="6.5"
            />
          </g>
        )}

        {/* Primary Arm */}
        <g strokeLinecap="round">
          <line
            x1={pose.shoulder.x - (isFront ? 14 : 0)}
            y1={pose.shoulder.y + 2}
            x2={pose.elbow.x}
            y2={pose.elbow.y}
            stroke="#cbd5e1"
            strokeWidth="8"
          />
          <line
            x1={pose.elbow.x}
            y1={pose.elbow.y}
            x2={pose.wrist.x}
            y2={pose.wrist.y}
            stroke="#e2e8f0"
            strokeWidth="6.5"
          />
        </g>

        {/* Joint accents for readability */}
        <circle cx={pose.elbow.x} cy={pose.elbow.y} r="2.5" fill="#64748b" />
        <circle cx={pose.knee.x} cy={pose.knee.y} r="2.5" fill="#475569" />

        {/* Dumbbells or Barbell */}
        {renderEquipment()}
      </svg>
    </div>
  );
}
