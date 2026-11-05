import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Theme } from '../theme/theme';
import { OptimizerService, DataUsageStats } from '../services/optimizer';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export const DataUsageModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const [stats, setStats] = useState<DataUsageStats>(OptimizerService.getDataUsageStats());

  const toggleBlockBackground = (id: string) => {
    setStats((prev) => ({
      ...prev,
      appTraffic: prev.appTraffic.map((app) =>
        app.id === id ? { ...app, backgroundDataBlocked: !app.backgroundDataBlocked } : app
      ),
    }));
  };

  if (!visible) return null;

  const percentUsed = Math.round((stats.usedCellularGb / stats.monthlyLimitGb) * 100);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onDismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>DATA USAGE & TRAFFIC</Text>
            <Text style={styles.sub}>MIUI-Style Bandwidth Monitoring & App Firewall</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Monthly Cycle Meter Hero */}
          <View style={styles.heroBox}>
            <View style={styles.cycleHeader}>
              <Text style={styles.cycleTitle}>CELLULAR DATA PLAN</Text>
              <Text style={styles.cycleDays}>Cycle resets in {30 - stats.billingCycleDay} days</Text>
            </View>

            <View style={styles.usageRow}>
              <Text style={styles.usedGb}>{stats.usedCellularGb} GB</Text>
              <Text style={styles.limitGb}>/ {stats.monthlyLimitGb} GB</Text>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${percentUsed}%` }]} />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Today: {stats.todayMb} MB</Text>
              <Text style={styles.metaText}>Wi-Fi Used: {stats.usedWifiGb} GB</Text>
            </View>

            <View style={[styles.metaRow, { marginTop: 6 }]}>
              <Text style={styles.metaText}>Wi-Fi IP: {stats.localWifiIp}</Text>
              <Text style={styles.metaText}>Cellular: {stats.cellularIp}</Text>
            </View>
          </View>

          {/* App Data Usage & Firewall */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>APP NETWORK CONSUMPTION & RESTRICTIONS</Text>

            {stats.appTraffic.map((app) => {
              const totalMb = app.cellularMb + app.wifiMb;
              const formattedTotal =
                totalMb >= 1024
                  ? (totalMb / 1024).toFixed(1) + ' GB'
                  : totalMb + ' MB';

              return (
                <View key={app.id} style={styles.appRow}>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.appName}</Text>
                    <Text style={styles.appTrafficDetail}>
                      Cell: {app.cellularMb} MB • Wi-Fi: {app.wifiMb} MB
                    </Text>
                  </View>

                  <View style={styles.appActions}>
                    <Text style={styles.appTotalText}>{formattedTotal}</Text>
                    <View style={styles.switchWrap}>
                      <Switch
                        value={app.backgroundDataBlocked}
                        onValueChange={() => toggleBlockBackground(app.id)}
                        trackColor={{ false: Theme.colors.surfaceBorder, true: Theme.colors.danger }}
                        thumbColor="#FFFFFF"
                      />
                      <Text style={styles.blockLabel}>
                        {app.backgroundDataBlocked ? 'BLOCKED' : 'ALLOW'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
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
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginBottom: Theme.spacing.md,
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cycleTitle: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cycleDays: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 4,
  },
  usedGb: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Theme.typography.fontFamily.mono,
  },
  limitGb: {
    color: Theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  cardTitle: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: Theme.spacing.sm,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  appTrafficDetail: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  appActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  appTotalText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily.mono,
  },
  switchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blockLabel: {
    color: Theme.colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
  },
});
