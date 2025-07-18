import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomTabBar from '@/components/CustomTabBar';
import { useTheme } from '@/contexts/ThemeContext';

export default function SobreScreen() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.accent }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Cabeçalho */}
          <View style={[styles.header, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                Sobre o Reporta
              </Text>
            </View>
          </View>

          {/* Seção de Informações Gerais */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              INFORMAÇÕES GERAIS
            </Text>

            <View style={styles.infoItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Sistema de Gestão
                </Text>
                <Text style={[styles.infoDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Esta aplicação foi criada para fornecer um sistema eficiente de gestão de reports,
                  permitindo aos utilizadores reportar situações e acompanhar o seu progresso.
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            <View style={styles.infoItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="analytics-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Estados dos Reports
                </Text>
                <Text style={[styles.infoDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Os reports são classificados em três estados: criado, em análise e resolvido.
                  Cada estado representa uma fase diferente do processo de resolução.
                </Text>
              </View>
            </View>
          </View>

          {/* Seção do Sistema de Pontos */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              SISTEMA DE PONTOS
            </Text>

            <View style={styles.pointsContainer}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="trophy-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.pointsTextContainer}>
                <Text style={[styles.infoTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Incentivo à Participação
                </Text>
                <Text style={[styles.infoDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  A pontuação é usada para incentivar a participação ativa dos utilizadores na plataforma.
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            {/* Pontuação por Estado */}
            <View style={styles.pointItem}>
              <View style={[styles.pointBadge, { backgroundColor: '#FFA500' + '20' }]}>
                <Ionicons name="add-circle" size={18} color="#FFA500" />
              </View>
              <View style={styles.pointTextContainer}>
                <Text style={[styles.pointTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Report Criado
                </Text>
                <Text style={[styles.pointDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Por cada report submetido
                </Text>
              </View>
              <View style={[styles.pointValue, { backgroundColor: '#FFA500' + '15' }]}>
                <Text style={[styles.pointValueText, { color: '#FFA500' }]}>1 pt</Text>
              </View>
            </View>

            <View style={styles.pointItem}>
              <View style={[styles.pointBadge, { backgroundColor: '#4A90E2' + '20' }]}>
                <Ionicons name="eye" size={18} color="#4A90E2" />
              </View>
              <View style={styles.pointTextContainer}>
                <Text style={[styles.pointTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Report em Análise
                </Text>
                <Text style={[styles.pointDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Quando o report passa para análise
                </Text>
              </View>
              <View style={[styles.pointValue, { backgroundColor: '#4A90E2' + '15' }]}>
                <Text style={[styles.pointValueText, { color: '#4A90E2' }]}>5 pts</Text>
              </View>
            </View>

            <View style={styles.pointItem}>
              <View style={[styles.pointBadge, { backgroundColor: '#28A745' + '20' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#28A745" />
              </View>
              <View style={styles.pointTextContainer}>
                <Text style={[styles.pointTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Report Resolvido
                </Text>
                <Text style={[styles.pointDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Quando o report é marcado como resolvido
                </Text>
              </View>
              <View style={[styles.pointValue, { backgroundColor: '#28A745' + '15' }]}>
                <Text style={[styles.pointValueText, { color: '#28A745' }]}>10 pts</Text>
              </View>
            </View>
          </View>

          {/* Seção de Informações da Aplicação */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.surface : colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
              APLICAÇÃO
            </Text>

            <View style={styles.infoItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="person-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Desenvolvedor
                </Text>
                <Text style={[styles.infoDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  Diogo Tavares
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            <View style={styles.infoItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="code-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, { color: isDark ? colors.textPrimary : colors.textPrimary }]}>
                  Versão
                </Text>
                <Text style={[styles.infoDescription, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                  1.0.0
                </Text>
              </View>
            </View>
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  pointsTextContainer: {
    flex: 1,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pointBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pointTextContainer: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  pointDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  pointValue: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointValueText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
