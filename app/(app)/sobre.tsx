import CustomTabBar from '@/components/CustomTabBar';
import { View, Text, StyleSheet } from 'react-native';

export default function SobreScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sobre o Reporta</Text>
        <Text style={styles.text}>Esta página foi criada para fornecer informações sobre a aplicação</Text>
        <Text style={styles.text}>A aplicação é um sistema de gestão de reports</Text>
        <Text style={styles.text}>Os reports são classificados em três estados: criado, em análise e resolvido</Text>
        <Text style={styles.text}>Cada estado tem uma pontuação associada</Text>
        <Text style={styles.text}>A pontuação é usada para incentivar a participação dos utilizadores</Text>

        <Text>Sistema de pontos:</Text>
        <Text>Report criado: 1 ponto</Text>
        <Text>Report em análise: 5 pontos</Text>
        <Text>Report resolvido: 10 pontos</Text>
        <Text style={styles.text}>Aplicação criada por: Diogo Tavares</Text>
        <Text style={styles.text}>Versão: 1.0.0</Text>
      </View>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
  },
  text: {
    fontSize: 16,
    marginVertical: 8,
  },

});
