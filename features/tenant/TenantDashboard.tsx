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

export const TenantDashboard: React.FC = () => {
  const { profile, activeProperty, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>TENANT</Text>
              </View>
            </View>
            <Text style={styles.welcomeText}>
              {profile?.full_name || 'Resident'}
            </Text>
            <Text style={styles.subText}>Personal Stay & Payments Portal</Text>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Stay Summary Card */}
        <View style={styles.stayCard}>
          <View style={styles.stayHeader}>
            <Text style={styles.stayIcon}>🏠</Text>
            <View style={styles.stayDetails}>
              <Text style={styles.propertyName}>
                {activeProperty?.property_name || 'Sunrise Luxury PG'}
              </Text>
              <Text style={styles.stayMeta}>Room 204 • Bed B (Double Sharing)</Text>
            </View>
          </View>

          <View style={styles.rentDueRow}>
            <View>
              <Text style={styles.dueLabel}>Monthly Rent</Text>
              <Text style={styles.dueAmount}>₹8,500</Text>
            </View>
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>Due on 5th of Month</Text>
            </View>
          </View>
        </View>

        {/* Milestone 1 Security Notice */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>🛡️ Privacy & Multi-Tenant Isolation</Text>
          <Text style={styles.statusDesc}>
            Supabase Row Level Security restricts data access to your authorized stay only. You cannot view other residents' personal records, payment history, or internal PG admin operations.
          </Text>
        </View>

        {/* Quick Actions (Roadmap Milestone Placeholders) */}
        <Text style={styles.sectionTitle}>Tenant Services</Text>
        <View style={styles.actionGrid}>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionTitle}>Rent & Payments</Text>
            <Text style={styles.actionDesc}>View payment history and receipts (Milestone 5)</Text>
          </View>

          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>📢</Text>
            <Text style={styles.actionTitle}>Complaints</Text>
            <Text style={styles.actionDesc}>Raise maintenance requests & track status (Milestone 6)</Text>
          </View>

          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionTitle}>Announcements</Text>
            <Text style={styles.actionDesc}>Stay updates from your PG management (Milestone 6)</Text>
          </View>

          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionTitle}>My Profile</Text>
            <Text style={styles.actionDesc}>Update contact preferences & language (Milestone 1)</Text>
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
    backgroundColor: '#059669',
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
  stayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stayIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  stayDetails: {
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  stayMeta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  rentDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
  },
  dueLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dueAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  dueBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dueBadgeText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  statusTitle: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  statusDesc: {
    color: '#047857',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  actionGrid: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});
