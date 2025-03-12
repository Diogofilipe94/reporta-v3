
import CustomTabBar from '@/components/CustomTabBar';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';


export default function HomeScreen() {

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo </Text>
      </View>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
  },
});
