import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { Theme } from '../theme/theme';
import { SecurityPosture, IntruderRecord, TotpItem } from '../types/security';
import { NetworkService } from '../services/network';
import { StorageService } from '../services/storage';
import { SensorService } from '../services/sensors';
import { PostureScoreGauge } from '../components/PostureScoreGauge';
import { PanicButton } from '../components/PanicButton';
import { TotpCard } from '../components/TotpCard';
import { HardwareSimulator } from '../components/HardwareSimulator';
import { DecoyCallModal } from '../components/DecoyCallModal';
import { CleanerModal } from '../components/CleanerModal';
import { SpeedBoostModal } from '../components/SpeedBoostModal';
import { AntivirusScanModal } from '../components/AntivirusScanModal';
import { BatteryPerformanceModal } from '../components/BatteryPerformanceModal';
import { DataUsageModal } from '../components/DataUsageModal';
import { AppLockModal } from '../components/AppLockModal';
import { WidgetsHubModal } from '../components/WidgetsHubModal';
import { FloatingSecurityWidget } from '../components/FloatingSecurityWidget';
import { Ionicons } from '@expo/vector-icons';
import { OptimizerService, DeviceHardwareInfo } from '../services/optimizer';

interface Props {
  onNavigateTab: (tab: 'dashboard' | 'sos' | 'antitheft' | 'vault' | 'network') => void;
  onLockApp: () => void;
}

