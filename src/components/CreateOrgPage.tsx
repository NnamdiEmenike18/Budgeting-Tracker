import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { createOrganization } from '../dbService';
import { ArrowLeft, Sparkles, Wand2, Check } from 'lucide-react';

interface CreateOrgPageProps {
  onNavigate: (view: string) => void;
  onSelectOrg: (orgId: string) => void;
}

export default function CreateOrgPage({ onNavigate, onSelectOrg }: CreateOrgPageProps) {
  const { user, userProfile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colorTheme, setColorTheme] = useState('emerald');
  const [logoUrl, setLogoUrl] = useState('');
  const [type, setType] = useState<'personal' | 'team'>('team');
  const [error, setError] = useState<string | null>(null);
  const [txLoading, setTxLoading] = useState(false);

  // Suggested preset color themes
  const colorThemes = [
    { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
    { id: 'sky', label: 'Sky Blue', bg: 'bg-sky-500', hover: 'hover:bg-sky-600' },
    { id: 'violet', label: 'Royal Violet', bg: 'bg-violet-600', hover: 'hover:bg-violet-700' },
    { id: 'rose', label: 'Rose Gold', bg: 'bg-rose-500', hover: 'hover:bg-rose-600' },
    { id: 'amber', label: 'Amber Orange', bg: 'bg-amber-500', hover: 'hover:bg-amber-600' },
    { id: 'indigo', label: 'Deep Indigo', bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700' },
  ];

  // Preset illustrations for logo selection
  const logoPresets = [
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=120', // Dollar stack
    'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=120', // Financial graphics
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=120', // Workspace
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=120', // Calculators
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxLoading(true);

    if (!name.trim()) {
      setError(`Please provide a descriptive ${type === 'personal' ? 'budget' : 'organization'} name.`);
      setTxLoading(false);
      return;
    }

    if (!user || !userProfile) {
      setError('User profile is not synchronized. Please log in again.');
      setTxLoading(false);
      return;
    }

    try {
      // Create organization via DB service + atomic batching
      const orgId = await createOrganization(
        name,
        description,
        colorTheme,
        logoUrl || '',
        user.uid,
        user.email || '',
        userProfile.displayName || user.email?.split('@')[0] || 'Officer',
        type
      );

      // Select newly created org and navigate
      onSelectOrg(orgId);
      onNavigate('budget-dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Database transaction failed. Verify permissions or syntax rule constraints.');
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            id="btn-back-to-list"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workspace
          </button>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Identity & Organization
          </span>
        </div>
      </header>

      <main className="flex-grow max-w-2xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8">
          
          {/* Header Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-slate-900">
                Setup New Workspace
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Establish an isolated financial sandbox workspace instantly.
              </p>
            </div>
          </div>

          {/* Form Panel */}
          <form onSubmit={handleCreate} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 leading-normal">
                <span className="font-bold">Execution Blocked:</span> {error}
              </div>
            )}

            {/* Workspace Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5">
                Workspace Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  id="btn-workspace-type-team"
                  onClick={() => {
                    setType('team');
                    if (name === 'My Personal Budget') setName('');
                  }}
                  className={`p-4 rounded-xl border flex flex-col gap-1.5 transition-all text-left cursor-pointer ${type === 'team' ? 'border-indigo-600 bg-indigo-50/45 shadow-xs' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    👥 Team Organization
                  </span>
                  <span className="text-[11px] text-slate-500 leading-normal">
                    Collaborative workspace for organizations (like clubs, student boards, or projects). Share finances and invite teammates.
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-workspace-type-personal"
                  onClick={() => {
                    setType('personal');
                    if (!name.trim()) setName('My Personal Budget');
                  }}
                  className={`p-4 rounded-xl border flex flex-col gap-1.5 transition-all text-left cursor-pointer ${type === 'personal' ? 'border-indigo-600 bg-indigo-50/45 shadow-xs' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    👤 Personal Budget
                  </span>
                  <span className="text-[11px] text-slate-500 leading-normal">
                    Private workspace designed for your solo budget tracking. Keeps your financial ledger private & disables collaborator roles.
                  </span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                {type === 'personal' ? 'Workspace Name' : 'Organization Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                id="org-input-name"
                type="text"
                placeholder={type === 'personal' ? 'e.g., My Personal Budget, Home Finances' : 'National Honor Society (NHS) or Student Council'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Description / Purpose (Optional)
              </label>
              <textarea
                id="org-input-desc"
                placeholder="Provide a short synopsis about what this organization achieves or who commands the budgets."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 resize-none"
              />
            </div>

            {/* Branding Palette */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5">
                Custom Branding Palette (To Prevent Accidental Edits)
              </label>
              <p className="text-[11px] text-slate-400 mb-3 leading-normal">
                Select a visually distinct theme to separate dashboards from one another and clearly coordinate operations.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {colorThemes.map((theme) => (
                  <button
                    id={`btn-color-theme-${theme.id}`}
                    key={theme.id}
                    type="button"
                    onClick={() => setColorTheme(theme.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${colorTheme === theme.id ? 'border-slate-950 bg-slate-50 font-semibold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className={`w-6 h-6 rounded-full ${theme.bg} flex items-center justify-center text-white shadow-sm`}>
                      {colorTheme === theme.id && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium truncate max-w-full italic">
                      {theme.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Logos */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5">
                Workspace Thumbnail Image
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex gap-2">
                  {logoPresets.map((preset, idx) => (
                    <button
                      id={`btn-logo-preset-${idx}`}
                      key={idx}
                      type="button"
                      onClick={() => setLogoUrl(preset)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border transition-all cursor-pointer ${logoUrl === preset ? 'border-slate-950 scale-105 shadow-md' : 'border-slate-200 hover:opacity-80'}`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      {logoUrl === preset && (
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ))}
                  <button
                    id="btn-logo-custom"
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${!logoUrl ? 'border-slate-950 bg-slate-50 font-semibold text-xs text-indigo-650' : 'border-slate-200 hover:bg-slate-50 text-[10px]'}`}
                  >
                    Initials
                  </button>
                </div>

                <div className="flex-grow w-full">
                  <input
                    id="org-input-logo"
                    type="url"
                    placeholder="Or paste external custom logo URL"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-505 focus:bg-white transition-all text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Submission triggers */}
            <div className="border-t border-slate-100 pt-6 flex items-center justify-end gap-3">
              <button
                id="btn-cancel-create"
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-submit-org"
                type="submit"
                disabled={txLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4" />
                {txLoading ? 'Spinning Sandbox...' : 'Create Workspace'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
