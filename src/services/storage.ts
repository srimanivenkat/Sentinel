import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  EmergencyContact,
  TotpItem,
  VaultCredential,
  IntruderRecord,
} from '../types/security';

const KEYS = {
  MASTER_PIN_HASH: 'sentinel_master_pin_hash',
  MASTER_PIN_SALT: 'sentinel_master_pin_salt',
  EMERGENCY_CONTACTS: 'sentinel_emergency_contacts',
  TOTP_ITEMS: 'sentinel_totp_items',
  VAULT_ITEMS: 'sentinel_vault_items',
  INTRUDER_LOGS: 'sentinel_intruder_logs',
  SETTINGS: 'sentinel_settings',
};

export interface AppSettings {
  shakeToSosEnabled: boolean;
  shakeSensitivity: number; // 1 (low) to 3 (high)
  motionAlarmDelaySeconds: number; // countdown before arming
  motionSensitivity: number;
  autoLockMinutes: number;
  biometricsEnabled: boolean;
  duressPinHash?: string;
  duressPinSalt?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  shakeToSosEnabled: true,
  shakeSensitivity: 2,
  motionAlarmDelaySeconds: 5,
  motionSensitivity: 2,
  autoLockMinutes: 5,
  biometricsEnabled: false,
};

export class StorageService {
  private static memoryStore: Record<string, string> = {};

  /**
   * Safe getter supporting SecureStore on mobile and localStorage on web
   */
  private static async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return this.memoryStore[key] || null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return this.memoryStore[key] || null;
    }
  }

  /**
   * Safe setter supporting SecureStore on mobile and localStorage on web
   */
  private static async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        this.memoryStore[key] = value;
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      this.memoryStore[key] = value;
    }
  }

  // --- Master PIN & Security ---
  static async getMasterPinData(): Promise<{ hash: string; salt: string } | null> {
    const hash = await this.getItem(KEYS.MASTER_PIN_HASH);
    const salt = await this.getItem(KEYS.MASTER_PIN_SALT);
    if (!hash || !salt) return null;
    return { hash, salt };
  }

  static async setMasterPinData(hash: string, salt: string): Promise<void> {
    await this.setItem(KEYS.MASTER_PIN_HASH, hash);
    await this.setItem(KEYS.MASTER_PIN_SALT, salt);
  }

  // --- Emergency Contacts ---
  static async getEmergencyContacts(): Promise<EmergencyContact[]> {
    const data = await this.getItem(KEYS.EMERGENCY_CONTACTS);
    if (!data) {
      // Default demo contacts
      return [
        {
          id: '1',
          name: 'Primary Contact (Family)',
          phoneNumber: '+15550199',
          relationship: 'Family',
          notifyOnSos: true,
        },
      ];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static async saveEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
    await this.setItem(KEYS.EMERGENCY_CONTACTS, JSON.stringify(contacts));
  }

  // --- TOTP Items ---
  static async getTotpItems(): Promise<TotpItem[]> {
    const data = await this.getItem(KEYS.TOTP_ITEMS);
    if (!data) {
      // Preload standard demo entries for quick inspection
      return [
        {
          id: 'totp-1',
          issuer: 'GitHub',
          account: 'user@github.com',
          secret: 'JBSWY3DPEHPK3PXP', // standard test secret
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          createdAt: Date.now(),
        },
        {
          id: 'totp-2',
          issuer: 'Google',
          account: 'user@gmail.com',
          secret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          createdAt: Date.now(),
        },
      ];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static async saveTotpItems(items: TotpItem[]): Promise<void> {
    await this.setItem(KEYS.TOTP_ITEMS, JSON.stringify(items));
  }

  // --- Vault Credentials ---
  static async getVaultItems(): Promise<VaultCredential[]> {
    const data = await this.getItem(KEYS.VAULT_ITEMS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static async saveVaultItems(items: VaultCredential[]): Promise<void> {
    await this.setItem(KEYS.VAULT_ITEMS, JSON.stringify(items));
  }

  // --- Intruder Records ---
  static async getIntruderLogs(): Promise<IntruderRecord[]> {
    const data = await this.getItem(KEYS.INTRUDER_LOGS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static async addIntruderLog(record: IntruderRecord): Promise<void> {
    const existing = await this.getIntruderLogs();
    const updated = [record, ...existing].slice(0, 50); // keep last 50
    await this.setItem(KEYS.INTRUDER_LOGS, JSON.stringify(updated));
  }

  static async clearIntruderLogs(): Promise<void> {
    await this.setItem(KEYS.INTRUDER_LOGS, JSON.stringify([]));
  }

  // --- Settings ---
  static async getSettings(): Promise<AppSettings> {
    const data = await this.getItem(KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    await this.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }
}
