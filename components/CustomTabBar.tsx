import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useTabContext } from '../app/contexts/TabContext';
import { useTheme } from '@/app/contexts/ThemeContext';

export default function CustomTabBar() {
  const navigation = useNavigation();
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useTabContext();
  const { colors, isDark } = useTheme();

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
    router.push('/(app)/(tabs)/novo');
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
        setActiveTab('');
      }
    }, 300);
  };

  return (
    <View style={[
      styles.tabBarContainer,
      {
        backgroundColor: isDark ? colors.primary : colors.surface,
        borderTopColor: colors.divider
      }
    ]}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={goToHome}
          activeOpacity={0.7}
        >
          <Ionicons
            name="home"
            size={24}
            color={isDark? colors.background : colors.primary}
            style={styles.icon}
          />
          <Text
            style={[
              styles.tabText,
              isDark? {color: activeTab === 'new' ? colors.background : colors.background} : {color: activeTab === 'new' ? colors.primary : colors.primary}
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
            name="add-circle"
            size={24}
            color={isDark? colors.background : colors.primary}
            style={styles.icon}
          />
          <Text
            style={[
              styles.tabText,
              isDark? {color: activeTab === 'new' ? colors.background : colors.background} : {color: activeTab === 'new' ? colors.primary : colors.primary}
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
            name="menu"
            size={24}
            color={isDark? colors.background : colors.primary}
            style={styles.icon}
          />

          <Text
            style={[
              styles.tabText,
              isDark? {color: activeTab === 'new' ? colors.background : colors.background} : {color: activeTab === 'new' ? colors.primary : colors.primary}
            ]}
          >
            Menu
          </Text>
        </TouchableOpacity>
      </View>

      {/* Margem de segurança para iOS */}
      {Platform.OS === 'ios' && (
        <View style={[styles.iosSafeArea, { backgroundColor: isDark ? colors.primary : colors.surface }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    width: '100%',
    elevation: 8,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    fontWeight: '500',
  },
  iosSafeArea: {
    height: 15,
  }
});
