import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  collectionGroup,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, Organization, OrganizationMember, Transaction, Notification } from './types';

// Helper to sanitize emails for Firestore document IDs
export function getEmailSlug(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
}

// --- LOCAL STORAGE WORKSPACE INITIALIZATION & SEEDING ---
export function initLocalWorkspace() {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem('budget_ally_guest_profile')) {
    const defaultProfile: UserProfile = {
      uid: 'guest-sandbox-uid',
      displayName: 'Guest Officer',
      email: 'guest@budgetally.local',
      avatarUrl: '',
      theme: 'indigo',
      bannerColor: '#4f46e5',
      bio: 'Zero-configuration offline safe workspace sandbox'
    };
    localStorage.setItem('budget_ally_guest_profile', JSON.stringify(defaultProfile));
  }

  const localOrgsStr = localStorage.getItem('budget_ally_local_orgs');
  let currentOrgs: Organization[] = [];
  if (localOrgsStr) {
    try {
      currentOrgs = JSON.parse(localOrgsStr);
    } catch (e) {
      currentOrgs = [];
    }
  }

  const hasDemoOrg = currentOrgs.some(o => o.id === 'demo-org-1');
  if (!hasDemoOrg) {
    const demoOrg: Organization = {
      id: 'demo-org-1',
      name: 'Student Activities Board',
      description: 'Unified financial workspace for campus-wide events, leadership workshops, and outreach.',
      logoUrl: '',
      colorTheme: 'indigo',
      createdBy: 'guest-sandbox-uid',
      createdAt: new Date().toISOString()
    };
    currentOrgs.push(demoOrg);
    localStorage.setItem('budget_ally_local_orgs', JSON.stringify(currentOrgs));

    // Seed first member
    const firstMember: OrganizationMember = {
      userId: 'guest-sandbox-uid',
      email: 'guest@budgetally.local',
      displayName: 'Guest Officer',
      role: 'admin',
      joinedAt: new Date().toISOString()
    };
    localStorage.setItem('budget_ally_local_members_demo-org-1', JSON.stringify([firstMember]));

    // Seed default transactions
    const now = new Date();
    const subDays = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const demoTxs: Transaction[] = [
      {
        id: 'tx-demo-1',
        title: 'Spring Concert Grant Funding',
        description: 'Approved Student Council Special Activities Allocation',
        type: 'income',
        amount: 2500,
        category: 'Grant',
        date: subDays(5),
        createdBy: 'guest-sandbox-uid',
        createdByName: 'Guest Officer',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx-demo-2',
        title: 'Concert Venue Audio Rental',
        description: 'Deposit paid for professional sub-woofers & lighting',
        type: 'expense',
        amount: 1200,
        category: 'Equipment',
        date: subDays(3),
        createdBy: 'guest-sandbox-uid',
        createdByName: 'Guest Officer',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx-demo-3',
        title: 'Kickoff Planning Pizza & Drinks',
        description: 'Officer meeting catering',
        type: 'expense',
        amount: 85.50,
        category: 'Catering',
        date: subDays(1),
        createdBy: 'guest-sandbox-uid',
        createdByName: 'Guest Officer',
        createdAt: new Date().toISOString()
      },
      {
         id: 'tx-demo-4',
         title: 'Student Ticket Sales (Online)',
         description: 'First wave custom merchandise and online tickets presale',
         type: 'income',
         amount: 450,
         category: 'Operations',
         date: subDays(0),
         createdBy: 'guest-sandbox-uid',
         createdByName: 'Guest Officer',
         createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('budget_ally_local_transactions_demo-org-1', JSON.stringify(demoTxs));
  }
}

// --- USER PROFILE OPERATIONS ---

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (uid === 'guest-sandbox-uid') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_guest_profile');
    return str ? JSON.parse(str) : null;
  }

  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function createUserProfile(uid: string, email: string, displayName: string, avatarUrl: string = ''): Promise<UserProfile> {
  const profile: UserProfile = {
    uid,
    displayName: displayName || email.split('@')[0],
    email: email.toLowerCase(),
    avatarUrl,
    theme: 'indigo',
    bannerColor: '#4f46e5',
    bio: ''
  };

  if (uid === 'guest-sandbox-uid') {
    localStorage.setItem('budget_ally_guest_profile', JSON.stringify(profile));
    return profile;
  }

  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, 'users', uid), profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const cleanedUpdates = Object.entries(updates).reduce((acc, [key, val]) => {
    if (val !== undefined) {
      acc[key] = val;
    }
    return acc;
  }, {} as any);

  if (uid === 'guest-sandbox-uid') {
    const str = localStorage.getItem('budget_ally_guest_profile');
    if (str) {
      const p = { ...JSON.parse(str), ...cleanedUpdates };
      localStorage.setItem('budget_ally_guest_profile', JSON.stringify(p));
    }
    return;
  }

  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), cleanedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- ORGANIZATION OPERATIONS ---

