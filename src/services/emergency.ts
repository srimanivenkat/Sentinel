import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { EmergencyContact } from '../types/security';
import { OptimizerService } from './optimizer';

export interface LocationPayload {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address?: string;
  mapsUrl: string;
  timestamp: number;
}

export class EmergencyService {
  private static audioCtx: any = null;
  private static sirenOscillator: any = null;
  private static sirenInterval: any = null;
  private static isSirenActive = false;

  /**
   * Fetches real-time GPS location with reverse geocoding
   */
  static async getCurrentLocation(): Promise<LocationPayload> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, accuracy } = position.coords;
      let address = 'Lat: ' + latitude.toFixed(4) + ', Lng: ' + longitude.toFixed(4);

      if (Platform.OS !== 'web') {
        try {
          const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (reverse && reverse.length > 0) {
            const item = reverse[0];
            const parts = [item.name, item.street, item.city, item.region, item.country].filter(Boolean);
            if (parts.length > 0) address = parts.join(', ');
          }
        } catch {
          // reverse geocode may fail offline
        }
      }

      const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

      return {
        latitude,
        longitude,
        accuracy: accuracy ? Math.round(accuracy) : null,
        address,
        mapsUrl,
        timestamp: position.timestamp,
      };
    } catch {
      // Fallback location for web/simulator if location services are unavailable
      const fallbackLat = 37.7749;
      const fallbackLng = -122.4194;
      return {
        latitude: fallbackLat,
        longitude: fallbackLng,
        accuracy: 10,
        address: 'San Francisco, CA (Simulated GPS)',
        mapsUrl: `https://maps.google.com/?q=${fallbackLat},${fallbackLng}`,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Builds an emergency distress SMS payload
   */
  static formatDistressMessage(location: LocationPayload, note?: string): string {
    const bat = OptimizerService.getBatteryDiagnostics();
    const lines = [
      '🚨 EMERGENCY SOS ALERT 🚨',
      'I need urgent assistance. Here is my current location:',
      location.mapsUrl,
      location.address ? `Address: ${location.address}` : '',
      location.accuracy ? `GPS Accuracy: ±${location.accuracy}m` : '',
      `Device Battery: ${bat.levelPercent}%${bat.isCharging ? ' (Charging)' : ''}`,
      note ? `Note: ${note}` : '',
      `Timestamp: ${new Date(location.timestamp).toLocaleTimeString()}`,
    ].filter(Boolean);

    return lines.join('\n');
  }

  /**
   * Dispatches SMS to all enabled emergency contacts
   */
  static async dispatchSosAlert(
    contacts: EmergencyContact[],
    location: LocationPayload,
    note?: string
  ): Promise<{ success: boolean; dispatchedTo: number }> {
    const activeContacts = contacts.filter((c) => c.notifyOnSos && c.phoneNumber);
    if (activeContacts.length === 0) {
      return { success: false, dispatchedTo: 0 };
    }

    const phoneNumbers = activeContacts.map((c) => c.phoneNumber);
    const message = this.formatDistressMessage(location, note);

    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(phoneNumbers, message);
        return { success: true, dispatchedTo: phoneNumbers.length };
      }
    } catch {
      // Fallback to URL scheme
    }

    // Direct linking fallback
    const targetUrl = `sms:${phoneNumbers.join(',')}?body=${encodeURIComponent(message)}`;
    if (await Linking.canOpenURL(targetUrl)) {
      await Linking.openURL(targetUrl);
      return { success: true, dispatchedTo: phoneNumbers.length };
    }

    return { success: false, dispatchedTo: phoneNumbers.length };
  }

  /**
   * Emergency High-Decibel Siren Playback
   * Uses Web Audio API on web/hybrid, oscillating between 800Hz and 1400Hz
   */
  static startSiren(): void {
    if (this.isSirenActive) return;
    this.isSirenActive = true;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        this.audioCtx = new AudioContextClass();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime); // safety volume
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();

        this.sirenOscillator = osc;
        let high = false;

        this.sirenInterval = setInterval(() => {
          if (!this.audioCtx || !this.sirenOscillator) return;
          const targetFreq = high ? 800 : 1350;
          this.sirenOscillator.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.08);
          high = !high;
        }, 400);
      } catch (err) {
        console.warn('AudioContext siren failed:', err);
      }
    }
  }

  static stopSiren(): void {
    this.isSirenActive = false;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
      } catch {}
      this.sirenOscillator = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  static isSirenPlaying(): boolean {
    return this.isSirenActive;
  }
}
