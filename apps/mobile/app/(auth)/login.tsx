import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../src/platform/supabase';
import { Logo } from '../../src/ui/brand';
import { useTheme } from '../../src/ui/theme-provider';

WebBrowser.maybeCompleteAuthSession();

const DEV_USER = {
  email: 'dev@saya.test',
  password: 'devpass123',
};

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  const redirectUri = makeRedirectUri({
    scheme: 'com.googleusercontent.apps.414719156571-eifebfi60g07dq2sv5ecmo8akcgoosq2',
  });

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: process.env['EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'],
    webClientId: process.env['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'],
    redirectUri,
  });

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await googlePromptAsync();

      if (result.type === 'success') {
        const { id_token } = result.params;

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: id_token,
        });

        if (error) throw error;
      }
    } catch (err: unknown) {
      Alert.alert(t('common.error'), (err as Error).message);
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

  const handleDevLogin = async () => {
    try {
      setDevLoading(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEV_USER.email,
        password: DEV_USER.password,
      });

      if (signInError?.message?.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: DEV_USER.email,
          password: DEV_USER.password,
          options: { data: { dev_user: true } },
        });
        if (signUpError) throw signUpError;

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
      </View>
    </View>
  );
}
