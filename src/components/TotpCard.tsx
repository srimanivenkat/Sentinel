import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../theme/theme';
import { TotpItem } from '../types/security';
import { TotpService } from '../services/totp';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  item: TotpItem;
  onDelete?: (id: string) => void;
}

export const TotpCard: React.FC<Props> = ({ item, onDelete }) => {
  const [code, setCode] = useState('000000');
  const [remaining, setRemaining] = useState(30);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(true);

  useEffect(() => {
    const update = () => {
      const c = TotpService.generateCode(item.secret, {
        period: item.period || 30,
        digits: item.digits || 6,
        algorithm: item.algorithm || 'SHA1',
      });
      setCode(c);
      setRemaining(TotpService.getRemainingSeconds(item.period || 30));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [item]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedCode =
    code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;

  // Color transitions as timer runs down: green -> amber -> red in last 5s
  let ringColor = Theme.colors.success;
  if (remaining <= 5) {
    ringColor = Theme.colors.danger;
  } else if (remaining <= 10) {
    ringColor = Theme.colors.warning;
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.issuerRow}>
          <View style={styles.issuerIcon}>
            <Ionicons name="key-outline" size={16} color={Theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.issuerText}>{item.issuer || 'Authenticator'}</Text>
            <Text style={styles.accountText}>{item.account}</Text>
          </View>
        </View>

        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.codeRow}>
        <TouchableOpacity
          style={styles.codeWrapper}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          <Text style={[styles.codeText, { color: ringColor }]}>
            {showCode ? formattedCode : '••••••'}
          </Text>
          <View style={styles.copyBadge}>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={14}
              color={copied ? Theme.colors.success : Theme.colors.textSecondary}
            />
            <Text style={[styles.copyBadgeText, copied && { color: Theme.colors.success }]}>
              {copied ? 'COPIED' : 'TAP TO COPY'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Circular Remaining Counter */}
        <View style={[styles.timerRing, { borderColor: ringColor }]}>
          <Text style={[styles.timerNumber, { color: ringColor }]}>{remaining}s</Text>
        </View>
      </View>

      {/* Progress bar across card bottom */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${(remaining / (item.period || 30)) * 100}%`,
              backgroundColor: ringColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginVertical: Theme.spacing.xs,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  issuerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  issuerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  issuerText: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  accountText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
  },
  deleteBtn: {
    padding: 6,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  codeWrapper: {
    flex: 1,
  },
  codeText: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily.mono,
    letterSpacing: 2,
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  copyBadgeText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timerRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  timerNumber: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily.mono,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: Theme.colors.surfaceLight,
    marginTop: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
});
