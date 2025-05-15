// ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/constants/Colors';

// Definindo o tipo do contexto
type ThemeContextType = {
  colors: typeof theme.light;
  isDark: boolean;
  setColorScheme: (scheme: 'light' | 'dark') => void;
};

// Criando o contexto com valores padrão
const ThemeContext = createContext<ThemeContextType>({
  colors: theme.light,
  isDark: false,
  setColorScheme: () => {},
});

// Componente Provider que envolverá a aplicação
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Obtém o esquema de cores do sistema
  const systemColorScheme = useColorScheme();
  // Estado para armazenar o esquema de cores atual
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
    systemColorScheme as 'light' | 'dark' || 'light'
  );

  // Carrega o tema salvo quando o componente é montado
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setColorScheme(savedTheme);
        }
      } catch (error) {
        console.error('Erro ao carregar o tema:', error);
      }
    };

    loadTheme();
  }, []);

  // Função para alterar o tema e salvar a preferência
  const changeColorScheme = (scheme: 'light' | 'dark') => {
    setColorScheme(scheme);
    AsyncStorage.setItem('userTheme', scheme).catch(
      error => console.error('Erro ao salvar o tema:', error)
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        colors: theme[colorScheme],
        isDark: colorScheme === 'dark',
        setColorScheme: changeColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
