import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppIcon } from '@/components/AppIcon';
import { DARK, LIGHT, shadow } from '@/constants/app-theme';
import { useApp } from '@/context/AppContext';

const actions = [
  ['alert-circle-outline', 'Solicitação', 'Serviço público', 'blue', 'Solicitação'],
  ['message-alert-outline', 'Reclamação', 'Registre um problema', 'orange', 'Reclamação'],
  ['lightbulb-on-outline', 'Sugestão', 'Ajude a melhorar', 'purple', 'Sugestão'],
  ['shield-alert-outline', 'Denúncia', 'Comunique uma ocorrência', 'red', 'Denúncia'],
] as const;

export default function Home() {
  const router = useRouter();
  const { user, dark, requests, refreshRequests } = useApp();
  useFocusEffect(useCallback(() => { refreshRequests(); }, [refreshRequests]));
  const C = dark ? DARK : LIGHT;
  return <Screen>
    <View style={styles.top}><View style={{ flex: 1 }}><Text style={[styles.small, { color: C.muted }]}>Olá, {user?.name}</Text><Text style={[styles.title, { color: C.text }]}>Como podemos ajudar?</Text></View><TouchableOpacity style={[styles.bell, { backgroundColor: C.surface }]} onPress={() => router.push('/(user)/notificacoes')}><AppIcon name="bell-outline" size={22} color={C.text} /><View style={styles.dot} /></TouchableOpacity></View>
    <View style={[styles.hero, { backgroundColor: C.blue2 }]}><View style={styles.heroIcon}><AppIcon name="bullhorn-outline" size={30} color="#fff" /></View><View style={{ flex: 1 }}><Text style={styles.heroTitle}>Sua voz transforma a cidade</Text><Text style={styles.heroText}>Registre demandas e acompanhe tudo pelo aplicativo.</Text></View></View>
    <Text style={[styles.section, { color: C.text }]}>Serviços</Text>
    <View style={styles.grid}>{actions.map(([icon, title, desc, color, type]) => { const iconColor = color === 'blue' ? C.blue : color === 'orange' ? C.orange : color === 'purple' ? C.purple : C.red; return <TouchableOpacity key={title} style={[styles.action, { backgroundColor: C.surface }]} onPress={() => router.push(`/(user)/chamados/novo?tipo=${encodeURIComponent(type)}` as any)}><View style={[styles.actionIcon, { backgroundColor: dark ? '#23304A' : '#EEF2FA' }]}><AppIcon name={icon as any} size={23} color={iconColor} /></View><Text style={[styles.actionTitle, { color: C.text }]}>{title}</Text><Text style={[styles.actionDesc, { color: C.muted }]}>{desc}</Text></TouchableOpacity>; })}</View>
    <View style={styles.row}><Text style={[styles.section, { color: C.text }]}>Minhas solicitações</Text><TouchableOpacity onPress={() => router.push('/(user)/chamados' as any)}><Text style={[styles.see, { color: C.blue }]}>Ver todas</Text></TouchableOpacity></View>
    {requests.slice(0, 1).map(r => <TouchableOpacity key={r.id} style={[styles.request, { backgroundColor: C.surface }]} onPress={() => router.push(`/(user)/chamados/${r.chamadoId}` as any)}><View style={{ flex: 1 }}><Text style={[styles.protocolText, { color: C.blue }]}>{r.id}</Text><Text style={[styles.requestTitle, { color: C.text }]}>{r.title}</Text><Text style={[styles.requestMeta, { color: C.muted }]}>{r.date} · {r.type}</Text></View><View style={styles.status}><View style={styles.statusDot} /><Text style={[styles.statusText, { color: C.green }]}>{r.status}</Text></View></TouchableOpacity>)}
    <Text style={[styles.section, { color: C.text }]}>Comunicados</Text><View style={[styles.notice, { backgroundColor: C.surface }]}><View style={styles.noticeIcon}><AppIcon name="bullhorn" size={21} color={C.orange} /></View><View style={{ flex: 1 }}><Text style={[styles.noticeTitle, { color: C.text }]}>Sessão Extraordinária</Text><Text style={[styles.noticeText, { color: C.muted }]}>A Câmara realizará sessão extraordinária amanhã às 18h.</Text></View></View>
  </Screen>;
}
const styles = StyleSheet.create({ top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, small: { fontSize: 14 }, title: { fontSize: 23, fontWeight: '800', marginTop: 3 }, bell: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...shadow }, dot: { position: 'absolute', right: 10, top: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: '#F05A5A' }, hero: { borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 24 }, heroIcon: { width: 56, height: 56, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }, heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800' }, heroText: { color: '#DCE7FF', fontSize: 13, lineHeight: 19, marginTop: 4 }, section: { fontSize: 18, fontWeight: '800', marginBottom: 11 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, action: { width: '48%', borderRadius: 17, padding: 14, marginBottom: 12, ...shadow }, actionIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, actionTitle: { fontSize: 15, fontWeight: '800' }, actionDesc: { fontSize: 12, marginTop: 4 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }, see: { fontSize: 13, fontWeight: '700', marginBottom: 11 }, request: { borderRadius: 17, padding: 16, marginBottom: 22, flexDirection: 'row' }, protocolText: { fontSize: 13, fontWeight: '800' }, requestTitle: { fontSize: 16, fontWeight: '800', marginTop: 7 }, requestMeta: { fontSize: 12, marginTop: 6 }, status: { alignSelf: 'center', paddingHorizontal: 10 }, statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#3FB56A', alignSelf: 'center', marginBottom: 4 }, statusText: { fontSize: 11, fontWeight: '800' }, notice: { borderRadius: 17, padding: 15, flexDirection: 'row' }, noticeIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#4A3518', alignItems: 'center', justifyContent: 'center', marginRight: 11 }, noticeTitle: { fontSize: 15, fontWeight: '800' }, noticeText: { fontSize: 12, lineHeight: 18, marginTop: 5 } });
