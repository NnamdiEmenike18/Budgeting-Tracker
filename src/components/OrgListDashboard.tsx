import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getOrganizationsJoined, subscribeToNotifications, markNotificationStatus, joinWorkspaceByCode } from '../dbService';
import { Organization, Notification } from '../types';
import { 
  Plus, 
  Settings, 
  LogOut, 
  Building2, 
  Briefcase, 
  ArrowRight, 
  ShieldCheck, 
  Coins, 
  Users,
  User,
  PiggyBank,
  Mail,
  Bell,
  Check,
  X,
  FileText
} from 'lucide-react';

interface OrgListDashboardProps {
  onNavigate: (view: string) => void;
  onSelectOrg: (orgId: string) => void;
}

export default function OrgListDashboard({ onNavigate, onSelectOrg }: OrgListDashboardProps) {
  const { user, userProfile, logout } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMailboxModal, setShowMailboxModal] = useState(false);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Subscribe to real-time notification mailbox
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, (items) => {
      setNotifications(items);
      setUnreadCount(items.filter(n => n.status === 'unread').length);
    });
    return () => unsub();
  }, [user]);

  const handleAcceptInvite = async (n: Notification) => {
    try {
      await joinWorkspaceByCode(
        n.orgId, 
        user!.uid, 
        user!.email || '', 
        userProfile?.displayName || user!.email?.split('@')[0] || 'Teammate'
      );
      await markNotificationStatus(user!.uid, n.id, 'accepted');
      const joined = await getOrganizationsJoined(user!.email || '', user!.uid);
      setOrgs(joined);
    } catch (err: any) {
      alert(`Could not join: ${err.message}`);
    }
  };

  const handleDeclineInvite = async (n: Notification) => {
    try {
      await markNotificationStatus(user!.uid, n.id, 'declined');
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationStatus(user!.uid, id, 'read');
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinByCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (!joinCodeInput.trim()) {
      setJoinError('Please enter a valid organization identifier code.');
      return;
    }

    try {
      const orgName = await joinWorkspaceByCode(
        joinCodeInput.trim(),
        user!.uid,
        user!.email || '',
        userProfile?.displayName || user!.email?.split('@')[0] || 'Teammate'
      );
      setShowJoinModal(false);
      setJoinCodeInput('');
      const joined = await getOrganizationsJoined(user!.email || '', user!.uid);
      setOrgs(joined);
    } catch (err: any) {
      setJoinError(err.message || 'Invitation code not found or invalid.');
    }
  };

  // Load organizations
  useEffect(() => {
    async function fetchOrgs() {
      if (user) {
        setLoading(true);
        try {
          const joined = await getOrganizationsJoined(user.email || '', user.uid);
          setOrgs(joined);
        } catch (err) {
          console.error('Error fetching user joined organizations:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchOrgs();
  }, [user]);

  // Color mappings for modern themes (Professional solid profiles)
  const colorMap: { [key: string]: { border: string, bg: string, text: string, accent: string, badge: string } } = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-250', text: 'text-emerald-800', accent: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-850' },
    sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-850', accent: 'bg-sky-500', badge: 'bg-sky-100 text-sky-900' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-850', accent: 'bg-violet-600', badge: 'bg-violet-100 text-violet-900' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-850', accent: 'bg-rose-505', badge: 'bg-rose-100 text-rose-900' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-850', accent: 'bg-amber-500', badge: 'bg-amber-100 text-amber-900' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-850', accent: 'bg-indigo-600', badge: 'bg-indigo-100 text-indigo-900' }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Global Navigation Bar */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shadow-sm">
              <PiggyBank className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">BudgetAlly</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-500">
            <span onClick={() => onNavigate('dashboard')} className="text-indigo-600 border-b-2 border-indigo-600 h-16 flex items-center px-2 cursor-pointer transition-all">Organizations</span>
            <span onClick={() => onNavigate('profile')} className="hover:text-slate-900 h-16 flex items-center px-2 cursor-pointer transition-colors">Settings</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User Profile Hook */}
          <button 
            id="btn-profile-nav"
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-3 hover:bg-slate-50 p-1 rounded-lg transition-all text-left border border-transparent hover:border-slate-100 cursor-pointer"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-900">
                {userProfile?.displayName || user?.email?.split('@')[0] || 'Active Officer'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                {userProfile?.bio ? `${userProfile.bio.slice(0, 20)}...` : 'Executive Officer'}
              </p>
            </div>
            {userProfile?.avatarUrl ? (
              <img 
                src={userProfile.avatarUrl} 
                alt="avatar" 
                className="w-9 h-9 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-white shadow-sm">
                {(userProfile?.displayName?.[0] || user?.email?.[0] || 'O').toUpperCase()}
              </div>
            )}
          </button>

          {/* Mailbox Bell Button */}
          <button
            id="btn-trigger-mailbox"
            onClick={() => setShowMailboxModal(true)}
            title="Notification Mailbox"
            className="p-2 text-slate-550 hover:text-indigo-600 hover:bg-slate-50 rounded-lg relative transition-all cursor-pointer mr-1"
          >
            <Mail className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-orange-650 outline-2 outline-white text-white font-sans font-bold text-[9px] flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Logout Trigger */}
          <button
            id="btn-logout"
            onClick={async () => {
              await logout();
              onNavigate('landing');
            }}
            title="Logout Account"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Direct Sandbox Workspace Body */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Your Budget Workspaces
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure financial segments operating within complete database isolation models.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-join-org-code"
              onClick={() => {
                setJoinError(null);
                setShowJoinModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-slate-500" /> Join with Code
            </button>
            <button
              id="btn-create-org-top"
              onClick={() => onNavigate('create-org')}
              className="inline-flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md shadow-indigo-100 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Create Organization
            </button>
          </div>
        </div>

        {/* Dynamic List Content */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider font-mono">Querying secure sandboxes...</p>
          </div>
        ) : orgs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-2xl mx-auto my-10 flex flex-col items-center gap-5 shadow-sm">
            <div className="w-16 h-16 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">No organizations found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                You haven't been added to any budgeting workspace yet. Create a brand new organization workspace, or wait for an admin officer to invite your email <span className="font-semibold text-indigo-605">{user?.email}</span>.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                id="btn-join-org-empty"
                onClick={() => {
                  setJoinError(null);
                  setShowJoinModal(true);
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-6 py-3 rounded-lg transition-all shadow-sm cursor-pointer uppercase tracking-wider"
              >
                Join with Code
              </button>
              <button
                id="btn-create-org-empty"
                onClick={() => onNavigate('create-org')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-lg transition-all shadow-md shadow-indigo-100 cursor-pointer uppercase tracking-wider"
              >
                Create Your First Organization
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgs.map((org) => {
              const theme = colorMap[org.colorTheme] || colorMap.emerald;
              return (
                <div 
                  id={`org-card-${org.id}`}
                  key={org.id}
                  onClick={() => {
                    onSelectOrg(org.id);
                    onNavigate('budget-dashboard');
                  }}
                  className="bg-white border border-slate-200 hover:border-indigo-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="p-5 flex flex-col gap-4">
                    {/* Organization Banner Theme Accent */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {org.logoUrl ? (
                          <img 
                            src={org.logoUrl} 
                            alt="logo" 
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg ${theme.bg} ${theme.text} flex items-center justify-center font-bold text-lg border border-slate-100`}>
                            {org.name[0]?.toUpperCase() || 'O'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                              {org.name}
                            </h3>
                            {org.type === 'personal' ? (
                              <span className="inline-flex items-center bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono">
                                Personal
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono">
                                Team
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tight uppercase leading-none">
                            SEGMENT ID: {org.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className={`w-2.5 h-2.5 rounded-full ${theme.accent}`} />
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
                      {org.description || 'No custom description provided for this sandbox segment.'}
                    </p>

                    {/* Metadata summary */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        {org.type === 'personal' ? (
                          <>
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold">Private Ledger</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs">Active Officers</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-505 justify-end">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Isolated</span>
                      </div>
                    </div>
                  </div>

                  {/* Access footer */}
                  <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-900 transition-colors">
                    <span>Manage Financial Space</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-indigo-600" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* DIALOG MODAL: Join Workspace with Code */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-sm bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden p-6 relative">
            <button
              id="btn-close-join-modal"
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-base text-slate-900 mb-1 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-indigo-600" />
              Join Budget Workspace
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-normal">
              Insert a shared workspace identifier code (or organization segment ID) to register yourself instantly as an authorized collaborator.
            </p>

            <form onSubmit={handleJoinByCodeSubmit} className="space-y-4">
              {joinError && (
                <div id="join-code-error-box" className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 leading-normal">
                  <span className="font-bold">Invalid Entry:</span> {joinError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Workspace Invitation Code
                </label>
                <input
                  id="input-join-code"
                  type="text"
                  placeholder="e.g. kF9wVw..."
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  required
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5">
                <button
                  id="btn-cancel-join-code"
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-join-code"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Verify & Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODAL: Mailbox & Notifications */}
      {showMailboxModal && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] relative animate-fade-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200">
                  <Mail className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 leading-normal">
                    Collaborator Mailbox
                  </h3>
                  <p className="text-[9px] text-slate-450 uppercase tracking-widest font-mono font-bold">
                    Segment Updates & Pending Invites
                  </p>
                </div>
              </div>
              <button
                id="btn-close-mailbox"
                onClick={() => setShowMailboxModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-350 flex items-center justify-center border border-slate-100">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Your mailbox is empty</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-normal">
                      Notifications regarding budget activity, balance changes, and workspace collaborations will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    id={`notif-card-${n.id}`}
                    key={n.id}
                    className={`border rounded-xl p-3.5 transition-all flex gap-3 ${
                      n.status === 'unread' 
                        ? 'bg-indigo-50/40 border-indigo-100/70 shadow-2xs' 
                        : 'bg-white border-slate-150'
                    }`}
                  >
                    {/* Visual Badge indicator */}
                    <div className="shrink-0">
                      {n.type === 'invite' ? (
                        <div className="w-8 h-8 rounded-lg bg-indigo-105 text-indigo-705 flex items-center justify-center border border-indigo-200">
                          <Users className="w-3.5 h-3.5 text-indigo-650" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
                          <Coins className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      )}
                    </div>

                    {/* Notification description text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2.5 mb-1">
                        <span className="font-bold text-xs text-slate-900 block truncate leading-tight">
                          {n.title}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap block mt-0.5">
                          {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 leading-normal break-words mb-2.5">
                        {n.message}
                      </p>

                      {/* Dynamic CTA controls */}
                      <div className="flex items-center justify-between gap-3 mt-1.5 pt-1.5 border-t border-slate-50">
                        {n.type === 'invite' && (n.status === 'unread' || n.status === 'read') ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              id={`btn-accept-invite-${n.id}`}
                              onClick={() => handleAcceptInvite(n)}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Join
                            </button>
                            <button
                              id={`btn-decline-invite-${n.id}`}
                              onClick={() => handleDeclineInvite(n)}
                              className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              <X className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        ) : n.type === 'invite' ? (
                          <span className={`text-[9px] font-bold uppercase tracking-wider font-mono ${n.status === 'accepted' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {n.status}
                          </span>
                        ) : <div />}

                        {n.status === 'unread' && (
                          <button
                            id={`btn-mark-read-${n.id}`}
                            onClick={() => handleMarkRead(n.id)}
                            className="text-[9px] font-bold text-indigo-650 hover:text-indigo-850 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 uppercase font-mono tracking-widest px-5">
              <span>{unreadCount} UNREAD EVENTS</span>
              <span>SECURED SYSTEM</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status/Sim Bar */}
      <footer className="h-10 bg-slate-800 text-slate-300 flex items-center justify-between px-6 text-[9px] uppercase tracking-widest shrink-0 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Real-time Sync Active</span>
          <span className="text-slate-600">|</span>
          <span>Auto-Calculating Totals</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Database: Secure Firestore</span>
          <span className="text-slate-600">|</span>
          <span>v0.4.2-MVP</span>
        </div>
      </footer>
    </div>
  );
}
