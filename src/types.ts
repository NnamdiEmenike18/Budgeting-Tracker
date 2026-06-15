export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  theme?: string;
  bannerColor?: string;
  bio?: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  colorTheme: string; // e.g., 'emerald', 'sky', 'amber', 'rose', 'indigo', 'violet'
  createdBy: string;
  createdAt: any; // Timestamp or date-string
  type?: 'personal' | 'team';
}

export interface OrganizationMember {
  userId: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'member';
  joinedAt: any;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // YYYY-MM-DD
  description?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  type: 'budget_change' | 'invite' | 'info';
  title: string;
  message: string;
  orgId: string;
  orgName?: string;
  invitedByEmail?: string;
  invitedByName?: string;
  inviteRole?: 'admin' | 'member';
  status: 'unread' | 'read' | 'accepted' | 'declined';
  createdAt: string; // date-time string
}

