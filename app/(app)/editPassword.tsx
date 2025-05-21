// app/(app)/(tabs)/editar-password.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomTabBar from '@/components/CustomTabBar';

export default function EditarPasswordScreen() {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabbarOpacity = useRef(new Animated.Value(1)).current;

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Estado para os campos de palavra-passe
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  // Estado para mostrar/esconder palavra-passe
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Efeito para detectar quando o teclado é mostrado ou ocultado
  useEffect(() => {
    // Para iOS usamos keyboardWillShow para antecipar a ocultação
    // Para Android continuamos a usar keyboardDidShow
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

  // Função para rolar a tela para um campo específico
  const focusOnInput = (y: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: y, animated: true });
    }
  };

  // Função para atualizar os campos de palavra-passe
  const handleChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para voltar à tela anterior
  const goBack = () => {
    router.navigate('/(app)/definicoes');
  };

  // Função para alternar visibilidade da palavra-passe
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Função para validar e atualizar a palavra-passe
  const handleUpdatePassword = async () => {
    // Validação
    if (!passwordData.current_password || !passwordData.password || !passwordData.password_confirmation) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios.');
      return;
    }

    if (passwordData.password !== passwordData.password_confirmation) {
      Alert.alert('Erro', 'A nova palavra-passe e a confirmação não coincidem.');
      return;
    }

    if (passwordData.password.length < 8) {
      Alert.alert('Erro', 'A nova palavra-passe deve ter pelo menos 8 caracteres.');
      return;
    }

    // Esconder o teclado para melhor experiência do utilizador
    Keyboard.dismiss();

    // Enviar para a API
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Erro', 'Não foi possível autenticar. Por favor, faça login novamente.');
        router.replace('/login');
        return;
      }

      const apiUrl = 'https://reporta.up.railway.app/api/user';

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: passwordData.password,
          current_password: passwordData.current_password
        })
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso', 'Palavra-passe atualizada com sucesso!');
        goBack();
      } else {
        Alert.alert('Erro', result.message || 'Não foi possível atualizar a palavra-passe.');
      }
    } catch (error) {
      console.error('Erro ao atualizar palavra-passe:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar atualizar a palavra-passe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, {
          backgroundColor: isDark ? colors.background : colors.accent
        }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: isDark ? colors.background : colors.surface }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
              Alterar Palavra-passe
            </Text>

            <View style={styles.rightHeaderPlaceholder} />
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Seção de palavra-passe Atual */}
            <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Palavra-passe Atual
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? colors.card : colors.accent,
                        color: isDark ? colors.textPrimary : colors.textPrimary,
                        borderColor: isDark ? colors.secondary : colors.background,
                      }
                    ]}
                    value={passwordData.current_password}
                    onChangeText={(text) => handleChange('current_password', text)}
                    placeholder="Escreva a sua palavra-passe atual"
                    placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
                    secureTextEntry={!showPasswords.current}
                    onFocus={() => focusOnInput(50)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => togglePasswordVisibility('current')}
                  >
                    <Ionicons
                      name={showPasswords.current ? "eye-off-outline" : "eye-outline"}
                      size={24}
                      color={isDark ? colors.textSecondary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Seção de Nova palavra-passe */}
            <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>


              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Nova Palavra-passe
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? colors.card : colors.accent,
                        color: isDark ? colors.textPrimary : colors.textPrimary,
                        borderColor: isDark ? colors.secondary : colors.background,
                      }
                    ]}
                    value={passwordData.password}
                    onChangeText={(text) => handleChange('password', text)}
                    placeholder="Escreva a sua nova palavra-passe"
                    placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
                    secureTextEntry={!showPasswords.new}
                    onFocus={() => focusOnInput(200)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => togglePasswordVisibility('new')}
                  >
                    <Ionicons
                      name={showPasswords.new ? "eye-off-outline" : "eye-outline"}
                      size={24}
                      color={isDark ? colors.textSecondary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.inputNote, { color: isDark ? colors.textTertiary : colors.textTertiary }]}>
                  A palavra-passe deve conter pelo menos 8 caracteres
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Confirmar Nova Palavra-passe
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? colors.card : colors.accent,
                        color: isDark ? colors.textPrimary : colors.textPrimary,
                        borderColor: isDark ? colors.secondary : colors.background,
                      }
                    ]}
                    value={passwordData.password_confirmation}
                    onChangeText={(text) => handleChange('password_confirmation', text)}
                    placeholder="Repita a sua nova palavra-passe"
                    placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
                    secureTextEntry={!showPasswords.confirm}
                    onFocus={() => focusOnInput(300)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => togglePasswordVisibility('confirm')}
                  >
                    <Ionicons
                      name={showPasswords.confirm ? "eye-off-outline" : "eye-outline"}
                      size={24}
                      color={isDark ? colors.textSecondary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {passwordData.password !== passwordData.password_confirmation && passwordData.password_confirmation !== '' && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    As palavra-passe não coincidem
                  </Text>
                )}
              </View>
            </View>

            {/* Botão de Salvar */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleUpdatePassword}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color={isDark? colors.surface : colors.accent} />
                  <Text style={[styles.saveButtonText, {color: isDark? colors.surface : colors.accent }]}>Guardar Alterações</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Espaço adicional para evitar que o botão fique atrás do teclado */}
            <View style={{ height: 100 }} />
          </ScrollView>

          <Animated.View style={{ opacity: tabbarOpacity, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <CustomTabBar />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightHeaderPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  inputNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
