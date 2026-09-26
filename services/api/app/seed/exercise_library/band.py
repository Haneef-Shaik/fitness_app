"""Resistance-band movements. Reps only: a band's tension depends on how far
it is stretched, so a "load" for it would not be comparable set to set.
"""
from __future__ import annotations

from app.models import Equipment
from app.seed.exercise_library.model import ExerciseSeed

EXERCISES: tuple[ExerciseSeed, ...] = (
    ExerciseSeed(
        "Band Pull-Apart", Equipment.band, "horizontal abduction",
        primary=("rear-delts",), secondary=("mid-back",),
        aliases=("pull-apart", "band pull apart"), tracks="reps",
        instructions=(
            "Stand holding a light band at shoulder height in front of you, hands about "
            "shoulder-width apart and arms straight. Pull the band apart by moving your hands out "
            "to the sides until it touches your chest, then return slowly. Keep your shoulders "
            "down and your arms straight rather than bending your elbows."
        ),
    ),
    ExerciseSeed(
        "Band Face Pull", Equipment.band, "horizontal pull",
        primary=("rear-delts",), secondary=("mid-back",),
        aliases=(), tracks="reps",
        instructions=(
            "Anchor a band at face height and hold one end in each hand with your thumbs pointing "
            "back. Pull the band toward your face, spreading your hands apart and rotating them "
            "back so they finish beside your ears. Keep your elbows high and pause briefly at the "
            "end of each rep."
        ),
    ),
    ExerciseSeed(
        "Band Lateral Walk", Equipment.band, "hip abduction",
        primary=("glutes",), secondary=(),
        aliases=("monster walk", "lateral band walk", "banded side step"), tracks="reps",
        instructions=(
            "Place a mini band around your legs above the knees or at the ankles and sink into a "
            "quarter squat. Step sideways with one foot, then follow with the other while keeping "
            "tension on the band. Keep your feet from coming together and your toes pointing "
            "forward throughout."
        ),
    ),
    ExerciseSeed(
        "Band External Rotation", Equipment.band, "shoulder rotation",
        primary=("rear-delts",), secondary=(),
        aliases=(), tracks="reps",
        instructions=(
            "Anchor a band at elbow height and stand side-on to it, holding it in your far hand "
            "with your elbow bent 90 degrees and tucked to your side. Rotate your forearm outward "
            "away from your body, then return slowly. Keep your elbow pinned to your side so the "
            "rotation comes from your shoulder."
        ),
    ),
    ExerciseSeed(
        "Band Pushdown", Equipment.band, "elbow extension",
        primary=("triceps",), secondary=(),
        aliases=("band triceps pushdown",), tracks="reps",
        instructions=(
            "Anchor a band above head height and hold it with your elbows tucked at your sides. "
            "Push down until your arms are fully straight, then let your hands rise back under "
            "control. Keep your elbows fixed so only your forearms move."
        ),
    ),
    ExerciseSeed(
        "Band Curl", Equipment.band, "elbow flexion",
        primary=("biceps",), secondary=(),
        aliases=("resistance band curl",), tracks="reps",
        instructions=(
            "Stand on the middle of a band with your feet hip-width apart and hold the ends with "
            "your palms facing forward. Curl your hands toward your shoulders, then lower them "
            "slowly to straight arms. Keep your elbows at your sides and your torso still."
        ),
    ),
    ExerciseSeed(
        "Band Good Morning", Equipment.band, "hinge",
        primary=("hamstrings", "glutes"), secondary=("lower-back",),
        aliases=(), tracks="reps",
        instructions=(
            "Stand on a band with your feet hip-width apart and loop the other end behind your "
            "neck across your upper back. With soft knees, push your hips back and lower your "
            "chest until you feel a hamstring stretch, then drive your hips forward to stand. Keep "
            "your back flat throughout."
        ),
    ),
    ExerciseSeed(
        "Banded Glute Bridge", Equipment.band, "hinge",
        primary=("glutes",), secondary=("hamstrings",),
        aliases=("band glute bridge",), tracks="reps",
        instructions=(
            "Lie on your back with a mini band just above your knees, knees bent and feet flat "
            "about hip-width apart. Press your knees out against the band and drive through your "
            "heels to lift your hips, squeeze at the top, then lower. Keep tension on the band the "
            "whole time so your knees do not cave in."
        ),
    ),
    ExerciseSeed(
        "Band Clamshell", Equipment.band, "hip abduction",
        primary=("glutes",), secondary=(),
        aliases=("clamshell", "clam"), tracks="reps",
        instructions=(
            "Lie on your side with a mini band above your knees, hips and knees bent and feet "
            "together. Keeping your feet touching, lift your top knee as high as you can, then "
            "lower slowly. Keep your hips stacked and do not roll backward as the knee opens."
        ),
    ),
    ExerciseSeed(
        "Band Row", Equipment.band, "horizontal pull",
        primary=("mid-back", "lats"), secondary=("biceps",),
        aliases=("banded row",), tracks="reps",
        instructions=(
            "Anchor a band at chest height, or sit and loop it around your feet, holding one end "
            "in each hand. Row your hands toward your ribs while squeezing your shoulder blades "
            "together, then let your arms extend slowly. Keep your torso still rather than leaning "
            "back to stretch the band."
        ),
    ),
)
