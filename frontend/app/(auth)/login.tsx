import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, shadow } from '@/constants/app-theme';
import { useApp } from '@/context/AppContext';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const enter = async () => {
    if (!email.trim() || !password) return Alert.alert('Atenção', 'Informe e-mail e senha.');
    setLoading(true);
    try {
      const u = await login(email, password);
      router.replace(u.role === 'admin' ? '/(admin)/chamados' : '/(user)');
    } catch (e) {
      Alert.alert('Não foi possível entrar', e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };
  const external = (nome: string) => Alert.alert('Em breve', `O login com ${nome} ainda não está disponível. Use e-mail e senha.`);
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.brand}>
          <View style={s.logo}><MaterialCommunityIcons name="bullhorn-outline" size={45} color={C.text}/></View>
          <Text style={s.brandTitle}>Alô Câmara</Text>
          <Text style={s.subtitle}>Sua voz no poder público</Text>
        </View>
        <View style={s.card}>
          <Text style={s.heading}>Entrar</Text>
          <TouchableOpacity style={s.google} onPress={() => external('Google')}><Text style={s.googleText}>Continuar com Google</Text></TouchableOpacity>
          <TouchableOpacity style={s.gov} onPress={() => external('GOV.BR')}><Text style={s.govText}>Entrar com GOV.BR</Text></TouchableOpacity>
          <View style={s.divider}><View style={s.line}/><Text style={s.or}>OU</Text><View style={s.line}/></View>
          <Text style={s.label}>E-mail</Text>
          <View style={s.inputWrap}><MaterialCommunityIcons name="email-outline" size={22} color={C.muted}/><TextInput value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor="#697285" style={s.input} keyboardType="email-address" autoCapitalize="none"/></View>
          <Text style={s.label}>Senha</Text>
          <View style={s.inputWrap}><MaterialCommunityIcons name="lock-outline" size={22} color={C.muted}/><TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#697285" style={s.input} secureTextEntry onSubmitEditing={enter}/></View>
          <TouchableOpacity style={[s.enter, loading && { opacity: 0.6 }]} onPress={enter} disabled={loading}>{loading ? <ActivityIndicator color={C.text}/> : <Text style={s.enterText}>Entrar</Text>}</TouchableOpacity>
          <Text style={s.register}>Não tem conta? <Text style={s.link} onPress={() => router.push('/(auth)/cadastro')}>Criar agora</Text></Text>
        </View>
        <Text style={s.terms}>Ao continuar, você concorda com nossos Termos de Uso</Text>
      </View>
    </SafeAreaView>
  );
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},container:{flex:1,justifyContent:'center',padding:18},brand:{alignItems:'center',marginBottom:28},
 logo:{width:88,height:88,borderRadius:25,backgroundColor:C.blue2,alignItems:'center',justifyContent:'center',marginBottom:14,...shadow},
 brandTitle:{color:C.text,fontSize:28,fontWeight:'800'},subtitle:{color:C.muted,fontSize:16,marginTop:4},card:{backgroundColor:'#111B30',borderColor:'#2C3950',borderWidth:1,borderRadius:24,padding:18},
 heading:{color:C.text,fontSize:24,fontWeight:'800',marginBottom:18},google:{height:52,backgroundColor:'#F8F8FA',borderRadius:15,alignItems:'center',justifyContent:'center',marginBottom:12},
 googleText:{color:'#30343B',fontSize:16},gov:{height:52,backgroundColor:C.cyan,borderRadius:15,alignItems:'center',justifyContent:'center'},govText:{color:C.text,fontSize:16,fontWeight:'800'},
 divider:{flexDirection:'row',alignItems:'center',gap:10,marginVertical:22},line:{flex:1,height:1,backgroundColor:'#39465B'},or:{color:C.muted,fontWeight:'700'},label:{color:'#B7BFCC',fontSize:16,marginBottom:8},
 inputWrap:{height:58,backgroundColor:'#05091A',borderRadius:14,borderWidth:1,borderColor:'#202B41',flexDirection:'row',alignItems:'center',paddingHorizontal:14,marginBottom:14},
 input:{flex:1,color:C.text,fontSize:16,marginLeft:10},enter:{height:58,borderRadius:15,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'},enterText:{color:C.text,fontSize:17,fontWeight:'800'},
 register:{color:C.muted,textAlign:'center',marginTop:17,fontSize:15},link:{color:C.blue,fontWeight:'800'},terms:{color:'#687287',fontSize:12,textAlign:'center',marginTop:16}
});