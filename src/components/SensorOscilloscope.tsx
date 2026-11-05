import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../theme/theme';
import { SensorService, AccelerometerData } from '../services/sensors';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  isArmed: boolean;
  sensitivityG: number;
  onSensitivityChange?: (newG: number) => void;
  onAlarmTriggered?: (reason: string) => void;
}

export const SensorOscilloscope: React.FC<Props> = ({
  isArmed,
  sensitivityG,
  onSensitivityChange,
  onAlarmTriggered,
}) => {
  const [telemetry, setTelemetry] = useState<AccelerometerData>({
    x: 0,
    y: 0,
    z: 1,
    magnitude: 1,
    timestamp: Date.now(),
  });
  const [history, setHistory] = useState<number[]>([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const [alarmActive, setAlarmActive] = useState(false);

  useEffect(() => {
    const unsubscribe = SensorService.subscribe((data) => {
      setTelemetry(data);
      setHistory((prev) => {
        const next = [...prev.slice(1), data.magnitude];
        return next;
      });
    });

    if (isArmed) {
      SensorService.armTripwire(
        (reason) => {
          setAlarmActive(true);
          if (onAlarmTriggered) onAlarmTriggered(reason);
        },
        { sensitivityG }
      );
    } else {
      SensorService.disarmTripwire();
      setAlarmActive(false);
    }

    return () => {
      unsubscribe();
      SensorService.disarmTripwire();
    };
  }, [isArmed, sensitivityG]);

  return (
    <View style={[styles.container, alarmActive && styles.containerAlarm]}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.titleText}>PERIMETER OSCILLOSCOPE</Text>
          <Text style={styles.subText}>Haven Real-Time Tri-Axial G-Force</Text>
        </View>

        <View style={[styles.statusPill, isArmed ? styles.pillArmed : styles.pillDisarmed]}>
          <Ionicons
            name={isArmed ? 'radio-outline' : 'pause-outline'}
            size={12}
            color={isArmed ? Theme.colors.primary : Theme.colors.textMuted}
          />
          <Text style={[styles.pillText, { color: isArmed ? Theme.colors.primary : Theme.colors.textMuted }]}>
            {alarmActive ? 'ALARM SPIKE' : isArmed ? 'MONITORING' : 'STANDBY'}
          </Text>
        </View>
      </View>

      {/* Real-time Oscilloscope Waveform Bars */}
      <View style={styles.waveContainer}>
        {history.map((val, idx) => {
          const delta = Math.abs(val - 1.0);
          const barHeight = Math.min(60, Math.max(6, delta * 50 + 6));
          const isSpike = delta > sensitivityG;
          return (
            <View
              key={idx}
              style={[
                styles.waveBar,
                {
                  height: barHeight,
                  backgroundColor: isSpike ? Theme.colors.danger : isArmed ? Theme.colors.primary : Theme.colors.surfaceBorder,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Axis telemetry */}
      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryItem}>
          <Text style={styles.axisLabel}>X-AXIS</Text>
          <Text style={styles.axisVal}>{telemetry.x.toFixed(2)}g</Text>
        </View>
        <View style={styles.telemetryItem}>
          <Text style={styles.axisLabel}>Y-AXIS</Text>
          <Text style={styles.axisVal}>{telemetry.y.toFixed(2)}g</Text>
        </View>
        <View style={styles.telemetryItem}>
          <Text style={styles.axisLabel}>Z-AXIS</Text>
          <Text style={styles.axisVal}>{telemetry.z.toFixed(2)}g</Text>
        </View>
        <View style={styles.telemetryItem}>
          <Text style={styles.axisLabel}>MAGNITUDE</Text>
          <Text style={[styles.axisVal, { color: Theme.colors.primary }]}>
            {telemetry.magnitude.toFixed(2)}g
          </Text>
        </View>
      </View>

      {/* Sensitivity Calibration Controls */}
      {onSensitivityChange && (
        <View style={styles.sensitivityRow}>
          <Text style={styles.sensitivityLabel}>SENSITIVITY THRESHOLD: {sensitivityG.toFixed(2)}g</Text>
          <View style={styles.stepButtons}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => onSensitivityChange(Math.max(0.1, Number((sensitivityG - 0.05).toFixed(2))))}
            >
              <Text style={styles.stepBtnText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => onSensitivityChange(Math.min(1.0, Number((sensitivityG + 0.05).toFixed(2))))}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginVertical: Theme.spacing.sm,
  },
  containerAlarm: {
    borderColor: Theme.colors.danger,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  titleCol: {},
  titleText: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radii.sm,
    backgroundColor: Theme.colors.surfaceLight,
  },
  pillArmed: {
    backgroundColor: Theme.colors.primaryGlow,
  },
  pillDisarmed: {
    backgroundColor: Theme.colors.surfaceLight,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  waveContainer: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radii.md,
    paddingHorizontal: 12,
    marginVertical: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  waveBar: {
    width: 14,
    borderRadius: 3,
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  telemetryItem: {
    alignItems: 'center',
    flex: 1,
  },
  axisLabel: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  axisVal: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily.mono,
    marginTop: 2,
  },
  sensitivityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surfaceBorder,
  },
  sensitivityLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  stepButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    backgroundColor: Theme.colors.surfaceLight,
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  stepBtnText: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
