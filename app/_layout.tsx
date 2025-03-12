import React from 'react';
import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from './contexts/AuthContext';

import { View } from 'react-native';
import { TabProvider } from './contexts/TabContext';

// Manter a SplashScreen visível
SplashScreen.preventAutoHideAsync();

// Layout raiz que não depende da verificação de autenticação
export default function RootLayout() {
  // Carregar fontes
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <TabProvider>
        <Slot />
      </TabProvider>
    </AuthProvider>
  );
}