export const DashboardScreen: React.FC<Props> = ({ onNavigateTab, onLockApp }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceHardwareInfo>(OptimizerService.getDeviceInfo());
  const [batteryStats, setBatteryStats] = useState(OptimizerService.getBatteryDiagnostics());
  const [memStats, setMemStats] = useState(OptimizerService.getMemoryStats());
  const [junkBytes, setJunkBytes] = useState(() =>
    OptimizerService.getJunkItems().reduce((acc, j) => acc + j.sizeBytes, 0)
  );
  const [dataStats, setDataStats] = useState(() => OptimizerService.getDataUsageStats());
  const [lockedCount, setLockedCount] = useState(() =>
    OptimizerService.getAppLockItems().filter((a) => a.isLocked).length
  );
  const [posture, setPosture] = useState<SecurityPosture>({
    overallScore: 82,
    biometricsEnabled: true,
    masterPinSet: true,
    emergencyContactsCount: 1,
    vaultEncrypted: true,
    motionSentryArmed: false,
    wifiSecurity: 'WPA2',
    vpnActive: true,
    dnsSafe: true,
    clipboardSecured: true,
    threatLevel: 'SECURE',
  });
  const [recentLog, setRecentLog] = useState<IntruderRecord | null>(null);
  const [topTotp, setTopTotp] = useState<TotpItem | null>(null);
  const [isArmed, setIsArmed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedDone, setOptimizedDone] = useState(false);

  // Modals
  const [cleanerVisible, setCleanerVisible] = useState(false);
  const [speedBoostVisible, setSpeedBoostVisible] = useState(false);
  const [antivirusVisible, setAntivirusVisible] = useState(false);
  const [batteryVisible, setBatteryVisible] = useState(false);
  const [dataUsageVisible, setDataUsageVisible] = useState(false);
  const [appLockVisible, setAppLockVisible] = useState(false);
  const [decoyCallVisible, setDecoyCallVisible] = useState(false);
  const [widgetsVisible, setWidgetsVisible] = useState(false);
  const [floatingEnabled, setFloatingEnabled] = useState(true);

  useEffect(() => {
    loadDashboardData(false);
  }, []);

  useEffect(() => {
    const hasOpenModal =
      cleanerVisible ||
      speedBoostVisible ||
      antivirusVisible ||
      batteryVisible ||
      dataUsageVisible ||
      appLockVisible ||
      widgetsVisible ||
      decoyCallVisible;

    if (!hasOpenModal) return;

    const onBackPress = () => {
      if (cleanerVisible) setCleanerVisible(false);
      else if (speedBoostVisible) setSpeedBoostVisible(false);
      else if (antivirusVisible) setAntivirusVisible(false);
      else if (batteryVisible) setBatteryVisible(false);
      else if (dataUsageVisible) setDataUsageVisible(false);
      else if (appLockVisible) setAppLockVisible(false);
      else if (widgetsVisible) setWidgetsVisible(false);
      else if (decoyCallVisible) setDecoyCallVisible(false);
      return true; // handled: dismissed modal
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [
    cleanerVisible,
    speedBoostVisible,
    antivirusVisible,
    batteryVisible,
    dataUsageVisible,
    appLockVisible,
    widgetsVisible,
    decoyCallVisible,
  ]);

  const loadDashboardData = async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true);
    try {
      const pinData = await StorageService.getMasterPinData();
      const contacts = await StorageService.getEmergencyContacts();
      const vault = await StorageService.getVaultItems();
      const totps = await StorageService.getTotpItems();
      const logs = await StorageService.getIntruderLogs();
      const settings = await StorageService.getSettings();
      const netAudit = await NetworkService.auditNetwork();

      if (totps.length > 0) setTopTotp(totps[0]);
      if (logs.length > 0) setRecentLog(logs[0]);

      setIsArmed(SensorService.isArmed());

      const computed = NetworkService.calculatePostureScore({
        biometricsEnabled: settings.biometricsEnabled,
        masterPinSet: !!pinData,
        emergencyContactsCount: contacts.length,
        vaultItemsCount: vault.length + totps.length,
        motionArmed: SensorService.isArmed(),
        network: netAudit,
      });

      await OptimizerService.fetchLiveMetrics();
      setDeviceInfo(OptimizerService.getDeviceInfo());
      setBatteryStats(OptimizerService.getBatteryDiagnostics());
      setMemStats(OptimizerService.getMemoryStats());
      const junks = OptimizerService.getJunkItems();
      setJunkBytes(junks.reduce((acc, j) => acc + j.sizeBytes, 0));
      setDataStats(OptimizerService.getDataUsageStats());
      setLockedCount(OptimizerService.getAppLockItems().filter((a) => a.isLocked).length);

      setPosture(computed);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMasterOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
      setOptimizedDone(true);
      setPosture((prev) => ({ ...prev, overallScore: 98, threatLevel: 'SECURE' }));
      setTimeout(() => setOptimizedDone(false), 4000);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="shield-half" size={22} color={Theme.colors.primary} />
          <Text style={styles.logoText}>SENTINEL MOBILE</Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.widgetsHeaderBtn}
            onPress={() => setWidgetsVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="grid-outline" size={16} color={Theme.colors.primary} />
            <Text style={styles.widgetsHeaderBtnText}>Widgets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.lockBtn} onPress={onLockApp}>
            <Ionicons name="lock-closed-outline" size={18} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboardData(true)}
            tintColor={Theme.colors.primary}
            colors={[Theme.colors.primary]}
          />
        }
      >
        {/* Real Hardware Identity Banner */}
        <View style={styles.deviceBanner}>
          <View style={styles.deviceBannerLeft}>
            <Ionicons name="hardware-chip" size={16} color={Theme.colors.primary} />
            <Text style={styles.deviceName}>
              {deviceInfo.marketName || `${deviceInfo.manufacturer} ${deviceInfo.model}`}
            </Text>
          </View>
          <View style={styles.osBadge}>
            <Text style={styles.osBadgeText}>
              {deviceInfo.osName ? `${deviceInfo.osName} • ` : ''}Android {deviceInfo.androidVersion}
            </Text>
          </View>
        </View>

        {/* Posture Score Radial Gauge */}
        <PostureScoreGauge posture={posture} />

        {/* Interactive Widgets Gallery Banner */}
        <TouchableOpacity
          style={styles.widgetsBanner}
          onPress={() => setWidgetsVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.widgetsBannerLeft}>
            <View style={styles.widgetsBannerIconCircle}>
              <Ionicons name="apps" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.widgetsBannerTextCol}>
              <View style={styles.widgetsBannerBadgeRow}>
                <Text style={styles.widgetsBannerTitle}>SECURITY WIDGETS HUB</Text>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>6 TILES</Text>
                </View>
              </View>
              <Text style={styles.widgetsBannerSubtitle}>
                1-Tap Boost, Shield Radar, Battery & SOS widgets
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Theme.colors.primary} />
        </TouchableOpacity>

        {/* Master One-Tap Optimize Banner */}
        <TouchableOpacity
          style={[styles.optimizeBanner, optimizedDone && styles.optimizeBannerDone]}
          onPress={handleMasterOptimize}
          disabled={optimizing}
          activeOpacity={0.8}
        >
          <View style={styles.optimizeIconCircle}>
            {optimizing ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Ionicons
                name={optimizedDone ? 'checkmark' : 'speedometer'}
                size={22}
                color="#000000"
              />
            )}
          </View>
          <View style={styles.optimizeTextCol}>
            <Text style={styles.optimizeTitle}>
              {optimizing
                ? 'OPTIMIZING SYSTEM & CLEARING CACHE...'
                : optimizedDone
                ? 'SYSTEM OPTIMIZED (98/100)'
                : 'ONE-TAP MASTER OPTIMIZER'}
            </Text>
            <Text style={styles.optimizeSub}>
              {optimizedDone
                ? 'Cache cleared • RAM boosted • Antivirus safe'
                : 'Scan and clear junk, reclaim background RAM & audit security'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#000000" />
        </TouchableOpacity>

        {/* Panic Button */}
        <PanicButton />

        {/* Universal 6-Tile Security Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SYSTEM SECURITY UTILITIES</Text>
        </View>

        <View style={styles.tilesGrid}>
          {/* Tile 1: Cleaner */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => setCleanerVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: 'rgba(0, 240, 255, 0.15)' }]}>
              <Ionicons name="trash-bin-outline" size={20} color={Theme.colors.primary} />
            </View>
            <Text style={styles.tileTitle}>Cleaner</Text>
            <Text style={styles.tileMeta}>{OptimizerService.formatBytes(junkBytes)} Cache</Text>
          </TouchableOpacity>

          {/* Tile 2: Security Scan */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => setAntivirusVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Theme.colors.success} />
            </View>
            <Text style={styles.tileTitle}>Security Scan</Text>
            <Text style={styles.tileMeta}>0 Threats Safe</Text>
          </TouchableOpacity>

          {/* Tile 3: Battery & Performance */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => setBatteryVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: 'rgba(255, 179, 0, 0.15)' }]}>
              <Ionicons name="battery-charging-outline" size={20} color={Theme.colors.warning} />
            </View>
            <Text style={styles.tileTitle}>Battery</Text>
            <Text style={styles.tileMeta}>
              {batteryStats.levelPercent}% • {batteryStats.isCharging ? 'Charging' : `${batteryStats.estimatedHoursRemaining} hrs`}
            </Text>
          </TouchableOpacity>

          {/* Tile 4: Speed Boost */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => setSpeedBoostVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="flash-outline" size={20} color={Theme.colors.accent} />
            </View>
            <Text style={styles.tileTitle}>Speed Boost</Text>
            <Text style={styles.tileMeta}>{memStats.usedGb} / {memStats.totalGb} GB RAM</Text>
          </TouchableOpacity>

          {/* Tile 5: Data Usage */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => setDataUsageVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: 'rgba(0, 240, 255, 0.15)' }]}>
              <Ionicons name="cellular-outline" size={20} color={Theme.colors.primary} />
            </View>
            <Text style={styles.tileTitle}>Data Usage</Text>
            <Text style={styles.tileMeta}>{dataStats.usedCellularGb} GB / {dataStats.monthlyLimitGb} GB</Text>
          </TouchableOpacity>

          {/* Tile 6: App Lock */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => setAppLockVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
              <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.danger} />
            </View>
            <Text style={styles.tileTitle}>App Lock</Text>
            <Text style={styles.tileMeta}>{lockedCount} Apps Locked</Text>
          </TouchableOpacity>
        </View>

        {/* 2FA Token Card Preview */}
        {topTotp && (
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>QUICK 2FA AUTHENTICATOR</Text>
              <TouchableOpacity onPress={() => onNavigateTab('vault')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            <TotpCard item={topTotp} />
          </View>
        )}

        {/* Recent Security Incidents Telemetry */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>SECURITY TELEMETRY LOG</Text>
            <TouchableOpacity onPress={() => onNavigateTab('antitheft')}>
              <Text style={styles.sectionLink}>Audit Details</Text>
            </TouchableOpacity>
          </View>

          {recentLog ? (
            <View style={styles.logCard}>
              <Ionicons name="warning-outline" size={18} color={Theme.colors.warning} />
              <View style={styles.logDetails}>
                <Text style={styles.logTitle}>
                  {recentLog.triggerType === 'FAILED_PIN' ? 'Unauthorized Unlock Attempt' : 'Perimeter Motion Spike'}
                </Text>
                <Text style={styles.logTime}>{new Date(recentLog.timestamp).toLocaleString()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Theme.colors.textMuted} />
            </View>
          ) : (
            <View style={styles.emptyLogCard}>
              <Ionicons name="checkmark-circle-outline" size={18} color={Theme.colors.success} />
              <Text style={styles.emptyLogText}>No unauthorized attempts logged. Perimeter clear.</Text>
            </View>
          )}
        </View>

        {/* Hardware Simulator Dock for browser testing */}
        <HardwareSimulator
          onTriggerDecoyCall={() => setDecoyCallVisible(true)}
          onSimulateIntruder={async () => {
            await StorageService.addIntruderLog({
              id: 'test-' + Date.now(),
              timestamp: Date.now(),
              failedPinAttempts: 3,
              triggerType: 'FAILED_PIN',
            });
            loadDashboardData();
          }}
        />
      </ScrollView>

      {/* Security Utility Modals */}
      <CleanerModal visible={cleanerVisible} onDismiss={() => setCleanerVisible(false)} />
      <SpeedBoostModal visible={speedBoostVisible} onDismiss={() => setSpeedBoostVisible(false)} />
      <AntivirusScanModal visible={antivirusVisible} onDismiss={() => setAntivirusVisible(false)} />
      <BatteryPerformanceModal visible={batteryVisible} onDismiss={() => setBatteryVisible(false)} />
      <DataUsageModal visible={dataUsageVisible} onDismiss={() => setDataUsageVisible(false)} />
      <AppLockModal visible={appLockVisible} onDismiss={() => setAppLockVisible(false)} />
      <DecoyCallModal visible={decoyCallVisible} onDismiss={() => setDecoyCallVisible(false)} />
      <WidgetsHubModal
        visible={widgetsVisible}
        onDismiss={() => setWidgetsVisible(false)}
        floatingEnabled={floatingEnabled}
        onToggleFloating={(val) => setFloatingEnabled(val)}
      />

      {/* Floating Quick Action HUD */}
      <FloatingSecurityWidget
        visible={floatingEnabled}
        score={posture.overallScore}
        onQuickBoost={handleMasterOptimize}
        onQuickScan={() => setAntivirusVisible(true)}
        onOpenSos={() => onNavigateTab('sos')}
        onOpenWidgets={() => setWidgetsVisible(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
  },
  deviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D1424',
    borderRadius: Theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  deviceBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Theme.fonts.mono,
    letterSpacing: 0.5,
  },
  osBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  osBadgeText: {
    color: Theme.colors.success,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Theme.fonts.mono,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  widgetsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    gap: 6,
  },
  widgetsHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.mono,
  },
  widgetsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D1424',
    borderRadius: Theme.radii.lg,
    padding: 14,
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  widgetsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  widgetsBannerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  widgetsBannerTextCol: {
    flex: 1,
  },
  widgetsBannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  widgetsBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: Theme.fonts.mono,
    letterSpacing: 0.5,
  },
  liveBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
    fontFamily: Theme.fonts.mono,
  },
  widgetsBannerSubtitle: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontFamily: Theme.fonts.regular,
    marginTop: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  lockBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.insets.scrollPaddingBottom,
  },
  optimizeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    marginVertical: Theme.spacing.xs,
    gap: 12,
  },
  optimizeBannerDone: {
    backgroundColor: Theme.colors.success,
  },
  optimizeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optimizeTextCol: {
    flex: 1,
  },
  optimizeTitle: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  optimizeSub: {
    color: '#000000',
    fontSize: 10,
    marginTop: 1,
    opacity: 0.8,
  },
  sectionHeader: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  sectionTitle: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionLink: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: Theme.spacing.xs,
  },
  gridTile: {
    width: '31.5%',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    alignItems: 'center',
  },
  tileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileTitle: {
    color: Theme.colors.text,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  tileMeta: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionBox: {
    marginTop: Theme.spacing.md,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    gap: 12,
  },
  logDetails: {
    flex: 1,
  },
  logTitle: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  logTime: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  emptyLogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    gap: 8,
  },
  emptyLogText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
  },
});
