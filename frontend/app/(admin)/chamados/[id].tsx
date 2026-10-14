import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api, fmtDate, type Chamado, type Resposta, type Status } from '@/services/api';

type Detalhe = Chamado & { respostas: Resposta[] };
const STATUSES: Status[] = ['Em análise', 'Respondido', 'Concluído'];

export default function ChamadoAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [c, setC] = useState<Detalhe | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.chamado(id).then(setC).catch(e => setError(e instanceof Error ? e.message : 'Erro inesperado'));
  useEffect(() => { load(); }, [id]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      Alert.alert('Não foi possível concluir', e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <View style={styles.container}><Text style={styles.error}>{error}</Text></View>;
  if (!c) return <View style={styles.container}><ActivityIndicator /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.protocol}>{c.protocolo} · {c.tipo}</Text>
      <Text style={styles.title}>{c.titulo}</Text>
      <Text style={styles.meta}>{c.cidadao} · {fmtDate(c.created_at)}</Text>
      <View style={styles.card}><Text style={styles.label}>Descrição</Text><Text>{c.descricao}</Text><Text style={[styles.label, { marginTop: 12 }]}>Local</Text><Text>{c.endereco}</Text></View>

      <Text style={styles.label}>Status: {c.status}</Text>
      <View style={styles.row}>
        {STATUSES.map(s => (
          <TouchableOpacity key={s} disabled={busy || s === c.status} onPress={() => act(() => api.mudarStatus(c.id, s))} style={[styles.chip, s === c.status && styles.chipActive]}>
            <Text style={[styles.chipText, s === c.status && { color: '#FFF' }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 18 }]}>Respostas</Text>
      {c.respostas.length === 0 && <Text style={styles.meta}>Nenhuma resposta ainda.</Text>}
      {c.respostas.map(r => <View key={r.id} style={styles.card}><Text>{r.mensagem}</Text><Text style={styles.meta}>{r.autor ?? 'Prefeitura'} · {fmtDate(r.created_at)}</Text></View>)}

      <TextInput value={msg} onChangeText={setMsg} placeholder="Escreva uma resposta ao cidadão..." multiline style={styles.input} textAlignVertical="top" />
      <TouchableOpacity
        disabled={busy || !msg.trim()}
        onPress={() => act(async () => { await api.responder(c.id, msg.trim()); setMsg(''); })}
        style={[styles.send, (busy || !msg.trim()) && { opacity: 0.5 }]}
      >
        <Text style={styles.sendText}>Enviar resposta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  protocol: { color: '#0056b3', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  meta: { color: '#666', marginTop: 4 },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 8, marginVertical: 10 },
  label: { fontWeight: 'bold', marginBottom: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { borderWidth: 1, borderColor: '#0056b3', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: '#0056b3' },
  chipText: { color: '#0056b3', fontWeight: 'bold' },
  input: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', minHeight: 90, padding: 12, marginTop: 10 },
  send: { backgroundColor: '#0056b3', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 10 },
  sendText: { color: '#FFF', fontWeight: 'bold' },
  error: { color: '#B00020' }
});
