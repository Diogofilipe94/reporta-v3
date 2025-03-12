// app/(auth)/register.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RegisterScreen() {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [number, setNumber] = useState('');
  const [cp, setCp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  async function handleRegister() {
    try {
      setIsLoading(true);
      setError('');

      // Criar endereço
      const addressResponse = await fetch('http://127.0.0.1:8000/api/addresses', {
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

      const addressId = addressData.address.id;

      // Criar utilizador
      const userResponse = await fetch('http://127.0.0.1:8000/api/register', {
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
      //router.push('/(auth)/login');
      Alert.alert('Utilizador criado com sucesso!');

    } catch (error) {
      console.error('Erro no registo:', error);
      if (error instanceof Error) {
        setError(error.message || 'Ocorreu um erro durante o registo');
      } else {
        setError('Ocorreu um erro durante o registo');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Registo</Text>
        <Text style={styles.subtitle}>Criar uma nova conta</Text>
      </View>

      <ScrollView style={styles.form}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Primeiro nome"
              value={first_name}
              onChangeText={setFirstName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Apelido</Text>
            <TextInput
              style={styles.input}
              placeholder="Último nome"
              value={last_name}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="exemplo@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="Número de telefone"
              value={telephone}
              onChangeText={setTelephone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Morada</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Rua</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da rua"
              value={street}
              onChangeText={setStreet}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Número</Text>
            <TextInput
              style={styles.input}
              placeholder="Número da porta"
              value={number}
              onChangeText={setNumber}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Código Postal</Text>
            <TextInput
              style={styles.input}
              placeholder="1234-567"
              value={cp}
              onChangeText={setCp}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da cidade"
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'A processar...' : 'Registar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.back()}
        >
          <Text style={styles.loginText}>Já tem conta? Faça login</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3498db',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    opacity: 0.8,
  },
  form: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#3498db',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginVertical: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#3498db',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  }
});
