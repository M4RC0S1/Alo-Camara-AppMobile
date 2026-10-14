import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, fmtDate, type Chamado } from '@/services/api';

export default function ChamadosAdmin() {
  const router = useRouter();
  const [chamados, setChamados] = useState<Chamado[] | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    api.chamados().then(setChamados).catch(e => setError(e instanceof Error ? e.message : 'Erro inesperado'));
  }, []));

  if (error) return <View style={styles.container}><Text style={styles.error}>{error}</Text></View>;
  if (!chamados) return <View style={styles.container}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={chamados}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.cardUser}>Nenhum chamado registrado.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/(admin)/chamados/${item.id}` as any)}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardUser}>{item.protocolo} · {item.tipo} · {fmtDate(item.created_at)}</Text>
            <Text style={styles.cardUser}>Cidadão: {item.cidadao}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, elevation: 2, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardUser: { fontSize: 14, color: '#666', marginTop: 4 },
  status: { color: '#0056b3', fontWeight: 'bold', marginTop: 8 },
  error: { color: '#B00020' }
});
