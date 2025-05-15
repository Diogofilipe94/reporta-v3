import CustomTabBar from '@/components/CustomTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { Category } from '@/types/types';
import { useTheme } from '@/app/contexts/ThemeContext';

export default function NovoScreen() {
  // Get theme colors
  const { colors, isDark } = useTheme();

  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form data
  const [locationText, setLocationText] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photo, setPhoto] = useState('');
  const [photoURI, setPhotoURI] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  const BACKEND_BASE_URL = Platform.select({
    ios: 'http://localhost:8000',
    android: 'http://10.0.2.2:8000',
    default: 'http://127.0.0.1:8000'
  });

  const router = useRouter();

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  // Function to fetch categories from the API
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
      console.log('Categorias carregadas:', data);
      setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      Alert.alert('Erro', 'Não foi possível buscar as categorias.');
    } finally {
      setFetchingCategories(false);
    }
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

        // Criar uma morada mais completa com todos os dados disponíveis
        const addressComponents = [
          address.name,
          address.street,
          address.streetNumber,
          address.district,
          address.postalCode,
          address.city,
          address.region,
          address.country
        ].filter(Boolean); // Remove elementos vazios/nulos

        return addressComponents.join(', ');
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      return null;
    }
  };

  // Request permission and get current location with complete address
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
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
      Alert.alert('Error', 'Could not get your location.');
      console.error(error);
    }
  };

  // Toggle category selection
  const toggleCategorySelection = (categoryId: number) => {
    setSelectedCategories(prevSelected => {
      // If already selected, remove it
      if (prevSelected.includes(categoryId)) {
        return prevSelected.filter(id => id !== categoryId);
      }
      // Otherwise, add it
      else {
        return [...prevSelected, categoryId];
      }
    });
  };

  // Take photo using camera
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await processImageForUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo.');
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await processImageForUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Could not select image.');
    }
  };

  // Process image to ensure it meets requirements
  const processImageForUpload = async (uri: string) => {
    try {
      // Check file type
      const fileName = uri.split('/').pop() || '';
      const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

      if (!['jpg', 'jpeg', 'png'].includes(fileExt)) {
        Alert.alert('Formato inválido', 'A imagem deve ser do tipo: jpeg, jpg, png');
        return;
      }

      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (fileInfo.exists) {
        const fileSizeInMB = fileInfo.size / (1024 * 1024);
        console.log(`Tamanho original da imagem: ${fileSizeInMB.toFixed(4)}MB`);

        // Redimensiona e comprime a imagem para garantir compatibilidade
        console.log('Iniciando compressão da imagem...');

        // Primeiro redimensiona para um tamanho menor usando a API atual
        const resizedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 600 } }], // Tamanho menor (resolução média)
          {
            compress: 1,
            format: ImageManipulator.SaveFormat.JPEG
          }
        );

        // Depois comprime a imagem redimensionada
        const compressedImage = await ImageManipulator.manipulateAsync(
          resizedImage.uri,
          [], // Sem manipulações adicionais
          {
            compress: 0.5, // 50% de compressão
            format: ImageManipulator.SaveFormat.JPEG
          }
        );

        // Verifica o tamanho final
        const compressedInfo = await FileSystem.getInfoAsync(compressedImage.uri);
        const compressedSizeMB = compressedInfo.exists ? compressedInfo.size / (1024 * 1024) : 0;
        console.log(`Tamanho após compressão: ${compressedSizeMB.toFixed(4)}MB`);

        // Normalizar o URI para iOS
        const normalizedUri = Platform.OS === 'ios' ? compressedImage.uri.replace('file://', '') : compressedImage.uri;
        setPhotoURI(normalizedUri);
        setPhoto(normalizedUri);
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao processar a imagem.');
    }
  };

  // Create the report with all collected information
  async function createReport() {
    try {
      if (!locationCoords || !locationText) {
        Alert.alert('Erro', 'Por favor, selecione uma localização');
        return;
      }

      if (!photoURI) {
        Alert.alert('Erro', 'Por favor, adicione uma foto');
        return;
      }

      if (selectedCategories.length === 0) {
        Alert.alert('Erro', 'Por favor, selecione pelo menos uma categoria');
        return;
      }

      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');

      try {
        // Backend is configured to receive a file using multipart/form-data
        const formData = new FormData();

        // Enviar morada e coordenadas separadamente
        formData.append('address', locationText); // Morada formatada para exibição
        formData.append('latitude', locationCoords.latitude.toString());
        formData.append('longitude', locationCoords.longitude.toString());

        // Para compatibilidade com o backend atual, se necessário:
        // Format location as "address - coordinates" como antes
        const coordsString = `${locationCoords.latitude.toFixed(6)}, ${locationCoords.longitude.toFixed(6)}`;
        const locationString = `${locationText} - ${coordsString}`;
        formData.append('location', locationString);

        // Adicionar categorias corretamente - enviar cada ID separadamente com o mesmo nome
        selectedCategories.forEach(categoryId => {
          formData.append('category_id[]', categoryId.toString());
        });

        // Fix photo upload - make sure it's properly formatted for multipart/form-data
        const fileName = photoURI.split('/').pop() || 'photo.jpg';
        const fileType = fileName.endsWith('.png')
          ? 'image/png'
          : fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/jpg';

        // Use a more explicit approach for appending the photo
        formData.append('photo', {
          uri: Platform.OS === 'ios' ? photoURI.replace('file://', '') : photoURI,
          name: fileName,
          type: fileType
        } as any);

        console.log('Sending data to API:', {
          address: locationText,
          latitude: locationCoords.latitude,
          longitude: locationCoords.longitude,
          location: locationString, // Campo original para compatibilidade
          category_id: selectedCategories,
          photo: `File: ${fileName}, Type: ${fileType}, URI: ${photoURI.substring(0, 50)}...`
        });

        // Send using FormData - don't specify content-type, let it be set automatically
        const response = await fetch('http://127.0.0.1:8000/api/reports', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            // Let FormData set its own Content-Type with boundary
          },
          body: formData
        });

        // Get response as text first for debugging
        const responseText = await response.text();

        // Try to parse the response as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('API Response:', data);
        } catch (e) {
          console.error('Failed to parse response as JSON:', responseText);
          throw new Error('Invalid response format from server');
        }

        if (response.ok) {
          Alert.alert('Success', 'Report created successfully!');
          setLocationText('');
          setPhoto('');
          setPhotoURI('');
          setSelectedCategories([]);
          setLocationCoords(null);
          router.push("/(app)/(tabs)");
        } else {
          console.error('API Error:', data);
          if (data.messages) {
            const errorMessages = Object.values(data.messages).flat().join('\n');
            Alert.alert('Validation Error', errorMessages);
          } else {
            Alert.alert('Error', data.error || 'Error creating report');
          }
        }
      } catch (error) {
        console.error('Request error:', error);
        Alert.alert('Connection Error', 'Could not connect to server.');
      }
    } catch (error) {
      console.error('General error:', error);
      Alert.alert('Error', 'An error occurred while creating the report');
    } finally {
      setIsLoading(false);
      setCurrentStep(1);
    }
  }

  // Functions to navigate through steps
  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1 && (!locationCoords || !locationText)) {
      Alert.alert('Erro', 'Por favor, selecione uma localização para continuar');
      return;
    }

    if (currentStep === 2 && selectedCategories.length === 0) {
      Alert.alert('Erro', 'Por favor, selecione pelo menos uma categoria para continuar');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step: create report
      createReport();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render progress indicator
  const renderProgressIndicator = () => {
    // Calculate progress based on current step (approximately 33% per step)
    const progress = (currentStep) / totalSteps;

    return (
      <View style={styles.progressContainer}>
        <Progress.Circle
          size={120}
          progress={progress}
          thickness={8}
          color={colors.primary}
          unfilledColor={isDark ? colors.divider : "#e0e0e0"}
          borderWidth={4}
          borderColor={colors.secondary}
          showsText={true}
          formatText={() => `${currentStep}/${totalSteps}`}
          style={{ marginBottom: 10 }}
        />
      </View>
    );
  };

  // Step 1: Location Selection
  const renderLocationStep = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={[styles.locationSelectButton, {backgroundColor: colors.primary}]}
            onPress={() => setShowLocationOptions(true)}
          >
            <Text style={[styles.locationSelectText, {color: isDark? colors.surface : colors.textTertiary}]}>
              {locationText ? 'Alterar localização' : 'Selecionar localização'}
            </Text>
            <Ionicons name="location" size={24} color={isDark? colors.surface : colors.textTertiary} />
          </TouchableOpacity>

          {locationText && (
            <View style={[styles.locationInfoContainer, {backgroundColor: colors.surface}]}>
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
      </View>
    );
  };

  // Step 2: Category Selection
  const renderCategoryStep = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.sectionContent}>
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
                      borderColor: isDark ? colors.surface : colors.accent
                    },
                    selectedCategories.includes(category.id) && [
                      styles.selectedCategoryChip,
                      {backgroundColor: isDark? colors.primary : colors.primary}
                    ]
                  ]}
                  onPress={() => toggleCategorySelection(category.id)}
                >
                  <Text
                    style={[
                      {color: isDark? colors.textPrimary : colors.textPrimary},
                      selectedCategories.includes(category.id) && [
                        {color: isDark? colors.surface : colors.textTertiary}
                      ]
                    ]}
                  >
                    {category.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Step 3: Photo Upload
  const renderPhotoStep = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={[
              styles.photoUploadContainer,
              {
                borderColor: colors.divider,
                backgroundColor: isDark ? colors.surface : "#f9f9f9"
              }
            ]}
            onPress={photoURI ? undefined : () => setPhotoModalVisible(true)}
          >
            {photoURI ? (
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: photoURI }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                />
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
      </View>
    );
  };

  // Determine which step to render
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderLocationStep();
      case 2:
        return renderCategoryStep();
      case 3:
        return renderPhotoStep();
      default:
        return renderLocationStep();
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Localização";
      case 2:
        return "Categorias";
      case 3:
        return "Foto";
      default:
        return "Localização";
    }
  };

  // Get next button text
  const getNextButtonText = () => {
    if (currentStep === totalSteps) {
      return isLoading ? "A guardar..." : "Guardar Report";
    }
    return "Próximo";
  };

  return (
    <View style={[styles.container, {backgroundColor: isDark? colors.background : colors.accent}]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, {backgroundColor: isDark? colors.background : colors.accent}]}>
          <Text style={[styles.headerTitle, {color: colors.primary}]}>Criar novo report</Text>
        </View>

        {/* Progress indicator */}
        {renderProgressIndicator()}

        {/* Step Title */}
        <View style={styles.stepTitleContainer}>
          <Text style={[styles.stepTitle, {color: colors.textPrimary}]}>
            {getStepTitle()}
          </Text>
        </View>

        {/* Current Step Content */}
        <View style={styles.content}>
          {renderCurrentStep()}
        </View>

        {/* Navigation Buttons */}
        <View style={[
          styles.navigationButtons,
          {
            backgroundColor: isDark ? colors.surface : "#f9f9f9",
          }
        ]}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.prevButton, {borderColor: colors.secondary}]}
              onPress={prevStep}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={[styles.buttonText, {color: colors.primary}]}>Voltar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              {backgroundColor: colors.primary},
              isLoading && {backgroundColor: isDark ? "#3a3a2b" : "#8ccde2"},
              currentStep === totalSteps ? {backgroundColor: colors.primary} : null
            ]}
            onPress={nextStep}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, {color: isDark? colors.surface : colors.textTertiary}]}>{getNextButtonText()}</Text>
            {currentStep < totalSteps ? (
              <Ionicons name="arrow-forward" size={20} color={ isDark? colors.surface : colors.textTertiary} />
            ) : (
              <Ionicons name="save-outline" size={20} color={isDark? colors.surface : colors.textTertiary} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Location Options Modal */}
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
              <Text style={[styles.modalButtonText, {color: isDark? colors.surface : colors.textTertiary}]}>Usar a minha localização atual</Text>
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
              style={[styles.modalButton, styles.cancelButton, {borderColor: colors.primary}]}
              onPress={() => setShowLocationOptions(false)}
            >
              <Text style={[styles.modalButtonText, {color: colors.primary}]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Map Selection Modal */}
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

                  // Obter endereço a partir das coordenadas selecionadas
                  const address = await getAddressFromCoordinates(coords);

                  if (address) {
                    setLocationText(address);
                  } else {
                    // Fallback para coordenadas
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
                <Text style={[styles.modalButtonTextMap, {color: colors.textTertiary}]}>Confirmar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButtonMap, styles.cancelButton, {borderColor: colors.primary}]}
                onPress={() => setMapVisible(false)}
              >
                <Text style={[styles.modalButtonTextMap, {color: colors.primary}]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Photo Options Modal */}
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
              <Text style={[styles.modalButtonText, {color: isDark? colors.surface : colors.textTertiary}]}>Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: colors.primary}]}
              onPress={() => {
                pickImage();
                setPhotoModalVisible(false);
              }}
            >
              <Text style={[styles.modalButtonText, {color: isDark? colors.surface : colors.textTertiary}]}>Escolher da Galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, {borderColor: colors.primary}]}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, {color: colors.primary}]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepTitleContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  stepContainer: {
    flex: 1,
  },
  sectionContent: {
    marginTop: 10,
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-around',
  },
  prevButton: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  locationSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
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
    height: 180,
    marginTop: 15,
    borderRadius: 8,
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
    height: 300,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
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
  photoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
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
  confirmButton: {
    // Color set dynamically
  },
  cancelButton: {
    borderWidth: 1,
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
  modalButtonTextMap: {
    fontWeight: 'bold',
    fontSize: 16,
    justifyContent: 'space-between'
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
