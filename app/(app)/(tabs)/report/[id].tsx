import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Alert, SafeAreaView, StatusBar, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserReport } from '@/types/types';
import MapView, { Marker } from 'react-native-maps';
import CustomTabBar from '@/components/CustomTabBar';

export default function ReportDetailsScreen() {

  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const BACKEND_BASE_URL = Platform.select({
    ios: 'https://reporta.up.railway.app',
    android: 'https://reporta.up.railway.app',
    default: 'https://reporta.up.railway.app'
  });

  // Função atualizada para usar o endpoint de photos
  const getFullImageUrl = (relativePath: string | null) => {
    if (!relativePath) return null;

    // Se já for uma URL completa, retorna como está
    if (relativePath.startsWith('http')) {
      return relativePath;
    }

    // Extrai apenas o nome do arquivo, ignorando qualquer caminho
    const fileName = relativePath.split('/').pop() || relativePath;

    // Usa o novo endpoint de API para fotos
    return `${BACKEND_BASE_URL}/api/photos/${fileName}`;
  };

  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<UserReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Estilo do status
  const getStatusStyle = (status: string | null | undefined) => {
    const statusLower = status?.toLowerCase() || '';

    if (statusLower === 'pendente') {
      return {
        icon: <Ionicons name="time-outline" size={24} color={isDark ? colors.accent : colors.textTertiary} />,
        bgColor: colors.error,
        textColor: colors.textPrimary
      };
    } else if (statusLower === 'em resolução' || statusLower === 'em analise' || statusLower === 'em análise') {
      return {
        icon: <Ionicons name="search-outline" size={24} color={isDark ? colors.accent : colors.textTertiary} />,
        bgColor: colors.warning,
        textColor: colors.textPrimary
      };
    } else if (statusLower === 'resolvido') {
      return {
        icon: <Ionicons name="checkmark-circle-outline" size={24} color={isDark ? colors.accent : colors.textTertiary} />,
        bgColor: colors.success,
        textColor: colors.textPrimary
      };
    } else {
      return {
        icon: <Ionicons name="help-circle-outline" size={24} color={isDark ? colors.accent : colors.textTertiary} />,
        bgColor: '#9CA3AF',
        textColor: '#4B5563'
      };
    }
  };

  const isResolved = report?.status?.status?.toLowerCase() === 'resolvido';

  // Função para capitalizar texto (primeira letra de cada palavra em maiúscula)
  const capitalizeText = (text: string | null | undefined): string => {
    if (!text) return '';

    // Divide o texto em palavras, capitaliza cada uma e junta novamente
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Extrair coordenadas da localização
  const extractCoordinates = (location: string | undefined) => {
    if (!location) return null;

    const parts = location.split('-');
    if (parts.length < 2) return null;

    const coordPart = parts[1].trim();
    const [latStr, lngStr] = coordPart.split(',').map(s => s.trim());

    try {
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lngStr);

      if (isNaN(latitude) || isNaN(longitude)) return null;

      return { latitude, longitude };
    } catch (e) {
      console.error('Erro ao extrair coordenadas:', e);
      return null;
    }
  };

  // Tratar erros de carregamento de imagem
  const handleImageError = (error: any) => {
    console.error('Erro ao carregar imagem:', error);
    setImageError(true);
  };

  // Buscar detalhes do report
  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!id) {
        setError('ID do report não encontrado');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          setError('Não autorizado. Faça login novamente.');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${BACKEND_BASE_URL}/api/reports/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setReport(data);
        // Reset image error when loading new report
        setImageError(false);
      } catch (error) {
        console.error('Erro ao buscar detalhes do report:', error);
        setError('Não foi possível carregar os detalhes. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);

  // Excluir report
  const deleteReport = async () => {
    if (!report || !id) return;

    try {
      setActionInProgress(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Erro', 'Não autorizado. Faça login novamente.');
        return;
      }

      const response = await fetch(`${BACKEND_BASE_URL}/api/reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      Alert.alert(
        'Sucesso',
        'Report excluído com sucesso!',
        [{ text: 'OK', onPress: () => router.replace('/(app)/(tabs)') }]
      );
    } catch (error: any) {
      console.error('Erro ao excluir report:', error);
      Alert.alert('Erro', error.message || 'Não foi possível excluir o report. Tente novamente.');
    } finally {
      setActionInProgress(false);
      setShowDeleteConfirm(false);
    }
  };

  // Navegar para a página de edição do report
  const navigateToEditReport = () => {
    if (!report || !id) return;
    router.push(`/editReport/${id}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.accent }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
          A carregar detalhes...
        </Text>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.accent }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || 'Report não encontrado'}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonText, { color: colors.textTertiary }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Obter estilo do status
  const statusStyle = getStatusStyle(report.status?.status);

  // Extrair coordenadas para o mapa
  const coordinates = extractCoordinates(report.location);

  // Determinar a URL da imagem (usando photo_url se disponível)
  const imageUrl = report.photo_url || getFullImageUrl(report.photo);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.accent }]}>
      <Stack.Screen
        options={{
          title: 'Detalhes do Report',
          headerStyle: { backgroundColor: isDark ? colors.background : colors.accent },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} style={{ paddingHorizontal: 16 }} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >

        {/* Foto do Report */}
        {report.photo && (
          <View style={styles.section}>
            <View style={styles.photoContainer}>
              {imageError ? (
                <View style={[styles.imagePlaceholder, {backgroundColor: colors.divider}]}>
                  <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
                  <Text style={{color: colors.textSecondary, marginTop: 10}}>
                    Imagem indisponível
                  </Text>
                </View>
              ) : (
                <Image
                  source={imageUrl}
                  style={styles.photo}
                  contentFit="cover"
                  onError={handleImageError}
                  transition={300}
                  cachePolicy="memory-disk"
                />
              )}
            </View>
          </View>
        )}

        {/* Status do Report */}
        <View style={styles.section}>
          <View style={[styles.statusContainer, { backgroundColor: statusStyle.bgColor }]}>
            {statusStyle.icon}
            <Text style={[styles.statusText, { color: isDark ? colors.accent : colors.textTertiary }]}>
              {report.status?.status?.toLowerCase() === 'em resolução'
                ? 'Em Análise'
                : capitalizeText(report.status?.status) || 'Desconhecido'}
            </Text>
          </View>
        </View>

        {/* Informações do Report */}
        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          {/* Data */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Data</Text>
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                {new Date(report.created_at).toLocaleDateString()} - {new Date(report.created_at).toLocaleTimeString()}
              </Text>
            </View>
          </View>

          {/* Categorias */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="pricetags-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>Categorias</Text>
              <View style={styles.categoriesContainer}>
                {report.categories && report.categories.length > 0 ? (
                  report.categories.map((category, index) => (
                    <View
                      key={index}
                      style={[styles.categoryChip, { backgroundColor: isDark ? colors.surface : colors.accent }]}
                    >
                      <Text style={[styles.categoryText, { color: isDark ? colors.accent : colors.textPrimary }]}>
                        {capitalizeText(category.category)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Sem categorias
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Localização */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="location-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Localização</Text>
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                {report.location.split('-')[0]?.trim() || 'Local não especificado'}
              </Text>
            </View>
          </View>

          {/* Comentário - Nova seção */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Comentário</Text>
              {report.comment ? (
                <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                  {report.comment}
                </Text>
              ) : (
                <Text style={[styles.infoText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                  Sem comentário
                </Text>
              )}
            </View>
          </View>

          {/* Mapa com a localização */}
          {coordinates && (
            <View style={styles.mapSection}>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                >
                  <Marker
                    coordinate={{
                      latitude: coordinates.latitude,
                      longitude: coordinates.longitude,
                    }}
                    title={report.location.split('-')[0]?.trim() || 'Localização do Report'}
                  />
                </MapView>
              </View>
            </View>
          )}
        </View>

        {!isResolved ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.textSecondary }]}
              onPress={navigateToEditReport}
              disabled={actionInProgress}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="create-outline" size={20} color={colors.primary} />
                <Text style={[styles.buttonText, { color: isDark ? colors.textPrimary : colors.primary, marginLeft: 5 }]}>Editar</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                actionInProgress && { opacity: 0.7 }
              ]}
              onPress={() => setShowDeleteConfirm(true)}
              disabled={actionInProgress}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="trash-outline" size={20} color={isDark ? colors.surface : colors.textTertiary} />
                <Text style={[styles.buttonText, { color: isDark ? colors.surface : colors.textTertiary, marginLeft: 5 }]}>Eliminar</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[{ backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 20, padding: 12, borderRadius: 8 }]}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              Este report já foi resolvido e não pode ser modificado.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.modalContent}>
              <Ionicons name="warning-outline" size={48} color={colors.error} style={styles.modalIcon} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Confirmar Exclusão
              </Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                Tem certeza que deseja eliminar este report? Esta ação não pode ser desfeita.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.primary }]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={actionInProgress}
              >
                <Text style={[styles.modalButtonText, { color: colors.primary }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton, { backgroundColor: colors.error }]}
                onPress={deleteReport}
                disabled={actionInProgress}
              >
                {actionInProgress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: "#fff" }]}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  photoContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
  },
  mapSection: {
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  cancelButton: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.48,
  },
  saveButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.48,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
