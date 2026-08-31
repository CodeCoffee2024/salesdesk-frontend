import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/push`;

/** VAPID public keys are base64url — the Push API wants them as a raw byte array. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Web Push subscribe/unsubscribe flow (TASK-027) — lets a workspace user opt into
 * native notifications when a client views, signs, or requests changes on one of
 * their documents. `isSupported` gates every entry point in the UI, since Web
 * Push has real browser-support gaps (notably no support at all in Safari
 * outside an installed-to-home-screen PWA on iOS 16.4+).
 */
@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  constructor(private readonly http: HttpClient) {}

  get isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    return !!subscription;
  }

  async subscribe(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    const vapidPublicKey = await firstValueFrom(this.http.get(`${BASE_URL}/vapid-public-key`, { responseType: 'text' }));
    if (!vapidPublicKey) {
      // No VAPID keypair configured server-side yet — nothing to subscribe to.
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    const json = subscription.toJSON();
    await firstValueFrom(
      this.http.post(`${BASE_URL}/subscriptions`, {
        endpoint: json.endpoint,
        p256dhKey: json.keys?.['p256dh'],
        authKey: json.keys?.['auth']
      })
    );

    return true;
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSupported) {
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) {
      return;
    }

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await firstValueFrom(this.http.delete(`${BASE_URL}/subscriptions`, { body: { endpoint } }));
  }
}
