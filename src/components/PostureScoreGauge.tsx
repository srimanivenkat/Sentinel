import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/theme';
import { SecurityPosture } from '../types/security';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  posture: SecurityPosture;
}

export const PostureScoreGauge: React.FC<Props> = ({ posture }) => {
  const { overallScore, threatLevel, biometricsEnabled, motionSentryArmed, wifiSecurity, vpnActive } = posture;

  let gaugeColor = Theme.colors.success;
  let bgGlow = Theme.colors.successGlow;
  let statusText = 'FORTRESS SECURE';

  if (threatLevel === 'GUARDED') {
    gaugeColor = Theme.colors.primary;
    bgGlow = Theme.colors.primaryGlow;
    statusText = 'GUARDED SYSTEM';
  } else if (threatLevel === 'ELEVATED') {
    gaugeColor = Theme.colors.warning;
    bgGlow = Theme.colors.warningGlow;
    statusText = 'ELEVATED RISK';
  } else if (threatLevel === 'CRITICAL') {
    gaugeColor = Theme.colors.danger;
    bgGlow = Theme.colors.dangerGlow;
    statusText = 'CRITICAL EXPOSURE';
  }

  return (
    <View style={[styles.container, { borderColor: gaugeColor }]}>
      <View style={[styles.radialGlow, { backgroundColor: bgGlow }]} />

      <View style={styles.contentRow}>
        {/* Circular Score Circle */}
        <View style={[styles.scoreCircle, { borderColor: gaugeColor }]}>
          <Text style={[styles.scoreNumber, { color: gaugeColor }]}>{overallScore}</Text>
          <Text style={styles.scoreUnit}>/ 100</Text>
        </View>

        {/* Status & Badges */}
        <View style={styles.detailsCol}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: gaugeColor }]}>
              <Text style={styles.statusBadgeText}>{statusText}</Text>
            </View>
          </View>

          <Text style={styles.postureDesc}>
            Real-time multi-vector posture analysis evaluating biometrics, encryption, motion tripwire & network hygiene.
          </Text>

          <View style={styles.tagsContainer}>
            <View style={styles.tagItem}>
              <Ionicons
                name={biometricsEnabled ? 'finger-print' : 'close-circle'}
                size={14}
                color={biometricsEnabled ? Theme.colors.success : Theme.colors.textMuted}
              />
              <Text style={styles.tagText}>Biometrics</Text>
            </View>

            <View style={styles.tagItem}>
              <Ionicons
                name={motionSentryArmed ? 'shield-checkmark' : 'shield-outline'}
                size={14}
                color={motionSentryArmed ? Theme.colors.primary : Theme.colors.textMuted}
              />
              <Text style={styles.tagText}>{motionSentryArmed ? 'Sentry Armed' : 'Sentry Idle'}</Text>
            </View>

            <View style={styles.tagItem}>
              <Ionicons
                name={vpnActive ? 'lock-closed' : 'wifi'}
                size={14}
                color={vpnActive ? Theme.colors.accent : Theme.colors.warning}
              />
              <Text style={styles.tagText}>{vpnActive ? 'VPN Active' : wifiSecurity}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: Theme.spacing.sm,
  },
  radialGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    marginRight: Theme.spacing.md,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily.sans,
  },
  scoreUnit: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: -2,
    fontWeight: '600',
  },
  detailsCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radii.sm,
  },
  statusBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  postureDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginVertical: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  tagText: {
    color: Theme.colors.text,
    fontSize: 10,
    fontWeight: '600',
  },
});
