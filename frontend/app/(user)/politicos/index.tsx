import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppIcon } from '@/components/AppIcon';
import { DARK, LIGHT } from '@/constants/app-theme';
import { useApp } from '@/context/AppContext';
import { api, type Politico } from '@/services/api';

const regions = ['Todas', 'Centro', 'Norte', 'Sul', 'Leste', 'Oeste'];

export default function Politicos() {
  const router = useRouter();
  const { dark } = useApp();
  const C = dark ? DARK : LIGHT;
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('Todas');
  const [people, setPeople] = useState<Politico[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.politicos().then(setPeople).catch(e => setError(e instanceof Error ? e.message : 'Erro inesperado'));
  }, []);
  const list = useMemo(() => (people ?? []).filter(p => (region === 'Todas' || p.regiao === region) && p.nome.toLowerCase().includes(q.toLowerCase())), [people, q, region]);

  return (
    <Screen>
      <Text style={[styles.title, { color: C.text }]}>Vereadores</Text>
      <View style={[styles.search, { backgroundColor: C.surface }]}>
        <AppIcon name="magnify" size={24} color={C.text} />
        <TextInput value={q} onChangeText={setQ} placeholder="Buscar por nome..." placeholderTextColor={C.muted} style={[styles.input, { color: C.text }]} />
      </View>
      <View style={styles.filters}>
        {regions.map(r => <TouchableOpacity key={r} onPress={() => setRegion(r)} style={[styles.filter, { backgroundColor: C.surface }, region === r && { backgroundColor: '#4359BC' }]}><Text style={[styles.filterText, { color: C.text }]}>{r}</Text></TouchableOpacity>)}
      </View>
      {error ? <Text style={{ color: C.red }}>{error}</Text> : !people ? <ActivityIndicator color={C.blue} /> : null}
      {list.map(p => (
        <TouchableOpacity key={p.id} style={[styles.card, { backgroundColor: C.surface, borderColor: C.line }]} onPress={() => router.push(`/(user)/politicos/${p.id}` as any)}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{p.nome[0]}</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.name, { color: C.text }]}>{p.nome}</Text><Text style={[styles.meta, { color: C.muted }]}>{p.partido}</Text><Text style={[styles.meta, { color: C.muted }]}>{p.regiao}</Text><View style={styles.rating}><AppIcon name="star" size={17} color={C.yellow} /><Text style={[styles.ratingText, { color: C.muted }]}>{p.media ?? '—'} ({p.total_avaliacoes})</Text></View></View>
          <AppIcon name="chevron-right" size={22} color={C.muted} />
        </TouchableOpacity>
      ))}
    </Screen>
  );
}
const styles = StyleSheet.create({ title: { fontSize: 24, fontWeight: '800', marginBottom: 15 }, search: { height: 54, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 13 }, input: { flex: 1, fontSize: 16, marginLeft: 9 }, filters: { flexDirection: 'row', marginBottom: 14, flexWrap: 'wrap', gap: 8 }, filter: { borderRadius: 22, paddingHorizontal: 15, paddingVertical: 10 }, filterText: { fontSize: 13, fontWeight: '700' }, card: { borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1 }, avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#233567', alignItems: 'center', justifyContent: 'center', marginRight: 12 }, avatarText: { color: '#fff', fontSize: 17, fontWeight: '800' }, name: { fontSize: 16, fontWeight: '800' }, meta: { fontSize: 14, marginTop: 2 }, rating: { flexDirection: 'row', alignItems: 'center', marginTop: 8 }, ratingText: { fontSize: 13, marginLeft: 5 } });
