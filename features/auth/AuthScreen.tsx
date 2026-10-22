import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from './AuthContext';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, signOut, refreshContext, user, profile, isLoading, error, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setLocalError('Please enter your full name');
      return;
    }

    if (mode === 'signin') {
      const res = await signIn(email, password);
      if (res.error) setLocalError(res.error.message);
    } else {
      const res = await signUp(email, password, fullName, phone);
      if (res.error) {
        setLocalError(res.error.message);
      } else {
        setLocalError('Account created! Please check your email to verify your account.');
        setMode('signin');
      }
    }
  };

  // State: User is authenticated but waiting for property/role assignment
  if (user) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>N</Text>
            </View>
            <Text style={styles.appName}>NESTIQ</Text>
            <Text style={styles.appTagline}>Smart PG & Hostel Management</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>ROLE ASSIGNMENT PENDING</Text>
            </View>
            <Text style={styles.pendingTitle}>
              Welcome, {profile?.full_name || user.email}
            </Text>
            <Text style={styles.pendingDesc}>
              You are signed in, but your account has not yet been assigned to an active PG Property or platform role.
            </Text>

            <View style={styles.pendingInfoBox}>
              <Text style={styles.pendingInfoText}>
                • If you are a <Text style={{ fontWeight: '700' }}>Tenant</Text>, ask your PG Admin to invite this email.
              </Text>
              <Text style={styles.pendingInfoText}>
                • If you are a <Text style={{ fontWeight: '700' }}>PG Admin</Text>, you will be granted access by your property manager.
              </Text>
              <Text style={styles.pendingInfoText}>
                • If you are the <Text style={{ fontWeight: '700' }}>Platform Super Admin</Text>, please execute the bootstrap SQL in your Supabase SQL Editor.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={refreshContext}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Check Status</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={signOut}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header / Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <Text style={styles.appName}>NESTIQ</Text>
          <Text style={styles.appTagline}>Smart PG & Hostel Management</Text>
        </View>

        {/* Backend Status Notice */}
        {!isConfigured && (
          <View style={styles.configNotice}>
            <Text style={styles.configTitle}>⚠️ Local Environment Mode</Text>
            <Text style={styles.configText}>
              Supabase credentials not yet configured in .env. Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to connect.
            </Text>
          </View>
        )}

        {/* Form Container */}
        <View style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === 'signin' && styles.activeTab]}
              onPress={() => {
                setMode('signin');
                setLocalError(null);
              }}
            >
              <Text style={[styles.tabText, mode === 'signin' && styles.activeTabText]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'signup' && styles.activeTab]}
              onPress={() => {
                setMode('signup');
                setLocalError(null);
              }}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {(localError || error) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{localError || error}</Text>
            </View>
          )}

          {/* Form Fields */}
          {mode === 'signup' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {mode === 'signup' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  configNotice: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  configTitle: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  configText: {
    color: '#B45309',
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#2563EB',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  primaryButton: {
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  pendingBadgeText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  pendingDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  pendingInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 8,
  },
  pendingInfoText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
});
