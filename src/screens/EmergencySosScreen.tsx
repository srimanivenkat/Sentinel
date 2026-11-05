import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
  BackHandler,
} from 'react-native';
import { Theme } from '../theme/theme';
import { EmergencyContact } from '../types/security';
import { StorageService } from '../services/storage';
import { EmergencyService, LocationPayload } from '../services/emergency';
import { SensorService } from '../services/sensors';
import { PanicButton } from '../components/PanicButton';
import { Ionicons } from '@expo/vector-icons';

export const EmergencySosScreen: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [location, setLocation] = useState<LocationPayload | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // New Contact State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('Family');

  useEffect(() => {
    loadContacts();
    refreshLocation();
  }, []);

  useEffect(() => {
    if (!addModalVisible) return;
    const onBackPress = () => {
      setAddModalVisible(false);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [addModalVisible]);

  const loadContacts = async () => {
    const data = await StorageService.getEmergencyContacts();
    setContacts(data);
  };

  const refreshLocation = async () => {
    setLoadingLocation(true);
    const loc = await EmergencyService.getCurrentLocation();
    setLocation(loc);
    setLoadingLocation(false);
  };

  const toggleSiren = () => {
    if (sirenActive) {
      EmergencyService.stopSiren();
      setSirenActive(false);
    } else {
      EmergencyService.startSiren();
      setSirenActive(true);
    }
  };

  const handleAddContact = async () => {
    if (!newName || !newPhone) return;
    const newContact: EmergencyContact = {
      id: 'contact-' + Date.now(),
      name: newName,
      phoneNumber: newPhone,
      relationship: newRelationship,
      notifyOnSos: true,
    };
    const updated = [...contacts, newContact];
    setContacts(updated);
    await StorageService.saveEmergencyContacts(updated);
    setNewName('');
    setNewPhone('');
    setAddModalVisible(false);
  };

  const handleDeleteContact = async (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    await StorageService.saveEmergencyContacts(updated);
  };

  const handleTestDispatch = async () => {
    if (!location) return;
    await EmergencyService.dispatchSosAlert(contacts, location, 'TEST ALERT FROM SENTINEL');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.screenTitle}>EMERGENCY SOS HUB</Text>
        <Text style={styles.screenSub}>Multi-vector distress dispatch & telemetry</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Panic Button */}
        <PanicButton onSosTriggered={(loc) => setLocation(loc)} />

        {/* Siren Alert Toggle Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle}>ACOUSTIC EMERGENCY SIREN</Text>
              <Text style={styles.cardSub}>Continuous 800Hz - 1400Hz oscillating sweep</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, sirenActive && styles.toggleBtnActive]}
              onPress={toggleSiren}
            >
              <Ionicons
                name={sirenActive ? 'volume-high' : 'volume-mute-outline'}
                size={18}
                color={sirenActive ? '#FFFFFF' : Theme.colors.textMuted}
              />
              <Text style={[styles.toggleBtnText, sirenActive && { color: '#FFFFFF' }]}>
                {sirenActive ? 'STOP SIREN' : 'SOUND SIREN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live GPS Telemetry Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle}>LIVE GPS COORDINATES</Text>
              <Text style={styles.cardSub}>High-accuracy reverse-geocoded telemetry</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={refreshLocation}>
              <Ionicons
                name="refresh-outline"
                size={16}
                color={Theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {location ? (
            <View style={styles.locationBox}>
              <View style={styles.coordsRow}>
                <Ionicons name="location" size={18} color={Theme.colors.danger} />
                <Text style={styles.coordsText}>
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </Text>
              </View>
              {location.address && (
                <Text style={styles.addressText}>{location.address}</Text>
              )}
              <View style={styles.locationMetaRow}>
                <Text style={styles.accuracyText}>
                  Accuracy: ±{location.accuracy ?? 10} meters
                </Text>
                <TouchableOpacity
                  style={styles.mapsLink}
                  onPress={() => Linking.openURL(location.mapsUrl)}
                >
                  <Text style={styles.mapsLinkText}>Open in Maps</Text>
                  <Ionicons name="open-outline" size={12} color={Theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.loadingText}>Acquiring GPS fix...</Text>
          )}
        </View>

        {/* Emergency Contacts List */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle}>EMERGENCY CONTACTS ({contacts.length})</Text>
              <Text style={styles.cardSub}>Recipients of SOS distress dispatch</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setAddModalVisible(true)}
            >
              <Ionicons name="person-add-outline" size={14} color="#000000" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactAvatar}>
                <Ionicons name="person" size={16} color={Theme.colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>
                  {contact.phoneNumber} • {contact.relationship}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteContact(contact.id)}
                style={styles.deleteContactBtn}
              >
                <Ionicons name="trash-outline" size={16} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}

          {contacts.length > 0 && (
            <TouchableOpacity style={styles.testDispatchBtn} onPress={handleTestDispatch}>
              <Ionicons name="send-outline" size={14} color={Theme.colors.primary} />
              <Text style={styles.testDispatchText}>Send Test Distress Payload</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>

            <TextInput
              style={styles.input}
              placeholder="Contact Name (e.g. Mom, Partner, Security)"
              placeholderTextColor={Theme.colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g. +15551234567)"
              placeholderTextColor={Theme.colors.textMuted}
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />

            <TextInput
              style={styles.input}
              placeholder="Relationship (e.g. Family, Friend, Doctor)"
              placeholderTextColor={Theme.colors.textMuted}
              value={newRelationship}
              onChangeText={setNewRelationship}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSave} onPress={handleAddContact}>
                <Text style={styles.modalSaveText}>Save Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  topHeader: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  screenSub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.insets.scrollPaddingBottom,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginVertical: Theme.spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  cardTitleCol: {
    flex: 1,
  },
  cardTitle: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardSub: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.radii.sm,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  toggleBtnActive: {
    backgroundColor: Theme.colors.danger,
    borderColor: Theme.colors.danger,
  },
  toggleBtnText: {
    color: Theme.colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  refreshBtn: {
    padding: 6,
  },
  locationBox: {
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.sm,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordsText: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily.mono,
  },
  addressText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  locationMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surfaceBorder,
  },
  accuracyText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
  },
  mapsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapsLinkText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  loadingText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radii.sm,
  },
  addBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
    gap: 10,
  },
  contactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: Theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  contactPhone: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  deleteContactBtn: {
    padding: 6,
  },
  testDispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Theme.spacing.sm,
    paddingVertical: 8,
  },
  testDispatchText: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Theme.spacing.md,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radii.sm,
    padding: Theme.spacing.sm,
    color: Theme.colors.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginBottom: Theme.spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: Theme.spacing.sm,
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalCancelText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  modalSave: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radii.sm,
  },
  modalSaveText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
});
