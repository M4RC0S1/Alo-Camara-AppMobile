import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { AppIcon } from '@/components/AppIcon';
import { DARK, LIGHT } from '@/constants/app-theme';
import { useApp } from '@/context/AppContext';

export default function Config() {
  const router = useRouter();
  const { user, updateProfile, logout, dark, setDark, requests } = useApp();
  const C = dark ? DARK : LIGHT;
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [mail, setMail] = useState(user?.email ?? '');
  const save = async () => {
    try {
      await updateProfile({ name: name.trim() || undefined, email: mail.trim() || undefined });
      setEditing(false);
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Erro inesperado');
    }
  };
  const exit = () => { logout(); router.replace('/(auth)/login'); };
  return <Screen>
    <View style={[styles.profile, { backgroundColor: C.blue2 }]}><View style={styles.avatar}><Text style={styles.avatarText}>{user?.name[0]?.toUpperCase() || '?'}</Text></View><View style={{ flex: 1 }}><Text style={styles.name}>{user?.name}</Text><Text style={styles.mail}>{user?.email}</Text></View></View>
    <Text style={[styles.section, { color: C.text }]}>Conta</Text>
    {editing ? <View style={[styles.editBox, { backgroundColor: C.surface }]}><TextInput value={name} onChangeText={setName} style={[styles.input, { color: C.text, borderColor: C.line }]} placeholder="Nome" placeholderTextColor={C.muted} /><TextInput value={mail} onChangeText={setMail} style={[styles.input, { color: C.text, borderColor: C.line }]} placeholder="E-mail" placeholderTextColor={C.muted} autoCapitalize="none" keyboardType="email-address" /><TouchableOpacity style={[styles.save, { backgroundColor: C.blue }]} onPress={save}><Text style={styles.saveText}>Salvar alterações</Text></TouchableOpacity></View> : <Option C={C} icon="account-edit-outline" title="Editar Perfil" sub="Alterar nome e e-mail" onPress={() => { setName(user?.name ?? ''); setMail(user?.email ?? ''); setEditing(true); }} />}
    <Option C={C} icon="clipboard-text-outline" title="Minhas Solicitações" sub={`${requests.length} protocolos cadastrados`} onPress={() => router.push('/(user)/chamados' as any)} />
    <Option C={C} icon="lock-outline" title="Alterar Senha" sub="Atualizar senha de acesso" onPress={() => Alert.alert('Em breve', 'A alteração de senha ainda não está disponível.')} />
    <Text style={[styles.section, { color: C.text }]}>Notificações</Text>
    <Option C={C} icon="bell-outline" title="Notificações Push" sub="Receber alertas no celular" toggle value={push} onToggle={() => setPush(!push)} />
    <Option C={C} icon="email-outline" title="Notificações por E-mail" sub="Receber atualizações no e-mail" toggle value={email} onToggle={() => setEmail(!email)} />
    <Text style={[styles.section, { color: C.text }]}>Aparência</Text>
    <Option C={C} icon={dark ? 'weather-night' : 'white-balance-sunny'} title="Modo Escuro" sub={dark ? 'Tema escuro ativado' : 'Tema claro ativado'} toggle value={dark} onToggle={() => setDark(!dark)} />
    <TouchableOpacity style={[styles.logout, { backgroundColor: dark ? '#311D2B' : '#FFF0F0', borderColor: dark ? '#7C3038' : '#E6A5A5' }]} onPress={exit}><AppIcon name="logout" size={21} color={C.red} /><Text style={[styles.logoutText, { color: C.red }]}>Sair da conta</Text></TouchableOpacity>
    <Text style={[styles.footer, { color: C.muted }]}>Prefeitura de Sarandi - Câmara de Vereadores</Text><Text style={[styles.version, { color: C.muted }]}>Versão 1.0.0</Text>
  </Screen>;
}
function Option({ C, icon, title, sub, toggle, value, onToggle, onPress }: { C: typeof DARK | typeof LIGHT; icon: any; title: string; sub: string; toggle?: boolean; value?: boolean; onToggle?: () => void; onPress?: () => void }) { return <TouchableOpacity style={[styles.option, { backgroundColor: C.surface }]} onPress={onToggle || onPress}><View style={[styles.optionIcon, { backgroundColor: C.surface2 }]}><AppIcon name={icon} size={20} color={C.text} /></View><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: C.text }]}>{title}</Text><Text style={[styles.optionSub, { color: C.muted }]}>{sub}</Text></View>{toggle ? <View style={[styles.switch, { backgroundColor: value ? C.blue : C.line }]}><View style={[styles.knob, { left: value ? 24 : 3 }]} /></View> : <AppIcon name="chevron-right" size={23} color={C.muted} />}</TouchableOpacity>; }
const styles = StyleSheet.create({ profile: { borderRadius: 20, padding: 17, flexDirection: 'row', alignItems: 'center', marginBottom: 22 }, avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#543B93', alignItems: 'center', justifyContent: 'center', marginRight: 13 }, avatarText: { color: '#fff', fontSize: 23, fontWeight: '800' }, name: { color: '#fff', fontSize: 20, fontWeight: '800' }, mail: { color: '#E2E7F1', fontSize: 14, marginTop: 3 }, section: { fontSize: 16, fontWeight: '800', marginBottom: 11, marginTop: 8 }, option: { borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }, optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, optionTitle: { fontSize: 15, fontWeight: '800' }, optionSub: { fontSize: 13, marginTop: 2 }, switch: { width: 50, height: 28, borderRadius: 16, justifyContent: 'center', position: 'relative' }, knob: { position: 'absolute', top: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: '#F0F2F5' }, logout: { height: 58, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 23 }, logoutText: { fontSize: 15, fontWeight: '800', marginLeft: 8 }, footer: { textAlign: 'center', fontSize: 12, marginTop: 35 }, version: { textAlign: 'center', fontSize: 12, marginTop: 7 }, editBox: { borderRadius: 16, padding: 14, marginBottom: 10 }, input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginBottom: 10 }, save: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#fff', fontWeight: '800' } });
