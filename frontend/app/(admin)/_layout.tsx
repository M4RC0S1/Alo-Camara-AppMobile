import { Redirect, Stack, useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { useApp } from '@/context/AppContext';

export default function AdminLayout() {
  const { user, logout } = useApp();
  const router = useRouter();
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== 'admin') return <Redirect href="/(user)" />;

  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: '#0056b3' },
      headerTintColor: '#FFFFFF'
    }}>
      <Stack.Screen
        name="chamados/index"
        options={{
          title: 'Painel da Prefeitura',
          headerRight: () => (
            <TouchableOpacity onPress={() => { logout(); router.replace('/(auth)/login'); }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Sair</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="chamados/[id]" options={{ title: 'Chamado' }} />
    </Stack>
  );
}
