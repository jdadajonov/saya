import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/ui/theme-provider';
import { BotGame } from '../../../../src/features/learning/components/chess';
import type { GameResult, GameEndReason, AgeBand } from '@saya/core';

const LEVELS = [1, 2, 3, 4, 5];

export default function ChessBotScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<{ result: GameResult; reason: GameEndReason } | null>(null);
  const ageBand: AgeBand = '7-9';

  const handleGameEnd = useCallback((result: GameResult, reason: GameEndReason) => {
    setGameResult({ result, reason });
  }, []);

  const handlePlayAgain = () => {
    setGameResult(null);
  };

  const handleExit = () => {
    setSelectedLevel(null);
    setGameResult(null);
  };

  const handleBack = () => {
    if (selectedLevel !== null) {
      handleExit();
    } else {
      router.back();
    }
  };

  if (selectedLevel === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
          >
            <Text style={{ fontSize: 24, color: theme.colors.ink, fontWeight: '600' }}>‹</Text>
          </TouchableOpacity>
          <Text style={{
            fontSize: theme.textStyles.heading.fontSize,
            fontWeight: '900',
            color: theme.colors.ink,
          }}>
            {t('learning.chess.playVsBot')} {'\u{1F916}'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={{
          flex: 1,
          paddingHorizontal: theme.spacing[5],
          paddingTop: theme.spacing[6],
        }}>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: theme.spacing[6],
          }}>
            {t('learning.chess.game.level', { level: '' }).replace('{{level}}', '').trim()}
          </Text>

          <View style={{ gap: theme.spacing[3] }}>
            {LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setSelectedLevel(level)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.card,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  padding: theme.spacing[4],
                  ...theme.shadows.card,
                }}
              >
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: theme.colors.masteryBadge,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: theme.spacing[4],
                }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '900',
                    color: theme.colors.ink,
                  }}>
                    {level}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: theme.colors.ink,
                  }}>
                    {t('learning.chess.game.level', { level })}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: theme.colors.textSecondary,
                    marginTop: 4,
                  }}>
                    {level === 1 ? 'Easy' : level <= 3 ? 'Medium' : 'Hard'}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 24,
                  color: theme.colors.ink,
                  fontWeight: '300',
                }}>{'›'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[5],
        paddingTop: 60,
      }}>
        <TouchableOpacity
          onPress={handleBack}
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
          <Text style={{ fontSize: 24, color: theme.colors.ink, fontWeight: '600' }}>{'‹'}</Text>
        </TouchableOpacity>
      </View>

      {gameResult ? (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.spacing[6],
          gap: theme.spacing[4],
        }}>
          <Text style={{ fontSize: 64 }}>
            {gameResult.result === 'draw' ? '\u{1F91D}' :
             (gameResult.result === 'white_wins') ? '\u{1F3C6}' : '\u{1F614}'}
          </Text>
          <Text style={{
            fontSize: theme.textStyles.title.fontSize,
            fontWeight: '900',
            color: theme.colors.ink,
            textAlign: 'center',
          }}>
            {gameResult.result === 'draw'
              ? t('learning.chess.game.draw')
              : gameResult.result === 'white_wins'
              ? t('learning.chess.game.youWin')
              : t('learning.chess.game.youLose')}
          </Text>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.textSecondary,
          }}>
            {t(`learning.chess.game.reason.${gameResult.reason}`)}
          </Text>

          <View style={{ gap: theme.spacing[3], width: '100%', marginTop: theme.spacing[4] }}>
            <TouchableOpacity
              onPress={handlePlayAgain}
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.button,
                borderWidth: theme.borderWidth.thick,
                borderColor: theme.colors.ink,
                paddingVertical: theme.spacing[4],
                alignItems: 'center',
                ...theme.shadows.button,
              }}
            >
              <Text style={{
                fontSize: theme.textStyles.heading.fontSize,
                fontWeight: '900',
                color: theme.colors.onFill,
              }}>
                {t('learning.chess.game.playAgain')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleExit}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.button,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                paddingVertical: theme.spacing[3],
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '600',
                color: theme.colors.ink,
              }}>
                {t('common.back')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <BotGame
          ageBand={ageBand}
          level={selectedLevel}
          playerColor="w"
          onGameEnd={handleGameEnd}
        />
      )}
    </View>
  );
}
