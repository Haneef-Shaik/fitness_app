"""Trap bar, landmine, sled, medicine ball, sandbag and tire work, and the
weighted versions of bodyweight moves (log only the added weight).
"""
from __future__ import annotations

from app.models import Equipment
from app.seed.exercise_library.model import ExerciseSeed

EXERCISES: tuple[ExerciseSeed, ...] = (
    ExerciseSeed(
        "Trap Bar Deadlift", Equipment.other, "hinge",
        primary=("glutes", "quads", "hamstrings"), secondary=("lower-back", "forearms"),
        aliases=("hex bar deadlift", "trap bar dl", "hex bar dl"), tracks="load reps",
        instructions=(
            "Step inside the trap bar with your feet hip-width apart and the handles in line with "
            "the middle of your feet. Hinge and bend your knees to grip the handles, flatten your "
            "back, then drive through the floor to stand tall. Keep your chest up and push with "
            "your legs; do not let your hips shoot up before the bar moves."
        ),
    ),
    ExerciseSeed(
        "Landmine Press", Equipment.other, "incline push",
        primary=("upper-chest", "front-delts"), secondary=("triceps",),
        aliases=("landmine shoulder press",), tracks="load reps",
        instructions=(
            "Anchor one end of a barbell in a landmine or corner and hold the other end at your "
            "shoulder, standing or half-kneeling. Press the bar up and forward until your arm is "
            "straight, then lower it back to your shoulder. Brace your core and squeeze your "
            "glutes so you press without leaning back or twisting."
        ),
    ),
    ExerciseSeed(
        "Landmine Rotation", Equipment.other, "rotation",
        primary=("obliques",), secondary=("abs",),
        aliases=("landmine twist", "landmine 180"), tracks="load reps",
        instructions=(
            "Anchor one end of a barbell and hold the other end with both hands at arm's length in "
            "front of your chest, feet wider than shoulder-width. Rotate the bar in an arc down to "
            "one hip, then back through the middle to the other hip, pivoting your feet. Keep your "
            "arms fairly straight and turn from your trunk and hips instead of swinging your arms."
        ),
    ),
    ExerciseSeed(
        "Landmine Squat", Equipment.other, "squat",
        primary=("quads", "glutes"), secondary=("core",),
        aliases=(), tracks="load reps",
        instructions=(
            "Anchor one end of a barbell and hold the loaded end at your chest with both hands, "
            "feet shoulder-width apart. Squat down between your knees with your chest up, then "
            "drive back up to standing. Lean into the bar slightly so it stays close to your chest "
            "throughout."
        ),
    ),
    ExerciseSeed(
        "Sled Push", Equipment.other, "full body",
        primary=("quads", "glutes"), secondary=("calves",),
        aliases=("prowler push",), tracks="load distance",
        instructions=(
            "Grip the sled's upright poles and lean in so your body forms a straight line at about "
            "45 degrees. Drive the sled forward with short, powerful steps, pushing through the "
            "balls of your feet. Keep your hips low and your back flat instead of standing up tall "
            "as you push."
        ),
    ),
    ExerciseSeed(
        "Sled Pull", Equipment.other, "full body",
        primary=("quads",), secondary=("glutes", "calves"),
        aliases=("sled drag", "backward sled drag"), tracks="load distance",
        instructions=(
            "Attach straps or a rope to the sled and hold the handles at arm's length, facing the "
            "sled. Walk backward with small steps, sitting into a quarter squat and pushing "
            "through the balls of your feet. Keep your arms straight and your chest up so your "
            "legs, not your back, move the sled."
        ),
    ),
    ExerciseSeed(
        "Sandbag Carry", Equipment.other, "carry",
        primary=("core", "mid-back"), secondary=("biceps",),
        aliases=("bear hug carry",), tracks="load distance",
        instructions=(
            "Pick the sandbag up from the floor and hug it tight to your chest with your arms "
            "wrapped underneath. Stand tall and walk forward with steady, controlled steps. Keep "
            "your upper back tight and do not lean back to rest the bag on your belly."
        ),
    ),
    ExerciseSeed(
        "Medicine Ball Slam", Equipment.other, "full body",
        primary=("lats", "abs"), secondary=("front-delts",),
        aliases=("ball slam", "med ball slam", "slam ball"), tracks="load reps",
        instructions=(
            "Stand with your feet shoulder-width apart holding a slam ball overhead with straight "
            "arms, rising onto your toes. Slam the ball down hard in front of your feet, bending "
            "at the hips and knees as you follow through. Use a non-bouncing slam ball and pick it "
            "up with a flat back each rep."
        ),
    ),
    ExerciseSeed(
        "Medicine Ball Chest Pass", Equipment.other, "horizontal push",
        primary=("chest",), secondary=("triceps", "front-delts"),
        aliases=("med ball chest pass", "chest pass"), tracks="load reps",
        instructions=(
            "Stand facing a wall or partner, holding a medicine ball at your chest with your "
            "elbows out. Push the ball straight forward explosively by extending your arms and "
            "stepping into the throw, then catch it with soft arms. Throw as fast as you can, "
            "since speed matters more than the weight of the ball."
        ),
    ),
    ExerciseSeed(
        "Wall Ball", Equipment.other, "full body",
        primary=("quads", "glutes"), secondary=("front-delts", "triceps"),
        aliases=("wall balls", "wall ball shot"), tracks="load reps",
        instructions=(
            "Stand about an arm's length from a wall holding a medicine ball at your chest. Squat "
            "below parallel, then drive up and throw the ball to a target on the wall, catching it "
            "as it comes down and sinking straight into the next squat. Keep your chest up and use "
            "your leg drive to power the throw."
        ),
    ),
    ExerciseSeed(
        "Tire Flip", Equipment.other, "full body",
        primary=("glutes", "hamstrings", "quads"), secondary=("lower-back", "front-delts"),
        aliases=("tyre flip",), tracks="load reps",
        instructions=(
            "Squat down at the tire with your chest against it and your fingers under the edge, "
            "feet back and hips below your shoulders. Drive forward and up with your legs to lift "
            "the tire, then flip your hands over and push it the rest of the way. Drive into the "
            "tire with your hips and legs instead of deadlifting it with a rounded back."
        ),
    ),
    ExerciseSeed(
        "Medicine Ball Rotational Throw", Equipment.other, "rotation",
        primary=("obliques",), secondary=("abs",),
        aliases=("rotational med ball throw", "med ball scoop toss"), tracks="load reps",
        instructions=(
            "Stand side-on to a wall about an arm's length away, holding a medicine ball at your "
            "back hip. Rotate powerfully from your back foot through your hips and trunk and throw "
            "the ball into the wall, catching it on the rebound. Let the throw start from your "
            "hips and legs, not your arms."
        ),
    ),

    # weighted bodyweight: belt or vest, log the added weight only
    ExerciseSeed(
        "Weighted Pull-up", Equipment.other, "vertical pull",
        primary=("lats",), secondary=("biceps", "mid-back"),
        aliases=("weighted pullup", "weighted chin-up"), tracks="load reps",
        instructions=(
            "Attach weight with a dip belt or hold a dumbbell between your feet, then hang from "
            "the bar with an overhand grip slightly wider than your shoulders. Pull until your "
            "chin clears the bar, then lower to straight arms. Log only the added weight as the "
            "load, and keep your body still without kicking to finish reps."
        ),
    ),
    ExerciseSeed(
        "Weighted Dip", Equipment.other, "vertical push",
        primary=("triceps", "chest"), secondary=("front-delts",),
        aliases=("weighted dips",), tracks="load reps",
        instructions=(
            "Attach weight with a dip belt or vest and support yourself on parallel bars with "
            "straight arms and your shoulders down. Lower until your upper arms are about parallel "
            "to the floor, then press back to lockout. Log only the added weight as the load, and "
            "keep the plate close so it does not swing."
        ),
    ),
)
