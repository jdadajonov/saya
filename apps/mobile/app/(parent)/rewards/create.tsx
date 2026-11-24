import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import { useCreateReward, useRewardCatalogQuery } from '../../../src/features/rewards/hooks/use-rewards';

interface RewardTemplate {
  id: string;
  icon: string;
  title: string;
  description: string;
  costCoins: number;
}

const REWARD_TEMPLATES: RewardTemplate[] = [
  { id: 'screen30', icon: '📱', title: '30 минут экранного времени', description: 'Телефон, планшет или компьютер', costCoins: 15 },
  { id: 'screen60', icon: '🖥️', title: '1 час экранного времени', description: 'Телефон, планшет или компьютер', costCoins: 25 },
  { id: 'movie', icon: '🎬', title: 'Посмотреть фильм', description: 'Выбор фильма на вечер', costCoins: 20 },
  { id: 'game', icon: '🎮', title: 'Час видеоигр', description: 'Любимая игра на выбор', costCoins: 30 },
  { id: 'boardgame', icon: '🎲', title: 'Настольная игра с семьёй', description: 'Выбор игры за ребёнком', costCoins: 15 },
  { id: 'cafe', icon: '☕', title: 'Поход в кафе', description: 'Десерт или напиток', costCoins: 50 },
  { id: 'icecream', icon: '🍦', title: 'Мороженое', description: 'Любимое мороженое', costCoins: 20 },
  { id: 'pizza', icon: '🍕', title: 'Пицца на ужин', description: 'Заказать любимую пиццу', costCoins: 40 },
  { id: 'toy', icon: '🧸', title: 'Маленький подарок', description: 'Игрушка или аксессуар до 1000₽', costCoins: 100 },
  { id: 'bigtoy', icon: '🎁', title: 'Большой подарок', description: 'Игрушка или гаджет до 5000₽', costCoins: 300 },
  { id: 'sleepover', icon: '🏠', title: 'Пригласить друга с ночёвкой', description: 'Пижамная вечеринка', costCoins: 60 },
  { id: 'lateBed', icon: '🌙', title: 'Лечь спать позже', description: 'На 30 минут позже обычного', costCoins: 15 },
  { id: 'noChores', icon: '😎', title: 'Выходной от домашних дел', description: 'Один день без обязанностей', costCoins: 25 },
  { id: 'trip', icon: '🎢', title: 'Поход в парк развлечений', description: 'Аквапарк, аттракционы или зоопарк', costCoins: 150 },
  { id: 'book', icon: '📚', title: 'Новая книга', description: 'Выбор книги в магазине', costCoins: 35 },
];

