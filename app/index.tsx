import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();


  // Enquanto está a verificar o estado de autenticação, não redireciona
  if (isLoading) {
    return null;
  }

  // Redireciona baseado no estado de autenticação
  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
