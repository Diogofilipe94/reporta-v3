import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { colors, isDark } = useTheme();

  const apiUrl = Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api/login'
    : 'http://localhost:8000/api/login';

  const router = useRouter();
  const { signIn } = useAuth();

  async function handleLogin() {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();
      console.log(data);

      if (response.ok && data.token) {
        await signIn(data.token);
        console.log("Token guardado:", data.token);
        router.replace('/(app)/(tabs)');
      } else {
        setError(data.message || 'Utilizador ou password inválidos');
      }
    } catch (error) {
      setError('Utilizador ou password inválidos');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Reporta</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Bem-vindo de volta!</Text>
      </View>

      <View style={[styles.form, { backgroundColor: colors.surface }]}>
        {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Email</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.surface,
              borderBottomColor: colors.primary,
              color: colors.textPrimary
            }]}
            placeholder="exemplo@email.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete='email'
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
          <View style={[styles.passwordContainer, {
            backgroundColor: colors.surface,
            borderBottomColor: colors.secondary,
            borderBottomWidth: 1,
          }]}>
            <TextInput
              style={[styles.passwordInput, {
                color: colors.textSecondary,
                backgroundColor: colors.surface,
              }]}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Ionicons
                name={passwordVisible ? 'eye-off' : 'eye'}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.secondary }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: isDark ? colors.background : colors.textTertiary }]}>
            {isLoading ? 'A entrar...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={[styles.registerText, { color: colors.border}]}>
            Não tem conta? Registe-se aqui
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 100,
    paddingBottom: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.8,
  },
  form: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    padding: 15,
    borderBottomWidth: 1,
    borderRadius: 10,
    fontSize: 16,
  },
  button: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  errorText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 0,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
});
