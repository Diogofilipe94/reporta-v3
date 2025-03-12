import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function AppLayout() {
  const { isAuthenticated, signOut } = useAuth();

  // Verificar autenticação e redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  // Botão de logout para o header
  const LogoutButton = () => (
    <TouchableOpacity
      onPress={signOut}
      style={{ marginRight: 15 }}
    >
      <Ionicons name="log-out-outline" size={24} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: '#3498db' },
        headerTintColor: '#fff',
        drawerActiveTintColor: '#3498db',
        drawerType: 'front',
        headerLeft: () => null, // Remove o ícone de drawer da barra superior
        swipeEnabled: false, // Desativa a abertura da drawer por gesto de swipe
        drawerPosition: 'right',
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Início',
          drawerLabel: 'Principal',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          drawerLabel: 'Perfil',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="definicoes"
        options={{
          title: 'Definições',
          drawerLabel: 'Definições',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="sobre"
        options={{
          title: 'Sobre',
          drawerLabel: 'Sobre',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
