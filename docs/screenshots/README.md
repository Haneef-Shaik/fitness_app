# FitLog: every screen

170 screenshots of 92 screen IDs, captured on 2 Oct 2026 from a **release build of `main`**
(with the Kinetic Performance redesign merged) on an Android 14 emulator (Pixel 6, 1080 × 2400),
against the local Supabase stack and API.

Open **[index.html](index.html)** to browse them as a gallery. Screen IDs are the ones in
[docs/04-SCREEN-ARCHITECTURE.md](../04-SCREEN-ARCHITECTURE.md). A screen that scrolls is
recorded top to bottom as `…-1.png`, `…-2.png` and so on.

The account is `shots@fitlog.app`, seeded by `services/api/scripts/seed_screenshots.py`
(eight weeks on Push / Pull / Legs, imported through the Strong importer). The sign-up and
onboarding screens and the empty states are from a fresh account created during the run.

## Sign-up, sign-in and onboarding

| Screen | What it shows | File |
|---|---|---|
| A-02 Welcome | Welcome | [A-02-welcome.png](01-auth/A-02-welcome.png) |
| A-03 Sign Up | Sign up | [A-03-sign-up.png](01-auth/A-03-sign-up.png) |
| A-03 Sign Up | Sign up filled | [A-03b-sign-up-filled.png](01-auth/A-03b-sign-up-filled.png) |
| A-04 Log In | Log in | [A-04-log-in.png](01-auth/A-04-log-in.png) |
| A-05 Forgot / Reset Password | Forgot password | [A-05a-forgot-password.png](01-auth/A-05a-forgot-password.png) |
| A-05 Forgot / Reset Password | Reset link sent | [A-05b-reset-link-sent.png](01-auth/A-05b-reset-link-sent.png) |
| A-05 Forgot / Reset Password | Reset with code | [A-05c-reset-with-code.png](01-auth/A-05c-reset-with-code.png) |
| A-05 Forgot / Reset Password | New password | [A-05d-new-password.png](01-auth/A-05d-new-password.png) |
| A-06 Verify Email | Verify email | [A-06-verify-email.png](01-auth/A-06-verify-email.png) |
| A-07 Onboarding Wizard | Onboarding units and time zone | [A-07a-onboarding-units-and-time-zone.png](01-auth/A-07a-onboarding-units-and-time-zone.png) |
| A-07 Onboarding Wizard | Onboarding about you | [A-07b-onboarding-about-you.png](01-auth/A-07b-onboarding-about-you.png) |
| A-07 Onboarding Wizard | Onboarding activity | [A-07c-onboarding-activity.png](01-auth/A-07c-onboarding-activity.png) |
| A-07 Onboarding Wizard | Onboarding goal | [A-07d-onboarding-goal.png](01-auth/A-07d-onboarding-goal.png) |
| A-07 Onboarding Wizard | Onboarding training | [A-07e-onboarding-training.png](01-auth/A-07e-onboarding-training.png) |
| A-07 Onboarding Wizard | Onboarding first check in | [A-07f-onboarding-first-check-in.png](01-auth/A-07f-onboarding-first-check-in.png) |
| A-08 Target Review | Target review | [A-08a-target-review.png](01-auth/A-08a-target-review.png) |
| A-08 Target Review | Target review explained | [A-08b-target-review-explained.png](01-auth/A-08b-target-review-explained.png) |
| A-09 Program Starter | Program starter | [A-09-program-starter.png](01-auth/A-09-program-starter.png) |
| A-09 Program Starter | Program preview | [A-09b-program-preview.png](01-auth/A-09b-program-preview.png) |
| A-10 Onboarding Complete | Onboarding complete | [A-10-onboarding-complete.png](01-auth/A-10-onboarding-complete.png) |

## Home

