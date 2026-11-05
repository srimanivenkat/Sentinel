import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  timestamp: number;
}

export type SensorCallback = (data: AccelerometerData) => void;
export type AlarmCallback = (reason: string, data: AccelerometerData) => void;

export class SensorService {
  private static subscription: any = null;
  private static listeners: Set<SensorCallback> = new Set();
  private static baselineMagnitude: number | null = null;
  private static isTripwireArmed = false;
  private static tripwireAlarmCallback: AlarmCallback | null = null;
  private static tripwireSensitivity = 0.35; // Delta threshold in g

  // Shake detection state
  private static shakeHistory: { time: number; val: number }[] = [];
  private static shakeCallback: (() => void) | null = null;
  private static shakeThreshold = 2.2; // g
  private static lastShakeTrigger = 0;

  /**
   * Initializes Accelerometer sampling (approx 20Hz / 50ms)
   */
  static startListening(): void {
    if (this.subscription) return;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        const handleMotion = (event: DeviceMotionEvent) => {
          const acc = event.accelerationIncludingGravity || event.acceleration;
          if (acc) {
            const x = (acc.x || 0) / 9.81;
            const y = (acc.y || 0) / 9.81;
            const z = (acc.z || 9.81) / 9.81;
            const magnitude = Math.sqrt(x * x + y * y + z * z);
            this.processTelemetry({
              x,
              y,
              z,
              magnitude,
              timestamp: Date.now(),
            });
          }
        };
        try {
          window.addEventListener('devicemotion', handleMotion);
          this.subscription = {
            remove: () => window.removeEventListener('devicemotion', handleMotion),
          };
        } catch {}
      }
      return;
    }

    try {
      Accelerometer.setUpdateInterval(50);
      this.subscription = Accelerometer.addListener((data) => {
        const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
        const telemetry: AccelerometerData = {
          x: data.x,
          y: data.y,
          z: data.z,
          magnitude,
          timestamp: Date.now(),
        };

        this.processTelemetry(telemetry);
      });
    } catch (err) {
      // Accelerometer not available
    }
  }

  static stopListening(): void {
    if (this.subscription) {
      try {
        this.subscription.remove();
      } catch {}
      this.subscription = null;
    }
  }

  /**
   * Subscribes a UI component to live sensor readings
   */
  static subscribe(callback: SensorCallback): () => void {
    this.listeners.add(callback);
    this.startListening();
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && !this.isTripwireArmed) {
        this.stopListening();
      }
    };
  }

  /**
   * Processes each incoming sensor frame
   */
  private static processTelemetry(data: AccelerometerData): void {
    // Notify all UI listeners
    for (const listener of this.listeners) {
      listener(data);
    }

    // 1. Process Tripwire Alarm (Haven-style perimeter sentry)
    if (this.isTripwireArmed) {
      if (this.baselineMagnitude === null) {
        this.baselineMagnitude = data.magnitude;
      } else {
        const delta = Math.abs(data.magnitude - this.baselineMagnitude);
        if (delta > this.tripwireSensitivity) {
          if (this.tripwireAlarmCallback) {
            this.tripwireAlarmCallback(
              `Physical device movement detected! Delta: ${delta.toFixed(2)}g exceeds threshold ${this.tripwireSensitivity}g`,
              data
            );
          }
        }
      }
    }

    // 2. Process Shake-to-SOS
    if (this.shakeCallback) {
      const now = Date.now();
      if (data.magnitude > this.shakeThreshold) {
        this.shakeHistory.push({ time: now, val: data.magnitude });
        // Clean history older than 1.5 seconds
        this.shakeHistory = this.shakeHistory.filter((item) => now - item.time < 1500);

        // Require at least 3 distinct spikes within 1.5 seconds
        if (this.shakeHistory.length >= 3 && now - this.lastShakeTrigger > 4000) {
          this.lastShakeTrigger = now;
          this.shakeHistory = [];
          this.shakeCallback();
        }
      }
    }
  }

  /**
   * Arms the physical tripwire alarm
   */
  static armTripwire(
    callback: AlarmCallback,
    options: { sensitivityG?: number } = {}
  ): void {
    this.isTripwireArmed = true;
    this.baselineMagnitude = null; // Will calibrate on first frame
    this.tripwireAlarmCallback = callback;
    if (options.sensitivityG) {
      this.tripwireSensitivity = options.sensitivityG;
    }
    this.startListening();
  }

  static disarmTripwire(): void {
    this.isTripwireArmed = false;
    this.baselineMagnitude = null;
    this.tripwireAlarmCallback = null;
    if (this.listeners.size === 0) {
      this.stopListening();
    }
  }

  static isArmed(): boolean {
    return this.isTripwireArmed;
  }

  /**
   * Enables Shake-to-SOS listener
   */
  static setShakeSosHandler(handler: (() => void) | null, threshold = 2.2): void {
    this.shakeCallback = handler;
    this.shakeThreshold = threshold;
    if (handler) {
      this.startListening();
    }
  }

  /**
   * Simulates a motion or shake event (ideal for testing in browser or emulator)
   */
  static simulateSensorEvent(deltaMagnitude: number): void {
    const data: AccelerometerData = {
      x: 0.1,
      y: 0.2,
      z: 1.0 + deltaMagnitude,
      magnitude: 1.0 + deltaMagnitude,
      timestamp: Date.now(),
    };
    this.processTelemetry(data);
  }
}
