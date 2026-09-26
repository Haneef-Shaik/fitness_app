"""Barbell movements (T-bar and Meadows rows load a barbell end).
"""
from __future__ import annotations

from app.models import Equipment
from app.seed.exercise_library.model import ExerciseSeed

EXERCISES: tuple[ExerciseSeed, ...] = (
    ExerciseSeed(
        "Sumo Deadlift", Equipment.barbell, "hinge",
        primary=("glutes", "quads", "adductors"), secondary=("hamstrings", "lower-back"),
        aliases=("sumo dl",), tracks="load reps",
        instructions=(
            "Stand with a wide stance, toes turned out and the bar over mid-foot, then grip it "
            "inside your knees with your arms hanging straight. Push your knees out, keep your "
            "chest up and drive the floor apart as you stand the bar up to lockout. Do not let "
            "your hips shoot up first; your hips and chest should rise together."
        ),
    ),
    ExerciseSeed(
        "Deficit Deadlift", Equipment.barbell, "hinge",
        primary=("glutes", "hamstrings", "lower-back"), secondary=("quads", "forearms"),
        aliases=("deficit dl",), tracks="load reps",
        instructions=(
            "Stand on a plate or low platform one to three inches high with the bar over mid-foot. "
            "Hinge down, grip just outside your knees, flatten your back and pull the slack out of "
            "the bar before it leaves the floor. Drive through the floor and keep the bar close "
            "all the way up; use only as much deficit as you can reach without your back rounding."
        ),
    ),
    ExerciseSeed(
        "Rack Pull", Equipment.barbell, "hinge",
        primary=("glutes", "lower-back"), secondary=("traps", "hamstrings", "forearms"),
        aliases=("block pull",), tracks="load reps",
        instructions=(
            "Set the bar on safety pins or blocks around knee height and stand close to it with "
            "feet hip-width apart. Grip just outside your legs, set a flat back and drive your "
            "hips forward to stand tall with the bar. Finish by squeezing your glutes rather than "
            "leaning back, and lower the bar to the pins under control."
        ),
    ),
    ExerciseSeed(
        "Stiff-Leg Deadlift", Equipment.barbell, "hinge",
        primary=("hamstrings", "glutes"), secondary=("lower-back",),
        aliases=("sldl", "stiff legged deadlift"), tracks="load reps",
        instructions=(
            "Stand with feet hip-width apart holding the bar at your thighs with a shoulder-width "
            "grip. Keeping your knees almost straight, hinge at the hips and lower the bar toward "
            "the floor, then drive your hips forward to stand. Go only as low as your hamstrings "
            "allow with a flat back; rounding to reach further takes the work off them."
        ),
    ),
    ExerciseSeed(
        "Snatch-Grip Deadlift", Equipment.barbell, "hinge",
        primary=("glutes", "hamstrings", "lower-back"), secondary=("traps", "mid-back", "quads"),
        aliases=("wide grip deadlift",), tracks="load reps",
        instructions=(
            "Set up as for a deadlift but take a very wide grip, roughly where the bar would sit "
            "in your hip crease when standing. Sit your hips lower than usual to reach the bar, "
            "flatten your back and push the floor away to stand up. Pull your shoulder blades back "
            "and down before the bar leaves the floor so your upper back does not round."
        ),
    ),
    ExerciseSeed(
        "Paused Bench Press", Equipment.barbell, "horizontal push",
        primary=("chest",), secondary=("triceps", "front-delts"),
        aliases=("pause bench",), tracks="load reps",
        instructions=(
            "Set up as for a normal bench press with your shoulder blades pinched and feet "
            "planted. Lower the bar to your chest, hold it motionless for a one- to two-second "
            "pause without letting it sink, then press it back up. Stay tight through the pause "
            "instead of relaxing onto your chest."
        ),
    ),
    ExerciseSeed(
        "Barbell Floor Press", Equipment.barbell, "horizontal push",
        primary=("chest", "triceps"), secondary=("front-delts",),
        aliases=("floor press",), tracks="load reps",
        instructions=(
            "Lie on the floor inside a rack with the bar set low, knees bent or legs straight, and "
            "unrack the bar over your chest. Lower it until your upper arms rest on the floor, "
            "pause briefly, then press back to lockout. Let your arms touch down softly rather "
            "than bouncing your elbows off the floor."
        ),
    ),
    ExerciseSeed(
        "Decline Barbell Bench Press", Equipment.barbell, "decline push",
        primary=("chest",), secondary=("triceps", "front-delts"),
        aliases=("decline bench",), tracks="load reps",
        instructions=(
            "Lock your legs under the pads of a decline bench and lie back with your shoulder "
            "blades retracted. Unrack the bar, lower it to your lower chest, then press it back up "
            "over your shoulders. Use a spotter or safeties, and control the descent so the bar "
            "does not drift toward your neck."
        ),
    ),
    ExerciseSeed(
        "Wide-Grip Bench Press", Equipment.barbell, "horizontal push",
        primary=("chest",), secondary=("front-delts", "triceps"),
        aliases=("wide bench",), tracks="load reps",
        instructions=(
            "Lie on a flat bench and grip the bar a hand-width or two wider than your usual bench "
            "grip. Lower the bar to your mid-chest under control, then press it back up. Keep your "
            "shoulder blades pinched, and do not go so wide that the bar feels unstable or your "
            "shoulders roll forward."
        ),
    ),
    ExerciseSeed(
        "Pendlay Row", Equipment.barbell, "horizontal pull",
        primary=("mid-back", "lats"), secondary=("rear-delts", "biceps", "lower-back"),
        aliases=("dead stop row",), tracks="load reps",
        instructions=(
            "Start with the bar on the floor, hinge until your torso is close to parallel and grip "
            "it just outside shoulder width with a flat back. Row it explosively to your lower "
            "chest, then return it to the floor and let it settle before the next rep. Keep your "
            "torso still; if you have to stand up to move the bar, it is too heavy."
        ),
    ),
    ExerciseSeed(
        "Reverse-Grip Barbell Row", Equipment.barbell, "horizontal pull",
        primary=("lats", "mid-back"), secondary=("biceps", "rear-delts"),
        aliases=("yates row", "underhand row"), tracks="load reps",
        instructions=(
            "Hold the bar with an underhand grip at shoulder width and hinge forward to about 45 "
            "degrees with a flat back. Row the bar to your lower stomach with your elbows close to "
            "your sides, then lower to straight arms. Hold your torso angle steady rather than "
            "jerking upright to finish each rep."
        ),
    ),
    ExerciseSeed(
        "Seal Row", Equipment.barbell, "horizontal pull",
        primary=("mid-back", "lats"), secondary=("rear-delts", "biceps"),
        aliases=("prone bench row",), tracks="load reps",
        instructions=(
            "Lie face down on a high flat bench with the barbell underneath you and grip it "
            "slightly wider than shoulder width. Row the bar up until it touches the underside of "
            "the bench, then lower it to straight arms. Keep your chest glued to the pad so the "
            "rep comes from your back, not from lifting your torso."
        ),
    ),
    ExerciseSeed(
        "T-Bar Row", Equipment.barbell, "horizontal pull",
        primary=("mid-back", "lats"), secondary=("rear-delts", "biceps"),
        aliases=("t bar row", "tbar row", "landmine row"), tracks="load reps",
        instructions=(
            "Load one end of a barbell anchored in a corner or landmine, straddle it and grip a "
            "V-handle under the plates. Hinge forward with a flat back and row the handle to your "
            "stomach, then lower to straight arms. Keep your chest up and your hips still so you "
            "pull with your back instead of heaving with your legs."
        ),
    ),
    ExerciseSeed(
        "Meadows Row", Equipment.barbell, "horizontal pull",
        primary=("lats", "mid-back"), secondary=("rear-delts", "biceps"),
        aliases=(), tracks="load reps",
        instructions=(
            "Stand side-on to a barbell anchored at one end, stagger your feet and grab the thick "
            "end of the sleeve with an overhand grip. Brace your free forearm on your front knee "
            "and row the bar up and back toward your hip, then lower to a full stretch. Let your "
            "shoulder reach down at the bottom but keep your torso from twisting as you row."
        ),
    ),
    ExerciseSeed(
        "Good Morning", Equipment.barbell, "hinge",
        primary=("hamstrings", "lower-back"), secondary=("glutes",),
        aliases=("barbell good morning",), tracks="load reps",
        instructions=(
            "Set the bar across your upper back as for a squat, feet hip-width apart and knees "
            "softly bent. Push your hips back and lower your chest until your torso nears parallel "
            "or your hamstrings stop you, then drive your hips forward to stand. Keep your back "
            "flat throughout and start light, because the long lever makes this harder than it "
            "looks."
        ),
    ),
    ExerciseSeed(
        "Box Squat", Equipment.barbell, "squat",
        primary=("quads", "glutes"), secondary=("hamstrings", "lower-back"),
        aliases=(), tracks="load reps",
        instructions=(
            "Set a box behind you at about parallel height and take the bar on your upper back "
            "with a slightly wide stance. Sit back onto the box under control, pause briefly while "
            "staying braced, then drive up to stand. Do not relax or drop onto the box; sit, stay "
            "tight and rise."
        ),
    ),
    ExerciseSeed(
        "Pause Squat", Equipment.barbell, "squat",
        primary=("quads", "glutes"), secondary=("hamstrings", "lower-back"),
        aliases=("paused squat",), tracks="load reps",
        instructions=(
            "Take the bar on your upper back as for a normal squat and brace hard. Descend to the "
            "bottom of your squat, hold completely still for one to three seconds, then drive back "
            "up. Keep your brace and position during the pause instead of relaxing into the hole."
        ),
    ),
    ExerciseSeed(
        "Overhead Squat", Equipment.barbell, "squat",
        primary=("quads", "glutes"), secondary=("front-delts", "core"),
        aliases=("ohs",), tracks="load reps",
        instructions=(
            "Press or jerk the bar overhead with a wide, snatch-width grip and lock your elbows. "
            "Squat down while actively pushing the bar up and keeping it over your mid-foot, then "
            "stand back up. Keep your arms locked and your chest tall; if the bar drifts forward, "
            "reduce the depth or the weight."
        ),
    ),
    ExerciseSeed(
        "Zercher Squat", Equipment.barbell, "squat",
        primary=("quads", "glutes"), secondary=("core", "mid-back"),
        aliases=(), tracks="load reps",
        instructions=(
            "Set the bar in a rack just below chest height and hold it in the crooks of your "
            "elbows with your hands together. Stand up, step back and squat down with an upright "
            "torso, then drive back up. Keep your elbows up and your upper back tight so the bar "
            "does not pull you forward."
        ),
    ),
    ExerciseSeed(
        "Barbell Lunge", Equipment.barbell, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=("bb lunge",), tracks="load reps",
        instructions=(
            "Take the bar on your upper back and stand tall with feet hip-width apart. Step "
            "forward and lower until your back knee is just above the floor, then push through "
            "your front foot to return to standing. Take a long enough step that your front heel "
            "stays down, and keep your torso upright."
        ),
    ),
    ExerciseSeed(
        "Barbell Reverse Lunge", Equipment.barbell, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=(), tracks="load reps",
        instructions=(
            "Take the bar on your upper back and stand tall with feet hip-width apart. Step one "
            "foot back and lower until your back knee is just above the floor, then drive through "
            "your front foot to bring your feet back together. Keep most of your weight on the "
            "front leg and your torso upright."
        ),
    ),
    ExerciseSeed(
        "Barbell Step-up", Equipment.barbell, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=(), tracks="load reps",
        instructions=(
            "Take the bar on your upper back and stand facing a sturdy box or bench about knee "
            "height. Place your whole foot on the box and drive through it to stand on top, then "
            "step down under control. Push through the top leg rather than springing off the back "
            "foot."
        ),
    ),
    ExerciseSeed(
        "Barbell Split Squat", Equipment.barbell, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=(), tracks="load reps",
        instructions=(
            "Take the bar on your upper back and set your feet in a long split stance with your "
            "back heel raised. Lower straight down until your back knee is just above the floor, "
            "then drive up through your front foot. Keep your feet in place between reps and your "
            "front knee tracking over your toes."
        ),
    ),
    ExerciseSeed(
        "Barbell Glute Bridge", Equipment.barbell, "hinge",
        primary=("glutes",), secondary=("hamstrings",),
        aliases=("bb glute bridge",), tracks="load reps",
        instructions=(
            "Lie on the floor with a padded barbell across your hips, knees bent and feet flat "
            "near your glutes. Drive through your heels to lift your hips until your body is "
            "straight from knees to shoulders, squeeze your glutes, then lower. Keep your ribs "
            "down and finish with your glutes rather than arching your lower back."
        ),
    ),
    ExerciseSeed(
        "Barbell Upright Row", Equipment.barbell, "abduction",
        primary=("side-delts", "traps"), secondary=(),
        aliases=("upright row",), tracks="load reps",
        instructions=(
            "Stand holding the bar in front of your thighs with an overhand grip slightly wider "
            "than shoulder width. Pull it up close to your body, leading with your elbows, until "
            "your upper arms are about parallel to the floor, then lower slowly. Stop at shoulder "
            "height, and widen your grip if narrow pulls feel uncomfortable in your shoulders."
        ),
    ),
    ExerciseSeed(
        "Barbell Front Raise", Equipment.barbell, "shoulder flexion",
        primary=("front-delts",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Stand holding a barbell or EZ-bar in front of your thighs with an overhand, "
            "shoulder-width grip. Raise it with nearly straight arms until it reaches eye level, "
            "then lower slowly. Keep your torso still instead of leaning back to swing the bar up."
        ),
    ),
    ExerciseSeed(
        "EZ-Bar Curl", Equipment.barbell, "elbow flexion",
        primary=("biceps",), secondary=("forearms",),
        aliases=("ez curl", "ez bar curl"), tracks="load reps",
        instructions=(
            "Stand holding an EZ-bar on the angled grips with your palms facing up and arms "
            "straight. Curl the bar toward your shoulders, then lower it until your elbows are "
            "fully straight. Keep your elbows at your sides and your body still so the biceps do "
            "the lifting."
        ),
    ),
    ExerciseSeed(
        "Drag Curl", Equipment.barbell, "elbow flexion",
        primary=("biceps",), secondary=(),
        aliases=("barbell drag curl",), tracks="load reps",
        instructions=(
            "Stand holding a barbell with an underhand, shoulder-width grip against your thighs. "
            "Curl the bar by dragging it up the front of your body while pulling your elbows back "
            "behind you, then lower it the same way. Keep the bar in contact with your torso "
            "rather than letting it swing out in an arc."
        ),
    ),
    ExerciseSeed(
        "Reverse Barbell Curl", Equipment.barbell, "elbow flexion",
        primary=("biceps", "forearms"), secondary=(),
        aliases=("reverse curl",), tracks="load reps",
        instructions=(
            "Stand holding a barbell or EZ-bar with an overhand grip at shoulder width, arms "
            "straight. Curl the bar up toward your shoulders while keeping your wrists straight, "
            "then lower it under control. Use less weight than a normal curl and keep your elbows "
            "pinned at your sides."
        ),
    ),
    ExerciseSeed(
        "Barbell Wrist Curl", Equipment.barbell, "wrist flexion",
        primary=("forearms",), secondary=(),
        aliases=("wrist curl",), tracks="load reps",
        instructions=(
            "Sit with your forearms resting on your thighs or a bench, palms up and wrists just "
            "past the edge, holding a barbell. Let the bar roll down toward your fingertips, then "
            "curl your wrists up as high as you can. Keep your forearms flat on the support so "
            "only your wrists move."
        ),
    ),
    ExerciseSeed(
        "Barbell Reverse Wrist Curl", Equipment.barbell, "wrist extension",
        primary=("forearms",), secondary=(),
        aliases=("reverse wrist curl",), tracks="load reps",
        instructions=(
            "Sit with your forearms on your thighs or a bench, palms down and wrists just past the "
            "edge, holding a light barbell. Lower the bar by bending your wrists down, then raise "
            "the backs of your hands as high as you can. Use a light weight and move slowly, since "
            "the wrist extensors are small muscles."
        ),
    ),
    ExerciseSeed(
        "JM Press", Equipment.barbell, "elbow extension",
        primary=("triceps",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Lie on a flat bench with a shoulder-width grip and the bar over your chest. Bend your "
            "elbows and lower the bar toward your chin, letting your elbows drift slightly forward "
            "until your forearms meet your upper arms, then press back up. Keep your elbows tucked "
            "and pointing toward your feet rather than flaring out."
        ),
    ),
    ExerciseSeed(
        "Barbell Snatch", Equipment.barbell, "olympic pull",
        primary=("quads", "glutes", "hamstrings"), secondary=("traps", "front-delts", "lower-back"),
        aliases=("snatch", "squat snatch"), tracks="load reps",
        instructions=(
            "Start with the bar over mid-foot, a wide grip and a flat back. Push the floor away, "
            "keep the bar close past your knees, then extend your hips explosively and pull "
            "yourself under to catch the bar overhead in a squat with locked arms. Stand up to "
            "finish, and keep the bar close, because letting it swing forward is the most common "
            "fault."
        ),
    ),
    ExerciseSeed(
        "Clean and Jerk", Equipment.barbell, "olympic pull",
        primary=("quads", "glutes", "hamstrings"), secondary=("front-delts", "triceps", "traps"),
        aliases=("c&j", "clean & jerk"), tracks="load reps",
        instructions=(
            "Clean the bar from the floor to your front shoulders, catching it in a squat and "
            "standing up. Dip a few inches with your torso upright, then drive the bar overhead "
            "and split or push your feet under it to lock it out. Keep the jerk dip straight down "
            "rather than letting your chest fall forward, and stand tall before lowering the bar."
        ),
    ),
    ExerciseSeed(
        "Hang Power Clean", Equipment.barbell, "olympic pull",
        primary=("glutes", "hamstrings"), secondary=("quads", "traps", "front-delts"),
        aliases=("hpc",), tracks="load reps",
        instructions=(
            "Stand holding the bar at hip height with a grip just outside your thighs, then hinge "
            "until the bar is just above your knees. Extend your hips, knees and ankles "
            "explosively, shrug and pull yourself under to catch the bar on your front shoulders "
            "in a quarter squat. Drive with your hips and legs first; pulling early with your arms "
            "slows the bar down."
        ),
    ),
    ExerciseSeed(
        "Barbell Thruster", Equipment.barbell, "full body",
        primary=("quads", "glutes", "front-delts"), secondary=("triceps",),
        aliases=("thruster",), tracks="load reps",
        instructions=(
            "Hold the bar in a front rack on your shoulders with your elbows high. Squat to below "
            "parallel, then drive up hard and use that momentum to press the bar overhead in one "
            "continuous motion. Lower the bar to your shoulders as you descend into the next "
            "squat, keeping your elbows up so your torso stays upright."
        ),
    ),
    ExerciseSeed(
        "Barbell Calf Raise", Equipment.barbell, "plantar flexion",
        primary=("calves",), secondary=(),
        aliases=(), tracks="load reps",
        instructions=(
            "Take a barbell on your upper back and stand with the balls of your feet on a plate or "
            "low step. Lower your heels until you feel a stretch, then rise onto your toes as high "
            "as you can. Move slowly and pause at the top, since balancing a free bar is harder "
            "than it looks."
        ),
    ),
    ExerciseSeed(
        "Push Jerk", Equipment.barbell, "vertical push",
        primary=("front-delts",), secondary=("triceps", "quads"),
        aliases=(), tracks="load reps",
        instructions=(
            "Rest the bar on your front shoulders with your hands just outside shoulder width. Dip "
            "a few inches straight down, drive up hard, then push yourself down under the rising "
            "bar and catch it with locked arms in a partial squat. Stand up to finish, and keep "
            "the dip vertical so the bar travels straight overhead."
        ),
    ),
)
