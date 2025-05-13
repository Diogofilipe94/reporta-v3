import React, { useEffect } from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import { useTheme } from '../../constants/Colors';

export default function AppLayout() {
  const { isAuthenticated, signOut } = useAuth();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary
        },
        headerTintColor: colors.textTertiary,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerActiveBackgroundColor: isDark ? colors.surface : colors.textTertiary,
        drawerInactiveBackgroundColor: colors.surface,
        drawerType: 'slide',
        headerLeft: () => null,
        swipeEnabled: true,
        drawerPosition: 'right',
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 320,
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'REPORTA',
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
          headerTitleAlign: 'left',
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
          headerTitleAlign: 'left',
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
          headerTitleAlign: 'left',
          drawerActiveBackgroundColor: colors.primary + 50,
          drawerHideStatusBarOnOpen: true,
          drawerLabel: 'Sobre',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
