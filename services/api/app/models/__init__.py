from app.models.analysis import (
    AnalysisErrorCode,
    AnalysisInputType,
    AnalysisStatus,
    FoodAnalysis,
    FoodAnalysisItem,
)
from app.models.body import BodyMetric, DailySummary, ProgressPhoto
from app.models.device import PushToken
from app.models.exercise import (
    CatalogStatus,
    Equipment,
    Exercise,
    ExerciseMuscle,
    MuscleGroup,
    MuscleRole,
)
from app.models.feedback import Feedback
from app.models.nutrition import (
    DEFAULT_MEAL_CATEGORIES,
    Food,
    FoodDataset,
    FoodPortion,
    FoodSource,
    ItemSource,
    Meal,
    MealCategory,
    MealItem,
)
from app.models.program import PlanExercise, ProgramStatus, WorkoutPlanDay, WorkoutProgram
from app.models.ratelimit import RateLimitCounter
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
    AccountToken,
    AccountTokenPurpose,
    ActivityLevel,
    CalorieTarget,
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
    "User", "UserProfile", "FitnessGoal", "RefreshToken", "CalorieTarget",
    "UserStatus", "UnitSystem", "ActivityLevel", "GoalType", "GoalStatus",
    # emailed single-use links (A-05, A-06, K-02)
    "AccountToken", "AccountTokenPurpose",
    # catalog
    "MuscleGroup", "Exercise", "ExerciseMuscle", "Equipment", "CatalogStatus", "MuscleRole",
    # plan
    "WorkoutProgram", "WorkoutPlanDay", "PlanExercise", "ProgramStatus",
    # performed
    "WorkoutSession", "SessionExercise", "WorkoutSet", "PersonalRecord",
    "SessionStatus", "SetType", "RecordType",
    # nutrition
    "Food", "FoodSource", "FoodDataset", "FoodPortion", "Meal", "MealItem", "ItemSource",
    "MealCategory", "DEFAULT_MEAL_CATEGORIES", "Recipe", "RecipeItem",
    # AI analysis (G8)
    "FoodAnalysis", "FoodAnalysisItem",
    "AnalysisInputType", "AnalysisStatus", "AnalysisErrorCode",
    # body & summaries (G9)
    "BodyMetric", "DailySummary", "ProgressPhoto",
    # support
    "Feedback", "PushToken",
    # abuse protection (launch) — owned by no user
    "RateLimitCounter",
]
