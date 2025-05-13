import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import styles from '@/assets/styles/(app)/(tabs)/index.styles';
import { UserReport } from '@/types/types';


// Componente para o resumo/dashboard
const DashboardSummary = ({ reports, colors }: { reports: UserReport[], colors: any }) => {
  // Calcular estatísticas
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
      <Text style={[styles.dashboardTitle, { color: colors.textPrimary }]}>
        Resumo
      </Text>

      <View style={styles.statsContainer}>
        {/* Total de Relatórios */}
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="documents-outline" size={20} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {stats.total}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total
          </Text>
        </View>

        {/* Relatórios Pendentes */}
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.error }]}>
            <Ionicons name="time-outline" size={20} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {stats.pendentes}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Pendentes
          </Text>
        </View>

        {/* Relatórios Em Análise */}
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.warning }]}>
            <Ionicons name="search-outline" size={20} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {stats.emResolucao}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Em Análise
          </Text>
        </View>

        {/* Relatórios Resolvidos */}
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {stats.resolvidos}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Resolvidos
          </Text>
        </View>
      </View>
    </View>
  );
};

export default DashboardSummary;
