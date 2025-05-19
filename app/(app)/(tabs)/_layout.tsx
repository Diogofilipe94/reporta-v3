import { useTheme } from '@/contexts/ThemeContext';
import { Tabs } from 'expo-router/tabs';

export default function TabsLayout() {

  const { colors, isDark } = useTheme();

  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? colors.background : colors.primary },
        headerTintColor: isDark ? colors.textTertiary : colors.primary,
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
