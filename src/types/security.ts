export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  notifyOnSos: boolean;
}

export interface TotpItem {
  id: string;
  issuer: string;
  account: string;
  secret: string; // Base32 encoded
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number; // usually 30 seconds
  createdAt: number;
}

export interface VaultCredential {
  id: string;
  title: string;
  username: string;
  password: string; // Stored encrypted at rest
  url?: string;
  category: 'logins' | 'cards' | 'notes' | 'identity';
  notes?: string;
  updatedAt: number;
}

export interface IntruderRecord {
  id: string;
  timestamp: number;
  photoUri?: string;
  failedPinAttempts: number;
  latitude?: number;
  longitude?: number;
  triggerType: 'FAILED_PIN' | 'MOTION_TRIPWIRE' | 'DURESS_TRIGGER';
}

export interface SecurityPosture {
  overallScore: number; // 0 to 100
  biometricsEnabled: boolean;
  masterPinSet: boolean;
  emergencyContactsCount: number;
  vaultEncrypted: boolean;
  motionSentryArmed: boolean;
  wifiSecurity: 'WPA3' | 'WPA2' | 'OPEN' | 'UNKNOWN';
  vpnActive: boolean;
  dnsSafe: boolean;
  clipboardSecured: boolean;
  threatLevel: 'SECURE' | 'GUARDED' | 'ELEVATED' | 'CRITICAL';
}

export interface DecoyCallConfig {
  callerName: string;
  callerNumber: string;
  delaySeconds: number;
  scenarioVoice: 'business' | 'family' | 'police' | 'custom';
}
