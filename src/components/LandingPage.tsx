import { motion } from 'motion/react';
import { 
  PiggyBank, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Coins, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { user, enterGuestSession } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-100">
      {/* Global Navigation Bar */}
      <nav id="landing-navbar" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shadow-sm">
              <PiggyBank className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
              BudgetAlly<span className="text-indigo-600">.</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            <span className="text-indigo-600 border-b-2 border-indigo-600 h-16 flex items-center px-1 cursor-pointer">Workspace</span>
            <span className="hover:text-slate-900 h-16 flex items-center px-1 cursor-pointer transition-colors" onClick={() => onNavigate('login')}>Features</span>
            <span className="hover:text-slate-900 h-16 flex items-center px-1 cursor-pointer transition-colors" onClick={() => onNavigate('login')}>Compliance</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-slate-500 hidden sm:inline-block font-mono">
                Logged in as <span className="font-bold font-sans text-indigo-600">{user.email?.split('@')[0]}</span>
              </span>
              <button 
                id="btn-goto-dashboard-nav"
                onClick={() => onNavigate('dashboard')}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md shadow-indigo-150 transition-all hover:scale-102 cursor-pointer"
              >
                Enter Dashboard
              </button>
            </>
          ) : (
            <>
              <button 
                id="btn-login-nav"
                onClick={() => onNavigate('login')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button 
                id="btn-register-nav"
                onClick={() => onNavigate('login')}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md shadow-indigo-100 transition-all hover:scale-102 cursor-pointer"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          {/* Tagline */}
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 border border-indigo-100 px-3 py-1 rounded-full text-xs font-semibold mb-6 shadow-sm">
            <Coins className="w-3.5 h-3.5 text-indigo-600 bg-transparent" />
            Zero-overlap multi-tenant budgeting for student clubs, non-profits, & teams
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.15] mb-6">
            Keep your organization's financials <span className="text-indigo-600 italic">crystal clear</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-sans">
            Collaborative, secure budget tracking with completely isolated workspaces. Personalize layouts, invite officers, simulate spending forecasts, and stop worrying about messy spreadsheets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <button
                id="btn-hero-dashboard"
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-lg shadow-lg shadow-indigo-150 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                Go to Your Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  id="btn-hero-start"
                  onClick={() => onNavigate('login')}
                  className="w-full sm:w-auto text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-lg shadow-lg shadow-indigo-150 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Start Budgeting Now <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  id="btn-hero-learn"
                  onClick={async () => {
                    await enterGuestSession();
                    onNavigate('dashboard');
                  }}
                  className="w-full sm:w-auto text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-3.5 rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Enter Sandbox Mode
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Features Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">Isolated Workspaces</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No overlapping budgets. Organization A and Organization B each run in completely isolated sandboxes. Transactions in one never access or affect the other.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">Dynamic Collaboration</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Assign roles cleanly. Admins can update styling, invite contributors, and execute changes. Members enter transaction logs, making tracking collaborative.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">Interactive Forecasting</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Simulate budgets in real-time. Instantly edit pending transaction variables to visualize cash balance, remaining savings, and upcoming expenses.
            </p>
          </motion.div>
        </div>
      </main>

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
