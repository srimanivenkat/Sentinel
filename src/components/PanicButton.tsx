import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { Theme } from '../theme/theme';
import { EmergencyService, LocationPayload } from '../services/emergency';
import { StorageService } from '../services/storage';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSosTriggered?: (location: LocationPayload) => void;
}

export const PanicButton: React.FC<Props> = ({ onSosTriggered }) => {
  const [isPressing, setIsPressing] = useState(false);
  const [hudVisible, setHudVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [dispatched, setDispatched] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationPayload | null>(null);

  const holdProgress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const handlePressIn = () => {
    setIsPressing(true);
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        triggerCountdownHud();
      }
    });
  };

  const handlePressOut = () => {
    setIsPressing(false);
    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const triggerCountdownHud = async () => {
    setHudVisible(true);
    setCountdown(5);
    setDispatched(false);

    try {
      Vibration.vibrate([100, 200, 100, 200]);
    } catch {}

    // Pre-fetch GPS location
    const loc = await EmergencyService.getCurrentLocation();
    setLocationInfo(loc);

    // Start 5s countdown
    let remaining = 5;
    countdownIntervalRef.current = setInterval(async () => {
      remaining -= 1;
      setCountdown(remaining);

      try {
        Vibration.vibrate(100);
      } catch {}

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        await fireEmergencyDispatch(loc);
      }
    }, 1000);
  };

  const fireEmergencyDispatch = async (loc: LocationPayload) => {
    setDispatched(true);
    EmergencyService.startSiren();

    const contacts = await StorageService.getEmergencyContacts();
    await EmergencyService.dispatchSosAlert(contacts, loc);

    if (onSosTriggered) {
      onSosTriggered(loc);
    }
  };

  const handleCancel = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    EmergencyService.stopSiren();
    setHudVisible(false);
    setDispatched(false);
    setCountdown(5);
    handlePressOut();
  };

  const progressInterpolate = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.touchArea}
        >
          {/* Animated Background Progress Fill */}
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressInterpolate,
                backgroundColor: Theme.colors.danger,
              },
            ]}
          />

          <View style={styles.buttonContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="warning" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.titleText}>EMERGENCY SOS PANIC</Text>
              <Text style={styles.hintText}>
                {isPressing ? 'HOLDING... KEEP PRESSED' : 'HOLD FOR 2 SECONDS TO ACTIVATE'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Full-Screen Abort HUD Modal */}
      <Modal visible={hudVisible} transparent animationType="fade" onRequestClose={handleCancel}>
        <View style={styles.modalOverlay}>
          <View style={styles.hudCard}>
            <View style={styles.alertHeader}>
              <Ionicons
                name="alert-circle"
                size={40}
                color={dispatched ? Theme.colors.danger : Theme.colors.warning}
              />
              <Text style={styles.alertTitle}>
                {dispatched ? 'EMERGENCY DISPATCHED' : 'ACTIVATING EMERGENCY SOS'}
              </Text>
            </View>

            {!dispatched ? (
              <View style={styles.countdownBox}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.countdownSub}>SECONDS UNTIL SIREN & DISPATCH</Text>
              </View>
            ) : (
              <View style={styles.dispatchedBox}>
                <Ionicons name="radio" size={32} color={Theme.colors.danger} />
                <Text style={styles.dispatchedText}>Loud Siren Activated</Text>
                <Text style={styles.dispatchedSub}>
                  Distress SMS with live coordinates sent to emergency contacts.
                </Text>
                {locationInfo && (
                  <Text style={styles.locationSnippet}>
                    GPS: {locationInfo.latitude.toFixed(4)}, {locationInfo.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.abortButton} onPress={handleCancel}>
              <Ionicons name="close-circle" size={20} color="#FFFFFF" />
              <Text style={styles.abortButtonText}>
                {dispatched ? 'STOP SIREN & DISMISS' : 'SLIDE / TAP TO CANCEL'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Theme.spacing.sm,
  },
  touchArea: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: Theme.radii.lg,
    borderWidth: 2,
    borderColor: Theme.colors.danger,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  hintText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  hudCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.danger,
    alignItems: 'center',
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 1,
  },
  countdownBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Theme.colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
  },
  countdownNumber: {
    color: Theme.colors.warning,
    fontSize: 48,
    fontWeight: '900',
    fontFamily: Theme.typography.fontFamily.mono,
  },
  countdownSub: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  dispatchedBox: {
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
    padding: Theme.spacing.md,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: Theme.radii.md,
    width: '100%',
  },
  dispatchedText: {
    color: Theme.colors.danger,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  dispatchedSub: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  locationSnippet: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: Theme.typography.fontFamily.mono,
    marginTop: 8,
  },
  abortButton: {
    backgroundColor: Theme.colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: Theme.radii.md,
    marginTop: Theme.spacing.md,
  },
  abortButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
