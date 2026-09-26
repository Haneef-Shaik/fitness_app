"""Cable-stack movements.
"""
from __future__ import annotations

from app.models import Equipment
from app.seed.exercise_library.model import ExerciseSeed

EXERCISES: tuple[ExerciseSeed, ...] = (
    ExerciseSeed(
        "Cable Crossover", Equipment.cable, "horizontal adduction",
        primary=("chest",), secondary=(),
        aliases=("high-to-low fly", "high cable fly"), tracks="load reps",
        instructions=(
            "Set both pulleys above head height, grab a handle in each hand and step forward into "
            "a split stance with a slight lean. Pull the handles down and together in an arc until "
            "they meet in front of your lower chest, then let them return to a stretch. Keep a "
            "fixed bend in your elbows so it stays a fly and not a press."
        ),
    ),
    ExerciseSeed(
        "Low-to-High Cable Fly", Equipment.cable, "horizontal adduction",
        primary=("upper-chest",), secondary=("front-delts",),
        aliases=("low cable fly", "low-to-high crossover"), tracks="load reps",
        instructions=(
            "Set both pulleys at the lowest position, grab a handle in each hand and stand between "
            "them with a slight bend in your elbows. Sweep the handles up and together until they "
            "meet in front of your upper chest, then lower them back to a stretch. Keep your palms "
            "facing up and forward, and do not shrug as your hands rise."
        ),
    ),
    ExerciseSeed(
        "Cable Lateral Raise", Equipment.cable, "abduction",
        primary=("side-delts",), secondary=(),
        aliases=("cable side raise",), tracks="load reps",
        instructions=(
            "Set a pulley at its lowest position and stand side-on to it, holding the handle in "
            "your far hand across the front of your body. Raise your arm out to the side until it "
            "reaches shoulder height, then lower slowly. Lead with your elbow and keep your torso "
            "still instead of leaning away to swing the weight."
        ),
    ),
    ExerciseSeed(
        "Cable Rear Delt Fly", Equipment.cable, "horizontal abduction",
        primary=("rear-delts",), secondary=("mid-back",),
        aliases=("cable reverse fly",), tracks="load reps",
        instructions=(
            "Set two pulleys at shoulder height and hold the opposite cable in each hand so your "
            "arms cross in front of you. Pull your arms out and back in a wide arc until they are "
            "in line with your body, then return slowly. Keep a slight elbow bend and do not "
            "shrug; think of pushing your hands out wide."
        ),
    ),
    ExerciseSeed(
        "Cable Upright Row", Equipment.cable, "abduction",
        primary=("side-delts", "traps"), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Attach a straight bar or rope to a low pulley and stand close to it, holding the "
            "attachment in front of your thighs. Pull it up close to your body, leading with your "
            "elbows, until your upper arms are about parallel to the floor, then lower slowly. "
            "Keep your elbows above your wrists and stop around shoulder height."
        ),
    ),
    ExerciseSeed(
        "Cable Front Raise", Equipment.cable, "shoulder flexion",
        primary=("front-delts",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Set a pulley low and stand facing away from it with the handle or rope between your "
            "legs, arms straight. Raise the handle in front of you until it reaches shoulder "
            "height, then lower slowly. Keep your torso still and do not lean back to lift the "
            "weight."
        ),
    ),
    ExerciseSeed(
        "Cable Curl", Equipment.cable, "elbow flexion",
        primary=("biceps",), secondary=(),
        aliases=("cable bicep curl",), tracks="load reps",
        instructions=(
            "Attach a straight or EZ bar to a low pulley and stand facing it with an underhand "
            "grip, arms straight. Curl the bar up toward your shoulders, then lower it until your "
            "elbows are fully straight. Keep your elbows at your sides and do not lean back as you "
            "curl."
        ),
    ),
    ExerciseSeed(
        "Cable Rope Hammer Curl", Equipment.cable, "elbow flexion",
        primary=("biceps", "forearms"), secondary=(),
        aliases=("rope hammer curl", "rope curl"), tracks="load reps",
        instructions=(
            "Attach a rope to a low pulley and hold the ends with your palms facing each other, "
            "arms straight. Curl the rope up toward your shoulders while keeping the neutral grip, "
            "then lower under control. Keep your elbows pinned to your sides so your upper arms "
            "stay still."
        ),
    ),
    ExerciseSeed(
        "Bayesian Curl", Equipment.cable, "elbow flexion",
        primary=("biceps",), secondary=(),
        aliases=("bayesian cable curl", "behind-the-body curl"), tracks="load reps",
        instructions=(
            "Set a pulley low, face away from it and hold the handle in one hand so your arm is "
            "drawn slightly behind your body. Step forward, curl the handle up without letting "
            "your elbow drift forward, then lower until your arm is straight and stretched behind "
            "you. Keep your upper arm angled back throughout, since that stretched position is the "
            "point."
        ),
    ),
    ExerciseSeed(
        "Cable Overhead Triceps Extension", Equipment.cable, "elbow extension",
        primary=("triceps",), secondary=(),
        aliases=("rope overhead extension", "overhead cable extension"), tracks="load reps",
        instructions=(
            "Attach a rope to a pulley, face away from the stack and hold the rope behind your "
            "head with your elbows bent and pointing forward. Step into a split stance and extend "
            "your arms overhead until they are straight, then let the rope return behind your head "
            "to a deep stretch. Keep your elbows close together and in place so only your forearms "
            "move."
        ),
    ),
    ExerciseSeed(
        "Single-Arm Cable Pushdown", Equipment.cable, "elbow extension",
        primary=("triceps",), secondary=(),
        aliases=("one-arm pushdown",), tracks="load reps",
        instructions=(
            "Attach a single handle to a high pulley and hold it in one hand with your elbow "
            "tucked at your side. Push the handle down until your arm is fully straight, then let "
            "it rise until your forearm is about parallel to the floor. Keep your elbow pinned to "
            "your side and your shoulder down."
        ),
    ),
    ExerciseSeed(
        "Cable Triceps Kickback", Equipment.cable, "elbow extension",
        primary=("triceps",), secondary=(),
        aliases=("cable tricep kickback",), tracks="load reps",
        instructions=(
            "Set a pulley low, hinge forward and hold the cable with your upper arm tucked against "
            "your side and parallel to the floor. Straighten your elbow until your arm is fully "
            "extended behind you, then return slowly. Keep your upper arm still so the movement "
            "comes only from the elbow."
        ),
    ),
    ExerciseSeed(
        "Straight-Arm Pulldown", Equipment.cable, "shoulder extension",
        primary=("lats",), secondary=(),
        aliases=("stiff-arm pulldown", "lat pushdown"), tracks="load reps",
        instructions=(
            "Attach a bar or rope to a high pulley, stand facing it and hinge slightly forward "
            "with your arms straight out in front and above you. Pull the attachment down in an "
            "arc to your thighs with your elbows nearly straight, then let it return until you "
            "feel a lat stretch. Keep your arms straight so it does not turn into a triceps "
            "pushdown."
        ),
    ),
    ExerciseSeed(
        "Single-Arm Lat Pulldown", Equipment.cable, "vertical pull",
        primary=("lats",), secondary=("biceps",),
        aliases=("one-arm pulldown",), tracks="load reps",
        instructions=(
            "Attach a single handle to a high pulley and sit or kneel beneath it, reaching up with "
            "one arm. Pull the handle down toward your side, driving your elbow toward your hip, "
            "then let it rise to a full stretch. Keep your torso from twisting toward the working "
            "side as you pull."
        ),
    ),
    ExerciseSeed(
        "Close-Grip Lat Pulldown", Equipment.cable, "vertical pull",
        primary=("lats",), secondary=("biceps", "mid-back"),
        aliases=("close-grip pulldown", "v-bar pulldown"), tracks="load reps",
        instructions=(
            "Attach a close-grip V-handle, sit with your thighs locked under the pads and reach up "
            "to grab it. Pull the handle to your upper chest, driving your elbows down and back, "
            "then let it rise until your arms are straight. Lean back only slightly and do not "
            "swing your torso."
        ),
    ),
    ExerciseSeed(
        "Cable Pull-Through", Equipment.cable, "hinge",
        primary=("glutes", "hamstrings"), secondary=(),
        aliases=("pull-through",), tracks="load reps",
        instructions=(
            "Attach a rope to a low pulley, face away from it and hold the rope between your legs, "
            "then walk forward a couple of steps. Hinge at your hips and let the rope pull your "
            "hands back between your thighs, then drive your hips forward to stand tall. Keep your "
            "arms relaxed and your back flat; the power comes from your hips, not your arms."
        ),
    ),
    ExerciseSeed(
        "Cable Glute Kickback", Equipment.cable, "hip extension",
        primary=("glutes",), secondary=("hamstrings",),
        aliases=("cable kickback",), tracks="load reps",
        instructions=(
            "Attach an ankle strap to a low pulley, face the machine and hold on for support with "
            "a slight forward lean. Kick the strapped leg straight back by squeezing your glute "
            "until your thigh is just behind your body, then return slowly. Stop before your lower "
            "back arches; the movement should come only from your hip."
        ),
    ),
    ExerciseSeed(
        "Cable Hip Abduction", Equipment.cable, "hip abduction",
        primary=("glutes",), secondary=(),
        aliases=("standing cable abduction",), tracks="load reps",
        instructions=(
            "Attach an ankle strap to a low pulley and stand side-on to the machine with the strap "
            "on your far ankle, holding on for support. Lift that leg out to the side against the "
            "cable, then return it slowly. Keep your torso upright and your toes pointing forward "
            "rather than leaning away to lift higher."
        ),
    ),
    ExerciseSeed(
        "Cable Hip Adduction", Equipment.cable, "hip adduction",
        primary=("adductors",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Attach an ankle strap to a low pulley and stand side-on to the machine with the strap "
            "on your near ankle, holding on for support. Pull that leg in and across in front of "
            "your standing leg, then let it return slowly toward the machine. Stay upright and "
            "move only at the hip."
        ),
    ),
    ExerciseSeed(
        "Pallof Press", Equipment.cable, "anti-rotation",
        primary=("obliques",), secondary=("abs",),
        aliases=("anti-rotation press",), tracks="load reps",
        instructions=(
            "Set a pulley at chest height and stand side-on to it, holding the handle at your "
            "chest with both hands and your feet shoulder-width apart. Press the handle straight "
            "out in front of you, hold briefly, then bring it back to your chest. Keep your hips "
            "and shoulders square; the goal is to resist the cable pulling you into rotation."
        ),
    ),
    ExerciseSeed(
        "Cable Shrug", Equipment.cable, "scapular elevation",
        primary=("traps",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Attach a straight bar to a low pulley and stand close to it, holding the bar in front "
            "of your thighs with your arms straight. Shrug your shoulders straight up toward your "
            "ears, pause, then lower to a full stretch. Do not roll your shoulders or bend your "
            "elbows."
        ),
    ),
    ExerciseSeed(
        "Cable Y-Raise", Equipment.cable, "abduction",
        primary=("side-delts", "traps"), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Set two pulleys at the lowest position and hold the opposite handle in each hand, "
            "arms crossed low in front of you. Raise your arms up and out into a Y shape until "
            "they are just above shoulder height, then lower slowly. Keep your shoulders down and "
            "let your arms, not your torso, do the moving."
        ),
    ),
    ExerciseSeed(
        "Cable External Rotation", Equipment.cable, "shoulder rotation",
        primary=("rear-delts",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Set a pulley at elbow height and stand side-on to it, holding the handle in your far "
            "hand with your elbow bent 90 degrees and tucked to your side. Rotate your forearm "
            "outward away from your body, then return slowly. Keep your elbow against your side, a "
            "rolled towel helps, and use a light weight."
        ),
    ),
    ExerciseSeed(
        "Cable Reverse Crunch", Equipment.cable, "spinal flexion",
        primary=("abs",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Attach ankle straps to a low pulley and lie on your back with your feet toward the "
            "machine, knees bent and lifted over your hips. Curl your knees toward your chest by "
            "lifting your hips off the floor, then lower slowly. Roll your pelvis up with your abs "
            "rather than just swinging your legs."
        ),
    ),
    ExerciseSeed(
        "Cable Chest Press", Equipment.cable, "horizontal push",
        primary=("chest",), secondary=("triceps", "front-delts"),
        aliases=("standing cable press",), tracks="load reps",
        instructions=(
            "Set two pulleys at chest height, grab the handles and step forward into a split "
            "stance with your hands beside your chest. Press the handles forward until your arms "
            "are straight and your hands nearly meet, then return under control. Brace your core "
            "so your torso stays still rather than leaning into each rep."
        ),
    ),
    ExerciseSeed(
        "Wide-Grip Seated Cable Row", Equipment.cable, "horizontal pull",
        primary=("mid-back", "rear-delts"), secondary=("lats", "biceps"),
        aliases=("wide cable row",), tracks="load reps",
        instructions=(
            "Attach a long bar to the seated row, sit tall with your knees slightly bent and take "
            "an overhand grip wider than your shoulders. Row the bar to your upper stomach with "
            "your elbows flared out, squeezing your shoulder blades together, then return to a "
            "stretch. Keep your torso still rather than rocking back to finish."
        ),
    ),
    ExerciseSeed(
        "Single-Arm Cable Row", Equipment.cable, "horizontal pull",
        primary=("lats", "mid-back"), secondary=("biceps",),
        aliases=("one-arm cable row",), tracks="load reps",
        instructions=(
            "Set a single handle at chest height or on the seated row and reach forward with one "
            "arm. Row the handle toward your hip, driving your elbow back, then let your arm "
            "extend fully and your shoulder reach forward. Keep your torso square and do not twist "
            "to pull the weight."
        ),
    ),
)
