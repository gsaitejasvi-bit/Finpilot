import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const STEPS = [
  { label: 'Your Details',    icon: 'person'          },
  { label: 'Income & Spend',  icon: 'account_balance' },
  { label: 'Your Goals',      icon: 'flag'            },
];

const ANALYSIS_STEPS = [
  { icon: 'manage_search',  text: 'Indexing income streams & commitments…'      },
  { icon: 'calculate',      text: 'Computing safe-to-spend buffer…'             },
  { icon: 'flag',           text: 'Projecting goal completion timelines…'       },
  { icon: 'auto_awesome',   text: 'Calibrating FinPilot reasoning engine…'      },
  { icon: 'verified',       text: 'Workspace ready — loading your dashboard!'   },
];

/* ── Step dot indicator ─────────────────────────────────────── */
function StepDot({ idx, current }) {
  const done   = idx < current;
  const active = idx === current;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] transition-all"
        style={{
          background: done ? '#5a6e3a' : active ? '#f3dcc0' : 'rgba(243,220,192,0.15)',
          color:      done ? '#fff'    : active ? '#2c1f0e' : 'rgba(243,220,192,0.5)',
          border:     active ? '2px solid #f3dcc0' : '2px solid transparent',
        }}>
        {done
          ? <span className="material-symbols-outlined text-[15px]">check</span>
          : idx + 1}
      </div>
      <span style={{ color: active ? '#f3dcc0' : 'rgba(243,220,192,0.4)', fontSize: '0.58rem', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {STEPS[idx].label}
      </span>
    </div>
  );
}

