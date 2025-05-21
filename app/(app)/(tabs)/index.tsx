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
  Platform,
  StyleSheet
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import baseStyles from '@/assets/styles/(app)/(tabs)/index.styles';
import DashboardSummary from '@/components/DashboardSummary';
import { UserReport } from '@/types/types';
import { useRouter } from 'expo-router';


const BACKEND_BASE_URL = "https://reporta.up.railway.app";


const getFullImageUrl = (relativePath: string | null, reportId?: number) => {
  if (!relativePath) return null;

  if (relativePath.startsWith('http')) {
    return relativePath;
  }

  // Extraia o nome do arquivo, ignorando qualquer caminho
  const fileName = relativePath.split('/').pop() || relativePath;

  // Use o novo endpoint de API dedicado a fotos
  return `${BACKEND_BASE_URL}/api/photos/${fileName}`;
};

export default function HomeScreen() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Combinação de estilos base e locais
  const styles = {...baseStyles, ...localStyles};

  // Função para capitalizar texto (primeira letra de cada palavra em maiúscula)
  const capitalizeText = (text: string | null | undefined): string => {
    if (!text) return '';

    // Divide o texto em palavras, capitaliza cada uma e junta novamente
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    getUserReports();
  }, []);


  useEffect(() => {
  // Log para verificar as URLs das imagens
  if (reports.length > 0) {
    reports.forEach(report => {
      const imageUrl = report.photo_url || getFullImageUrl(report.photo, report.id);
      console.log(`Report ${report.id} - URL da imagem: ${imageUrl}`);
    });
  }
}, [reports]);

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
      // Limpa os erros de imagem quando carrega novos reports
      setImageErrors({});
    } catch (error) {
      console.error('Erro ao buscar reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await getUserReports();
  };

  const handleImageError = (error: any, reportId: number, imageUrl: string) => {
  console.error(`Erro ao carregar imagem do report ${reportId}:`, JSON.stringify(error));
  console.log('URL com erro:', imageUrl);

  // Marca essa imagem como com erro para mostrar um placeholder
  setImageErrors(prev => ({ ...prev, [reportId]: true }));
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{color: colors.textPrimary, marginTop: 10}}>
              A carregar reports...
            </Text>
          </View>
        ) : (
          <>
            <DashboardSummary reports={reports} colors={colors} />

            <View style={[styles.reportsSection, {backgroundColor: isDark? colors.background : colors.surface}]}>
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

                    // Usa photo_url se disponível, senão constrói a URL
                    const imageUrl = report.photo_url || getFullImageUrl(report.photo, report.id);
                    const hasImageError = imageErrors[report.id];

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
                              <View  style={styles.icon}>
                                <Ionicons name="location-outline" size={18} color={colors.primary}/>
                              </View>
                              <Text style={[styles.reportInfoText, { color: colors.textSecondary }]}>
                                {report.location.split('-')[0]?.trim() || 'Local não especificado'}
                              </Text>
                            </View>

                            <View style={styles.reportInfoRow}>
                              <View  style={styles.icon}>
                                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                              </View>
                              <Text style={[styles.reportInfoText, { color: colors.textSecondary }]}>
                                {new Date(report.date).toLocaleDateString()}
                              </Text>
                            </View>

                            <View style={styles.reportInfoRow}>
                              <View  style={styles.icon}>
                                <Ionicons name="pricetags-outline" size={18} color={colors.primary} />
                              </View>
                              <View style={styles.categoriesContainer}>
                                {report.categories && report.categories.length > 0 ? (
                                  report.categories.map((category, index) => (
                                    <View
                                      key={index}
                                      style={[styles.categoryChip, { backgroundColor: isDark ? colors.surface : colors.accent, borderColor: isDark ? colors.primary : colors.textSecondary }]}
                                    >
                                      <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
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

                          {(report.photo || report.photo_url) && (
                            <View style={styles.reportPhotoContainer}>
                              {hasImageError ? (
                                <View style={[styles.imagePlaceholder, {backgroundColor: colors.divider}]}>
                                  <Ionicons name="image-outline" size={30} color={colors.textSecondary} />
                                  <Text style={{color: colors.textSecondary, fontSize: 12, marginTop: 5}}>
                                    Imagem indisponível
                                  </Text>
                                </View>
                              ) : (
                                <Image
                                  source={imageUrl ? { uri: imageUrl } : undefined}
                                  style={styles.reportPhoto}
                                  onError={(error) => handleImageError(error, report.id, imageUrl || '')}
                                  contentFit="cover"
                                  transition={300}
                                  cachePolicy="memory-disk"
                                />
                              )}
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyReportsContainer}>
                  <Ionicons name="construct-outline" size={50} color={colors.textSecondary} />
                  <Text style={[styles.emptyReportsText, { color: colors.textSecondary }]}>
                    Nenhum Report encontrado.
                  </Text>

                  <Text style={[styles.emptyReportsText, { color: colors.textSecondary }]}>
                    Crie um novo report para começar.
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

// Estilos locais para complementar os existentes
const localStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    minHeight: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reportsSection: {
    marginTop: 24,
    paddingBottom: 16,
  },
  reportsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportsList: {
    gap: 16,
  },
  reportCard: {
    borderRadius: 12,
    //overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportCardContent: {
    padding: 16,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportStatusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reportStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reportCardBody: {
    marginBottom: 16,
  },
  reportInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  reportInfoText: {
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  categoriesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 8,
  },
  categoryChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',

  },
  reportPhotoContainer: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
  },
  reportPhoto: {
    width: '100%',
    height: '100%',
  },
  emptyReportsContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyReportsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  }
});
