import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  floatingEnabled: boolean;
  onToggleFloating: (val: boolean) => void;
}

export const WidgetsHubModal: React.FC<Props> = ({
  visible,
  onDismiss,
  floatingEnabled,
  onToggleFloating,
}) => {
  const [sizeFilter, setSizeFilter] = useState<'all' | 'compact' | 'wide'>('all');

  // Widget 1: Boost & Clean State
  const [boosted, setBoosted] = useState(false);
  const [boosting, setBoosting] = useState(false);

  // Widget 2: Shield Scan State
  const [scanning, setScanning] = useState(false);
  const [scannedDone, setScannedDone] = useState(false);

  // Widget 3: Battery Profile State
  const [powerProfile, setPowerProfile] = useState<'saver' | 'balanced' | 'performance' | 'ultra'>('balanced');

  // Widget 4: SOS Siren State
  const [sirenActive, setSirenActive] = useState(false);

  // Widget 5: 2FA State
  const [totpCountdown, setTotpCountdown] = useState(24);
  const [copiedToast, setCopiedToast] = useState(false);

  // Widget 6: Firewall State
  const [firewallActive, setFirewallActive] = useState(true);

  // TOTP countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTotpCountdown((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleWidgetBoost = async () => {
    setBoosting(true);
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }
    setTimeout(() => {
      setBoosting(false);
      setBoosted(true);
      setTimeout(() => setBoosted(false), 4000);
    }, 1200);
  };

  const handleWidgetScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScannedDone(true);
      setTimeout(() => setScannedDone(false), 3500);
    }, 1500);
  };

  const handleCopyTotp = async () => {
    await Clipboard.setStringAsync('482910');
    setCopiedToast(true);
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onDismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onDismiss} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>SECURITY WIDGETS HUB</Text>
            <Text style={styles.headerSubtitle}>Interactive home screen widgets & floating tools</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Mini Widget Toggle Card */}
        <View style={styles.floatingToggleCard}>
          <View style={styles.floatingToggleInfo}>
            <View style={styles.floatingIconCircle}>
              <Ionicons name="layers-outline" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.floatingTextCol}>
              <Text style={styles.floatingTitle}>Floating Quick-Action HUD</Text>
              <Text style={styles.floatingSubtitle}>
                Overlay persistent shield pill on device screen
              </Text>
            </View>
          </View>
          <Switch
            value={floatingEnabled}
            onValueChange={onToggleFloating}
            trackColor={{ false: '#374151', true: Theme.colors.primary }}
            thumbColor={floatingEnabled ? '#000' : '#f4f3f4'}
          />
        </View>

        {/* Widget Size Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, sizeFilter === 'all' && styles.filterTabActive]}
            onPress={() => setSizeFilter('all')}
          >
            <Text style={[styles.filterTabText, sizeFilter === 'all' && styles.filterTabTextActive]}>
              All Widgets (6)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, sizeFilter === 'compact' && styles.filterTabActive]}
            onPress={() => setSizeFilter('compact')}
          >
            <Text
              style={[
                styles.filterTabText,
                sizeFilter === 'compact' && styles.filterTabTextActive,
              ]}
            >
              Compact (2x2)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, sizeFilter === 'wide' && styles.filterTabActive]}
            onPress={() => setSizeFilter('wide')}
          >
            <Text style={[styles.filterTabText, sizeFilter === 'wide' && styles.filterTabTextActive]}>
              Wide (4x2)
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* ============================================================== */}
          {/* WIDGET 1: 1-Tap Speed Boost & Junk Cleaner Widget              */}
          {/* ============================================================== */}
          {(sizeFilter === 'all' || sizeFilter === 'wide') && (
            <View style={styles.widgetWrapper}>
              <View style={styles.widgetMetaRow}>
                <Text style={styles.widgetTag}>4x2 WIDE WIDGET</Text>
                <Text style={styles.widgetName}>1-Tap Master Booster</Text>
              </View>

              <View style={[styles.widgetBox, styles.widgetBoxWide]}>
                <View style={styles.widgetTopRow}>
                  <View style={styles.widgetHeaderLeft}>
                    <Ionicons name="flash" size={18} color={Theme.colors.accent} />
                    <Text style={styles.widgetCardTitle}>RAM & CACHE SENTRY</Text>
                  </View>
                  <Text style={styles.widgetLiveStatus}>
                    {boosted ? '100% OPTIMAL' : '68% USED'}
                  </Text>
                </View>

                <View style={styles.boosterStatsRow}>
                  <View style={styles.boosterStatCol}>
                    <Text style={styles.boosterStatVal}>
                      {boosted ? '0 MB' : '1.74 GB'}
                    </Text>
                    <Text style={styles.boosterStatLabel}>Junk Cache</Text>
                  </View>
                  <View style={styles.boosterStatDivider} />
                  <View style={styles.boosterStatCol}>
                    <Text style={styles.boosterStatVal}>
                      {boosted ? '3.19 GB Free' : '1.77 GB Free'}
                    </Text>
                    <Text style={styles.boosterStatLabel}>RAM Available (6 GB)</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.widgetActionBtn, boosted && styles.widgetActionBtnDone]}
                  onPress={handleWidgetBoost}
                  disabled={boosting}
                >
                  {boosting ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={boosted ? 'checkmark-circle' : 'rocket-outline'}
                        size={16}
                        color="#000"
                      />
                      <Text style={styles.widgetActionBtnText}>
                        {boosted ? 'CLEANED & BOOSTED' : '1-TAP SPEED BOOST'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* WIDGET 2: Security Threat & Posture Radar Widget               */}
          {/* ============================================================== */}
          {(sizeFilter === 'all' || sizeFilter === 'compact') && (
            <View style={styles.widgetWrapper}>
              <View style={styles.widgetMetaRow}>
                <Text style={styles.widgetTag}>2x2 COMPACT WIDGET</Text>
                <Text style={styles.widgetName}>Security Posture Shield</Text>
              </View>

              <View style={[styles.widgetBox, styles.widgetBoxCompact]}>
                <View style={styles.compactShieldCircle}>
                  <Ionicons
                    name="shield-checkmark"
                    size={28}
                    color={scannedDone ? Theme.colors.success : Theme.colors.primary}
                  />
                  <Text style={styles.compactScoreText}>
                    {scannedDone ? '100' : '98'}
                  </Text>
                </View>
                <Text style={styles.compactTitle}>
                  {scanning ? 'SCANNING...' : scannedDone ? '0 THREATS' : 'SHIELD ACTIVE'}
                </Text>
                <Text style={styles.compactSub}>Wi-Fi & App Safe</Text>

                <TouchableOpacity
                  style={styles.compactActionBtn}
                  onPress={handleWidgetScan}
                  disabled={scanning}
                >
                  {scanning ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.compactActionText}>
                      {scannedDone ? 'VERIFIED' : 'SCAN NOW'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* WIDGET 3: Battery & Thermal Endurance Widget                   */}
          {/* ============================================================== */}
          {(sizeFilter === 'all' || sizeFilter === 'wide') && (
            <View style={styles.widgetWrapper}>
              <View style={styles.widgetMetaRow}>
                <Text style={styles.widgetTag}>4x2 WIDE WIDGET</Text>
                <Text style={styles.widgetName}>Battery & Thermal Health</Text>
              </View>

              <View style={[styles.widgetBox, styles.widgetBoxWide]}>
                <View style={styles.widgetTopRow}>
                  <View style={styles.widgetHeaderLeft}>
                    <Ionicons name="battery-charging" size={18} color={Theme.colors.warning} />
                    <Text style={styles.widgetCardTitle}>BATTERY & POWER PROFILE</Text>
                  </View>
                  <Text style={styles.widgetLiveStatus}>34.4°C • OPTIMAL</Text>
                </View>

                <View style={styles.batteryRow}>
                  <Text style={styles.batteryPercent}>100%</Text>
                  <View style={styles.batteryBarCol}>
                    <View style={styles.batteryBarBg}>
                      <View style={[styles.batteryBarFill, { width: '100%' }]} />
                    </View>
                    <Text style={styles.batteryEstimate}>Estimated: 22 hrs 25 mins • AC Fast Charge</Text>
                  </View>
                </View>

                {/* Interactive Profile Switcher */}
                <View style={styles.profileSwitcherRow}>
                  {(['saver', 'balanced', 'performance', 'ultra'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.profileBtn,
                        powerProfile === mode && styles.profileBtnActive,
                      ]}
                      onPress={() => setPowerProfile(mode)}
                    >
                      <Text
                        style={[
                          styles.profileBtnText,
                          powerProfile === mode && styles.profileBtnTextActive,
                        ]}
                      >
                        {mode.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* WIDGET 4: Quick Emergency SOS Panic Widget                     */}
          {/* ============================================================== */}
          {(sizeFilter === 'all' || sizeFilter === 'compact') && (
            <View style={styles.widgetWrapper}>
              <View style={styles.widgetMetaRow}>
                <Text style={styles.widgetTag}>2x2 COMPACT WIDGET</Text>
                <Text style={styles.widgetName}>Emergency SOS Beacon</Text>
              </View>

              <View style={[styles.widgetBox, styles.widgetBoxCompact, styles.widgetBoxSos]}>
                <View style={styles.compactSosCircle}>
                  <Ionicons name="alert-circle" size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.compactSosTitle}>PANIC SOS</Text>
                <Text style={styles.compactSosSub}>Instant Distress Dispatch</Text>

                <TouchableOpacity
                  style={[
                    styles.compactActionBtn,
                    { backgroundColor: sirenActive ? '#FFFFFF' : Theme.colors.danger },
                  ]}
                  onPress={() => setSirenActive(!sirenActive)}
                >
                  <Text
                    style={[
                      styles.compactActionText,
                      { color: sirenActive ? Theme.colors.danger : '#FFFFFF' },
                    ]}
                  >
                    {sirenActive ? 'SIREN ON' : 'TEST SIREN'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* WIDGET 5: 2FA Live Token Authenticator Widget                  */}
          {/* ============================================================== */}
          {(sizeFilter === 'all' || sizeFilter === 'wide') && (
            <View style={styles.widgetWrapper}>
              <View style={styles.widgetMetaRow}>
                <Text style={styles.widgetTag}>4x2 WIDE WIDGET</Text>
                <Text style={styles.widgetName}>2FA Live Token Authenticator</Text>
              </View>

              <View style={[styles.widgetBox, styles.widgetBoxWide]}>
                <View style={styles.widgetTopRow}>
                  <View style={styles.widgetHeaderLeft}>
                    <Ionicons name="key" size={18} color={Theme.colors.primary} />
                    <Text style={styles.widgetCardTitle}>GitHub (sentinel-admin)</Text>
                  </View>
                  <View style={styles.countdownPill}>
                    <Ionicons name="time-outline" size={14} color={Theme.colors.primary} />
                    <Text style={styles.countdownText}>{totpCountdown}s</Text>
                  </View>
                </View>

                <View style={styles.totpDisplayRow}>
                  <Text style={styles.totpToken}>482 910</Text>
                  <TouchableOpacity
                    style={[styles.copyBtn, copiedToast && styles.copyBtnSuccess]}
                    onPress={handleCopyTotp}
                  >
                    <Ionicons
                      name={copiedToast ? 'checkmark' : 'copy-outline'}
                      size={16}
                      color="#000"
                    />
                    <Text style={styles.copyBtnText}>{copiedToast ? 'COPIED' : 'COPY'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.totpProgressBarBg}>
                  <View
                    style={[
                      styles.totpProgressBarFill,
                      { width: `${(totpCountdown / 30) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* WIDGET 6: Data Traffic & Firewall Meter Widget                 */}
          {/* ============================================================== */}
          {(sizeFilter === 'all' || sizeFilter === 'wide') && (
            <View style={styles.widgetWrapper}>
              <View style={styles.widgetMetaRow}>
                <Text style={styles.widgetTag}>4x2 WIDE WIDGET</Text>
                <Text style={styles.widgetName}>Cellular Data & Firewall</Text>
              </View>

              <View style={[styles.widgetBox, styles.widgetBoxWide]}>
                <View style={styles.widgetTopRow}>
                  <View style={styles.widgetHeaderLeft}>
                    <Ionicons name="cellular" size={18} color={Theme.colors.primary} />
                    <Text style={styles.widgetCardTitle}>MONTHLY TRAFFIC CYCLE</Text>
                  </View>
                  <Text style={styles.widgetLiveStatus}>
                    {firewallActive ? 'FIREWALL ON' : 'UNRESTRICTED'}
                  </Text>
                </View>

                <View style={styles.dataMeterRow}>
                  <View style={styles.dataMeterCol}>
                    <Text style={styles.dataMeterVal}>14.6 GB</Text>
                    <Text style={styles.dataMeterSub}>Consumed / 30 GB</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.firewallToggleBtn,
                      firewallActive && styles.firewallToggleBtnActive,
                    ]}
                    onPress={() => setFirewallActive(!firewallActive)}
                  >
                    <Ionicons
                      name={firewallActive ? 'shield-checkmark' : 'shield-outline'}
                      size={16}
                      color={firewallActive ? '#000' : Theme.colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.firewallToggleText,
                        firewallActive && styles.firewallToggleTextActive,
                      ]}
                    >
                      {firewallActive ? 'SAVER ACTIVE' : 'ENABLE SAVER'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dataProgressBg}>
                  <View style={[styles.dataProgressFill, { width: '48%' }]} />
                </View>
              </View>
            </View>
          )}

          {/* Android Home Screen Setup Instructions */}
          <View style={styles.instructionsBox}>
            <View style={styles.instructionHeader}>
              <Ionicons name="phone-portrait-outline" size={20} color={Theme.colors.primary} />
              <Text style={styles.instructionTitle}>HOW TO ADD TO ANDROID HOME SCREEN</Text>
            </View>
            <Text style={styles.instructionText}>
              1. Long-press any empty space on your Android home screen.
            </Text>
            <Text style={styles.instructionText}>
              2. Tap 'Widgets' from the bottom menu.
            </Text>
            <Text style={styles.instructionText}>
              3. Scroll down and find 'Sentinel Mobile'.
            </Text>
            <Text style={styles.instructionText}>
              4. Drag your preferred widget (1-Tap Booster, Shield Radar, Battery, SOS) to your home grid.
            </Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : (RNStatusBar.currentHeight || 38) + 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
    backgroundColor: Theme.colors.surface,
  },
  backBtn: {
    padding: 6,
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.mono,
    fontWeight: '800',
    color: Theme.colors.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Theme.fonts.mono,
  },
  floatingToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  floatingToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  floatingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  floatingTextCol: {
    flex: 1,
  },
  floatingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
    fontFamily: Theme.fonts.mono,
  },
  floatingSubtitle: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontFamily: Theme.fonts.regular,
    marginTop: 2,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  filterTabActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: Theme.colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontFamily: Theme.fonts.mono,
  },
  filterTabTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 60 : 40,
  },
  widgetWrapper: {
    marginBottom: 20,
  },
  widgetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  widgetTag: {
    fontSize: 11,
    fontFamily: Theme.fonts.mono,
    color: Theme.colors.primary,
    letterSpacing: 0.5,
  },
  widgetName: {
    fontSize: 12,
    fontFamily: Theme.fonts.mono,
    color: Theme.colors.textMuted,
  },
  widgetBox: {
    backgroundColor: '#0D1424',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  widgetBoxWide: {
    width: '100%',
  },
  widgetBoxCompact: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  widgetBoxSos: {
    borderColor: 'rgba(255, 59, 48, 0.35)',
    backgroundColor: '#160B0E',
  },
  widgetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  widgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  widgetCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.text,
    fontFamily: Theme.fonts.mono,
    letterSpacing: 0.5,
  },
  widgetLiveStatus: {
    fontSize: 11,
    color: Theme.colors.success,
    fontFamily: Theme.fonts.mono,
    fontWeight: '700',
  },
  boosterStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    marginBottom: 12,
  },
  boosterStatCol: {
    alignItems: 'center',
  },
  boosterStatVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: Theme.fonts.mono,
  },
  boosterStatLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontFamily: Theme.fonts.regular,
    marginTop: 2,
  },
  boosterStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  widgetActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  widgetActionBtnDone: {
    backgroundColor: Theme.colors.success,
  },
  widgetActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    fontFamily: Theme.fonts.mono,
    letterSpacing: 0.5,
  },
  compactShieldCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  compactScoreText: {
    position: 'absolute',
    bottom: -6,
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.text,
    backgroundColor: '#0D1424',
    paddingHorizontal: 6,
    borderRadius: 4,
    fontFamily: Theme.fonts.mono,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: Theme.fonts.mono,
  },
  compactSub: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  compactActionBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  compactActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    fontFamily: Theme.fonts.mono,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  batteryPercent: {
    fontSize: 26,
    fontWeight: '900',
    color: Theme.colors.warning,
    fontFamily: Theme.fonts.mono,
  },
  batteryBarCol: {
    flex: 1,
  },
  batteryBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  batteryBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.warning,
    borderRadius: 4,
  },
  batteryEstimate: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontFamily: Theme.fonts.mono,
  },
  profileSwitcherRow: {
    flexDirection: 'row',
    gap: 6,
  },
  profileBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileBtnActive: {
    backgroundColor: 'rgba(255, 179, 0, 0.2)',
    borderColor: Theme.colors.warning,
  },
  profileBtnText: {
    fontSize: 10,
    fontFamily: Theme.fonts.mono,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  profileBtnTextActive: {
    color: Theme.colors.warning,
  },
  compactSosCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  compactSosTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Theme.fonts.mono,
    letterSpacing: 1,
  },
  compactSosSub: {
    fontSize: 11,
    color: '#FFBABA',
    marginTop: 2,
    marginBottom: 14,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  countdownText: {
    fontSize: 11,
    fontFamily: Theme.fonts.mono,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  totpDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totpToken: {
    fontSize: 28,
    fontWeight: '900',
    color: Theme.colors.text,
    fontFamily: Theme.fonts.mono,
    letterSpacing: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  copyBtnSuccess: {
    backgroundColor: Theme.colors.success,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    fontFamily: Theme.fonts.mono,
  },
  totpProgressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  totpProgressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
  },
  dataMeterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dataMeterCol: {},
  dataMeterVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: Theme.fonts.mono,
  },
  dataMeterSub: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontFamily: Theme.fonts.regular,
  },
  firewallToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  firewallToggleBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  firewallToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    fontFamily: Theme.fonts.mono,
  },
  firewallToggleTextActive: {
    color: '#000000',
  },
  dataProgressBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dataProgressFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
  },
  instructionsBox: {
    marginTop: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.15)',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  instructionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.mono,
    letterSpacing: 0.5,
  },
  instructionText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontFamily: Theme.fonts.regular,
    lineHeight: 18,
    marginBottom: 4,
  },
});
