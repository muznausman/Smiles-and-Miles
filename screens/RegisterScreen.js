import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    console.log("Register button clicked");

    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      console.log("Creating Firebase user...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase Auth success:", user.uid);

      console.log("Saving to Firestore...");
      const defaultProfilePic = 'https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT_ID.appspot.com/o/default-profile.png?alt=media'; // replace with your default image URL

      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        photoURL: defaultProfilePic,
      });

      console.log("Redirecting to Login...");
      navigation.navigate('Login');
    } catch (error) {
      console.error("Registration Error:", error);
      Alert.alert("Registration Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Smiles & Miles</Text>
        <Text style={styles.subtitle}>Create Account</Text>

        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
<TextInput
  placeholder="Password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry={true}
  textContentType="newPassword"
  autoComplete="new-password"
  autoCorrect={false}
  spellCheck={false}
  importantForAutofill="no"
  style={styles.input}
/>

<TextInput
  placeholder="Confirm Password"
  value={confirmPassword}
  onChangeText={setConfirmPassword}
  secureTextEntry={true}
  textContentType="newPassword"
  autoComplete="new-password"
  autoCorrect={false}
  spellCheck={false}
  importantForAutofill="no"
  style={styles.input}
/>





        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
            Login
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 20,
    paddingTop: 60, // <-- added this line
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C84F5',
  },
  subtitle: {
    fontSize: 18,
    marginVertical: 10,
  },
  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#6C84F5',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 15,
    fontSize: 14,
  },
  link: {
    color: '#6C84F5',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
