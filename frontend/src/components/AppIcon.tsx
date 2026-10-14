import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ComponentProps } from 'react';
import { C } from '@/constants/app-theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function AppIcon({ name, size = 22, color = C.muted }: { name: IconName; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
