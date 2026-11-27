import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../ui/theme-provider';
import { supabase } from '../../../platform/supabase';

const AVATARS = [
  { key: 'boy_1', emoji: '👦', label: 'Мальчик 1' },
  { key: 'boy_2', emoji: '👦🏻', label: 'Мальчик 2' },
  { key: 'boy_3', emoji: '👦🏽', label: 'Мальчик 3' },
  { key: 'boy_4', emoji: '🧑', label: 'Мальчик 4' },
  { key: 'boy_5', emoji: '🧑🏻', label: 'Мальчик 5' },
  { key: 'girl_1', emoji: '👧', label: 'Девочка 1' },
  { key: 'girl_2', emoji: '👧🏻', label: 'Девочка 2' },
  { key: 'girl_3', emoji: '👧🏽', label: 'Девочка 3' },
  { key: 'girl_4', emoji: '👩', label: 'Девочка 4' },
  { key: 'girl_5', emoji: '👩🏻', label: 'Девочка 5' },
  { key: 'neutral_1', emoji: '🧒', label: 'Ребёнок 1' },
  { key: 'neutral_2', emoji: '🧒🏻', label: 'Ребёнок 2' },
  { key: 'animal_1', emoji: '🐱', label: 'Котёнок' },
  { key: 'animal_2', emoji: '🐶', label: 'Щенок' },
  { key: 'animal_3', emoji: '🦊', label: 'Лисёнок' },
  { key: 'animal_4', emoji: '🐰', label: 'Зайчик' },
  { key: 'animal_5', emoji: '🐻', label: 'Мишка' },
  { key: 'animal_6', emoji: '🦁', label: 'Львёнок' },
];

interface AvatarPickerProps {
  avatarKey: string;
  avatarUrl?: string;
  onSelect: (avatarKey: string, avatarUrl?: string) => void;
  childId?: string;
}

export function AvatarPicker({ avatarKey, avatarUrl, onSelect, childId }: AvatarPickerProps) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedAvatar = AVATARS.find((a) => a.key === avatarKey);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Нужен доступ', 'Разрешите доступ к галерее в настройках');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    if (!childId) {
      Alert.alert('Ошибка', 'Сначала сохраните ребёнка, потом загрузите фото');
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Ошибка', 'Не удалось получить фото. Попробуйте другое изображение.');
      return;
    }

    setUploading(true);
    try {
      const ext = 'jpg';
      const fileName = `${childId}/avatar_${Date.now()}.${ext}`;

      const arrayBuffer = decode(asset.base64);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onSelect('custom', urlData.publicUrl + '?t=' + Date.now());
      setModalVisible(false);
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Ошибка', 'Не удалось загрузить фото. Проверьте подключение к интернету.');
    } finally {
      setUploading(false);
    }
  };

  function decode(base64: string): ArrayBuffer {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup: Record<number, number> = {};
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }

    let bufferLength = base64.length * 0.75;
    if (base64[base64.length - 1] === '=') bufferLength--;
    if (base64[base64.length - 2] === '=') bufferLength--;

    const bytes = new Uint8Array(bufferLength);
    let p = 0;

    for (let i = 0; i < base64.length; i += 4) {
      const encoded1 = lookup[base64.charCodeAt(i)] ?? 0;
      const encoded2 = lookup[base64.charCodeAt(i + 1)] ?? 0;
      const encoded3 = lookup[base64.charCodeAt(i + 2)] ?? 0;
      const encoded4 = lookup[base64.charCodeAt(i + 3)] ?? 0;

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return bytes.buffer;
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          alignItems: 'center',
          marginBottom: theme.spacing[4],
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.tints.sun,
            borderWidth: theme.borderWidth.thick,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.card,
          }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
            />
          ) : (
            <Text style={{ fontSize: 48 }}>{selectedAvatar?.emoji ?? '👤'}</Text>
          )}
        </View>
        <Text
          style={{
            fontSize: theme.textStyles.caption.fontSize,
            color: theme.colors.primary,
            marginTop: theme.spacing[2],
            fontWeight: '600',
          }}
        >
          Изменить аватар
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: theme.spacing[5],
              paddingTop: theme.spacing[5],
              paddingBottom: theme.spacing[4],
            }}
          >
            <Text
              style={{
                fontSize: theme.textStyles.title.fontSize,
                fontWeight: '900',
                color: theme.colors.ink,
              }}
            >
              Выберите аватар
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text
                style={{
                  fontSize: theme.textStyles.body.fontSize,
                  color: theme.colors.primary,
                  fontWeight: '600',
                }}
              >
                Готово
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: theme.spacing[5] }}>
            {/* Upload photo button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.tints.sky,
                borderRadius: theme.borderRadius.card,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                padding: theme.spacing[4],
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing[2],
                marginBottom: theme.spacing[4],
                ...theme.shadows.card,
              }}
              onPress={handlePickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={theme.colors.ink} />
              ) : (
                <>
                  <Text style={{ fontSize: 24 }}>📷</Text>
                  <Text
                    style={{
                      fontSize: theme.textStyles.body.fontSize,
                      fontWeight: '700',
                      color: theme.colors.ink,
                    }}
                  >
                    Загрузить фото
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Avatar grid */}
            <Text
              style={{
                fontSize: theme.textStyles.caption.fontSize,
                fontWeight: '700',
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing[3],
                textTransform: 'uppercase',
              }}
            >
              Или выберите аватар
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.spacing[3],
              }}
            >
              {AVATARS.map((avatar) => {
                const isSelected = avatarKey === avatar.key && !avatarUrl;
                return (
                  <TouchableOpacity
                    key={avatar.key}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 35,
                      backgroundColor: isSelected ? theme.tints.mint : theme.colors.surface,
                      borderWidth: isSelected ? theme.borderWidth.thick : theme.borderWidth.regular,
                      borderColor: theme.colors.ink,
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...(isSelected ? theme.shadows.chip : {}),
                    }}
                    onPress={() => {
                      onSelect(avatar.key, undefined);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={{ fontSize: 36 }}>{avatar.emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

export function getAvatarEmoji(avatarKey: string): string {
  return AVATARS.find((a) => a.key === avatarKey)?.emoji ?? '👤';
}
