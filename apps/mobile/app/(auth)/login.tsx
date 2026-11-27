import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../../src/platform/supabase';
import { Logo } from '../../src/ui/brand';
import { useTheme } from '../../src/ui/theme-provider';

GoogleSignin.configure({
  iosClientId: process.env['EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'],
  webClientId: process.env['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'],
  scopes: ['openid', 'profile', 'email'],
});

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.data?.idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.data.idToken,
        });
        if (error) throw error;
      } else {
        throw new Error('No idToken received from Google');
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert(t('common.error'), error.message || 'Google Sign In failed');
      }
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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

        <Text style={{
          fontSize: theme.textStyles.body.fontSize,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: theme.spacing[2],
        }}>
          {t('auth.welcomeMessage')}
        </Text>

        {/* Google Sign In */}
        <TouchableOpacity
          style={{
            width: '100%',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            paddingVertical: theme.spacing[4],
            paddingHorizontal: theme.spacing[5],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing[3],
            ...theme.shadows.card,
          }}
          onPress={handleGoogleSignIn}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={t('auth.signInWithGoogle')}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.ink} />
          ) : (
            <>
              <Text style={{ fontSize: 20 }}>🔵</Text>
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '700',
                color: theme.colors.ink,
              }}>
                {t('auth.signInWithGoogle')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>или</Text>

        {/* Apple Sign In */}
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={theme.borderRadius.card}
          style={{ width: '100%', height: 52 }}
          onPress={handleAppleSignIn}
        />

        {/* Divider */}
        <View style={{
          width: '100%',
          height: 1,
          backgroundColor: theme.colors.border,
          marginVertical: theme.spacing[4],
        }} />

        {/* Child login */}
        <TouchableOpacity
          style={{
            width: '100%',
            backgroundColor: theme.tints.sun,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            paddingVertical: theme.spacing[4],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing[2],
            ...theme.shadows.chip,
          }}
          onPress={() => router.push('/(auth)/child-login')}
          disabled={loading}
        >
          <Text style={{ fontSize: 24 }}>🧒</Text>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            fontWeight: '700',
            color: theme.colors.ink,
          }}>
            Войти как ребёнок
          </Text>
        </TouchableOpacity>

        {/* Join family link */}
        <TouchableOpacity
          style={{ marginTop: theme.spacing[2] }}
          onPress={() => router.push('/(auth)/join-family')}
          disabled={loading}
        >
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.primary,
            textDecorationLine: 'underline',
          }}>
            У меня есть код приглашения
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
