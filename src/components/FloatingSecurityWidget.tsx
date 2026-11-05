import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  score: number;
  onQuickBoost: () => void;
  onQuickScan: () => void;
  onOpenSos: () => void;
  onOpenWidgets: () => void;
}

export const FloatingSecurityWidget: React.FC<Props> = ({
  visible,
  score,
  onQuickBoost,
  onQuickScan,
  onOpenSos,
  onOpenWidgets,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const toggleExpand = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setExpanded(!expanded);
  };

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      {expanded && (
        <View style={styles.expandedDrawer}>
          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}
            onPress={() => {
              onQuickBoost();
              setExpanded(false);
            }}
          >
            <Ionicons name="flash" size={18} color={Theme.colors.accent} />
            <Text style={styles.quickActionText}>1-Tap Boost</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: 'rgba(0, 230, 118, 0.2)' }]}
            onPress={() => {
              onQuickScan();
              setExpanded(false);
            }}
          >
            <Ionicons name="shield-checkmark" size={18} color={Theme.colors.success} />
            <Text style={styles.quickActionText}>Quick Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: 'rgba(255, 59, 48, 0.2)' }]}
            onPress={() => {
              onOpenSos();
              setExpanded(false);
            }}
          >
            <Ionicons name="alert-circle" size={18} color={Theme.colors.danger} />
            <Text style={styles.quickActionText}>Panic SOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: 'rgba(0, 240, 255, 0.2)' }]}
            onPress={() => {
              onOpenWidgets();
              setExpanded(false);
            }}
          >
            <Ionicons name="grid-outline" size={18} color={Theme.colors.primary} />
            <Text style={styles.quickActionText}>All Widgets</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Pill Trigger */}
      <TouchableOpacity
        style={[styles.floatingPill, expanded && styles.floatingPillActive]}
        onPress={toggleExpand}
        activeOpacity={0.85}
      >
        <View style={styles.pillIconCircle}>
          <Ionicons
            name={expanded ? 'close' : 'shield-half'}
            size={18}
            color={expanded ? '#000000' : Theme.colors.primary}
          />
        </View>
        <Text style={[styles.pillScore, expanded && styles.pillScoreActive]}>{score}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 9999,
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1424',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    gap: 6,
    ...(Platform.OS === 'web' ? ({ pointerEvents: 'auto' } as any) : {}),
  },
  floatingPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: '#FFFFFF',
  },
  pillIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillScore: {
    fontSize: 13,
    fontWeight: '900',
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.mono,
    marginRight: 4,
  },
  pillScoreActive: {
    color: '#000000',
  },
  expandedDrawer: {
    backgroundColor: '#090D16',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    padding: 8,
    marginBottom: 10,
    width: 150,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    ...(Platform.OS === 'web' ? ({ pointerEvents: 'auto' } as any) : {}),
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.text,
    fontFamily: Theme.fonts.mono,
  },
});
