import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/ui/theme-provider';
import {
  calculateMissionXp,
  MULTIPLICATION_TYPE_ID,
  ENGLISH_WORD_MATCH_ID,
  ENGLISH_SPELL_IT_ID,
  ENGLISH_LISTEN_MATCH_ID,
} from '@saya/core';
import type {
  MissionCard,
  MultiplicationPayload,
  WordMatchPayload,
  SpellItPayload,
  ListenMatchPayload,
  IdentifyPiecePayload,
  MovementPayload,
  CapturePayload,
  MateInOnePayload,
  PuzzlePayload,
} from '@saya/core';
import { useMissionQuery, useSubmitAttempts } from '../../../../src/features/learning/hooks/use-mission';
import { useLearningStore } from '../../../../src/features/learning/stores/learning-store';
import { ExerciseCard } from '../../../../src/features/learning/components/exercise-card';
import { WordMatchCard } from '../../../../src/features/learning/components/word-match-card';
import { SpellItCard } from '../../../../src/features/learning/components/spell-it-card';
import { ListenMatchCard } from '../../../../src/features/learning/components/listen-match-card';
import { ComboBadge } from '../../../../src/features/learning/components/combo-badge';
import { MissionProgress } from '../../../../src/features/learning/components/mission-progress';
import { MissionComplete } from '../../../../src/features/learning/components/mission-complete';
import {
  IdentifyCard,
  MovementCard,
  CaptureCard,
  PuzzleCard,
} from '../../../../src/features/learning/components/chess';

type GameMode = 'basic' | 'timed' | 'cumulative';

function CardDispatcher({
  card,
  onAnswer,
}: {
  card: MissionCard;
  onAnswer: (answer: string, correct: boolean, responseMs: number) => void;
}) {
  const { exerciseTypeId, payload } = card;

  if (!payload) return null;

  if (exerciseTypeId === MULTIPLICATION_TYPE_ID) {
    return (
      <ExerciseCard
        payload={payload as unknown as MultiplicationPayload}
        onAnswer={onAnswer}
      />
    );
  }

  if (exerciseTypeId === ENGLISH_WORD_MATCH_ID) {
    return (
      <WordMatchCard
        payload={payload as unknown as WordMatchPayload}
        onAnswer={onAnswer}
      />
    );
  }

  if (exerciseTypeId === ENGLISH_SPELL_IT_ID) {
    return (
      <SpellItCard
        payload={payload as unknown as SpellItPayload}
        onAnswer={onAnswer}
      />
    );
  }

  if (exerciseTypeId === ENGLISH_LISTEN_MATCH_ID) {
    return (
      <ListenMatchCard
        payload={payload as unknown as ListenMatchPayload}
        onAnswer={onAnswer}
      />
    );
  }

  if (exerciseTypeId === 'chess.identify') {
    return (
      <IdentifyCard
        payload={payload as unknown as IdentifyPiecePayload}
        onAnswer={onAnswer}
      />
    );
  }

  if (exerciseTypeId === 'chess.movement') {
    return (
      <MovementCard
        payload={payload as unknown as MovementPayload}
        onAnswer={onAnswer}
      />
    );
  }

  if (exerciseTypeId === 'chess.capture') {
    return (
      <CaptureCard
        payload={payload as unknown as CapturePayload}
        onAnswer={onAnswer}
      />
    );
  }

  if (exerciseTypeId === 'chess.mate1') {
    return (
      <PuzzleCard
        payload={payload as unknown as MateInOnePayload}
        onAnswer={onAnswer}
        isMateInOne={true}
      />
    );
  }

  if (exerciseTypeId === 'chess.puzzle') {
    return (
      <PuzzleCard
        payload={payload as unknown as PuzzlePayload}
        onAnswer={onAnswer}
      />
    );
  }

  return null;
}

