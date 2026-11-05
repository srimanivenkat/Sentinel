import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  callerName?: string;
  callerNumber?: string;
  onDismiss: () => void;
}

export const DecoyCallModal: React.FC<Props> = ({
  visible,
  callerName = 'Emergency Dispatch',
  callerNumber = '+1 (555) 019-2834',
  onDismiss,
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected'>('ringing');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!visible) {
      setCallState('ringing');
      setCallDuration(0);
      return;
    }

    // Vibrate ring pattern
    const ringInterval = setInterval(() => {
      try {
        Vibration.vibrate([200, 400, 200, 800]);
      } catch {}
    }, 2000);

    return () => clearInterval(ringInterval);
  }, [visible]);

  useEffect(() => {
    let timer: any = null;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  const handleAccept = () => {
    setCallState('connected');
  };

  const handleEnd = () => {
    setCallState('ringing');
    setCallDuration(0);
    onDismiss();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleEnd}>
      <View style={styles.container}>
        {/* Top Caller Information */}
        <View style={styles.topInfo}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={54} color="#CBD5E1" />
          </View>
          <Text style={styles.callerNameText}>{callerName}</Text>
          <Text style={styles.callerNumberText}>{callerNumber}</Text>
          <Text style={styles.callStatusText}>
            {callState === 'ringing' ? 'Incoming Cellular Call...' : formatDuration(callDuration)}
          </Text>
        </View>

        {callState === 'connected' && (
          <View style={styles.inCallHints}>
            <Ionicons name="volume-high-outline" size={24} color="#00E676" />
            <Text style={styles.inCallPrompt}>
              "Pretext Active: Say 'Yes, I am leaving the building right now to meet you' to excuse yourself."
            </Text>
          </View>
        )}

        {/* Bottom Call Action Controls */}
        <View style={styles.bottomControls}>
          {callState === 'ringing' ? (
            <View style={styles.actionsRow}>
              {/* Decline */}
              <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleEnd}>
                <Ionicons name="call" size={32} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
                <Text style={styles.btnLabel}>Decline</Text>
              </TouchableOpacity>

              {/* Accept */}
              <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAccept}>
                <Ionicons name="call" size={32} color="#FFFFFF" />
                <Text style={styles.btnLabel}>Accept</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inCallControls}>
              <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleEnd}>
                <Ionicons name="call" size={32} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
                <Text style={styles.btnLabel}>End Call</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A11',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  topInfo: {
    alignItems: 'center',
    marginTop: 40,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  callerNameText: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  callerNumberText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 6,
  },
  callStatusText: {
    color: '#38BDF8',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inCallHints: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00E676',
    alignItems: 'center',
    gap: 8,
  },
  inCallPrompt: {
    color: '#F8FAFC',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bottomControls: {
    marginBottom: 30,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  inCallControls: {
    alignItems: 'center',
    width: '100%',
  },
  actionBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  declineBtn: {
    backgroundColor: '#EF4444',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  btnLabel: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    position: 'absolute',
    bottom: -24,
  },
});
