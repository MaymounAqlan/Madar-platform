import type { UniversityApprovalStatus } from './university.types';

export interface AdminUniversity {
  _id: string;
  name: string;
  description?: string;
  branding?: { logoUrl?: string };
  location?: { city?: string; country?: string; address?: string };
  contactInfo?: { email?: string; phone?: string; website?: string; hrEmail?: string };
  userId?: string | { _id?: string; email?: string; status?: string };
  status: UniversityApprovalStatus;
  submittedAt?: string;
  createdAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  aliases?: string[];
  institutionType?: 'public_university' | 'private_university' | 'community_college' | 'university_college' | 'institute' | 'academy';
  ownership?: 'public' | 'private' | 'mixed';
  governorate?: string;
  city?: string;
  website?: string;
  officialEmail?: string;
  phoneNumbers?: string[];
  logoUrl?: string | null;
  sourceUrls?: string[];
  verificationStatus?: 'verified' | 'partially_verified' | 'unverified';
  accreditationStatus?: 'accredited' | 'licensed' | 'pending' | 'unknown';
  lastVerifiedAt?: string;
  isSeedData?: boolean;
  isActive?: boolean;
}

export interface DirectoryUniversityInput {
  nameAr: string;
  nameEn?: string;
  slug: string;
  aliases?: string[];
  institutionType: 'public_university' | 'private_university' | 'community_college' | 'university_college' | 'institute' | 'academy';
  ownership: 'public' | 'private' | 'mixed';
  governorate: string;
  city?: string;
  website?: string;
  officialEmail?: string;
  phoneNumbers?: string[];
  sourceUrls?: string[];
  verificationStatus: 'verified' | 'partially_verified' | 'unverified';
  accreditationStatus?: 'accredited' | 'licensed' | 'pending' | 'unknown';
  establishedYear?: number;
  isActive?: boolean;
}

export interface AdminUniversityPage {
  items: AdminUniversity[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
