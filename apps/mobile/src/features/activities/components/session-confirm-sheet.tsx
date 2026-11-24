import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SessionRow, ActivityRow } from '../hooks/use-activities';

interface Props {
  session: SessionRow | null;
  onConfirm: (status: 'done' | 'missed') => void;
  onDismiss: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function SessionConfirmSheet({ session, onConfirm, onDismiss }: Props) {
  const { t } = useTranslation();
  const activity = session?.activity as ActivityRow | undefined;

  return (
    <Modal
      visible={!!session}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />

      <View style={styles.sheet}>
        {session && activity && (
          <>
            <View style={[styles.colorBar, { backgroundColor: activity.color }]} />

            <View style={styles.content}>
              <Text style={styles.title} accessibilityRole="header">
                {t('activities.confirmQuestion')}
              </Text>
              <Text style={styles.activityName}>{activity.title}</Text>
              <Text style={styles.time}>
                {formatDate(session.starts_at)} · {formatTime(session.starts_at)}–{formatTime(session.ends_at)}
              </Text>

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnDone]}
                  onPress={() => onConfirm('done')}
                  accessibilityRole="button"
                  accessibilityLabel={t('activities.confirmDone')}
                >
                  <Text style={styles.btnIcon}>✓</Text>
                  <Text style={styles.btnText}>{t('activities.confirmDone')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnMissed]}
                  onPress={() => onConfirm('missed')}
                  accessibilityRole="button"
                  accessibilityLabel={t('activities.confirmMissed')}
                >
                  <Text style={styles.btnIcon}>✕</Text>
                  <Text style={styles.btnText}>{t('activities.confirmMissed')}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  colorBar: { height: 6 },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  time: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  btnDone: { backgroundColor: '#D1FAE5', borderWidth: 2, borderColor: '#10B981' },
  btnMissed: { backgroundColor: '#FEE2E2', borderWidth: 2, borderColor: '#EF4444' },
  btnIcon: { fontSize: 18, fontWeight: '800' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  dismissBtn: { alignItems: 'center', marginTop: 8 },
  dismissText: { fontSize: 15, color: '#9CA3AF' },
});
