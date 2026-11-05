import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  StatusBar as RNStatusBar,
  LogBox,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import { Theme } from './src/theme/theme';
import { AuthLockScreen } from './src/screens/AuthLockScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { EmergencySosScreen } from './src/screens/EmergencySosScreen';
import { AntiTheftScreen } from './src/screens/AntiTheftScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { NetworkAuditorScreen } from './src/screens/NetworkAuditorScreen';
import { SensorService } from './src/services/sensors';
import { EmergencyService } from './src/services/emergency';
import { Ionicons } from '@expo/vector-icons';

// Suppress dev yellow/red LogBox banners from covering mobile screen UI
LogBox.ignoreAllLogs(true);

type TabName = 'dashboard' | 'sos' | 'antitheft' | 'vault' | 'network';

const ANDROID_STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? (RNStatusBar.currentHeight || 38) : 0;

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabName>('dashboard');
  const lastBackPressRef = useRef(0);

  useEffect(() => {
    const onBackPress = () => {
      if (isLocked) {
        return false; // allow default OS behavior on lock screen
      }

      if (currentTab !== 'dashboard') {
        setCurrentTab('dashboard');
        return true; // handled: return to dashboard rather than exiting app
      }

      // On dashboard: double-tap back within 2 seconds to exit
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPressRef.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      }
      return true;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backSubscription.remove();
  }, [isLocked, currentTab]);

  useEffect(() => {
    // Configure background Shake-to-SOS listener
    SensorService.setShakeSosHandler(() => {
      EmergencyService.startSiren();
      setCurrentTab('sos');
      if (Platform.OS !== 'web') {
        Alert.alert('🚨 SHAKE DETECTED', 'Emergency SOS mode activated!');
      }
    });

    return () => {
      SensorService.setShakeSosHandler(null);
    };
  }, []);

  if (isLocked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <RNStatusBar
          barStyle="light-content"
          {...({
            backgroundColor: Theme.colors.background,
            translucent: true,
          } as any)}
        />
        <View style={styles.webWrapper}>
          <AuthLockScreen onUnlockSuccess={() => setIsLocked(false)} />
        </View>
      </SafeAreaView>
    );
  }

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardScreen
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onLockApp={() => setIsLocked(true)}
          />
        );
      case 'sos':
        return <EmergencySosScreen />;
      case 'antitheft':
        return <AntiTheftScreen />;
      case 'vault':
        return <VaultScreen />;
      case 'network':
        return <NetworkAuditorScreen />;
      default:
        return (
          <DashboardScreen
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onLockApp={() => setIsLocked(true)}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <RNStatusBar
        barStyle="light-content"
        {...({
          backgroundColor: Theme.colors.background,
          translucent: true,
        } as any)}
      />
      <View style={styles.webWrapper}>
        {/* Active Screen Body */}
        <View style={styles.screenContainer}>{renderActiveScreen()}</View>

        {/* Tactical Bottom Navigation Bar */}
        <View style={styles.bottomTabBar}>
          {/* Dashboard */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('dashboard')}
          >
            <Ionicons
              name={currentTab === 'dashboard' ? 'shield-half' : 'shield-outline'}
              size={20}
              color={currentTab === 'dashboard' ? Theme.colors.primary : Theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'dashboard' && styles.tabLabelActive,
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          {/* Emergency SOS */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('sos')}
          >
            <View style={styles.sosIconWrap}>
              <Ionicons
                name={currentTab === 'sos' ? 'warning' : 'warning-outline'}
                size={22}
                color={Theme.colors.danger}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: Theme.colors.danger },
                currentTab === 'sos' && { fontWeight: '900' },
              ]}
            >
              SOS Hub
            </Text>
          </TouchableOpacity>

          {/* Haven Sentry Anti-Theft */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('antitheft')}
          >
            <Ionicons
              name={currentTab === 'antitheft' ? 'radio' : 'radio-outline'}
              size={20}
              color={currentTab === 'antitheft' ? Theme.colors.primary : Theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'antitheft' && styles.tabLabelActive,
              ]}
            >
              Sentry
            </Text>
          </TouchableOpacity>

          {/* 2FA Vault */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('vault')}
          >
            <Ionicons
              name={currentTab === 'vault' ? 'key' : 'key-outline'}
              size={20}
              color={currentTab === 'vault' ? Theme.colors.primary : Theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'vault' && styles.tabLabelActive,
              ]}
            >
              Vault
            </Text>
          </TouchableOpacity>

          {/* Network Auditor */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentTab('network')}
          >
            <Ionicons
              name={currentTab === 'network' ? 'wifi' : 'wifi-outline'}
              size={20}
              color={currentTab === 'network' ? Theme.colors.primary : Theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                currentTab === 'network' && styles.tabLabelActive,
              ]}
            >
              Auditor
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: ANDROID_STATUS_BAR_HEIGHT,
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
    backgroundColor: Theme.colors.background,
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: Theme.colors.surfaceBorder,
    shadowColor: '#00F0FF',
    shadowOpacity: Platform.OS === 'web' ? 0.08 : 0,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
  },
  screenContainer: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'android' ? 68 : 62,
    backgroundColor: Theme.colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.tabBarBorder,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'android' ? 10 : (Platform.OS === 'ios' ? 14 : 4),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sosIconWrap: {
    marginTop: -4,
  },
  tabLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '700',
    marginTop: 2,
  },
  tabLabelActive: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },
});
