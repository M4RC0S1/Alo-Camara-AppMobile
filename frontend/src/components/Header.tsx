import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from './AppIcon';
import { DARK, LIGHT } from '@/constants/app-theme';
import { useApp } from '@/context/AppContext';
export function Header({title,rightIcon,onRight}:{title:string;rightIcon?:'calendar-month'|'bell-outline';onRight?:()=>void}){
 const router=useRouter(); const {dark}=useApp(); const C=dark?DARK:LIGHT;
 return <SafeAreaView edges={['top']} style={{backgroundColor:C.surface}}><View style={[styles.header,{backgroundColor:C.surface,borderBottomColor:C.line}]}><TouchableOpacity onPress={()=>router.back()} style={styles.back}><AppIcon name="arrow-left" size={25} color={C.text}/></TouchableOpacity><Text style={[styles.title,{color:C.text}]}>{title}</Text>{rightIcon?<TouchableOpacity onPress={onRight} style={styles.right}><AppIcon name={rightIcon} size={24} color={C.text}/></TouchableOpacity>:<View style={styles.right}/>}</View></SafeAreaView>
}
const styles=StyleSheet.create({header:{height:58,flexDirection:'row',alignItems:'center',paddingHorizontal:10,borderBottomWidth:1},back:{width:42,height:42,justifyContent:'center',alignItems:'center'},right:{width:42,height:42,justifyContent:'center',alignItems:'center'},title:{flex:1,fontSize:22,fontWeight:'700',marginLeft:4}});
