import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { DARK, LIGHT } from '@/constants/app-theme';

export function Screen({ children, scroll = true, contentStyle, safeTop = true }: PropsWithChildren<{ scroll?: boolean; contentStyle?: ViewStyle; safeTop?: boolean }>) {
  const { dark } = useApp();
  const C = dark ? DARK : LIGHT;
  const edges = safeTop ? ['top'] as const : [] as const;
  if (scroll) return <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: C.bg }]}><ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>{children}</ScrollView></SafeAreaView>;
  return <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: C.bg }, contentStyle]}>{children}</SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 16, paddingBottom: 32 } });
