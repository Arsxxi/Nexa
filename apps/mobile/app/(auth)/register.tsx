import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

const COLORS = {
  primary: '#FFC800',
  background: '#FAFAFA',
  card: '#F4F4F5',
  text: '#18181B',
  textSecondary: '#71717A',
  inputBg: '#FFFFFF',
  inputBorder: '#E4E4E7',
  pillBg: '#E4E4E7',
  error: '#DC2626',
};

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function RegisterScreen() {
  const { signUp, isLoaded } = useSignUp();
  const createUser = useMutation(api.users.createUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Note: If CAPTCHA errors occur, disable CAPTCHA in Clerk Dashboard:
  // Go to https://dashboard.clerk.com -> Your App -> User & Authentication -> Attack Protection
  // Set "Bot sign-up protection" to "Off" for development

  const handleRegister = async () => {
    setError('');

    if (!name.trim()) {
      setError('Nama lengkap tidak boleh kosong');
      return;
    }

    if (!email.trim()) {
      setError('Email tidak boleh kosong');
      return;
    }

    if (!validateEmail(email)) {
      setError('Format email tidak valid');
      return;
    }

    if (!password) {
      setError('Password tidak boleh kosong');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi tidak cocok');
      return;
    }

    if (!isLoaded) {
      setError('System sedang dimuat, coba lagi');
      return;
    }

    setLoading(true);
    try {
      const signUpResult = await signUp?.create({
        emailAddress: email,
        password,
        firstName: name,
      });

      // Create user in Convex database
      if (signUpResult?.createdUserId) {
        await createUser({
          clerkId: signUpResult.createdUserId,
          name,
          email,
        });
      }

      // User is now registered and signed in automatically
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Register error:', err);
      const message = err.errors?.[0]?.message || err.message || '';
      if (message.includes('exists') || message.includes('already')) {
        setError('Email sudah terdaftar');
      } else if (message.includes('password')) {
        setError('Password terlalu lemah');
      } else if (message.includes('captcha') || message.includes('CAPTCHA')) {
        setError('Verifikasi keamanan gagal. Coba lagi dalam beberapa saat.');
      } else if (message.includes('network') || message.includes('timeout')) {
        setError('Koneksi bermasalah. Periksa internet dan coba lagi.');
      } else {
        setError(message || 'Pendaftaran gagal. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logoText}>NEXA</Text>
          <Text style={styles.subtitle}>SISTEM INTELIJEN GLOBAL</Text>
        </View>

        <View style={styles.tabContainer}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.tabButton}>
              <Text style={styles.tabTextInactive}>MASUK</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity style={[styles.tabButton, styles.tabActive]}>
            <Text style={styles.tabTextActive}>DAFTAR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>NAMA LENGKAP</Text>
            <TextInput
              style={[styles.input, error && error.includes('Nama') && styles.inputError]}
              placeholder="Masukkan nama lengkap"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={[styles.input, error && error.includes('Email') && styles.inputError]}
              placeholder="user@nexa.io"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={COLORS.textSecondary}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={[styles.input, error && error.includes('Password') && error.length < 25 && styles.inputError]}
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError('');
              }}
              secureTextEntry
              placeholderTextColor={COLORS.textSecondary}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>KONFIRMASI PASSWORD</Text>
            <TextInput
              style={[styles.input, error && error.includes('cocok') && styles.inputError]}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError('');
              }}
              secureTextEntry
              placeholderTextColor={COLORS.textSecondary}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading || !isLoaded}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.buttonText}>DAFTAR →</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.bottomLink}>
              <Text style={styles.bottomLinkText}>SUDAH PUNYA AKUN? MASUK →</Text>
            </TouchableOpacity>
          </Link>

          <View style={styles.xpBadge}>
            <View style={styles.yellowDotWrapper}>
              <View style={styles.yellowDotStar} />
            </View>
            <Text style={styles.xpText}>0 XP · MULAI PETUALANGAN</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 24,
  },
  tabButton: {
    paddingBottom: 8,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabTextInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
    letterSpacing: 1,
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  form: {
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'flex-start',
    marginTop: 'auto',
  },
  bottomLink: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
    borderStyle: 'dashed',
    paddingBottom: 4,
    marginBottom: 40,
  },
  bottomLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pillBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  yellowDotWrapper: {
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  yellowDotStar: {
    width: 8,
    height: 8,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
});