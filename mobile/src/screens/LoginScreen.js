import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS } from '../theme';
import { useAuth } from '../context/AuthContext';
import CustomDialog from '../components/CustomDialog';

export default function LoginScreen() {
  const { login } = useAuth();
  const theme = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dialogState, setDialogState] = useState({ visible: false, title: '', message: '' });

  const handleLogin = async () => {
    if (!email || !password) {
      setDialogState({ visible: true, title: 'Error', message: 'Please enter both email and password.' });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed. Check your credentials and server connection.';
      setDialogState({ visible: true, title: 'Authentication Failed', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.cardBackground]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="face-recognition" size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>RMS Face AI</Text>
            <Text style={styles.subtitle}>Sign in to your organization</Text>
          </View>

          <Surface style={styles.card} elevation={2}>
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              left={<TextInput.Icon icon="email" color={COLORS.textTertiary} />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              left={<TextInput.Icon icon="lock" color={COLORS.textTertiary} />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                  color={COLORS.textTertiary}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              labelStyle={styles.loginButtonLabel}
            >
              Sign In
            </Button>
          </Surface>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              To create a new organization, please use the web dashboard.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <CustomDialog
        visible={dialogState.visible}
        onDismiss={() => setDialogState(prev => ({ ...prev, visible: false }))}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={() => setDialogState(prev => ({ ...prev, visible: false }))}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  loginButton: {
    marginTop: 8,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontSize: 13,
  },
});
