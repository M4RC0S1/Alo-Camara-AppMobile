import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { DARK, LIGHT } from '@/constants/app-theme';
import { useApp } from '@/context/AppContext';
import { api, type Avaliacao, type Politico } from '@/services/api';

export default function Detalhe() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dark } = useApp();
  const C = dark ? DARK : LIGHT;
  const [person, setPerson] = useState<(Politico & { avaliacoes: Avaliacao[] }) | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.politico(id).then(setPerson).catch(e => setError(e instanceof Error ? e.message : 'Erro inesperado'));
  }, [id]);

  const rate = async (nota: number) => {
    setSaving(true);
    try {
      await api.avaliar(id, nota);
      setPerson(await api.politico(id));
      Alert.alert('Obrigado!', `Você avaliou com nota ${nota}.`);
    } catch (e) {
      Alert.alert('Não foi possível avaliar', e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setSaving(false);
    }
  };

  const header = (title: string) => <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.line }]}><TouchableOpacity onPress={() => router.back()} style={styles.back}><AppIcon name="arrow-left" size={25} color={C.text} /></TouchableOpacity><Text style={[styles.headerTitle, { color: C.text }]}>{title}</Text></View>;
  if (!person) return <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: C.bg }]}>{header('Vereador')}<View style={styles.content}>{error ? <Text style={{ color: C.red }}>{error}</Text> : <ActivityIndicator color={C.blue} />}</View></SafeAreaView>;

  const contact = [person.email, person.telefone].filter(Boolean).join('\n');
  return <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: C.bg }]}>
    {header(person.nome)}
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profile}><View style={styles.bigAvatar}><Text style={styles.bigLetter}>{person.nome[0]}</Text></View><Text style={[styles.name, { color: C.text }]}>{person.nome}</Text><Text style={[styles.meta, { color: C.muted }]}>{person.partido}</Text><Text style={[styles.meta, { color: C.muted }]}>{person.regiao}</Text></View>
      <View style={styles.stats}><Stat icon="star" value={person.media === null ? '—' : String(person.media)} label="Nota" C={C} /><Stat value={String(person.total_avaliacoes)} label="Avaliações" C={C} /></View>
      <Info C={C} title="Sobre">{person.bio || 'Biografia não informada.'}</Info>
      {contact ? <Info C={C} title="Contato">{contact}</Info> : null}
      <View style={[styles.info, { backgroundColor: C.surface, opacity: saving ? 0.6 : 1 }]}>
        <Text style={[styles.infoTitle, { color: C.text }]}>Avalie este vereador</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>{[1, 2, 3, 4, 5].map(n => <TouchableOpacity key={n} disabled={saving} onPress={() => rate(n)}><AppIcon name="star-outline" size={34} color={C.yellow} /></TouchableOpacity>)}</View>
      </View>
      {person.avaliacoes.length > 0 && <Info C={C} title="Comentários">{person.avaliacoes.filter(a => a.comentario).map(a => `${a.autor} (${a.nota}★): ${a.comentario}`).join('\n\n') || 'Nenhum comentário ainda.'}</Info>}
      <Text style={[styles.actionsTitle, { color: C.text }]}>Ações</Text>
      <View style={styles.actions}>{[['Solicitação', 'alert-circle-outline', C.blue], ['Reclamação', 'message-alert-outline', C.orange], ['Elogio', 'heart-outline', '#D946A8']].map(([label, icon, color]) => <TouchableOpacity key={String(label)} style={[styles.action, { borderColor: String(color) }]} onPress={() => router.push(`/(user)/chamados/novo?tipo=${encodeURIComponent(String(label))}` as any)}><AppIcon name={icon as any} size={16} color={String(color)} /><Text style={[styles.actionText, { color: String(color) }]}>{String(label)}</Text></TouchableOpacity>)}</View>
    </ScrollView>
  </SafeAreaView>;
}
function Stat({ icon, value, label, C }: { icon?: any; value: string; label: string; C: typeof DARK | typeof LIGHT }) { return <View style={[styles.stat, { backgroundColor: C.surface }]}>{icon && <AppIcon name={icon} size={17} color={C.yellow} />}<Text style={[styles.value, { color: C.text }]}>{value}</Text><Text style={[styles.label, { color: C.muted }]}>{label}</Text></View>; }
function Info({ title, children, C }: { title: string; children: string; C: typeof DARK | typeof LIGHT }) { return <View style={[styles.info, { backgroundColor: C.surface }]}><Text style={[styles.infoTitle, { color: C.text }]}>{title}</Text><Text style={[styles.infoText, { color: C.muted }]}>{children}</Text></View>; }
const styles = StyleSheet.create({ root: { flex: 1 }, header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderBottomWidth: 1 }, back: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' }, headerTitle: { flex: 1, fontSize: 22, fontWeight: '700' }, content: { padding: 16, paddingBottom: 36 }, profile: { alignItems: 'center', paddingVertical: 18 }, bigAvatar: { width: 124, height: 124, borderRadius: 62, backgroundColor: '#202F68', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, bigLetter: { fontSize: 48, color: '#fff' }, name: { fontSize: 23, fontWeight: '800' }, meta: { fontSize: 15, marginTop: 3 }, stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }, stat: { width: '31%', borderRadius: 15, paddingVertical: 13, alignItems: 'center' }, value: { fontSize: 17, fontWeight: '800', marginTop: 2 }, label: { fontSize: 12, marginTop: 3 }, response: { borderRadius: 15, padding: 16, marginBottom: 16 }, responseText: { fontSize: 15, fontWeight: '700' }, info: { borderRadius: 17, padding: 16, marginBottom: 16 }, infoTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 }, infoText: { fontSize: 14, lineHeight: 20 }, actionsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, action: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' }, actionText: { fontSize: 12, fontWeight: '700', marginLeft: 5 } });
