import CustomTabBar from '@/components/CustomTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/app/contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styles from '@/assets/styles/(app)/(tabs)/index.styles';
import DashboardSummary from '@/components/DashboardSummary';
import { UserReport } from '@/types/types';
import { useRouter } from 'expo-router';


const BACKEND_BASE_URL = Platform.select({
  ios: 'http://localhost:8000',
  android: 'http://10.0.2.2:8000',
  default: 'http://127.0.0.1:8000'
});

  const getFullImageUrl = (relativePath: string | null) => {
    if (!relativePath) return null;

    if (relativePath.startsWith('http')) {
      return relativePath;
    }

    const cleanPath = relativePath.replace(/^\/+/, '');
    const url = `${BACKEND_BASE_URL}/storage/${cleanPath}`;
    return url;
  };

export default function HomeScreen() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Função para capitalizar texto (primeira letra de cada palavra em maiúscula)
  const capitalizeText = (text: string | null | undefined): string => {
    if (!text) return '';

    // Divide o texto em palavras, capitaliza cada uma e junta novamente
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Função para capitalizar texto (primeira letra de cada palavra em maiúscula)
  useEffect(() => {
    getUserReports();
  }, []);

  interface StatusStyle {
    icon: JSX.Element;
    bgColor: string;
    textColor: string;
  }

  const getStatusStyle = (status: string | null | undefined): StatusStyle => {
    const statusLower = status?.toLowerCase() || '';

    if (statusLower === 'pendente') {
      return {
        icon: <Ionicons name="time-outline" size={20} color="#fff" />,
        bgColor: colors.error,
        textColor: colors.textPrimary
      };
    } else if (statusLower === 'em resolução' || statusLower === 'em analise' || statusLower === 'em análise') {
      return {
        icon: <Ionicons name="search-outline" size={20} color="#fff" />,
        bgColor: colors.warning,
        textColor: colors.textPrimary
      };
    } else if (statusLower === 'resolvido') {
      return {
        icon: <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />,
        bgColor: colors.success,
        textColor: colors.textPrimary
      };
    } else {
      return {
        icon: <Ionicons name="help-circle-outline" size={20} color="#fff" />,
        bgColor: '#9CA3AF',
        textColor: '#4B5563'
      };
    }
  };

  const getUserReports = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BACKEND_BASE_URL}/api/user/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();

      setReports(data);
    } catch (error) {
      console.error('Erro ao buscar reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await getUserReports();
  };

  const handleImageError = (error: any, url: string) => {
    console.error(`Erro ao carregar imagem de ${url}:`, error);
  };

  // Função para navegar para a página de detalhes do report
  const navigateToReportDetails = (reportId: number) => {
    router.push(`/report/${reportId}`);
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
        style={[styles.container, { backgroundColor: isDark ? colors.background : colors.accent }]}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {isLoading ? (
          <View>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text>
              A carregar reports...
            </Text>
          </View>
        ) : (
          <>
            <DashboardSummary reports={reports} colors={colors} />

            <View style={[styles.reportsSection, {backgroundColor: isDark? colors.background : colors.accent}]}>
              <View style={styles.reportsSectionHeader}>
                <Ionicons name="albums" size={24} color={colors.primary} style={{marginHorizontal:4}} />
                <Text style={[styles.reportsSectionTitle, { color: colors.textPrimary }]}>
                  Relatórios
                </Text>
              </View>

              {reports.length > 0 ? (
                <View style={styles.reportsList}>
                  {reports.map((report) => {
                    const statusStyle = getStatusStyle(report.status?.status);

                    return (
                      <TouchableOpacity
                        key={report.id}
                        style={[styles.reportCard, { backgroundColor: isDark ? colors.surface : colors.accent }]}
                        activeOpacity={0.7}
                        onPress={() => navigateToReportDetails(report.id)}
                      >
                        <View style={styles.reportCardContent}>
                          <View style={styles.reportCardHeader}>
                            <View style={[styles.reportStatusIndicator, { backgroundColor: statusStyle.bgColor }]}>
                              {statusStyle.icon}
                            </View>
                            <Text style={[styles.reportStatusText, { color: statusStyle.textColor }]}>
                              {report.status?.status?.toLowerCase() === 'em resolução'
                                ? 'Em Análise'
                                : capitalizeText(report.status?.status) || 'Desconhecido'}
                            </Text>
                          </View>

                          <View style={styles.reportCardBody}>
                            <View style={styles.reportInfoRow}>
                              <Ionicons name="location-outline" size={18} color={colors.primary} />
                              <Text style={[styles.reportInfoText, { color: colors.textPrimary }]}>
                                {report.location.split('-')[0]?.trim() || 'Local não especificado'}
                              </Text>
                            </View>

                            <View style={styles.reportInfoRow}>
                              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                              <Text style={[styles.reportInfoText, { color: colors.textSecondary }]}>
                                {new Date(report.date).toLocaleDateString()}
                              </Text>
                            </View>

                            <View style={styles.reportInfoRow}>
                              <Ionicons name="pricetags-outline" size={18} color={colors.primary} />
                              <View style={styles.categoriesContainer}>
                                {report.categories && report.categories.length > 0 ? (
                                  report.categories.map((category, index) => (
                                    <View
                                      key={index}
                                      style={[styles.categoryChip, { backgroundColor: isDark ? colors.surface : colors.accent }]}
                                    >
                                      <Text style={[styles.categoryText, { color: colors.primary }]}>
                                        {capitalizeText(category.category)}
                                      </Text>
                                    </View>
                                  ))
                                ) : (
                                  <Text style={[styles.reportInfoText, { color: colors.textSecondary }]}>
                                    Sem categorias
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>

                          {report.photo && (
                            <View style={styles.reportPhotoContainer}>
                              <Image
                                source={getFullImageUrl(report.photo)}
                                style={styles.reportPhoto}
                                onError={(error) => handleImageError(error, getFullImageUrl(report.photo) || '')}
                                contentFit="cover"
                              />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyReportsContainer}>
                  <Ionicons name="document-outline" size={50} color={colors.textSecondary} />
                  <Text style={[styles.emptyReportsText, { color: colors.textSecondary }]}>
                    Nenhum relatório encontrado.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <CustomTabBar />
    </SafeAreaProvider>
  );
}
