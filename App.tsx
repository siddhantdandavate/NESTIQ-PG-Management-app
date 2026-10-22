import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { AuthScreen } from './features/auth/AuthScreen';
import { SuperAdminDashboard } from './features/superadmin/SuperAdminDashboard';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { TenantDashboard } from './features/tenant/TenantDashboard';

function MainNavigator() {
  const { activeRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <Text style={styles.loadingAppName}>NESTIQ</Text>
        <ActivityIndicator size="large" color="#2563EB" style={styles.spinner} />
        <Text style={styles.loadingSub}>Verifying credentials & permissions...</Text>
      </View>
    );
  }

  switch (activeRole) {
    case 'super_admin':
      return (
        <>
          <StatusBar style="light" />
          <SuperAdminDashboard />
        </>
      );
    case 'admin':
      return (
        <>
          <StatusBar style="dark" />
          <AdminDashboard />
        </>
      );
    case 'tenant':
      return (
        <>
          <StatusBar style="dark" />
          <TenantDashboard />
        </>
      );
    case 'none':
    default:
      return (
        <>
          <StatusBar style="dark" />
          <AuthScreen />
        </>
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },
  loadingAppName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  spinner: {
    marginTop: 24,
  },
  loadingSub: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
});
