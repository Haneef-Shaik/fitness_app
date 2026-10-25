import { useMember } from '@/data/MemberProvider';
import { exerciseSchema } from '@fitlog/domain';
import { t } from '@/lib/i18n';
import { AppText, Card, Header, Screen } from '@/ui';

export function ExerciseDetailScreen() {
  const { drafts } = useMember(); const exercise = exerciseSchema.safeParse(drafts['exercise-detail']);
  return <Screen><Header title={exercise.success ? exercise.data.name : t('exercises')} back />
    {exercise.success && <Card><AppText>{exercise.data.equipment} · {exercise.data.primaryMuscles.join(', ')}</AppText><AppText>{exercise.data.instructions}</AppText><AppText tone="muted">{exercise.data.loadBasis}</AppText></Card>}
  </Screen>;
}
