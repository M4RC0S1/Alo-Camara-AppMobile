import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '@/context/AppContext';

function RootNavigator() {
  const { dark } = useApp();
  return <><StatusBar style={dark ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown:false }} /></>;
}
export default function RootLayout() { return <AppProvider><RootNavigator /></AppProvider>; }
