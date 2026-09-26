"""Kettlebell movements.
"""
from __future__ import annotations

from app.models import Equipment
from app.seed.exercise_library.model import ExerciseSeed

EXERCISES: tuple[ExerciseSeed, ...] = (
    ExerciseSeed(
        "Kettlebell Swing", Equipment.kettlebell, "hinge",
        primary=("glutes", "hamstrings"), secondary=("lower-back",),
        aliases=("kb swing", "russian swing"), tracks="load reps",
        instructions=(
            "Stand with your feet a little wider than hip-width and the kettlebell a foot in front "
            "of you. Hinge, hike the bell back between your legs, then snap your hips forward to "
            "float it to about chest height with straight arms, and let it swing back into the "
            "next hinge. Hinge rather than squat, and let your hips, not your arms, lift the bell."
        ),
    ),
    ExerciseSeed(
        "Single-Arm Kettlebell Swing", Equipment.kettlebell, "hinge",
        primary=("glutes", "hamstrings"), secondary=("obliques", "forearms"),
        aliases=("one-arm kb swing",), tracks="load reps",
        instructions=(
            "Set up as for a two-handed swing and grip the handle with one hand. Hike the bell "
            "back, snap your hips forward to swing it to chest height, then let it fall back "
            "between your legs. Keep your shoulders square and resist the bell twisting your "
            "torso."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Goblet Squat", Equipment.kettlebell, "squat",
        primary=("quads", "glutes"), secondary=("core",),
        aliases=("kb goblet squat",), tracks="load reps",
        instructions=(
            "Hold a kettlebell by the horns close to your chest with your feet about "
            "shoulder-width apart. Squat down between your knees with your chest up until your "
            "elbows reach the inside of your knees, then stand back up. Keep your heels flat and "
            "the bell tight to your body."
        ),
    ),
    ExerciseSeed(
        "Turkish Get-up", Equipment.kettlebell, "full body",
        primary=("front-delts", "obliques"), secondary=("abs", "glutes"),
        aliases=("tgu", "get-up"), tracks="load reps",
        instructions=(
            "Lie on your back holding a kettlebell straight up in one hand, with the same-side "
            "knee bent. With your arm locked and eyes on the bell, roll to your elbow, then your "
            "hand, lift your hips, sweep your leg under to a kneel and stand up, then reverse the "
            "steps. Move slowly and keep the bell stacked over your shoulder throughout."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Snatch", Equipment.kettlebell, "olympic pull",
        primary=("glutes", "hamstrings"), secondary=("front-delts", "traps"),
        aliases=("kb snatch",), tracks="load reps",
        instructions=(
            "Start as for a one-arm swing with the bell a little in front of you. Hike it back, "
            "drive your hips forward and guide the bell close to your body as it rises, punching "
            "your hand through to lock out overhead. Keep the bell close so it rolls softly onto "
            "your forearm instead of flipping over and crashing into your wrist."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Clean", Equipment.kettlebell, "olympic pull",
        primary=("glutes", "hamstrings"), secondary=("forearms",),
        aliases=("kb clean",), tracks="load reps",
        instructions=(
            "Start with the kettlebell between your feet, then hinge and grip it with one hand. "
            "Hike it back, drive your hips forward and pull it up close to your body, letting it "
            "roll around your hand into the rack position against your chest and forearm. Keep "
            "your elbow tucked and the bell close so it does not bang against your wrist."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Clean and Press", Equipment.kettlebell, "full body",
        primary=("glutes", "front-delts"), secondary=("hamstrings", "triceps"),
        aliases=("kb clean and press",), tracks="load reps",
        instructions=(
            "Clean the kettlebell from between your feet to the rack position at your shoulder. "
            "Brace, press it straight overhead until your arm is locked, then lower it back to the "
            "rack before returning it between your legs. Squeeze your glutes during the press so "
            "you do not lean back."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Press", Equipment.kettlebell, "vertical push",
        primary=("front-delts",), secondary=("triceps", "side-delts"),
        aliases=("kb press", "kettlebell overhead press"), tracks="load reps",
        instructions=(
            "Hold a kettlebell in the rack position at your shoulder with your wrist straight and "
            "elbow tucked. Press it overhead with your forearm vertical until your arm is locked "
            "out beside your head, then lower it back to the rack. Brace your abs and squeeze your "
            "glutes so you press without leaning back."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Front Squat", Equipment.kettlebell, "squat",
        primary=("quads", "glutes"), secondary=("core",),
        aliases=("kb front squat", "front rack squat"), tracks="load reps",
        instructions=(
            "Clean one or two kettlebells into the rack position at your shoulders. Squat down "
            "with an upright torso until your thighs are at least parallel, then drive back up. "
            "Keep your elbows tucked and your chest up so the bells do not pull you forward."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Deadlift", Equipment.kettlebell, "hinge",
        primary=("glutes", "hamstrings"), secondary=("quads", "lower-back"),
        aliases=("kb deadlift",), tracks="load reps",
        instructions=(
            "Stand with the kettlebell between your feet and your feet hip-width apart. Hinge at "
            "your hips, bend your knees slightly and grip the handle with a flat back, then drive "
            "through your feet to stand tall. Keep your shoulders over the bell and your back flat "
            "as you lift and lower."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Single-Leg Deadlift", Equipment.kettlebell, "hinge",
        primary=("hamstrings", "glutes"), secondary=(),
        aliases=("kb single-leg rdl",), tracks="load reps",
        instructions=(
            "Stand on one leg with a soft knee, holding a kettlebell in the opposite hand. Hinge "
            "forward at the hip as your free leg reaches straight back, lowering the bell toward "
            "the floor, then stand back up. Keep your hips square and your back flat rather than "
            "twisting open toward the raised leg."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Row", Equipment.kettlebell, "horizontal pull",
        primary=("lats", "mid-back"), secondary=("biceps", "rear-delts"),
        aliases=("kb row",), tracks="load reps",
        instructions=(
            "Brace one hand on a bench or your front knee in a staggered stance, holding a "
            "kettlebell in the other hand with your arm hanging straight. Row the bell toward your "
            "hip by driving your elbow back, then lower to a full stretch. Keep your torso still "
            "and square to the floor."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Windmill", Equipment.kettlebell, "hinge",
        primary=("obliques",), secondary=("glutes", "hamstrings"),
        aliases=("kb windmill",), tracks="load reps",
        instructions=(
            "Press a kettlebell overhead in one hand and turn both feet about 45 degrees away from "
            "that arm. Push your hip out toward the bell side and fold sideways, sliding your free "
            "hand down the inside of your front leg while watching the bell, then drive your hips "
            "back to stand. Keep the top arm locked and vertical throughout."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Halo", Equipment.kettlebell, "shoulder rotation",
        primary=("shoulders",), secondary=(),
        aliases=("kb halo",), tracks="load reps",
        instructions=(
            "Hold a light kettlebell upside down by the horns in front of your chest. Circle it "
            "around your head, keeping it close as it passes behind your neck, then return to the "
            "front and reverse direction. Keep your ribs down and your hips still so only your "
            "arms move."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Farmer's Carry", Equipment.kettlebell, "carry",
        primary=("forearms", "traps"), secondary=("core",),
        aliases=("kb farmer's carry", "kb carry"), tracks="load distance",
        instructions=(
            "Deadlift a heavy kettlebell in each hand and stand tall with them at your sides. Walk "
            "forward with short, steady steps, shoulders back and core braced. Keep the bells from "
            "swinging and do not let them pull your shoulders forward."
        ),
    ),
    ExerciseSeed(
        "Kettlebell High Pull", Equipment.kettlebell, "olympic pull",
        primary=("glutes", "traps"), secondary=("hamstrings", "side-delts"),
        aliases=("kb high pull",), tracks="load reps",
        instructions=(
            "Stand with your feet wider than hip-width and the kettlebell between your feet. Hinge "
            "and grip it with one or both hands, then drive your hips forward explosively and pull "
            "the bell to chest height with your elbows high and wide. Let the hip drive do most of "
            "the work and keep the bell close to your body."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Thruster", Equipment.kettlebell, "full body",
        primary=("quads", "glutes", "front-delts"), secondary=("triceps",),
        aliases=("kb thruster",), tracks="load reps",
        instructions=(
            "Hold one or two kettlebells in the rack position at your shoulders. Squat to parallel "
            "or below, then drive up and use that momentum to press the bells overhead in one "
            "motion. Return the bells to the rack as you descend into the next squat, keeping your "
            "elbows up and chest tall."
        ),
    ),
    ExerciseSeed(
        "Kettlebell Gorilla Row", Equipment.kettlebell, "horizontal pull",
        primary=("lats", "mid-back"), secondary=("biceps",),
        aliases=("gorilla row",), tracks="load reps",
        instructions=(
            "Place two kettlebells between your feet, take a wide stance and hinge until your "
            "torso is close to parallel with a flat back. Row one bell to your hip while pressing "
            "down on the other, then lower it and alternate sides. Keep your hips square and your "
            "back flat instead of twisting as you pull."
        ),
    ),
)