| Screen | What it shows | File |
|---|---|---|
| B-01 Home Dashboard | Home (part 1) | [B-01a-home-1.png](02-home/B-01a-home-1.png) |
| B-01 Home Dashboard | Home (part 2) | [B-01a-home-2.png](02-home/B-01a-home-2.png) |
| B-01 Home Dashboard | Home all caught up | [B-01c-home-all-caught-up.png](02-home/B-01c-home-all-caught-up.png) |
| B-02 Customize Dashboard | Customize dashboard | [B-02-customize-dashboard.png](02-home/B-02-customize-dashboard.png) |
| B-03 Quick Action Sheet | Quick actions | [B-03-quick-actions.png](02-home/B-03-quick-actions.png) |
| B-04 Notifications / Reminders | Notifications reminders | [B-04-notifications-reminders.png](02-home/B-04-notifications-reminders.png) |
| B-05 Global Search | Search | [B-05a-search.png](02-home/B-05a-search.png) |
| B-05 Global Search | Search results | [B-05b-search-results.png](02-home/B-05b-search-results.png) |

## Train: programs and exercises

| Screen | What it shows | File |
|---|---|---|
| C-01 Train Hub | Train hub (part 1) | [C-01-train-hub-1.png](03-train/C-01-train-hub-1.png) |
| C-01 Train Hub | Train hub (part 2) | [C-01-train-hub-2.png](03-train/C-01-train-hub-2.png) |
| C-02 Programs List | Programs | [C-02a-programs.png](03-train/C-02a-programs.png) |
| C-02 Programs List | Program templates (part 1) | [C-02b-program-templates-1.png](03-train/C-02b-program-templates-1.png) |
| C-02 Programs List | Program templates (part 2) | [C-02b-program-templates-2.png](03-train/C-02b-program-templates-2.png) |
| C-03 Program Detail | Program detail (part 1) | [C-03-program-detail-1.png](03-train/C-03-program-detail-1.png) |
| C-03 Program Detail | Program detail (part 2) | [C-03-program-detail-2.png](03-train/C-03-program-detail-2.png) |
| C-04 Program Create / Edit | New program | [C-04-new-program.png](03-train/C-04-new-program.png) |
| C-05 Plan Day Editor | Plan day editor | [C-05-plan-day-editor.png](03-train/C-05-plan-day-editor.png) |
| C-06 Exercise Picker | Exercise picker | [C-06-exercise-picker.png](03-train/C-06-exercise-picker.png) |
| C-07 Prescription Editor | Prescription editor | [C-07-prescription-editor.png](03-train/C-07-prescription-editor.png) |
| D-01 Exercise Library | Exercise library (part 1) | [D-01-exercise-library-1.png](03-train/D-01-exercise-library-1.png) |
| D-01 Exercise Library | Exercise library (part 2) | [D-01-exercise-library-2.png](03-train/D-01-exercise-library-2.png) |
| D-02 Exercise Detail | Exercise detail (part 1) | [D-02-exercise-detail-1.png](03-train/D-02-exercise-detail-1.png) |
| D-02 Exercise Detail | Exercise detail (part 2) | [D-02-exercise-detail-2.png](03-train/D-02-exercise-detail-2.png) |
| D-02 Exercise Detail | Exercise detail (part 3) | [D-02-exercise-detail-3.png](03-train/D-02-exercise-detail-3.png) |
| D-03 Create / Edit Custom Exercise | New exercise | [D-03-new-exercise.png](03-train/D-03-new-exercise.png) |

## Workout logger

