import { useTheme } from '@/constants/Colors';
import { Tabs } from 'expo-router/tabs';

export default function TabsLayout() {

  const { colors, isDark } = useTheme();

  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{
        headerStyle: { backgroundColor: '#3498db' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          header: () => null,
        }}
      />
      <Tabs.Screen
        name="novo"
        options={{
          header: () => null,
        }}
      />
      <Tabs.Screen
        name="drawer"
        options={{
          title: 'Menu',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
