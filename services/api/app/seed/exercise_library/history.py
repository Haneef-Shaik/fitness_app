"""The exercises that existed before the library grew — **history**.

Users' sessions, plans and PRs point at the rows these created. Never edit
the name, equipment, muscles or tracked fields of an entry here: the seed
would not change anybody's row, it would add a second exercise beside it.
Instructions and new aliases are the only things the seed fills in.
"""
from __future__ import annotations

from app.models import Equipment
from app.seed.exercise_library.model import ExerciseSeed

EXERCISES: tuple[ExerciseSeed, ...] = (
    ExerciseSeed(
        'Barbell Bench Press', Equipment.barbell, 'horizontal push',
        primary=('chest',), secondary=('triceps', 'front-delts'),
        aliases=('bench', 'flat bench', 'bb bench'), tracks='load reps',
        instructions=(
            "Lie on the bench with your eyes under the bar, feet planted and shoulder blades "
            "pinched together. Unrack, lower the bar to your mid-chest with elbows tucked "
            "slightly, then press it back up over your shoulders. Keep your upper back tight and "
            "drive your feet into the floor so the bar path stays controlled."
        ),
    ),
    ExerciseSeed(
        'Incline Barbell Bench Press', Equipment.barbell, 'incline push',
        primary=('upper-chest',), secondary=('front-delts', 'triceps'),
        aliases=('incline bench',), tracks='load reps',
        instructions=(
            "Set the bench to about 30 to 45 degrees and lie back with your shoulder blades "
            "retracted and feet flat. Lower the bar to your upper chest just below the "
            "collarbones, then press it back up over your shoulders. Keep your chest up and do not "
            "let your shoulders roll forward at the top."
        ),
    ),
    ExerciseSeed(
        'Dumbbell Bench Press', Equipment.dumbbell, 'horizontal push',
        primary=('chest',), secondary=('triceps', 'front-delts'),
        aliases=('db bench',), tracks='load reps',
        instructions=(
            "Sit on a flat bench with the dumbbells on your thighs, lie back and bring them to "
            "chest level with palms facing forward. Press them up until your arms are straight "
            "over your chest, then lower under control until you feel a stretch across your chest. "
            "Keep your shoulder blades pinned back and your wrists stacked over your elbows."
        ),
    ),
    ExerciseSeed(
        'Incline Dumbbell Press', Equipment.dumbbell, 'incline push',
        primary=('upper-chest',), secondary=('front-delts', 'triceps'),
        aliases=('incline db press',), tracks='load reps',
        instructions=(
            "Set the bench to about 30 to 45 degrees and kick the dumbbells up to your shoulders "
            "as you lie back. Press them up and slightly together over your upper chest, then "
            "lower until you feel a stretch across the chest. Keep your elbows slightly tucked "
            "rather than flared straight out to the sides."
        ),
    ),
    ExerciseSeed(
        'Cable Fly', Equipment.cable, 'horizontal adduction',
        primary=('chest',), secondary=(),
        aliases=('fly', 'cable flye'), tracks='load reps',
        instructions=(
            "Set both pulleys at about shoulder height, grab a handle in each hand and step "
            "forward into a split stance. With a slight, fixed bend in your elbows, bring your "
            "hands together in a wide arc in front of your chest, then let them return until you "
            "feel a stretch. Move only at the shoulders; bending the elbows more turns it into a "
            "press."
        ),
    ),
    ExerciseSeed(
        'Push-up', Equipment.bodyweight, 'horizontal push',
        primary=('chest',), secondary=('triceps', 'front-delts'),
        aliases=('pushup', 'press-up'), tracks='reps',
        instructions=(
            "Place your hands slightly wider than your shoulders and set your body in a straight "
            "line from head to heels. Lower your chest to just above the floor with your elbows "
            "angled back about 45 degrees, then push the floor away. Brace your abs and glutes so "
            "your hips neither sag nor pike."
        ),
    ),
    ExerciseSeed(
        'Deadlift', Equipment.barbell, 'hinge',
        primary=('lower-back', 'glutes', 'hamstrings'), secondary=('lats', 'forearms'),
        aliases=('conventional deadlift',), tracks='load reps',
        instructions=(
            "Stand with feet hip-width apart and the bar over mid-foot. Hinge down, grip just "
            "outside your knees and pull the slack out of the bar. Drive the floor away and stand "
            "tall, keeping the bar touching your legs all the way up. Keep your back flat; if it "
            "rounds, the weight is too heavy."
        ),
    ),
    ExerciseSeed(
        'Barbell Row', Equipment.barbell, 'horizontal pull',
        primary=('mid-back', 'lats'), secondary=('biceps', 'rear-delts'),
        aliases=('bent over row', 'bb row'), tracks='load reps',
        instructions=(
            "Hold the bar with an overhand grip just outside your knees and hinge forward until "
            "your torso is at about 45 degrees or lower, back flat. Pull the bar to your lower "
            "ribs by driving your elbows back, then lower it until your arms are straight. Hold "
            "your torso angle steady instead of standing up to heave the weight."
        ),
    ),
    ExerciseSeed(
        'Pull-up', Equipment.bodyweight, 'vertical pull',
        primary=('lats',), secondary=('biceps', 'mid-back'),
        aliases=('pullup', 'chin-up'), tracks='reps',
        instructions=(
            "Hang from the bar with an overhand grip slightly wider than your shoulders and your "
            "body still. Pull your chest toward the bar by driving your elbows down until your "
            "chin clears it, then lower all the way to straight arms. Start each rep by pulling "
            "your shoulders down away from your ears, and do not kip or swing."
        ),
    ),
    ExerciseSeed(
        'Lat Pulldown', Equipment.cable, 'vertical pull',
        primary=('lats',), secondary=('biceps', 'mid-back'),
        aliases=('pulldown',), tracks='load reps',
        instructions=(
            "Sit with your thighs locked under the pads and take an overhand grip slightly wider "
            "than your shoulders. Pull the bar to your upper chest by driving your elbows down and "
            "back, then let it rise until your arms are straight. Lean back only slightly and do "
            "not swing your torso to move the weight."
        ),
    ),
    ExerciseSeed(
        'Seated Cable Row', Equipment.cable, 'horizontal pull',
        primary=('mid-back',), secondary=('lats', 'biceps'),
        aliases=('cable row',), tracks='load reps',
        instructions=(
            "Sit with your feet on the platform, knees slightly bent and chest tall, holding the "
            "handle at arm's length. Row the handle to your lower ribs while squeezing your "
            "shoulder blades together, then let your arms extend and your shoulders reach forward. "
            "Keep your torso mostly still rather than rocking back to finish each rep."
        ),
    ),
    ExerciseSeed(
        'Overhead Press', Equipment.barbell, 'vertical push',
        primary=('front-delts',), secondary=('triceps', 'side-delts'),
        aliases=('ohp', 'military press', 'shoulder press'), tracks='load reps',
        instructions=(
            "Stand with the bar resting on your front shoulders, hands just outside shoulder width "
            "and glutes squeezed. Press the bar straight up, moving your head back to clear it, "
            "then bring your head through once it passes your forehead so the bar finishes over "
            "mid-foot. Brace your abs so you press with your shoulders instead of leaning back."
        ),
    ),
    ExerciseSeed(
        'Dumbbell Lateral Raise', Equipment.dumbbell, 'abduction',
        primary=('side-delts',), secondary=(),
        aliases=('lateral raise', 'side raise'), tracks='load reps',
        instructions=(
            "Stand holding dumbbells at your sides with a slight bend in your elbows. Raise your "
            "arms out to the sides until they reach shoulder height, leading with your elbows, "
            "then lower slowly. Keep your shoulders down away from your ears and do not swing the "
            "weights up with your hips."
        ),
    ),
    ExerciseSeed(
        'Face Pull', Equipment.cable, 'horizontal pull',
        primary=('rear-delts',), secondary=('mid-back',),
        aliases=(), tracks='load reps',
        instructions=(
            "Set a rope on a cable at upper-chest to face height and hold the ends with your "
            "thumbs pointing back. Pull the rope toward your face, splitting the ends apart and "
            "rotating your hands back so they finish beside your ears. Keep your elbows high and "
            "pause briefly at the end instead of yanking the weight with your lower back."
        ),
    ),
    ExerciseSeed(
        'Barbell Curl', Equipment.barbell, 'elbow flexion',
        primary=('biceps',), secondary=('forearms',),
        aliases=('bicep curl',), tracks='load reps',
        instructions=(
            "Stand holding the bar with an underhand, shoulder-width grip, arms straight and "
            "elbows at your sides. Curl the bar up toward your shoulders, then lower it under "
            "control to full extension. Keep your elbows pinned and your torso still so your back "
            "does not swing the weight."
        ),
    ),
    ExerciseSeed(
        'Dumbbell Hammer Curl', Equipment.dumbbell, 'elbow flexion',
        primary=('biceps', 'forearms'), secondary=(),
        aliases=('hammer curl',), tracks='load reps',
        instructions=(
            "Stand holding dumbbells at your sides with your palms facing each other. Curl the "
            "weights up while keeping the neutral grip, then lower them slowly to full extension. "
            "Keep your upper arms still at your sides rather than letting your elbows drift "
            "forward."
        ),
    ),
    ExerciseSeed(
        'Triceps Pushdown', Equipment.cable, 'elbow extension',
        primary=('triceps',), secondary=(),
        aliases=('pushdown', 'tricep pushdown'), tracks='load reps',
        instructions=(
            "Stand facing a high cable with a bar or rope, elbows tucked at your sides and "
            "forearms about parallel to the floor. Push the handle down until your arms are fully "
            "straight, then let it rise back under control. Keep your elbows fixed in place so the "
            "movement comes only from the elbow joint."
        ),
    ),
    ExerciseSeed(
        'Overhead Triceps Extension', Equipment.dumbbell, 'elbow extension',
        primary=('triceps',), secondary=(),
        aliases=('overhead extension',), tracks='load reps',
        instructions=(
            "Sit or stand holding one dumbbell with both hands overhead, arms straight. Bend your "
            "elbows to lower the weight behind your head until you feel a deep stretch, then "
            "extend back to the top. Keep your elbows pointing forward and close to your head "
            "instead of letting them flare out."
        ),
    ),
    ExerciseSeed(
        'Close-Grip Bench Press', Equipment.barbell, 'horizontal push',
        primary=('triceps',), secondary=('chest', 'front-delts'),
        aliases=('cgbp',), tracks='load reps',
        instructions=(
            "Lie on a flat bench and grip the bar about shoulder-width apart with your shoulder "
            "blades pinched. Lower the bar to your lower chest with your elbows tucked close to "
            "your body, then press it back up. Do not grip so narrow that your wrists bend; hands "
            "just inside shoulder width is enough."
        ),
    ),
    ExerciseSeed(
        'Barbell Squat', Equipment.barbell, 'squat',
        primary=('quads', 'glutes'), secondary=('hamstrings', 'lower-back'),
        aliases=('squat', 'back squat'), tracks='load reps',
        instructions=(
            "Set the bar across your upper back, brace your core and stand with feet about "
            "shoulder-width apart, toes slightly out. Bend your hips and knees together to sit "
            "down until your thighs are at least parallel, then drive back up. Keep your knees "
            "tracking over your toes and your chest up so the bar stays over mid-foot."
        ),
    ),
    ExerciseSeed(
        'Front Squat', Equipment.barbell, 'squat',
        primary=('quads',), secondary=('glutes', 'core'),
        aliases=(), tracks='load reps',
        instructions=(
            "Rest the bar on the front of your shoulders with your elbows high, using a clean grip "
            "or crossed arms. Squat down with an upright torso until your thighs are below "
            "parallel, then drive back up. Keep your elbows up throughout; if they drop, the bar "
            "rolls forward and your upper back rounds."
        ),
    ),
    ExerciseSeed(
        'Romanian Deadlift', Equipment.barbell, 'hinge',
        primary=('hamstrings', 'glutes'), secondary=('lower-back',),
        aliases=('rdl',), tracks='load reps',
        instructions=(
            "Stand tall holding the bar at hip height with a shoulder-width grip and soft knees. "
            "Push your hips back and slide the bar down your thighs until you feel a strong "
            "hamstring stretch, then drive your hips forward to stand. Keep your back flat and the "
            "bar close; your knees stay slightly bent but you do not squat down."
        ),
    ),
    ExerciseSeed(
        'Leg Press', Equipment.machine, 'squat',
        primary=('quads', 'glutes'), secondary=('hamstrings',),
        aliases=(), tracks='load reps',
        instructions=(
            "Sit in the machine with your back flat against the pad and your feet shoulder-width "
            "apart on the platform. Lower the sled by bending your knees toward your chest as far "
            "as you can without your lower back peeling off the pad, then press back up. Do not "
            "snap your knees into a hard lockout at the top."
        ),
    ),
    ExerciseSeed(
        'Bulgarian Split Squat', Equipment.dumbbell, 'lunge',
        primary=('quads', 'glutes'), secondary=('hamstrings',),
        aliases=('split squat', 'rear foot elevated split squat'), tracks='load reps',
        instructions=(
            "Stand about two feet in front of a bench and rest the top of your rear foot on it, "
            "holding dumbbells at your sides. Lower straight down until your rear knee nearly "
            "touches the floor, then push through your front foot to stand. Keep most of your "
            "weight on the front leg and your front knee tracking over your toes."
        ),
    ),
    ExerciseSeed(
        'Leg Curl', Equipment.machine, 'knee flexion',
        primary=('hamstrings',), secondary=(),
        aliases=('hamstring curl',), tracks='load reps',
        instructions=(
            "Adjust the machine so your knees line up with its pivot and the pad sits just above "
            "your heels. Curl the pad toward your glutes as far as you can, then lower it slowly "
            "to full extension. Keep your hips pressed into the pad or seat instead of lifting "
            "them to finish the rep."
        ),
    ),
    ExerciseSeed(
        'Standing Calf Raise', Equipment.machine, 'plantar flexion',
        primary=('calves',), secondary=(),
        aliases=('calf raise',), tracks='load reps',
        instructions=(
            "Stand in the machine with the pads on your shoulders and the balls of your feet on "
            "the edge of the platform. Lower your heels as far as you comfortably can, then rise "
            "onto your toes as high as possible. Pause in the bottom stretch rather than bouncing "
            "out of it."
        ),
    ),
    ExerciseSeed(
        'Plank', Equipment.bodyweight, 'anti-extension',
        primary=('abs',), secondary=('obliques',),
        aliases=(), tracks='duration',
        instructions=(
            "Rest on your forearms with your elbows under your shoulders and your legs straight "
            "behind you. Hold your body in a straight line from head to heels. Squeeze your glutes "
            "and brace your abs so your hips neither sag nor pike up."
        ),
    ),
    ExerciseSeed(
        'Hanging Leg Raise', Equipment.bodyweight, 'hip flexion',
        primary=('abs',), secondary=('obliques',),
        aliases=('leg raise',), tracks='reps',
        instructions=(
            "Hang from a pull-up bar with a shoulder-width grip and your legs straight. Raise your "
            "legs in front of you until they are at least parallel to the floor, curling your "
            "pelvis up at the top, then lower slowly. Control the descent so your body does not "
            "swing between reps."
        ),
    ),
    ExerciseSeed(
        'Cable Woodchop', Equipment.cable, 'rotation',
        primary=('obliques',), secondary=('abs',),
        aliases=('woodchop',), tracks='load reps',
        instructions=(
            "Set a cable at shoulder height or higher and stand side-on to it, holding the handle "
            "with both hands. Pull the handle down and across your body toward the opposite hip, "
            "rotating through your torso and pivoting your back foot. Keep your arms fairly "
            "straight so the rotation comes from your trunk, not your arms."
        ),
    ),
    ExerciseSeed(
        'Power Clean', Equipment.barbell, 'olympic pull',
        primary=('hamstrings', 'glutes', 'quads'), secondary=('mid-back', 'front-delts'),
        aliases=('clean', 'hang clean'), tracks='load reps',
        instructions=(
            "Start with the bar over mid-foot, gripping just outside your legs with a flat back. "
            "Pull the bar past your knees, then extend your hips, knees and ankles explosively, "
            "shrug and pull yourself under to catch it on your front shoulders in a partial squat. "
            "Keep the bar close to your body; letting it swing forward is the most common error."
        ),
    ),
    ExerciseSeed(
        'Push Press', Equipment.barbell, 'vertical push',
        primary=('front-delts',), secondary=('triceps', 'quads'),
        aliases=(), tracks='load reps',
        instructions=(
            "Rest the bar on your front shoulders with your hands just outside shoulder width. Dip "
            "a few inches by bending your knees with your torso upright, then drive up hard with "
            "your legs and press the bar overhead to lockout. Keep the dip straight down; letting "
            "your chest fall forward pushes the bar off line."
        ),
    ),
    ExerciseSeed(
        'Barbell Shrug', Equipment.barbell, 'scapular elevation',
        primary=('mid-back',), secondary=('forearms',),
        aliases=('shrug',), tracks='load reps',
        instructions=(
            "Stand holding the bar at arm's length in front of your thighs with a shoulder-width "
            "grip. Lift your shoulders straight up toward your ears, pause, then lower slowly. Do "
            "not roll your shoulders or bend your elbows; move straight up and down."
        ),
    ),
    ExerciseSeed(
        'Skull Crusher', Equipment.barbell, 'elbow extension',
        primary=('triceps',), secondary=(),
        aliases=('lying triceps extension',), tracks='load reps',
        instructions=(
            "Lie on a flat bench holding an EZ-bar or barbell over your chest with a narrow grip. "
            "Bend only at the elbows to lower the bar toward your forehead or just behind your "
            "head, then extend your arms back up. Keep your upper arms still and angled slightly "
            "back so the triceps stay under tension."
        ),
    ),
    ExerciseSeed(
        'Preacher Curl', Equipment.barbell, 'elbow flexion',
        primary=('biceps',), secondary=(),
        aliases=('ez bar preacher curl',), tracks='load reps',
        instructions=(
            "Sit at the preacher bench with the backs of your upper arms flat on the pad, holding "
            "an EZ-bar with an underhand grip. Curl the bar up until your forearms are near "
            "vertical, then lower slowly until your arms are almost straight. Control the bottom "
            "of the rep instead of dropping into a hard lockout."
        ),
    ),
    ExerciseSeed(
        'Hip Thrust', Equipment.barbell, 'hinge',
        primary=('glutes',), secondary=('hamstrings',),
        aliases=('barbell hip thrust',), tracks='load reps',
        instructions=(
            "Sit with your upper back against a bench, a padded bar over your hips and your feet "
            "flat about hip-width apart. Drive through your heels to lift your hips until your "
            "torso is parallel to the floor, squeeze your glutes, then lower. Tuck your chin and "
            "keep your ribs down so you finish with your glutes, not by arching your lower back."
        ),
    ),
    ExerciseSeed(
        'Goblet Squat', Equipment.dumbbell, 'squat',
        primary=('quads', 'glutes'), secondary=('core',),
        aliases=(), tracks='load reps',
        instructions=(
            "Hold a dumbbell vertically against your chest with both hands, feet about "
            "shoulder-width apart. Squat down between your knees with your chest up until your "
            "elbows reach the inside of your knees, then stand back up. Keep your heels down and "
            "the weight close to your chest."
        ),
    ),
    ExerciseSeed(
        'Dumbbell Row', Equipment.dumbbell, 'horizontal pull',
        primary=('lats', 'mid-back'), secondary=('biceps', 'rear-delts'),
        aliases=('one-arm row', 'db row'), tracks='load reps',
        instructions=(
            "Place one hand and knee on a bench with your back flat, holding a dumbbell in the "
            "other hand at arm's length. Pull the dumbbell toward your hip by driving your elbow "
            "back, then lower it until your arm is straight. Keep your shoulders square to the "
            "floor instead of twisting your torso to lift the weight."
        ),
    ),
    ExerciseSeed(
        'Dumbbell Shoulder Press', Equipment.dumbbell, 'vertical push',
        primary=('front-delts',), secondary=('triceps', 'side-delts'),
        aliases=('db shoulder press', 'seated db press'), tracks='load reps',
        instructions=(
            "Sit on an upright bench holding the dumbbells at shoulder height with your palms "
            "facing forward. Press them overhead until your arms are straight, then lower back to "
            "shoulder level. Keep your ribs down and your back against the pad instead of arching "
            "to push the weight up."
        ),
    ),
    ExerciseSeed(
        'Arnold Press', Equipment.dumbbell, 'vertical push',
        primary=('front-delts', 'side-delts'), secondary=('triceps',),
        aliases=(), tracks='load reps',
        instructions=(
            "Sit holding the dumbbells in front of your shoulders with your palms facing you. "
            "Press up while rotating your palms outward so they face forward at the top, then "
            "reverse the rotation on the way down. Keep the movement smooth and do not arch your "
            "lower back as you press."
        ),
    ),
    ExerciseSeed(
        'Dumbbell Romanian Deadlift', Equipment.dumbbell, 'hinge',
        primary=('hamstrings', 'glutes'), secondary=('lower-back',),
        aliases=('db rdl',), tracks='load reps',
        instructions=(
            "Stand holding dumbbells in front of your thighs with soft knees. Push your hips back "
            "and lower the weights along your legs until you feel a hamstring stretch, then drive "
            "your hips forward to stand. Keep your back flat and the dumbbells close to your legs "
            "throughout."
        ),
    ),
    ExerciseSeed(
        'Dumbbell Walking Lunge', Equipment.dumbbell, 'lunge',
        primary=('quads', 'glutes'), secondary=('hamstrings',),
        aliases=('lunge', 'walking lunge'), tracks='load reps',
        instructions=(
            "Stand tall holding dumbbells at your sides. Step forward and lower until both knees "
            "are bent about 90 degrees, then push through the front foot and step straight into "
            "the next lunge. Keep your torso upright and take steps long enough that your front "
            "heel stays down."
        ),
    ),
    ExerciseSeed(
        'Dumbbell Curl', Equipment.dumbbell, 'elbow flexion',
        primary=('biceps',), secondary=('forearms',),
        aliases=('db curl',), tracks='load reps',
        instructions=(
            "Stand holding dumbbells at your sides with your palms facing forward. Curl both "
            "weights up toward your shoulders, then lower them under control to full extension. "
            "Keep your elbows at your sides and do not swing your body to start the rep."
        ),
    ),
    ExerciseSeed(
        'Dumbbell Fly', Equipment.dumbbell, 'horizontal adduction',
        primary=('chest',), secondary=(),
        aliases=('db fly', 'db flye'), tracks='load reps',
        instructions=(
            "Lie on a flat bench holding dumbbells above your chest, palms facing each other and "
            "elbows slightly bent. Open your arms in a wide arc until you feel a stretch across "
            "your chest, then bring them back together over your chest. Keep the elbow bend fixed "
            "so it stays a fly and not a press."
        ),
    ),
    ExerciseSeed(
        'Reverse Dumbbell Fly', Equipment.dumbbell, 'horizontal abduction',
        primary=('rear-delts',), secondary=('mid-back',),
        aliases=('rear delt fly',), tracks='load reps',
        instructions=(
            "Hinge forward until your torso is close to parallel with the floor, holding light "
            "dumbbells under your chest with a slight elbow bend. Raise your arms out to the sides "
            "until they are in line with your shoulders, then lower slowly. Lead with the backs of "
            "your hands and do not shrug your shoulders up."
        ),
    ),
    ExerciseSeed(
        'Leg Extension', Equipment.machine, 'knee extension',
        primary=('quads',), secondary=(),
        aliases=(), tracks='load reps',
        instructions=(
            "Sit in the machine with your knees lined up with its pivot and the pad resting on "
            "your lower shins. Extend your legs until they are straight, pause briefly, then lower "
            "under control. Hold the handles and keep your hips down on the seat instead of "
            "swinging the weight up."
        ),
    ),
    ExerciseSeed(
        'Seated Calf Raise', Equipment.machine, 'plantar flexion',
        primary=('calves',), secondary=(),
        aliases=(), tracks='load reps',
        instructions=(
            "Sit with the balls of your feet on the platform and the pad resting on your lower "
            "thighs just above the knees. Lower your heels for a full stretch, then press up onto "
            "your toes as high as you can. Pause at the top and bottom instead of bouncing."
        ),
    ),
    ExerciseSeed(
        'Cable Crunch', Equipment.cable, 'spinal flexion',
        primary=('abs',), secondary=(),
        aliases=(), tracks='load reps',
        instructions=(
            "Kneel facing a high cable, holding a rope beside your head. Crunch down by curling "
            "your ribs toward your hips and rounding your spine, then return slowly. Keep your "
            "hips still; the movement should come from your abs, not from sitting back onto your "
            "heels."
        ),
    ),
    ExerciseSeed(
        'Ab Wheel Rollout', Equipment.other, 'anti-extension',
        primary=('abs',), secondary=('obliques',),
        aliases=('ab wheel',), tracks='load reps',
        instructions=(
            "Kneel holding the ab wheel on the floor below your shoulders. Roll it forward slowly, "
            "extending your body as far as you can while keeping your back flat, then pull it back "
            "to the start with your abs. Keep your ribs tucked and stop before your lower back "
            "sags."
        ),
    ),
    ExerciseSeed(
        'Chin-up', Equipment.bodyweight, 'vertical pull',
        primary=('lats', 'biceps'), secondary=('mid-back',),
        aliases=('chinup',), tracks='reps',
        instructions=(
            "Hang from the bar with an underhand grip about shoulder-width apart. Pull yourself up "
            "until your chin clears the bar, driving your elbows down toward your ribs, then lower "
            "to straight arms. Keep your body still and do not kick your legs to finish the rep."
        ),
    ),
    ExerciseSeed(
        'Dip', Equipment.bodyweight, 'vertical push',
        primary=('triceps', 'chest'), secondary=('front-delts',),
        aliases=('dips', 'parallel bar dip'), tracks='reps',
        instructions=(
            "Support yourself on parallel bars with straight arms and your shoulders pulled down. "
            "Lower your body by bending your elbows until your upper arms are about parallel to "
            "the floor, then press back up to lockout. Keep your shoulders away from your ears; "
            "leaning slightly forward shifts more of the work to your chest."
        ),
    ),
    ExerciseSeed(
        'Inverted Row', Equipment.bodyweight, 'horizontal pull',
        primary=('mid-back', 'lats'), secondary=('biceps', 'rear-delts'),
        aliases=('australian pull-up', 'body row'), tracks='reps',
        instructions=(
            "Lie under a bar set around waist height, grab it slightly wider than shoulder width "
            "and hang with your body straight and heels on the floor. Pull your chest to the bar "
            "by squeezing your shoulder blades together, then lower until your arms are straight. "
            "Keep your hips up in line with your body throughout."
        ),
    ),
    ExerciseSeed(
        'Pike Push-up', Equipment.bodyweight, 'vertical push',
        primary=('front-delts',), secondary=('triceps',),
        aliases=(), tracks='reps',
        instructions=(
            "Start in a push-up position, then walk your feet in and lift your hips so your body "
            "forms an upside-down V. Bend your elbows to lower the top of your head toward the "
            "floor just in front of your hands, then press back up. Keep your hips high so the "
            "press stays vertical and works your shoulders."
        ),
    ),
    ExerciseSeed(
        'Bodyweight Squat', Equipment.bodyweight, 'squat',
        primary=('quads', 'glutes'), secondary=('hamstrings',),
        aliases=('air squat',), tracks='reps',
        instructions=(
            "Stand with feet about shoulder-width apart, toes slightly out and arms in front for "
            "balance. Bend your hips and knees together to sit down until your thighs are at least "
            "parallel, then stand back up. Keep your heels on the floor and your knees tracking "
            "over your toes."
        ),
    ),
    ExerciseSeed(
        'Pistol Squat', Equipment.bodyweight, 'squat',
        primary=('quads', 'glutes'), secondary=('core',),
        aliases=('single-leg squat',), tracks='reps',
        instructions=(
            "Stand on one leg with the other leg held straight out in front of you. Lower yourself "
            "slowly on the standing leg as deep as you can with the heel down, then drive back up. "
            "Reach your arms forward for balance and keep your standing knee in line with your "
            "toes."
        ),
    ),
    ExerciseSeed(
        'Glute Bridge', Equipment.bodyweight, 'hinge',
        primary=('glutes',), secondary=('hamstrings',),
        aliases=(), tracks='reps',
        instructions=(
            "Lie on your back with your knees bent and feet flat on the floor about hip-width "
            "apart. Drive through your heels to lift your hips until your body forms a straight "
            "line from knees to shoulders, squeeze your glutes, then lower. Keep your ribs down so "
            "you do not arch your lower back at the top."
        ),
    ),
    ExerciseSeed(
        'Back Extension', Equipment.bodyweight, 'hinge',
        primary=('lower-back',), secondary=('glutes', 'hamstrings'),
        aliases=('hyperextension',), tracks='reps',
        instructions=(
            "Set yourself in the hyperextension bench with the pad just below your hip crease and "
            "your ankles secured. Lower your torso by bending at the hips, then raise it until "
            "your body forms a straight line. Stop at a straight line rather than swinging up into "
            "an exaggerated arch."
        ),
    ),
    ExerciseSeed(
        'Lying Leg Raise', Equipment.bodyweight, 'hip flexion',
        primary=('abs',), secondary=(),
        aliases=(), tracks='reps',
        instructions=(
            "Lie flat on your back with your legs straight and your hands under your hips or at "
            "your sides. Raise your legs until they are vertical, then lower them slowly until "
            "they hover just above the floor. Keep your lower back pressed into the floor; if it "
            "lifts, bend your knees slightly."
        ),
    ),
    ExerciseSeed(
        'Side Plank', Equipment.bodyweight, 'anti-lateral flexion',
        primary=('obliques',), secondary=('abs',),
        aliases=(), tracks='duration',
        instructions=(
            "Lie on your side and prop yourself up on one forearm with the elbow under your "
            "shoulder and your feet stacked. Lift your hips so your body forms a straight line "
            "from head to feet and hold. Do not let your hips drop or rotate forward."
        ),
    ),
    ExerciseSeed(
        'Hollow Body Hold', Equipment.bodyweight, 'anti-extension',
        primary=('abs',), secondary=(),
        aliases=('hollow hold',), tracks='duration',
        instructions=(
            "Lie on your back with your arms extended overhead and legs straight. Press your lower "
            "back into the floor and lift your shoulders and legs a few inches off the ground, "
            "then hold. If your lower back lifts, bend your knees or bring your arms forward to "
            "make it easier."
        ),
    ),
)