| Screen | What it shows | File |
|---|---|---|
| E-01 Start Workout | Start workout | [E-01-start-workout.png](04-workout/E-01-start-workout.png) |
| E-03 Active Session — Set Logger | Set logger (part 1) | [E-03a-set-logger-1.png](04-workout/E-03a-set-logger-1.png) |
| E-03 Active Session — Set Logger | Set logger (part 2) | [E-03a-set-logger-2.png](04-workout/E-03a-set-logger-2.png) |
| E-03 Active Session — Set Logger | Logger two sets | [E-03b-logger-two-sets.png](04-workout/E-03b-logger-two-sets.png) |
| E-04 Rest Timer | Rest timer | [E-04-rest-timer.png](04-workout/E-04-rest-timer.png) |
| E-05 Add / Swap Exercise | Exercise options | [E-05a-exercise-options.png](04-workout/E-05a-exercise-options.png) |
| E-05 Add / Swap Exercise | Swap exercise picker | [E-05b-swap-exercise-picker.png](04-workout/E-05b-swap-exercise-picker.png) |
| E-06 Advanced Set Editor | Advanced set editor | [E-06-advanced-set-editor.png](04-workout/E-06-advanced-set-editor.png) |
| E-07 Session Notes | Session notes | [E-07-session-notes.png](04-workout/E-07-session-notes.png) |
| E-08 Finish Summary | Finish summary with e 11 records | [E-08-finish-summary-with-E-11-records.png](04-workout/E-08-finish-summary-with-E-11-records.png) |
| E-09 Discard Session | Discard workout | [E-09-discard-workout.png](04-workout/E-09-discard-workout.png) |
| E-10 Session Recovery | Session recovery | [E-10-session-recovery.png](04-workout/E-10-session-recovery.png) |
| E-12 Plate Calculator | Plate calculator | [E-12-plate-calculator.png](04-workout/E-12-plate-calculator.png) |
| E-13 Supersets / Circuits | Superset | [E-13-superset.png](04-workout/E-13-superset.png) |

## History

| Screen | What it shows | File |
|---|---|---|
| F-01 History List | History (part 1) | [F-01-history-1.png](05-history/F-01-history-1.png) |
| F-01 History List | History (part 2) | [F-01-history-2.png](05-history/F-01-history-2.png) |
| F-01 History List | History (part 3) | [F-01-history-3.png](05-history/F-01-history-3.png) |
| F-02 History Filters | History filters | [F-02-history-filters.png](05-history/F-02-history-filters.png) |
| F-03 Session Detail | Session detail (part 1) | [F-03-session-detail-1.png](05-history/F-03-session-detail-1.png) |
| F-03 Session Detail | Session detail (part 2) | [F-03-session-detail-2.png](05-history/F-03-session-detail-2.png) |
| F-04 Edit Past Session | Edit past session | [F-04-edit-past-session.png](05-history/F-04-edit-past-session.png) |
| F-05 Previous Occurrence | Previous chest day | [F-05-previous-chest-day.png](05-history/F-05-previous-chest-day.png) |
| F-06 Session Comparison | Compare sessions | [F-06-compare-sessions.png](05-history/F-06-compare-sessions.png) |
| F-07 Training Calendar | Training calendar | [F-07-training-calendar.png](05-history/F-07-training-calendar.png) |

## Training analytics

| Screen | What it shows | File |
|---|---|---|
| G-01 Analytics Overview | Analytics overview (part 1) | [G-01-analytics-overview-1.png](06-analytics/G-01-analytics-overview-1.png) |
| G-01 Analytics Overview | Analytics overview (part 2) | [G-01-analytics-overview-2.png](06-analytics/G-01-analytics-overview-2.png) |
| G-03 Exercise Progression | Exercise progression | [G-03-exercise-progression.png](06-analytics/G-03-exercise-progression.png) |
| G-04 Personal Records | Personal records (part 1) | [G-04-personal-records-1.png](06-analytics/G-04-personal-records-1.png) |
| G-04 Personal Records | Personal records (part 2) | [G-04-personal-records-2.png](06-analytics/G-04-personal-records-2.png) |
| G-05 Frequency & Muscle Balance | Frequency | [G-05a-frequency.png](06-analytics/G-05a-frequency.png) |
| G-05 Frequency & Muscle Balance | Muscle balance (part 1) | [G-05b-muscle-balance-1.png](06-analytics/G-05b-muscle-balance-1.png) |
| G-05 Frequency & Muscle Balance | Muscle balance (part 2) | [G-05b-muscle-balance-2.png](06-analytics/G-05b-muscle-balance-2.png) |
| G-06 Adherence | Adherence | [G-06-adherence.png](06-analytics/G-06-adherence.png) |

## Nutrition

