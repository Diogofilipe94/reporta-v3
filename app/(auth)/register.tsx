import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen(): React.ReactElement {
  // Estados para campos do formulário
  const [first_name, setFirstName] = useState<string>('');
  const [last_name, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [telephone, setTelephone] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [cp, setCp] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

  // Estados para erros de cada campo
  const [errors, setErrors] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    telephone: '',
    street: '',
    city: '',
    number: '',
    cp: '',
    general: ''
  });

  const { colors } = useTheme();
  const router = useRouter();

  // Adicionar ouvintes do teclado para mostrar/esconder o botão de fechar teclado
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Função para validar email usando regex
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Função para validar código postal português (formato 4 dígitos-3 dígitos)
  const isValidPostalCode = (cp: string): boolean => {
    const cpRegex = /^[0-9]{4}-[0-9]{3}$/;
    return cpRegex.test(cp);
  };

  // Função para validar telefone português (9 dígitos)
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  // Função para validar todo o formulário
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    // Validar nome
    if (!first_name.trim()) {
      newErrors.first_name = 'Nome é obrigatório';
      isValid = false;
    } else {
      newErrors.first_name = '';
    }

    // Validar apelido
    if (!last_name.trim()) {
      newErrors.last_name = 'Apelido é obrigatório';
      isValid = false;
    } else {
      newErrors.last_name = '';
    }

    // Validar email
    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
      isValid = false;
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email inválido';
      isValid = false;
    } else {
      newErrors.email = '';
    }

    // Validar password
    if (!password.trim()) {
      newErrors.password = 'Password é obrigatória';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password deve ter pelo menos 6 caracteres';
      isValid = false;
    } else {
      newErrors.password = '';
    }

    // Validar telefone
    if (!telephone.trim()) {
      newErrors.telephone = 'Telefone é obrigatório';
      isValid = false;
    } else if (!isValidPhone(telephone)) {
      newErrors.telephone = 'Telefone deve ter 9 dígitos';
      isValid = false;
    } else {
      newErrors.telephone = '';
    }

    // Validar rua
    if (!street.trim()) {
      newErrors.street = 'Rua é obrigatória';
      isValid = false;
    } else {
      newErrors.street = '';
    }

    // Validar número
    if (!number.trim()) {
      newErrors.number = 'Número é obrigatório';
      isValid = false;
    } else {
      newErrors.number = '';
    }

    // Validar código postal
    if (!cp.trim()) {
      newErrors.cp = 'Código postal é obrigatório';
      isValid = false;
    } else if (!isValidPostalCode(cp)) {
      newErrors.cp = 'Formato deve ser XXXX-XXX';
      isValid = false;
    } else {
      newErrors.cp = '';
    }

    // Validar cidade
    if (!city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
      isValid = false;
    } else {
      newErrors.city = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  async function handleRegister(): Promise<void> {
    // Limpar erro geral
    setErrors(prev => ({ ...prev, general: '' }));

    // Fechar o teclado
    Keyboard.dismiss();

    // Validar formulário antes de enviar
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Criar endereço
      const addressResponse = await fetch('https://reporta.up.railway.app/api/address', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          street,
          number,
          city,
          cp
        })
      });

      const addressData = await addressResponse.json();
      console.log('Endereço criado:', addressData);

      if (!addressResponse.ok) {
        throw new Error(addressData.message || 'Erro ao criar endereço');
      }

      const addressId = addressData.id;

      // Criar utilizador
      const userResponse = await fetch('https://reporta.up.railway.app/api/register', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          password,
          telephone,
          address_id: addressId
        })
      });

      const userData = await userResponse.json();
      console.log('Utilizador criado:', userData);

      if (!userResponse.ok) {
        throw new Error(userData.message || 'Erro ao criar utilizador');
      }

      // Redirecionar para a página de login
      router.dismiss();
      Alert.alert('Sucesso', 'Utilizador criado com sucesso!');

    } catch (error) {
      console.error('Erro no registo:', error);
      if (error instanceof Error) {
        setErrors(prev => ({ ...prev, general: error.message || 'Ocorreu um erro durante o registo' }));
      } else {
        setErrors(prev => ({ ...prev, general: 'Ocorreu um erro durante o registo' }));
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Componente para mensagem de erro de input
  const ErrorMessage: React.FC<{ error: string }> = ({ error }) => {
    if (!error) return null;
    return (
      <Text style={[styles.errorMessage, { color: colors.error }]}>
        {error}
      </Text>
    );
  };

  return (
    // KeyboardAvoidingView como componente principal, seguindo a documentação
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Registo</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, opacity: 0.8 }]}>Criar uma nova conta</Text>
      </View>

      <ScrollView 
        style={[styles.form, { backgroundColor: colors.surface }]}
        contentContainerStyle={{ paddingBottom: 150 }} // Espaço extra para garantir que os campos inferiores sejam visíveis
        keyboardShouldPersistTaps="handled"
      >
        {errors.general ? (
          <View style={styles.generalErrorContainer}>
            <Text style={[styles.generalErrorText, { color: colors.error, backgroundColor: colors.error }]}>
              {errors.general}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dados Pessoais</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Nome</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: errors.first_name ? colors.error : colors.primary,
                  color: colors.textPrimary
                }
              ]}
              placeholder="Primeiro nome"
              placeholderTextColor={colors.textSecondary}
              value={first_name}
              onChangeText={(text) => {
                setFirstName(text);
                if (errors.first_name) {
                  setErrors(prev => ({ ...prev, first_name: '' }));
                }
              }}
              returnKeyType="next"
            />
            <ErrorMessage error={errors.first_name} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Apelido</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: errors.last_name ? colors.error : colors.primary,
                  color: colors.textPrimary
                }
              ]}
              placeholder="Último nome"
              placeholderTextColor={colors.textSecondary}
              value={last_name}
              onChangeText={(text) => {
                setLastName(text);
                if (errors.last_name) {
                  setErrors(prev => ({ ...prev, last_name: '' }));
                }
              }}
              returnKeyType="next"
            />
            <ErrorMessage error={errors.last_name} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: errors.email ? colors.error : colors.primary,
                  color: colors.textPrimary
                }
              ]}
              placeholder="exemplo@email.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />
            <ErrorMessage error={errors.email} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
            <View style={[
              styles.passwordContainer,
              {
                backgroundColor: colors.surface,
                borderBottomColor: errors.password ? colors.error : colors.secondary,
                borderBottomWidth: 1,
              }
            ]}>
              <TextInput
                style={[styles.passwordInput, {
                  color: colors.textSecondary,
                  backgroundColor: colors.surface,
                }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                secureTextEntry={!passwordVisible}
                returnKeyType="next"
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
            <ErrorMessage error={errors.password} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Telefone</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: errors.telephone ? colors.error : colors.primary,
                  color: colors.textPrimary
                }
              ]}
              placeholder="Número de telefone"
              placeholderTextColor={colors.textSecondary}
              value={telephone}
              onChangeText={(text) => {
                setTelephone(text);
                if (errors.telephone) {
                  setErrors(prev => ({ ...prev, telephone: '' }));
                }
              }}
              keyboardType="phone-pad"
              maxLength={9}
              returnKeyType="next"
            />
            <ErrorMessage error={errors.telephone} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Morada</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Rua</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: errors.street ? colors.error : colors.primary,
                  color: colors.textPrimary
                }
              ]}
              placeholder="Nome da rua"
              placeholderTextColor={colors.textSecondary}
              value={street}
              onChangeText={(text) => {
                setStreet(text);
                if (errors.street) {
                  setErrors(prev => ({ ...prev, street: '' }));
                }
              }}
              returnKeyType="next"
            />
            <ErrorMessage error={errors.street} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Número</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: errors.number ? colors.error : colors.primary,
                  color: colors.textPrimary
                }
              ]}
              placeholder="Número da porta"
              placeholderTextColor={colors.textSecondary}
              value={number}
              onChangeText={(text) => {
                setNumber(text);
                if (errors.number) {
                  setErrors(prev => ({ ...prev, number: '' }));
                }
              }}
              keyboardType="numeric"
              returnKeyType="next"
            />
            <ErrorMessage error={errors.number} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Código Postal</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: errors.cp ? colors.error : colors.primary,
                  color: colors.textPrimary
                }
              ]}
              placeholder="1234-567"
              placeholderTextColor={colors.textSecondary}
              value={cp}
              onChangeText={(text) => {
                setCp(text);
                if (errors.cp) {
                  setErrors(prev => ({ ...prev, cp: '' }));
                }
              }}
              returnKeyType="next"
            />
            <ErrorMessage error={errors.cp} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Cidade</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: errors.city ? colors.error : colors.primary,
                  color: colors.textPrimary
                }
              ]}
              placeholder="Nome da cidade"
              placeholderTextColor={colors.textSecondary}
              value={city}
              onChangeText={(text) => {
                setCity(text);
                if (errors.city) {
                  setErrors(prev => ({ ...prev, city: '' }));
                }
              }}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            <ErrorMessage error={errors.city} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: colors.textTertiary }]}>
            {isLoading ? 'A processar...' : 'Registar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.back()}
        >
          <Text style={[styles.loginText, { color: colors.border }]}>
            Já tem conta? Faça login
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Botão para fechar o teclado (visível apenas quando o teclado está aberto) */}
      {keyboardVisible && (
        <TouchableOpacity
          style={[styles.keyboardDismissButton, { backgroundColor: colors.primary }]}
          onPress={Keyboard.dismiss}
        >
          <Ionicons name="chevron-down" size={24} color="white" />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
  },
  form: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginVertical: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  errorMessage: {
    fontSize: 12,
    marginTop: 5,
  },
  generalErrorContainer: {
    marginBottom: 20,
  },
  generalErrorText: {
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
  },
  keyboardDismissButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 999,
  }
});