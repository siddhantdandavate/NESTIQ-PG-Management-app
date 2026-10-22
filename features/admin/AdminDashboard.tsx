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

export const AdminDashboard: React.FC = () => {
  const { profile, activeProperty, memberships, switchProperty, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>PG ADMIN</Text>
              </View>
            </View>
            <Text style={styles.welcomeText}>
              {profile?.full_name || 'PG Administrator'}
            </Text>
            <Text style={styles.subText}>Property Operations Dashboard</Text>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Property Selector / Active Property Banner */}
        <View style={styles.propertyCard}>
          <View style={styles.propertyHeader}>
            <Text style={styles.propertyIcon}>🏢</Text>
            <View style={styles.propertyDetails}>
              <Text style={styles.propertyLabel}>Authorized Property</Text>
              <Text style={styles.propertyName}>
                {activeProperty?.property_name || 'Sunrise Luxury PG'}
              </Text>
            </View>
          </View>

          {memberships.length > 1 && (
            <View style={styles.selectorRow}>
              <Text style={styles.selectorLabel}>Switch Property:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertyChips}>
                {memberships.map((m) => (
                  <TouchableOpacity
                    key={m.property_id}
                    style={[
                      styles.chip,
                      m.property_id === activeProperty?.property_id && styles.activeChip,
                    ]}
                    onPress={() => switchProperty(m.property_id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        m.property_id === activeProperty?.property_id && styles.activeChipText,
                      ]}
                    >
                      {m.property_name || 'PG Property'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Milestone 1 Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>🔒 Milestone 1: Scope & RLS Enforced</Text>
          <Text style={styles.statusDesc}>
            Access is strictly isolated to your authorized PG. Row Level Security guarantees you cannot query or modify rooms, tenants, or financial records belonging to another PG.
          </Text>
        </View>

        {/* Quick Inventory Metrics (Milestone 2+ Placeholders) */}
        <Text style={styles.sectionTitle}>Property Overview</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>16</Text>
            <Text style={styles.metricLabel}>Total Rooms</Text>
            <Text style={styles.metricSub}>Milestone 3</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>38</Text>
            <Text style={styles.metricLabel}>Total Beds</Text>
            <Text style={styles.metricSub}>Milestone 3</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>34</Text>
            <Text style={styles.metricLabel}>Active Tenants</Text>
            <Text style={styles.metricSub}>Milestone 4</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>89%</Text>
            <Text style={styles.metricLabel}>Occupancy Rate</Text>
            <Text style={styles.metricSub}>Calculated</Text>
          </View>
        </View>

        {/* Roadmap Milestones Ahead */}
        <Text style={styles.sectionTitle}>Upcoming Implementation Order</Text>
        <View style={styles.timelineCard}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepCompleted]} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Milestone 1: Auth & Role Security (Current)</Text>
              <Text style={styles.stepDesc}>Supabase auth, profile lookup, RLS policies, role routing.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Milestone 2: Property Management</Text>
              <Text style={styles.stepDesc}>Property profile, details, and access boundaries.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Milestone 3: Rooms and Beds</Text>
              <Text style={styles.stepDesc}>Inventory, capacity validation, occupancy rules.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Milestone 4: Tenant Onboarding</Text>
              <Text style={styles.stepDesc}>Tenant stay records, bed assignments, contact management.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Milestone 5: Rent and Payments</Text>
              <Text style={styles.stepDesc}>Traceable rent schedules, receipts, partial dues tracking.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#2563EB',
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
    color: '#0F172A',
  },
  subText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  propertyDetails: {
    flex: 1,
  },
  propertyLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  propertyName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  selectorRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  propertyChips: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#2563EB',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  statusCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  statusTitle: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  statusDesc: {
    color: '#1E3A8A',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 4,
  },
  metricSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CBD5E1',
    marginTop: 4,
    marginRight: 12,
  },
  stepCompleted: {
    backgroundColor: '#10B981',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
