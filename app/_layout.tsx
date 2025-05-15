import React from 'react';
import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from './contexts/AuthContext';
import { StatusBar } from 'react-native';
import { TabProvider } from './contexts/TabContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

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
    <ThemeProvider>
      <StatusBarComponent />
      <AuthProvider>
        <TabProvider>
          <Slot />
        </TabProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Componente separado para StatusBar que usa useTheme
function StatusBarComponent() {
  const { colors, isDark } = useTheme();

  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      hidden={false}
      translucent={false}
      backgroundColor={isDark ? colors.background : colors.primary}
    />
  );
}
