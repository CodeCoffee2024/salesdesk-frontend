import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Native push notifications for the Capacitor Android/iOS app (TASK-mobile).
 * A separate system from PushNotificationService's Web Push (VAPID) flow, which
 * doesn't work reliably inside an embedded native WebView.
 *
 * IMPORTANT: this only requests the OS-level notification permission right now.
 * It deliberately does NOT call PushNotifications.register() — that calls into
 * Firebase Cloud Messaging natively, and android/app/build.gradle only applies
 * the google-services Gradle plugin when a google-services.json is present
 * (it isn't yet, no Firebase project has been created). Without that plugin,
 * FirebaseApp is never initialized, and FCM's registration call throws an
 * uncaught native IllegalStateException that crashes the whole app — not a JS
 * error, so no try/catch here can stop it. This was confirmed the hard way: a
 * user who granted the permission got an immediate crash, then a crash loop on
 * every relaunch, because a granted permission makes requestPermissionAndRegister
 * (called on every login) retry registration right away. Re-enable the
 * register() call, its 'registration'/'registrationError' listeners, and a
 * backend endpoint to store the token, only once a real Firebase project and
 * google-services.json exist.
 */
@Injectable({
  providedIn: 'root'
})
export class NativePushService {
  /** Requests OS notification permission only. Does not touch FCM — see the class comment above for why. */
  async requestPermissionAndRegister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const current = await PushNotifications.checkPermissions();

      if (current.receive === 'prompt' || current.receive === 'prompt-with-rationale') {
        await PushNotifications.requestPermissions();
      }
    } catch (error) {
      console.warn('[NativePushService] Permission request did not complete', error);
    }
  }
}
