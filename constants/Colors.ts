import { useColorScheme } from 'react-native';

const palette = {
  // Cores base
  black: '#000000',
  white: '#FFFFFF',

  // Esquema de cores principal
  primary: '#545333',       // Verde oliva escuro
  secondary: '#878672',     // Verde oliva médio
  third: '#d9d7b6',         // Bege claro
  fourth: '#fdfbd4',        // Bege muito claro

  // Tons de cinza para modo escuro
  gray900: '#121212',       // Quase preto
  gray800: '#1e1e1e',       // Cinza muito escuro
  gray700: '#2c2c2c',       // Cinza escuro
  gray600: '#383838',       // Cinza médio-escuro
  gray500: '#505050',       // Cinza médio
  gray400: '#707070',       // Cinza médio-claro
  gray300: '#909090',       // Cinza claro
  gray200: '#b0b0b0',       // Cinza muito claro

  // Cores de estado
  danger: '#e74c3c',        // Vermelho
  warning: '#f39c12',       // Laranja
  success: '#27ae60',       // Verde
};

export const theme = {
  light: {
    background: palette.third,
    surface: palette.white,
    card: palette.secondary,
    errorBackground: '#ffebee',

    textPrimary: palette.primary,
    textSecondary: palette.secondary,
    textTertiary: palette.white,
    textBlack: palette.black,

    primary: palette.secondary,
    secondary: palette.primary,
    accent: palette.white,

    error: palette.danger,
    warning: palette.warning,
    success: palette.success,

    border: palette.black,
    divider: palette.primary,

    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    background: palette.gray900,
    surface: palette.gray800,
    card: palette.gray700,
    errorBackground: '#421c1c',

    textPrimary: palette.fourth,
    textSecondary: palette.third,
    textTertiary: palette.gray300,
    textBlack: palette.white,

    primary: palette.third,
    secondary: palette.secondary,
    accent: palette.fourth,

    error: '#ff6b6b',
    warning: '#ffb142',
    success: '#58d68d',

    border: palette.third,
    divider: palette.gray600,


    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export const useTheme = () => {
  const colorScheme = useColorScheme();
  return {
    colors: theme[colorScheme === 'dark' ? 'dark' : 'light'],
    isDark: colorScheme === 'dark',
  };
};
