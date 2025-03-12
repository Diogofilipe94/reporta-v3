import { View } from 'react-native';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function DrawerScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    // @ts-ignore - Necessário porque o tipo não tem openDrawer diretamente
    navigation.openDrawer();
  }, []);

  return <View />;
}
