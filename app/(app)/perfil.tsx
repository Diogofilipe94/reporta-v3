// app/(app)/(tabs)/perfil.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomTabBar from '@/components/CustomTabBar';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

type User = {
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  created_at: string;
  address: Address;
}

type Address = {
  street: string;
  number: string;
  city: string;
  cp: string;
};

type UserPoints = {
  points: number;
  reports_summary: {
    pending: number;
    in_progress: number;
    resolved: number;
  }
};

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPoints, setUserPoints] = useState<UserPoints>({
    points: 0,
    reports_summary: {
      pending: 0,
      in_progress: 0,
      resolved: 0
    }
  });
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([getUser(), getUserPoints()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const apiUrl = Platform.OS === 'android'
    ? 'https://reporta.up.railway.app/api/user'
    : 'https://reporta.up.railway.app/api/user';

  const pointsApiUrl = Platform.OS === 'android'
    ? 'https://reporta.up.railway.app/api/user/points'
    : 'https://reporta.up.railway.app/api/user/points';

  async function getUser() {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setUser(data.user);
      console.log(data);
      return true; // Indica sucesso
    } catch (error) {
      console.error('Error fetching user data:', error);
      return false; // Indica falha
    }
  }

  async function getUserPoints() {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(pointsApiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(data);
      setUserPoints(data);
      return true; // Indica sucesso
    } catch (error) {
      console.error('Error fetching user points:', error);

      return false; // Indica falha
    }
  }

  const handleLogout = async () => {
    await signOut();
  };

  // Função para obter as iniciais do nome para o avatar
  const getInitials = () => {
    if (!user) return '?';
    return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
  };

  // Função para extrair apenas o ano da data de criação
  const getMembershipYear = () => {
    if (!user?.created_at) return '';

    try {
      const date = new Date(user.created_at);
      return date.getFullYear();
    } catch (error) {
      console.error('Erro ao processar a data:', error);
      return '';
    }
  };

  // Função para determinar o nível do utilizador
  const getUserLevel = () => {
    const points = userPoints.points;
    if (points < 50) return 'Iniciante';
    if (points < 250) return 'Intermediário';
    return 'Especialista';
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([getUser(), getUserPoints()]);
    setIsLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f7f7f7' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={isDark ? '#ffffff' : colors.primary}
          />
        }
      >
        <View style={styles.content}>
          <View style={[styles.profileHeader, { backgroundColor: isDark ? '#1e1e1e' : 'white' }]}>
            {/* Avatar com iniciais */}
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {getInitials()}
              </Text>
            </View>

            <Text style={[styles.profileName, { color: isDark ? '#fff' : '#333' }]}>
              {user?.first_name} {user?.last_name}
            </Text>

            <View style={styles.emailContainer}>
              <Ionicons name="mail-outline" size={16} color={colors.primary} />
              <Text style={[styles.profileEmail, { color: isDark ? '#ccc' : '#666' }]}>
                {user?.email}
              </Text>
            </View>

            {/* Contador de pontos */}
            <View style={styles.pointsContainer}>
              <Text style={[styles.pointsValue, { color: colors.primary }]}>
                {userPoints.points}
              </Text>
              <Text style={[styles.pointsLabel, { color: isDark ? '#ccc' : '#666' }]}>
                PONTOS
              </Text>
            </View>

            <View style={styles.badgesContainer}>
              <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="trophy-outline" size={14} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {getUserLevel()}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  Membro desde {getMembershipYear()}
                </Text>
              </View>
            </View>
          </View>

          {/* Resumo das ocorrências */}
          <View style={[styles.infoSection, { backgroundColor: isDark ? '#1e1e1e' : 'white' }]}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#333' }]}>
                Resumo dos teus reports
              </Text>
            </View>

            <View style={styles.reportsContainer}>
              <View style={styles.reportItem}>
                <View style={[styles.reportBadge, { backgroundColor: '#FFA50020' }]}>
                  <Text style={[styles.reportCount, { color: '#FFA500' }]}>
                    {userPoints.reports_summary.pending}
                  </Text>
                </View>
                <Text style={[styles.reportLabel, { color: isDark ? '#ccc' : '#666' }]}>
                  Pendentes
                </Text>
              </View>

              <View style={styles.reportItem}>
                <View style={[styles.reportBadge, { backgroundColor: '#4682B420' }]}>
                  <Text style={[styles.reportCount, { color: '#4682B4' }]}>
                    {userPoints.reports_summary.in_progress}
                  </Text>
                </View>
                <Text style={[styles.reportLabel, { color: isDark ? '#ccc' : '#666' }]}>
                  Em Resolução
                </Text>
              </View>

              <View style={styles.reportItem}>
                <View style={[styles.reportBadge, { backgroundColor: '#32CD3220' }]}>
                  <Text style={[styles.reportCount, { color: '#32CD32' }]}>
                    {userPoints.reports_summary.resolved}
                  </Text>
                </View>
                <Text style={[styles.reportLabel, { color: isDark ? '#ccc' : '#666' }]}>
                  Resolvidos
                </Text>
              </View>
            </View>
          </View>

          {/* Informações pessoais */}
          <View style={[styles.infoSection, { backgroundColor: isDark ? '#1e1e1e' : 'white' }]}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#333' }]}>
                Informações pessoais
              </Text>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: isDark ? '#aaa' : '#888' }]}>Telefone</Text>
                <Text style={[styles.infoText, { color: isDark ? '#fff' : '#333' }]}>
                  {user?.telephone || '—'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: isDark ? '#aaa' : '#888' }]}>Morada</Text>
                <Text style={[styles.infoText, { color: isDark ? '#fff' : '#333' }]}>
                  {user?.address?.street}, {user?.address?.number}
                </Text>
                <Text style={[styles.infoText, { color: isDark ? '#fff' : '#333' }]}>
                  {user?.address?.cp}, {user?.address?.city}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={() => {
                // Navegar para a tela de edição de perfil
                router.navigate('/(app)/editProfile');
              }}
            >
              <Ionicons name="create-outline" size={18} color={isDark? colors.surface : colors.accent} />
              <Text style={[styles.editButtonText,{color: isDark? colors.surface : colors.accent}]}>Editar dados pessoais</Text>
            </TouchableOpacity>

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
                color={isDark ? colors.accent : colors.primary}
              />
              <Text
                style={[
                  styles.logoutButtonText,
                  { color: isDark ? colors.accent : colors.primary }
                ]}
              >
                Terminar Sessão
              </Text>
            </TouchableOpacity>
          </View>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
    marginLeft: 6,
  },
  pointsContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.15)',
    marginVertical: 16,
  },
  reportsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  reportItem: {
    alignItems: 'center',
    flex: 1,
  },
  reportBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  reportLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonsContainer: {
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontWeight: '500',
    fontSize: 16,
  },
});
