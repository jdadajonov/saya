import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/ui/theme-provider';
import { useAuthStore } from '../../../../src/features/family/stores/auth-store';
import { useUpdateChild } from '../../../../src/features/family/hooks/use-family';
import { AvatarPicker } from '../../../../src/features/family/components/avatar-picker';

const currentYear = new Date().getFullYear();

function getAgeBand(birthYear: number): '7-9' | '10-13' {
  const age = currentYear - birthYear;
  return age <= 9 ? '7-9' : '10-13';
}

export default function EditChildScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { id: childId } = useLocalSearchParams<{ id: string }>();
  const children = useAuthStore((s) => s.children);
  const updateChild = useUpdateChild();

  const child = children.find((c) => c.id === childId);

  const [displayName, setDisplayName] = useState(child?.displayName ?? '');
  const [birthYear, setBirthYear] = useState(child?.birthYear?.toString() ?? '');
  const [gender, setGender] = useState<'boy' | 'girl' | undefined>(child?.gender);
  const [avatarKey, setAvatarKey] = useState(child?.avatarKey ?? 'neutral_1');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(child?.avatarUrl);

  useEffect(() => {
    if (child) {
      setDisplayName(child.displayName);
      setBirthYear(child.birthYear.toString());
      setGender(child.gender);
      setAvatarKey(child.avatarKey);
      setAvatarUrl(child.avatarUrl);
    }
  }, [child]);

  const handleAvatarSelect = (key: string, url?: string) => {
    setAvatarKey(key);
    setAvatarUrl(url);
  };

  const handleSave = () => {
    if (!displayName.trim()) {
      Alert.alert('Ошибка', 'Введите имя ребёнка');
      return;
    }

    const year = parseInt(birthYear, 10);
    if (isNaN(year) || year < 2010 || year > currentYear - 5) {
      Alert.alert('Ошибка', 'Введите корректный год рождения (2010-' + (currentYear - 5) + ')');
      return;
    }

    const ageBand = getAgeBand(year);

    updateChild.mutate(
      {
        childId: childId!,
        displayName: displayName.trim(),
        birthYear: year,
        ageBand,
        gender,
        avatarKey,
        avatarUrl,
      },
      {
        onSuccess: () => {
          Alert.alert('Сохранено', 'Данные ребёнка обновлены', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: () => {
          Alert.alert('Ошибка', 'Не удалось сохранить изменения');
        },
      }
    );
  };

  if (!child) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.textSecondary }}>Ребёнок не найден</Text>
      </View>
    );
  }

  const age = currentYear - (parseInt(birthYear, 10) || child.birthYear);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing[5],
          paddingTop: 60,
          paddingBottom: theme.spacing[4],
          gap: theme.spacing[3],
        }}
      >
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
        >
          <Text style={{ fontSize: 20, color: theme.colors.ink }}>←</Text>
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            fontSize: theme.textStyles.title.fontSize,
            fontWeight: '900',
            color: theme.colors.ink,
          }}
        >
          Редактировать
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing[5] }}>
        {/* Avatar */}
        <AvatarPicker
          avatarKey={avatarKey}
          avatarUrl={avatarUrl}
          onSelect={handleAvatarSelect}
          childId={childId}
        />

        {/* Name */}
        <Text
          style={{
            fontSize: theme.textStyles.caption.fontSize,
            fontWeight: '700',
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing[2],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Имя
        </Text>
        <TextInput
          style={{
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            borderRadius: theme.borderRadius.card,
            paddingHorizontal: theme.spacing[4],
            paddingVertical: theme.spacing[4],
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.ink,
            backgroundColor: theme.colors.surface,
            fontWeight: '600',
            marginBottom: theme.spacing[4],
            ...theme.shadows.card,
          }}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Имя ребёнка"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="words"
        />

        {/* Gender */}
        <Text
          style={{
            fontSize: theme.textStyles.caption.fontSize,
            fontWeight: '700',
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing[2],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Пол
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[3],
            marginBottom: theme.spacing[4],
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: theme.spacing[4],
              borderRadius: theme.borderRadius.card,
              borderWidth: gender === 'boy' ? theme.borderWidth.thick : theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              backgroundColor: gender === 'boy' ? theme.tints.sky : theme.colors.surface,
              alignItems: 'center',
              ...(gender === 'boy' ? theme.shadows.chip : {}),
            }}
            onPress={() => setGender('boy')}
          >
            <Text style={{ fontSize: 32, marginBottom: theme.spacing[1] }}>👦</Text>
            <Text
              style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: gender === 'boy' ? '700' : '500',
                color: theme.colors.ink,
              }}
            >
              Мальчик
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: theme.spacing[4],
              borderRadius: theme.borderRadius.card,
              borderWidth: gender === 'girl' ? theme.borderWidth.thick : theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              backgroundColor: gender === 'girl' ? theme.tints.coral : theme.colors.surface,
              alignItems: 'center',
              ...(gender === 'girl' ? theme.shadows.chip : {}),
            }}
            onPress={() => setGender('girl')}
          >
            <Text style={{ fontSize: 32, marginBottom: theme.spacing[1] }}>👧</Text>
            <Text
              style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: gender === 'girl' ? '700' : '500',
                color: theme.colors.ink,
              }}
            >
              Девочка
            </Text>
          </TouchableOpacity>
        </View>

        {/* Birth year */}
        <Text
          style={{
            fontSize: theme.textStyles.caption.fontSize,
            fontWeight: '700',
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing[2],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Год рождения
        </Text>
        <TextInput
          style={{
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            borderRadius: theme.borderRadius.card,
            paddingHorizontal: theme.spacing[4],
            paddingVertical: theme.spacing[4],
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.ink,
            backgroundColor: theme.colors.surface,
            fontWeight: '600',
            marginBottom: theme.spacing[2],
            ...theme.shadows.card,
          }}
          value={birthYear}
          onChangeText={setBirthYear}
          placeholder="2015"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="number-pad"
          maxLength={4}
        />
        {birthYear.length === 4 && (
          <Text
            style={{
              fontSize: theme.textStyles.caption.fontSize,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing[4],
            }}
          >
            Возраст: {age} лет · Группа: {getAgeBand(parseInt(birthYear, 10))}
          </Text>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.button,
            borderWidth: theme.borderWidth.thick,
            borderColor: theme.colors.ink,
            paddingVertical: theme.spacing[4],
            alignItems: 'center',
            marginTop: theme.spacing[4],
            ...theme.shadows.button,
          }}
          onPress={handleSave}
          disabled={updateChild.isPending}
        >
          {updateChild.isPending ? (
            <ActivityIndicator color={theme.colors.onFill} />
          ) : (
            <Text
              style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '900',
                color: theme.colors.onFill,
              }}
            >
              Сохранить
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
