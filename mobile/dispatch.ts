import { AppState, Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import {
  deleteToken,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';

export const DISPATCH_ID = 'morning-dispatch';
export const DISPATCH_CHANNEL = 'morning-dispatch';
export const DISPATCH_TITLE = 'Chronicle Cryptogram';
export const DISPATCH_BODY =
  "New Dispatch: Solved ciphers won't catch the culprit. Today's case file is ready.";

function messaging() {
  return getMessaging();
}

export async function ensureDispatchChannel() {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: DISPATCH_CHANNEL,
    name: 'Morning Dispatch',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function cancelLocalDispatch() {
  await notifee.cancelTriggerNotification(DISPATCH_ID);
}

export async function showSubscribeNotice() {
  await ensureDispatchChannel();
  await notifee.displayNotification({
    id: `${DISPATCH_ID}-welcome`,
    title: DISPATCH_TITLE,
    body: 'You are on the delivery list. We will ring when a new edition is on the stands.',
    android: {
      channelId: DISPATCH_CHANNEL,
      tag: `${DISPATCH_ID}-welcome`,
      timeoutAfter: 8000,
      pressAction: { id: 'default' },
    },
  });
}

export async function hasDispatchPermission() {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus >= 1;
}

export async function requestDispatchPermission() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

export async function registerDispatchToken() {
  const instance = messaging();
  if (Platform.OS === 'ios') {
    await registerDeviceForRemoteMessages(instance);
  }
  return getToken(instance);
}

export async function stopDispatchToken() {
  try {
    await deleteToken(messaging());
  } catch {
    return;
  }
}

export async function handleRemoteDispatch(message: { data?: { [key: string]: string } }) {
  const data = message.data;
  if (!data || data.type !== DISPATCH_ID) return;
  await ensureDispatchChannel();
  await notifee.displayNotification({
    id: DISPATCH_ID,
    title: data.title || DISPATCH_TITLE,
    body: data.body || DISPATCH_BODY,
    android: {
      channelId: DISPATCH_CHANNEL,
      tag: DISPATCH_ID,
      pressAction: { id: 'default' },
    },
  });
}

export function listenForegroundDispatch() {
  return onMessage(messaging(), handleRemoteDispatch);
}

export function listenTokenRefresh(onToken: (token: string) => void) {
  return onTokenRefresh(messaging(), onToken);
}

export function listenAppActive(onActive: () => void) {
  return AppState.addEventListener('change', (state) => {
    if (state === 'active') onActive();
  });
}
