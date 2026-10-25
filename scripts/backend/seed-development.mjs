import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

// Authored development catalog. Human review and launch-scale content remain release gates.
const definitions = [
  ['Barbell bench press', 'Barbell', 'Chest', 'resistance', 'total', 'Lie on a bench with feet planted and grip the bar evenly. Lower the bar under control, then press it upward without bouncing.'],
  ['Barbell back squat', 'Barbell', 'Quadriceps', 'resistance', 'total', 'Stand with the bar supported across the upper back and feet comfortably apart. Bend knees and hips together, then stand while keeping the load controlled.'],
  ['Barbell deadlift', 'Barbell', 'Posterior chain', 'resistance', 'total', 'Place the bar over the middle of your feet and take an even grip. Brace the torso, stand with the bar close to the legs, then lower it under control.'],
  ['Overhead press', 'Barbell', 'Shoulders', 'resistance', 'total', 'Begin with the bar supported near shoulder height. Press overhead with a controlled torso, then return to the starting position.'],
  ['Bent-over row', 'Barbell', 'Back', 'resistance', 'total', 'Hinge at the hips while maintaining a stable torso. Pull the bar toward the lower ribs and lower it under control.'],
  ['Lat pulldown', 'Cable machine', 'Back', 'resistance', 'total', 'Sit with the thigh pad adjusted and take a comfortable grip. Pull the handle toward the upper chest, then allow a controlled return.'],
  ['Seated cable row', 'Cable machine', 'Back', 'resistance', 'total', 'Sit with feet braced and torso stable. Draw the handle toward the torso, then extend the arms under control.'],
  ['Leg press', 'Leg press machine', 'Quadriceps', 'resistance', 'total', 'Adjust the seat and place both feet on the platform. Bend the knees through a controlled range, then press the platform away without locking the knees forcefully.'],
  ['Dumbbell bench press', 'Dumbbells', 'Chest', 'resistance', 'per_hand', 'Lie on a bench with a dumbbell in each hand. Lower both weights with control and press them upward together.'],
  ['Dumbbell shoulder press', 'Dumbbells', 'Shoulders', 'resistance', 'per_hand', 'Hold the dumbbells near shoulder height with a stable torso. Press them overhead, then return them under control.'],
  ['Dumbbell curl', 'Dumbbells', 'Biceps', 'resistance', 'per_hand', 'Stand or sit with a dumbbell in each hand and upper arms steady. Bend the elbows to raise the weights, then lower them slowly.'],
  ['Cable triceps pressdown', 'Cable machine', 'Triceps', 'resistance', 'total', 'Stand at a high cable with elbows near the torso. Extend the elbows to move the handle downward and return under control.'],
  ['Push-up', 'Bodyweight', 'Chest', 'bodyweight', 'none', 'Support your body on hands and toes with a stable torso. Lower the chest toward the floor and press back up through a comfortable range.'],
  ['Bodyweight squat', 'Bodyweight', 'Quadriceps', 'bodyweight', 'none', 'Stand with feet comfortably apart. Bend at the knees and hips, then stand with a controlled movement.'],
  ['Reverse lunge', 'Bodyweight', 'Quadriceps', 'bodyweight', 'none', 'Step one foot backward and bend both knees through a comfortable range. Return to standing and repeat on the other side.'],
  ['Glute bridge', 'Bodyweight', 'Glutes', 'bodyweight', 'none', 'Lie on your back with knees bent and feet planted. Raise the hips while keeping the torso controlled, then lower to the floor.'],
  ['Plank', 'Bodyweight', 'Core', 'timed', 'none', 'Support yourself on forearms and toes with a stable torso. Hold a controlled position while breathing normally.'],
  ['Walking', 'None', 'Legs', 'distance', 'none', 'Choose a clear, suitable route or treadmill. Walk at a comfortable pace and record the elapsed time and distance.'],
  ['Running', 'None', 'Legs', 'distance', 'none', 'Choose a suitable route or treadmill and begin at a manageable pace. Record the elapsed time and distance after your run.'],
  ['Cycling', 'Bicycle', 'Legs', 'distance', 'none', 'Adjust the bicycle to a comfortable position. Ride at a manageable pace and record elapsed time and distance.'],
];
const quote = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const source = 'FitLog-authored-development-v1; human review required before launch';
const sql = definitions.map(([name, equipment, muscle, type, basis, instructions], i) => {
  const id = `20000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`;
  return `insert into public.exercises(id,version,owner_id,name,logging_type,load_basis,multiplier,equipment,primary_muscles,instructions,source) values(${quote(id)},1,null,${quote(name)},${quote(type)},${quote(basis)},${basis === 'per_hand' ? 2 : 1},${quote(equipment)},array[${quote(muscle)}],${quote(instructions)},${quote(source)}) on conflict(id,version) do nothing;`;
}).join('\n');
writeFileSync('supabase/development-catalogue.sql', '-- Development content only; not evidence of human-reviewed launch content.\n' + sql + '\n');
execFileSync('docker', ['exec', '-i','supabase_db_fitlog_rebuild_20261017', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: sql, stdio: ['pipe', 'ignore', 'inherit'] });
console.log(`Seeded ${definitions.length} authored development exercises. Production content review is still required.`);