function TimerDisplay({ seconds, errors, theme }: { seconds: number; errors: number; theme: ReturnType<typeof useTheme> }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[3],
    }}>
      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: theme.borderWidth.regular,
        borderColor: theme.colors.ink,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
      }}>
        <Text style={{ fontSize: 20 }}>⏱️</Text>
        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.ink, fontVariant: ['tabular-nums'] }}>
          {mins}:{secs.toString().padStart(2, '0')}
        </Text>
      </View>
      <View style={{
        backgroundColor: errors > 0 ? theme.colors.error : theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: theme.borderWidth.regular,
        borderColor: theme.colors.ink,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
      }}>
        <Text style={{ fontSize: 20 }}>❌</Text>
        <Text style={{
          fontSize: 24,
          fontWeight: '900',
          color: errors > 0 ? theme.colors.onFill : theme.colors.ink,
        }}>
          {errors}
        </Text>
      </View>
    </View>
  );
}

function ModeLabel({ mode, number, theme }: { mode: GameMode; number?: number; theme: ReturnType<typeof useTheme> }) {
  const labels: Record<GameMode, { icon: string; text: string }> = {
    basic: { icon: '📝', text: `Учим ×${number ?? ''}` },
    timed: { icon: '⏱️', text: `На время ×${number ?? ''}` },
    cumulative: { icon: '🎯', text: `Микс ×1-${number ?? ''}` },
  };

  const { icon, text } = labels[mode] ?? labels.basic;

  return (
    <View style={{
      alignSelf: 'center',
      backgroundColor: theme.tints.sun,
      borderRadius: theme.borderRadius.full,
      borderWidth: theme.borderWidth.regular,
      borderColor: theme.colors.ink,
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[2],
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
      marginBottom: theme.spacing[3],
    }}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.ink }}>{text}</Text>
    </View>
  );
}