| Screen | What it shows | File |
|---|---|---|
| H-01 Nutrition Diary | Diary (part 1) | [H-01-diary-1.png](07-nutrition/H-01-diary-1.png) |
| H-01 Nutrition Diary | Diary (part 2) | [H-01-diary-2.png](07-nutrition/H-01-diary-2.png) |
| H-01 Nutrition Diary | Diary (part 3) | [H-01-diary-3.png](07-nutrition/H-01-diary-3.png) |
| H-02 Meal Detail | Meal detail | [H-02-meal-detail.png](07-nutrition/H-02-meal-detail.png) |
| H-03 Add Food — Mode Chooser | Add food (part 1) | [H-03-add-food-1.png](07-nutrition/H-03-add-food-1.png) |
| H-03 Add Food — Mode Chooser | Add food (part 2) | [H-03-add-food-2.png](07-nutrition/H-03-add-food-2.png) |
| H-03 Add Food — Mode Chooser | Add food (part 3) | [H-03-add-food-3.png](07-nutrition/H-03-add-food-3.png) |
| H-03 Add Food — Mode Chooser | Add food (part 4) | [H-03-add-food-4.png](07-nutrition/H-03-add-food-4.png) |
| H-04 Food Search | Food search results (part 1) | [H-04-food-search-results-1.png](07-nutrition/H-04-food-search-results-1.png) |
| H-04 Food Search | Food search results (part 2) | [H-04-food-search-results-2.png](07-nutrition/H-04-food-search-results-2.png) |
| H-05 Food Detail & Portion | Food detail | [H-05-food-detail.png](07-nutrition/H-05-food-detail.png) |
| H-05 Food Detail & Portion | Food portion picker | [H-05b-food-portion-picker.png](07-nutrition/H-05b-food-portion-picker.png) |
| H-05 Food Detail & Portion | Food details and source (part 1) | [H-05c-food-details-and-source-1.png](07-nutrition/H-05c-food-details-and-source-1.png) |
| H-05 Food Detail & Portion | Food details and source (part 2) | [H-05c-food-details-and-source-2.png](07-nutrition/H-05c-food-details-and-source-2.png) |
| H-06 Describe Your Meal (text AI) | Describe meal | [H-06-describe-meal.png](07-nutrition/H-06-describe-meal.png) |
| H-06 Describe Your Meal (text AI) | Describe meal filled | [H-06b-describe-meal-filled.png](07-nutrition/H-06b-describe-meal-filled.png) |
| H-07 AI Processing | Ai processing | [H-07-ai-processing.png](07-nutrition/H-07-ai-processing.png) |
| H-08 AI Review & Correct | Ai review (part 1) | [H-08-ai-review-1.png](07-nutrition/H-08-ai-review-1.png) |
| H-08 AI Review & Correct | Ai review (part 2) | [H-08-ai-review-2.png](07-nutrition/H-08-ai-review-2.png) |
| H-08 AI Review & Correct | Ai review fresh (part 1) | [H-08b-ai-review-fresh-1.png](07-nutrition/H-08b-ai-review-fresh-1.png) |
| H-08 AI Review & Correct | Ai review fresh (part 2) | [H-08b-ai-review-fresh-2.png](07-nutrition/H-08b-ai-review-fresh-2.png) |
| H-09 Photo Capture | Photo meal | [H-09-photo-meal.png](07-nutrition/H-09-photo-meal.png) |
| H-10 Create / Edit Custom Food | New food | [H-10-new-food.png](07-nutrition/H-10-new-food.png) |
| H-11 Recipes & Saved Meals | Recipes | [H-11a-recipes.png](07-nutrition/H-11a-recipes.png) |
| H-11 Recipes & Saved Meals | Recipe detail (part 1) | [H-11b-recipe-detail-1.png](07-nutrition/H-11b-recipe-detail-1.png) |
| H-11 Recipes & Saved Meals | Recipe detail (part 2) | [H-11b-recipe-detail-2.png](07-nutrition/H-11b-recipe-detail-2.png) |
| H-11 Recipes & Saved Meals | New recipe (part 1) | [H-11c-new-recipe-1.png](07-nutrition/H-11c-new-recipe-1.png) |
| H-11 Recipes & Saved Meals | New recipe (part 2) | [H-11c-new-recipe-2.png](07-nutrition/H-11c-new-recipe-2.png) |
| H-12 Copy Meal / Copy Day | Copy meal | [H-12-copy-meal.png](07-nutrition/H-12-copy-meal.png) |
| H-13 Quick Add | Quick add | [H-13-quick-add.png](07-nutrition/H-13-quick-add.png) |
| H-14 Nutrition Analytics | Nutrition analytics | [H-14-nutrition-analytics.png](07-nutrition/H-14-nutrition-analytics.png) |
| H-15 Calorie & Macro Targets | Targets | [H-15-targets.png](07-nutrition/H-15-targets.png) |
| H-16 Meal Category Manager | Meal categories (part 1) | [H-16-meal-categories-1.png](07-nutrition/H-16-meal-categories-1.png) |
| H-16 Meal Category Manager | Meal categories (part 2) | [H-16-meal-categories-2.png](07-nutrition/H-16-meal-categories-2.png) |
| H-18 Analysis History | Analysis history | [H-18-analysis-history.png](07-nutrition/H-18-analysis-history.png) |

