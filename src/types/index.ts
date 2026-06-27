// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface SalesRepUser {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  roles: string[];
  status: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: SalesRepUser;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Onboarding ─────────────────────────────────────────────────────────────--
export interface TutorialStep {
  id: string;
  orderIndex: number;
  title: string;
  body: string;
  active: boolean;
}

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface Assessment {
  passMark: number;
  questions: AssessmentQuestion[];
}

export interface AssessmentResult {
  passed: boolean;
  scorePct: number;
  score: number;
  total: number;
  passMark: number;
  code: string | null;
}

// ─── Referrals & dashboard ─────────────────────────────────────────────────────
export type ReferralStatus = 'pending' | 'available' | 'paid' | 'rejected';

export interface Referral {
  id: string;
  referredType: 'customer' | 'vendor';
  status: ReferralStatus;
  rewardCurrency: 'cash' | 'wp';
  rewardAmount: number | null;
  rewardValue: number | null;
  createdAt: string;
  unlockedAt: string | null;
  paidAt: string | null;
  referredName?: string | null;
  referredEmail?: string | null;
}

export interface ReferralSummary {
  code: string | null;
  counts: { pending: number; available: number; paid: number };
  payout: { pending: number; available: number; paid: number };
  referrals: Referral[];
}

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SalesRepPayout {
  id: string;
  amountNaira: number;
  status: PayoutStatus;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  completedAt: string | null;
  failureReason: string | null;
}

export interface DashboardProfile {
  status: 'onboarding' | 'active' | 'suspended';
  assessmentPassed: boolean;
  bestScorePct: number;
  passedAt: string | null;
  bank: {
    bankCode: string | null;
    accountNumber: string | null;
    accountName: string | null;
  };
}

export interface Dashboard {
  profile: DashboardProfile;
  referral: ReferralSummary;
  payouts: SalesRepPayout[];
}
