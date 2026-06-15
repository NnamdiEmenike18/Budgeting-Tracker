import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { 
  getOrganization, 
  getMembers, 
  addMemberToOrg, 
  removeMemberFromOrg, 
  addTransaction, 
  editTransaction, 
  deleteTransaction,
  subscribeToTransactions,
  updateOrganization,
  notifyBudgetCollaborators,
  inviteTeammateByMailbox
} from '../dbService';
import { Organization, OrganizationMember, Transaction } from '../types';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  User,
  Lock,
  ShieldCheck,
  PlusCircle, 
  MinusCircle, 
  Calendar, 
  Tag, 
  Trash2, 
  Edit3, 
  X, 
  UserPlus, 
  Sparkles, 
  Undo,
  HelpCircle,
  Clock,
  Briefcase,
  Settings
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface OrgBudgetDashboardProps {
  orgId: string;
  onNavigate: (view: string) => void;
}

export default function OrgBudgetDashboard({ orgId, onNavigate }: OrgBudgetDashboardProps) {
  const { user, userProfile } = useAuth();
  
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [userRole, setUserRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(true);

  // Dialog & Modal Control
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [currentTx, setCurrentTx] = useState<Transaction | null>(null); // For editing
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Workspace settings form states
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsLogo, setSettingsLogo] = useState('');
  const [settingsTheme, setSettingsTheme] = useState('');

  // Populate settings states when modal becomes active
  useEffect(() => {
    if (org) {
      setSettingsName(org.name || '');
      setSettingsDesc(org.description || '');
      setSettingsLogo(org.logoUrl || '');
      setSettingsTheme(org.colorTheme || 'emerald');
    }
  }, [org, showSettingsModal]);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Transaction form states
  const [txTitle, setTxTitle] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState('Fundraiser');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDesc, setTxDesc] = useState('');
  const [txError, setTxError] = useState<string | null>(null);

  // Simulation mode toggles for MVP forecasts
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulatedTxs, setSimulatedTxs] = useState<Transaction[]>([]);

  // Organization-specific color palette maps
  const colorMap: { [key: string]: { 
    border: string, 
    bg: string, 
    text: string, 
    accent: string, 
    badge: string, 
    darkAccent: string,
    sidebarHeaders: string 
  } } = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', accent: 'bg-emerald-600', darkAccent: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-850', sidebarHeaders: 'border-emerald-100 bg-emerald-50/50' },
    sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-850', accent: 'bg-sky-500', darkAccent: 'text-sky-500', badge: 'bg-sky-100 text-sky-900', sidebarHeaders: 'border-sky-100 bg-sky-50/50' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-850', accent: 'bg-violet-600', darkAccent: 'text-violet-600', badge: 'bg-violet-100 text-violet-900', sidebarHeaders: 'border-violet-100 bg-violet-50/50' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-850', accent: 'bg-rose-505', darkAccent: 'text-rose-500', badge: 'bg-rose-100 text-rose-900', sidebarHeaders: 'border-rose-100 bg-rose-50/50' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-850', accent: 'bg-amber-500', darkAccent: 'text-amber-600', badge: 'bg-amber-100 text-amber-900', sidebarHeaders: 'border-amber-100 bg-amber-50/50' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-850', accent: 'bg-indigo-600', darkAccent: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-900', sidebarHeaders: 'border-indigo-100 bg-indigo-50/50' }
  };

  const theme = org ? (colorMap[org.colorTheme] || colorMap.emerald) : colorMap.emerald;

  // Initial load
  useEffect(() => {
    async function initDashboard() {
      if (!orgId || !user) return;
      setLoading(true);
      try {
        const orgData = await getOrganization(orgId);
        setOrg(orgData);

        const memberList = await getMembers(orgId);
        setMembers(memberList);

        // Map user's current role
        const matched = memberList.find(m => m.userId === user.uid || m.email.toLowerCase() === user.email?.toLowerCase());
        if (matched) {
          setUserRole(matched.role);
        }
      } catch (err) {
        console.error('Error fetching dashboard organization details:', err);
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, [orgId, user]);

  // Subscribe to real-time transactions
  useEffect(() => {
    if (!orgId) return;
    const unsubscribe = subscribeToTransactions(orgId, (txs) => {
      setTransactions(txs);
      setSimulatedTxs(txs); // Default simulated state matches active DB state
    });
    return () => unsubscribe();
  }, [orgId]);

  // Category selections
  const categories = org?.type === 'personal'
    ? (txType === 'income'
        ? ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income']
        : ['Housing/Rent', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Healthcare', 'Savings/Investments', 'Miscellaneous'])
    : (txType === 'income'
        ? ['Fundraiser', 'Donation', 'Membership Dues', 'Sponsorship', 'Other Income']
        : ['Event Costs', 'Supplies', 'Marketing', 'Transportation', 'Miscellaneous']);

  useEffect(() => {
    if (!categories.includes(txCategory)) {
      setTxCategory(categories[0] || '');
    }
  }, [txType, org?.type, categories]);

  // Calculations for transactions (Supporting Live Simulation Mode switching)
  const activeTxs = simulationMode ? simulatedTxs : transactions;

  const totalEarned = activeTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = activeTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const availableBudget = totalEarned - totalSpent;

  // Modal Open Action Helper
  const openTxModal = (tx: Transaction | null = null) => {
    setTxError(null);
    if (tx) {
      setCurrentTx(tx);
      setTxTitle(tx.title);
      setTxType(tx.type);
      setTxCategory(tx.category);
      setTxAmount(tx.amount.toString());
      setTxDate(tx.date);
      setTxDesc(tx.description || '');
    } else {
      setCurrentTx(null);
      setTxTitle('');
      setTxType('income');
      setTxCategory('Fundraiser');
      setTxAmount('');
      setTxDate(new Date().toISOString().split('T')[0]);
      setTxDesc('');
    }
    setShowTxModal(true);
  };

  // Transaction Add/Edit Submit (With optional Simulation updates)
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);

    const amountNum = parseFloat(txAmount);
    if (!txTitle.trim() || isNaN(amountNum) || amountNum < 0) {
      setTxError('Valid title and amount required.');
      return;
    }

    if (simulationMode) {
      // Execute in Simulated State ONLY
      if (currentTx) {
        const updated = simulatedTxs.map(t => t.id === currentTx.id ? {
          ...t,
          title: txTitle.trim(),
          type: txType,
          category: txCategory,
          amount: amountNum,
          date: txDate,
          description: txDesc
        } as Transaction : t);
        setSimulatedTxs(updated);
      } else {
        const dummyId = `sim-${Date.now()}`;
        const dummyTx: Transaction = {
          id: dummyId,
          title: txTitle.trim(),
          amount: amountNum,
          type: txType,
          category: txCategory,
          date: txDate,
          description: txDesc,
          createdBy: user?.uid || 'sim-user',
          createdByName: 'Simulated User',
          createdAt: new Date().toISOString()
        };
        setSimulatedTxs([dummyTx, ...simulatedTxs]);
      }
      setShowTxModal(false);
      return;
    }

    // Standard Real-Time Database Commit
    try {
      if (currentTx) {
        await editTransaction(orgId, currentTx.id, {
          title: txTitle.trim(),
          type: txType,
          category: txCategory,
          amount: amountNum,
          date: txDate,
          description: txDesc
        });
        await notifyBudgetCollaborators(
          orgId,
          user!.uid,
          `Transaction Updated: ${txTitle.trim()}`,
          `Teammate ${userProfile?.displayName || user!.email?.split('@')[0]} modified transaction details for "${txTitle.trim()}" (Value: $${amountNum}).`,
          org?.name || 'Workspace'
        );
      } else {
        await addTransaction(orgId, {
          title: txTitle.trim(),
          type: txType,
          category: txCategory,
          amount: amountNum,
          date: txDate,
          description: txDesc
        }, user!.uid, userProfile?.displayName || user!.email?.split('@')[0] || 'Officer');
        await notifyBudgetCollaborators(
          orgId,
          user!.uid,
          `New ${txType === 'income' ? 'Income' : 'Expense'} Logged`,
          `Teammate ${userProfile?.displayName || user!.email?.split('@')[0]} logged a new $${amountNum} ${txType} ("${txTitle.trim()}") under "${txCategory}".`,
          org?.name || 'Workspace'
        );
      }
      setShowTxModal(false);
    } catch (err: any) {
      setTxError(err.message || 'Firestore block: permission denied or data constraints failed.');
    }
  };

  // Transaction Delete
  const handleDeleteTx = async (txId: string) => {
    if (simulationMode) {
      setSimulatedTxs(simulatedTxs.filter(t => t.id !== txId));
      return;
    }

    if (window.confirm('Are you sure you want to delete this transaction permanently?')) {
      try {
        const targetTx = transactions.find(t => t.id === txId);
        await deleteTransaction(orgId, txId);
        await notifyBudgetCollaborators(
          orgId,
          user!.uid,
          `Transaction Deleted`,
          `Teammate ${userProfile?.displayName || user!.email?.split('@')[0]} removed transaction record: "${targetTx?.title || 'Untitled'}" (Value: $${targetTx?.amount || 0.0}).`,
          org?.name || 'Workspace'
        );
      } catch (err) {
        console.error('Delete transaction failed:', err);
      }
    }
  };

  // Collaboration Member Invites List
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteError('Please enter a valid teammate email address.');
      return;
    }

    try {
      await inviteTeammateByMailbox(
        orgId,
        org?.name || 'Workspace',
        user!.email || '',
        userProfile?.displayName || user!.email?.split('@')[0] || 'Active Admin',
        inviteEmail.trim().toLowerCase(),
        inviteRole
      );
      setInviteEmail('');
      setShowInviteModal(false);
      // Reload member roster
      const updated = await getMembers(orgId);
      setMembers(updated);
    } catch (err: any) {
      setInviteError(err.message || 'Invitation failed. Verify permissions or credentials.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim()) return;

    try {
      await updateOrganization(orgId, {
        name: settingsName.trim(),
        description: settingsDesc.trim(),
        logoUrl: settingsLogo.trim() || undefined,
        colorTheme: settingsTheme
      });

      await notifyBudgetCollaborators(
        orgId,
        user!.uid,
        `Workspace Settings Updated`,
        `Teammate ${userProfile?.displayName || user!.email?.split('@')[0]} modified the name, bio, or color theme configuration for "${settingsName.trim()}".`,
        settingsName.trim()
      );

      setShowSettingsModal(false);
      const refreshed = await getOrganization(orgId);
      if (refreshed) {
        setOrg(refreshed);
      }
      alert('Workspace information successfully modified!');
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberEmail: string) => {
    const isSelf = memberUserId === user?.uid || memberEmail.toLowerCase() === user?.email?.toLowerCase();
    
    let confirmPrompt = `Are you sure you want to remove this member?`;
    if (isSelf) {
      confirmPrompt = `Are you sure you want to LEAVE this organization? You won't be able to re-enter without invitation.`;
    }

    if (window.confirm(confirmPrompt)) {
      try {
        // Document ID is either the userId if registered, or email slug if pending invitation
        const memberDocId = memberUserId || memberEmail.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
        await removeMemberFromOrg(orgId, memberDocId);
        
        if (isSelf) {
          onNavigate('dashboard');
        } else {
          // Refresh member roster
          const updated = await getMembers(orgId);
          setMembers(updated);
        }
      } catch (err) {
        console.error('Remove member failed:', err);
      }
    }
  };

  // Map Categories to graphical Recharts representation
  const categoryChartData = Object.entries(
    activeTxs.reduce((acc, current) => {
      const cat = current.category;
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += current.amount;
      return acc;
    }, {} as { [key: string]: number })
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Dynamic Header branded by user selected theme */}
      <header className={`border-b ${theme.border} ${theme.bg} transition-colors duration-250`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              id="btn-back-dashboard"
              onClick={() => onNavigate('dashboard')}
              title="Workspaces"
              className="p-2 hover:bg-white/60 border border-transparent hover:border-slate-200/50 rounded-xl text-slate-600 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              {org?.logoUrl ? (
                <img 
                  src={org.logoUrl} 
                  alt="logo" 
                  className="w-11 h-11 rounded-1.5xl border border-slate-200 object-cover bg-white"
                />
              ) : (
                <div className={`w-11 h-11 rounded-1.5xl ${theme.accent} text-white font-bold text-xl flex items-center justify-center shadow-sm`}>
                  {org?.name?.[0]?.toUpperCase() || 'O'}
                </div>
              )}
              <div>
                <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight leading-tight">
                  {org?.name || 'Isolated Finance Sandbox'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${theme.badge}`}>
                    Workspace
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {org?.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Workspace Settings Option (Only shown for Admin role) */}
            {userRole === 'admin' && (
              <button
                id="btn-trigger-settings"
                onClick={() => setShowSettingsModal(true)}
                title="Configure Workspace Settings"
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-2 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <Settings className="w-4 h-4 text-slate-500 animate-spin-hover" />
                <span className="text-xs font-semibold">Settings</span>
              </button>
            )}

            {/* Simulation Mode Toggle Button (Forecast sandbox testing) */}
            <button
              id="btn-toggle-simulation"
              onClick={() => {
                setSimulationMode(!simulationMode);
                setSimulatedTxs(transactions); // reset simulation state
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${simulationMode 
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-sm font-bold shadow-amber-50' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${simulationMode ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
              {simulationMode ? 'Edit/Forecast Simulation: ACTIVE' : 'Interactive Simulation Mode'}
            </button>

            {simulationMode && (
              <button
                id="btn-reset-simulation"
                onClick={() => {
                  setSimulatedTxs(transactions);
                }}
                title="Reset simulation variables"
                className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-850 rounded-md transition-all cursor-pointer text-xs flex items-center gap-1"
              >
                <Undo className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center min-h-[400px] gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500">Querying live financial registers...</p>
          </div>
        ) : (
          <>
            {/* Quick Warning if Simulation Active */}
            {simulationMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Forecast Simulation Mode: Enabled.</span> Edits, dynamic additions, or deletions made in this state are locally held to forecast projections and will <span className="underline">never</span> overwrite cloud databases.
                  </div>
                </div>
                <button
                  id="btn-disable-simulation"
                  onClick={() => setSimulationMode(false)}
                  className="font-bold text-amber-950 bg-amber-200 px-3 py-1 rounded-lg hover:bg-amber-300 transition-all text-[11px] uppercase tracking-wider line-none"
                >
                  Exit Forecast
                </button>
              </div>
            )}

            {/* Live Financial Metrics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Live Available Balance */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 ${availableBudget >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Available Live Budget
                  </span>
                  <div className={`p-2 rounded-xl ${availableBudget >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className={`font-display font-bold text-3xl tracking-tight ${availableBudget >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                    ${availableBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-350" /> Updates synchronously in real-time
                  </p>
                </div>
              </div>

              {/* Card 2: Cumulative Live Income */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-emerald-500 opacity-5" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Total Live Incomes
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-3xl tracking-tight text-slate-900">
                    ${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-2">
                    Inflow registers active
                  </p>
                </div>
              </div>

              {/* Card 3: Cumulative Live Expenses */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-rose-500 opacity-5" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Total Live Expenses
                  </span>
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-3xl tracking-tight text-slate-900">
                    ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <p className="text-[11px] text-rose-500 font-semibold mt-2">
                    Outflow registers active
                  </p>
                </div>
              </div>
            </div>

            {/* Split Page Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Section LEFT Columns: Transactions and ledger */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Ledger Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[400px]">
                  
                  {/* Ledger Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                        Ledger Registers
                      </h2>
                      <p className="text-xs text-slate-400">
                        Isolated historical accounts list per organization
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="btn-add-income"
                        onClick={() => {
                          setTxType('income');
                          openTxModal();
                        }}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs px-3 py-2 rounded-xl border border-emerald-200 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" /> Add Income
                      </button>
                      <button
                        id="btn-add-expense"
                        onClick={() => {
                          setTxType('expense');
                          openTxModal();
                        }}
                        className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs px-3 py-2 rounded-xl border border-rose-200 transition-all cursor-pointer"
                      >
                        <MinusCircle className="w-4 h-4" /> Add Expense
                      </button>
                    </div>
                  </div>

                  {/* Ledger List */}
                  {activeTxs.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center p-12 text-center text-slate-450 gap-3">
                      <DollarSign className="w-10 h-10 text-slate-300" />
                      <div>
                        <p className="text-sm font-semibold">No Transactions Recorded</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                          Click Add Income or Add Expense to log your first verified financial transaction in this workspace.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600 min-w-[500px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="pb-3 pl-2">Title</th>
                            <th className="pb-3 text-center">Type</th>
                            <th className="pb-3">Category</th>
                            <th className="pb-3">Logged Date</th>
                            <th className="pb-3 text-right">Value</th>
                            <th className="pb-3 pr-2 text-center">Acc</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeTxs.map((tx) => (
                            <tr id={`tx-row-${tx.id}`} key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="py-3 pl-2 max-w-[200px]">
                                <p className="font-semibold text-slate-850 truncate" title={tx.title}>
                                  {tx.title}
                                </p>
                                {tx.description && (
                                  <p className="text-[10px] text-slate-400 truncate mt-0.5 line-clamp-1" title={tx.description}>
                                    {tx.description}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-3 font-medium text-slate-500">
                                {tx.category}
                              </td>
                              <td className="py-3 font-mono text-slate-400">
                                {tx.date}
                              </td>
                              <td className={`py-3 text-right font-bold font-mono ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 pr-2 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    id={`btn-edit-tx-${tx.id}`}
                                    onClick={() => openTxModal(tx)}
                                    title="Edit Transaction"
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    id={`btn-delete-tx-${tx.id}`}
                                    onClick={() => handleDeleteTx(tx.id)}
                                    title="Delete Transaction"
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Mini instruction tip */}
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>* Hover over recorded items to access Edit / Delete controls.</span>
                    <span className="font-semibold uppercase tracking-widest text-[9px]">Verified Sandbox Isolation</span>
                  </div>
                </div>

                {/* Data Visual charts panel */}
                {activeTxs.length > 0 && (
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h2 className="font-display font-bold text-base text-slate-900 mb-1">
                      Budgetary Distributions
                    </h2>
                    <p className="text-xs text-slate-400 mb-6">
                      Categorical outflows vs inflows breakdown summaries
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {/* Sub-Card 1: Bar chart comparison */}
                      <div className="md:col-span-3 h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Total Inflow', amount: totalEarned },
                            { name: 'Total Outflow', amount: totalSpent }
                          ]}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(v: any) => [`$${parseFloat(v).toLocaleString()}`, 'Amount']} />
                            <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={40}>
                              <Cell fill="#10b981" />
                              <Cell fill="#f43f5e" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Sub-Card 2: Pie chart categories */}
                      <div className="md:col-span-2 h-[250px] w-full flex flex-col justify-center items-center">
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={categoryChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {categoryChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [`$${value}`, 'Logged']} />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Custom visual legends */}
                        <div className="flex flex-wrap gap-2 justify-center max-h-[70px] overflow-y-auto mt-2 w-full px-2">
                          {categoryChartData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="truncate max-w-[80px]">{entry.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section RIGHT Columns: Member list / Swapping control */}
              <div className="flex flex-col gap-6">
                
                {/* Board Roster / Team Roster card */}
                {org?.type === 'personal' ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600 animate-pulse" /> Private Budget Mode
                      </h2>
                      <p className="text-xs text-slate-400">
                        Solo finance tracking session
                      </p>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 text-xs text-slate-700 space-y-2">
                      <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Security Isolated Ledger
                      </div>
                      <p className="leading-relaxed">
                        This ledger is bound directly to your user account <span className="font-semibold text-slate-900">{user?.email}</span>. Team invitation and live collaboration features are completely disabled.
                      </p>
                    </div>

                    {/* Member profile as sole owner */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Authorized Identity
                      </span>
                      <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {(userProfile?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {userProfile?.displayName || user?.email?.split('@')[0]}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                          Sole Owner
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 italic">
                      Need a shared workspace to coordinate team, club, or professional budgets? Back up to the list and setup a "Team Organization".
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                          Collaborator Board
                        </h2>
                        <p className="text-xs text-slate-400">
                          Officer level roles sync access
                        </p>
                      </div>

                      {userRole === 'admin' && (
                        <button
                          id="btn-trigger-invite"
                          onClick={() => {
                            setInviteError(null);
                            setInviteEmail('');
                            setShowInviteModal(true);
                          }}
                          className="inline-flex items-center gap-1 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Invite
                        </button>
                      )}
                    </div>

                    {/* Members Stack */}
                    <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                      {members.map((member, idx) => {
                        const isOwner = member.userId === org?.createdBy;
                        return (
                          <div 
                            id={`member-row-${member.userId || idx}`}
                            key={member.userId || member.email} 
                            className="flex items-center justify-between gap-3 text-xs bg-slate-50 border border-slate-100 rounded-xl p-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${member.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}`}>
                                {member.displayName?.[0]?.toUpperCase() || member.email[0]?.toUpperCase() || 'M'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate" title={member.displayName}>
                                  {member.displayName || member.email.split('@')[0]}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate" title={member.email}>
                                  {member.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Role Label */}
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${member.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                                {isOwner ? 'Created By' : member.role}
                              </span>

                              {/* Delete Control triggered for Admins (or Leaving for users themselves) */}
                              {(userRole === 'admin' || member.userId === user?.uid || member.email.toLowerCase() === user?.email?.toLowerCase()) && !isOwner && (
                                <button
                                  id={`btn-remove-member-${member.userId || idx}`}
                                  onClick={() => handleRemoveMember(member.userId, member.email)}
                                  title={member.userId === user?.uid ? "Leave Organization Workspace" : "Remove user from Organization"}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-all cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Share Invite Code section */}
                    <div className="border-t border-slate-100 pt-4 mt-4 bg-slate-50/50 p-3.5 rounded-xl border border-dashed border-slate-250">
                      <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Invite Code / Org ID:</span>
                        <span className="text-[9px] text-indigo-650 font-bold font-mono">Join with code</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg flex-1 select-all select-text font-bold truncate">
                          {orgId}
                        </span>
                        <button
                          id="btn-copy-invite-code"
                          onClick={() => {
                            navigator.clipboard.writeText(orgId);
                            alert('Invitation code copied to clipboard successfully!');
                          }}
                          className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-indigo-200 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info / Quick Compliance Guideline Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left flex flex-col gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-bold text-xs text-slate-900 uppercase tracking-widest leading-none">
                    Security Architecture
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Financial rows are securely isolated inside sandboxed Firestore subcollections mapping. All transfers or edits validation are physically verified at server-level to guarantee Zero-Overlap transactions.
                  </p>
                </div>

              </div>

            </div>
          </>
        )}
      </main>

      {/* DIALOG MODAL: Add/Edit Transaction */}
      {showTxModal && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden p-6 relative">
            
            <button
              id="btn-close-tx-modal"
              onClick={() => setShowTxModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-lg text-slate-900 mb-1 flex items-center gap-1.5">
              {currentTx ? <Edit3 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-emerald-600" />}
              {currentTx ? 'Modify Transaction Field' : `Create New ${txType === 'income' ? 'Income' : 'Expense'}`}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {simulationMode ? 'Forecast values will save locally on current simulated stack' : 'Data changes submit instantly into cloud database records.'}
            </p>

            <form onSubmit={handleTxSubmit} className="space-y-4">
              {txError && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 leading-normal">
                  <span className="font-bold">Error:</span> {txError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Transaction Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="tx-input-title"
                  type="text"
                  placeholder="e.g. Candy Fundraiser Sales"
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  maxLength={100}
                  required
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 font-semibold"
                />
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-2 gap-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <select
                    id="tx-select-type"
                    value={txType}
                    onChange={(e: any) => setTxType(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Amount ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="tx-input-amount"
                    type="number"
                    step="0.01"
                    placeholder="125.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    required
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-505 focus:bg-white transition-all text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Category Type
                  </label>
                  <select
                    id="tx-select-category"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Logging Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    id="tx-input-date"
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Memo / Description Notes (Optional)
                </label>
                <textarea
                  id="tx-input-desc"
                  placeholder="Record vendor details, invoice markers, or general officer logs."
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  maxLength={400}
                  rows={2}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 resize-none"
                />
              </div>

              {/* Submissions */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5">
                <button
                  id="btn-cancel-tx"
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-tx"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer uppercase tracking-wider"
                >
                  {currentTx ? 'Save Updates' : 'Add Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODAL: Invite Teammate */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-sm bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden p-6 relative">
            
            <button
              id="btn-close-invite-modal"
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-base text-slate-900 mb-1 flex items-center gap-1.5">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Invite Teammate / Officer
            </h3>
            <p className="text-xs text-slate-450 mb-5 leading-normal">
              Type the team member's email to register them as an active financial officer with shared access to this workspace segment.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              {inviteError && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 leading-normal">
                  <span className="font-bold">Error:</span> {inviteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Officer Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="invite-input-email"
                  type="email"
                  placeholder="officer@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-505 focus:bg-white transition-all text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Assigned Permission Level Role
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    id="btn-role-member"
                    type="button"
                    onClick={() => setInviteRole('member')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${inviteRole === 'member' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    Member
                  </button>
                  <button
                    id="btn-role-admin"
                    type="button"
                    onClick={() => setInviteRole('admin')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${inviteRole === 'admin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    Admin
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  {inviteRole === 'admin' 
                    ? 'Admins can invite/remove users, edit organization configurations, & modify finances.' 
                    : 'Members can view data budgets and append/edit standard transaction logs.'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5">
                <button
                  id="btn-cancel-invite"
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-invite"
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Invite Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODAL: Workspace Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-sm bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden p-6 relative">
            <button
              id="btn-close-settings-modal"
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-base text-slate-900 mb-1 flex items-center gap-1.5">
              <Settings className="w-5 h-5 text-indigo-605" />
              Configure Workspace Segment
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-normal">
              Edit visual designs, segment metadata, and descriptive branding parameters for this isolated ledger.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Workspace Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Workspace Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="settings-input-name"
                  type="text"
                  placeholder="e.g. Student Association Board"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  required
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-505 focus:bg-white transition-all text-slate-900 font-semibold"
                />
              </div>

              {/* Workspace Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Segment Bio Notes (Optional)
                </label>
                <textarea
                  id="settings-input-bio"
                  placeholder="Summarize compliance guidelines, workspace targets, or regulatory scope details."
                  value={settingsDesc}
                  onChange={(e) => setSettingsDesc(e.target.value)}
                  maxLength={250}
                  rows={2}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 resize-none leading-relaxed"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Custom Logo URL (Optional)
                </label>
                <input
                  id="settings-input-logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={settingsLogo}
                  onChange={(e) => setSettingsLogo(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 font-mono"
                />
              </div>

              {/* Brand Theme selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Brand Accent Palette
                </label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {[
                    { key: 'emerald', color: 'bg-emerald-600', ring: 'ring-emerald-300' },
                    { key: 'sky', color: 'bg-sky-500', ring: 'ring-sky-200' },
                    { key: 'violet', color: 'bg-violet-600', ring: 'ring-violet-200' },
                    { key: 'rose', color: 'bg-rose-500', ring: 'ring-rose-200' },
                    { key: 'amber', color: 'bg-amber-500', ring: 'ring-amber-200' },
                    { key: 'indigo', color: 'bg-indigo-600', ring: 'ring-indigo-200' },
                  ].map((preset) => (
                    <button
                      id={`btn-color-preset-${preset.key}`}
                      key={preset.key}
                      type="button"
                      onClick={() => setSettingsTheme(preset.key)}
                      title={`Select theme ${preset.key}`}
                      className={`h-7 w-7 rounded-lg ${preset.color} relative border border-white focus:outline-none transition-all cursor-pointer ${
                        settingsTheme === preset.key 
                          ? 'ring-4 outline-none ' + preset.ring 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {settingsTheme === preset.key && (
                        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2.5">
                <button
                  id="btn-cancel-settings"
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-settings"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
