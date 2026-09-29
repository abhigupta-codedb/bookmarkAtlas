import React, { useState } from 'react';
import { 
  Sparkles, 
  Compass, 
  Search, 
  Layers, 
  Lock, 
  ArrowRight, 
  Zap, 
  Share2, 
  ShieldCheck, 
  FolderTree, 
  AlertCircle 
} from 'lucide-react';

interface LandingPageProps {
  onSignInWithGoogle: () => Promise<void>;
  onStartDemo: () => void;
  authError?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignInWithGoogle,
  onStartDemo,
  authError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(authError || null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await onSignInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Bar */}
      <header className="px-6 py-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Starlight Bookmarks</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Visual MVP
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onStartDemo}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-900 transition-colors"
          >
            Explore Sandbox Tour
          </button>
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Never lose a saved link inside nested browser folders again</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mb-6">
          Your private web bookmarks, mapped as an{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">
            interactive visual universe.
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed mb-8">
          Traditional browser bookmarks get hidden in forgotten folders. Starlight organizes your research, tools, and inspirations into a calm constellation graph with progressive disclosure and instant search.
        </p>

        {/* Auth Error Banner if present */}
        {error && (
          <div className="mb-6 p-4 max-w-md rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-14">
          {/* Continue with Google */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-xl shadow-white/10 hover:shadow-white/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {/* Google Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </button>

          {/* Sandbox Tour */}
          <button
            onClick={onStartDemo}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm transition-all"
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Launch Live Sandbox</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl text-left">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <FolderTree className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Visual Constellation Graph</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore your bookmarks organically with progressive disclosure. Collections expand into subcollections and bookmarks with smooth physics and zero clutter.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Instant Cmd+K Search</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lightning fast search highlights matching nodes instantly, fading out unrelated links and centering your mind on exactly what you need.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Private & Firebase Protected</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your bookmarks are strictly isolated to your Google account with Firestore security rules. Export to standard JSON or Netscape HTML at any time.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>Starlight Bookmarks — Private Knowledge Visualizer</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>End-to-End Firebase Security</span>
          </span>
          <span>•</span>
          <span>Google Sign-In Protected</span>
        </div>
      </footer>
    </div>
  );
};
