"""Machines, including the Smith machine.

The assisted pull-up and dip track reps only: the counterweight is
assistance, and logging it as load would make more help look like a PR.
"""
from __future__ import annotations

from app.models import Equipment
from app.seed.exercise_library.model import ExerciseSeed

EXERCISES: tuple[ExerciseSeed, ...] = (
    ExerciseSeed(
        "Machine Chest Press", Equipment.machine, "horizontal push",
        primary=("chest",), secondary=("triceps", "front-delts"),
        aliases=("chest press",), tracks="load reps",
        instructions=(
            "Adjust the seat so the handles line up with your mid-chest and sit with your back "
            "flat against the pad. Press the handles forward until your arms are straight, then "
            "let them return until you feel a stretch across your chest. Keep your shoulder blades "
            "pinned back against the pad instead of letting your shoulders roll forward."
        ),
    ),
    ExerciseSeed(
        "Incline Machine Chest Press", Equipment.machine, "incline push",
        primary=("upper-chest",), secondary=("front-delts", "triceps"),
        aliases=("incline chest press",), tracks="load reps",
        instructions=(
            "Adjust the seat so the handles start around your upper chest and sit with your back "
            "against the pad. Press the handles up and forward until your arms are straight, then "
            "lower under control to a stretch. Keep your chest up and your shoulder blades back "
            "throughout the set."
        ),
    ),
    ExerciseSeed(
        "Pec Deck", Equipment.machine, "horizontal adduction",
        primary=("chest",), secondary=(),
        aliases=("pec fly", "machine fly", "butterfly"), tracks="load reps",
        instructions=(
            "Sit with your back against the pad and set the seat so the handles are at chest "
            "height, with a slight bend in your elbows. Bring the handles together in front of "
            "your chest in a wide arc, squeeze, then let them open until you feel a stretch. Keep "
            "your chest up and shoulders back rather than rounding forward as the handles meet."
        ),
    ),
    ExerciseSeed(
        "Machine Shoulder Press", Equipment.machine, "vertical push",
        primary=("front-delts",), secondary=("triceps", "side-delts"),
        aliases=("machine ohp",), tracks="load reps",
        instructions=(
            "Adjust the seat so the handles start around shoulder height and sit with your back "
            "flat against the pad. Press the handles overhead until your arms are straight, then "
            "lower until your hands are about level with your chin. Keep your back against the pad "
            "instead of arching to finish the press."
        ),
    ),
    ExerciseSeed(
        "Machine Lateral Raise", Equipment.machine, "abduction",
        primary=("side-delts",), secondary=(),
        aliases=("lateral raise machine",), tracks="load reps",
        instructions=(
            "Sit with the pads against the outside of your arms just above the elbows and the "
            "machine's pivot lined up with your shoulders. Raise your arms out to the sides until "
            "they reach shoulder height, then lower slowly. Lead with your elbows and keep your "
            "shoulders down away from your ears."
        ),
    ),
    ExerciseSeed(
        "Reverse Pec Deck", Equipment.machine, "horizontal abduction",
        primary=("rear-delts",), secondary=("mid-back",),
        aliases=("reverse fly machine", "rear delt machine"), tracks="load reps",
        instructions=(
            "Sit facing the pad of the pec deck with the handles at shoulder height and grab them "
            "with nearly straight arms. Open your arms out and back in a wide arc until they are "
            "in line with your body, then return slowly. Keep your chest on the pad and do not "
            "shrug, so your rear delts rather than your traps do the work."
        ),
    ),
    ExerciseSeed(
        "Hack Squat", Equipment.machine, "squat",
        primary=("quads",), secondary=("glutes",),
        aliases=("machine hack squat",), tracks="load reps",
        instructions=(
            "Stand in the machine with your back against the pad, shoulders under the pads and "
            "feet shoulder-width apart on the platform. Release the handles and squat as deep as "
            "you can control, then drive back up through your whole foot. Keep your lower back "
            "pressed into the pad and your knees tracking over your toes."
        ),
    ),
    ExerciseSeed(
        "Pendulum Squat", Equipment.machine, "squat",
        primary=("quads",), secondary=("glutes",),
        aliases=(), tracks="load reps",
        instructions=(
            "Step into the machine with your back against the pad, shoulders under the pads and "
            "feet about hip-width apart in the middle of the platform. Squat down along the "
            "machine's arc as deep as you can with control, then drive back up. Let your knees "
            "travel forward freely and keep your hips against the pad throughout."
        ),
    ),
    ExerciseSeed(
        "Belt Squat", Equipment.machine, "squat",
        primary=("quads", "glutes"), secondary=("adductors",),
        aliases=(), tracks="load reps",
        instructions=(
            "Stand on the platform with the belt around your hips attached to the machine and your "
            "feet about shoulder-width apart. Squat down with an upright torso to a comfortable "
            "depth, then drive back up to standing. Hold the handles lightly for balance only, "
            "without pulling yourself up."
        ),
    ),
    ExerciseSeed(
        "Smith Machine Squat", Equipment.machine, "squat",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=("smith squat",), tracks="load reps",
        instructions=(
            "Set the bar across your upper back and place your feet slightly in front of the bar, "
            "about shoulder-width apart. Unhook the bar and squat down until your thighs are at "
            "least parallel, then drive back up. Adjust your foot position so your knees track "
            "over your toes and your back stays neutral at the bottom."
        ),
    ),
    ExerciseSeed(
        "Smith Machine Bench Press", Equipment.machine, "horizontal push",
        primary=("chest",), secondary=("triceps", "front-delts"),
        aliases=("smith bench",), tracks="load reps",
        instructions=(
            "Position a flat bench so the bar lines up with your mid-chest and lie down with your "
            "shoulder blades pinched. Unhook the bar and lower it to your chest, then press it "
            "back up to lockout. Keep your elbows slightly tucked, and set the safety stops before "
            "you start."
        ),
    ),
    ExerciseSeed(
        "Smith Machine Incline Bench Press", Equipment.machine, "incline push",
        primary=("upper-chest",), secondary=("front-delts", "triceps"),
        aliases=("smith incline",), tracks="load reps",
        instructions=(
            "Set an incline bench at about 30 degrees under the bar so it lines up with your upper "
            "chest. Unhook the bar, lower it to just below your collarbones, then press it back "
            "up. Keep your shoulder blades back and your chest up throughout."
        ),
    ),
    ExerciseSeed(
        "Smith Machine Shoulder Press", Equipment.machine, "vertical push",
        primary=("front-delts",), secondary=("triceps", "side-delts"),
        aliases=("smith ohp",), tracks="load reps",
        instructions=(
            "Sit on an upright bench under the bar so it travels just in front of your face. "
            "Unhook it at shoulder height, press it overhead to straight arms, then lower it to "
            "about chin level. Keep your back against the pad instead of arching to press."
        ),
    ),
    ExerciseSeed(
        "Smith Machine Split Squat", Equipment.machine, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=("smith split squat",), tracks="load reps",
        instructions=(
            "Set the bar across your upper back and take a long split stance with your back heel "
            "raised. Unhook the bar and lower straight down until your back knee is just above the "
            "floor, then drive up through your front foot. Keep most of your weight on the front "
            "leg and your front knee tracking over your toes."
        ),
    ),
    ExerciseSeed(
        "Seated Leg Curl", Equipment.machine, "knee flexion",
        primary=("hamstrings",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Sit with your knees lined up with the machine's pivot, the lap pad snug on your "
            "thighs and the lower pad behind your ankles. Curl your heels down and back as far as "
            "you can, then let the pad return slowly. Keep your thighs pinned under the pad and do "
            "not rush the return."
        ),
    ),
    ExerciseSeed(
        "Lying Leg Curl", Equipment.machine, "knee flexion",
        primary=("hamstrings",), secondary=(),
        aliases=("prone leg curl",), tracks="load reps",
        instructions=(
            "Lie face down with your knees just off the end of the pad and the roller behind your "
            "ankles. Curl your heels toward your glutes as far as you can, then lower to almost "
            "straight legs. Keep your hips pressed into the pad instead of lifting them to finish "
            "the rep."
        ),
    ),
    ExerciseSeed(
        "Standing Leg Curl", Equipment.machine, "knee flexion",
        primary=("hamstrings",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Stand in the machine with your thigh against the pad, the roller behind your ankle "
            "and your hands on the handles. Curl one heel toward your glutes as far as you can, "
            "then lower it slowly. Keep your hips still so only your knee moves."
        ),
    ),
    ExerciseSeed(
        "Machine Hip Abduction", Equipment.machine, "hip abduction",
        primary=("glutes",), secondary=(),
        aliases=("abductor machine", "outer thigh machine"), tracks="load reps",
        instructions=(
            "Sit in the machine with the pads against the outside of your knees and your back "
            "against the seat. Push your knees out as wide as you can, pause, then let them come "
            "back together under control. Keep your hips on the seat and do not let the weight "
            "stack slam between reps."
        ),
    ),
    ExerciseSeed(
        "Machine Hip Adduction", Equipment.machine, "hip adduction",
        primary=("adductors",), secondary=(),
        aliases=("adductor machine", "inner thigh machine"), tracks="load reps",
        instructions=(
            "Sit in the machine with the pads on the inside of your knees, set so you start in a "
            "comfortable stretch. Squeeze your legs together until the pads meet, then open them "
            "slowly back to the stretch. Stay seated upright and control the return instead of "
            "letting the pads spring apart."
        ),
    ),
    ExerciseSeed(
        "Machine Glute Kickback", Equipment.machine, "hip extension",
        primary=("glutes",), secondary=("hamstrings",),
        aliases=("glute kickback machine",), tracks="load reps",
        instructions=(
            "Set yourself in the machine with your chest on the pad or hands on the handles and "
            "one foot on the platform or under the roller. Push that leg back by extending your "
            "hip until your thigh is in line with your body, then return slowly. Keep your lower "
            "back from arching; the movement should come from your hip, not your spine."
        ),
    ),
    ExerciseSeed(
        "Assisted Pull-up", Equipment.machine, "vertical pull",
        primary=("lats",), secondary=("biceps", "mid-back"),
        aliases=("assisted pullup", "assisted chin-up"), tracks="reps",
        instructions=(
            "Set the counterweight, kneel or stand on the platform and grab the handles slightly "
            "wider than your shoulders. Pull yourself up until your chin clears the handles, then "
            "lower under control to straight arms. Use less counterweight over time, and do not "
            "let the platform bounce you back up."
        ),
    ),
    ExerciseSeed(
        "Assisted Dip", Equipment.machine, "vertical push",
        primary=("triceps", "chest"), secondary=("front-delts",),
        aliases=("assisted dips",), tracks="reps",
        instructions=(
            "Set the counterweight, kneel or stand on the platform and grip the dip handles with "
            "straight arms. Lower yourself until your upper arms are about parallel to the floor, "
            "then press back up to lockout. Keep your shoulders down away from your ears, and use "
            "less counterweight as you get stronger."
        ),
    ),
    ExerciseSeed(
        "Machine Row", Equipment.machine, "horizontal pull",
        primary=("mid-back", "lats"), secondary=("biceps", "rear-delts"),
        aliases=("seated machine row",), tracks="load reps",
        instructions=(
            "Adjust the seat so the handles are at mid-chest height and sit with your chest "
            "against the pad. Row the handles toward your body, driving your elbows back and "
            "squeezing your shoulder blades together, then return to a full stretch. Keep your "
            "chest on the pad rather than leaning back to move the weight."
        ),
    ),
    ExerciseSeed(
        "Chest-Supported T-Bar Row", Equipment.machine, "horizontal pull",
        primary=("mid-back", "lats"), secondary=("rear-delts", "biceps"),
        aliases=("lying t-bar row",), tracks="load reps",
        instructions=(
            "Stand on the platform and lie with your chest against the angled pad, gripping the "
            "handles with straight arms. Row the handles toward your chest, driving your elbows "
            "back, then lower to a full stretch. Keep your chest on the pad so the lift comes from "
            "your back rather than your legs or hips."
        ),
    ),
    ExerciseSeed(
        "Machine Preacher Curl", Equipment.machine, "elbow flexion",
        primary=("biceps",), secondary=(),
        aliases=("preacher curl machine",), tracks="load reps",
        instructions=(
            "Adjust the seat so your upper arms rest flat on the pad with your elbows lined up "
            "with the machine's pivot. Curl the handles up until your forearms are near vertical, "
            "then lower slowly until your arms are almost straight. Keep your upper arms on the "
            "pad and your hips on the seat."
        ),
    ),
    ExerciseSeed(
        "Seated Dip Machine", Equipment.machine, "vertical push",
        primary=("triceps",), secondary=("chest",),
        aliases=("dip machine",), tracks="load reps",
        instructions=(
            "Sit with your back against the pad and grip the handles at your sides with your "
            "elbows bent. Press the handles down until your arms are straight, then let them rise "
            "under control until your elbows are bent about 90 degrees. Keep your elbows tucked "
            "close to your sides and your shoulders down."
        ),
    ),
    ExerciseSeed(
        "Machine Triceps Extension", Equipment.machine, "elbow extension",
        primary=("triceps",), secondary=(),
        aliases=("triceps extension machine",), tracks="load reps",
        instructions=(
            "Adjust the seat so your elbows line up with the machine's pivot and rest your upper "
            "arms on the pad. Extend your elbows until your arms are straight, then let the "
            "handles return slowly. Keep your upper arms planted on the pad so the movement comes "
            "only from your elbows."
        ),
    ),
    ExerciseSeed(
        "Machine Ab Crunch", Equipment.machine, "spinal flexion",
        primary=("abs",), secondary=(),
        aliases=("ab crunch machine", "crunch machine"), tracks="load reps",
        instructions=(
            "Sit in the machine with your feet secured and hold the handles or rest your chest "
            "against the pads. Crunch forward by curling your ribs toward your hips, then return "
            "slowly. Round through your spine rather than hinging at the hips or pulling with your "
            "arms."
        ),
    ),
    ExerciseSeed(
        "Leg Press Calf Raise", Equipment.machine, "plantar flexion",
        primary=("calves",), secondary=(),
        aliases=("calf press",), tracks="load reps",
        instructions=(
            "Sit in the leg press with the balls of your feet on the bottom edge of the platform "
            "and your legs straight but not locked. Push the platform away by pointing your toes, "
            "then let your heels come back toward you for a full stretch. Keep your knees still; "
            "bending them turns it into a leg press."
        ),
    ),
    ExerciseSeed(
        "Machine Hip Thrust", Equipment.machine, "hinge",
        primary=("glutes",), secondary=("hamstrings",),
        aliases=("hip thrust machine", "glute drive"), tracks="load reps",
        instructions=(
            "Sit in the machine with your upper back on the pad, the belt or pad across your hips "
            "and your feet flat about hip-width apart. Drive through your heels to raise your hips "
            "until your torso is level, squeeze your glutes, then lower. Keep your chin tucked and "
            "ribs down so you finish with your hips, not an arched back."
        ),
    ),
    ExerciseSeed(
        "Glute-Ham Raise", Equipment.machine, "knee flexion",
        primary=("hamstrings",), secondary=("glutes",),
        aliases=("ghr", "glute ham raise"), tracks="reps",
        instructions=(
            "Set your feet against the plate of a glute-ham developer with your knees just behind "
            "the pad and your body upright. Lower your torso forward under control by "
            "straightening your knees until your body is parallel to the floor, then curl yourself "
            "back up with your hamstrings. Keep a straight line from knees to shoulders instead of "
            "bending at the waist."
        ),
    ),
    ExerciseSeed(
        "Reverse Hyperextension", Equipment.machine, "hip extension",
        primary=("glutes",), secondary=("hamstrings", "lower-back"),
        aliases=("reverse hyper",), tracks="load reps",
        instructions=(
            "Lie face down on the reverse hyper bench with your hips at the edge of the pad and "
            "your ankles in the strap. Raise your legs behind you by squeezing your glutes until "
            "they are in line with your torso, then let them swing back down under the pad. "
            "Control the swing and stop at a straight line instead of arching your lower back hard "
            "at the top."
        ),
    ),
)
