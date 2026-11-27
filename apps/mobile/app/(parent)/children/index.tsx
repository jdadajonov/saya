import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import { useChildrenQuery } from '../../../src/features/family/hooks/use-family';
import { getAvatarEmoji } from '../../../src/features/family/components/avatar-picker';

const AVATAR_COLORS = ['#5DD4C8', '#FFB6C1', '#B4A7FF', '#FFD93D', '#FF8C42'];

export default function ChildrenListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const family = useAuthStore((s) => s.family);
  const { data: children = [], isLoading } = useChildrenQuery(family?.id ?? null);

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
          {t('parent.children')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(parent)/children/add')}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.primary,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.chip,
          }}
          accessibilityRole="button"
          accessibilityLabel={t('parent.addChild')}
        >
          <Text style={{ fontSize: 24, color: theme.colors.onFill, fontWeight: '300' }}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing[5] }}>
        {isLoading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />}

        {children.map((child, idx) => {
          const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          const currentYear = new Date().getFullYear();
          const age = currentYear - (child.birthYear ?? currentYear - 10);

          return (
            <View
              key={child.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.card,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                padding: theme.spacing[4],
                marginBottom: theme.spacing[3],
                ...theme.shadows.card,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: child.avatarUrl ? theme.colors.surface : avatarColor,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: theme.spacing[3],
                  overflow: 'hidden',
                }}>
                  {child.avatarUrl ? (
                    <Image
                      source={{ uri: child.avatarUrl }}
                      style={{ width: 46, height: 46, borderRadius: 23 }}
                    />
                  ) : (
                    <Text style={{ fontSize: 24 }}>
                      {getAvatarEmoji(child.avatarKey)}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '700',
                    color: theme.colors.ink,
                  }}>
                    {child.displayName}
                  </Text>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    color: theme.colors.textSecondary,
                    marginTop: 2,
                  }}>
                    {age} лет · {child.ageBand}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[3] }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.button,
                    borderWidth: theme.borderWidth.thin,
                    borderColor: theme.colors.ink,
                    paddingVertical: theme.spacing[2],
                    paddingHorizontal: theme.spacing[3],
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing[2],
                  }}
                  onPress={() => router.push(`/(parent)/children/${child.id}/edit`)}
                >
                  <Text style={{ fontSize: 16 }}>✏️</Text>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    fontWeight: '600',
                    color: theme.colors.ink,
                  }}>
                    Изменить
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: theme.tints.sky,
                    borderRadius: theme.borderRadius.button,
                    borderWidth: theme.borderWidth.thin,
                    borderColor: theme.colors.ink,
                    paddingVertical: theme.spacing[2],
                    paddingHorizontal: theme.spacing[3],
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing[2],
                  }}
                  onPress={() => router.push(`/(parent)/children/${child.id}/link-device`)}
                >
                  <Text style={{ fontSize: 16 }}>📱</Text>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    fontWeight: '600',
                    color: theme.colors.ink,
                  }}>
                    Устройство
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Add child button */}
        <TouchableOpacity
          style={{
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: theme.colors.ink,
            borderRadius: theme.borderRadius.card,
            paddingVertical: theme.spacing[4],
            alignItems: 'center',
            marginTop: theme.spacing[2],
          }}
          onPress={() => router.push('/(parent)/children/add')}
          accessibilityLabel={t('parent.addChild')}
        >
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            fontWeight: '600',
            color: theme.colors.textSecondary,
          }}>
            + {t('parent.addChild')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
