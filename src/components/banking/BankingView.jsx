import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import {
  SETU_CONFIGURED,
  initiateSetuConsent,
  getSetuConsentStatus,
  getSetuStatus,
} from '../../services/apiService';

// ─── Connection status badge ──────────────────────────────────────────────────
function StatusBadge({ source }) {
  const map = {
    setu_live:        { label: '● Live · Setu AA',      bg: '#deedc8', color: '#3d5420' },
    setu_sandbox:     { label: '● Sandbox · Setu AA',   bg: '#deedc8', color: '#3d5420' },
    setu_no_consent:  { label: '⚠ Awaiting Consent',    bg: '#faecd3', color: '#7c4a1e' },
    setu_consent_active: { label: '● Active Consent',   bg: '#deedc8', color: '#3d5420' },
    setu_consent_pending:{ label: '⏳ Consent Pending', bg: '#faecd3', color: '#7c4a1e' },
    setu_consent_rejected:{ label: '✕ Consent Rejected',bg: '#f5d5d5', color: '#9b2c2c'},
    mock_fallback:    { label: '⚠ API Error · Mock',    bg: '#f5d5d5', color: '#9b2c2c' },
    mock:             { label: '◎ Demo Data',            bg: '#f7f0e6', color: '#6b4f35' },
  };
  const s = map[source] || map.mock;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─── Step-by-step flow indicator ─────────────────────────────────────────────
function ConsentFlowSteps({ step }) {
  const steps = [
    { n: 1, label: 'Enter mobile number',  desc: 'Your AA-registered mobile' },
    { n: 2, label: 'Approve on Setu',      desc: 'Opens in new tab for bank OTP' },
    { n: 3, label: 'Auto-sync accounts',   desc: 'Balances pulled into FinPilot' },
  ];
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {steps.map((s, i) => {
        const done    = step > s.n;
        const active  = step === s.n;
        return (
          <div key={s.n} className="flex items-center gap-3 flex-1">
            {i > 0 && <div className="hidden sm:block h-px flex-1" style={{ background: '#d9c9b0', minWidth: 12 }} />}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  background: done ? '#5a6e3a' : active ? '#7c4a1e' : '#ede0d0',
                  color:      done || active ? '#fff' : '#a0846a',
                }}>
                {done ? '✓' : s.n}
              </div>
              <div>
                <span className="text-xs font-semibold block" style={{ color: active ? '#2c1f0e' : done ? '#5a6e3a' : '#a0846a' }}>{s.label}</span>
                <span className="text-xs" style={{ color: '#a0846a' }}>{s.desc}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BankingView() {
  const { bankAccounts, bankLoading, bankSyncing, syncBankAccounts, showToast } = useFinancial();

  // Consent flow state
  const [mobile,          setMobile]        = useState('');
  const [consentStep,     setConsentStep]   = useState(1);
  const [consentId,       setConsentId]     = useState(sessionStorage.getItem('setu_consent_id') || '');
  const [consentStatus,   setConsentStatus] = useState('');
  const [consentLoading,  setConsentLoading]= useState(false);
  const [consentError,    setConsentError]  = useState('');
  const [expandedId,      setExpandedId]    = useState(null);
  const [dataSource,      setDataSource]    = useState('mock');

  const setuStatus = getSetuStatus();

  // If consent already exists, jump to step 3
  useEffect(() => {
    if (setuStatus.hasConsent) setConsentStep(3);
  }, []);

  // Determine data source label from loaded accounts
  useEffect(() => {
    if (bankAccounts.length > 0) {
      setDataSource(bankAccounts[0].source || 'mock');
    }
  }, [bankAccounts]);

  // ── Step 1→2: Start consent flow ──────────────────────────────────────────
  async function handleConnect() {
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      showToast('Enter a valid 10-digit mobile number', 'error');
      return;
    }
    setConsentLoading(true);
    setConsentError('');
    try {
      const { consentId: cid, redirectUrl } = await initiateSetuConsent(mobile);
      setConsentId(cid);
      setConsentStep(2);
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      showToast('Setu consent page opened — approve in the new tab', 'info');
      pollConsentStatus(cid);
    } catch (err) {
      // Produce a human-readable diagnosis instead of a raw error string
      let reason = err.message || 'Unknown error';
      let advice = '';
      if (reason.includes('401') || reason.includes('403')) {
        advice = 'Your Client ID or Secret is wrong. Double-check the values in your .env file.';
      } else if (reason.includes('Failed to fetch') || reason.includes('NetworkError') || reason.includes('CORS')) {
        advice = 'Network error. Make sure the Vite dev server is running (npm run dev) — not a static build.';
      } else if (reason.includes('404')) {
        advice = 'API endpoint not found. Check that VITE_SETU_BASE_URL is set to https://fiu-sandbox.setu.co';
      } else if (reason.includes('not configured')) {
        advice = 'Add your real Setu credentials to the .env file (replace the placeholder values).';
      }
      setConsentError(`${reason}${advice ? ' — ' + advice : ''}`);
      showToast('Connection failed — see details below', 'error');
    } finally {
      setConsentLoading(false);
    }
  }

  // ── Poll consent status every 3s until ACTIVE or terminal state ────────────
  async function pollConsentStatus(cid) {
    const token = sessionStorage.getItem('setu_token') || '';
    const poll = async (attempts = 0) => {
      if (attempts > 20) { // 60s max
        setConsentStatus('TIMEOUT');
        showToast('Consent approval timed out — please try again', 'warning');
        return;
      }
      try {
        const status = await getSetuConsentStatus(token, cid);
        setConsentStatus(status);
        if (status === 'ACTIVE') {
          setConsentStep(3);
          showToast('Bank accounts connected! Syncing now…', 'success');
          syncBankAccounts();
        } else if (status === 'REJECTED' || status === 'EXPIRED') {
          showToast(`Consent ${status.toLowerCase()} — please reconnect`, 'error');
        } else {
          setTimeout(() => poll(attempts + 1), 3000);
        }
      } catch {
        setTimeout(() => poll(attempts + 1), 4000);
      }
    };
    setTimeout(() => poll(), 3000);
  }

  // ── Disconnect / reset consent ─────────────────────────────────────────────
  function handleDisconnect() {
    sessionStorage.removeItem('setu_consent_id');
    sessionStorage.removeItem('setu_token');
    setConsentId('');
    setConsentStep(1);
    setConsentStatus('');
    showToast('Bank connection removed', 'info');
  }

  const totalPositive = bankAccounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalCredit   = bankAccounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0);

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 gap-6 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: '#d9c9b0' }}>
        <div>
          <span className="uppercase tracking-widest font-semibold block" style={{ color: '#a0846a', fontSize: '0.62rem' }}>
            Open Banking · RBI Account Aggregator
          </span>
          <h1 className="font-bold" style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#2c1f0e' }}>
            Banking & Accounts
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge source={dataSource} />
          <button onClick={syncBankAccounts} disabled={bankSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
            style={{ background: bankSyncing ? '#d9c9b0' : '#5a6e3a', color: '#fff', opacity: bankSyncing ? 0.7 : 1 }}>
            <span className="material-symbols-outlined text-[16px]"
              style={bankSyncing ? { animation: 'spin 1s linear infinite' } : {}}>sync</span>
            {bankSyncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* ── Setu Connection Card ─────────────────────────────────────────── */}
      <div className="widget p-6 flex flex-col gap-5">
        {/* Card header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#f3dcc0,#e8c99a)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#7c4a1e' }}>hub</span>
            </div>
            <div>
              <span className="font-semibold block text-sm" style={{ color: '#2c1f0e' }}>
                Setu Account Aggregator (AA)
              </span>
              <span className="text-xs" style={{ color: '#a0846a' }}>
                RBI-licensed · Zero credential sharing · Consent-based access
              </span>
            </div>
          </div>
          {/* Config status pill */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={SETU_CONFIGURED
              ? { background: '#deedc8', color: '#3d5420' }
              : { background: '#f5d5d5', color: '#9b2c2c' }}>
            {SETU_CONFIGURED ? '● Credentials configured' : '✕ Not configured'}
          </span>
        </div>

        {/* Flow steps */}
        <ConsentFlowSteps step={consentStep} />

        {/* ── State: Not configured ──────────────────────────────────────── */}
        {!SETU_CONFIGURED && (
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: '#f3dcc0', border: '1px solid #e8c99a' }}>
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: 18, color: '#7c4a1e' }}>info</span>
              <div>
                <span className="font-semibold text-sm block" style={{ color: '#7c4a1e' }}>
                  Add your Setu credentials to connect real bank accounts
                </span>
                <span className="text-xs mt-1 block" style={{ color: '#9e6c2a' }}>
                  The app is currently running on mock data. Follow the steps below to activate real Open Banking.
                </span>
              </div>
            </div>
            {/* Step-by-step setup guide */}
            <div className="flex flex-col gap-2 mt-1">
              {[
                { n: 1, text: 'Sign up free at', link: 'https://bridge.setu.co/signup', linkText: 'bridge.setu.co/signup' },
                { n: 2, text: 'Go to Products → AA → Create FIU app → copy Client ID & Secret' },
                { n: 3, text: 'Open the .env file in your project root (already created for you)' },
                { n: 4, text: 'Replace the placeholder values:', code: 'VITE_SETU_CLIENT_ID=your_actual_id\nVITE_SETU_CLIENT_SECRET=your_actual_secret' },
                { n: 5, text: 'Restart the dev server: npm run dev' },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs"
                    style={{ background: '#7c4a1e', color: '#f3dcc0' }}>{s.n}</div>
                  <div className="text-xs" style={{ color: '#2c1f0e' }}>
                    {s.text}{' '}
                    {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="underline font-semibold">{s.linkText}</a>}
                    {s.code && (
                      <pre className="mt-1 p-2 rounded-lg text-xs font-mono overflow-x-auto"
                        style={{ background: 'rgba(44,31,14,0.1)', color: '#2c1f0e' }}>
                        {s.code}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── State: Configured + Step 1 — enter mobile ─────────────────── */}
        {SETU_CONFIGURED && consentStep === 1 && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl p-3" style={{ background: '#deedc8', border: '1px solid #c4db9e' }}>
              <span className="text-xs font-semibold" style={{ color: '#3d5420' }}>
                ✓ Setu credentials found. Enter your AA-registered mobile to start the consent flow.
              </span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border"
                style={{ background: '#f7f0e6', borderColor: '#d9c9b0', minWidth: 200 }}>
                <span className="text-sm font-semibold" style={{ color: '#a0846a' }}>+91</span>
                <input
                  type="tel" maxLength={10} placeholder="9876543210"
                  value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
                  className="flex-1 bg-transparent outline-none text-sm font-mono"
                  style={{ color: '#2c1f0e' }}
                />
              </div>
              <button onClick={handleConnect} disabled={consentLoading || mobile.length !== 10}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: consentLoading || mobile.length !== 10 ? '#d9c9b0' : '#7c4a1e',
                  color: '#f3dcc0',
                  opacity: mobile.length !== 10 ? 0.6 : 1,
                }}>
                {consentLoading
                  ? <><span className="material-symbols-outlined text-[16px]" style={{ animation: 'spin 1s linear infinite' }}>sync</span> Connecting…</>
                  : <><span className="material-symbols-outlined text-[16px]">link</span> Connect Banks</>}
              </button>
            </div>
            <p className="text-xs" style={{ color: '#a0846a' }}>
              Your bank credentials are never shared with FinPilot. Setu AA uses RBI-mandated consent tokens only.
            </p>

            {/* Error diagnostic box */}
            {consentError && (
              <div className="rounded-xl p-4 flex flex-col gap-2 animate-float-up"
                style={{ background: '#f5d5d5', border: '1px solid #f0b8b8' }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18, color: '#9b2c2c' }}>error</span>
                  <span className="font-semibold text-sm" style={{ color: '#9b2c2c' }}>Connection failed — diagnosis</span>
                </div>
                <p className="text-xs" style={{ color: '#7c2c2c', lineHeight: 1.6 }}>{consentError}</p>
                <div className="rounded-lg p-3 mt-1" style={{ background: 'rgba(155,44,44,0.06)', border: '1px solid #f0b8b8' }}>
                  <span className="text-xs font-semibold block mb-1.5" style={{ color: '#9b2c2c' }}>Checklist:</span>
                  <ul className="text-xs space-y-1" style={{ color: '#7c2c2c' }}>
                    <li>☐ Opened <strong>.env</strong> in the project root and replaced the placeholder values</li>
                    <li>☐ Restarted the dev server after editing .env (<code className="px-1 rounded" style={{ background: 'rgba(155,44,44,0.1)' }}>npm run dev</code>)</li>
                    <li>☐ Using <strong>npm run dev</strong> (not a static build) — the proxy only works in dev mode</li>
                    <li>☐ Credentials copied from <a href="https://bridge.setu.co" target="_blank" rel="noreferrer" className="underline font-semibold">bridge.setu.co</a> → Products → AA → your FIU app</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── State: Step 2 — waiting for user to approve in Setu ─────────── */}
        {SETU_CONFIGURED && consentStep === 2 && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#faecd3', border: '1px solid #e8c99a' }}>
              <span className="material-symbols-outlined animate-pulse" style={{ fontSize: 24, color: '#9e6c2a' }}>pending</span>
              <div>
                <span className="font-semibold text-sm block" style={{ color: '#7c4a1e' }}>
                  Waiting for your approval in Setu
                </span>
                <span className="text-xs" style={{ color: '#9e6c2a' }}>
                  Complete the consent on the Setu page that just opened. This page will update automatically.
                  {consentStatus && ` Status: ${consentStatus}`}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { if (consentId) pollConsentStatus(consentId); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border"
                style={{ background: '#f7f0e6', color: '#6b4f35', borderColor: '#d9c9b0' }}>
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                Check Status
              </button>
              <button onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ color: '#9b2c2c', background: '#f5d5d5' }}>
                Cancel
              </button>
            </div>
            {consentId && (
              <p className="text-xs font-mono" style={{ color: '#a0846a' }}>
                Consent ID: {consentId}
              </p>
            )}
          </div>
        )}

        {/* ── State: Step 3 — connected ─────────────────────────────────── */}
        {consentStep === 3 && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl p-3 flex-1"
              style={{ background: '#deedc8', border: '1px solid #c4db9e' }}>
              <span className="material-symbols-outlined" style={{ color: '#3d5420', fontSize: 20 }}>check_circle</span>
              <div>
                <span className="font-semibold text-sm block" style={{ color: '#3d5420' }}>
                  {SETU_CONFIGURED ? 'Bank accounts connected via Setu AA' : 'Connected (demo mode)'}
                </span>
                <span className="text-xs" style={{ color: '#5a6e3a' }}>
                  {consentId ? `Consent ID: ${consentId}` : 'Running on mock data — configure .env to use real accounts'}
                </span>
              </div>
            </div>
            {consentId && (
              <button onClick={handleDisconnect}
                className="px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
                style={{ color: '#9b2c2c', background: '#f5d5d5', border: '1px solid #f0b8b8' }}>
                Disconnect
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Connected Accounts',    value: bankAccounts.length,                                         icon: 'account_balance', color: '#7c4a1e', bg: '#f3dcc0' },
          { label: 'Total Positive Balance', value: `₹${totalPositive.toLocaleString('en-IN')}`,               icon: 'account_balance_wallet', color: '#3d5420', bg: '#deedc8' },
          { label: 'Credit Utilised',        value: `₹${Math.abs(totalCredit).toLocaleString('en-IN')}`,       icon: 'credit_card',     color: '#9b2c2c', bg: '#f5d5d5' },
        ].map(s => (
          <div key={s.label} className="widget p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: s.bg }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <span className="font-bold text-lg font-mono block" style={{ color: s.color }}>{s.value}</span>
              <span className="text-xs" style={{ color: '#a0846a' }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Account cards */}
      {bankLoading ? (
        <div className="widget p-12 text-center" style={{ color: '#a0846a' }}>
          <span className="material-symbols-outlined text-[40px] block mb-3" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
          <span className="text-sm">Loading accounts…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bankAccounts.map(acc => {
            const isExpanded = expandedId === acc.id;
            const isCredit   = acc.balance < 0;
            return (
              <div key={acc.id} className="widget p-5 cursor-pointer transition-all"
                onClick={() => setExpandedId(p => p === acc.id ? null : acc.id)}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg,#f3dcc0,#e8c99a)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#7c4a1e' }}>account_balance</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold" style={{ color: '#2c1f0e' }}>{acc.bankName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full border"
                          style={{ background: '#f7f0e6', color: '#6b4f35', borderColor: '#d9c9b0' }}>
                          {acc.accountType}
                        </span>
                        {acc.source === 'setu_live' && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: '#deedc8', color: '#3d5420' }}>Live</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs font-mono" style={{ color: '#a0846a' }}>{acc.maskedNumber}</span>
                        {acc.ifsc && <span className="text-xs font-mono" style={{ color: '#a0846a' }}>{acc.ifsc}</span>}
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#5a6e3a' }} />
                          <span className="text-xs" style={{ color: '#5a6e3a' }}>Connected · {acc.latency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xl font-mono block"
                      style={{ color: isCredit ? '#9b2c2c' : '#2c1f0e' }}>
                      {isCredit ? '-' : ''}₹{Math.abs(acc.balance).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs" style={{ color: '#a0846a' }}>
                      Synced {new Date(acc.lastSync).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-float-up"
                    style={{ borderTop: '1px solid #d9c9b0' }}>
                    {[
                      { label: 'Account Type',  value: acc.accountType },
                      { label: 'Account No.',   value: acc.maskedNumber },
                      { label: 'IFSC Code',     value: acc.ifsc || '—' },
                      { label: 'Currency',      value: acc.currency || 'INR' },
                    ].map(f => (
                      <div key={f.label} className="rounded-lg p-3"
                        style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
                        <span className="text-xs block" style={{ color: '#a0846a' }}>{f.label}</span>
                        <span className="font-semibold text-sm font-mono block mt-0.5" style={{ color: '#2c1f0e' }}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Link new account button */}
          <button
            onClick={() => { setConsentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="widget p-4 flex items-center justify-center gap-2 border-2 border-dashed w-full transition-all"
            style={{ borderColor: '#d9c9b0', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#7c4a1e'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#d9c9b0'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#a0846a' }}>add_circle</span>
            <span className="text-sm font-semibold" style={{ color: '#6b4f35' }}>Link Another Bank Account</span>
          </button>
        </div>
      )}

      {/* Technical reference */}
      <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b4f35' }}>Technical Reference</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ color: '#a0846a' }}>
          {[
            ['AA Framework',     'RBI Account Aggregator · NBFC-AA License'],
            ['FIP Protocol',     'AA-FIP via REBIT Financial Data Standards'],
            ['Consent Model',    'Purpose-bound · Time-limited · Revocable'],
            ['Data Standards',   'JSON FI data per RBI AA ecosystem spec'],
            ['Sandbox URL',      'https://fiu-sandbox.setu.co'],
            ['Consent Duration', '1 month (configurable in apiService.js)'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="font-semibold shrink-0" style={{ color: '#6b4f35', minWidth: 120 }}>{k}:</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
