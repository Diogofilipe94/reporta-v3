import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import styles from '@/assets/styles/(app)/(tabs)/index.styles';
import { UserReport } from '@/types/types';
import { useTheme } from '@/contexts/ThemeContext';



// Componente para o resumo/dashboard
const DashboardSummary = ({ reports }: { reports: UserReport[], colors: any }) => {

  const { colors, isDark } = useTheme();

  const stats = useMemo(() => {
    const total = reports.length;

    // Contar relatórios por status
    const statusCounts = reports.reduce<{ [key: string]: number }>((acc, report) => {
      const status = report.status?.status?.toLowerCase() || 'desconhecido';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      pendentes: statusCounts['pendente'] || 0,
      resolvidos: statusCounts['resolvido'] || 0,
      emResolucao: statusCounts['em resolução'] || 0,
    };
  }, [reports]);

  return (
    <View style={[styles.dashboardContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.dashboardHeader}>
        <Ionicons name="bar-chart" size={24} color={colors.primary} style={{marginHorizontal:4}}/>
        <Text style={[styles.dashboardTitle, { color: colors.textPrimary }]}>
          Resumo
        </Text>
      </View>

      <View style={styles.statsContainer}>
        {/* Total de Relatórios */}
        <View style={[styles.statCard, { backgroundColor: isDark? colors.surface : colors.accent }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.secondary }]}>
            <Ionicons name="documents-outline" size={20} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: isDark? colors.accent : colors.primary }]}>
            {stats.total}
          </Text>
          <Text style={[styles.statLabel, { color: isDark? colors.accent : colors.primary }]}>
            Total
          </Text>
        </View>

        {/* Relatórios Pendentes */}
        <View style={[styles.statCard, { backgroundColor: isDark? colors.surface : colors.accent }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.error }]}>
            <Ionicons name="time-outline" size={20} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: isDark? colors.accent : colors.primary }]}>
            {stats.pendentes}
          </Text>
          <Text style={[styles.statLabel, { color: isDark? colors.accent : colors.primary }]}>
            Pendentes
          </Text>
        </View>

        {/* Relatórios Em Análise */}
        <View style={[styles.statCard, { backgroundColor: isDark? colors.surface : colors.accent }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.warning }]}>
            <Ionicons name="search-outline" size={20} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: isDark? colors.accent : colors.primary }]}>
            {stats.emResolucao}
          </Text>
          <Text style={[styles.statLabel, { color: isDark? colors.accent : colors.primary }]}>
            Em Análise
          </Text>
        </View>

        {/* Relatórios Resolvidos */}
        <View style={[styles.statCard, { backgroundColor: isDark? colors.surface : colors.accent }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: isDark? colors.accent : colors.primary }]}>
            {stats.resolvidos}
          </Text>
          <Text style={[styles.statLabel, { color: isDark? colors.accent : colors.primary }]}>
            Resolvidos
          </Text>
        </View>
      </View>
    </View>
  );
};

export default DashboardSummary;
