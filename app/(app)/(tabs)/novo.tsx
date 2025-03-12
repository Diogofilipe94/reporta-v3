import CustomTabBar from '@/components/CustomTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Modal, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';

type Category = {
  id: number;
  category: string;
}

export default function NovoScreen() {
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photo, setPhoto] = useState('');
  const [photoURI, setPhotoURI] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  const router = useRouter();

  // Buscar categorias da API quando o componente é montado
  useEffect(() => {
    fetchCategories();
  }, []);

  // Função para buscar categorias da API
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

  // Solicita permissão e obtém localização atual
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'É necessário dar permissão para acessar sua localização.');
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
      setSelectedLocation(locationData);

      // Formatando a localização para exibição e armazenamento
      const locationString = `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`;
      setLocation(locationString);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
      console.error(error);
    }
  };

  // Mostrar modal com opções de localização (antes do mapa)
  const showLocationOptions = () => {
    setMapVisible(false); // Garante que o mapa não será exibido inicialmente
    setModalVisible(true);
  };

  // Função para escolher localização no mapa
  const chooseOnMap = () => {
    setMapVisible(true);
  };

  // Manipula a seleção no mapa
  const handleMapPress = (event: any) => {
    const coords = event.nativeEvent.coordinate;
    setSelectedLocation(coords);
  };

  // Confirma a localização selecionada no mapa
  const confirmMapSelection = () => {
    if (selectedLocation) {
      setLocationCoords(selectedLocation);

      // Formatando a localização para exibição e armazenamento
      const locationString = `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`;
      setLocation(locationString);
      setModalVisible(false);
      setMapVisible(false);
    } else {
      Alert.alert('Selecione uma localização', 'Toque no mapa para selecionar uma localização.');
    }
  };

  // Funções para capturar e selecionar imagens
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images", // Atualizado para evitar o warning de depreciação
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Reduzido para ajudar a manter abaixo de 2MB
      });

      if (!result.canceled) {
        await processImageForUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images", // Atualizado para evitar o warning de depreciação
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await processImageForUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  // Função para processar a imagem e garantir que atenda aos requisitos
  const processImageForUpload = async (uri: string) => {
    try {
      // Verificar tipo de arquivo
      const fileName = uri.split('/').pop() || '';
      const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

      if (!['jpg', 'jpeg', 'png'].includes(fileExt)) {
        Alert.alert('Formato inválido', 'A imagem deve ser do tipo: jpeg, jpg, png');
        return;
      }

      // Verificar tamanho do arquivo
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (fileInfo.exists) {
        const fileSizeInMB = fileInfo.size / (1024 * 1024);
        console.log(`Tamanho da imagem: ${fileSizeInMB.toFixed(2)}MB`);

        if (fileSizeInMB > 1.9) { // Reduzido um pouco para garantir
          Alert.alert('Arquivo muito grande', 'A imagem não pode ter mais que 2MB. Por favor, escolha outra imagem.');
          return;
        }
      }

      // Armazenar apenas o URI para uso futuro
      setPhotoURI(uri);
      setPhoto(uri); // Para manter a consistência com as outras partes do código
      setPhotoModalVisible(false);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao processar a imagem.');
    }
  };

  const showPhotoOptions = () => {
    setPhotoModalVisible(true);
  };

  const toggleCategorySelection = (categoryId: number) => {
    setSelectedCategories(prevSelected => {
      // Se já estiver selecionada, remove
      if (prevSelected.includes(categoryId)) {
        return prevSelected.filter(id => id !== categoryId);
      }
      // Senão, adiciona
      else {
        return [...prevSelected, categoryId];
      }
    });
  };

  const showCategoryModal = () => {
    setCategoryModalVisible(true);
  };

  const getCategoryNames = () => {
    return selectedCategories
      .map(id => categories.find(cat => cat.id === id)?.category)
      .filter(Boolean)
      .join(', ');
  };

  async function CreateReport() {
    try {
      if (!location) {
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
        // O backend está configurado para receber um arquivo usando multipart/form-data
        const formData = new FormData();

        // Adicionar a localização como string
        formData.append('location', location);

        // Adicionar categorias como array
        selectedCategories.forEach(categoryId => {
          formData.append('category_id[]', categoryId.toString());
        });

        // Adicionar a foto como arquivo
        const fileName = photoURI.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photo', {
          uri: photoURI,
          name: fileName,
          type
        } as any);

        console.log('Enviando dados para a API:', {
          location,
          category_id: selectedCategories,
          photo: "(arquivo de imagem)"
        });

        // Enviar usando FormData
        const response = await fetch('http://127.0.0.1:8000/api/reports', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            // Não definir Content-Type quando usar FormData
          },
          body: formData
        });

        const data = await response.json();
        console.log('Resposta da API:', data);

        if (response.ok) {
          Alert.alert('Sucesso', 'Report criado com sucesso!');
          setLocation('');
          setPhoto('');
          setPhotoURI('');
          setSelectedCategories([]);
          setLocationCoords(null);
          router.push("/(app)/(tabs)");
        } else {
          console.error('Erro na API:', data);
          if (data.messages) {
            const errorMessages = Object.values(data.messages).flat().join('\n');
            Alert.alert('Erro de validação', errorMessages);
          } else {
            Alert.alert('Erro', data.error || 'Erro ao criar report');
          }
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
        Alert.alert('Erro de conexão', 'Não foi possível conectar ao servidor.');
      }
    } catch (error) {
      console.error('Erro geral:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao criar o report');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Criar Novo Report</Text>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={showLocationOptions}
        >
          <Text style={styles.locationButtonText}>
            {location ? 'Mudar Localização' : 'Selecionar Localização'}
          </Text>
        </TouchableOpacity>

        {locationCoords ? (
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Localização selecionada:</Text>
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
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: locationCoords.latitude,
                    longitude: locationCoords.longitude,
                  }}
                />
              </MapView>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.photoButton}
          onPress={showPhotoOptions}
        >
          <Text style={styles.photoButtonText}>
            {photoURI ? 'Mudar Foto' : 'Adicionar Foto'}
          </Text>
        </TouchableOpacity>

        {photoURI && (
          <View style={styles.photoPreviewContainer}>
            <Image
              source={{ uri: photoURI }}
              style={styles.photoPreview}
              resizeMode="cover"
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.categoryButton}
          onPress={showCategoryModal}
        >
          <Text style={styles.categoryButtonText}>
            {selectedCategories.length > 0 ? 'Editar Categorias' : 'Selecionar Categorias'}
          </Text>
        </TouchableOpacity>

        {selectedCategories.length > 0 && (
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryLabel}>Categorias selecionadas:</Text>
            <Text style={styles.categoryText}>{getCategoryNames()}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.disabledButton]}
          onPress={CreateReport}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'A enviar...' : 'Criar Report'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Localização */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {!mapVisible ? (
            // Exibe as opções de localização
            <View style={styles.optionsModalContent}>
              <Text style={styles.modalTitle}>Escolha uma opção</Text>

              <TouchableOpacity
                style={styles.fullOptionButton}
                onPress={getCurrentLocation}
              >
                <Text style={styles.optionText}>Usar minha localização atual</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fullOptionButton}
                onPress={chooseOnMap}
              >
                <Text style={styles.optionText}>Escolher uma localização no mapa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fullOptionButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.optionText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Exibe o mapa para seleção
            <View style={styles.mapModalContent}>
              <Text style={styles.modalTitle}>Toque no mapa para escolher a localização</Text>

              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: selectedLocation?.latitude || 41.1579, // Porto, Portugal como padrão
                    longitude: selectedLocation?.longitude || -8.6291,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                  onPress={handleMapPress}
                >
                  {selectedLocation && (
                    <Marker
                      coordinate={{
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                      }}
                    />
                  )}
                </MapView>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.fullOptionButton, styles.confirmButton]}
                  onPress={confirmMapSelection}
                >
                  <Text style={styles.optionText}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fullOptionButton, styles.cancelButton]}
                  onPress={() => {
                    setMapVisible(false); // Volta para as opções de localização
                  }}
                >
                  <Text style={styles.optionText}>Voltar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal para escolha de foto */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={photoModalVisible}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.modalTitle}>Adicionar Foto</Text>

            <TouchableOpacity
              style={styles.fullOptionButton}
              onPress={takePhoto}
            >
              <Text style={styles.optionText}>Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fullOptionButton}
              onPress={pickImage}
            >
              <Text style={styles.optionText}>Escolher da Galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fullOptionButton, styles.cancelButton]}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text style={styles.optionText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleção de categorias */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.categoryModalContent}>
            <Text style={styles.modalTitle}>Selecione as Categorias</Text>

            {fetchingCategories ? (
              <ActivityIndicator size="large" color="#2196F3" style={styles.loadingIndicator} />
            ) : categories.length > 0 ? (
              <ScrollView style={styles.categoryList}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategories.includes(category.id) && styles.selectedCategoryItem
                    ]}
                    onPress={() => toggleCategorySelection(category.id)}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        selectedCategories.includes(category.id) && styles.selectedCategoryItemText
                      ]}
                    >
                      {category.category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyCategoriesContainer}>
                <Text style={styles.emptyCategoriesText}>Nenhuma categoria disponível</Text>
                <TouchableOpacity
                  style={styles.fullOptionButton}
                  onPress={fetchCategories}
                >
                  <Text style={styles.optionText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.fullOptionButton, styles.confirmButton]}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={styles.optionText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 100, // Adiciona espaço no final para não esconder o conteúdo com o TabBar
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 30,
  },
  locationButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationInfo: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 15,
  },
  locationLabel: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  miniMapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  photoButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  photoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  photoPreviewContainer: {
    width: '100%',
    height: 200,
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  categoryButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  categoryInfo: {
    width: '100%',
    padding: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    marginBottom: 15,
  },
  categoryLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 14,
  },
  submitButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Estilos de modals consistentes
  modalContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#f5f5f5',
  },
  optionsModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapModalContent: {
    flex: 1,
    padding: 10,
  },
  categoryModalContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  fullOptionButton: {
    width: '100%',
    backgroundColor: '#2196F3',
    padding: 16,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    marginTop: 10,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  // Estilos específicos para a lista de categorias
  categoryList: {
    width: '100%',
    marginVertical: 20,
    flex: 1,
  },
  categoryItem: {
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedCategoryItem: {
    backgroundColor: '#E3F2FD',
  },
  categoryItemText: {
    fontSize: 16,
  },
  selectedCategoryItemText: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  emptyCategoriesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCategoriesText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginVertical: 30,
  }
});