## Progress, body and goals

| Screen | What it shows | File |
|---|---|---|
| I-01 Progress Overview | Progress (part 1) | [I-01-progress-1.png](08-progress/I-01-progress-1.png) |
| I-01 Progress Overview | Progress (part 2) | [I-01-progress-2.png](08-progress/I-01-progress-2.png) |
| I-01 Progress Overview | Progress (part 3) | [I-01-progress-3.png](08-progress/I-01-progress-3.png) |
| I-02 Log Body Metric | Log body metric | [I-02-log-body-metric.png](08-progress/I-02-log-body-metric.png) |
| I-03 Weight Trend | Weight trend (part 1) | [I-03-weight-trend-1.png](08-progress/I-03-weight-trend-1.png) |
| I-03 Weight Trend | Weight trend (part 2) | [I-03-weight-trend-2.png](08-progress/I-03-weight-trend-2.png) |
| I-03 Weight Trend | Weight trend (part 3) | [I-03-weight-trend-3.png](08-progress/I-03-weight-trend-3.png) |
| I-03 Weight Trend | Weight trend (part 4) | [I-03-weight-trend-4.png](08-progress/I-03-weight-trend-4.png) |
| I-04 Measurement Detail | Measurement waist | [I-04-measurement-waist.png](08-progress/I-04-measurement-waist.png) |
| I-05 Progress Photos | Progress photos | [I-05-progress-photos.png](08-progress/I-05-progress-photos.png) |
| I-06 Measurement Fields | Measurement fields | [I-06-measurement-fields.png](08-progress/I-06-measurement-fields.png) |
| I-07 Check-in | Check in | [I-07-check-in.png](08-progress/I-07-check-in.png) |
| J-01 Goals List | Goals | [J-01-goals.png](08-progress/J-01-goals.png) |
| J-01 Goals List | Goals with a reached goal | [J-01b-goals-with-a-reached-goal.png](08-progress/J-01b-goals-with-a-reached-goal.png) |
| J-02 Create / Edit Goal | New goal | [J-02-new-goal.png](08-progress/J-02-new-goal.png) |
| J-03 Goal Detail | Goal detail | [J-03-goal-detail.png](08-progress/J-03-goal-detail.png) |
| J-04 Goal Outcome | Goal reached outcome | [J-04-goal-reached-outcome.png](08-progress/J-04-goal-reached-outcome.png) |

## Settings

