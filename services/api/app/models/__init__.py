from app.models.exercise import (
    CatalogStatus,
    Equipment,
    Exercise,
    ExerciseMuscle,
    MuscleGroup,
    MuscleRole,
)
from app.models.program import PlanExercise, ProgramStatus, WorkoutPlanDay, WorkoutProgram
from app.models.session import (
    PersonalRecord,
    RecordType,
    SessionExercise,
    SessionStatus,
    SetType,
    WorkoutSession,
    WorkoutSet,
)
from app.models.user import (
    ActivityLevel,
    FitnessGoal,
    GoalStatus,
    GoalType,
    RefreshToken,
    UnitSystem,
    User,
    UserProfile,
    UserStatus,
)

# Grouped by domain rather than sorted — the grouping is the documentation.
__all__ = [  # noqa: RUF022
    # user
    "User", "UserProfile", "FitnessGoal", "RefreshToken",
    "UserStatus", "UnitSystem", "ActivityLevel", "GoalType", "GoalStatus",
    # catalog
    "MuscleGroup", "Exercise", "ExerciseMuscle", "Equipment", "CatalogStatus", "MuscleRole",
    # plan
    "WorkoutProgram", "WorkoutPlanDay", "PlanExercise", "ProgramStatus",
    # performed
    "WorkoutSession", "SessionExercise", "WorkoutSet", "PersonalRecord",
    "SessionStatus", "SetType", "RecordType",
]
