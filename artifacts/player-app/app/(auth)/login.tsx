import { useLoginUser } from '@workspace/api-client-react';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveAuth } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { mutateAsync: loginUser, isPending } = useLoginUser();

  async function handleLogin() {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter phone and password');
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await loginUser({ data: { phone: phone.trim(), password } });
      await saveAuth(result.accessToken, result.user);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid credentials';
      Alert.alert('Login Failed', msg);
    }
  }

  const s = styles(colors);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          s.container,
          {
            paddingTop:
              insets.top + (Platform.OS === 'web' ? 67 : 20),
            paddingBottom:
              insets.bottom + (Platform.OS === 'web' ? 34 : 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={s.logo}
          />
          <Text style={s.appName}>Our Empire</Text>
          <Text style={s.tagline}>Satta Matka Platform</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Welcome Back</Text>

          <View style={s.field}>
            <Text style={s.label}>Phone Number</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.passwordRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={s.eyeBtn}
              >
                <Text style={s.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              s.loginBtn,
              isPending && s.loginBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleLogin}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={s.loginBtnText}>Login</Text>
            )}
          </Pressable>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={s.footerLink}>Register</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logo: {
      width: 72,
      height: 72,
      borderRadius: 16,
      marginBottom: 12,
    },
    appName: {
      fontSize: 28,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      letterSpacing: 0.5,
    },
    tagline: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      marginBottom: 20,
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    eyeBtn: {
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    eyeText: {
      fontSize: 18,
    },
    loginBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    loginBtnDisabled: {
      opacity: 0.6,
    },
    loginBtnText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.primaryForeground,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    footerText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    footerLink: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: colors.primary,
    },
  });
}
