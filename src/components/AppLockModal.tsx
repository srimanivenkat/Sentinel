import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Theme } from '../theme/theme';
import { OptimizerService, AppLockItem } from '../services/optimizer';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export const AppLockModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const [apps, setApps] = useState<AppLockItem[]>(OptimizerService.getAppLockItems());
  const [search, setSearch] = useState('');

  const toggleLock = (id: string) => {
    setApps((prev) =>
      prev.map((app) => (app.id === id ? { ...app, isLocked: !app.isLocked } : app))
    );
  };

  const filteredApps = apps.filter(
    (a) =>
      a.appName.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  const lockedCount = apps.filter((a) => a.isLocked).length;

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
            <Text style={styles.title}>APP LOCK & PRIVACY</Text>
            <Text style={styles.sub}>MIUI-Style Biometric / PIN App Protection</Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroBox}>
          <Ionicons name="lock-closed" size={32} color={Theme.colors.primary} />
          <Text style={styles.heroTitle}>{lockedCount} Apps Locked</Text>
          <Text style={styles.heroSub}>
            Protected by Sentinel Master PIN and Hardware Biometrics
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={Theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search installed applications..."
            placeholderTextColor={Theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Apps List */}
        <ScrollView style={styles.scrollList}>
          {filteredApps.map((app) => (
            <View key={app.id} style={styles.appRow}>
              <View style={styles.appIconCircle}>
                <Ionicons name={app.icon as any} size={20} color={Theme.colors.primary} />
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{app.appName}</Text>
                <Text style={styles.appCategory}>{app.category}</Text>
              </View>

              <Switch
                value={app.isLocked}
                onValueChange={() => toggleLock(app.id)}
                trackColor={{ false: Theme.colors.surfaceBorder, true: Theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
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
  heroBox: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
    gap: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  heroSub: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    margin: Theme.spacing.md,
    paddingHorizontal: 12,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: Theme.colors.text,
    fontSize: 12,
  },
  scrollList: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Platform.OS === 'android' ? 60 : 40,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    gap: 12,
  },
  appIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    color: Theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  appCategory: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});
