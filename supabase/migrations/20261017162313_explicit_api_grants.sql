-- Remove project-wide default privileges before granting the API's actual capabilities.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles,public.exercises,public.foods,public.programmes,public.schedule_occurrences,
 public.workout_sessions,public.performed_sets,public.meal_items,public.nutrition_targets,public.body_entries,public.goals,public.mutation_outcomes to authenticated;
grant insert,update on public.exercises,public.foods,public.meal_items,public.nutrition_targets,public.body_entries,public.goals to authenticated;
grant update(display_name,timezone,locale,weight_unit,length_unit,weekly_goal,updated_at) on public.profiles to authenticated;
revoke execute on all functions in schema public from public,anon;
grant execute on function public.complete_onboarding(text,date,text,text,text,text),public.apply_operation_v1(jsonb) to authenticated;
