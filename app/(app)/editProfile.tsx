import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTabBar from '@/components/CustomTabBar';
import { useTheme } from '@/contexts/ThemeContext';

type UserData = {
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  address: {
    street: string;
    number: string;
    city: string;
    cp: string;
  };
};

export default function EditarPerfilScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    address: {
      street: '',
      number: '',
      city: '',
      cp: ''
    }
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const apiUrl = Platform.OS === 'android'
    ? 'https://reporta.up.railway.app/api/user'
    : 'https://reporta.up.railway.app/api/user';

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Erro', 'Não foi possível autenticar. Por favor, faça login novamente.');
        router.replace('/login');
        return;
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data && data.user) {
        setUserData({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          email: data.user.email || '',
          telephone: data.user.telephone || '',
          address: {
            street: data.user.address?.street || '',
            number: data.user.address?.number || '',
            city: data.user.address?.city || '',
            cp: data.user.address?.cp || ''
          }
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Erro', 'Não foi possível autenticar. Por favor, faça login novamente.');
        router.replace('/(auth)/login');
        return;
      }

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user: userData })
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
        goBack();
      } else {
        Alert.alert('Erro', result.message || 'Não foi possível atualizar o perfil.');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar atualizar o perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setUserData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as object,
          [child]: value
        }
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const goBack = () => {
    router.navigate('/(app)/definicoes');
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, {
        backgroundColor: isDark ? colors.background : colors.accent,
        paddingTop: insets.top,
      }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: isDark ? colors.textPrimary : colors.textPrimary, marginTop: 16 }}>
          A carregar perfil...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? colors.background : colors.accent,
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
          Editar Perfil
        </Text>

        <View style={styles.rightHeaderPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Informações Pessoais */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
            INFORMAÇÕES PESSOAIS
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                Nome
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.card : colors.accent,
                    color: isDark ? colors.textPrimary : colors.textPrimary,
                    borderColor: isDark ? colors.secondary : colors.background,
                  }
                ]}
                value={userData.first_name}
                onChangeText={(text) => handleInputChange('first_name', text)}
                placeholder="Nome"
                placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                Sobrenome
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.card : colors.accent,
                    color: isDark ? colors.textPrimary : colors.textPrimary,
                    borderColor: isDark ? colors.secondary : colors.background,
                  }
                ]}
                value={userData.last_name}
                onChangeText={(text) => handleInputChange('last_name', text)}
                placeholder="Sobrenome"
                placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              Email
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.card : colors.accent,
                  color: isDark ? colors.textPrimary : colors.textPrimary,
                  borderColor: isDark ? colors.secondary : colors.background,
                }
              ]}
              value={userData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="email@exemplo.com"
              placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
            <Text style={[styles.inputNote, { color: isDark ? colors.textTertiary : colors.textTertiary }]}>
              O email não pode ser alterado
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              Telefone
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.card : colors.accent,
                  color: isDark ? colors.textPrimary : colors.textPrimary,
                  borderColor: isDark ? colors.secondary : colors.background,
                }
              ]}
              value={userData.telephone}
              onChangeText={(text) => handleInputChange('telephone', text)}
              placeholder="+351 912 345 678"
              placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Endereço */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
            MORADA
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              Rua
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.card : colors.accent,
                  color: isDark ? colors.textPrimary : colors.textPrimary,
                  borderColor: isDark ? colors.secondary : colors.background,
                }
              ]}
              value={userData.address.street}
              onChangeText={(text) => handleInputChange('address.street', text)}
              placeholder="Nome da rua"
              placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 0.4 }]}>
              <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                Número
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.card : colors.accent,
                    color: isDark ? colors.textPrimary : colors.textPrimary,
                    borderColor: isDark ? colors.secondary : colors.background,
                  }
                ]}
                value={userData.address.number}
                onChangeText={(text) => handleInputChange('address.number', text)}
                placeholder="123"
                placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 0.55 }]}>
              <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                Código Postal
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.card : colors.accent,
                    color: isDark ? colors.textPrimary : colors.textPrimary,
                    borderColor: isDark ? colors.secondary : colors.background,
                  }
                ]}
                value={userData.address.cp}
                onChangeText={(text) => handleInputChange('address.cp', text)}
                placeholder="1234-567"
                placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              Cidade
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.card : colors.accent,
                  color: isDark ? colors.textPrimary : colors.textPrimary,
                  borderColor: isDark ? colors.secondary : colors.background,
                }
              ]}
              value={userData.address.city}
              onChangeText={(text) => handleInputChange('address.city', text)}
              placeholder="Nome da cidade"
              placeholderTextColor={isDark ? colors.textTertiary : colors.textTertiary}
            />
          </View>
        </View>

        {/* Botão de Salvar */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary }
          ]}
          onPress={handleUpdateProfile}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={isDark? colors.surface : colors.accent} />
              <Text style={[styles.saveButtonText, {color: isDark? colors.surface : colors.accent }]}>Guardar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
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
