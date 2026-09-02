import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Native push notifications for the Capacitor Android/iOS app (TASK-mobile).
 * A separate system from PushNotificationService's Web Push (VAPID) flow, which
 * doesn't work reliably inside an embedded native WebView. This only prompts for
 * OS-level permission and attempts registration; actually delivering a push from
 * the backend needs a Firebase project configured (google-services.json in
 * android/, a server key for the backend), which hasn't been set up yet, so
 * registration is expected to fail gracefully until that exists. Requesting
 * permission and getting a token are still worth doing now so a user who already
 * granted it doesn't have to be asked again once sending is wired up.
 */
@Injectable({
  providedIn: 'root'
})
export class NativePushService {
  /** Requests OS notification permission and attempts FCM/APNs registration. Safe to call even without a Firebase project configured yet: registration failure is caught and logged, never thrown at the caller. */
  async requestPermissionAndRegister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const current = await PushNotifications.checkPermissions();
      let status = current.receive;

      if (status === 'prompt' || status === 'prompt-with-rationale') {
        const requested = await PushNotifications.requestPermissions();
        status = requested.receive;
      }

      if (status !== 'granted') {
        return;
      }

      await PushNotifications.addListener('registration', (token) => {
        // Not yet sent anywhere: there's no backend endpoint for a native
        // FCM/APNs token, only Web Push's VAPID subscriptions. Logged so the
        // registration path is verifiable end to end before that's built.
        console.log('[NativePushService] Registered for push, token:', token.value);
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.warn('[NativePushService] Registration error', error);
      });

      await PushNotifications.register();
    } catch (error) {
      // Most likely cause right now: no google-services.json / Firebase project
      // configured yet. Logged rather than surfaced to the user, since this is
      // a background best-effort registration, not a user-initiated action.
      console.warn('[NativePushService] Push registration did not complete', error);
    }
  }
}
