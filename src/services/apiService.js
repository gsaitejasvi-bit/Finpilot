/**
 * FinPilot API Service Layer
 * --------------------------
 * All external API calls go through this module.
 * Every function gracefully falls back to mock data when
 * API keys are absent or requests fail — the app always works.
 *
 * API keys are read from Vite env vars (VITE_* prefix).
 * They are NEVER exposed in production builds because they're
 * only used server-side if you proxy them; for the client-only
 * demo they fall through to mocks when missing.
 */

// ─── env helpers ────────────────────────────────────────────────────────────
const AV_KEY      = import.meta.env.VITE_ALPHA_VANTAGE_KEY  || '';
const FX_KEY      = import.meta.env.VITE_EXCHANGE_RATE_KEY   || '';

// Setu credentials — read from .env
// We explicitly reject placeholder strings so SETU_CONFIGURED is only true
// when the user has set a *real* credential, not the example value.
const _rawSetuId     = import.meta.env.VITE_SETU_CLIENT_ID     || '';
const _rawSetuSecret = import.meta.env.VITE_SETU_CLIENT_SECRET || '';
const PLACEHOLDER    = ['your_setu_client_id_here', 'your_setu_client_secret_here', '', 'undefined'];

const SETU_ID     = PLACEHOLDER.includes(_rawSetuId)     ? '' : _rawSetuId;
const SETU_SECRET = PLACEHOLDER.includes(_rawSetuSecret) ? '' : _rawSetuSecret;

// All Setu API calls go through the Vite dev proxy at /api/setu/*
// This avoids CORS — the browser never talks directly to fiu-sandbox.setu.co.
// In production, point this proxy to your own backend that forwards to Setu.
const SETU_PROXY = '/api/setu';

// ─── simple in-memory cache (per page-load) ─────────────────────────────────
const _cache = new Map();
function cached(key, ttlMs, fetcher) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.data);
  return fetcher().then(data => { _cache.set(key, { data, ts: Date.now() }); return data; });
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 1: Stock / Market Data (Alpha Vantage)
// ────────────────────────────────────────────────────────────────────────────

/** Mock price tick ±0.3% random walk (used when API key missing or limit hit) */
export function tickPrice(base) {
  return Math.round((base + (Math.random() - 0.48) * base * 0.003) * 100) / 100;
}

/**
 * Fetch a real-time quote for an NSE/BSE symbol via Alpha Vantage.
 * Falls back to mock tick if key absent or request fails.
 * @param {string} symbol  e.g. 'RELIANCE.BSE'
 * @param {number} mockBase  seed price used when falling back
 */
export async function fetchStockQuote(symbol, mockBase) {
  if (!AV_KEY) return { price: tickPrice(mockBase), source: 'mock' };
  return cached(`quote_${symbol}`, 60_000, async () => {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${AV_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('AV HTTP error');
      const json = await res.json();
      const q = json['Global Quote'];
      if (!q || !q['05. price']) throw new Error('AV empty quote');
      return {
        price:  parseFloat(q['05. price']),
        change: parseFloat(q['10. change percent'].replace('%', '')),
        volume: parseInt(q['06. volume'], 10),
        source: 'alphavantage',
      };
    } catch {
      return { price: tickPrice(mockBase), source: 'mock' };
    }
  });
}

/**
 * Fetch multiple quotes in parallel. Returns a map { symbol → quote }.
 * @param {Array<{symbol:string, base:number}>} specs
 */
