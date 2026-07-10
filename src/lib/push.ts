import { supabase } from './supabase';
import { getPushToken, onPushMessage, isPushSupported } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BCFuwhVkBRN_fvbBq-USbzs4GJ2i59TmNrAlcLGqavXPkFtU256LeMsC4QWlK2J8MdWjL6BvBygqLu_BVVAjky4';

let lastPushError: string | null = null;

export function getLastPushError(): string | null {
  return lastPushError;
}

export async function isNotificationSupported(): Promise<boolean> {
  return await isPushSupported();
}

export async function subscribeToPush(userId: string): Promise<{ success: boolean; error?: string }> {
  lastPushError = null;

  if (!VAPID_KEY) {
    const error = 'Push notifications are not configured. Please contact support.';
    lastPushError = error;
    console.warn(error);
    return { success: false, error };
  }

  const result = await getPushToken(VAPID_KEY);

  if (!result.token) {
    const error = result.error || 'Failed to get push token';
    lastPushError = error;
    return { success: false, error };
  }

  // Delete ALL existing tokens for this user, then insert the fresh one.
  // This prevents accumulation of stale tokens across browser sessions.
  await supabase.from('push_subscriptions').delete().eq('user_id', userId);

  const { error: dbError } = await supabase
    .from('push_subscriptions')
    .insert({ user_id: userId, fcm_token: result.token, device_type: 'web' });

  if (dbError) {
    console.error('Failed to save push subscription:', dbError.message);
    lastPushError = 'Failed to save subscription to database';
    return { success: false, error: 'Failed to save subscription' };
  }

  return { success: true };
}

export async function unsubscribeFromPush(userId: string): Promise<{ success: boolean; error?: string }> {
  lastPushError = null;

  if (!VAPID_KEY) {
    return { success: false, error: 'Push notifications are not configured' };
  }

  const result = await getPushToken(VAPID_KEY);

  if (!result.token) {
    // If we can't get the token, try to delete all subscriptions for this user
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (dbError) {
      console.error('Failed to remove push subscription:', dbError.message);
      return { success: false, error: 'Failed to remove subscription' };
    }
    return { success: true };
  }

  const { error: dbError } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('fcm_token', result.token);

  if (dbError) {
    console.error('Failed to remove push subscription:', dbError.message);
    return { success: false, error: 'Failed to remove subscription' };
  }

  return { success: true };
}

export async function listenForForegroundPush(callback: (payload: any) => void): Promise<void> {
  await onPushMessage(callback);
}
