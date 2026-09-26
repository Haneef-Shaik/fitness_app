"""Cardio. Treadmill, bike, rower, elliptical, stair climber and ski erg are
`machine`; running, walking and swimming are `bodyweight`; jump rope and
battle ropes are `other`. Tracked by duration and distance.
"""
from __future__ import annotations

from app.models import Equipment
from app.seed.exercise_library.model import ExerciseSeed

EXERCISES: tuple[ExerciseSeed, ...] = (
    ExerciseSeed(
        "Outdoor Run", Equipment.bodyweight, "cardio",
        primary=("quads", "calves"), secondary=("glutes", "hamstrings"),
        aliases=("running", "run", "jog", "jogging"), tracks="duration distance",
        instructions=(
            "Stand tall with a slight forward lean from the ankles and relaxed shoulders. Land "
            "with your feet under your hips rather than far out in front, and keep a quick, light "
            "stride. Pick a pace you can hold for the whole distance; on easy runs you should be "
            "able to talk in full sentences."
        ),
    ),
    ExerciseSeed(
        "Treadmill Run", Equipment.machine, "cardio",
        primary=("quads", "calves"), secondary=("glutes", "hamstrings"),
        aliases=("treadmill",), tracks="duration distance",
        instructions=(
            "Start the belt at a walking pace, step on and build up to your running speed. Run "
            "tall in the middle of the belt with short, quick strides that land under your hips. "
            "Do not hold the rails, and set a small incline if you want the effort to feel more "
            "like running outdoors."
        ),
    ),
    ExerciseSeed(
        "Treadmill Incline Walk", Equipment.machine, "cardio",
        primary=("glutes", "calves"), secondary=("hamstrings", "quads"),
        aliases=("incline walk", "12-3-30"), tracks="duration distance",
        instructions=(
            "Set the treadmill to a steep incline and a brisk walking speed. Walk tall with a "
            "natural arm swing, pushing through your whole foot on each step. Keep your hands off "
            "the rails; if you need to hold on, lower the incline or the speed."
        ),
    ),
    ExerciseSeed(
        "Walking", Equipment.bodyweight, "cardio",
        primary=("quads", "calves"), secondary=("glutes", "hamstrings"),
        aliases=("walk",), tracks="duration distance",
        instructions=(
            "Stand tall with your shoulders relaxed and your eyes looking ahead. Walk at a brisk, "
            "steady pace, landing on your heel and rolling through to push off your toes with an "
            "easy arm swing. Aim for a pace where you breathe harder than at rest but can still "
            "hold a conversation."
        ),
    ),
    ExerciseSeed(
        "Hiking", Equipment.bodyweight, "cardio",
        primary=("quads", "glutes"), secondary=("calves", "hamstrings"),
        aliases=("hike",), tracks="duration distance",
        instructions=(
            "Wear supportive footwear and adjust your pack so the weight sits close to your back. "
            "Take shorter steps on climbs, pushing through your whole foot, and keep your knees "
            "soft on descents. Hold a pace you can sustain while breathing steadily, and slow down "
            "on steep or uneven ground."
        ),
    ),
    ExerciseSeed(
        "Outdoor Cycling", Equipment.other, "cardio",
        primary=("quads",), secondary=("glutes", "hamstrings", "calves"),
        aliases=("cycling", "bike ride", "road cycling"), tracks="duration distance",
        instructions=(
            "Set your saddle so your knee is slightly bent at the bottom of the pedal stroke and "
            "hold the bars with relaxed arms. Pedal in smooth circles, shifting gears to keep a "
            "steady cadence on hills. Hold a steady effort rather than grinding big gears at a "
            "slow cadence."
        ),
    ),
    ExerciseSeed(
        "Stationary Bike", Equipment.machine, "cardio",
        primary=("quads",), secondary=("glutes", "hamstrings", "calves"),
        aliases=("exercise bike", "spin bike", "indoor cycling"), tracks="duration distance",
        instructions=(
            "Adjust the seat so your knee stays slightly bent at the bottom of each pedal stroke "
            "and the handlebars are within easy reach. Pedal in smooth circles with your upper "
            "body relaxed and still. Set the resistance so you can keep a steady cadence without "
            "bouncing in the saddle."
        ),
    ),
    ExerciseSeed(
        "Air Bike", Equipment.machine, "cardio",
        primary=("quads",), secondary=("glutes", "front-delts", "lats"),
        aliases=("assault bike", "echo bike", "fan bike"), tracks="duration distance",
        instructions=(
            "Set the seat so your knee is slightly bent at the bottom of the stroke and grab the "
            "moving handles. Push and pull the handles as you pedal, driving with your arms and "
            "legs together. The fan resistance rises with effort, so pace hard intervals "
            "deliberately rather than sprinting out from the start."
        ),
    ),
    ExerciseSeed(
        "Rowing Machine", Equipment.machine, "cardio",
        primary=("lats", "mid-back", "quads"), secondary=("glutes", "hamstrings", "biceps"),
        aliases=("rower", "erg", "indoor rowing"), tracks="duration distance",
        instructions=(
            "Sit with your feet strapped in, shins vertical and arms straight holding the handle. "
            "Drive with your legs first, then swing your torso back slightly and pull the handle "
            "to your lower ribs; return in reverse order: arms, body, then legs. Push with your "
            "legs rather than yanking with your arms, since most of the power comes from the leg "
            "drive."
        ),
    ),
    ExerciseSeed(
        "Elliptical", Equipment.machine, "cardio",
        primary=("quads", "glutes"), secondary=("hamstrings", "calves"),
        aliases=("cross trainer", "elliptical trainer"), tracks="duration distance",
        instructions=(
            "Step onto the pedals, hold the handles and stand tall with your weight centered over "
            "your feet. Stride in a smooth, continuous motion, pushing and pulling the handles in "
            "rhythm with your legs. Keep your heels down and do not lean on the handles, so your "
            "legs do the work."
        ),
    ),
    ExerciseSeed(
        "Stair Climber", Equipment.machine, "cardio",
        primary=("glutes", "quads"), secondary=("calves", "hamstrings"),
        aliases=("stairmaster", "stair stepper"), tracks="duration distance",
        instructions=(
            "Step onto the machine, set a speed and stand tall with a light hand on the rails for "
            "balance only. Place your whole foot on each step and push through your heel to climb. "
            "Do not lean on the rails or hunch forward; slow the speed if you cannot stay upright "
            "without them."
        ),
    ),
    ExerciseSeed(
        "Ski Erg", Equipment.machine, "cardio",
        primary=("lats",), secondary=("triceps", "abs", "glutes"),
        aliases=("skierg", "ski machine"), tracks="duration distance",
        instructions=(
            "Stand facing the machine with your feet hip-width apart and your arms reaching up to "
            "the handles. Pull the handles down by hinging at your hips and driving your hands "
            "past your thighs, then rise back up as your arms return overhead. Use your hips and "
            "body weight to drive the pull rather than only your arms."
        ),
    ),
    ExerciseSeed(
        "Jump Rope", Equipment.other, "cardio",
        primary=("calves",), secondary=("quads",),
        aliases=("skipping", "skipping rope", "double unders"), tracks="duration",
        instructions=(
            "Hold the handles at hip height with your elbows close to your sides and the rope "
            "behind your heels. Turn the rope with your wrists and make small, quick hops on the "
            "balls of your feet. Keep the jumps low and relaxed instead of tucking your knees or "
            "swinging your whole arms."
        ),
    ),
    ExerciseSeed(
        "Swimming", Equipment.bodyweight, "cardio",
        primary=("lats", "shoulders"), secondary=("chest", "triceps"),
        aliases=("swim", "laps"), tracks="duration distance",
        instructions=(
            "Push off the wall and float in a long, horizontal position with your face in the "
            "water and your body in line. Pull through the water with your arms while kicking "
            "steadily from the hips, breathing to the side in rhythm with your stroke. Keep your "
            "head neutral and your hips high, since lifting your head makes your legs sink."
        ),
    ),
    ExerciseSeed(
        "Sprints", Equipment.bodyweight, "cardio",
        primary=("quads", "hamstrings", "glutes"), secondary=("calves",),
        aliases=("sprint", "sprint intervals"), tracks="duration distance",
        instructions=(
            "Warm up thoroughly, then start from a staggered stance with a slight forward lean. "
            "Drive your knees and arms powerfully and push hard off the ground, staying on the "
            "balls of your feet. Build to top speed over a few strides rather than going all-out "
            "from the first step, and recover fully between efforts."
        ),
    ),
    ExerciseSeed(
        "Jumping Jacks", Equipment.bodyweight, "cardio",
        primary=("calves",), secondary=("glutes", "side-delts"),
        aliases=("star jumps",), tracks="duration",
        instructions=(
            "Stand with your feet together and your arms at your sides. Jump your feet out wider "
            "than your shoulders while raising your arms overhead, then jump back to the start. "
            "Stay light on the balls of your feet and keep a steady rhythm."
        ),
    ),
    ExerciseSeed(
        "Battle Ropes", Equipment.other, "cardio",
        primary=("front-delts",), secondary=("forearms", "core"),
        aliases=("battle rope", "battling ropes"), tracks="duration",
        instructions=(
            "Hold one rope end in each hand, back away until the ropes have a little slack and "
            "sink into an athletic quarter squat with your core braced. Whip the ropes up and down "
            "quickly, alternating arms or moving them together, so waves travel to the anchor. "
            "Keep your hips low and drive the waves from your shoulders, not just your wrists."
        ),
    ),
)
