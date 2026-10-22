import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';

export const SuperAdminDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>SUPER ADMIN</Text>
              </View>
            </View>
            <Text style={styles.welcomeText}>
              {profile?.full_name || 'Platform Administrator'}
            </Text>
            <Text style={styles.subText}>NESTIQ Platform Control Center</Text>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Milestone 1 Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>✅ Milestone 1: Platform Role Verified</Text>
          <Text style={styles.statusDesc}>
            Logged in with global Super Admin privileges. Row Level Security policies permit system-wide inspection and administrative provisioning.
          </Text>
        </View>

        {/* Platform Overview Shell */}
        <Text style={styles.sectionTitle}>Platform Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Total PGs</Text>
            <Text style={styles.statHint}>Across all regions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>14</Text>
            <Text style={styles.statLabel}>Active PG Admins</Text>
            <Text style={styles.statHint}>Authorized accounts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>99.9%</Text>
            <Text style={styles.statLabel}>Platform Uptime</Text>
            <Text style={styles.statHint}>Supabase PostgreSQL</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Critical Alerts</Text>
            <Text style={styles.statHint}>All services normal</Text>
          </View>
        </View>

        {/* Planned Features (Roadmap Phases) */}
        <Text style={styles.sectionTitle}>Super Admin Workflows</Text>
        <View style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <Text style={styles.featureIcon}>🏢</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>PG & Admin Onboarding</Text>
              <Text style={styles.featureStatus}>Phase 3 — Super Admin Platform Management</Text>
            </View>
          </View>
          <Text style={styles.featureDetails}>
            Authorizes new PG properties, provisions PG Admin accounts, and sets up property-scoped memberships through trusted server actions.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>Security & Audit Logs</Text>
              <Text style={styles.featureStatus}>Phase 3 — Audit & Platform Security</Text>
            </View>
          </View>
          <Text style={styles.featureDetails}>
            Monitors privileged administrative operations, role assignments, and system-wide security boundaries.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutText: {
    color: '#F87171',
    fontWeight: '600',
    fontSize: 13,
  },
  statusCard: {
    backgroundColor: '#1E1B4B',
    borderColor: '#4338CA',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  statusTitle: {
    color: '#A5B4FC',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  statusDesc: {
    color: '#C7D2FE',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#A78BFA',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    marginTop: 4,
  },
  statHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  featureCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureStatus: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  featureDetails: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
});
