import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../../ui/theme-provider';

const PIN_STORAGE_KEY = 'parent_pin';

interface ParentalGateModalProps {
  visible: boolean;
  onSuccess: () => void;
  onDismiss: () => void;
}

export function ParentalGateModal({ visible, onSuccess, onDismiss }: ParentalGateModalProps) {
  const theme = useTheme();

  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [storedPin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadPin();
      setInput('');
      setError(false);
      setConfirmPin('');
      setStep('enter');
    }
  }, [visible]);

  const loadPin = async () => {
    try {
      const pin = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
      setStoredPin(pin);
      setIsSettingUp(!pin);
    } catch {
      setIsSettingUp(true);
    }
  };

  const savePin = async (pin: string) => {
    try {
      await SecureStore.setItemAsync(PIN_STORAGE_KEY, pin);
      setStoredPin(pin);
    } catch (e) {
      console.error('Failed to save PIN:', e);
    }
  };

  const handleKeyPress = (key: string) => {
    if (input.length < 6) {
      const newInput = input + key;
      setInput(newInput);
      setError(false);

      if (newInput.length === 6) {
        setTimeout(() => handleSubmit(newInput), 100);
      }
    }
  };

  const handleBackspace = () => {
    setInput(input.slice(0, -1));
    setError(false);
  };

  const handleSubmit = async (pinToCheck?: string) => {
    const pin = pinToCheck ?? input;
    if (pin.length !== 6) return;

    if (isSettingUp) {
      if (step === 'enter') {
        setConfirmPin(pin);
        setInput('');
        setStep('confirm');
      } else {
        if (pin === confirmPin) {
          await savePin(pin);
          onSuccess();
        } else {
          setError(true);
          setInput('');
          setStep('enter');
          setConfirmPin('');
        }
      }
    } else {
      if (pin === storedPin) {
        onSuccess();
      } else {
        setError(true);
        setInput('');
      }
    }
  };

  const getTitle = () => {
    if (isSettingUp) {
      return step === 'enter' ? 'Создайте PIN-код' : 'Повторите PIN-код';
    }
    return 'Введите PIN-код';
  };

  const getSubtitle = () => {
    if (isSettingUp) {
      return step === 'enter'
        ? 'Этот код понадобится для выхода из детского режима'
        : 'Введите PIN ещё раз для подтверждения';
    }
    return 'Только для родителей';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.tints.violet }}>
        <View style={{ flex: 1, padding: theme.spacing[5] }}>
          {/* Back button - only show if not setting up */}
          {!isSettingUp && (
            <TouchableOpacity
              onPress={onDismiss}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.colors.surface,
                borderWidth: 2,
                borderColor: theme.colors.ink,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing[6],
              }}
            >
              <Text style={{ fontSize: 20, color: theme.colors.ink }}>✕</Text>
            </TouchableOpacity>
          )}

          {/* Title */}
          <View style={{ alignItems: 'center', marginTop: isSettingUp ? 60 : 0 }}>
            <Text style={{
              fontSize: 28,
              fontWeight: '900',
              color: theme.colors.ink,
              marginBottom: theme.spacing[2],
              textAlign: 'center',
            }}>
              {getTitle()}
            </Text>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
              opacity: 0.7,
              textAlign: 'center',
              marginBottom: theme.spacing[6],
            }}>
              {getSubtitle()}
            </Text>

            {/* PIN dots */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: theme.spacing[4],
            }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: input.length > i ? theme.colors.ink : 'transparent',
                    borderWidth: 2,
                    borderColor: theme.colors.ink,
                  }}
                />
              ))}
            </View>

            {/* Error message */}
            {error && (
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.error,
                fontWeight: '600',
                marginBottom: theme.spacing[4],
              }}>
                {isSettingUp ? 'PIN-коды не совпадают' : 'Неверный PIN-код'}
              </Text>
            )}
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Keypad */}
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: 2,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
          }}>
            {/* Row 1 */}
            <View style={{ flexDirection: 'row', marginBottom: theme.spacing[3] }}>
              {['1', '2', '3'].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => handleKeyPress(num)}
                  style={{
                    flex: 1,
                    height: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 4,
                    backgroundColor: theme.colors.background,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.ink,
                  }}
                >
                  <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.ink }}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 2 */}
            <View style={{ flexDirection: 'row', marginBottom: theme.spacing[3] }}>
              {['4', '5', '6'].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => handleKeyPress(num)}
                  style={{
                    flex: 1,
                    height: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 4,
                    backgroundColor: theme.colors.background,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.ink,
                  }}
                >
                  <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.ink }}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 3 */}
            <View style={{ flexDirection: 'row', marginBottom: theme.spacing[3] }}>
              {['7', '8', '9'].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => handleKeyPress(num)}
                  style={{
                    flex: 1,
                    height: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 4,
                    backgroundColor: theme.colors.background,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.ink,
                  }}
                >
                  <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.ink }}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 4 */}
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginHorizontal: 4 }} />
              <TouchableOpacity
                onPress={() => handleKeyPress('0')}
                style={{
                  flex: 1,
                  height: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: 4,
                  backgroundColor: theme.colors.background,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.ink,
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.ink }}>
                  0
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBackspace}
                style={{
                  flex: 1,
                  height: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: 4,
                }}
              >
                <Text style={{ fontSize: 24, color: theme.colors.ink }}>⌫</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
