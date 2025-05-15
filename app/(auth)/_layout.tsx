import { Stack } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(app)/(tabs)');
    }
  }, [isAuthenticated]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#3498db' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: '',
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
