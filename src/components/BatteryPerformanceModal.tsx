import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Theme } from '../theme/theme';
import { OptimizerService, BatteryDiagnostics } from '../services/optimizer';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export const BatteryPerformanceModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const [profile, setProfile] = useState<BatteryDiagnostics['activeProfile']>('BALANCED');
  const diagnostics = OptimizerService.getBatteryDiagnostics(profile);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onDismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>BATTERY & PERFORMANCE</Text>
            <Text style={styles.sub}>MIUI-Style Thermal Diagnostics & Power Profiles</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Battery Hero Dial */}
          <View style={styles.heroBox}>
            <View style={styles.batteryDial}>
              <Text style={styles.batteryPercent}>{diagnostics.levelPercent}%</Text>
              <Text style={styles.batterySub}>HEALTH: {diagnostics.health}</Text>
            </View>

            <Text style={styles.remainingHours}>
              {diagnostics.isCharging
                ? `Charging on ${diagnostics.plugged} • ${diagnostics.levelPercent}% ${diagnostics.levelPercent >= 100 ? 'Fully Charged' : 'Charging'}`
                : `~${diagnostics.estimatedHoursRemaining} hrs remaining`}
            </Text>

            <View style={styles.telemetryRow}>
              <View style={styles.telemetryPill}>
                <Ionicons name="thermometer-outline" size={14} color={Theme.colors.warning} />
                <Text style={styles.telemetryText}>{diagnostics.temperatureC}°C Normal</Text>
              </View>

              <View style={styles.telemetryPill}>
                <Ionicons name="flash-outline" size={14} color={Theme.colors.primary} />
                <Text style={styles.telemetryText}>{diagnostics.voltageV}V</Text>
              </View>

              <View style={styles.telemetryPill}>
                <Ionicons name="battery-charging-outline" size={14} color={Theme.colors.success} />
                <Text style={styles.telemetryText}>{diagnostics.technology}</Text>
              </View>
            </View>
          </View>

          {/* 4 Power Profiles */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>POWER MODES</Text>
            <View style={styles.profilesGrid}>
              {/* Performance */}
              <TouchableOpacity
                style={[styles.profileCard, profile === 'PERFORMANCE' && styles.profileCardActive]}
                onPress={() => setProfile('PERFORMANCE')}
              >
                <Ionicons
                  name="rocket"
                  size={20}
                  color={profile === 'PERFORMANCE' ? Theme.colors.danger : Theme.colors.textMuted}
                />
                <Text style={styles.profileName}>Performance</Text>
                <Text style={styles.profileHours}>13.9 hrs</Text>
              </TouchableOpacity>

              {/* Balanced */}
              <TouchableOpacity
                style={[styles.profileCard, profile === 'BALANCED' && styles.profileCardActive]}
                onPress={() => setProfile('BALANCED')}
              >
                <Ionicons
                  name="speedometer"
                  size={20}
                  color={profile === 'BALANCED' ? Theme.colors.primary : Theme.colors.textMuted}
                />
                <Text style={styles.profileName}>Balanced</Text>
                <Text style={styles.profileHours}>18.5 hrs</Text>
              </TouchableOpacity>

              {/* Battery Saver */}
              <TouchableOpacity
                style={[styles.profileCard, profile === 'SAVER' && styles.profileCardActive]}
                onPress={() => setProfile('SAVER')}
              >
                <Ionicons
                  name="leaf"
                  size={20}
                  color={profile === 'SAVER' ? Theme.colors.success : Theme.colors.textMuted}
                />
                <Text style={styles.profileName}>Saver</Text>
                <Text style={styles.profileHours}>25.0 hrs</Text>
              </TouchableOpacity>

              {/* Ultra Saver */}
              <TouchableOpacity
                style={[styles.profileCard, profile === 'ULTRA_SAVER' && styles.profileCardActive]}
                onPress={() => setProfile('ULTRA_SAVER')}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={profile === 'ULTRA_SAVER' ? Theme.colors.warning : Theme.colors.textMuted}
                />
                <Text style={styles.profileName}>Ultra Saver</Text>
                <Text style={styles.profileHours}>44.4 hrs</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Battery Drain Leaderboard */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>BATTERY DRAIN LEADERBOARD</Text>

            {diagnostics.appDrains.map((drain, idx) => (
              <View key={idx} style={styles.drainRow}>
                <Ionicons name={drain.icon as any} size={18} color={Theme.colors.primary} />
                <View style={styles.drainInfo}>
                  <Text style={styles.drainName}>{drain.name}</Text>
                  <View style={styles.drainBarBg}>
                    <View style={[styles.drainBarFill, { width: `${drain.percent * 2.5}%` }]} />
                  </View>
                </View>
                <Text style={styles.drainPercent}>{drain.percent}%</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 38) + 12 : (Platform.OS === 'ios' ? 52 : 20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: Platform.OS === 'android' ? 60 : 40,
  },
  heroBox: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginBottom: Theme.spacing.md,
  },
  batteryDial: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    marginBottom: 10,
  },
  batteryPercent: {
    color: Theme.colors.success,
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Theme.typography.fontFamily.mono,
  },
  batterySub: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },
  remainingHours: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  telemetryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.sm,
  },
  telemetryText: {
    color: Theme.colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginBottom: Theme.spacing.md,
  },
  cardTitle: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: Theme.spacing.sm,
  },
  profilesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  profileCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    paddingVertical: 12,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  profileCardActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  profileName: {
    color: Theme.colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
  },
  profileHours: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  drainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
    gap: 12,
  },
  drainInfo: {
    flex: 1,
  },
  drainName: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  drainBarBg: {
    height: 4,
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  drainBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
  },
  drainPercent: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily.mono,
  },
});
