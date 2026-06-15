import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { updateUserProfile } from '../dbService';
import { ArrowLeft, User, Sparkles, Wand2 } from 'lucide-react';

interface ProfileSettingsPageProps {
  onNavigate: (view: string) => void;
}

export default function ProfileSettingsPage({ onNavigate }: ProfileSettingsPageProps) {
  const { user, userProfile, refreshProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [theme, setTheme] = useState(userProfile?.theme || 'emerald');
  const [bannerColor, setBannerColor] = useState(userProfile?.bannerColor || '#10b981');

  React.useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setAvatarUrl(userProfile.avatarUrl || '');
      setBio(userProfile.bio || '');
      setTheme(userProfile.theme || 'emerald');
      setBannerColor(userProfile.bannerColor || '#10b981');
    }
  }, [userProfile]);

  const [txLoading, setTxLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxLoading(true);
    setErrorCode(null);
    setSuccess(false);

    if (!displayName.trim()) {
      setErrorCode('Display name is mandatory.');
      setTxLoading(false);
      return;
    }

    if (!user) {
      setErrorCode('Authentication expired.');
      setTxLoading(false);
      return;
    }

    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim(),
        bio: bio.trim(),
        theme,
        bannerColor
      });
      await refreshProfile();
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorCode(err.message || 'Update failed.');
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            id="btn-back-to-dashboard"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Profile Preferences
          </span>
        </div>
      </header>

      <main className="flex-grow max-w-2xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
          
          {/* Decorative Header Banner */}
          <div 
            className="h-32 w-full transition-all duration-300 relative" 
            style={{ backgroundColor: bannerColor }}
          >
            <div className="absolute -bottom-10 left-8">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="avatar" 
                  className="w-20 h-20 rounded-2xl border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-white bg-slate-250 text-slate-705 flex items-center justify-center font-bold text-2xl shadow-md">
                  {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'O'}
                </div>
              )}
            </div>
          </div>

          <div className="p-8 pt-14">
            
            {/* Header Title */}
            <div className="mb-6">
              <h1 className="font-display font-bold text-xl tracking-tight text-slate-900">
                Locker Setup & Personalization
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Update details representing yourself as a certified budget officer database operator.
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              
              {errorCode && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 leading-normal">
                  <span className="font-bold">Execution Blocked:</span> {errorCode}
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-850 font-bold leading-normal">
                  Preferences updated and synced correctly to secure cloud channels.
                </div>
              )}

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Officer Professional Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="profile-input-name"
                  type="text"
                  placeholder="Officer Alice"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  required
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900"
                />
              </div>

              {/* Email (Read Only representation) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Linked Corporate Email Address (Immutable)
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="block w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-505 cursor-not-allowed font-mono"
                />
              </div>

              {/* Avatar Image URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Custom Avatar Image URL
                </label>
                <input
                  id="profile-input-avatar"
                  type="url"
                  placeholder="e.g., https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-505 focus:bg-white transition-all text-slate-900"
                />
              </div>

              {/* Visual Banner Accent Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Locker Banner Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="profile-input-banner"
                      type="color"
                      value={bannerColor}
                      onChange={(e) => setBannerColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-slate-50 border border-slate-200"
                    />
                    <span className="text-xs font-mono font-semibold text-slate-600">
                      {bannerColor.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Personal Theme
                  </label>
                  <select
                    id="profile-select-theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="block w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 font-semibold"
                  >
                    <option value="indigo">Indigo (Recommended)</option>
                    <option value="emerald">Emerald</option>
                    <option value="sky">Sky</option>
                    <option value="violet">Violet</option>
                    <option value="amber">Amber</option>
                  </select>
                </div>
              </div>

              {/* Biography Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Personal Bio / Officer Note
                </label>
                <textarea
                  id="profile-input-bio"
                  placeholder="e.g. Treasurer officer looking after the multi-organization fundraisers accounts details."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={400}
                  rows={2}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 resize-none animate-none"
                />
              </div>

              {/* Submissions */}
              <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3.5">
                <button
                  id="btn-cancel-profile"
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-profile"
                  type="submit"
                  disabled={txLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  {txLoading ? 'Saving...' : 'Commit Preferences'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
