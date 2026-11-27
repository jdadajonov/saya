import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/ui/theme-provider';
import { useAuthStore } from '../../src/features/family/stores/auth-store';
import { useDeleteFamily } from '../../src/features/family/hooks/use-family';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const signOut = useAuthStore((s) => s.signOut);
  const deleteFamily = useDeleteFamily();
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('parent.deleteAccount'),
      t('parent.confirmDeleteAccount'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteFamily.mutateAsync();
            } catch (err: unknown) {
              setDeleting(false);
              Alert.alert(t('common.error'), (err as Error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[5],
        paddingTop: 60,
        paddingBottom: theme.spacing[4],
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.surface,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.chip,
          }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={{ fontSize: 20, color: theme.colors.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: theme.textStyles.title.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
        }} accessibilityRole="header">
          {t('parent.settings')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing[5] }}>
        {/* Family section */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '600',
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[2],
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          Семья
        </Text>

        {/* Invite parent */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing[3],
            ...theme.shadows.card,
          }}
          onPress={() => router.push('/(parent)/family/invite')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
            <Text style={{ fontSize: 20 }}>👨‍👩‍👧</Text>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '600',
              color: theme.colors.ink,
            }}>
              Пригласить родителя
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: theme.colors.textSecondary }}>›</Text>
        </TouchableOpacity>

        {/* Children */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing[5],
            ...theme.shadows.card,
          }}
          onPress={() => router.push('/(parent)/children')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
            <Text style={{ fontSize: 20 }}>🧒</Text>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '600',
              color: theme.colors.ink,
            }}>
              Дети
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: theme.colors.textSecondary }}>›</Text>
        </TouchableOpacity>

        {/* Account section */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '600',
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[2],
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          Аккаунт
        </Text>

        {/* Sign Out */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing[3],
            ...theme.shadows.card,
          }}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel={t('auth.signOut')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
            <Text style={{ fontSize: 20 }}>🚪</Text>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '600',
              color: theme.colors.ink,
            }}>
              {t('auth.signOut')}
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: theme.colors.textSecondary }}>›</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.error,
            padding: theme.spacing[4],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: theme.spacing[6],
          }}
          onPress={handleDeleteAccount}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel={t('parent.deleteAccount')}
        >
          {deleting ? (
            <ActivityIndicator color={theme.colors.error} />
          ) : (
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '600',
              color: theme.colors.error,
            }}>
              {t('parent.deleteAccount')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
