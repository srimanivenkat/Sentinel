import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Theme } from '../theme/theme';
import { OptimizerService, JunkItem } from '../services/optimizer';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export const CleanerModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const [junkList, setJunkList] = useState<JunkItem[]>(OptimizerService.getJunkItems());
  const [cleaning, setCleaning] = useState(false);
  const [cleanedTotal, setCleanedTotal] = useState<string | null>(null);
  const storageStats = OptimizerService.getStorageStats();

  const toggleSelect = (id: string) => {
    setJunkList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const selectedBytes = junkList
    .filter((j) => j.selected)
    .reduce((acc, j) => acc + j.sizeBytes, 0);

  const handleClean = () => {
    setCleaning(true);
    const cleanedSizeStr = OptimizerService.formatBytes(selectedBytes);
    setTimeout(() => {
      setCleaning(false);
      setCleanedTotal(cleanedSizeStr);
      setJunkList((prev) => prev.filter((item) => !item.selected));
    }, 1600);
  };

  const handleClose = () => {
    setCleanedTotal(null);
    onDismiss();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>JUNK CLEANER</Text>
            <Text style={styles.sub}>MIUI-Style Storage Cache & Deep Clean</Text>
          </View>
        </View>

        {cleanedTotal ? (
          <View style={styles.successBox}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done" size={48} color={Theme.colors.success} />
            </View>
            <Text style={styles.successTitle}>{cleanedTotal} Junk Cleaned!</Text>
            <Text style={styles.successSub}>
              Device storage reclaimed. System cache and obsolete temporary files removed.
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
              <Text style={styles.doneBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Total Size Hero */}
            <View style={styles.heroBox}>
              <Text style={styles.heroSize}>{OptimizerService.formatBytes(selectedBytes)}</Text>
              <Text style={styles.heroSub}>Safe to clean from internal storage</Text>
              <View style={styles.storagePill}>
                <Ionicons name="server-outline" size={13} color={Theme.colors.primary} />
                <Text style={styles.storagePillText}>
                  {storageStats.usedGb} GB used of {storageStats.totalGb} GB • {storageStats.freeGb} GB Free ({storageStats.usedPercent}% Used)
                </Text>
              </View>
            </View>

            {/* Checklist */}
            <ScrollView style={styles.scrollList}>
              {junkList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemRow, item.selected && styles.itemRowSelected]}
                  onPress={() => toggleSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.selected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={item.selected ? Theme.colors.primary : Theme.colors.textMuted}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPath}>{item.path}</Text>
                  </View>
                  <Text style={styles.itemSize}>{OptimizerService.formatBytes(item.sizeBytes)}</Text>
                </TouchableOpacity>
              ))}

              {junkList.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="sparkles" size={40} color={Theme.colors.success} />
                  <Text style={styles.emptyText}>Storage is clean! Zero junk files found.</Text>
                </View>
              )}
            </ScrollView>

            {/* Clean Button */}
            {junkList.length > 0 && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.cleanBtn, selectedBytes === 0 && styles.cleanBtnDisabled]}
                  onPress={handleClean}
                  disabled={selectedBytes === 0 || cleaning}
                >
                  {cleaning ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <>
                      <Ionicons name="trash-bin-outline" size={18} color="#000000" />
                      <Text style={styles.cleanBtnText}>
                        Clean {OptimizerService.formatBytes(selectedBytes)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
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
    paddingVertical: 30,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
  },
  heroSize: {
    color: Theme.colors.primary,
    fontSize: 42,
    fontWeight: '900',
    fontFamily: Theme.typography.fontFamily.mono,
  },
  heroSub: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  storagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  storagePillText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontFamily: Theme.typography.fontFamily.mono,
  },
  scrollList: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    gap: 12,
  },
  itemRowSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: Theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  itemPath: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: Theme.typography.fontFamily.mono,
    marginTop: 2,
  },
  itemSize: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily.mono,
  },
  footer: {
    padding: Theme.spacing.md,
    paddingBottom: Platform.OS === 'android' ? 28 : (Platform.OS === 'ios' ? 24 : 16),
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surfaceBorder,
    backgroundColor: Theme.colors.surface,
  },
  cleanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.radii.md,
  },
  cleanBtnDisabled: {
    opacity: 0.5,
  },
  cleanBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  successBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.success,
    marginBottom: 10,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSub: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  doneBtn: {
    marginTop: 20,
    backgroundColor: Theme.colors.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Theme.radii.md,
  },
  doneBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
  },
});
