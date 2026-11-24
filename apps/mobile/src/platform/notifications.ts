import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const QUIET_HOUR_START = 22;
const QUIET_HOUR_END = 8;

function isQuietHour(date: Date): boolean {
  const h = date.getHours();
  return h >= QUIET_HOUR_START || h < QUIET_HOUR_END;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleConfirmNotification(params: {
  activityId: string;
  title: string;
  body: string;
  fireAt: Date;
}): Promise<string | null> {
  if (isQuietHour(params.fireAt)) return null;
  if (params.fireAt <= new Date()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: { activityId: params.activityId, type: 'session_confirm' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: params.fireAt,
    },
  });
  return id;
}

export async function cancelNotifications(identifiers: string[]): Promise<void> {
  await Promise.all(
    identifiers.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
