// app/(app)/(tabs)/definicoes.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Switch, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomTabBar from '@/components/CustomTabBar';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function DefinicoesScreen() {
  const { signOut } = useAuth();
  const { colors, isDark, setColorScheme } = useTheme();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(isDark);

  // Lista de idiomas disponíveis
  const languages = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' }
  ];

  const [selectedLanguage, setSelectedLanguage] = useState('pt');

  // Carregar preferências salvas
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        const savedNotifications = await AsyncStorage.getItem('notifications');
        const savedLanguage = await AsyncStorage.getItem('language');

        if (savedTheme !== null) {
          setDarkMode(savedTheme === 'dark');
        }

        if (savedNotifications !== null) {
          setNotificationsEnabled(savedNotifications === 'true');
        }

        if (savedLanguage !== null) {
          setSelectedLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const toggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };


  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await AsyncStorage.setItem('notifications', newValue.toString());
  };

  const handleSelectLanguage = async (code: string) => {
    setSelectedLanguage(code);
    await AsyncStorage.setItem('language', code);
    // Implementar a lógica para alterar o idioma da aplicação
  };

  const navigateToEditProfile = () => {
    // Navegação para a tela de edição de perfil
    router.push('/editar-perfil');
  };

  const navigateToChangePassword = () => {
    // Navegação para a tela de alteração de senha
    router.push('/editar-password');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.accent }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Cabeçalho */}
          <View style={[styles.header, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="settings-outline" size={24} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                Definições
              </Text>
            </View>
          </View>

          {/* Configurações de Conta */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              CONTA
            </Text>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={navigateToEditProfile}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="person-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Editar dados pessoais
                </Text>
                <Text style={[styles.optionDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Altere o seu nome, telefone e morada
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? '#666' : '#999'}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.optionItem}
              onPress={navigateToChangePassword}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Alterar palavra-passe
                </Text>
                <Text style={[styles.optionDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Atualize a sua palavra-passe
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? '#666' : '#999'}
              />
            </TouchableOpacity>
          </View>

          {/* Configurações de Aparência */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              APARÊNCIA
            </Text>

            <View style={styles.optionItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons
                  name={darkMode ? "moon-outline" : "sunny-outline"}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Tema {darkMode ? 'escuro' : 'claro'}
                </Text>
                <Text style={[styles.optionDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  {darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: `${colors.primary}80` }}
                thumbColor={darkMode ? colors.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleTheme}
                value={darkMode}
              />
            </View>
          </View>

          {/* Configurações de Notificações */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              NOTIFICAÇÕES
            </Text>

            <View style={styles.optionItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Notificações push
                </Text>
                <Text style={[styles.optionDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  {notificationsEnabled ? 'Ativas' : 'Desativadas'}
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: `${colors.primary}80` }}
                thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleNotifications}
                value={notificationsEnabled}
              />
            </View>
          </View>

          {/* Configurações de Idioma */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              IDIOMA
            </Text>

            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={styles.optionItem}
                onPress={() => handleSelectLanguage(language.code)}
              >
                <View style={[
                  styles.radioContainer,
                  {
                    borderColor: selectedLanguage === language.code ? colors.primary : isDark ? '#555' : '#ddd',
                    backgroundColor: selectedLanguage === language.code ? colors.primary + '15' : 'transparent'
                  }
                ]}>
                  {selectedLanguage === language.code && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[
                  styles.optionTitle,
                  {
                    color: isDark ? colors.textPrimary : colors.textPrimary,
                    marginLeft: 12
                  }
                ]}>
                  {language.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botão para terminar sessão */}
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {borderColor: colors.primary}
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color={isDark ? colors.primary : colors.secondary}
            />
            <Text
              style={[
                styles.logoutButtonText,
                { color: isDark ? colors.primary : colors.secondary }
              ]}
            >
              Terminar Sessão
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  section: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.15)',
    marginLeft: 68,
  },
  radioContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 24,
  },
  logoutButtonText: {
    fontWeight: '500',
    fontSize: 16,
  },
});
