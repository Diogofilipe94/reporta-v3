import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Platform } from 'react-native';

// Definição de tipos simples
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Criar o contexto de autenticação
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

// Hook para usar o contexto
export const useAuth = () => useContext(AuthContext);

// Provider do contexto de autenticação
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Referência para o intervalo de verificação do token
  const tokenCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const apiUrl = Platform.OS === 'android'
    ? 'https://reporta.up.railway.app/api/user/reports' // Porta do seu Laravel
    : 'https://reporta.up.railway.app/api/user/reports'; // URL para iOS

  // Função para verificar a validade do token
  const validateToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        return false;
      }

      // Fazer uma requisição para o backend para validar o token
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const isValid = response.ok;

      if (!isValid) {
        // Se o token for inválido, fazer logout automaticamente
        await AsyncStorage.removeItem('token');
        setIsAuthenticated(false);
        router.replace('/(auth)/login');
        return false;
      }

      setIsAuthenticated(true);
      return true;

    } catch (error) {
      console.error('Erro ao validar token:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Verificar token ao iniciar
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      await validateToken();
      setIsLoading(false);
    };

    checkAuthStatus();

    // Configurar verificação periódica (a cada 5 minutos)
    tokenCheckInterval.current = setInterval(() => {
      validateToken();
    }, 5 * 60 * 1000); // 5 minutos em milissegundos

    // Limpar o intervalo quando o componente for desmontado
    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, []);

  // Função de login simplificada
  const signIn = async (token: string) => {
    try {
      await AsyncStorage.setItem('token', token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erro ao salvar token:', error);
    }
  };

  // Função de logout simplificada
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setIsAuthenticated(false);
      // Redirecionar para a página de login
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Exportação padrão para o Expo Router
export default function AuthContextProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
