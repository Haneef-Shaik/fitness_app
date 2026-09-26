"""Dumbbell movements.
"""
from __future__ import annotations

from app.models import Equipment
from app.seed.exercise_library.model import ExerciseSeed

EXERCISES: tuple[ExerciseSeed, ...] = (
    ExerciseSeed(
        "Incline Dumbbell Fly", Equipment.dumbbell, "horizontal adduction",
        primary=("upper-chest",), secondary=(),
        aliases=("incline db fly",), tracks="load reps",
        instructions=(
            "Lie on a bench set to about 30 degrees holding dumbbells over your chest, palms "
            "facing each other and elbows slightly bent. Open your arms in a wide arc until you "
            "feel a stretch across your upper chest, then bring them back together. Keep the elbow "
            "angle fixed and stop the stretch before your shoulders roll forward."
        ),
    ),
    ExerciseSeed(
        "Decline Dumbbell Fly", Equipment.dumbbell, "horizontal adduction",
        primary=("chest",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Secure your legs on a decline bench and lie back holding dumbbells over your chest, "
            "palms facing each other and elbows slightly bent. Lower your arms out to the sides in "
            "a wide arc until you feel a chest stretch, then bring them back together. Keep the "
            "slight elbow bend constant so the movement stays a fly."
        ),
    ),
    ExerciseSeed(
        "Decline Dumbbell Press", Equipment.dumbbell, "decline push",
        primary=("chest",), secondary=("triceps",),
        aliases=("decline db press",), tracks="load reps",
        instructions=(
            "Secure your legs on a decline bench, lie back and hold the dumbbells beside your "
            "lower chest. Press them up until your arms are straight over your chest, then lower "
            "under control. Keep your shoulder blades pinched and your elbows slightly tucked "
            "throughout."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Floor Press", Equipment.dumbbell, "horizontal push",
        primary=("chest", "triceps"), secondary=("front-delts",),
        aliases=("db floor press",), tracks="load reps",
        instructions=(
            "Lie on the floor with your knees bent, holding dumbbells above your chest with your "
            "upper arms on the floor. Press the weights up until your arms are straight, then "
            "lower until your upper arms lightly touch the floor. Pause briefly at the bottom "
            "instead of bouncing your elbows off the ground."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Pullover", Equipment.dumbbell, "shoulder extension",
        primary=("chest", "lats"), secondary=(),
        aliases=("pullover",), tracks="load reps",
        instructions=(
            "Lie across or along a bench holding one dumbbell with both hands over your chest, "
            "elbows slightly bent. Lower the weight in an arc behind your head until you feel a "
            "stretch through your chest and lats, then pull it back over your chest. Keep the "
            "elbow bend fixed and your ribs down so the stretch comes from your shoulders, not an "
            "arched back."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Squeeze Press", Equipment.dumbbell, "horizontal push",
        primary=("chest",), secondary=("triceps",),
        aliases=("squeeze press", "crush press"), tracks="load reps",
        instructions=(
            "Lie on a flat bench holding two dumbbells pressed together over your chest, palms "
            "facing each other. Squeeze them hard against each other as you lower them to your "
            "chest and press them back up. Keep the dumbbells touching for the whole set, since "
            "the inward squeeze is what makes the exercise work."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Front Raise", Equipment.dumbbell, "shoulder flexion",
        primary=("front-delts",), secondary=(),
        aliases=("front raise",), tracks="load reps",
        instructions=(
            "Stand holding dumbbells in front of your thighs with your palms facing your body. "
            "Raise the weights in front of you with nearly straight arms until they reach shoulder "
            "height, then lower slowly. Keep your torso still and do not swing the weights up with "
            "your hips."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Upright Row", Equipment.dumbbell, "abduction",
        primary=("side-delts", "traps"), secondary=(),
        aliases=("db upright row",), tracks="load reps",
        instructions=(
            "Stand holding dumbbells in front of your thighs with your palms facing you. Pull them "
            "up along your body, leading with your elbows, until your upper arms are about "
            "parallel to the floor, then lower slowly. Keep your elbows higher than your wrists "
            "and stop around shoulder height."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Shrug", Equipment.dumbbell, "scapular elevation",
        primary=("traps",), secondary=("forearms",),
        aliases=("db shrug",), tracks="load reps",
        instructions=(
            "Stand tall holding heavy dumbbells at your sides with your arms straight. Lift your "
            "shoulders straight up toward your ears, pause at the top, then lower slowly to a full "
            "stretch. Do not roll your shoulders or bend your elbows; move straight up and down."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Rear Delt Row", Equipment.dumbbell, "horizontal pull",
        primary=("rear-delts",), secondary=("mid-back",),
        aliases=(), tracks="load reps",
        instructions=(
            "Support yourself on a bench or hinge forward with a flat back, holding a dumbbell "
            "with your arm hanging straight. Row the weight toward your chest with your elbow "
            "flared out wide, about 90 degrees from your torso, then lower it. Keep the elbow wide "
            "and stop when your upper arm is in line with your torso so the rear delt does the "
            "work."
        ),
    ),
    ExerciseSeed(
        "Chest-Supported Dumbbell Row", Equipment.dumbbell, "horizontal pull",
        primary=("mid-back", "lats"), secondary=("rear-delts", "biceps"),
        aliases=("incline db row", "chest supported row"), tracks="load reps",
        instructions=(
            "Set a bench to a low incline and lie face down on it with a dumbbell in each hand, "
            "arms hanging straight. Row the weights toward your hips while squeezing your shoulder "
            "blades together, then lower to a full stretch. Keep your chest on the pad so you "
            "cannot use momentum from your torso."
        ),
    ),
    ExerciseSeed(
        "Renegade Row", Equipment.dumbbell, "horizontal pull",
        primary=("lats", "mid-back"), secondary=("obliques", "biceps"),
        aliases=(), tracks="load reps",
        instructions=(
            "Get into a high plank with your hands on two dumbbells and your feet wider than "
            "hip-width. Row one dumbbell to your hip while bracing to keep your hips level, lower "
            "it, then row the other. Keep your hips square to the floor; if they twist, widen your "
            "feet or use lighter dumbbells."
        ),
    ),
    ExerciseSeed(
        "Two-Arm Dumbbell Row", Equipment.dumbbell, "horizontal pull",
        primary=("mid-back", "lats"), secondary=("biceps", "rear-delts"),
        aliases=("bent-over db row",), tracks="load reps",
        instructions=(
            "Hold a dumbbell in each hand and hinge forward to about 45 degrees or lower with a "
            "flat back and soft knees. Row both weights toward your hips by driving your elbows "
            "back, then lower until your arms are straight. Keep your torso angle fixed instead of "
            "standing up as you pull."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Triceps Kickback", Equipment.dumbbell, "elbow extension",
        primary=("triceps",), secondary=(),
        aliases=("db kickback", "tricep kickback"), tracks="load reps",
        instructions=(
            "Hinge forward with a flat back or brace one hand on a bench, holding a dumbbell with "
            "your upper arm tucked against your side and parallel to the floor. Straighten your "
            "elbow until your arm is fully extended behind you, then lower under control. Keep "
            "your upper arm still; if it swings, the weight is too heavy."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Lying Triceps Extension", Equipment.dumbbell, "elbow extension",
        primary=("triceps",), secondary=(),
        aliases=("db skull crusher", "db skullcrusher"), tracks="load reps",
        instructions=(
            "Lie on a flat bench holding dumbbells over your chest with your palms facing each "
            "other. Bend only your elbows to lower the weights beside your head, then extend your "
            "arms back to straight. Keep your upper arms still and angled slightly back so the "
            "tension stays on your triceps."
        ),
    ),
    ExerciseSeed(
        "Tate Press", Equipment.dumbbell, "elbow extension",
        primary=("triceps",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Lie on a flat bench holding dumbbells over your chest with your palms facing your "
            "feet and the inner ends nearly touching. Bend your elbows out to the sides to lower "
            "the dumbbells until they touch your chest, then extend your arms back up. Keep your "
            "upper arms still and let only your forearms move."
        ),
    ),
    ExerciseSeed(
        "Incline Dumbbell Curl", Equipment.dumbbell, "elbow flexion",
        primary=("biceps",), secondary=(),
        aliases=("incline curl",), tracks="load reps",
        instructions=(
            "Sit back on a bench set to about 45 to 60 degrees with the dumbbells hanging straight "
            "down, palms forward. Curl the weights up without moving your upper arms, then lower "
            "them to a full stretch. Keep your shoulders back against the pad instead of letting "
            "your elbows drift forward."
        ),
    ),
    ExerciseSeed(
        "Concentration Curl", Equipment.dumbbell, "elbow flexion",
        primary=("biceps",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Sit on a bench with your feet wide and brace the back of your working upper arm "
            "against your inner thigh, holding a dumbbell. Curl the weight toward your shoulder, "
            "squeeze, then lower until your arm is straight. Keep your upper arm pressed to your "
            "thigh and your torso still."
        ),
    ),
    ExerciseSeed(
        "Zottman Curl", Equipment.dumbbell, "elbow flexion",
        primary=("biceps", "forearms"), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Stand holding dumbbells at your sides with your palms facing forward. Curl them up, "
            "rotate your palms to face down at the top, then lower slowly with the overhand grip "
            "before turning your palms back up at the bottom. Take your time on the lowering "
            "phase, since that is where your forearms work hardest."
        ),
    ),
    ExerciseSeed(
        "Spider Curl", Equipment.dumbbell, "elbow flexion",
        primary=("biceps",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Lie chest-down on an incline bench with your arms hanging straight toward the floor, "
            "holding dumbbells with your palms forward. Curl the weights up, squeeze at the top, "
            "then lower to straight arms. Keep your upper arms vertical and still so only your "
            "elbows move."
        ),
    ),
    ExerciseSeed(
        "Cross-Body Hammer Curl", Equipment.dumbbell, "elbow flexion",
        primary=("biceps", "forearms"), secondary=(),
        aliases=("pinwheel curl",), tracks="load reps",
        instructions=(
            "Stand holding dumbbells at your sides with your palms facing your body. Curl one "
            "dumbbell up and across your body toward the opposite shoulder, keeping the neutral "
            "grip, then lower it and repeat on the other side. Keep your upper arm close to your "
            "side rather than swinging it forward."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Preacher Curl", Equipment.dumbbell, "elbow flexion",
        primary=("biceps",), secondary=(),
        aliases=("db preacher curl",), tracks="load reps",
        instructions=(
            "Sit or stand at a preacher bench with the back of one upper arm flat on the pad, "
            "holding a dumbbell with your palm up. Curl the weight until your forearm is near "
            "vertical, then lower slowly until your arm is almost straight. Control the bottom of "
            "each rep instead of dropping into lockout."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Wrist Curl", Equipment.dumbbell, "wrist flexion",
        primary=("forearms",), secondary=(),
        aliases=("db wrist curl",), tracks="load reps",
        instructions=(
            "Sit with your forearm resting on your thigh or a bench, palm up and wrist just past "
            "the edge, holding a dumbbell. Let the weight roll toward your fingers, then curl your "
            "wrist up as high as you can. Keep your forearm flat so only your wrist moves."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Front Squat", Equipment.dumbbell, "squat",
        primary=("quads", "glutes"), secondary=(),
        aliases=("db front squat",), tracks="load reps",
        instructions=(
            "Hold two dumbbells at your shoulders with one end of each resting on the front of "
            "your shoulders. Squat down with your chest up until your thighs are at least "
            "parallel, then drive back up. Keep your elbows high and your weight over mid-foot so "
            "you do not tip forward."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Step-up", Equipment.dumbbell, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=("db step-up",), tracks="load reps",
        instructions=(
            "Hold dumbbells at your sides and stand facing a sturdy box or bench about knee "
            "height. Place your whole foot on the box and drive through that heel to stand on top, "
            "then step down with control. Let the top leg do the work rather than pushing off the "
            "floor with the back foot."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Reverse Lunge", Equipment.dumbbell, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=("db reverse lunge",), tracks="load reps",
        instructions=(
            "Stand tall holding dumbbells at your sides. Step one foot back and lower until your "
            "back knee is just above the floor, then drive through your front foot to return to "
            "standing. Keep your torso upright and most of your weight on the front leg."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Lateral Lunge", Equipment.dumbbell, "lunge",
        primary=("quads", "glutes", "adductors"), secondary=(),
        aliases=("side lunge", "lateral lunge"), tracks="load reps",
        instructions=(
            "Stand with your feet together holding a dumbbell at your chest or one in each hand. "
            "Take a wide step to the side and sit your hips back over that foot while the other "
            "leg stays straight, then push back to the start. Keep both feet pointing forward and "
            "the heel of the bending leg down."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Split Squat", Equipment.dumbbell, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=("db split squat",), tracks="load reps",
        instructions=(
            "Hold dumbbells at your sides and set your feet in a long split stance with your back "
            "heel raised. Lower straight down until your back knee is just above the floor, then "
            "push through your front foot to rise. Keep your feet planted between reps and your "
            "torso upright."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Sumo Squat", Equipment.dumbbell, "squat",
        primary=("quads", "glutes", "adductors"), secondary=(),
        aliases=("sumo squat", "plie squat"), tracks="load reps",
        instructions=(
            "Stand with a wide stance and toes turned out, holding one dumbbell vertically by the "
            "top end between your legs. Squat straight down, pushing your knees out over your "
            "toes, until the weight nearly touches the floor, then stand back up. Keep your chest "
            "up and your knees tracking outward the whole time."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Single-Leg Romanian Deadlift", Equipment.dumbbell, "hinge",
        primary=("hamstrings", "glutes"), secondary=(),
        aliases=("single-leg rdl", "sl rdl"), tracks="load reps",
        instructions=(
            "Stand on one leg with a slight knee bend, holding a dumbbell in the opposite hand. "
            "Hinge forward at the hip as your free leg extends straight behind you, lowering the "
            "weight until you feel a hamstring stretch, then return to standing. Keep your hips "
            "square to the floor rather than letting the raised leg's hip rotate open."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Hip Thrust", Equipment.dumbbell, "hinge",
        primary=("glutes",), secondary=("hamstrings",),
        aliases=("db hip thrust",), tracks="load reps",
        instructions=(
            "Sit with your upper back against a bench, a dumbbell held on your hips and your feet "
            "flat about hip-width apart. Drive through your heels to lift your hips until your "
            "torso is parallel to the floor, squeeze your glutes, then lower. Tuck your chin and "
            "keep your ribs down so you do not arch your lower back at the top."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Calf Raise", Equipment.dumbbell, "plantar flexion",
        primary=("calves",), secondary=(),
        aliases=("db calf raise",), tracks="load reps",
        instructions=(
            "Stand with the balls of your feet on a step, holding dumbbells at your sides, or one "
            "dumbbell with a hand on a wall for balance. Lower your heels for a full stretch, then "
            "rise onto your toes as high as you can. Pause at the bottom rather than bouncing out "
            "of the stretch."
        ),
    ),
    ExerciseSeed(
        "Farmer's Walk", Equipment.dumbbell, "carry",
        primary=("forearms", "traps"), secondary=("core",),
        aliases=("farmers walk", "farmer's carry", "farmer carry"), tracks="load distance",
        instructions=(
            "Pick up heavy dumbbells from the floor with a flat back and stand tall with them at "
            "your sides. Walk forward with short, controlled steps, shoulders back and core "
            "braced. Stay upright and do not let the weights swing or pull your shoulders forward."
        ),
    ),
    ExerciseSeed(
        "Suitcase Carry", Equipment.dumbbell, "carry",
        primary=("obliques", "forearms"), secondary=("traps",),
        aliases=("suitcase walk", "single-arm farmer's walk"), tracks="load distance",
        instructions=(
            "Pick up one heavy dumbbell and stand tall with it at your side, free arm relaxed. "
            "Walk forward with steady steps while keeping your shoulders level. Resist leaning "
            "toward or away from the weight; your torso should stay upright the whole way."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Thruster", Equipment.dumbbell, "full body",
        primary=("quads", "glutes", "front-delts"), secondary=("triceps",),
        aliases=("db thruster",), tracks="load reps",
        instructions=(
            "Hold dumbbells at your shoulders with your elbows forward. Squat to parallel or "
            "below, then drive up and use that momentum to press the dumbbells overhead in one "
            "smooth motion. Bring the weights back to your shoulders as you descend into the next "
            "rep, keeping your chest up."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Snatch", Equipment.dumbbell, "olympic pull",
        primary=("glutes", "hamstrings"), secondary=("quads", "traps", "front-delts"),
        aliases=("db snatch",), tracks="load reps",
        instructions=(
            "Stand with feet hip-width apart and a dumbbell on the floor between your feet. Hinge "
            "down and grab it with one hand, then drive your hips forward explosively, pull the "
            "dumbbell up close to your body and punch it overhead to a locked arm in one motion. "
            "Power it with your hips and legs rather than your arm."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Z Press", Equipment.dumbbell, "vertical push",
        primary=("front-delts",), secondary=("triceps", "core"),
        aliases=("z press",), tracks="load reps",
        instructions=(
            "Sit on the floor with your legs straight out in front of you, holding dumbbells at "
            "shoulder height. Press them overhead until your arms are straight, then lower them "
            "back to your shoulders. Sit tall without leaning back; if you cannot stay upright, go "
            "lighter."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Y-Raise", Equipment.dumbbell, "abduction",
        primary=("traps", "side-delts"), secondary=(),
        aliases=("y raise", "prone y raise"), tracks="load reps",
        instructions=(
            "Lie face down on an incline bench with light dumbbells hanging below your shoulders, "
            "thumbs pointing up. Raise your arms up and out into a Y shape until they are in line "
            "with your body, then lower slowly. Draw your shoulder blades down and back as you "
            "lift rather than shrugging toward your ears."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Side Bend", Equipment.dumbbell, "spinal flexion",
        primary=("obliques",), secondary=(),
        aliases=("db side bend",), tracks="load reps",
        instructions=(
            "Stand tall holding a dumbbell in one hand at your side, feet hip-width apart. Bend "
            "sideways toward the weight as far as is comfortable, then pull yourself back upright "
            "using the opposite side of your waist. Move only side to side, without twisting or "
            "leaning forward."
        ),
    ),
    ExerciseSeed(
        "Dumbbell Deadlift", Equipment.dumbbell, "hinge",
        primary=("glutes", "hamstrings"), secondary=("quads", "lower-back"),
        aliases=("db deadlift",), tracks="load reps",
        instructions=(
            "Stand with dumbbells in front of your shins or at your sides, feet hip-width apart. "
            "Hinge at the hips and bend your knees to grip them with a flat back, then drive "
            "through the floor to stand tall. Keep your chest up and the weights close to your "
            "legs throughout."
        ),
    ),
)
