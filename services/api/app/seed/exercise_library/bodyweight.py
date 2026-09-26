"""Bodyweight movements, unweighted (weighted variants are in `other`).
"""
from __future__ import annotations

from app.models import Equipment
from app.seed.exercise_library.model import ExerciseSeed

EXERCISES: tuple[ExerciseSeed, ...] = (
    ExerciseSeed(
        "Diamond Push-up", Equipment.bodyweight, "horizontal push",
        primary=("triceps", "chest"), secondary=("front-delts",),
        aliases=("close-grip push-up", "triangle push-up"), tracks="reps",
        instructions=(
            "Get into a push-up position with your hands together under your chest, thumbs and "
            "index fingers forming a diamond. Lower your chest to your hands with your elbows "
            "close to your body, then push back up. Keep your body in a straight line from head to "
            "heels without letting your hips sag."
        ),
    ),
    ExerciseSeed(
        "Wide Push-up", Equipment.bodyweight, "horizontal push",
        primary=("chest",), secondary=("front-delts", "triceps"),
        aliases=("wide-grip push-up",), tracks="reps",
        instructions=(
            "Get into a push-up position with your hands noticeably wider than your shoulders. "
            "Lower your chest toward the floor under control, then press back up. Keep your body "
            "straight and your elbows angled slightly back rather than flared straight out to the "
            "sides."
        ),
    ),
    ExerciseSeed(
        "Decline Push-up", Equipment.bodyweight, "incline push",
        primary=("upper-chest",), secondary=("front-delts", "triceps"),
        aliases=("feet-elevated push-up",), tracks="reps",
        instructions=(
            "Place your feet on a bench or step and your hands on the floor slightly wider than "
            "your shoulders. Lower your chest toward the floor, then push back up to straight "
            "arms. Brace your abs and glutes so your hips do not sag as the angle gets steeper."
        ),
    ),
    ExerciseSeed(
        "Incline Push-up", Equipment.bodyweight, "horizontal push",
        primary=("chest",), secondary=("triceps", "front-delts"),
        aliases=("hands-elevated push-up",), tracks="reps",
        instructions=(
            "Place your hands on a bench, box or sturdy counter slightly wider than your shoulders "
            "and walk your feet back until your body is straight. Lower your chest to the edge, "
            "then push back up. The higher the surface, the easier the rep, so pick a height where "
            "you can keep your body straight."
        ),
    ),
    ExerciseSeed(
        "Archer Push-up", Equipment.bodyweight, "horizontal push",
        primary=("chest",), secondary=("triceps", "front-delts"),
        aliases=(), tracks="reps",
        instructions=(
            "Get into a push-up position with your hands set very wide. Lower your chest toward "
            "one hand while the other arm straightens out to the side, then press back up and "
            "alternate sides. Keep your hips level and your body straight throughout."
        ),
    ),
    ExerciseSeed(
        "Handstand Push-up", Equipment.bodyweight, "vertical push",
        primary=("front-delts",), secondary=("triceps", "side-delts"),
        aliases=("hspu",), tracks="reps",
        instructions=(
            "Kick up into a handstand against a wall with your hands about shoulder-width apart. "
            "Lower yourself under control until your head lightly touches the floor or a pad, then "
            "press back up to straight arms. Keep your core tight and your body stacked so you do "
            "not arch heavily against the wall."
        ),
    ),
    ExerciseSeed(
        "Wide-Grip Pull-up", Equipment.bodyweight, "vertical pull",
        primary=("lats",), secondary=("mid-back", "biceps"),
        aliases=("wide pull-up",), tracks="reps",
        instructions=(
            "Hang from the bar with an overhand grip clearly wider than your shoulders. Pull your "
            "chest toward the bar by driving your elbows down and out until your chin clears it, "
            "then lower to straight arms. Start each rep by pulling your shoulders down, and do "
            "not swing your legs."
        ),
    ),
    ExerciseSeed(
        "Neutral-Grip Pull-up", Equipment.bodyweight, "vertical pull",
        primary=("lats",), secondary=("biceps", "mid-back"),
        aliases=("hammer grip pull-up", "parallel grip pull-up"), tracks="reps",
        instructions=(
            "Hang from parallel handles with your palms facing each other and your arms straight. "
            "Pull yourself up until your chin clears the handles, driving your elbows down to your "
            "sides, then lower to a full hang. Keep your body still and do not kick to finish the "
            "rep."
        ),
    ),
    ExerciseSeed(
        "Muscle-up", Equipment.bodyweight, "vertical pull",
        primary=("lats", "triceps"), secondary=("chest", "biceps"),
        aliases=("bar muscle-up",), tracks="reps",
        instructions=(
            "Hang from a bar with a false or overhand grip about shoulder-width apart. Pull "
            "explosively toward your lower chest, then lean your chest over the bar and press "
            "yourself up to straight arms above it. Lower back to a hang under control, and build "
            "strict pull-ups and dips before attempting it."
        ),
    ),
    ExerciseSeed(
        "Bench Dip", Equipment.bodyweight, "vertical push",
        primary=("triceps",), secondary=("front-delts",),
        aliases=("chair dip",), tracks="reps",
        instructions=(
            "Sit on the edge of a bench, place your hands beside your hips and slide off with your "
            "legs extended or knees bent. Lower yourself by bending your elbows until your upper "
            "arms are about parallel to the floor, then press back up. Keep your back close to the "
            "bench and do not sink lower than your shoulders comfortably allow."
        ),
    ),
    ExerciseSeed(
        "Bodyweight Lunge", Equipment.bodyweight, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=("forward lunge", "bw lunge"), tracks="reps",
        instructions=(
            "Stand tall with your feet hip-width apart and hands on your hips. Step forward and "
            "lower until both knees are bent about 90 degrees, then push through your front foot "
            "to return to standing. Keep your torso upright and your front heel planted."
        ),
    ),
    ExerciseSeed(
        "Bodyweight Reverse Lunge", Equipment.bodyweight, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=("reverse lunge",), tracks="reps",
        instructions=(
            "Stand tall with your feet hip-width apart. Step one foot back and lower until your "
            "back knee is just above the floor, then drive through your front foot to bring your "
            "feet together. Keep most of your weight on the front leg and your torso upright."
        ),
    ),
    ExerciseSeed(
        "Jump Squat", Equipment.bodyweight, "plyometric",
        primary=("quads", "glutes"), secondary=("calves",),
        aliases=("squat jump",), tracks="reps",
        instructions=(
            "Stand with your feet shoulder-width apart and arms ready to swing. Squat to about "
            "parallel, then jump as high as you can, driving your arms up. Land softly on the "
            "balls of your feet and sink straight into the next squat with your knees tracking "
            "over your toes."
        ),
    ),
    ExerciseSeed(
        "Bodyweight Step-up", Equipment.bodyweight, "lunge",
        primary=("quads", "glutes"), secondary=("hamstrings",),
        aliases=("step-up", "box step-up"), tracks="reps",
        instructions=(
            "Stand facing a sturdy box or bench about knee height. Place your whole foot on top "
            "and drive through that heel to stand up on the box, then step back down with control. "
            "Push with the top leg instead of springing off the bottom foot."
        ),
    ),
    ExerciseSeed(
        "Wall Sit", Equipment.bodyweight, "squat",
        primary=("quads",), secondary=(),
        aliases=("wall squat",), tracks="duration",
        instructions=(
            "Lean your back flat against a wall, walk your feet out and slide down until your "
            "thighs are about parallel to the floor. Hold the position with your knees over your "
            "ankles and your weight in your heels. Keep your back pressed to the wall and your "
            "hands off your thighs."
        ),
    ),
    ExerciseSeed(
        "Single-Leg Glute Bridge", Equipment.bodyweight, "hinge",
        primary=("glutes",), secondary=("hamstrings",),
        aliases=("one-leg glute bridge",), tracks="reps",
        instructions=(
            "Lie on your back with one knee bent and that foot flat, the other leg straight or "
            "held up with the knee bent. Drive through the planted heel to lift your hips until "
            "your body is straight from knee to shoulder, then lower. Keep your hips level so they "
            "do not drop toward the unsupported side."
        ),
    ),
    ExerciseSeed(
        "Nordic Hamstring Curl", Equipment.bodyweight, "knee flexion",
        primary=("hamstrings",), secondary=(),
        aliases=("nordic curl", "nordics"), tracks="reps",
        instructions=(
            "Kneel on a pad with your ankles anchored under something solid or held by a partner, "
            "body upright. Slowly lower your torso toward the floor by straightening your knees, "
            "keeping a straight line from knees to head, and catch yourself with your hands. "
            "Resist the fall for as long as you can, then push off lightly and pull back up with "
            "your hamstrings."
        ),
    ),
    ExerciseSeed(
        "Crunch", Equipment.bodyweight, "spinal flexion",
        primary=("abs",), secondary=(),
        aliases=("crunches",), tracks="reps",
        instructions=(
            "Lie on your back with your knees bent, feet flat and hands lightly behind your head "
            "or across your chest. Curl your head and shoulders off the floor by pulling your ribs "
            "toward your hips, then lower slowly. Do not pull on your neck; let your abs do the "
            "lifting."
        ),
    ),
    ExerciseSeed(
        "Sit-up", Equipment.bodyweight, "spinal flexion",
        primary=("abs",), secondary=("hip-flexors",),
        aliases=("situp",), tracks="reps",
        instructions=(
            "Lie on your back with your knees bent and feet flat, anchored if needed, and your "
            "arms crossed on your chest. Curl your torso up until your chest is near your thighs, "
            "then lower back down slowly. Roll up one segment at a time rather than jerking up "
            "with a flat back."
        ),
    ),
    ExerciseSeed(
        "Bicycle Crunch", Equipment.bodyweight, "rotation",
        primary=("abs", "obliques"), secondary=(),
        aliases=("bicycles", "bicycle kicks"), tracks="reps",
        instructions=(
            "Lie on your back with your hands lightly behind your head, knees bent and shins "
            "parallel to the floor. Bring one elbow toward the opposite knee while extending the "
            "other leg, then switch sides in a pedaling motion. Rotate through your ribs rather "
            "than yanking your head forward with your hands."
        ),
    ),
    ExerciseSeed(
        "Russian Twist", Equipment.bodyweight, "rotation",
        primary=("obliques",), secondary=("abs",),
        aliases=(), tracks="reps",
        instructions=(
            "Sit with your knees bent and lean back to about 45 degrees with a straight back, feet "
            "lifted or heels on the floor. Rotate your torso to bring your hands beside one hip, "
            "then the other. Turn your ribcage, not just your arms, and keep your back from "
            "rounding."
        ),
    ),
    ExerciseSeed(
        "Mountain Climber", Equipment.bodyweight, "hip flexion",
        primary=("abs", "hip-flexors"), secondary=(),
        aliases=("mountain climbers",), tracks="duration",
        instructions=(
            "Start in a high plank with your hands under your shoulders and your body straight. "
            "Drive one knee toward your chest, then switch legs quickly in a running motion. Keep "
            "your hips low and level instead of bouncing them up and down."
        ),
    ),
    ExerciseSeed(
        "Burpee", Equipment.bodyweight, "full body",
        primary=("quads", "glutes", "chest"), secondary=("triceps", "front-delts"),
        aliases=("burpees",), tracks="reps",
        instructions=(
            "Stand with your feet shoulder-width apart, squat down and place your hands on the "
            "floor. Jump your feet back into a plank, lower your chest to the floor and push back "
            "up, then jump your feet to your hands and leap up with your arms overhead. Land "
            "softly and keep your core braced so your hips do not sag in the plank."
        ),
    ),
    ExerciseSeed(
        "Dead Bug", Equipment.bodyweight, "anti-extension",
        primary=("abs",), secondary=(),
        aliases=("deadbug",), tracks="reps",
        instructions=(
            "Lie on your back with your arms pointing at the ceiling and your knees bent 90 "
            "degrees above your hips. Slowly lower one arm overhead and the opposite leg toward "
            "the floor, then return and switch sides. Keep your lower back pressed into the floor "
            "and only go as low as you can without it lifting."
        ),
    ),
    ExerciseSeed(
        "Bird Dog", Equipment.bodyweight, "anti-rotation",
        primary=("lower-back", "glutes"), secondary=("abs",),
        aliases=(), tracks="reps",
        instructions=(
            "Start on your hands and knees with your hands under your shoulders and knees under "
            "your hips. Reach one arm forward and the opposite leg back until both are in line "
            "with your torso, pause, then return and switch sides. Keep your hips level and your "
            "back flat rather than rotating or arching to reach further."
        ),
    ),
    ExerciseSeed(
        "Superman", Equipment.bodyweight, "spinal extension",
        primary=("lower-back",), secondary=("glutes",),
        aliases=(), tracks="reps",
        instructions=(
            "Lie face down with your arms extended overhead and your legs straight. Lift your "
            "arms, chest and legs a few inches off the floor by squeezing your back and glutes, "
            "hold briefly, then lower. Keep your neck in line by looking at the floor rather than "
            "craning your head up."
        ),
    ),
    ExerciseSeed(
        "V-up", Equipment.bodyweight, "spinal flexion",
        primary=("abs",), secondary=("hip-flexors",),
        aliases=("v-ups", "jackknife"), tracks="reps",
        instructions=(
            "Lie on your back with your arms overhead and legs straight. In one motion, lift your "
            "legs and torso and reach your hands toward your feet so your body forms a V, then "
            "lower back down under control. Keep your legs straight and do not slam back to the "
            "floor between reps."
        ),
    ),
    ExerciseSeed(
        "Toes-to-Bar", Equipment.bodyweight, "hip flexion",
        primary=("abs",), secondary=("hip-flexors", "lats"),
        aliases=("t2b", "ttb"), tracks="reps",
        instructions=(
            "Hang from a pull-up bar with straight arms and a grip about shoulder-width apart. "
            "Brace your abs, press down on the bar with straight arms and raise your feet until "
            "your toes touch the bar, then lower with control. Curl your pelvis up as you lift so "
            "your abs, not just momentum, bring your feet to the bar."
        ),
    ),
    ExerciseSeed(
        "Hanging Knee Raise", Equipment.bodyweight, "hip flexion",
        primary=("abs",), secondary=("hip-flexors",),
        aliases=("knee raise",), tracks="reps",
        instructions=(
            "Hang from a pull-up bar with a shoulder-width grip and your body still. Draw your "
            "knees up toward your chest, curling your pelvis at the top, then lower slowly to a "
            "full hang. Control the descent so your body does not swing between reps."
        ),
    ),
    ExerciseSeed(
        "L-Sit", Equipment.bodyweight, "hip flexion",
        primary=("abs", "hip-flexors"), secondary=("triceps",),
        aliases=("l-sit hold",), tracks="duration",
        instructions=(
            "Support yourself on parallettes, dip bars or the floor with straight arms and your "
            "shoulders pushed down. Lift your legs straight out in front of you until they are "
            "parallel to the floor and hold. Keep your arms locked and shoulders down, and tuck "
            "your knees if your legs start to drop."
        ),
    ),
    ExerciseSeed(
        "Flutter Kicks", Equipment.bodyweight, "hip flexion",
        primary=("abs",), secondary=("hip-flexors",),
        aliases=(), tracks="duration",
        instructions=(
            "Lie on your back with your legs straight and your hands under your hips or at your "
            "sides. Lift your heels a few inches off the floor and kick your legs up and down in "
            "small, quick alternating movements. Keep your lower back pressed to the floor, and "
            "raise your legs higher if it starts to arch."
        ),
    ),
    ExerciseSeed(
        "Reverse Crunch", Equipment.bodyweight, "spinal flexion",
        primary=("abs",), secondary=(),
        aliases=(), tracks="reps",
        instructions=(
            "Lie on your back with your arms at your sides and your knees bent 90 degrees and "
            "lifted over your hips. Curl your hips off the floor by pulling your knees toward your "
            "chest, then lower your hips slowly. Roll your pelvis up with your abs instead of "
            "swinging your legs for momentum."
        ),
    ),
    ExerciseSeed(
        "Bodyweight Calf Raise", Equipment.bodyweight, "plantar flexion",
        primary=("calves",), secondary=(),
        aliases=("bw calf raise",), tracks="reps",
        instructions=(
            "Stand with the balls of your feet on a step, holding a wall or rail for balance. "
            "Lower your heels below the step for a full stretch, then rise onto your toes as high "
            "as you can. Pause at the top instead of bouncing, and work one leg at a time to make "
            "it harder."
        ),
    ),
    ExerciseSeed(
        "Box Jump", Equipment.bodyweight, "plyometric",
        primary=("quads", "glutes"), secondary=("calves", "hamstrings"),
        aliases=("box jumps",), tracks="reps",
        instructions=(
            "Stand facing a sturdy box about a foot away with your feet hip-width apart. Swing "
            "your arms and dip into a quarter squat, then jump onto the box and land softly in a "
            "squat with your whole foot on top. Stand up fully, then step down rather than jumping "
            "back off."
        ),
    ),
    ExerciseSeed(
        "Broad Jump", Equipment.bodyweight, "plyometric",
        primary=("glutes", "quads"), secondary=("hamstrings", "calves"),
        aliases=("standing long jump",), tracks="reps",
        instructions=(
            "Stand with your feet hip-width apart and arms ready to swing. Swing your arms back as "
            "you dip into a quarter squat, then jump forward as far as you can, driving your arms "
            "forward. Land softly on both feet with your knees bent and tracking over your toes, "
            "and hold the landing before the next rep."
        ),
    ),
    ExerciseSeed(
        "Bear Crawl", Equipment.bodyweight, "full body",
        primary=("front-delts", "abs"), secondary=("quads",),
        aliases=(), tracks="duration distance",
        instructions=(
            "Start on your hands and toes with your knees bent 90 degrees and hovering a few "
            "inches off the floor. Crawl forward by moving your opposite hand and foot together in "
            "small steps. Keep your back flat and your hips low and level, as if balancing a glass "
            "on your lower back."
        ),
    ),
    ExerciseSeed(
        "Copenhagen Plank", Equipment.bodyweight, "anti-lateral flexion",
        primary=("adductors",), secondary=("obliques",),
        aliases=("copenhagen", "copenhagen adductor plank"), tracks="duration",
        instructions=(
            "Lie on your side with your forearm under your shoulder and your top leg resting on a "
            "bench at the knee or ankle. Press that leg down into the bench to lift your hips "
            "until your body forms a straight line, and hold. Keep your hips from sagging; "
            "supporting at the knee is easier than at the ankle."
        ),
    ),
    ExerciseSeed(
        "Dragon Flag", Equipment.bodyweight, "anti-extension",
        primary=("abs",), secondary=(),
        aliases=(), tracks="reps",
        instructions=(
            "Lie on a bench and grip it behind your head, then lift your body so only your upper "
            "back and shoulders touch the bench. Lower your body slowly as one straight line until "
            "it hovers just above the bench, then raise it back up. Keep your hips from bending; "
            "if you cannot stay straight, bend your knees to make it easier."
        ),
    ),
    ExerciseSeed(
        "Cossack Squat", Equipment.bodyweight, "lunge",
        primary=("quads", "glutes", "adductors"), secondary=(),
        aliases=(), tracks="reps",
        instructions=(
            "Stand with a very wide stance and your toes turned slightly out. Shift your weight to "
            "one side and squat down over that leg while the other leg straightens with its toes "
            "pointing up, then push back up and switch sides. Keep the heel of the bending leg "
            "flat and your chest up."
        ),
    ),
    ExerciseSeed(
        "Dead Hang", Equipment.bodyweight, "vertical pull",
        primary=("forearms",), secondary=(),
        aliases=("bar hang",), tracks="duration",
        instructions=(
            "Grab a pull-up bar with an overhand grip about shoulder-width apart. Lift your feet "
            "and hang with your arms straight and your body still. Keep a firm grip and your "
            "shoulders lightly engaged rather than letting them shrug all the way up to your ears."
        ),
    ),
    ExerciseSeed(
        "Sissy Squat", Equipment.bodyweight, "squat",
        primary=("quads",), secondary=(),
        aliases=(), tracks="reps",
        instructions=(
            "Stand holding a post or wall for balance with your feet hip-width apart and rise onto "
            "the balls of your feet. Lean back as you bend your knees forward, lowering until your "
            "knees are well past your toes with a straight line from knees to shoulders, then rise "
            "back up. Keep your hips extended rather than sitting back."
        ),
    ),
    ExerciseSeed(
        "Jumping Lunge", Equipment.bodyweight, "plyometric",
        primary=("quads", "glutes"), secondary=("hamstrings", "calves"),
        aliases=("split jump", "lunge jump"), tracks="reps",
        instructions=(
            "Start in a lunge with one foot forward and both knees bent. Jump straight up "
            "explosively, switch your legs in the air and land softly in a lunge with the other "
            "foot forward. Land with your front knee tracking over your toes and sink smoothly "
            "into the next rep."
        ),
    ),
)
