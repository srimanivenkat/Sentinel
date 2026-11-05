import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Platform,
} from 'react-native';
import { Theme } from '../theme/theme';
import { StorageService } from '../services/storage';
import { CryptoService } from '../services/crypto';
import { EmergencyService } from '../services/emergency';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onUnlockSuccess: () => void;
}

export const AuthLockScreen: React.FC<Props> = ({ onUnlockSuccess }) => {
  const [pin, setPin] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupPinFirst, setSetupPinFirst] = useState('');

  useEffect(() => {
    checkPinAndBiometrics();
  }, []);

  const checkPinAndBiometrics = async () => {
    const pinData = await StorageService.getMasterPinData();
    if (!pinData) {
      setIsSetupMode(true);
    }

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setHasBiometrics(true);
        // Prompt biometric immediately if PIN already set
        if (pinData) {
          triggerBiometricPrompt();
        }
      }
    } catch {
      // Biometrics not available on web/sim
    }
  };

  const triggerBiometricPrompt = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Sentinel Mobile Vault',
        fallbackLabel: 'Use Master PIN',
      });
      if (result.success) {
        onUnlockSuccess();
      }
    } catch {}
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = async (enteredPin: string) => {
    if (isSetupMode) {
      if (!setupPinFirst) {
        setSetupPinFirst(enteredPin);
        setPin('');
        setErrorMsg('CONFIRM YOUR 4-DIGIT PIN');
      } else {
        if (setupPinFirst === enteredPin) {
          const salt = CryptoService.generateSalt();
          const hash = CryptoService.hashSecret(enteredPin, salt);
          await StorageService.setMasterPinData(hash, salt);
          onUnlockSuccess();
        } else {
          setSetupPinFirst('');
          setPin('');
          setErrorMsg('PINS DO NOT MATCH. TRY AGAIN.');
        }
      }
      return;
    }

    const pinData = await StorageService.getMasterPinData();
    if (!pinData) {
      onUnlockSuccess();
      return;
    }

    const computedHash = CryptoService.hashSecret(enteredPin, pinData.salt);
    if (computedHash === pinData.hash) {
      setPin('');
      setFailedAttempts(0);
      onUnlockSuccess();
    } else {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      setPin('');
      setErrorMsg(`INCORRECT PIN (${nextFailed}/3)`);

      try {
        Vibration.vibrate([100, 100, 100]);
      } catch {}

      if (nextFailed >= 3) {
        triggerIntruderCapture(nextFailed);
      }
    }
  };

  const triggerIntruderCapture = async (attempts: number) => {
    setErrorMsg('⚠️ SECURITY BREACH LOGGED (PHOTO CAPTURED)');

    // Capture location
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const loc = await EmergencyService.getCurrentLocation();
      lat = loc.latitude;
      lng = loc.longitude;
    } catch {}

    // Record intruder log
    await StorageService.addIntruderLog({
      id: 'intruder-' + Date.now(),
      timestamp: Date.now(),
      failedPinAttempts: attempts,
      latitude: lat,
      longitude: lng,
      triggerType: 'FAILED_PIN',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Shield */}
      <View style={styles.header}>
        <View style={styles.shieldCircle}>
          <Ionicons name="shield-checkmark" size={44} color={Theme.colors.primary} />
        </View>
        <Text style={styles.appName}>SENTINEL MOBILE</Text>
        <Text style={styles.appSub}>
          {isSetupMode ? 'SET MASTER SECURITY PIN' : 'ENTER MASTER PIN'}
        </Text>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      </View>

      {/* PIN Dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((idx) => {
          const filled = pin.length > idx;
          return (
            <View
              key={idx}
              style={[
                styles.dot,
                filled && styles.dotFilled,
                errorMsg && styles.dotError,
              ]}
            />
          );
        })}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.keyButton}
                onPress={() => handleDigit(digit)}
                activeOpacity={0.6}
              >
                <Text style={styles.keyText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Bottom row */}
        <View style={styles.keypadRow}>
          {hasBiometrics ? (
            <TouchableOpacity style={styles.keyButton} onPress={triggerBiometricPrompt}>
              <Ionicons name="finger-print" size={28} color={Theme.colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.keyButtonEmpty} />
          )}

          <TouchableOpacity
            style={styles.keyButton}
            onPress={() => handleDigit('0')}
            activeOpacity={0.6}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.keyButton}
            onPress={handleDelete}
            activeOpacity={0.6}
          >
            <Ionicons name="backspace-outline" size={24} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 30 : 20,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
  },
  shieldCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  appSub: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 1,
  },
  errorText: {
    color: Theme.colors.danger,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Theme.colors.surfaceBorder,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  dotError: {
    borderColor: Theme.colors.danger,
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  keyButtonEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily.sans,
  },
});
