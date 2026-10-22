// Database and entity types for NESTIQ

export type PlatformRole = 'super_admin';
export type PropertyRole = 'admin' | 'tenant';
export type UserRole = 'super_admin' | 'admin' | 'tenant' | 'none';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  preferred_language: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: PlatformRole;
  created_at: string;
}

export interface PGProperty {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PGMembership {
  id: string;
  user_id: string;
  property_id: string;
  role: PropertyRole;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
  property_name?: string;
}

export interface UserContextData {
  user_id: string;
  profile: Profile | null;
  is_super_admin: boolean;
  memberships: PGMembership[];
}
