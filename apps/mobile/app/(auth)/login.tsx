import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../src/platform/supabase';
import { Logo } from '../../src/ui/brand';
import { useTheme } from '../../src/ui/theme-provider';

const DEV_USER = {
  email: 'dev@saya.test',
  password: 'devpass123',
};

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });
      if (error) throw error;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(t('common.error'), (err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtp = async () => {
    if (!email.trim()) return;
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpSent(true);
    } catch (err: unknown) {
      Alert.alert(t('common.error'), (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      setDevLoading(true);
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEV_USER.email,
        password: DEV_USER.password,
      });

      // If user doesn't exist, create and sign in
      if (signInError?.message?.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: DEV_USER.email,
          password: DEV_USER.password,
          options: { data: { dev_user: true } },
        });
        if (signUpError) throw signUpError;

        // Sign in after signup
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: DEV_USER.email,
          password: DEV_USER.password,
        });
        if (retryError) throw retryError;
      } else if (signInError) {
        throw signInError;
      }
    } catch (err: unknown) {
      Alert.alert('Dev Login Error', (err as Error).message);
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[6],
        gap: theme.spacing[4],
      }}>
        <View style={{ marginBottom: theme.spacing[6], alignItems: 'center' }} accessibilityRole="header">
          <Logo variant="vertical" size={140} />
        </View>

        {!otpSent ? (
          <>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={theme.borderRadius.card}
              style={{ width: '100%', height: 52 }}
              onPress={handleAppleSignIn}
            />

            <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>—</Text>

            <TextInput
              style={{
                width: '100%',
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                borderRadius: theme.borderRadius.card,
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[4],
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.ink,
                backgroundColor: theme.colors.surface,
                fontWeight: '600',
              }}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel={t('auth.email')}
            />

            <TouchableOpacity
              style={{
                width: '100%',
                backgroundColor: loading || !email.trim() ? theme.colors.disabled : theme.colors.primary,
                borderRadius: theme.borderRadius.button,
                borderWidth: theme.borderWidth.thick,
                borderColor: theme.colors.ink,
                paddingVertical: theme.spacing[4],
                alignItems: 'center',
                ...theme.shadows.button,
              }}
              onPress={handleEmailOtp}
              disabled={loading || !email.trim()}
              accessibilityRole="button"
              accessibilityLabel={t('auth.signInWithEmail')}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.onFill} />
              ) : (
                <Text style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: '900',
                  color: theme.colors.onFill,
                }}>
                  {t('auth.signInWithEmail')}
                </Text>
              )}
            </TouchableOpacity>

            {__DEV__ && (
              <TouchableOpacity
                style={{
                  width: '100%',
                  backgroundColor: theme.tints.teal,
                  borderRadius: theme.borderRadius.button,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  paddingVertical: theme.spacing[3],
                  alignItems: 'center',
                  marginTop: theme.spacing[4],
                }}
                onPress={handleDevLogin}
                disabled={devLoading}
              >
                {devLoading ? (
                  <ActivityIndicator color={theme.colors.ink} />
                ) : (
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    fontWeight: '700',
                    color: theme.colors.ink,
                  }}>
                    🛠️ Dev Login (dev@saya.test)
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
            <Text style={{ fontSize: 48 }}>📬</Text>
            <Text style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '900',
              color: theme.colors.ink,
            }}>
              {t('auth.otpSentTitle')}
            </Text>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}>
              {t('auth.otpSentSubtitle', { email })}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
