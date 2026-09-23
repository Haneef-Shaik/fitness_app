from app.models.analysis import (
    AnalysisErrorCode,
    AnalysisInputType,
    AnalysisStatus,
    FoodAnalysis,
    FoodAnalysisItem,
)
from app.models.body import BodyMetric, DailySummary, ProgressPhoto
from app.models.exercise import (
    CatalogStatus,
    Equipment,
    Exercise,
    ExerciseMuscle,
    MuscleGroup,
    MuscleRole,
)
from app.models.nutrition import (
    DEFAULT_MEAL_CATEGORIES,
    Food,
    FoodSource,
    ItemSource,
    Meal,
    MealCategory,
    MealItem,
)
from app.models.program import PlanExercise, ProgramStatus, WorkoutPlanDay, WorkoutProgram
from app.models.recipe import Recipe, RecipeItem
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
    # nutrition
    "Food", "FoodSource", "Meal", "MealItem", "ItemSource",
    "MealCategory", "DEFAULT_MEAL_CATEGORIES", "Recipe", "RecipeItem",
    # AI analysis (G8)
    "FoodAnalysis", "FoodAnalysisItem",
    "AnalysisInputType", "AnalysisStatus", "AnalysisErrorCode",
    # body & summaries (G9)
    "BodyMetric", "DailySummary", "ProgressPhoto",
]
