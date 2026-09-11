import { useState } from 'react';
import { Lock, Mountain, Eye, EyeOff, User, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AdminLogin() {
  const [username, setUsername] = useState('jorell');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSelectUser = (u) => {
    setUsername(u);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Por favor ingrese su contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await login(username, password);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Credenciales inválidas.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-7 sm:p-9 w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mx-auto mb-4 drop-shadow-md">
            <img src="/logo.png" alt="TuriArica" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">TuriArica Admin</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Panel de Control y Gestión Turística
          </p>
        </div>

        {/* Quick User Selector Pills */}
        <div className="mb-6 bg-slate-100 p-1.5 rounded-2xl flex gap-1">
          <button
            type="button"
            onClick={() => handleSelectUser('jorell')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              username === 'jorell'
                ? 'bg-white text-slate-900 shadow-xs scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Jorell</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectUser('nicolas')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              username === 'nicolas'
                ? 'bg-white text-slate-900 shadow-xs scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>Nicolás</span>
          </button>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-600 text-xs font-bold"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Usuario de Administrador
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white outline-none transition-all text-sm font-semibold"
                placeholder="jorell o nicolas"
                required
              />
              <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                {t('admin.password')}
              </label>
              <span className="text-[11px] text-slate-400">turiarica2026</span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white outline-none transition-all text-sm font-semibold"
                placeholder="••••••••"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition-all shadow-lg shadow-slate-950/20 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Entrar como {username === 'nicolas' ? 'Nicolás' : 'Jorell'}</span>
            )}
          </button>
        </form>

        {/* Security badges footer */}
        <div className="mt-7 pt-5 border-t border-slate-100 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Cifrado bcrypt + Token JWT seguro</span>
          </div>

          <a
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
          >
            ← {t('admin.backToSite')}
          </a>
        </div>
      </motion.div>
    </div>
  );
}