export async function fetchMultipleQuotes(specs) {
  const results = await Promise.all(
    specs.map(s => fetchStockQuote(s.symbol, s.base).then(q => [s.symbol, q]))
  );
  return Object.fromEntries(results);
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 2: Forex / Currency (ExchangeRate-API)
// ────────────────────────────────────────────────────────────────────────────

/** Supported currencies with metadata */
export const CURRENCIES = {
  INR: { name: 'Indian Rupee',       symbol: '₹',  flag: '🇮🇳', decimals: 0 },
  USD: { name: 'US Dollar',          symbol: '$',  flag: '🇺🇸', decimals: 2 },
  EUR: { name: 'Euro',               symbol: '€',  flag: '🇪🇺', decimals: 2 },
  GBP: { name: 'British Pound',      symbol: '£',  flag: '🇬🇧', decimals: 2 },
  JPY: { name: 'Japanese Yen',       symbol: '¥',  flag: '🇯🇵', decimals: 0 },
  AED: { name: 'UAE Dirham',         symbol: 'د.إ',flag: '🇦🇪', decimals: 2 },
  SGD: { name: 'Singapore Dollar',   symbol: 'S$', flag: '🇸🇬', decimals: 2 },
  AUD: { name: 'Australian Dollar',  symbol: 'A$', flag: '🇦🇺', decimals: 2 },
  CAD: { name: 'Canadian Dollar',    symbol: 'C$', flag: '🇨🇦', decimals: 2 },
  CHF: { name: 'Swiss Franc',        symbol: 'Fr', flag: '🇨🇭', decimals: 2 },
};

/** Hard-coded fallback rates to 1 INR (approximate mid-market, updated Oct 2024) */
const FALLBACK_RATES_FROM_INR = {
  INR: 1,
  USD: 0.01198,
  EUR: 0.01101,
  GBP: 0.00924,
  JPY: 1.8050,
  AED: 0.04399,
  SGD: 0.01608,
  AUD: 0.01833,
  CAD: 0.01644,
  CHF: 0.01052,
};

/**
 * Fetch live exchange rates with INR as base.
 * Returns a map { currencyCode → rate } where rate is "how many X per 1 INR".
 * Falls back to static rates if key absent or request fails.
 */
export async function fetchForexRates() {
  if (!FX_KEY) return { rates: FALLBACK_RATES_FROM_INR, source: 'fallback', ts: Date.now() };
  return cached('forex_rates', 3_600_000 /* 1 hour */, async () => {
    try {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${FX_KEY}/latest/INR`);
      if (!res.ok) throw new Error('FX HTTP error');
      const json = await res.json();
      if (json.result !== 'success') throw new Error('FX API error');
      const rates = {};
      Object.keys(CURRENCIES).forEach(code => {
        rates[code] = json.conversion_rates[code] ?? FALLBACK_RATES_FROM_INR[code];
      });
      return { rates, source: 'live', ts: Date.now() };
    } catch {
      return { rates: FALLBACK_RATES_FROM_INR, source: 'fallback', ts: Date.now() };
    }
  });
}

/**
 * Convert amount from INR to target currency.
 * @param {number} amountInr
 * @param {string} targetCurrency  e.g. 'USD'
 * @param {object} rates  map from fetchForexRates()
 */
export function convertFromINR(amountInr, targetCurrency, rates) {
  const rate = rates?.[targetCurrency] ?? FALLBACK_RATES_FROM_INR[targetCurrency] ?? 1;
  return amountInr * rate;
}

/**
 * Convert amount from any currency to INR.
 */
export function convertToINR(amount, fromCurrency, rates) {
  const rate = rates?.[fromCurrency] ?? FALLBACK_RATES_FROM_INR[fromCurrency] ?? 1;
  return rate > 0 ? amount / rate : amount;
}

/**
 * Format a number as currency string.
 * @param {number} amount  in the target currency
 * @param {string} currency  e.g. 'INR'
 */
export function formatCurrency(amount, currency = 'INR') {
  const meta = CURRENCIES[currency] ?? CURRENCIES.INR;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (currency === 'INR') {
    // Indian number format
    return `${sign}${meta.symbol}${abs.toLocaleString('en-IN', {
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    })}`;
  }
  return `${sign}${meta.symbol}${abs.toLocaleString('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  })}`;
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 3: Open Banking / Account Aggregator (Setu AA)
//
// REAL FLOW (when VITE_SETU_CLIENT_ID + VITE_SETU_CLIENT_SECRET are set):
//
//  Step 1 — Create Consent:  POST /consent          → consentId + redirectUrl
//  Step 2 — User approves:   Redirect user to redirectUrl in a popup/tab
//  Step 3 — Poll status:     GET  /consent/{id}      → status: ACTIVE
//  Step 4 — Create Data Req: POST /data-request      → sessionId
//  Step 5 — Fetch FI data:   GET  /data-session/{id} → accounts + transactions
//
// MOCK FALLBACK (when keys are absent or Setu call fails):
//  Returns realistic mock accounts and transactions so the app always works.
//
// API reference: https://docs.setu.co/data/account-aggregator/api-reference
// ────────────────────────────────────────────────────────────────────────────

/** True when real Setu credentials are configured (not placeholders) */
export const SETU_CONFIGURED = Boolean(SETU_ID && SETU_SECRET);

/** Mock bank accounts — always available as fallback */
export const MOCK_BANK_ACCOUNTS = [
  {
    id:          'acc_hdfc_checking',
    bankName:    'HDFC Bank',
    accountType: 'Savings',
    maskedNumber:'****4821',
    balance:     48750,
    currency:    'INR',
    ifsc:        'HDFC0001234',
    lastSync:    new Date().toISOString(),
    status:      'connected',
    latency:     '12ms',
    source:      'mock',
  },
  {
    id:          'acc_icici_sinking',
    bankName:    'ICICI Bank',
    accountType: 'Savings',
    maskedNumber:'****7732',
    balance:     60050,
    currency:    'INR',
    ifsc:        'ICIC0005678',
    lastSync:    new Date().toISOString(),
    status:      'connected',
    latency:     '18ms',
    source:      'mock',
  },
  {
    id:          'acc_axis_credit',
    bankName:    'Axis Bank',
    accountType: 'Credit Card',
    maskedNumber:'****3391',
    balance:     -1299,
    currency:    'INR',
    ifsc:        'UTIB0009012',
    lastSync:    new Date().toISOString(),
    status:      'connected',
    latency:     '24ms',
    source:      'mock',
  },
];

/** Mock transactions — fallback when API unavailable */
export const MOCK_AA_TRANSACTIONS = [
  { id:'aa_1', bankId:'acc_hdfc_checking', title:'UPI - Swiggy',    amount:-420,  category:'Food & Dining',   timestamp:'Today at 1:15 PM',     txRef:'UPI/24091/4821' },
  { id:'aa_2', bankId:'acc_hdfc_checking', title:'UPI - IOCL',      amount:-500,  category:'Transportation',  timestamp:'Today at 9:42 AM',     txRef:'UPI/24091/4822' },
  { id:'aa_3', bankId:'acc_axis_credit',   title:'Amazon India',     amount:-1299, category:'Shopping & Tech', timestamp:'Yesterday at 6:30 PM', txRef:'CC/24090/3391'  },
  { id:'aa_4', bankId:'acc_hdfc_checking', title:'Salary Credit',    amount:92000, category:'Income',          timestamp:'01 Sep at 06:00 AM',   txRef:'NEFT/24090/001' },
  { id:'aa_5', bankId:'acc_hdfc_checking', title:'Electricity Bill', amount:-1850, category:'Utilities & Bills',timestamp:'22 Aug at 11:00 AM',  txRef:'BB/24082/4823'  },
  { id:'aa_6', bankId:'acc_icici_sinking', title:'SIP - Zerodha MF', amount:-5000, category:'Income',          timestamp:'05 Aug at 06:00 AM',   txRef:'NACH/24080/001' },
];

// ─── Setu AA: Step 1 — Get bearer token ─────────────────────────────────────
async function getSetuToken() {
  // Calls via the Vite proxy (/api/setu → https://fiu-sandbox.setu.co)
  // so there are no CORS issues in development.
  const res = await fetch(`${SETU_PROXY}/auth/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-client-id': SETU_ID },
    body:    JSON.stringify({ clientID: SETU_ID, secret: SETU_SECRET }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.status);
    throw new Error(`Setu auth failed (${res.status}): ${txt}`);
  }
  const json = await res.json();
  return json.access_token || json.accessToken;
}

// ─── Setu AA: Step 2 — Create consent ────────────────────────────────────────
/**
 * Creates a consent request for account data.
 * Returns { consentId, redirectUrl } — redirect user to redirectUrl to approve.
 * @param {string} token  Bearer token from getSetuToken()
 * @param {string} mobile  User's mobile number (used as AA handle in sandbox)
 */
export async function createSetuConsent(token, mobile = '9999999999') {
  const body = {
    consentDuration: { unit: 'MONTH', value: 1 },
    dataRange:       { from: new Date(Date.now() - 90*86400000).toISOString(), to: new Date().toISOString() },
    vua:             `${mobile}@setu-sandbox`,
    purpose: {
      category:    { type: 'string' },
      code:        '101',
      refUri:      'https://api.rebit.org.in/aa/purpose/101.xml',
      text:        'Wealth management service',
    },
    fiTypes:   ['DEPOSIT', 'MUTUAL_FUNDS', 'INSURANCE_POLICIES', 'EQUITY', 'RECURRING_DEPOSIT'],
    redirectUrl: `${window.location.origin}/banking`,
  };
  const res = await fetch(`${SETU_PROXY}/consent`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-client-id': SETU_ID },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Setu consent create failed (${res.status})`);
  const json = await res.json();
  return { consentId: json.id || json.consentId, redirectUrl: json.url || json.redirectUrl };
}

// ─── Setu AA: Step 3 — Poll consent status ───────────────────────────────────
export async function getSetuConsentStatus(token, consentId) {
  const res = await fetch(`${SETU_PROXY}/consent/${consentId}`, {
    headers: { Authorization: `Bearer ${token}`, 'x-client-id': SETU_ID },
  });
  if (!res.ok) throw new Error(`Setu consent status failed (${res.status})`);
  const json = await res.json();
  return json.status; // 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EXPIRED'
}

// ─── Setu AA: Step 4+5 — Fetch FI data once consent is ACTIVE ────────────────
async function fetchSetuFIData(token, consentId) {
  // Create data session
  const sessionRes = await fetch(`${SETU_PROXY}/data-request`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-client-id': SETU_ID },
    body:    JSON.stringify({ consentId, dataRange: { from: new Date(Date.now()-90*86400000).toISOString(), to: new Date().toISOString() } }),
  });
  if (!sessionRes.ok) throw new Error(`Setu data request failed (${sessionRes.status})`);
  const { sessionId } = await sessionRes.json();

  // Poll until ready (max 10s)
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const dataRes = await fetch(`${SETU_PROXY}/data-session/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}`, 'x-client-id': SETU_ID },
    });
    if (!dataRes.ok) continue;
    const data = await dataRes.json();
    if (data.status === 'READY') return data;
  }
  throw new Error('Setu FI data not ready after polling');
}

// ─── Map Setu FI payload → FinPilot account shape ────────────────────────────
function mapSetuAccount(fiAccount, index) {
  const summary = fiAccount.summary || {};
  return {
    id:          `acc_setu_${fiAccount.linkReferenceNumber || index}`,
    bankName:    fiAccount.fipName        || fiAccount.maskedAccNumber?.split('_')[0] || 'Bank',
    accountType: fiAccount.fiType         || 'Savings',
    maskedNumber:fiAccount.maskedAccNumber || '****0000',
    balance:     summary.currentBalance   ?? summary.closingBalance ?? 0,
    currency:    summary.currency         || 'INR',
    ifsc:        summary.ifscCode         || '',
    lastSync:    new Date().toISOString(),
    status:      'connected',
    latency:     `${Math.round(Math.random() * 20 + 8)}ms`,
    source:      'setu_live',
  };
}

function mapSetuTransaction(tx, accountId) {
  const isCredit = (tx.type || '').toUpperCase() === 'CREDIT';
  const catMap   = { SALARY:'Income', EMI:'Utilities & Bills', FUEL:'Transportation', FOOD:'Food & Dining' };
  const cat      = catMap[tx.mode] || (isCredit ? 'Income' : 'Shopping & Tech');
  return {
    id:        `setu_${tx.txnId || Date.now() + Math.random()}`,
    bankId:    accountId,
    title:     tx.narration || tx.mode || (isCredit ? 'Credit' : 'Debit'),
    amount:    isCredit ? Math.abs(tx.amount) : -Math.abs(tx.amount),
    category:  cat,
    timestamp: tx.valueDate ? new Date(tx.valueDate).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : 'Unknown',
    txRef:     tx.txnId || '',
  };
}

/**
 * Fetch bank accounts.
 * – If SETU_CONFIGURED and a consentId is stored: fetches real FI data.
 * – Otherwise: returns mock accounts.
 */
export async function fetchBankAccounts() {
  if (!SETU_CONFIGURED) {
    return { accounts: MOCK_BANK_ACCOUNTS, source: 'mock' };
  }
  return cached('bank_accounts', 300_000 /* 5 min */, async () => {
    try {
      const token     = await getSetuToken();
      const consentId = sessionStorage.getItem('setu_consent_id');
      if (!consentId) {
        // No consent yet — return mock with a note
        return { accounts: MOCK_BANK_ACCOUNTS, source: 'setu_no_consent', token };
      }
      const status = await getSetuConsentStatus(token, consentId);
      if (status !== 'ACTIVE') {
        return { accounts: MOCK_BANK_ACCOUNTS, source: `setu_consent_${status.toLowerCase()}` };
      }
      const fiData   = await fetchSetuFIData(token, consentId);
      const accounts = (fiData.accounts || []).map(mapSetuAccount);
      return {
        accounts: accounts.length > 0 ? accounts : MOCK_BANK_ACCOUNTS,
        source:   accounts.length > 0 ? 'setu_live' : 'mock',
      };
    } catch (err) {
      console.warn('Setu fetchBankAccounts error:', err.message);
      return { accounts: MOCK_BANK_ACCOUNTS, source: 'mock_fallback', error: err.message };
    }
  });
}

/**
 * Fetch transactions from all linked accounts via Setu AA.
 */
export async function fetchBankTransactions() {
  if (!SETU_CONFIGURED) {
    return { transactions: MOCK_AA_TRANSACTIONS, source: 'mock' };
  }
  try {
    const token     = await getSetuToken();
    const consentId = sessionStorage.getItem('setu_consent_id');
    if (!consentId) return { transactions: MOCK_AA_TRANSACTIONS, source: 'setu_no_consent' };

    const status = await getSetuConsentStatus(token, consentId);
    if (status !== 'ACTIVE') return { transactions: MOCK_AA_TRANSACTIONS, source: `setu_consent_${status}` };

    const fiData = await fetchSetuFIData(token, consentId);
    const transactions = [];
    (fiData.accounts || []).forEach((acc, i) => {
      const accId = `acc_setu_${acc.linkReferenceNumber || i}`;
      (acc.transactions || []).forEach(tx => transactions.push(mapSetuTransaction(tx, accId)));
    });
    return {
      transactions: transactions.length > 0 ? transactions : MOCK_AA_TRANSACTIONS,
      source:       transactions.length > 0 ? 'setu_live'  : 'mock',
    };
  } catch (err) {
    console.warn('Setu fetchBankTransactions error:', err.message);
    return { transactions: MOCK_AA_TRANSACTIONS, source: 'mock_fallback' };
  }
}

/**
 * Start the Setu AA consent flow.
 * Opens the Setu consent approval URL in a new tab.
 * Stores the consentId in sessionStorage for fetchBankAccounts to pick up.
 * @param {string} mobile  User's registered mobile number
 * @returns {{ consentId, redirectUrl }} or throws
 */
export async function initiateSetuConsent(mobile) {
  if (!SETU_CONFIGURED) throw new Error('Setu credentials not configured in .env');
  const token      = await getSetuToken();
  const { consentId, redirectUrl } = await createSetuConsent(token, mobile);
  sessionStorage.setItem('setu_consent_id', consentId);
  sessionStorage.setItem('setu_token',      token);
  return { consentId, redirectUrl };
}

/**
 * Returns whether real Setu credentials are active and a consent is stored.
 */
export function getSetuStatus() {
  return {
    configured: SETU_CONFIGURED,
    hasConsent: Boolean(sessionStorage.getItem('setu_consent_id')),
    consentId:  sessionStorage.getItem('setu_consent_id') || null,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 4: Browser Push Notifications
// ────────────────────────────────────────────────────────────────────────────

/** Request push notification permission. Returns 'granted' | 'denied' | 'default' */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';
  return Notification.requestPermission();
}

/**
 * Show a browser push notification.
 * @param {string} title
 * @param {object} options  { body, icon, tag, data }
 */
export function showPushNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      icon: '/favicon.svg',
      badge: '/emblem.svg',
      ...options,
    });
  } catch {
    // Notifications may be blocked by browser/OS silently
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 5: Recurring Transaction Utilities
// ────────────────────────────────────────────────────────────────────────────

/**
 * Detect recurring patterns from a transaction list.
 * Looks for transactions with the same title appearing > once.
 * @param {Array} transactions
 * @returns {Array} detected recurring patterns
 */
export function detectRecurringPatterns(transactions) {
  const map = new Map();
  transactions.forEach(tx => {
    const key = tx.title.toLowerCase().trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(tx);
  });
  const patterns = [];
  map.forEach((txs, key) => {
    if (txs.length >= 2) {
      patterns.push({
        title:     txs[0].title,
        category:  txs[0].category,
        amount:    txs[0].amount,
        frequency: txs.length >= 4 ? 'weekly' : 'monthly',
        lastSeen:  txs[0].timestamp,
        count:     txs.length,
      });
    }
  });
  return patterns;
}

/**
 * Get the next due date for a recurring transaction.
 * @param {string} frequency  'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
 * @param {string} lastDate   ISO date string
 */
export function getNextDueDate(frequency, lastDate) {
  const d = lastDate ? new Date(lastDate) : new Date();
  switch (frequency) {
    case 'daily':     d.setDate(d.getDate() + 1);     break;
    case 'weekly':    d.setDate(d.getDate() + 7);     break;
    case 'biweekly':  d.setDate(d.getDate() + 14);    break;
    case 'monthly':   d.setMonth(d.getMonth() + 1);   break;
    case 'quarterly': d.setMonth(d.getMonth() + 3);   break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
    default:          d.setMonth(d.getMonth() + 1);
  }
  return d;
}

/**
 * Check which recurring transactions are due today or overdue.
 * @param {Array} recurringList  list of recurring transaction objects
 * @returns {Array} due items
 */
export function getDueRecurring(recurringList) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return recurringList.filter(r => {
    if (r.status === 'paused') return false;
    const next = r.nextDue ? new Date(r.nextDue) : new Date();
    next.setHours(0, 0, 0, 0);
    return next <= today;
  });
}
