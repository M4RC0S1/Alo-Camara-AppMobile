import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, Tabs } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { DARK, LIGHT } from '@/constants/app-theme';

export default function UserLayout() {
  const { dark, user } = useApp();
  const C = dark ? DARK : LIGHT;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === 'admin') return <Redirect href="/(admin)/chamados" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.line,
          height: 70,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700' },
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* SOMENTE estas cinco rotas aparecem na barra inferior. */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-variant" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="politicos"
        options={{
          title: 'Vereadores',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-group" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notificacoes"
        options={{
          title: 'Notificações',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bell" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agendamento',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar-month" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          title: 'Configuração',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={23} color={color} />
          ),
        }}
      />

      {/* Rotas internas: continuam existindo, mas NÃO são abas. */}
      <Tabs.Screen name="chamados" options={{ href: null }} />
      <Tabs.Screen name="perfil" options={{ href: null }} />
    </Tabs>
  );
}
