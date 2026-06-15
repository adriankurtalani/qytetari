export type UserRole = 'citizen' | 'business' | 'municipality' | 'admin';
export type ReportStatus = 'pending_review' | 'approved' | 'rejected' | 'in_progress' | 'resolved';
export type VoteType = 'support' | 'disagree';
export type BanType = 'temporary' | 'permanent';
export type SubscriptionTier = 'free' | 'verified' | 'premium';
export type NotificationType =
  | 'report_approved'
  | 'report_rejected'
  | 'new_comment'
  | 'status_changed'
  | 'business_response';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  profile_photo_url: string | null;
  city: string | null;
  anonymous_mode: boolean;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

export interface Report {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  title: string;
  description: string;
  category_id: string | null;
  business_name: string | null;
  business_id: string | null;
  latitude: number;
  longitude: number;
  city: string;
  status: ReportStatus;
  ai_recommendation: AIRecommendation | null;
  ai_flagged: boolean;
  support_count: number;
  disagree_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  photos?: ReportPhoto[];
  profile?: Profile;
}

export interface ReportPhoto {
  id: string;
  report_id: string;
  storage_path: string;
  url: string;
}

export interface Vote {
  id: string;
  report_id: string;
  user_id: string | null;
  anonymous_id: string | null;
  vote_type: VoteType;
}

export interface Comment {
  id: string;
  report_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_moderated: boolean;
  is_flagged: boolean;
  created_at: string;
  profile?: Profile;
  replies?: Comment[];
}

export interface Business {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  logo_url: string | null;
  city: string | null;
  is_verified: boolean;
  subscription_tier: SubscriptionTier;
  reputation_score: number;
  created_at: string;
}

export interface BusinessResponse {
  id: string;
  business_id: string;
  report_id: string;
  content: string;
  resolution_evidence_url: string | null;
  created_at: string;
  business?: Business;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface IPBan {
  id: string;
  ip_address: string;
  reason: string;
  ban_type: BanType;
  expires_at: string | null;
  violation_count: number;
}

export interface BannedWord {
  id: string;
  word: string;
  created_by: string | null;
  is_active: boolean;
}

export interface AIRecommendation {
  approved: boolean;
  confidence: number;
  reasons: string[];
  flags: string[];
  duplicate_check: boolean;
}

export type FeedSort = 'latest' | 'most_supported' | 'trending';

export interface ReportFilters {
  city?: string;
  category?: string;
  status?: ReportStatus;
  dateFrom?: string;
  dateTo?: string;
  sort?: FeedSort;
}

export interface SiteSettings {
  id: number;
  platform_name: string;
  platform_tagline: string;
  site_title: string;
  site_description: string;
  logo_url: string | null;
  logo_abbr: string;
  favicon_url: string | null;
  hero_badge: string;
  hero_title: string | null;
  hero_description: string | null;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  footer_description: string;
  footer_tagline: string;
  mission_text: string;
  updated_at: string;
  updated_by: string | null;
}

export type SiteSettingsUpdate = Partial<
  Omit<SiteSettings, 'id' | 'updated_at' | 'updated_by'>
>;
