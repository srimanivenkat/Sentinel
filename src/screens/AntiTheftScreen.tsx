import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { Theme } from '../theme/theme';
import { IntruderRecord } from '../types/security';
import { StorageService } from '../services/storage';
import { SensorService } from '../services/sensors';
import { EmergencyService } from '../services/emergency';
import { SensorOscilloscope } from '../components/SensorOscilloscope';
import { Ionicons } from '@expo/vector-icons';

export const AntiTheftScreen: React.FC = () => {
  const [isArmed, setIsArmed] = useState(false);
  const [armCountdown, setArmCountdown] = useState<number | null>(null);
  const [sensitivityG, setSensitivityG] = useState(0.35);
  const [logs, setLogs] = useState<IntruderRecord[]>([]);

  useEffect(() => {
    loadLogs();
    setIsArmed(SensorService.isArmed());
  }, []);

  const loadLogs = async () => {
    const data = await StorageService.getIntruderLogs();
    setLogs(data);
  };

  const handleToggleArm = () => {
    if (isArmed) {
      SensorService.disarmTripwire();
      EmergencyService.stopSiren();
      setIsArmed(false);
      setArmCountdown(null);
    } else {
      // 5-second countdown to place the device down safely
      setArmCountdown(5);
      let count = 5;
      const interval = setInterval(() => {
        count -= 1;
        setArmCountdown(count);
        try {
          Vibration.vibrate(50);
        } catch {}

        if (count <= 0) {
          clearInterval(interval);
          setArmCountdown(null);
          setIsArmed(true);
          SensorService.armTripwire(
            (reason) => handleAlarmTriggered(reason),
            { sensitivityG }
          );
        }
      }, 1000);
    }
  };

  const handleAlarmTriggered = async (reason: string) => {
    EmergencyService.startSiren();
    try {
      Vibration.vibrate([200, 200, 200, 200]);
    } catch {}

    const loc = await EmergencyService.getCurrentLocation();
    const newRecord: IntruderRecord = {
      id: 'alarm-' + Date.now(),
      timestamp: Date.now(),
      failedPinAttempts: 0,
      latitude: loc.latitude,
      longitude: loc.longitude,
      triggerType: 'MOTION_TRIPWIRE',
    };
    await StorageService.addIntruderLog(newRecord);
    loadLogs();
  };

  const handleClearLogs = async () => {
    await StorageService.clearIntruderLogs();
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.screenTitle}>DEVICE SENTRY & ANTI-THEFT</Text>
        <Text style={styles.screenSub}>Haven physical perimeter tripwire & intruder trap</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Arm Control Master Card */}
        <View style={[styles.masterCard, isArmed && styles.masterCardArmed]}>
          <View style={styles.masterHeader}>
            <View style={styles.masterIconCircle}>
              <Ionicons
                name={isArmed ? 'shield-checkmark' : 'shield-outline'}
                size={28}
                color={isArmed ? Theme.colors.primary : Theme.colors.textMuted}
              />
            </View>
            <View style={styles.masterTitleCol}>
              <Text style={styles.masterTitle}>
                {armCountdown !== null
                  ? `ARMING IN ${armCountdown} SECONDS...`
                  : isArmed
                  ? 'PERIMETER SENTRY ARMED'
                  : 'SENTRY DISARMED'}
              </Text>
              <Text style={styles.masterSub}>
                {isArmed
                  ? 'Device movement will sound loud acoustic alarm'
                  : 'Place device down and tap to arm perimeter'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.armButton, isArmed ? styles.disarmBtn : styles.armBtn]}
            onPress={handleToggleArm}
          >
            <Text style={styles.armButtonText}>
              {armCountdown !== null ? 'CANCEL ARMING' : isArmed ? 'DISARM SENTRY' : 'ARM SENTRY (5S DELAY)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Haven Sensor Oscilloscope */}
        <SensorOscilloscope
          isArmed={isArmed}
          sensitivityG={sensitivityG}
          onSensitivityChange={setSensitivityG}
          onAlarmTriggered={handleAlarmTriggered}
        />

        {/* Intruder Log & Captures */}
        <View style={styles.logsCard}>
          <View style={styles.logsHeaderRow}>
            <View>
              <Text style={styles.logsTitle}>INTRUDER INCIDENT LOGS ({logs.length})</Text>
              <Text style={styles.logsSub}>Failed PIN attempts and sensor tripwire alerts</Text>
            </View>

            {logs.length > 0 && (
              <TouchableOpacity onPress={handleClearLogs} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {logs.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color={Theme.colors.success} />
              <Text style={styles.emptyText}>Zero unauthorized intrusion events detected.</Text>
            </View>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <View style={styles.logIconCol}>
                  <Ionicons
                    name={log.triggerType === 'FAILED_PIN' ? 'camera-outline' : 'warning-outline'}
                    size={18}
                    color={log.triggerType === 'FAILED_PIN' ? Theme.colors.danger : Theme.colors.warning}
                  />
                </View>
                <View style={styles.logTextCol}>
                  <Text style={styles.logTriggerName}>
                    {log.triggerType === 'FAILED_PIN'
                      ? `Failed PIN Unlock (${log.failedPinAttempts} attempts)`
                      : 'Physical Motion Tripwire Tripped'}
                  </Text>
                  <Text style={styles.logTimestamp}>
                    {new Date(log.timestamp).toLocaleString()}
                  </Text>
                  {log.latitude && log.longitude && (
                    <Text style={styles.logCoords}>
                      Location: {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                    </Text>
                  )}
                </View>
                <View style={styles.badgeCol}>
                  <Text style={styles.loggedBadge}>LOGGED</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  topHeader: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  screenSub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.insets.scrollPaddingBottom,
  },
  masterCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginBottom: Theme.spacing.sm,
  },
  masterCardArmed: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Theme.spacing.md,
  },
  masterIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterTitleCol: {
    flex: 1,
  },
  masterTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  masterSub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  armButton: {
    paddingVertical: 12,
    borderRadius: Theme.radii.sm,
    alignItems: 'center',
  },
  armBtn: {
    backgroundColor: Theme.colors.primary,
  },
  disarmBtn: {
    backgroundColor: Theme.colors.danger,
  },
  armButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  logsCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginVertical: Theme.spacing.sm,
  },
  logsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  logsTitle: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  logsSub: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
    gap: 10,
  },
  logIconCol: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logTextCol: {
    flex: 1,
  },
  logTriggerName: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  logTimestamp: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  logCoords: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontFamily: Theme.typography.fontFamily.mono,
    marginTop: 2,
  },
  badgeCol: {},
  loggedBadge: {
    color: Theme.colors.danger,
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
