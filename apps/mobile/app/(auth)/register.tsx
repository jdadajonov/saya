import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../src/platform/supabase';
import { Logo } from '../../src/ui/brand';
import { useTheme } from '../../src/ui/theme-provider';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDontMatch'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    } catch (err: unknown) {
      Alert.alert(t('common.error'), (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: theme.spacing[6],
          paddingVertical: theme.spacing[8],
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: theme.spacing[6] }}>
          <Logo variant="vertical" size={100} />
        </View>

        <Text style={{
          fontSize: theme.textStyles.title.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
          textAlign: 'center',
          marginBottom: theme.spacing[2],
        }}>
          {t('auth.createAccount')}
        </Text>

        <Text style={{
          fontSize: theme.textStyles.body.fontSize,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: theme.spacing[6],
        }}>
          {t('auth.registerDescription')}
        </Text>

        <View style={{ gap: theme.spacing[3] }}>
          <TextInput
            style={{
              width: '100%',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[3],
              paddingHorizontal: theme.spacing[4],
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
            }}
            placeholder={t('auth.email')}
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={{
              width: '100%',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[3],
              paddingHorizontal: theme.spacing[4],
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
            }}
            placeholder={t('auth.password')}
            placeholderTextColor={theme.colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={{
              width: '100%',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[3],
              paddingHorizontal: theme.spacing[4],
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
            }}
            placeholder={t('auth.confirmPassword')}
            placeholderTextColor={theme.colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={{
              width: '100%',
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[4],
              alignItems: 'center',
              marginTop: theme.spacing[2],
              ...theme.shadows.card,
            }}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '700',
                color: theme.colors.surface,
              }}>
                {t('auth.signUp')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{ alignItems: 'center', marginTop: theme.spacing[4] }}
          >
            <Text style={{
              fontSize: theme.textStyles.caption.fontSize,
              color: theme.colors.textSecondary,
            }}>
              {t('auth.haveAccount')}{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {t('auth.signIn')}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
