import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';

import { changePassword, getProfile, updateProfile } from '@/src/api/user.api';
import { getApiErrorMessage } from '@/src/api/errorMessage';
import { updateUserProfile } from '@/src/store/authStore';

type FieldRowProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
};

function FieldRow({ icon, label, children, isLast }: FieldRowProps) {
  return (
    <>
      <View style={styles.fieldRow}>
        <View style={styles.fieldIconWrap}>
          <MaterialIcons name={icon} size={20} color="#0714B8" />
        </View>
        <View style={styles.fieldBody}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {children}
        </View>
      </View>
      {!isLast && <View style={styles.separator} />}
    </>
  );
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [job, setJob] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    getProfile()
      .then((profile) => {
        setFullName(profile.fullName ?? '');
        setEmail(profile.email ?? '');
        setAge(profile.age != null ? String(profile.age) : '');
        setJob(profile.occupation ?? '');
      })
      .catch(() => {
        setErrorMessage('Could not load your account details.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedJob = job.trim();

    if (!trimmedName || !trimmedEmail) {
      setErrorMessage('Full name and email are required.');
      return;
    }

    if (trimmedName.length < 3) {
      setErrorMessage('Full name must be at least 3 characters.');
      return;
    }

    let parsedAge: number | null = null;
    if (age.trim()) {
      parsedAge = Number.parseInt(age.trim(), 10);
      if (!Number.isFinite(parsedAge) || parsedAge < 7 || parsedAge > 100) {
        setErrorMessage('Age must be a number between 7 and 100.');
        return;
      }
    }

    if (trimmedJob.length > 100) {
      setErrorMessage('Job cannot exceed 100 characters.');
      return;
    }

    const wantsPasswordChange =
      showPasswordSection &&
      (currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0);

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setErrorMessage('Fill in current, new, and confirm password to change your password.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New passwords do not match.');
        return;
      }
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      await updateProfile({
        fullName: trimmedName,
        email: trimmedEmail,
        age: parsedAge,
        occupation: trimmedJob || null,
      });

      if (wantsPasswordChange) {
        await changePassword({
          currentPassword,
          newPassword,
        });
      }

      updateUserProfile({ fullName: trimmedName, email: trimmedEmail });

      Alert.alert(
        'Saved',
        wantsPasswordChange
          ? 'Your account details and password were updated.'
          : 'Your account details were updated.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, 'Could not save your changes. Please try again.'),
      );
    } finally {
      setSaving(false);
    }
  };

  const renderPasswordInput = (
    value: string,
    onChangeText: (text: string) => void,
    visible: boolean,
    onToggleVisible: () => void,
  ) => (
    <View style={styles.passwordInputWrap}>
      <TextInput
        style={styles.fieldInput}
        placeholder="Enter password"
        placeholderTextColor="#B6BAC2"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={styles.eyeButton} onPress={onToggleVisible} hitSlop={8}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8A8F9A" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={22} color="#111318" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#0714B8" size="large" />
          <Text style={styles.muted}>Loading your details…</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustkeyboardInsets
            showsVerticalScrollIndicator={false}>
            <Text style={styles.pageSub}>
              Update your personal details. Password change is optional.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <View style={styles.formCard}>
                <FieldRow icon="person" label="Full name">
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Your name"
                    placeholderTextColor="#B6BAC2"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </FieldRow>

                <FieldRow icon="email" label="Email">
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="you@email.com"
                    placeholderTextColor="#B6BAC2"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </FieldRow>

                <FieldRow icon="cake" label="Age">
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Optional"
                    placeholderTextColor="#B6BAC2"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                  />
                </FieldRow>

                <FieldRow icon="work-outline" label="Job" isLast>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="What do you do?"
                    placeholderTextColor="#B6BAC2"
                    value={job}
                    onChangeText={setJob}
                  />
                </FieldRow>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Security</Text>
              <View style={styles.formCard}>
                <TouchableOpacity
                  style={styles.passwordToggleRow}
                  activeOpacity={0.75}
                  onPress={() => setShowPasswordSection((v) => !v)}>
                  <View style={styles.fieldIconWrap}>
                    <MaterialIcons name="lock-outline" size={20} color="#0714B8" />
                  </View>
                  <View style={styles.fieldBody}>
                    <Text style={styles.passwordToggleTitle}>Change password</Text>
                    <Text style={styles.passwordToggleSub}>
                      {showPasswordSection
                        ? 'Tap to hide password fields'
                        : 'Optional — leave profile-only if you skip this'}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={showPasswordSection ? 'expand-less' : 'expand-more'}
                    size={24}
                    color="#C2C7D0"
                  />
                </TouchableOpacity>

                {showPasswordSection && (
                  <>
                    <View style={styles.separator} />
                    <FieldRow icon="key" label="Current password">
                      {renderPasswordInput(
                        currentPassword,
                        setCurrentPassword,
                        showCurrentPassword,
                        () => setShowCurrentPassword((v) => !v),
                      )}
                    </FieldRow>

                    <FieldRow icon="lock" label="New password">
                      {renderPasswordInput(
                        newPassword,
                        setNewPassword,
                        showNewPassword,
                        () => setShowNewPassword((v) => !v),
                      )}
                    </FieldRow>

                    <FieldRow icon="check-circle" label="Confirm password" isLast>
                      {renderPasswordInput(
                        confirmPassword,
                        setConfirmPassword,
                        showConfirmPassword,
                        () => setShowConfirmPassword((v) => !v),
                      )}
                    </FieldRow>
                  </>
                )}
              </View>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={18} color="#E53935" />
                <Text style={styles.errorText} numberOfLines={4}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={() => void handleSave()}
              disabled={saving}
              activeOpacity={0.85}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="save" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF2',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#111318',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 34,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  muted: {
    color: '#8A8F9A',
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  pageSub: {
    fontSize: 13,
    lineHeight: 19,
    color: '#8A8F9A',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDF0F4',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  fieldIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  fieldBody: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8F9A',
    marginBottom: 4,
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111318',
    paddingVertical: 2,
    paddingRight: 4,
  },
  passwordInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F2F5',
    marginHorizontal: 16,
  },
  passwordToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  passwordToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111318',
    marginBottom: 2,
  },
  passwordToggleSub: {
    fontSize: 12,
    color: '#8A8F9A',
    lineHeight: 17,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE0DE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  errorText: {
    flex: 1,
    color: '#C62828',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8EBF2',
    backgroundColor: '#F7F9FB',
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0714B8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0714B8',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
