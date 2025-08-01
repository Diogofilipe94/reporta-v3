import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Animated
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import MapView, { Marker } from 'react-native-maps';
import { UserReport, Category } from '@/types/types';
import { useTheme } from '@/contexts/ThemeContext';
import CustomTabBar from '@/components/CustomTabBar';
import { ImageManipulator } from 'expo-image-manipulator';

const BACKEND_BASE_URL = 'https://reporta.up.railway.app';

export default function EditReportScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const tabbarOpacity = useRef(new Animated.Value(1)).current;

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Estados para dados do report
  const [report, setReport] = useState<UserReport | null>(null);
  const [locationText, setLocationText] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photo, setPhoto] = useState('');
  const [photoURI, setPhotoURI] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [comment, setComment] = useState(''); // Novo estado para comentário

  // Estados de UI
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Efeito para detectar quando o teclado é mostrado ou ocultado
  useEffect(() => {
    // Para iOS usamos keyboardWillShow para antecipar a ocultação
    // Para Android continuamos usando keyboardDidShow
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardWillShowListener = Keyboard.addListener(
      keyboardShowEvent,
      () => {
        // Inicia a animação para esconder a tabbar
        Animated.timing(tabbarOpacity, {
          toValue: 0,
          duration: 150, // Duração mais curta para esconder rapidamente
          useNativeDriver: true
        }).start();
        setKeyboardVisible(true);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      keyboardHideEvent,
      () => {
        // Inicia a animação para mostrar a tabbar
        Animated.timing(tabbarOpacity, {
          toValue: 1,
          duration: 200, // Um pouco mais lento ao mostrar para suavizar
          useNativeDriver: true
        }).start();
        setKeyboardVisible(false);
      }
    );

    // Cleanup function
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Função para fazer o scroll até um campo específico
  const focusOnInput = (y: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: y, animated: true });
    }
  };

  // Função para capitalizar texto
  const capitalizeText = (text: string | null | undefined): string => {
    if (!text) return '';

    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Obter URL completa da imagem - Atualizada para usar o novo endpoint
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

  // Função auxiliar para obter o endereço a partir das coordenadas
  const getAddressFromCoordinates = async (coords: { latitude: number; longitude: number }) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];

        const addressComponents = [
          address.name,
          address.street,
          address.streetNumber,
          address.district,
          address.postalCode,
          address.city,
          address.region,
          address.country
        ].filter(Boolean);

        return addressComponents.join(', ');
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      return null;
    }
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

  // Carregar categorias
  const fetchCategories = async () => {
    try {
      setFetchingCategories(true);

      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BACKEND_BASE_URL}/api/categories`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      Alert.alert('Erro', 'Não foi possível buscar as categorias.');
    } finally {
      setFetchingCategories(false);
    }
  };

  // Carregar detalhes do report ao iniciar
  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!id) {
        setError('ID do report não encontrado');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setImageError(false); // Resetar erro de imagem quando carrega novos dados

        const token = await AsyncStorage.getItem('token');

        if (!token) {
          setError('Não autorizado. Faça login novamente.');
          setIsLoading(false);
          return;
        }

        // Carregar categorias disponíveis
        await fetchCategories();

        // Carregar dados do report
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

        // Populando os estados com dados do report
        setLocationText(data.location.split('-')[0]?.trim() || '');

        const coords = extractCoordinates(data.location);
        if (coords) {
          setLocationCoords(coords);
        }

        // Usar photo_url se disponível, senão construir URL
        const imageUrl = data.photo_url || getFullImageUrl(data.photo);
        setPhotoURI(imageUrl || '');
        setPhoto(data.photo || '');

        if (data.categories && data.categories.length > 0) {
          setSelectedCategories((data.categories as Category[]).map((cat: Category) => cat.id));
        }

        // Carregar comentário existente
        setComment(data.comment || '');

      } catch (error) {
        console.error('Erro ao buscar detalhes do report:', error);
        setError('Não foi possível carregar os detalhes. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);

  // Obter localização atual
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'A permissão de localização é necessária para esta funcionalidade.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocationCoords(locationData);

      // Obter endereço completo a partir das coordenadas
      const address = await getAddressFromCoordinates(locationData);

      if (address) {
        setLocationText(address);
      } else {
        // Fallback para coordenadas
        setLocationText(`${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Não foi possível obter a localização atual.');
      console.error(error);
    }
  };

  // Toggle categoria
  const toggleCategorySelection = (categoryId: number) => {
    setSelectedCategories(prevSelected => {
      if (prevSelected.includes(categoryId)) {
        return prevSelected.filter(id => id !== categoryId);
      } else {
        return [...prevSelected, categoryId];
      }
    });
  };

  // Tirar foto
  const takePhoto = async () => {
    try {
      // Solicitar permissão da câmera primeiro
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'A permissão da camera é necessária para esta funcionalidade.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await processImageForUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Não foi possível tirar a foto.');
    }
  };

  const pickImage = async () => {
    try {
      // Solicitar permissão da galeria primeiro
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'A permissão para aceder à camera é necessária para esta funcionalidade.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await processImageForUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Não foi possível selecionar a imagem.');
    }
  };

  // Processar imagem para upload
  const processImageForUpload = async (uri: string) => {
  try {
    const fileName = uri.split('/').pop() || '';
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

    if (!['jpg', 'jpeg', 'png'].includes(fileExt)) {
      Alert.alert('Formato inválido', 'A imagem deve ser do tipo: jpeg, jpg, png');
      return;
    }

    const fileInfo = await FileSystem.getInfoAsync(uri);

    if (fileInfo.exists) {
      const fileSizeInMB = fileInfo.size / (1024 * 1024);
      console.log(`Tamanho original da imagem: ${fileSizeInMB.toFixed(4)}MB`);

      // Usa nova API: ImageManipulator.manipulate
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      const compressedInfo = await FileSystem.getInfoAsync(result.uri);
      const compressedSizeMB = compressedInfo.exists ? compressedInfo.size / (1024 * 1024) : 0;
      console.log(`Tamanho após compressão: ${compressedSizeMB.toFixed(4)}MB`);

      const normalizedUri = Platform.OS === 'ios' ? result.uri.replace('file://', '') : result.uri;
      setPhotoURI(normalizedUri);
      setImageError(false);
    }
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    Alert.alert('Erro', 'Ocorreu um problema ao processar a imagem.');
  }
};

  // Salvar alterações do report
  const saveReport = async () => {
    try {
      // Verificar se há pelo menos uma categoria selecionada
      if (selectedCategories.length === 0) {
        Alert.alert('Erro', 'Por favor, selecione pelo menos uma categoria');
        return;
      }

      // Fechar o teclado antes de salvar
      Keyboard.dismiss();

      setIsSaving(true);
      const token = await AsyncStorage.getItem('token');

      // Preparar formData
      const formData = new FormData();

      // Enviar morada e coordenadas apenas se tiverem sido definidas
      if (locationText && locationCoords) {
        formData.append('address', locationText);
        formData.append('latitude', locationCoords.latitude.toString());
        formData.append('longitude', locationCoords.longitude.toString());

        // Para compatibilidade com o backend atual
        const coordsString = `${locationCoords.latitude.toFixed(6)}, ${locationCoords.longitude.toFixed(6)}`;
        const locationString = `${locationText} - ${coordsString}`;
        formData.append('location', locationString);
      } else if (report && report.location) {
        // Se o utilizador não selecionou uma nova localização, manter a existente
        formData.append('location', report.location);

        const coords = extractCoordinates(report.location);
        if (coords) {
          formData.append('latitude', coords.latitude.toString());
          formData.append('longitude', coords.longitude.toString());
        }

        // Endereço pode estar na parte inicial do campo location
        const addressPart = report.location.split('-')[0]?.trim();
        if (addressPart) {
          formData.append('address', addressPart);
        }
      }

      // Adicionar comentário
      formData.append('comment', comment);

      // Adicionar categorias
      selectedCategories.forEach(categoryId => {
        formData.append('category_id[]', categoryId.toString());
      });

      // Verificar se o utilizador selecionou uma nova foto (URI local, não URL)
      const isNewPhotoSelected = photoURI &&
                               !photoURI.includes(BACKEND_BASE_URL) &&
                               !photoURI.includes('http');

      if (isNewPhotoSelected) {
        // utilizador selecionou uma nova foto
        const fileName = photoURI.split('/').pop() || 'photo.jpg';
        const fileType = fileName.endsWith('.png')
          ? 'image/png'
          : fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/jpg';

        // No Android, garantimos que a URI está no formato correto
        const fileUri = Platform.OS === 'ios'
          ? photoURI.replace('file://', '')
          : photoURI.startsWith('file://')
            ? photoURI
            : `file://${photoURI}`;

        try {
          // Verifica se o arquivo existe
          const fileInfo = await FileSystem.getInfoAsync(
            Platform.OS === 'ios' ? photoURI : fileUri.replace('file://', '')
          );

          if (!fileInfo.exists) {
            throw new Error('Arquivo de imagem não encontrado');
          }

          // Adiciona a foto ao FormData apenas se o arquivo existir
          formData.append('photo', {
            uri: fileUri,
            name: fileName,
            type: fileType
          } as any);

          console.log(`Enviando nova foto: ${fileName}, tipo: ${fileType}`);
        } catch (error) {
          console.error('Erro ao verificar arquivo de imagem:', error);
          Alert.alert('Erro', 'Não foi possível processar a imagem selecionada. Por favor, tente novamente.');
          setIsSaving(false);
          return;
        }
      } else {
        console.log('Mantendo a foto existente, não enviando nova imagem');
        // Se o utilizador não está enviando uma nova foto, não incluímos nenhum campo de foto
        // O backend manterá a foto existente por padrão
      }

      // Muitos frameworks usam este padrão para simular PUT com formData
      formData.append('_method', 'PUT');

      console.log('Enviando dados para API:', formData);

      // Enviar requisição para API
      const response = await fetch(`${BACKEND_BASE_URL}/api/reports/${id}`, {
        method: 'POST', // Usamos POST mas com _method=PUT para compatibilidade
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const responseText = await response.text();
      console.log('Resposta do servidor:', responseText);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Resposta inválida do servidor:', responseText);
        throw new Error('Formato de resposta inválido');
      }

      if (response.ok) {
        Alert.alert(
          'Sucesso',
          'Report atualizado com sucesso!',
          [{ text: 'OK', onPress: () => router.replace(`/report/${id}`) }]
        );
      } else {
        if (data.messages) {
          const errorMessages = Object.values(data.messages).flat().join('\n');
          Alert.alert('Erro de Validação', errorMessages);
        } else {
          Alert.alert('Erro', data.error || 'Erro ao atualizar o report');
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar report:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o report.');
    } finally {
      setIsSaving(false);
    }
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

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.accent }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 50}
    >
      <View style={[styles.container, { backgroundColor: isDark? colors.background : colors.accent }]}>
        <Stack.Screen
          options={{
            title: 'Editar Report',
            headerStyle: { backgroundColor: isDark? colors.background : colors.accent },
            headerTintColor: colors.primary,
            headerShadowVisible: false,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.navigate(`/report/${id}`)}>
                <Ionicons name="arrow-back" size={24} color={colors.primary} style={{paddingHorizontal:16}}/>
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEnabled={true}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          onScrollBeginDrag={() => Keyboard.dismiss()}
        >
          {/* Seção: Foto */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Foto</Text>

            <TouchableOpacity
              style={[
                styles.photoUploadContainer,
                {
                  borderColor: colors.divider,
                  backgroundColor: isDark ? colors.surface : "#f9f9f9"
                }
              ]}
              onPress={photoURI ? undefined : () => setPhotoModalVisible(true)}
              activeOpacity={0.7}
            >
              {photoURI ? (
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
                      source={{ uri: photoURI }}
                      style={styles.photoPreview}
                      contentFit="cover"
                      onError={handleImageError}
                      transition={300}
                      cachePolicy="memory-disk"
                    />
                  )}
                  <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={() => setPhotoModalVisible(true)}
                  >
                    <Text style={styles.changePhotoText}>Alterar foto</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={50} color={colors.textSecondary} />
                  <Text style={[styles.photoPlaceholderText, {color: colors.textSecondary}]}>Adicionar foto</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Seção: Categoria */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Categorias</Text>

            {fetchingCategories ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <View style={styles.categoryChipsContainer}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isDark ? colors.surface : colors.accent,
                        borderColor: isDark ? colors.surface : colors.background,
                      },
                      selectedCategories.includes(category.id) && [
                        styles.selectedCategoryChip,
                        {backgroundColor: isDark? colors.surface : colors.primary, borderColor: isDark? colors.accent : colors.surface}
                      ]
                    ]}
                    onPress={() => toggleCategorySelection(category.id)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        {color: isDark? colors.accent : colors.textPrimary},
                        selectedCategories.includes(category.id) && [
                          {color: isDark ? colors.accent : colors.textTertiary}
                        ]
                      ]}
                    >
                      {capitalizeText(category.category)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Seção: Localização */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Localização</Text>

            <TouchableOpacity
              style={[styles.locationSelectButton, {backgroundColor: isDark? colors.surface : colors.primary, borderColor: colors.accent}]}
              onPress={() => setShowLocationOptions(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.locationSelectText, {color: isDark? colors.accent : colors.textTertiary}]}>
                {locationText ? 'Alterar localização' : 'Selecionar localização'}
              </Text>
              <Ionicons name="location" size={24} color={isDark? colors.accent : colors.textTertiary} />
            </TouchableOpacity>

            {locationText && (
              <View style={[styles.locationInfoContainer, {backgroundColor: isDark? colors.surface : colors.accent}]}>
                <Text style={[styles.locationInfoTitle, {color: colors.textPrimary}]}>Morada:</Text>
                <Text style={[styles.locationInfoText, {color: colors.textPrimary}]}>{locationText}</Text>

                {locationCoords && (
                  <>
                    <Text style={[styles.locationInfoTitle, {color: colors.textPrimary, marginTop: 8}]}>Coordenadas:</Text>
                    <Text style={[styles.locationInfoText, {color: colors.textSecondary, fontSize: 12}]}>
                      {locationCoords.latitude.toFixed(6)}, {locationCoords.longitude.toFixed(6)}
                    </Text>
                  </>
                )}
              </View>
            )}

            {locationCoords && (
              <View style={styles.miniMapContainer}>
                <MapView
                  style={styles.miniMap}
                  region={{
                    latitude: locationCoords.latitude,
                    longitude: locationCoords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: locationCoords.latitude,
                      longitude: locationCoords.longitude,
                    }}
                  />
                </MapView>
              </View>
            )}
          </View>

          {/* Seção: Comentário */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Comentário</Text>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: isDark ? colors.surface : "#f9f9f9",
                  borderColor: colors.divider,
                  color: colors.textPrimary
                }
              ]}
              placeholder="Adicione um comentário sobre este report (opcional)"
              placeholderTextColor={colors.textSecondary}
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
              onFocus={() => focusOnInput(980)}
            />
          </View>

          {/* Botões de ação */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.textSecondary }]}
              onPress={() => router.navigate(`/report/${id}`)}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                isSaving && { opacity: 0.7 }
              ]}
              onPress={saveReport}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.textTertiary} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color={isDark? colors.surface : colors.textTertiary} />
                  <Text style={[styles.buttonText, { color: isDark? colors.surface : colors.textTertiary, marginLeft: 5 }]}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Modais */}
        {/* Modal de opções de localização */}
        {showLocationOptions && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
              <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>Escolha uma opção</Text>

              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.primary}]}
                onPress={() => {
                  getCurrentLocation();
                  setShowLocationOptions(false);
                }}
              >
                <Text style={[styles.modalButtonText, {color: isDark? colors.surface : colors.textTertiary}]}>Usar minha localização atual</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.primary}]}
                onPress={() => {
                  setMapVisible(true);
                  setShowLocationOptions(false);
                }}
              >
                <Text style={[styles.modalButtonText, {color: isDark? colors.surface : colors.textTertiary}]}>Escolher uma localização no mapa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton, {borderColor: colors.primary}]}
                onPress={() => setShowLocationOptions(false)}
              >
                <Text style={[styles.modalButtonText, {color: colors.primary}]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Modal do mapa */}
        {mapVisible && (
          <View style={styles.modalOverlay}>
            <View style={[styles.mapModalContent, {backgroundColor: colors.surface}]}>
              <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>Toque no mapa para escolher a localização</Text>

              <View style={styles.fullMapContainer}>
                <MapView
                  style={styles.fullMap}
                  initialRegion={{
                    latitude: locationCoords?.latitude || 41.1579,
                    longitude: locationCoords?.longitude || -8.6291,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                  onPress={async (event) => {
                    const coords = event.nativeEvent.coordinate;
                    setLocationCoords(coords);

                    // Obter endereço
                    const address = await getAddressFromCoordinates(coords);

                    if (address) {
                      setLocationText(address);
                    } else {
                      setLocationText(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
                    }
                  }}
                >
                  {locationCoords && (
                    <Marker
                      coordinate={{
                        latitude: locationCoords.latitude,
                        longitude: locationCoords.longitude,
                      }}
                    />
                  )}
                </MapView>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.modalButtonMap, styles.confirmButton, {backgroundColor: colors.primary}]}
                  onPress={() => setMapVisible(false)}
                >
                  <Text style={[styles.modalButtonText, {color: isDark? colors.surface : colors.textTertiary}]}>Confirmar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButtonMap, styles.cancelModalButton, {borderColor: colors.primary}]}
                  onPress={() => setMapVisible(false)}
                >
                  <Text style={[styles.modalButtonText, {color: colors.primary}]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Modal de opções de foto */}
        {photoModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
              <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>Adicionar Foto</Text>

              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.primary}]}
                onPress={() => {
                  takePhoto();
                  setPhotoModalVisible(false);
                }}
              >
                <Text style={[styles.modalButtonText, {color: colors.textTertiary}]}>Tirar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.primary}]}
                onPress={() => {
                  pickImage();
                  setPhotoModalVisible(false);
                }}
              >
                <Text style={[styles.modalButtonText, {color: colors.textTertiary}]}>Escolher da Galeria</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton, {borderColor: colors.primary}]}
                onPress={() => setPhotoModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, {color: colors.primary}]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Animated.View style={{ opacity: tabbarOpacity, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <CustomTabBar />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
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
    padding: 16,
    paddingBottom: 40,
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
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  locationSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    borderWidth: 1,
  },
  locationSelectText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationInfoContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  locationInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationInfoText: {
    fontSize: 14,
  },
  miniMapContainer: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginTop: 5,
    marginBottom: 5,
  },
  categoryChip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 5,
    borderWidth: 1,
  },
  selectedCategoryChip: {
    // Colors set dynamically
  },
  photoUploadContainer: {
    width: '100%',
    height: 240,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    marginTop: 10,
    fontSize: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  // Novo estilo para o campo de comentário
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  mapModalContent: {
    width: '90%',
    height: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelModalButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // Color set dynamically
  },
  fullMapContainer: {
    width: '100%',
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 15,
  },
  fullMap: {
    width: '100%',
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonMap: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
});
