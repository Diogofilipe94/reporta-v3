import CustomTabBar from '@/components/CustomTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native';
import { useTheme } from '@/constants/Colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import styles from '@/assets/styles/(app)/(tabs)/index.styles';
import DashboardSummary from '@/components/DashboardSummary'; // Importando o componente
import { UserReport } from '@/types/types';


export default function HomeScreen() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    getUserReports();
  }, []);

  const getUserReports = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch('http://127.0.0.1:8000/api/user/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Erro ao buscar reports:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true);
    await getUserReports();
  };

  return (
    <SafeAreaProvider>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        style={[styles.container, { backgroundColor: colors.accent }]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              A carregar reports...
            </Text>
          </View>
        ) : (
          <DashboardSummary reports={reports} colors={colors} />
        )}
      </ScrollView>
      <CustomTabBar />
    </SafeAreaProvider>
  );
}
