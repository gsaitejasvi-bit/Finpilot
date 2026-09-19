import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthScreen() {
  const { login, signup, authError, authLoading, setAuthError } = useAuth();

  const [mode,     setMode]     = useState('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  function switchMode(next) {
    setMode(next);
    setAuthError('');
    setName(''); setEmail(''); setPassword(''); setConfirm('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setAuthError('');
    if (mode === 'signup') {
      if (!name.trim())           { setAuthError('Please enter your full name.');             return; }
      if (password.length < 6)    { setAuthError('Password must be at least 6 characters.'); return; }
      if (password !== confirm)   { setAuthError('Passwords do not match.');                 return; }
      await signup({ name, email, password });
    } else {
      await login({ email, password });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#fdf8f2 0%,#f0e8dc 50%,#e4d5c0 100%)' }}>

      {/* Floating decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle,#f3dcc0,transparent)' }} />
        <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#e8c99a,transparent)' }} />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#deedc8,transparent)' }} />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm animate-float-up"
        style={{
          background: '#fffdf9',
          border: '1px solid #d9c9b0',
          borderRadius: '1.5rem',
          boxShadow: '0 12px 48px rgba(80,40,10,0.14), 0 3px 10px rgba(80,40,10,0.08)',
          overflow: 'hidden',
        }}>

        {/* Brand header */}
        <div className="px-8 pt-8 pb-6 flex flex-col items-center gap-2"
          style={{ background: 'linear-gradient(160deg,#2c1f0e 0%,#4a3318 100%)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(243,220,192,0.15)', border: '1px solid rgba(243,220,192,0.25)' }}>
            <span className="material-symbols-outlined text-[30px]" style={{ color: '#f3dcc0' }}>finance_mode</span>
          </div>
          <h1 className="font-bold tracking-tight mt-1"
            style={{ color: '#f3dcc0', fontFamily: "'Playfair Display',serif", fontSize: '1.5rem' }}>
            FinPilot
          </h1>
          <p className="font-body-sm" style={{ color: 'rgba(243,220,192,0.6)', fontSize: '0.75rem' }}>
            {mode === 'login' ? 'Welcome back — sign in to continue' : 'Create your free workspace'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex" style={{ borderBottom: '1px solid #d9c9b0' }}>
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="flex-1 py-3 font-label-md font-semibold transition-colors"
              style={{
                color:           mode === m ? '#7c4a1e' : '#a0846a',
                borderBottom:    mode === m ? '2px solid #7c4a1e' : '2px solid transparent',
                background:      mode === m ? '#fffdf9' : '#f7f0e6',
                marginBottom:    '-1px',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4">

          {/* Name — signup only */}
          {mode === 'signup' && (
            <Field label="Full Name">
              <InputRow icon="person" placeholder="e.g. Greeshma Sharma"
                type="text" value={name} onChange={e => setName(e.target.value)} required />
            </Field>
          )}

          <Field label="Email Address">
            <InputRow icon="mail" placeholder="you@example.com"
              type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </Field>

          <Field label="Password">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all"
              style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
              <span className="material-symbols-outlined text-[17px] shrink-0" style={{ color: '#a0846a' }}>lock</span>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="flex-1 bg-transparent font-body-md outline-none placeholder:opacity-40"
                style={{ color: '#2c1f0e' }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ color: '#a0846a' }}>
                <span className="material-symbols-outlined text-[17px]">
                  {showPwd ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </Field>

          {/* Confirm — signup only */}
          {mode === 'signup' && (
            <Field label="Confirm Password">
              <InputRow icon="lock_reset"
                placeholder="Re-enter password"
                type={showPwd ? 'text' : 'password'}
                value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </Field>
          )}

          {/* Error */}
          {authError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: '#f5d5d5', border: '1px solid #f0b8b8' }}>
              <span className="material-symbols-outlined text-[15px] shrink-0" style={{ color: '#9b2c2c' }}>error</span>
              <span className="font-body-sm" style={{ color: '#5c0e0e', fontSize: '0.75rem' }}>{authError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={authLoading}
            className="mt-1 w-full py-3 rounded-xl font-label-md font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: '#7c4a1e', color: '#f3dcc0', boxShadow: '0 4px 16px rgba(124,74,30,0.3)' }}
            onMouseEnter={e => { if (!authLoading) e.currentTarget.style.background = '#a0632e'; }}
            onMouseLeave={e => e.currentTarget.style.background = '#7c4a1e'}
          >
            {authLoading
              ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-[18px]">{mode === 'login' ? 'login' : 'person_add'}</span>
            }
            {authLoading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Switch hint */}
          <p className="text-center font-body-sm" style={{ color: '#a0846a', fontSize: '0.75rem' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="font-semibold hover:underline" style={{ color: '#7c4a1e' }}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-label-sm font-semibold" style={{ color: '#6b4f35', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function InputRow({ icon, ...props }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all"
      style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
      <span className="material-symbols-outlined text-[17px] shrink-0" style={{ color: '#a0846a' }}>{icon}</span>
      <input
        {...props}
        className="flex-1 bg-transparent font-body-md outline-none placeholder:opacity-40"
        style={{ color: '#2c1f0e' }}
      />
    </div>
  );
}