export async function createOrganization(
  name: string,
  description: string,
  colorTheme: string,
  logoUrl: string,
  createdByUid: string,
  createdByEmail: string,
  createdByDisplayName: string,
  type: 'personal' | 'team' = 'team'
): Promise<string> {
  const orgId = createdByUid === 'guest-sandbox-uid' 
    ? 'local-org-' + Math.random().toString(36).substring(2, 9)
    : doc(collection(db, 'organizations')).id;

  const newOrg: Organization = {
    id: orgId,
    name: name.trim(),
    description: description.trim(),
    logoUrl,
    colorTheme,
    createdBy: createdByUid,
    createdAt: new Date().toISOString(),
    type
  };

  if (createdByUid === 'guest-sandbox-uid') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_orgs') || '[]';
    const list = JSON.parse(str);
    list.push(newOrg);
    localStorage.setItem('budget_ally_local_orgs', JSON.stringify(list));

    const firstMember: OrganizationMember = {
      userId: createdByUid,
      email: createdByEmail.trim().toLowerCase(),
      displayName: createdByDisplayName,
      role: 'admin',
      joinedAt: new Date().toISOString()
    };
    localStorage.setItem('budget_ally_local_members_' + orgId, JSON.stringify([firstMember]));
    localStorage.setItem('budget_ally_local_transactions_' + orgId, JSON.stringify([]));
    return orgId;
  }

  const orgPath = `organizations/${orgId}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'organizations', orgId), newOrg);
    
    const firstMember: OrganizationMember = {
      userId: createdByUid,
      email: createdByEmail.trim().toLowerCase(),
      displayName: createdByDisplayName,
      role: 'admin',
      joinedAt: new Date().toISOString()
    };
    batch.set(doc(db, 'organizations', orgId, 'members', createdByUid), firstMember);

    await batch.commit();
    return orgId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, orgPath);
    throw error;
  }
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  if (orgId.startsWith('local-') || orgId === 'demo-org-1') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_orgs') || '[]';
    const list = JSON.parse(str) as Organization[];
    return list.find(o => o.id === orgId) || null;
  }

  const path = `organizations/${orgId}`;
  try {
    const docSnap = await getDoc(doc(db, 'organizations', orgId));
    if (docSnap.exists()) {
      return docSnap.data() as Organization;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Fetch all orgs the user is a member of
export async function getOrganizationsJoined(userEmail: string, userId: string): Promise<Organization[]> {
  if (userId === 'guest-sandbox-uid') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_orgs') || '[]';
    return JSON.parse(str);
  }

  try {
    const orgIds = new Set<string>();

    // Query both paths in parallel
    const emailQuery = query(
      collectionGroup(db, 'members'),
      where('email', '==', userEmail.trim().toLowerCase())
    );
    const uidQuery = query(
      collectionGroup(db, 'members'),
      where('userId', '==', userId)
    );

    const [emailSnap, uidSnap] = await Promise.all([
      getDocs(emailQuery),
      getDocs(uidQuery)
    ].map(p => p.catch(err => {
      console.warn('Collection group branch failed:', err);
      return { docs: [] } as any;
    })));

    emailSnap.docs.forEach((docSnap: any) => {
      const orgId = docSnap.ref.parent.parent?.id;
      if (orgId) orgIds.add(orgId);
    });

    uidSnap.docs.forEach((docSnap: any) => {
      const orgId = docSnap.ref.parent.parent?.id;
      if (orgId) orgIds.add(orgId);
    });

    if (orgIds.size === 0) return [];

    const orgPromises = Array.from(orgIds).map(async (orgId) => {
      const snap = await getDoc(doc(db, 'organizations', orgId));
      if (snap.exists()) {
        const data = snap.data();
        return {
          ...data,
          id: orgId
        } as Organization;
      }
      return null;
    });

    const results = await Promise.all(orgPromises);
    return results.filter((o) => o !== null) as Organization[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'members-collection-group');
    return [];
  }
}

// Self-heal and claim invitations
export async function claimPendingInvitations(userEmail: string, userId: string, userDisplayName: string): Promise<void> {
  if (userId === 'guest-sandbox-uid') return;

  try {
    const q = query(
      collectionGroup(db, 'members'),
      where('email', '==', userEmail.trim().toLowerCase())
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    let dirty = false;

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data() as OrganizationMember;
      const oldId = docSnap.id;
      
      if (oldId !== userId) {
        // Find the parent collection path to re-create the document with the real UID as ID
        const parentPath = docSnap.ref.parent.path; // e.g., "organizations/{orgId}/members"
        const newMemberRef = doc(db, parentPath, userId);
        
        batch.set(newMemberRef, {
          ...data,
          userId: userId,
          displayName: userDisplayName || data.displayName
        });
        batch.delete(docSnap.ref);
        dirty = true;
      } else if (!data.userId || data.userId !== userId) {
        batch.update(docSnap.ref, {
          userId: userId,
          displayName: userDisplayName || data.displayName
        });
        dirty = true;
      }
    });

    if (dirty) {
      await batch.commit();
    }
  } catch (error) {
    console.error('Failed to claim pending invitations:', error);
  }
}

// --- ORGANIZATION MEMBERS OPERATIONS ---

export async function getMembers(orgId: string): Promise<OrganizationMember[]> {
  if (orgId.startsWith('local-') || orgId === 'demo-org-1') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_members_' + orgId) || '[]';
    return JSON.parse(str);
  }

  const path = `organizations/${orgId}/members`;
  try {
    const q = collection(db, 'organizations', orgId, 'members');
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as OrganizationMember);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function addMemberToOrg(
  orgId: string,
  email: string,
  role: 'admin' | 'member',
  displayName?: string,
  userId?: string
): Promise<void> {
  const emailClean = email.trim().toLowerCase();
  const finalDisplayName = displayName || emailClean.split('@')[0];

  const newMember: OrganizationMember = {
    userId: userId || (emailClean === 'guest@budgetally.local' ? 'guest-sandbox-uid' : ''),
    email: emailClean,
    displayName: finalDisplayName,
    role,
    joinedAt: new Date().toISOString()
  };

  if (orgId.startsWith('local-') || orgId === 'demo-org-1') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_members_' + orgId) || '[]';
    const list = JSON.parse(str) as OrganizationMember[];
    if (!list.some(m => m.email === emailClean)) {
      list.push(newMember);
      localStorage.setItem('budget_ally_local_members_' + orgId, JSON.stringify(list));
    }
    return;
  }

  const emailSlug = getEmailSlug(emailClean);
  let foundUserId = userId || '';
  if (!foundUserId) {
    try {
      const usersQuery = query(collection(db, 'users'), where('email', '==', emailClean));
      const usersSnap = await getDocs(usersQuery);
      if (!usersSnap.empty) {
        foundUserId = (usersSnap.docs[0].data() as UserProfile).uid;
      }
    } catch (err) {
      console.warn('Could not scan user registry:', err);
    }
  }

  newMember.userId = foundUserId;

  const resolvedId = foundUserId || emailSlug;
  const path = `organizations/${orgId}/members/${resolvedId}`;

  try {
    await setDoc(doc(db, 'organizations', orgId, 'members', resolvedId), newMember);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeMemberFromOrg(orgId: string, memberDocId: string): Promise<void> {
  if (orgId.startsWith('local-') || orgId === 'demo-org-1') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_members_' + orgId) || '[]';
    const list = JSON.parse(str) as OrganizationMember[];
    const filtered = list.filter(m => m.userId !== memberDocId && m.email !== memberDocId);
    localStorage.setItem('budget_ally_local_members_' + orgId, JSON.stringify(filtered));
    return;
  }

  const path = `organizations/${orgId}/members/${memberDocId}`;
  try {
    await deleteDoc(doc(db, 'organizations', orgId, 'members', memberDocId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- TRANSACTION OPERATIONS ---

export async function getTransactions(orgId: string): Promise<Transaction[]> {
  if (orgId.startsWith('local-') || orgId === 'demo-org-1') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_transactions_' + orgId) || '[]';
    const list = JSON.parse(str) as Transaction[];
    return list.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const path = `organizations/${orgId}/transactions`;
  try {
    const q = collection(db, 'organizations', orgId, 'transactions');
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data() as Transaction);
    return items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function subscribeToTransactions(orgId: string, callback: (txs: Transaction[]) => void) {
  if (orgId.startsWith('local-') || orgId === 'demo-org-1') {
    initLocalWorkspace();
    const readLocal = () => {
      const stored = localStorage.getItem('budget_ally_local_transactions_' + orgId);
      if (stored) {
        try {
          const list = JSON.parse(stored) as Transaction[];
          callback(list.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (e) {
          callback([]);
        }
      } else {
        callback([]);
      }
    };
    
    readLocal();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'budget_ally_local_transactions_' + orgId) {
        readLocal();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Smooth fast updates in identical window
    const interval = setInterval(readLocal, 600);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }

  const q = collection(db, 'organizations', orgId, 'transactions');
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => d.data() as Transaction);
    const sorted = items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(sorted);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/transactions`);
  });
}