| Screen | What it shows | File |
|---|---|---|
| K-01 Profile | Settings (part 1) | [K-01a-settings-1.png](09-settings/K-01a-settings-1.png) |
| K-01 Profile | Settings (part 2) | [K-01a-settings-2.png](09-settings/K-01a-settings-2.png) |
| K-01 Profile | Profile (part 1) | [K-01b-profile-1.png](09-settings/K-01b-profile-1.png) |
| K-01 Profile | Profile (part 2) | [K-01b-profile-2.png](09-settings/K-01b-profile-2.png) |
| K-01 Profile | Profile (part 3) | [K-01b-profile-3.png](09-settings/K-01b-profile-3.png) |
| K-01 Profile | Profile (part 4) | [K-01b-profile-4.png](09-settings/K-01b-profile-4.png) |
| K-01 Profile | Sign out confirm | [K-01c-sign-out-confirm.png](09-settings/K-01c-sign-out-confirm.png) |
| K-02 Account & Security | Account security | [K-02-account-security.png](09-settings/K-02-account-security.png) |
| K-02 Account & Security | Change email | [K-02b-change-email.png](09-settings/K-02b-change-email.png) |
| K-02 Account & Security | Change password | [K-02c-change-password.png](09-settings/K-02c-change-password.png) |
| K-03 Units, Locale & Timezone | Units locale | [K-03-units-locale.png](09-settings/K-03-units-locale.png) |
| K-04 Logging Preferences | Logging preferences (part 1) | [K-04-logging-preferences-1.png](09-settings/K-04-logging-preferences-1.png) |
| K-04 Logging Preferences | Logging preferences (part 2) | [K-04-logging-preferences-2.png](09-settings/K-04-logging-preferences-2.png) |
| K-07 Data & Privacy | Data privacy (part 1) | [K-07-data-privacy-1.png](09-settings/K-07-data-privacy-1.png) |
| K-07 Data & Privacy | Data privacy (part 2) | [K-07-data-privacy-2.png](09-settings/K-07-data-privacy-2.png) |
| K-07 Data & Privacy | Delete account (part 1) | [K-07b-delete-account-1.png](09-settings/K-07b-delete-account-1.png) |
| K-07 Data & Privacy | Delete account (part 2) | [K-07b-delete-account-2.png](09-settings/K-07b-delete-account-2.png) |
| K-08 AI Preferences | Ai preferences (part 1) | [K-08-ai-preferences-1.png](09-settings/K-08-ai-preferences-1.png) |
| K-08 AI Preferences | Ai preferences (part 2) | [K-08-ai-preferences-2.png](09-settings/K-08-ai-preferences-2.png) |
| K-09 Integrations | Health integrations | [K-09-health-integrations.png](09-settings/K-09-health-integrations.png) |
| K-10 About & Legal | About | [K-10a-about.png](09-settings/K-10a-about.png) |
| K-10 About & Legal | Licences (part 1) | [K-10b-licences-1.png](09-settings/K-10b-licences-1.png) |
| K-10 About & Legal | Licences (part 2) | [K-10b-licences-2.png](09-settings/K-10b-licences-2.png) |
| K-12 Send feedback | Feedback | [K-12-feedback.png](09-settings/K-12-feedback.png) |
| K-13 Import from another app | Import | [K-13-import.png](09-settings/K-13-import.png) |

## System states

| Screen | What it shows | File |
|---|---|---|
| L-02 Offline Banner & Sync Center | Sync center | [L-02-sync-center.png](10-system/L-02-sync-center.png) |
| L-02 Offline Banner & Sync Center | Offline banner | [L-02b-offline-banner.png](10-system/L-02b-offline-banner.png) |
| L-02 Offline Banner & Sync Center | Sync center waiting | [L-02c-sync-center-waiting.png](10-system/L-02c-sync-center-waiting.png) |
| L-03 Error State (pattern) | Error state | [L-03-error-state.png](10-system/L-03-error-state.png) |
| L-04 Not Found (404) | Not found | [L-04-not-found.png](10-system/L-04-not-found.png) |
| L-05 Session Expired | Session expired | [L-05-session-expired.png](10-system/L-05-session-expired.png) |
| L-06 Permission Primer | Permission primer camera | [L-06-permission-primer-camera.png](10-system/L-06-permission-primer-camera.png) |
| L-07 Sync Conflict | Sync conflict | [L-07-sync-conflict.png](10-system/L-07-sync-conflict.png) |
| L-08 Maintenance / Degraded | Maintenance notice | [L-08-maintenance-notice.png](10-system/L-08-maintenance-notice.png) |

