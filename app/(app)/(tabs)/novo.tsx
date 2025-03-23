import CustomTabBar from '@/components/CustomTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, TextInput, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install this package

type Category = {
  id: number;
  category: string;
}

export default function NovoScreen() {
  const [locationText, setLocationText] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photo, setPhoto] = useState('');
  const [photoURI, setPhotoURI] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

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
      const response = await fetch("http://127.0.0.1:8000/api/categories", {
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

  // Request permission and get current location
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

      // Get address from coordinates if needed
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync(locationData);
        if (reverseGeocode && reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const formattedAddress = `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`;
          setLocationText(formattedAddress);
        } else {
          // Fallback to coordinate string
          setLocationText(`${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`);
        }
      } catch (error) {
        console.error('Error in reverse geocoding:', error);
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

  // Define colors from the app theme
  const colors = {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
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
        console.log(`Tamanho da imagem: ${fileSizeInMB.toFixed(2)}MB`);

        if (fileSizeInMB > 1.9) { // Slightly reduced to ensure
          Alert.alert('Arquivo muito grande', 'A imagem não pode ter mais que 2MB. Por favor, escolha outra imagem.');
          return;
        }
      }

      // Store URI for future use
      setPhotoURI(uri);
      setPhoto(uri); // For consistency with other parts of the code
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao processar a imagem.');
    }
  };

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

        // Add location as a string (either using the displayed text or the coordinates)
        const locationString = locationText || `${locationCoords.latitude.toFixed(6)}, ${locationCoords.longitude.toFixed(6)}`;
        formData.append('location', locationString);

        // Add categories as array
        selectedCategories.forEach(categoryId => {
          formData.append('category_id[]', categoryId.toString());
        });

        // Add photo as file
        const fileName = photoURI.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photo', {
          uri: photoURI,
          name: fileName,
          type
        } as any);

        console.log('Sending data to API:', {
          location: locationString,
          category_id: selectedCategories,
          photo: "(image file)"
        });

        // Send using FormData
        const response = await fetch('http://127.0.0.1:8000/api/reports', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            // Don't set Content-Type when using FormData
          },
          body: formData
        });

        const data = await response.json();
        console.log('API Response:', data);

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
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Localização</Text>
              <TouchableOpacity
                style={styles.locationSelectButton}
                onPress={() => setShowLocationOptions(true)}
              >
                <Text style={styles.locationSelectText}>
                  {locationText ? 'Alterar localização' : 'Selecionar localização'}
                </Text>
                <Ionicons name="location" size={24} color="#fff" />
              </TouchableOpacity>

              {locationText && (
                <View style={styles.locationInfoContainer}>
                  <Text style={styles.locationInfoText}>{locationText}</Text>
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

            {/* Categories Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categorias</Text>
              {fetchingCategories ? (
                <ActivityIndicator size="small" color="#4B0082" />
              ) : (
                <View style={styles.categoryChipsContainer}>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        selectedCategories.includes(category.id) && styles.selectedCategoryChip
                      ]}
                      onPress={() => toggleCategorySelection(category.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategories.includes(category.id) && styles.selectedCategoryChipText
                        ]}
                      >
                        {category.category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Photo Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Foto</Text>
              <TouchableOpacity
                style={styles.photoUploadContainer}
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
                    <Ionicons name="camera" size={50} color="#687076" />
                    <Text style={styles.photoPlaceholderText}>Adicionar foto</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={createReport}
              disabled={isLoading}
            >
              <Ionicons name="save-outline" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>
                {isLoading ? 'A guardar...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Location Options Modal */}
        {showLocationOptions && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Escolha uma opção</Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  getCurrentLocation();
                  setShowLocationOptions(false);
                }}
              >
                <Text style={styles.modalButtonText}>Usar minha localização atual</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setMapVisible(true);
                  setShowLocationOptions(false);
                }}
              >
                <Text style={styles.modalButtonText}>Escolher uma localização no mapa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLocationOptions(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Map Selection Modal */}
        {mapVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.mapModalContent}>
              <Text style={styles.modalTitle}>Toque no mapa para escolher a localização</Text>

              <View style={styles.fullMapContainer}>
                <MapView
                  style={styles.fullMap}
                  initialRegion={{
                    latitude: locationCoords?.latitude || 41.1579,
                    longitude: locationCoords?.longitude || -8.6291,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                  onPress={(event) => {
                    const coords = event.nativeEvent.coordinate;
                    setLocationCoords(coords);
                    setLocationText(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
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
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => setMapVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Confirmar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setMapVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Photo Options Modal */}
        {photoModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Foto</Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  takePhoto();
                  setPhotoModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Tirar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  pickImage();
                  setPhotoModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Escolher da Galeria</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPhotoModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 15,
    color: '#11181C',
  },
  locationSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  locationSelectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationInfoContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  locationInfoText: {
    fontSize: 14,
    color: '#11181C',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategoryChip: {
    backgroundColor: '#3498db',
    borderColor: '#0a7ea4',
  },
  categoryChipText: {
    color: '#11181C',
    fontSize: 14,
  },
  selectedCategoryChipText: {
    color: '#fff',
    fontWeight: '500',
  },
  photoUploadContainer: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    marginTop: 10,
    color: '#687076',
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
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    marginVertical: 15,
  },
  disabledButton: {
    backgroundColor: '#8ccde2',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  mapModalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#11181C',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
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
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
