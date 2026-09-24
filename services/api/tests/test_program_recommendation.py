"""Which starter program fits this person (A-09, extended in G10).

The owner's review asked for well-known, properly configured programs a user
can choose from — and a list of thirteen is only useful if the right ones come
first. The ranking is pure, so it is tested without a database.
"""
from __future__ import annotations

from app.domain.programs import TrainingProfile, rank_templates, score
from app.seed.program_templates import TEMPLATES


def keys(ranked) -> list[str]:
    return [r.template.key for r in ranked]


def test_a_beginner_with_three_days_and_a_gym_gets_a_beginner_three_day_program_first():
    ranked = rank_templates(TEMPLATES, TrainingProfile(
        experience="beginner", days_per_week=3, equipment="full_gym", session_minutes=60, goal="strength"))
    top = ranked[0].template
    assert top.level == "beginner" and top.per_week == 3 and top.focus == "strength", top.key


def test_nothing_needing_a_barbell_is_offered_as_fitting_someone_with_only_dumbbells():
    ranked = rank_templates(TEMPLATES, TrainingProfile(
        experience="beginner", days_per_week=3, equipment="dumbbells", session_minutes=45, goal="fat_loss"))
    fitting = [r for r in ranked if r.fits]
    assert fitting, "somebody with dumbbells must be offered something"
    assert all(r.template.equipment in {"dumbbells", "bodyweight"} for r in fitting)
    assert ranked[0].template.key == "dumbbell-full-body"
    # Everything else is still listed — just marked, and after.
    assert len(ranked) == len(TEMPLATES)
    assert all(not r.fits for r in ranked[len(fitting):])


def test_bodyweight_only_gets_the_bodyweight_routine_first():
    ranked = rank_templates(TEMPLATES, TrainingProfile(
        experience="beginner", days_per_week=3, equipment="bodyweight", session_minutes=60, goal="maintenance"))
    assert ranked[0].template.key == "bodyweight-recommended-routine"


def test_an_advanced_lifter_four_days_strength_gets_531():
    ranked = rank_templates(TEMPLATES, TrainingProfile(
        experience="advanced", days_per_week=4, equipment="full_gym", session_minutes=90, goal="strength"))
    assert ranked[0].template.key == "531-bbb"


def test_six_days_for_muscle_puts_a_six_day_hypertrophy_program_first():
    ranked = rank_templates(TEMPLATES, TrainingProfile(
        experience="intermediate", days_per_week=6, equipment="full_gym", session_minutes=90, goal="muscle_gain"))
    top = ranked[0].template
    assert top.per_week == 6 and top.focus == "hypertrophy", top.key


def test_a_beginner_is_never_steered_to_an_advanced_program_first():
    for days in range(2, 7):
        ranked = rank_templates(TEMPLATES, TrainingProfile(
            experience="beginner", days_per_week=days, equipment="full_gym", session_minutes=60, goal="strength"))
        assert ranked[0].template.level != "advanced", (days, ranked[0].template.key)


def test_every_recommendation_says_why_in_words():
    ranked = rank_templates(TEMPLATES, TrainingProfile(
        experience="beginner", days_per_week=3, equipment="full_gym", session_minutes=60, goal="strength"))
    assert ranked[0].reasons, "a top pick with no stated reason"
    assert any("3 days" in r for r in ranked[0].reasons)


def test_with_no_answers_the_order_is_simply_easiest_first_and_everything_fits():
    ranked = rank_templates(TEMPLATES, TrainingProfile())
    assert all(r.fits for r in ranked)
    levels = [r.template.level for r in ranked]
    order = {"beginner": 0, "intermediate": 1, "advanced": 2}
    assert levels == sorted(levels, key=order.__getitem__)


def test_the_ranking_is_stable():
    p = TrainingProfile(experience="intermediate", days_per_week=4, equipment="full_gym",
                        session_minutes=60, goal="muscle_gain")
    assert keys(rank_templates(TEMPLATES, p)) == keys(rank_templates(TEMPLATES, p))


def test_a_beginner_gets_a_beginner_program_even_when_an_intermediate_one_matches_the_goal_better():
    # PHUL is the better fit for "muscle, four days" on paper — and it is
    # written for intermediates. Level outranks focus, so a beginner starts on
    # a beginner program.
    ranked = rank_templates(TEMPLATES, TrainingProfile(
        experience="beginner", days_per_week=4, equipment="full_gym", session_minutes=75, goal="muscle_gain"))
    assert ranked[0].template.level == "beginner", ranked[0].template.key
    phul = next(r for r in ranked if r.template.key == "phul")
    assert "Written for intermediate lifters" in phul.reasons


def test_someone_with_a_full_gym_is_not_steered_to_dumbbell_or_bodyweight_programs():
    # Found by walking onboarding: a beginner with a full gym, three days, losing
    # fat, was shown the dumbbell and bodyweight routines as picks two and three,
    # ahead of StrongLifts and Starting Strength. They fit — but they waste the gym.
    ranked = rank_templates(TEMPLATES, TrainingProfile(
        experience="beginner", days_per_week=3, equipment="full_gym", session_minutes=60, goal="fat_loss"))
    assert all(r.template.equipment == "full_gym" for r in ranked[:3]), keys(ranked[:3])


def test_lifting_heavy_counts_as_serving_a_fat_loss_goal():
    # Strength training keeps muscle in a deficit; it is not off-goal for fat loss.
    stronglifts = next(t for t in TEMPLATES if t.key == "stronglifts-5x5")
    base = TrainingProfile(experience="beginner", days_per_week=3, equipment="full_gym", session_minutes=60)
    with_goal = score(stronglifts, TrainingProfile(**{**base.__dict__, "goal": "fat_loss"}))
    assert with_goal.score > score(stronglifts, base).score
