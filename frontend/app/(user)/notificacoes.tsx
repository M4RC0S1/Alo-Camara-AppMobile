import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppIcon } from '@/components/AppIcon';
import { DARK, LIGHT } from '@/constants/app-theme';
import { useApp } from '@/context/AppContext';
import { api, timeAgo, type Notificacao } from '@/services/api';

const LABEL = { PROTOCOLO: 'Protocolos', AVISO: 'Avisos' } as const;

export default function Notificacoes() {
  const { dark } = useApp();
  const C = dark ? DARK : LIGHT;
  const [protocolosColor, avisosColor] = [C.blue, C.orange];
  const [items, setItems] = useState<Notificacao[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'Todas' | 'Protocolos' | 'Avisos'>('Todas');
  useFocusEffect(useCallback(() => {
    api.notificacoes().then(setItems).catch(e => setError(e instanceof Error ? e.message : 'Erro inesperado'));
  }, []));
  const read = (n: Notificacao) => {
    if (n.lida) return;
    setItems(list => list && list.map(x => (x.id === n.id ? { ...x, lida: 1 } : x)));
    api.marcarLida(n.id).catch(() => {});
  };
  const readAll = () => {
    setItems(list => list && list.map(x => ({ ...x, lida: 1 })));
    api.marcarTodasLidas().catch(() => {});
  };
  const shown = (items ?? []).filter(n => filter === 'Todas' || LABEL[n.tipo] === filter);
  return <Screen>
    <View style={styles.head}><Text style={[styles.title, { color: C.text }]}>Notificações</Text><TouchableOpacity onPress={readAll}><Text style={[styles.mark, { color: C.blue }]}>Marcar todas como lidas</Text></TouchableOpacity></View>
    <View style={styles.filters}>{(['Todas', 'Protocolos', 'Avisos'] as const).map(f => <Filter key={f} label={f} active={filter === f} onPress={() => setFilter(f)} C={C} />)}</View>
    {error ? <Text style={{ color: C.red }}>{error}</Text> : !items ? <ActivityIndicator color={C.blue} /> : shown.length === 0 ? <Text style={{ color: C.muted }}>Nenhuma notificação.</Text> : null}
    {shown.map(n => { const isProt = n.tipo === 'PROTOCOLO'; const color = isProt ? protocolosColor : avisosColor; return <TouchableOpacity key={n.id} activeOpacity={0.8} onPress={() => read(n)} style={[styles.card, { backgroundColor: C.surface, borderLeftColor: color }]}><View style={[styles.icon, { backgroundColor: dark ? (isProt ? '#17385F' : '#4A3518') : '#EEF2F8' }]}><AppIcon name={isProt ? 'clipboard-check-outline' : 'bullhorn-outline'} size={20} color={color} /></View><View style={{ flex: 1 }}><View style={styles.row}><Text style={[styles.cardTitle, { color: C.text }]}>{n.titulo}</Text>{!n.lida && <View style={[styles.new, { backgroundColor: color }]}><Text style={styles.newText}>Nova</Text></View>}</View><Text style={[styles.desc, { color: C.muted }]}>{n.mensagem}</Text><View style={styles.bottom}><Text style={[styles.time, { color: C.muted }]}>{timeAgo(n.created_at)}</Text><Text style={[styles.category, { color }]}>{LABEL[n.tipo]}</Text></View></View></TouchableOpacity>; })}
  </Screen>;
}
function Filter({ label, active = false, onPress, C }: { label: string; active?: boolean; onPress: () => void; C: typeof DARK | typeof LIGHT }) { return <TouchableOpacity onPress={onPress} style={[styles.filter, { backgroundColor: C.surface }, active && { backgroundColor: '#4359BC' }]}><Text style={[styles.filterText, { color: C.text }]}>{label}</Text></TouchableOpacity>; }
const styles = StyleSheet.create({ head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, title: { fontSize: 24, fontWeight: '800' }, mark: { fontSize: 13, fontWeight: '700' }, filters: { flexDirection: 'row', marginBottom: 15, gap: 9 }, filter: { borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11 }, filterText: { fontWeight: '700' }, card: { borderRadius: 18, padding: 15, marginBottom: 12, flexDirection: 'row', borderLeftWidth: 5 }, icon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, row: { flexDirection: 'row', alignItems: 'center' }, cardTitle: { fontSize: 15, fontWeight: '800', flex: 1 }, new: { borderRadius: 13, paddingHorizontal: 9, paddingVertical: 5, marginLeft: 8 }, newText: { color: '#fff', fontSize: 10, fontWeight: '800' }, desc: { fontSize: 13, lineHeight: 19, marginTop: 10 }, bottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }, time: { fontSize: 12 }, category: { fontSize: 12, fontWeight: '800' } });
