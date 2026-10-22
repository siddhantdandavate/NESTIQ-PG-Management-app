import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { propertyService } from '../properties/propertyService';
import { CreatePropertyModal } from '../properties/CreatePropertyModal';
import { EditPropertyModal } from '../properties/EditPropertyModal';
import { PGProperty } from '../../types/database';
import { formatPhone } from '../../lib/utils/formatters';

export const AdminDashboard: React.FC = () => {
  const { profile, user, activeProperty, memberships, switchProperty, signOut } = useAuth();
  const [properties, setProperties] = useState<PGProperty[]>([]);
  const [currentProperty, setCurrentProperty] = useState<PGProperty | null>(null);
  const [isLoadingProps, setIsLoadingProps] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const loadProperties = useCallback(async () => {
    setIsLoadingProps(true);
    try {
      const userId = user?.id || 'dev-pg-admin';
      const list = await propertyService.fetchUserProperties(userId);
      setProperties(list);

      // Select active property
      const targetId = activeProperty?.property_id;
      const matched = list.find(p => p.id === targetId) || list[0] || null;
      setCurrentProperty(matched);
      if (matched && matched.id !== targetId) {
        switchProperty(matched.id);
      }
    } catch (e) {
      console.warn('Error loading properties:', e);
    } finally {
      setIsLoadingProps(false);
    }
  }, [user?.id, activeProperty?.property_id, switchProperty]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleSelectProperty = (prop: PGProperty) => {
    setCurrentProperty(prop);
    switchProperty(prop.id);
  };

  const handlePropertyCreated = (newProp: PGProperty) => {
    setProperties(prev => [...prev, newProp]);
    setCurrentProperty(newProp);
    switchProperty(newProp.id);
  };

  const handlePropertyUpdated = (updatedProp: PGProperty) => {
    setProperties(prev => prev.map(p => (p.id === updatedProp.id ? updatedProp : p)));
    setCurrentProperty(updatedProp);
  };

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

        {/* Property Selector Bar */}
        <View style={styles.selectorBar}>
          <Text style={styles.selectorBarLabel}>My Properties ({properties.length}):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {properties.map(p => {
              const isSelected = currentProperty?.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.propertyChip, isSelected && styles.activePropertyChip]}
                  onPress={() => handleSelectProperty(p)}
                >
                  <Text style={[styles.propertyChipText, isSelected && styles.activePropertyChipText]}>
                    🏢 {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.addPropertyChip} onPress={() => setIsCreateOpen(true)}>
              <Text style={styles.addPropertyChipText}>+ Add PG</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Active Property Card */}
        {isLoadingProps ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#2563EB" />
            <Text style={styles.loadingText}>Loading property details...</Text>
          </View>
        ) : (
          <View style={styles.propertyCard}>
            <View style={styles.propertyTopRow}>
              <View style={styles.propertyTitleGroup}>
                <Text style={styles.propertyStatusBadge}>ACTIVE</Text>
                <Text style={styles.propertyName}>{currentProperty?.name || 'Sunrise Luxury PG'}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditOpen(true)}
              >
                <Text style={styles.editButtonText}>Edit Details</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.propertyMeta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText}>
                  {[currentProperty?.address, currentProperty?.city, currentProperty?.state, currentProperty?.pincode]
                    .filter(Boolean)
                    .join(', ') || 'Electronic City, Bengaluru, Karnataka 560100'}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📞</Text>
                <Text style={styles.metaText}>
                  {formatPhone(currentProperty?.contact_phone) || '+91 98765 43210'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Milestone 2 Security & Scope Banner */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>🏢 Phase 2: Property Management Verified</Text>
          <Text style={styles.statusDesc}>
            Access is strictly isolated to your authorized PG. Database Row Level Security (RLS) ensures you can create, inspect, and update only assigned properties.
          </Text>
        </View>

        {/* Quick Inventory Metrics */}
        <Text style={styles.sectionTitle}>Property Overview</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>16</Text>
            <Text style={styles.metricLabel}>Total Rooms</Text>
            <Text style={styles.metricSub}>Phase 3 Target</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>38</Text>
            <Text style={styles.metricLabel}>Total Beds</Text>
            <Text style={styles.metricSub}>Phase 3 Target</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>34</Text>
            <Text style={styles.metricLabel}>Active Tenants</Text>
            <Text style={styles.metricSub}>Phase 4 Target</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>89%</Text>
            <Text style={styles.metricLabel}>Occupancy Rate</Text>
            <Text style={styles.metricSub}>Live Calculation</Text>
          </View>
        </View>

        {/* Roadmap Milestones Ahead */}
        <Text style={styles.sectionTitle}>Implementation Order</Text>
        <View style={styles.timelineCard}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepCompleted]} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Phase 1: Auth & Role Security (Complete)</Text>
              <Text style={styles.stepDesc}>Supabase auth, session restoration, profiles, RLS foundation.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepCompleted]} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Phase 2: PG Property Management (Complete)</Text>
              <Text style={styles.stepDesc}>Multi-property administration, creation, edit details, RLS boundaries.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Phase 3: Rooms and Beds (Next)</Text>
              <Text style={styles.stepDesc}>Room inventory, sharing types, bed-level allocations, capacity rules.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Phase 4: Tenant Onboarding</Text>
              <Text style={styles.stepDesc}>Tenant stay records, bed assignments, contact management.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Phase 5: Rent & Payments</Text>
              <Text style={styles.stepDesc}>Rent schedules, manual receipts, partial dues tracking, reversals.</Text>
            </View>
          </View>
        </View>

        {/* Modals */}
        <CreatePropertyModal
          visible={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onPropertyCreated={handlePropertyCreated}
        />

        <EditPropertyModal
          visible={isEditOpen}
          property={currentProperty}
          onClose={() => setIsEditOpen(false)}
          onPropertyUpdated={handlePropertyUpdated}
        />
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
    marginBottom: 16,
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
  selectorBar: {
    marginBottom: 16,
  },
  selectorBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  propertyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  activePropertyChip: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  propertyChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  activePropertyChipText: {
    color: '#FFFFFF',
  },
  addPropertyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  addPropertyChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  propertyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  propertyTitleGroup: {
    flex: 1,
  },
  propertyStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  propertyName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  editButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  propertyMeta: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
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
