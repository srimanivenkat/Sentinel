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
import { OptimizerService, ProcessItem } from '../services/optimizer';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export const SpeedBoostModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const [processes, setProcesses] = useState<ProcessItem[]>(OptimizerService.getRunningProcesses());
  const [boosting, setBoosting] = useState(false);
  const [boostedMemoryMb, setBoostedMemoryMb] = useState<number | null>(null);
  const memStats = OptimizerService.getMemoryStats();

  const toggleSelect = (id: string) => {
    setProcesses((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const selectedMemoryMb = processes
    .filter((p) => p.selected)
    .reduce((acc, p) => acc + p.memoryMb, 0);

  const handleBoost = () => {
    setBoosting(true);
    const reclaimed = selectedMemoryMb;
    setTimeout(() => {
      setBoosting(false);
      setBoostedMemoryMb(reclaimed);
      setProcesses((prev) => prev.filter((p) => !p.selected));
    }, 1500);
  };

  const handleClose = () => {
    setBoostedMemoryMb(null);
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
            <Text style={styles.title}>SPEED BOOST</Text>
            <Text style={styles.sub}>MIUI-Style Background RAM & Memory Optimizer</Text>
          </View>
        </View>

        {boostedMemoryMb ? (
          <View style={styles.successBox}>
            <View style={styles.rocketCircle}>
              <Ionicons name="flash" size={48} color={Theme.colors.primary} />
            </View>
            <Text style={styles.successTitle}>
              {boostedMemoryMb > 1024
                ? (boostedMemoryMb / 1024).toFixed(2) + ' GB'
                : boostedMemoryMb + ' MB'}{' '}
              RAM Released!
            </Text>
            <Text style={styles.successSub}>
              Background tasks terminated. Memory reclaimed and CPU responsiveness restored.
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
              <Text style={styles.doneBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Speedometer Hero */}
            <View style={styles.heroBox}>
              <View style={styles.ramMeterCircle}>
                <Text style={styles.ramPercent}>{memStats.usedPercent}%</Text>
                <Text style={styles.ramLabel}>RAM USED</Text>
              </View>
              <Text style={styles.heroSummary}>
                {memStats.usedGb} GB / {memStats.totalGb} GB Used • Reclaim {selectedMemoryMb} MB
              </Text>
            </View>

            {/* Background apps list */}
            <ScrollView style={styles.scrollList}>
              <Text style={styles.listSectionHeader}>
                BACKGROUND PROCESSES ({processes.length})
              </Text>

              {processes.map((proc) => (
                <TouchableOpacity
                  key={proc.id}
                  style={[styles.procRow, proc.selected && styles.procRowSelected]}
                  onPress={() => toggleSelect(proc.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={proc.selected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={proc.selected ? Theme.colors.primary : Theme.colors.textMuted}
                  />
                  <View style={styles.procInfo}>
                    <Text style={styles.procName}>{proc.name}</Text>
                    <Text style={styles.procPkg}>{proc.packageName}</Text>
                  </View>
                  <View style={styles.procMeta}>
                    <Text style={styles.procMem}>{proc.memoryMb} MB</Text>
                    <Text style={styles.procCpu}>{proc.cpuPercent}% CPU</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {processes.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="sparkles" size={40} color={Theme.colors.success} />
                  <Text style={styles.emptyText}>RAM is optimized! No memory-hungry apps found.</Text>
                </View>
              )}
            </ScrollView>

            {/* Boost Button */}
            {processes.length > 0 && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.boostBtn, selectedMemoryMb === 0 && styles.boostBtnDisabled]}
                  onPress={handleBoost}
                  disabled={selectedMemoryMb === 0 || boosting}
                >
                  {boosting ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <>
                      <Ionicons name="flash-outline" size={18} color="#000000" />
                      <Text style={styles.boostBtnText}>
                        Boost Speed ({selectedMemoryMb} MB)
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
    paddingVertical: 24,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
  },
  ramMeterCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    marginBottom: 10,
  },
  ramPercent: {
    color: Theme.colors.primary,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Theme.typography.fontFamily.mono,
  },
  ramLabel: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },
  heroSummary: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollList: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  listSectionHeader: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  procRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    gap: 10,
  },
  procRowSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  procInfo: {
    flex: 1,
  },
  procName: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  procPkg: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: Theme.typography.fontFamily.mono,
    marginTop: 2,
  },
  procMeta: {
    alignItems: 'flex-end',
  },
  procMem: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily.mono,
  },
  procCpu: {
    color: Theme.colors.textMuted,
    fontSize: 10,
  },
  footer: {
    padding: Theme.spacing.md,
    paddingBottom: Platform.OS === 'android' ? 28 : (Platform.OS === 'ios' ? 24 : 16),
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surfaceBorder,
    backgroundColor: Theme.colors.surface,
  },
  boostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.radii.md,
  },
  boostBtnDisabled: {
    opacity: 0.5,
  },
  boostBtnText: {
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
  rocketCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.primary,
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
    backgroundColor: Theme.colors.primary,
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