export async function addTransaction(
  orgId: string,
  tx: Omit<Transaction, 'id' | 'createdBy' | 'createdAt'>,
  userUid: string,
  userDisplayName: string
): Promise<void> {
  const txId = 'tx-' + Math.random().toString(36).substring(2, 9);
  const transaction: Transaction = {
    ...tx,
    id: txId,
    createdBy: userUid,
    createdByName: userDisplayName,
    createdAt: new Date().toISOString()
  };

  if (orgId.startsWith('local-') || orgId === 'demo-org-1') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_transactions_' + orgId) || '[]';
    const list = JSON.parse(str) as Transaction[];
    list.push(transaction);
    localStorage.setItem('budget_ally_local_transactions_' + orgId, JSON.stringify(list));
    return;
  }

  const txsCollection = collection(db, 'organizations', orgId, 'transactions');
  const path = `organizations/${orgId}/transactions/${txId}`;
  try {
    await setDoc(doc(db, 'organizations', orgId, 'transactions', txId), transaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function editTransaction(
  orgId: string,
  txId: string,
  updates: Partial<Omit<Transaction, 'id' | 'createdBy' | 'createdAt'>>
): Promise<void> {
  // Filter out any properties whose value is strictly undefined for Firestore compliance
  const cleanedUpdates = Object.entries(updates).reduce((acc, [key, val]) => {
    if (val !== undefined) {
      acc[key] = val;
    }
    return acc;
  }, {} as any);

  if (orgId.startsWith('local-') || orgId === 'demo-org-1') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_transactions_' + orgId) || '[]';
    const list = JSON.parse(str) as Transaction[];
    const idx = list.findIndex(t => t.id === txId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...cleanedUpdates };
      localStorage.setItem('budget_ally_local_transactions_' + orgId, JSON.stringify(list));
    }
    return;
  }

  const path = `organizations/${orgId}/transactions/${txId}`;
  try {
    await updateDoc(doc(db, 'organizations', orgId, 'transactions', txId), cleanedUpdates as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTransaction(orgId: string, txId: string): Promise<void> {
  if (orgId.startsWith('local-') || orgId === 'demo-org-1') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_transactions_' + orgId) || '[]';
    const list = JSON.parse(str) as Transaction[];
    const filtered = list.filter(t => t.id !== txId);
    localStorage.setItem('budget_ally_local_transactions_' + orgId, JSON.stringify(filtered));
    return;
  }

  const path = `organizations/${orgId}/transactions/${txId}`;
  try {
    await deleteDoc(doc(db, 'organizations', orgId, 'transactions', txId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateOrganization(
  orgId: string,
  updates: Partial<Omit<Organization, 'id' | 'createdBy' | 'createdAt'>>
): Promise<void> {
  // Filter out any properties whose value is strictly undefined for Firestore compatibility
  const cleanedUpdates = Object.entries(updates).reduce((acc, [key, val]) => {
    if (val !== undefined) {
      acc[key] = val;
    }
    return acc;
  }, {} as any);

  if (orgId.startsWith('local-') || orgId === 'demo-org-1') {
    initLocalWorkspace();
    const str = localStorage.getItem('budget_ally_local_orgs') || '[]';
    const list = JSON.parse(str) as Organization[];
    const idx = list.findIndex(o => o.id === orgId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...cleanedUpdates };
      localStorage.setItem('budget_ally_local_orgs', JSON.stringify(list));
    }
    return;
  }

  const path = `organizations/${orgId}`;
  try {
    await updateDoc(doc(db, 'organizations', orgId), cleanedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- NOTIFICATION / MAILBOX OPERATIONS ---

export function subscribeToNotifications(userId: string, callback: (notifs: Notification[]) => void) {
  if (userId === 'guest-sandbox-uid') {
    const readLocal = () => {
      const stored = localStorage.getItem('budget_ally_local_notifications');
      if (stored) {
        try {
          const list = JSON.parse(stored) as Notification[];
          callback(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) {
          callback([]);
        }
      } else {
        callback([]);
      }
    };
    
    readLocal();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'budget_ally_local_notifications') {
        readLocal();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(readLocal, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }

  const q = collection(db, 'users', userId, 'notifications');
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => d.data() as Notification);
    const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(sorted);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/notifications`);
  });
}

export async function createNotificationForUser(
  recipientUserId: string,
  notif: Omit<Notification, 'id' | 'status' | 'createdAt'>
): Promise<void> {
  const notifId = 'notif-' + Math.random().toString(36).substring(2, 9);
  const fullNotif: Notification = {
    ...notif,
    id: notifId,
    status: 'unread',
    createdAt: new Date().toISOString()
  };

  if (recipientUserId === 'guest-sandbox-uid') {
    const str = localStorage.getItem('budget_ally_local_notifications') || '[]';
    const list = JSON.parse(str) as Notification[];
    list.push(fullNotif);
    localStorage.setItem('budget_ally_local_notifications', JSON.stringify(list));
    return;
  }

  const path = `users/${recipientUserId}/notifications/${notifId}`;
  try {
    await setDoc(doc(db, 'users', recipientUserId, 'notifications', notifId), fullNotif);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationStatus(
  userId: string,
  notifId: string,
  status: 'unread' | 'read' | 'accepted' | 'declined'
): Promise<void> {
  if (userId === 'guest-sandbox-uid') {
    const str = localStorage.getItem('budget_ally_local_notifications') || '[]';
    const list = JSON.parse(str) as Notification[];
    const idx = list.findIndex(n => n.id === notifId);
    if (idx !== -1) {
      list[idx].status = status;
      localStorage.setItem('budget_ally_local_notifications', JSON.stringify(list));
    }
    return;
  }

  const path = `users/${userId}/notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', notifId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function notifyBudgetCollaborators(
  orgId: string,
  senderUid: string,
  title: string,
  message: string,
  orgName: string
): Promise<void> {
  try {
    const roster = await getMembers(orgId);
    const promises = roster
      .filter(m => m.userId && m.userId !== senderUid)
      .map(m => {
        return createNotificationForUser(m.userId, {
          type: 'budget_change',
          title,
          message,
          orgId,
          orgName
        });
      });
    await Promise.all(promises);
  } catch (err) {
    console.warn('Silent alert dispatch failed:', err);
  }
}

export async function joinWorkspaceByCode(
  orgId: string,
  userId: string,
  userEmail: string,
  userDisplayName: string,
  targetRole: 'admin' | 'member' = 'member'
): Promise<string> {
  const org = await getOrganization(orgId);
  if (!org) {
    throw new Error('Workspace code/ID could not be located in secure records.');
  }

  // Verify if they are already in members roster to prevent duplication
  const roster = await getMembers(orgId);
  const existsMatched = roster.some(m => m.userId === userId || m.email.toLowerCase() === userEmail.toLowerCase());
  if (existsMatched) {
    return org.name; // user already member, let them in!
  }

  await addMemberToOrg(orgId, userEmail, targetRole, userDisplayName, userId);
  return org.name;
}

export async function inviteTeammateByMailbox(
  orgId: string,
  orgName: string,
  senderEmail: string,
  senderDisplayName: string,
  recipientEmail: string,
  role: 'admin' | 'member'
): Promise<void> {
  const emailClean = recipientEmail.trim().toLowerCase();

  // Create organization member record (pending or linked)
  await addMemberToOrg(orgId, emailClean, role);

  // If the user already has a profile, write a real invite notification in their mailbox!
  try {
    const q = query(collection(db, 'users'), where('email', '==', emailClean));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const recipientUser = snap.docs[0].data() as UserProfile;
      await createNotificationForUser(recipientUser.uid, {
        type: 'invite',
        title: 'Invitation: Joint Financial Space',
        message: `${senderDisplayName} (${senderEmail}) has invited you to collaborate as ${role === 'admin' ? 'an admin' : 'a member'} on "${orgName}".`,
        orgId,
        orgName,
        invitedByEmail: senderEmail,
        invitedByName: senderDisplayName,
        inviteRole: role
      });
    } else {
      console.log('Teammate email not registered yet; pending invitation claimed asynchronously on auth boot.');
    }
  } catch (err) {
    console.warn('Failed to place invitation alerts in recipient mailbox:', err);
  }
}

