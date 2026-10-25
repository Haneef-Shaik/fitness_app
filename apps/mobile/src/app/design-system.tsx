import { Redirect } from 'expo-router';
import { ComponentGalleryScreen } from '@/features/settings/ComponentGalleryScreen';

export default function DesignSystemRoute() {
  return __DEV__ ? <ComponentGalleryScreen /> : <Redirect href="/" />;
}
