import React, { useEffect } from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Image, View, Text, StyleSheet } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';

export default function AppLayout() {
  const { isAuthenticated, signOut } = useAuth();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  // Componente personalizado para o conteúdo do drawer
  function CustomDrawerContent(props: DrawerContentComponentProps) {
    return (
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flex: 1 }}
      >
        {/* Cabeçalho do drawer com o ícone da aplicação */}
        <View style={[styles.drawerHeader, { backgroundColor: isDark? colors.surface : colors.accent }]}>

          <Image
            source={require('../../assets/images/logoReporta.png')}
            style={styles.appIcon}
          />
          <Text style={[styles.appName, { color: colors.primary }]}>REPORTA</Text>
        </View>

        {/* Lista de itens do drawer */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    );
  }

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? colors.background : colors.primary,
        },
        headerTintColor: colors.textTertiary,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerActiveBackgroundColor: isDark ? colors.surface : colors.textTertiary,
        drawerInactiveBackgroundColor: colors.surface,
        drawerType: 'front',
        headerLeft: () => null,
        swipeEnabled: true,
        drawerPosition: 'right',
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 320,
        },
        headerRight: () => null,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'REPORTA',
          headerTitleStyle: {
            color : isDark ? colors.accent : colors.textTertiary,
          },
          headerTitleAlign: 'center',
          drawerActiveBackgroundColor: colors.primary + 50,
          drawerHideStatusBarOnOpen: true,
          drawerStatusBarAnimation: 'fade',
          drawerLabel: 'Home',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="perfil"
        options={{
          title: 'REPORTA',
          headerTitleStyle: {
            color : isDark ? colors.accent : colors.textTertiary,
          },
          headerTitleAlign: 'center',
          drawerActiveBackgroundColor: colors.primary + 50,
          drawerHideStatusBarOnOpen: true,
          drawerLabel: 'Perfil',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="definicoes"
        options={{
          title: 'REPORTA',
          headerTitleStyle: {
            color : isDark ? colors.accent : colors.textTertiary,
          },
          headerTitleAlign: 'center',
          drawerActiveBackgroundColor: colors.primary + 50,
          drawerHideStatusBarOnOpen: true,
          drawerLabel: 'Definições',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="sobre"
        options={{
          title: 'REPORTA',
          headerTitleStyle: {
            color : isDark ? colors.accent : colors.textTertiary,
          },
          headerTitleAlign: 'center',
          drawerActiveBackgroundColor: colors.primary + 50,
          drawerHideStatusBarOnOpen: true,
          drawerLabel: 'Sobre',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="editProfile"
        options={{
          title: 'REPORTA',
          headerTitleStyle: {
            color : isDark ? colors.accent : colors.textTertiary,
          },
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="editPassword"
        options={{
          title: 'REPORTA',
          headerTitleStyle: {
            color : isDark ? colors.accent : colors.textTertiary,
          },
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    height: 100,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appIcon: {
    height:50,
    objectFit: 'contain',

  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  }
});
