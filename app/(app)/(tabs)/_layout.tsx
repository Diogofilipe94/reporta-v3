import { Tabs } from 'expo-router/tabs';
import { View } from 'react-native';

export default function TabsLayout() {
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