/* ── Shared field ───────────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ color: '#6b4f35', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono' }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ color: '#a0846a', fontSize: '0.62rem' }}>{hint}</span>}
    </div>
  );
}

function Input({ icon, ...props }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all"
      style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
      {icon && <span className="material-symbols-outlined text-[16px] shrink-0" style={{ color: '#a0846a' }}>{icon}</span>}
      <input
        {...props}
        className="flex-1 bg-transparent font-body-md outline-none placeholder:opacity-40"
        style={{ color: '#2c1f0e' }}
      />
    </div>
  );
}

/* ── Analysis animation ─────────────────────────────────────── */
function AnalysisScreen() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step < ANALYSIS_STEPS.length - 1) {
      const t = setTimeout(() => setStep(s => s + 1), 700);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      {/* Spinner */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full" style={{ border: '4px solid #ede0d0' }} />
        <div className="absolute inset-0 rounded-full animate-spin"
          style={{ border: '4px solid transparent', borderTopColor: '#7c4a1e' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]" style={{ color: '#7c4a1e' }}>finance_mode</span>
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        {ANALYSIS_STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-3 transition-all duration-500"
            style={{ opacity: i <= step ? 1 : 0.2 }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: i < step ? '#deedc8' : i === step ? '#f3dcc0' : '#ede0d0' }}>
              <span className="material-symbols-outlined text-[14px]"
                style={{ color: i < step ? '#3d5420' : i === step ? '#7c4a1e' : '#a0846a' }}>
                {i < step ? 'check' : s.icon}
              </span>
            </div>
            <span className="font-body-sm" style={{ color: i <= step ? '#2c1f0e' : '#a0846a', fontSize: '0.78rem' }}>
              {s.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main wizard ────────────────────────────────────────────── */
export default function OnboardingWizard() {
  const { currentUser, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0); // 0-2 = wizard, 3 = analysis

  // Step 1
  const [role, setRole]   = useState('');
  const [city, setCity]   = useState('');
  const [age,  setAge]    = useState('');

  // Step 2
  const [monthlyIncome,    setMonthlyIncome]    = useState('');
  const [checkingBal,      setCheckingBal]      = useState('');
  const [monthlyRent,      setMonthlyRent]      = useState('');
  const [monthlyFood,      setMonthlyFood]      = useState('');
  const [monthlyTransport, setMonthlyTransport] = useState('');
  const [monthlyShopping,  setMonthlyShopping]  = useState('');
  const [monthlyUtilities, setMonthlyUtilities] = useState('');
  const [emergencyFloor,   setEmergencyFloor]   = useState('25000');

  // Step 3
  const [goals, setGoals] = useState([{ name: '', target: '', current: '' }]);

  const addGoalRow    = ()            => goals.length < 4 && setGoals(g => [...g, { name:'', target:'', current:'' }]);
  const removeGoal    = (i)           => setGoals(g => g.filter((_,j) => j !== i));
  const updateGoal    = (i, f, v)     => setGoals(g => g.map((gl, j) => j === i ? { ...gl, [f]: v } : gl));

  const step2Valid = monthlyIncome.trim() !== '' && checkingBal.trim() !== '';
  const step3Valid = goals.some(g => g.name.trim());

  function buildFinancialData() {
    const income    = Math.max(0, Number(monthlyIncome)    || 50000);
    const rent      = Math.max(0, Number(monthlyRent)      || 0);
    const food      = Math.max(0, Number(monthlyFood)      || 6000);
    const transport = Math.max(0, Number(monthlyTransport) || 2000);
    const shopping  = Math.max(0, Number(monthlyShopping)  || 3000);
    const utilities = Math.max(0, Number(monthlyUtilities) || 4000);
    const checking  = Math.max(0, Number(checkingBal)      || income * 0.5);
    const floor     = Math.max(0, Number(emergencyFloor)   || 25000);
    const outflow   = rent + food + transport + shopping + utilities;
    const safe      = Math.max(0, checking - floor);

    const builtGoals = goals.filter(g => g.name.trim()).map((g, i) => {
      const target  = Math.max(1000, Number(g.target)  || 10000);
      const current = Math.max(0,    Number(g.current) || 0);
      const pct     = Math.min(100, Math.round((current / target) * 1000) / 10);
      return {
        id:           'goal_ob_' + i + '_' + Date.now(),
        name:         g.name.trim(),
        target, current, percentage: pct,
        daysRemaining: Math.round(Math.max(10, (target - current) / (income * 0.1 / 30))),
      };
    });

    return {
      profile:         { role: role.trim() || 'Principal Quant', city: city.trim(), age: age.trim() },
      emergencyFloor:  floor,
      safeCushion:     1500,
      liquidCapital:   checking + builtGoals.reduce((a, g) => a + g.current, 0),
      checkingBalance: checking,
      safeToSpend:     safe,
      inflow:          income,
      outflow,
      activeRunway:    outflow > 0 ? `${(checking / (outflow / 30)).toFixed(1)} days` : '—',
      syncLatency:     '18ms',
      confidenceScore: '99.4%',
      categories: [
        { id:'food',      name:'Food & Dining',     spent:0, limit:food,      color:'secondary-container', badge:'0% Spent', warn:false },
        { id:'transport', name:'Transportation',    spent:0, limit:transport, color:'tertiary-container',  badge:'0% Spent', warn:false },
        { id:'shopping',  name:'Shopping & Tech',   spent:0, limit:shopping,  color:'primary',             badge:'0% Spent', warn:false },
        { id:'utilities', name:'Utilities & Bills', spent:0, limit:utilities, color:'surface-variant',     badge:'0% Spent', warn:false },
      ],
      goals:        builtGoals,
      transactions: [],
    };
  }

  async function handleFinish() {
    setStep(3);
    const data = buildFinancialData();
    setTimeout(() => completeOnboarding(data), ANALYSIS_STEPS.length * 700 + 400);
  }

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg,#fdf8f2,#f0e8dc,#e4d5c0)' }}>
        <div className="w-full max-w-sm rounded-2xl p-8"
          style={{ background: '#fffdf9', border: '1px solid #d9c9b0', boxShadow: '0 12px 48px rgba(80,40,10,0.14)' }}>
          <div className="text-center mb-6">
            <h2 style={{ color: '#2c1f0e', fontFamily: "'Playfair Display',serif", fontSize: '1.25rem', fontWeight: 700 }}>
              Analysing your finances…
            </h2>
            <p style={{ color: '#a0846a', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Building your personalised FinPilot workspace
            </p>
          </div>
          <AnalysisScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#fdf8f2,#f0e8dc,#e4d5c0)' }}>

      <div className="w-full max-w-lg animate-float-up overflow-hidden"
        style={{ background: '#fffdf9', border: '1px solid #d9c9b0', borderRadius: '1.5rem', boxShadow: '0 12px 48px rgba(80,40,10,0.14)' }}>

        {/* Header */}
        <div className="px-8 pt-7 pb-6"
          style={{ background: 'linear-gradient(160deg,#2c1f0e 0%,#4a3318 100%)' }}>
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined text-[24px]" style={{ color: '#f3dcc0' }}>finance_mode</span>
            <span style={{ color: '#f3dcc0', fontFamily: "'Playfair Display',serif", fontSize: '1.25rem', fontWeight: 700 }}>FinPilot</span>
          </div>
          <p style={{ color: 'rgba(243,220,192,0.7)', fontSize: '0.78rem', marginBottom: '1.25rem' }}>
            Welcome, <strong style={{ color: '#f3dcc0' }}>{currentUser?.name?.split(' ')[0] ?? 'there'}</strong>!
            Let's set up your workspace in 3 quick steps.
          </p>

          {/* Step dots */}
          <div className="flex items-start justify-between relative">
            <div className="absolute top-4 left-8 right-8 h-px" style={{ background: 'rgba(243,220,192,0.2)' }} />
            {STEPS.map((_, i) => <StepDot key={i} idx={i} current={step} />)}
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">

          {/* ── Step 0: Personal ───────────────────────────────── */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 style={{ color: '#2c1f0e', fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 700 }}>Tell us about yourself</h3>
                <p style={{ color: '#a0846a', fontSize: '0.75rem', marginTop: 2 }}>Personalises your dashboard labels and insights.</p>
              </div>
              <Field label="Role / Profession" hint="e.g. Software Engineer, Freelance Designer">
                <Input icon="work" placeholder="Principal Quant" value={role} onChange={e => setRole(e.target.value)} />
              </Field>
              <Field label="City" hint="Used for cost-of-living context">
                <Input icon="location_on" placeholder="Bengaluru" value={city} onChange={e => setCity(e.target.value)} />
              </Field>
              <Field label="Age" hint="Helps calibrate long-term projections">
                <Input icon="cake" type="number" placeholder="28" value={age} onChange={e => setAge(e.target.value)} />
              </Field>
            </div>
          )}

          {/* ── Step 1: Income & spending ───────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 style={{ color: '#2c1f0e', fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 700 }}>Income & monthly spending</h3>
                <p style={{ color: '#a0846a', fontSize: '0.75rem', marginTop: 2 }}>Used to calculate your safe-to-spend buffer.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Monthly Income (₹)" hint="Take-home salary">
                  <Input icon="payments" type="number" placeholder="92000" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} />
                </Field>
                <Field label="Current Balance (₹)" hint="Today's bank balance">
                  <Input icon="account_balance_wallet" type="number" placeholder="48750" value={checkingBal} onChange={e => setCheckingBal(e.target.value)} />
                </Field>
                <Field label="Rent / EMI (₹)">
                  <Input icon="home" type="number" placeholder="15000" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} />
                </Field>
                <Field label="Food & Dining (₹)">
                  <Input icon="restaurant" type="number" placeholder="8000" value={monthlyFood} onChange={e => setMonthlyFood(e.target.value)} />
                </Field>
                <Field label="Transport (₹)">
                  <Input icon="directions_car" type="number" placeholder="4000" value={monthlyTransport} onChange={e => setMonthlyTransport(e.target.value)} />
                </Field>
                <Field label="Shopping & Tech (₹)">
                  <Input icon="shopping_bag" type="number" placeholder="6000" value={monthlyShopping} onChange={e => setMonthlyShopping(e.target.value)} />
                </Field>
                <Field label="Utilities & Bills (₹)">
                  <Input icon="bolt" type="number" placeholder="5000" value={monthlyUtilities} onChange={e => setMonthlyUtilities(e.target.value)} />
                </Field>
                <Field label="Emergency Floor (₹)" hint="Always keep this minimum">
                  <Input icon="shield" type="number" placeholder="25000" value={emergencyFloor} onChange={e => setEmergencyFloor(e.target.value)} />
                </Field>
              </div>
              {!step2Valid && (
                <p style={{ color: '#9b2c2c', fontSize: '0.72rem' }}>
                  Please enter your monthly income and current balance to continue.
                </p>
              )}
            </div>
          )}

          {/* ── Step 2: Goals ────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 style={{ color: '#2c1f0e', fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 700 }}>Your financial goals</h3>
                <p style={{ color: '#a0846a', fontSize: '0.75rem', marginTop: 2 }}>These become your sinking funds. Add more any time.</p>
              </div>

              <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                {goals.map((g, i) => (
                  <div key={i} className="rounded-xl p-3 flex flex-col gap-2"
                    style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#a0846a', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goal {i + 1}</span>
                      {goals.length > 1 && (
                        <button onClick={() => removeGoal(i)} style={{ color: '#a0846a' }}>
                          <span className="material-symbols-outlined text-[15px]">close</span>
                        </button>
                      )}
                    </div>
                    <input type="text" placeholder="Goal name (e.g. Goa Trip, Emergency Fund)"
                      value={g.name} onChange={e => updateGoal(i, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg font-body-sm outline-none"
                      style={{ background: '#fffdf9', border: '1px solid #d9c9b0', color: '#2c1f0e' }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Target ₹" value={g.target}
                        onChange={e => updateGoal(i, 'target', e.target.value)}
                        className="px-3 py-1.5 rounded-lg font-body-sm outline-none"
                        style={{ background: '#fffdf9', border: '1px solid #d9c9b0', color: '#2c1f0e' }}
                      />
                      <input type="number" placeholder="Saved so far ₹" value={g.current}
                        onChange={e => updateGoal(i, 'current', e.target.value)}
                        className="px-3 py-1.5 rounded-lg font-body-sm outline-none"
                        style={{ background: '#fffdf9', border: '1px solid #d9c9b0', color: '#2c1f0e' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {goals.length < 4 && (
                <button onClick={addGoalRow}
                  className="flex items-center gap-1.5 font-label-sm font-semibold w-fit"
                  style={{ color: '#7c4a1e', fontSize: '0.72rem' }}>
                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
                  Add another goal
                </button>
              )}
              {!step3Valid && (
                <p style={{ color: '#9b2c2c', fontSize: '0.72rem' }}>Please add at least one goal to continue.</p>
              )}
            </div>
          )}

          {/* ── Navigation ───────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-6 pt-4"
            style={{ borderTop: '1px solid #d9c9b0' }}>
            <button
              onClick={() => step > 0 && setStep(s => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl font-label-md transition-all disabled:opacity-30"
              style={{ background: '#f7f0e6', color: '#6b4f35', border: '1px solid #d9c9b0' }}
            >
              <span className="material-symbols-outlined text-[17px]">arrow_back</span>
              Back
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !step2Valid}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-label-md font-semibold transition-all disabled:opacity-40"
                style={{ background: '#7c4a1e', color: '#f3dcc0', boxShadow: '0 3px 12px rgba(124,74,30,0.25)' }}
                onMouseEnter={e => { if (!(step===1 && !step2Valid)) e.currentTarget.style.background = '#a0632e'; }}
                onMouseLeave={e => e.currentTarget.style.background = '#7c4a1e'}
              >
                Next
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!step3Valid}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-label-md font-semibold transition-all disabled:opacity-40"
                style={{ background: '#7c4a1e', color: '#f3dcc0', boxShadow: '0 3px 12px rgba(124,74,30,0.25)' }}
                onMouseEnter={e => { if (step3Valid) e.currentTarget.style.background = '#a0632e'; }}
                onMouseLeave={e => e.currentTarget.style.background = '#7c4a1e'}
              >
                <span className="material-symbols-outlined text-[17px]">rocket_launch</span>
                Launch FinPilot
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
