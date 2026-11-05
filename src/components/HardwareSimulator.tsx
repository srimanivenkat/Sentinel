import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../theme/theme';
import { SensorService } from '../services/sensors';
import { EmergencyService } from '../services/emergency';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onTriggerDecoyCall?: () => void;
  onSimulateIntruder?: () => void;
}

export const HardwareSimulator: React.FC<Props> = ({
  onTriggerDecoyCall,
  onSimulateIntruder,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);

  const handleSimulateBump = () => {
    SensorService.simulateSensorEvent(0.85); // 0.85g spike
  };

  const handleSimulateShake = () => {
    SensorService.simulateSensorEvent(3.2); // >2.5g SOS spike
    setTimeout(() => SensorService.simulateSensorEvent(3.0), 300);
    setTimeout(() => SensorService.simulateSensorEvent(3.1), 600);
  };

  const handleToggleSiren = () => {
    if (sirenPlaying) {
      EmergencyService.stopSiren();
      setSirenPlaying(false);
    } else {
      EmergencyService.startSiren();
      setSirenPlaying(true);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.headerBtn}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={styles.headerTitleRow}>
          <Ionicons name="hardware-chip-outline" size={16} color={Theme.colors.primary} />
          <Text style={styles.headerTitle}>HARDWARE DIAGNOSTICS & PERIMETER TEST</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Theme.colors.textMuted}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.bodyGrid}>
          <Text style={styles.infoText}>
            Simulate native hardware sensor events directly on Web, emulators, or desktop:
          </Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.simBtn} onPress={handleSimulateBump}>
              <Ionicons name="hand-right-outline" size={14} color={Theme.colors.primary} />
              <Text style={styles.simBtnText}>Tripwire Bump</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.simBtn} onPress={handleSimulateShake}>
              <Ionicons name="refresh-outline" size={14} color={Theme.colors.warning} />
              <Text style={styles.simBtnText}>Shake SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.simBtn, sirenPlaying && styles.simBtnActive]}
              onPress={handleToggleSiren}
            >
              <Ionicons
                name={sirenPlaying ? 'volume-high' : 'volume-mute-outline'}
                size={14}
                color={sirenPlaying ? '#FFFFFF' : Theme.colors.danger}
              />
              <Text style={[styles.simBtnText, sirenPlaying && { color: '#FFFFFF' }]}>
                {sirenPlaying ? 'Stop Siren' : 'Test Siren'}
              </Text>
            </TouchableOpacity>

            {onTriggerDecoyCall && (
              <TouchableOpacity style={styles.simBtn} onPress={onTriggerDecoyCall}>
                <Ionicons name="call-outline" size={14} color={Theme.colors.success} />
                <Text style={styles.simBtnText}>Decoy Call</Text>
              </TouchableOpacity>
            )}

            {onSimulateIntruder && (
              <TouchableOpacity style={styles.simBtn} onPress={onSimulateIntruder}>
                <Ionicons name="camera-outline" size={14} color={Theme.colors.accent} />
                <Text style={styles.simBtnText}>Intruder Snap</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginVertical: Theme.spacing.sm,
    overflow: 'hidden',
  },
  headerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bodyGrid: {
    padding: Theme.spacing.sm,
  },
  infoText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Theme.radii.sm,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  simBtnActive: {
    backgroundColor: Theme.colors.danger,
    borderColor: Theme.colors.danger,
  },
  simBtnText: {
    color: Theme.colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
});
