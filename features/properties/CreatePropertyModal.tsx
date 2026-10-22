import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { propertyService } from './propertyService';
import { useAuth } from '../auth/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { PGProperty } from '../../types/database';

interface CreatePropertyModalProps {
  visible: boolean;
  onClose: () => void;
  onPropertyCreated: (newProperty: PGProperty) => void;
}

export const CreatePropertyModal: React.FC<CreatePropertyModalProps> = ({
  visible,
  onClose,
  onPropertyCreated,
}) => {
  const { user, refreshContext } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter a PG / Property name');
      return;
    }
    if (!contactPhone.trim()) {
      setError('Please provide a contact phone number');
      return;
    }

    if (isSupabaseConfigured && !user?.id) {
      setError('You must be signed in to create a property');
      return;
    }

    setIsLoading(true);
    try {
      const userId = user?.id || 'dev-pg-admin';
      const { property } = await propertyService.createProperty(
        {
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          contact_phone: contactPhone.trim(),
        },
        userId
      );

      await refreshContext();
      onPropertyCreated(property);
      setName('');
      setAddress('');
      setPincode('');
      setContactPhone('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create PG Property');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Add New PG Property</Text>
              <Text style={styles.modalSubtitle}>Establish a new property under your administration</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PG / Property Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Royal Living PG"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contact Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor="#94A3B8"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Address / Street</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 52, 2nd Main, Koramangala"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bengaluru"
                  placeholderTextColor="#94A3B8"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Karnataka"
                  placeholderTextColor="#94A3B8"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 560034"
                placeholderTextColor="#94A3B8"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Create Property</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
  },
  formScroll: {
    maxHeight: 380,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  saveButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