## A brand-new account (empty states)

| Screen | What it shows | File |
|---|---|---|
| B-01 Home Dashboard | Home new account | [B-01-home-new-account.png](12-empty-states/B-01-home-new-account.png) |
| F-01 History List | History empty | [F-01-history-empty.png](12-empty-states/F-01-history-empty.png) |
| G-01 Analytics Overview | Analytics empty | [G-01-analytics-empty.png](12-empty-states/G-01-analytics-empty.png) |
| H-01 Nutrition Diary | Diary empty | [H-01-diary-empty.png](12-empty-states/H-01-diary-empty.png) |
| H-11 Recipes & Saved Meals | Recipes empty | [H-11-recipes-empty.png](12-empty-states/H-11-recipes-empty.png) |
| I-05 Progress Photos | Photos empty | [I-05-photos-empty.png](12-empty-states/I-05-photos-empty.png) |

## The 14 specified IDs without a file of their own

| ID | Why |
|---|---|
| A-01 Splash | A plain dark colour for a fraction of a second; nothing to record |
| C-08 Program Schedule | The weekday chips inside the plan day editor (C-05) |
| C-09 Archive / Duplicate | **Not in the app.** The API has `/archive` and `/duplicate` for programs, but no screen offers them |
| D-04 Muscle Mapping | The muscle chips inside New exercise (D-03) |
| D-05 Aliases & Merge | P2, not built |
| E-02 Exercise list | The exercise strip at the top of the logger (E-03) |
| E-11 PR Celebration | Part of the finish summary (E-08) |
| G-02 Volume Analytics | The volume chart on the analytics overview (G-01) |
| G-07 e1RM Detail | The exercise progression screen (G-03) |
| H-17 Barcode Scanner | Out of v1 (Q1); decision L5 is open |
| K-05 Dashboard Layout | Is B-02 |
| K-06 Notifications & Reminders | Is B-04 |
| K-11 Subscription | Not built; waits on decision L6 |
| L-01 Empty State | The pattern itself: see the empty-states section |

Two states are recorded only partly: **L-07 Sync conflict** shows its no-conflict message (a real
conflict needs two devices editing the same record), and **I-05 Progress photos** is empty (the
account has no photos).

## Defects these screenshots show

- **Exercise picker filter chips stretch into tall ovals** (C-06, E-05b): the muscle chips inside
  the picker sheet grow to ~250 px high.
- **Plan day editor names exercises "Exercise"** (C-05): rows 2 and 3 should read Overhead
  Press and Triceps Pushdown.
- **Swap picker is titled "Add exercises"** (E-05b) though it replaces one exercise.
- **Raw ISO dates on screens the redesign has not reached yet**: session detail and edit (F-03,
  F-04), compare (F-06), calendar month headers (F-07), meal detail (H-02), analyses (H-18),
  waist and weight chart ends (I-03, I-04).
- **Edit past session is a placeholder** (F-04): "coming with the session-editing work".
- **Every meal category is "usually at 08:00"** (H-16).
- **Adherence reads 0 %** after eight weeks of imported training (G-01, G-06): imported sessions
  are not matched to the program's days.
- **Macro tiles clip their targets** on Home ("/ 176 g" cut off), and the "1897.5 kg" best
  session wraps in the exercise-detail record tiles (D-02).
- **After signing back in from L-05 the screen behind still shows "Something went wrong"**
  until Try again is tapped.
- **The finish summary rounds the same e1RM two ways**: "104.8 kg" as a record, "105 kg" in the list.
- The history filter (F-02) lists ten "Clavicular Head xxxxxx" muscle groups: leftovers in
  the **local** database from a test run on 26 Sep, not app data.