export default function MissionScreen() {
  const { subject, skillCode, mode: modeParam, number: numberParam } = useLocalSearchParams<{
    subject: string;
    skillCode?: string;
    mode?: string;
    number?: string;
  }>();
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  const mode = (modeParam as GameMode) || 'basic';
  const number = numberParam ? parseInt(numberParam, 10) : undefined;

  const getQueryCode = () => {
    if (mode === 'cumulative' && number) {
      return `math.mul.cumulative.${number}`;
    }
    if (mode === 'timed' && skillCode) {
      return skillCode.replace('.timed', '');
    }
    return skillCode ?? subject ?? 'math.mul';
  };

  const {
    missionCards,
    currentIndex,
    attempts,
    comboStreak,
    missionResult,
    submitAnswer,
    nextCard,
    finishMission,
    resetMission,
  } = useLearningStore();

  const missionQuery = useMissionQuery(getQueryCode(), mode, number);
  const submitAttempts = useSubmitAttempts();
  const hasSubmitted = useRef(false);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentCard = missionCards[currentIndex];
  const isDone = currentIndex >= missionCards.length && missionCards.length > 0;

  useEffect(() => {
    if (mode === 'timed' && missionCards.length > 0 && !missionResult) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode, missionCards.length, missionResult]);

  useEffect(() => {
    if (missionResult && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [missionResult]);

  useEffect(() => {
    if (!isDone || missionResult || hasSubmitted.current) return;
    hasSubmitted.current = true;

    const attemptData = attempts.map((a, i) => ({
      clientId: `${Date.now()}-${i}`,
      skillCode: skillCode ?? a.card.skillCode,
      correct: a.correct ?? false,
      difficulty: a.card.difficulty,
      responseMs: Date.now() - a.startedAt,
      hintsUsed: a.correct ? 0 : 1,
      selfCorrected: a.selfCorrected,
    }));

    const result = calculateMissionXp(
      attemptData.map((a) => ({
        correct: a.correct,
        difficulty: a.difficulty,
        responseMs: a.responseMs,
        selfCorrected: a.selfCorrected,
      })),
    );

    const enhancedResult = {
      ...result,
      timerSeconds: mode === 'timed' ? timerSeconds : undefined,
      errorCount: mode === 'timed' ? errorCount : undefined,
    };

    finishMission(enhancedResult);
    void submitAttempts.mutateAsync(attemptData);
  }, [isDone, missionResult]);

  const handleAnswer = useCallback(
    (answer: string, correct: boolean, responseMs: number) => {
      if (!correct && mode === 'timed') {
        setErrorCount((c) => c + 1);
      }
      submitAnswer(answer, correct, responseMs);
      setTimeout(() => nextCard(), 100);
    },
    [submitAnswer, nextCard, mode],
  );

  const handlePlayAgain = () => {
    hasSubmitted.current = false;
    setTimerSeconds(0);
    setErrorCount(0);
    resetMission();
    missionQuery.refetch();
  };

  const handleExit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    resetMission();
    router.back();
  };

  if (missionQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ fontSize: theme.textStyles.body.fontSize, color: theme.colors.textSecondary }}>
          {t('common.loading')} ⏳
        </Text>
      </View>
    );
  }

  if (missionQuery.isError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: theme.colors.background }}>
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={{ fontSize: theme.textStyles.body.fontSize, color: theme.colors.error }}>
          {t('common.error')}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.button,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            paddingHorizontal: theme.spacing[6],
            paddingVertical: theme.spacing[3],
            ...theme.shadows.button,
          }}
          onPress={() => missionQuery.refetch()}
        >
          <Text style={{ fontSize: theme.textStyles.body.fontSize, color: theme.colors.onFill, fontWeight: '700' }}>
            {t('common.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const xpPreview = missionQuery.data?.estimatedXp ?? 0;
  const answered = attempts.filter((a) => a.correct !== null).length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[5],
        paddingTop: 60,
        paddingBottom: theme.spacing[4],
      }}>
        <TouchableOpacity
          onPress={handleExit}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.disabled,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, color: theme.colors.ink, fontWeight: '700' }}>✕</Text>
        </TouchableOpacity>
        <MissionProgress
          current={answered}
          total={missionCards.length}
          xpPreview={xpPreview}
          comboStreak={comboStreak}
        />
      </View>

      <View style={{
        flex: 1,
        paddingHorizontal: theme.spacing[6],
        justifyContent: 'center',
        gap: theme.spacing[3],
      }}>
        {number && <ModeLabel mode={mode} number={number} theme={theme} />}

        {mode === 'timed' && !missionResult && (
          <TimerDisplay seconds={timerSeconds} errors={errorCount} theme={theme} />
        )}

        <ComboBadge streak={comboStreak} />

        {currentCard && !missionResult && (
          <CardDispatcher card={currentCard} onAnswer={handleAnswer} />
        )}

        {!currentCard && !missionResult && missionCards.length === 0 && !missionQuery.isLoading && (
          <View style={{ alignItems: 'center', gap: theme.spacing[4] }}>
            <Text style={{ fontSize: 48 }}>📚</Text>
            <Text style={{ fontSize: theme.textStyles.body.fontSize, color: theme.colors.textSecondary, textAlign: 'center' }}>
              Упражнения не найдены
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.button,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                paddingHorizontal: theme.spacing[6],
                paddingVertical: theme.spacing[3],
              }}
              onPress={handleExit}
            >
              <Text style={{ fontSize: theme.textStyles.body.fontSize, color: theme.colors.onFill, fontWeight: '700' }}>
                {t('common.back')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!currentCard && !missionResult && (missionCards.length > 0 || missionQuery.isLoading) && (
          <ActivityIndicator color={theme.colors.primary} />
        )}
      </View>

      {missionResult && (
        <MissionComplete
          result={missionResult}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
          timerSeconds={mode === 'timed' ? timerSeconds : undefined}
          errorCount={mode === 'timed' ? errorCount : undefined}
        />
      )}
    </KeyboardAvoidingView>
  );
}
