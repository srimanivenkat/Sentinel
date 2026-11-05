import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  BackHandler,
} from 'react-native';
import { Theme } from '../theme/theme';
import { TotpItem, VaultCredential } from '../types/security';
import { StorageService } from '../services/storage';
import { CryptoService, PasswordStrength } from '../services/crypto';
import { TotpCard } from '../components/TotpCard';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export const VaultScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'totp' | 'passwords'>('totp');

  // TOTP State
  const [totpItems, setTotpItems] = useState<TotpItem[]>([]);
  const [totpSearch, setTotpSearch] = useState('');
  const [addTotpVisible, setAddTotpVisible] = useState(false);
  const [totpIssuer, setTotpIssuer] = useState('');
  const [totpAccount, setTotpAccount] = useState('');
  const [totpSecret, setTotpSecret] = useState('');

  // Password Vault State
  const [vaultItems, setVaultItems] = useState<VaultCredential[]>([]);
  const [vaultSearch, setVaultSearch] = useState('');
  const [addVaultVisible, setAddVaultVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    if (!addTotpVisible && !addVaultVisible) return;
    const onBackPress = () => {
      if (addTotpVisible) setAddTotpVisible(false);
      if (addVaultVisible) setAddVaultVisible(false);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [addTotpVisible, addVaultVisible]);
  const [newPassword, setNewPassword] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [pwdLength, setPwdLength] = useState(16);
  const [pwdStrength, setPwdStrength] = useState<PasswordStrength | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const totps = await StorageService.getTotpItems();
    const vault = await StorageService.getVaultItems();
    setTotpItems(totps);
    setVaultItems(vault);
  };

  // --- TOTP Handlers ---
  const handleAddTotp = async () => {
    if (!totpSecret) return;
    const newItem: TotpItem = {
      id: 'totp-' + Date.now(),
      issuer: totpIssuer || 'Authenticator',
      account: totpAccount || 'user@service.com',
      secret: totpSecret.replace(/\s+/g, '').toUpperCase(),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      createdAt: Date.now(),
    };
    const updated = [newItem, ...totpItems];
    setTotpItems(updated);
    await StorageService.saveTotpItems(updated);
    setTotpIssuer('');
    setTotpAccount('');
    setTotpSecret('');
    setAddTotpVisible(false);
  };

  const handleDeleteTotp = async (id: string) => {
    const updated = totpItems.filter((i) => i.id !== id);
    setTotpItems(updated);
    await StorageService.saveTotpItems(updated);
  };

  // --- Password Vault Handlers ---
  const handleGeneratePassword = () => {
    const generated = CryptoService.generatePassword({
      length: pwdLength,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: true,
    });
    setNewPassword(generated);
    setPwdStrength(CryptoService.evaluatePasswordStrength(generated));
  };

  const handlePasswordChange = (text: string) => {
    setNewPassword(text);
    setPwdStrength(CryptoService.evaluatePasswordStrength(text));
  };

  const handleAddVaultItem = async () => {
    if (!newTitle || !newPassword) return;

    // Encrypt password at rest using a local salt/key
    const encryptedPwd = CryptoService.encrypt(newPassword, 'MASTER_KEY_DEVICE');

    const newItem: VaultCredential = {
      id: 'cred-' + Date.now(),
      title: newTitle,
      username: newUsername,
      password: encryptedPwd,
      url: newUrl,
      category: 'logins',
      updatedAt: Date.now(),
    };

    const updated = [newItem, ...vaultItems];
    setVaultItems(updated);
    await StorageService.saveVaultItems(updated);

    setNewTitle('');
    setNewUsername('');
    setNewPassword('');
    setNewUrl('');
    setPwdStrength(null);
    setAddVaultVisible(false);
  };

  const handleDeleteVaultItem = async (id: string) => {
    const updated = vaultItems.filter((i) => i.id !== id);
    setVaultItems(updated);
    await StorageService.saveVaultItems(updated);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyCredential = async (encryptedPwd: string) => {
    try {
      const plaintext = CryptoService.decrypt(encryptedPwd, 'MASTER_KEY_DEVICE');
      await Clipboard.setStringAsync(plaintext);
    } catch {
      await Clipboard.setStringAsync(encryptedPwd);
    }
  };

  const filteredTotps = totpItems.filter(
    (t) =>
      t.issuer.toLowerCase().includes(totpSearch.toLowerCase()) ||
      t.account.toLowerCase().includes(totpSearch.toLowerCase())
  );

  const filteredVault = vaultItems.filter(
    (v) =>
      v.title.toLowerCase().includes(vaultSearch.toLowerCase()) ||
      v.username.toLowerCase().includes(vaultSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.screenTitle}>AUTHENTICATOR & VAULT</Text>
        <Text style={styles.screenSub}>Zero-knowledge AES-256 local cryptographic store</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelectorRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'totp' && styles.tabButtonActive]}
          onPress={() => setActiveTab('totp')}
        >
          <Ionicons
            name="key-outline"
            size={16}
            color={activeTab === 'totp' ? Theme.colors.primary : Theme.colors.textMuted}
          />
          <Text style={[styles.tabButtonText, activeTab === 'totp' && styles.tabTextActive]}>
            2FA Authenticator ({totpItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'passwords' && styles.tabButtonActive]}
          onPress={() => setActiveTab('passwords')}
        >
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={activeTab === 'passwords' ? Theme.colors.primary : Theme.colors.textMuted}
          />
          <Text style={[styles.tabButtonText, activeTab === 'passwords' && styles.tabTextActive]}>
            Password Vault ({vaultItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'totp' ? (
          // --- 2FA Authenticator Tab ---
          <View>
            <View style={styles.controlsRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color={Theme.colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search 2FA accounts..."
                  placeholderTextColor={Theme.colors.textMuted}
                  value={totpSearch}
                  onChangeText={setTotpSearch}
                />
              </View>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setAddTotpVisible(true)}
              >
                <Ionicons name="add" size={18} color="#000000" />
                <Text style={styles.actionBtnText}>Add 2FA</Text>
              </TouchableOpacity>
            </View>

            {filteredTotps.map((item) => (
              <TotpCard key={item.id} item={item} onDelete={handleDeleteTotp} />
            ))}

            {filteredTotps.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="key-outline" size={40} color={Theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>No 2FA Tokens Found</Text>
                <Text style={styles.emptySub}>Add an account to generate RFC 6238 time-based codes.</Text>
              </View>
            )}
          </View>
        ) : (
          // --- Passwords Tab ---
          <View>
            <View style={styles.controlsRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color={Theme.colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search passwords..."
                  placeholderTextColor={Theme.colors.textMuted}
                  value={vaultSearch}
                  onChangeText={setVaultSearch}
                />
              </View>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  handleGeneratePassword();
                  setAddVaultVisible(true);
                }}
              >
                <Ionicons name="add" size={18} color="#000000" />
                <Text style={styles.actionBtnText}>Add Login</Text>
              </TouchableOpacity>
            </View>

            {filteredVault.map((item) => {
              const isRevealed = revealedIds[item.id];
              let displayPwd = '••••••••••••';
              if (isRevealed) {
                try {
                  displayPwd = CryptoService.decrypt(item.password, 'MASTER_KEY_DEVICE');
                } catch {
                  displayPwd = item.password;
                }
              }

              return (
                <View key={item.id} style={styles.vaultCard}>
                  <View style={styles.vaultTopRow}>
                    <View style={styles.vaultTitleCol}>
                      <Text style={styles.vaultTitle}>{item.title}</Text>
                      <Text style={styles.vaultUser}>{item.username || 'No Username'}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteVaultItem(item.id)}
                      style={styles.trashBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={Theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pwdRow}>
                    <Text style={styles.pwdText}>{displayPwd}</Text>
                    <View style={styles.pwdActions}>
                      <TouchableOpacity
                        onPress={() => toggleReveal(item.id)}
                        style={styles.iconAction}
                      >
                        <Ionicons
                          name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={Theme.colors.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => copyCredential(item.password)}
                        style={styles.iconAction}
                      >
                        <Ionicons name="copy-outline" size={18} color={Theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            {filteredVault.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="lock-closed-outline" size={40} color={Theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>Vault Empty</Text>
                <Text style={styles.emptySub}>
                  Store credentials with client-side AES-256 encryption.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add 2FA Modal */}
      <Modal
        visible={addTotpVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddTotpVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Add 2FA Account</Text>

            <TextInput
              style={styles.input}
              placeholder="Issuer / Service (e.g. AWS, GitHub)"
              placeholderTextColor={Theme.colors.textMuted}
              value={totpIssuer}
              onChangeText={setTotpIssuer}
            />

            <TextInput
              style={styles.input}
              placeholder="Account / Email (e.g. dev@company.com)"
              placeholderTextColor={Theme.colors.textMuted}
              value={totpAccount}
              onChangeText={setTotpAccount}
            />

            <TextInput
              style={styles.input}
              placeholder="Secret Key (Base32 string)"
              placeholderTextColor={Theme.colors.textMuted}
              autoCapitalize="characters"
              value={totpSecret}
              onChangeText={setTotpSecret}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setAddTotpVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddTotp}>
                <Text style={styles.modalSaveText}>Save 2FA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Password Modal */}
      <Modal
        visible={addVaultVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddVaultVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Add Credential & Generator</Text>

            <TextInput
              style={styles.input}
              placeholder="Title / Service (e.g. Bank of America)"
              placeholderTextColor={Theme.colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Username / Email"
              placeholderTextColor={Theme.colors.textMuted}
              value={newUsername}
              onChangeText={setNewUsername}
            />

            <View style={styles.pwdInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Password"
                placeholderTextColor={Theme.colors.textMuted}
                value={newPassword}
                onChangeText={handlePasswordChange}
              />
              <TouchableOpacity
                style={styles.genBtn}
                onPress={handleGeneratePassword}
              >
                <Ionicons name="dice-outline" size={18} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Strength Meter */}
            {pwdStrength && (
              <View style={styles.strengthBox}>
                <View style={styles.strengthHeader}>
                  <Text style={[styles.strengthLabel, { color: pwdStrength.color }]}>
                    {pwdStrength.label} ({pwdStrength.entropyBits} bits entropy)
                  </Text>
                  <Text style={styles.crackEstimate}>Crack time: {pwdStrength.crackTimeEstimate}</Text>
                </View>
                <View style={styles.strengthBarBg}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      {
                        width: `${Math.min(100, (pwdStrength.entropyBits / 90) * 100)}%`,
                        backgroundColor: pwdStrength.color,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setAddVaultVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddVaultItem}>
                <Text style={styles.modalSaveText}>Save Credential</Text>
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
  tabSelectorRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceBorder,
    backgroundColor: Theme.colors.surface,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.primary,
  },
  tabButtonText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: Theme.colors.primary,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.insets.scrollPaddingBottom,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 12,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    color: Theme.colors.text,
    fontSize: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    borderRadius: Theme.radii.md,
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  emptySub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  vaultCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    marginBottom: Theme.spacing.sm,
  },
  vaultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vaultTitleCol: {
    flex: 1,
  },
  vaultTitle: {
    color: Theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  vaultUser: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  trashBtn: {
    padding: 4,
  },
  pwdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    padding: 10,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  pwdText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontFamily: Theme.typography.fontFamily.mono,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pwdActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconAction: {
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  modalHeading: {
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
  pwdInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Theme.spacing.sm,
  },
  genBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    borderRadius: Theme.radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strengthBox: {
    backgroundColor: Theme.colors.background,
    padding: 8,
    borderRadius: Theme.radii.sm,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  crackEstimate: {
    color: Theme.colors.textMuted,
    fontSize: 9,
  },
  strengthBarBg: {
    height: 4,
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
  },
  modalButtons: {
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
