import { Stack } from 'expo-router';
import { GymProvider } from '@/features/gym/GymProvider';
export default function GymLayout() { return <GymProvider><Stack screenOptions={{ headerShown: false }} /></GymProvider>; }
