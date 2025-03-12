import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useTabContext } from '../app/contexts/TabContext';

export default function CustomTabBar() {
  const navigation = useNavigation();
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useTabContext();

  // Atualizar o estado baseado no pathname atual quando montar o componente
  useEffect(() => {
    if (pathname === '/(tabs)' || pathname === '/(tabs)/index') {
      setActiveTab('home');
    } else if (pathname === '/(tabs)/novo') {
      setActiveTab('new');
    }
    // Não atualizamos para 'menu' aqui porque queremos que ele seja ativado apenas quando clicado
  }, [pathname]);

  // Função para navegar para a home
  const goToHome = () => {
    setActiveTab('home');
    router.replace('/(app)/(tabs)');
  };

  // Função para navegar para novo
  const goToNew = () => {
    setActiveTab('new');
    router.replace('/(app)/(tabs)/novo');
  };

  // Função para abrir o drawer
  const openDrawer = () => {
    setActiveTab('menu');
    // @ts-ignore - necessário porque o tipo pode variar
    navigation.openDrawer();

    // Reset o estado após um curto período, para quando o drawer for fechado
    setTimeout(() => {
      if (pathname === '/(tabs)' || pathname === '/(tabs)/index') {
        setActiveTab('home');
      } else if (pathname === '/(tabs)/novo') {
        setActiveTab('new');
      } else {
        setActiveTab(''); // Nenhuma tab ativa se estiver em outra tela
      }
    }, 300);
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={goToHome}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'home' ? "home" : "home-outline"}
            size={24}
            color={activeTab === 'home' ? '#3498db' : '#999'}
            style={styles.icon}
          />
          <Text
            style={[
              styles.tabText,
              {color: activeTab === 'home' ? '#3498db' : '#999'}
            ]}
          >
            Início
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={goToNew}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'new' ? "add-circle" : "add-circle-outline"}
            size={24}
            color={activeTab === 'new' ? '#3498db' : '#999'}
            style={styles.icon}
          />
          <Text
            style={[
              styles.tabText,
              {color: activeTab === 'new' ? '#3498db' : '#999'}
            ]}
          >
            Novo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={openDrawer}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'menu' ? "menu" : "menu-outline"}
            size={24}
            color={activeTab === 'menu' ? '#3498db' : '#999'}
            style={styles.icon}
          />
          <Text
            style={[
              styles.tabText,
              {color: activeTab === 'menu' ? '#3498db' : '#999'}
            ]}
          >
            Menu
          </Text>
        </TouchableOpacity>
      </View>

      {/* Margem de segurança para iOS */}
      {Platform.OS === 'ios' && <View style={styles.iosSafeArea} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  icon: {
    marginBottom: 4,
    height: 24,
    textAlign: 'center',
  },
  tabText: {
    fontSize: 12,
    textAlign: 'center',
  },
  iosSafeArea: {
    height: 20,
    backgroundColor: '#fff',
  }
});