export default function CreateRewardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { family } = useAuthStore();
  const createMut = useCreateReward();
  const catalogQuery = useRewardCatalogQuery(family?.id ?? null);

  const [selectedTemplate, setSelectedTemplate] = useState<RewardTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [costCoins, setCostCoins] = useState(20);
  const [showCustom, setShowCustom] = useState(false);

  const existingRewards = catalogQuery.data ?? [];
  const existingTitles = new Set(existingRewards.map((r) => r.title));

  const handleSelectTemplate = (tpl: RewardTemplate) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.title);
    setDescription(tpl.description);
    setCostCoins(tpl.costCoins);
    setShowCustom(false);
  };

  const handleShowCustom = () => {
    setSelectedTemplate(null);
    setTitle('');
    setDescription('');
    setCostCoins(20);
    setShowCustom(true);
  };

  const handleCreate = () => {
    const finalTitle = title.trim();
    if (!finalTitle) {
      Alert.alert(t('common.error'), 'Введите название награды');
      return;
    }

    createMut.mutate(
      {
        familyId: family?.id ?? '',
        title: finalTitle,
        description: description.trim() || undefined,
        costCoins,
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('common.error'), t('common.retry')),
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: 60, paddingBottom: 120 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[5] }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadows.chip,
            }}
          >
            <Text style={{ fontSize: 20, color: theme.colors.ink }}>‹</Text>
          </TouchableOpacity>
          <Text style={{
            flex: 1,
            fontSize: 24,
            fontWeight: '900',
            color: theme.colors.ink,
            marginLeft: theme.spacing[3],
          }}>
            Каталог наград
          </Text>
        </View>

        {/* Templates */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '600',
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[2],
          textTransform: 'uppercase',
        }}>
          Выберите награду
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
          {REWARD_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplate?.id === tpl.id;
            const alreadyExists = existingTitles.has(tpl.title);

            return (
              <TouchableOpacity
                key={tpl.id}
                style={{
                  width: '48%',
                  backgroundColor: alreadyExists ? theme.colors.disabled : (isSelected ? theme.tints.sun : theme.colors.surface),
                  borderRadius: theme.borderRadius.card,
                  borderWidth: isSelected ? theme.borderWidth.thick : theme.borderWidth.regular,
                  borderColor: isSelected ? theme.colors.secondary : theme.colors.ink,
                  padding: theme.spacing[3],
                  opacity: alreadyExists ? 0.5 : 1,
                  ...theme.shadows.chip,
                }}
                onPress={() => !alreadyExists && handleSelectTemplate(tpl)}
                disabled={alreadyExists}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[2] }}>
                  <Text style={{ fontSize: 24, marginRight: theme.spacing[2] }}>{tpl.icon}</Text>
                  <View style={{
                    backgroundColor: theme.tints.sun,
                    borderRadius: theme.borderRadius.full,
                    paddingHorizontal: theme.spacing[2],
                    paddingVertical: 2,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.ink }}>
                      🪙 {tpl.costCoins}
                    </Text>
                  </View>
                </View>
                <Text style={{
                  fontSize: theme.textStyles.caption.fontSize,
                  fontWeight: '700',
                  color: theme.colors.ink,
                  marginBottom: 2,
                }}>
                  {tpl.title}
                </Text>
                {alreadyExists && (
                  <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>
                    ✓ Уже добавлено
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Custom reward button */}
          <TouchableOpacity
            style={{
              width: '48%',
              backgroundColor: showCustom ? theme.tints.sun : theme.colors.surface,
              borderRadius: theme.borderRadius.card,
              borderWidth: showCustom ? theme.borderWidth.thick : 2,
              borderStyle: showCustom ? 'solid' : 'dashed',
              borderColor: showCustom ? theme.colors.secondary : theme.colors.ink,
              padding: theme.spacing[3],
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 100,
            }}
            onPress={handleShowCustom}
          >
            <Text style={{ fontSize: 32, marginBottom: theme.spacing[1] }}>+</Text>
            <Text style={{
              fontSize: theme.textStyles.caption.fontSize,
              fontWeight: '600',
              color: theme.colors.ink,
            }}>
              Своя награда
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom reward form */}
        {showCustom && (
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
            ...theme.shadows.card,
          }}>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '800',
              color: theme.colors.ink,
              marginBottom: theme.spacing[3],
            }}>
              Своя награда
            </Text>

            <TextInput
              style={{
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                borderRadius: theme.borderRadius.md,
                paddingHorizontal: theme.spacing[3],
                paddingVertical: theme.spacing[3],
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.ink,
                backgroundColor: theme.colors.background,
                marginBottom: theme.spacing[3],
              }}
              value={title}
              onChangeText={setTitle}
              placeholder="Название награды"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <TextInput
              style={{
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                borderRadius: theme.borderRadius.md,
                paddingHorizontal: theme.spacing[3],
                paddingVertical: theme.spacing[3],
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.ink,
                backgroundColor: theme.colors.background,
                marginBottom: theme.spacing[3],
                minHeight: 60,
              }}
              value={description}
              onChangeText={setDescription}
              placeholder="Описание (необязательно)"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
            />

            <Text style={{
              fontSize: theme.textStyles.caption.fontSize,
              fontWeight: '600',
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing[2],
            }}>
              Стоимость в монетах
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
              {[10, 20, 50, 100].map((cost) => (
                <TouchableOpacity
                  key={cost}
                  style={{
                    flex: 1,
                    backgroundColor: costCoins === cost ? theme.tints.sun : theme.colors.background,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: theme.borderWidth.thin,
                    borderColor: theme.colors.ink,
                    paddingVertical: theme.spacing[2],
                    alignItems: 'center',
                  }}
                  onPress={() => setCostCoins(cost)}
                >
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: costCoins === cost ? '700' : '500',
                    color: theme.colors.ink,
                  }}>
                    {cost}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Info */}
        <View style={{
          backgroundColor: theme.tints.violet,
          borderRadius: theme.borderRadius.card,
          padding: theme.spacing[4],
          flexDirection: 'row',
          gap: theme.spacing[3],
        }}>
          <Text style={{ fontSize: 20 }}>💡</Text>
          <Text style={{
            flex: 1,
            fontSize: theme.textStyles.caption.fontSize,
            color: theme.colors.ink,
            lineHeight: 18,
          }}>
            Награды видны ребёнку в приложении. Он копит монеты и запрашивает награды, а вы одобряете.
          </Text>
        </View>
      </ScrollView>

      {/* Submit button */}
      {(selectedTemplate || showCustom) && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: theme.spacing[5],
          backgroundColor: theme.colors.background,
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.secondary,
              borderRadius: theme.borderRadius.button,
              borderWidth: theme.borderWidth.thick,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[4],
              alignItems: 'center',
              ...theme.shadows.button,
            }}
            onPress={handleCreate}
            disabled={createMut.isPending}
          >
            <Text style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '900',
              color: theme.colors.ink,
            }}>
              {createMut.isPending ? t('common.loading') : 'Добавить в каталог'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
