/**
 * SplitContext.jsx
 * ─────────────────
 * Full Splitwise-style split-expenses engine.
 * Persists to localStorage under the same per-user key prefix used by
 * FinancialContext so all user data stays isolated.
 *
 * Data shapes
 * ───────────
 * Group:   { id, name, emoji, createdAt, memberIds: string[] }
 * Member:  { id, name, initials, color }
 * Expense: { id, groupId, description, amount, date, payerId,
 *            splitType: 'equal'|'exact'|'percent',
 *            splits: [{ memberId, share }],   // share = exact INR amount each owes
 *            category, notes, createdAt }
 * Settlement: { id, groupId, fromId, toId, amount, date, note }
 *
 * Derived (computed, never stored):
 *   balances per group: { memberId → net INR (positive = owed, negative = owes) }
 *   simplifiedDebts: [{ fromId, toId, amount }]  (min-cash-flow algorithm)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SplitContext = createContext(null);

// ─── storage helpers ──────────────────────────────────────────────────────────
function splitKey(userId) { return `finpilot_split_${userId}`; }

function loadSplitData(userId) {
  try {
    const raw = localStorage.getItem(splitKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSplitData(userId, data) {
  localStorage.setItem(splitKey(userId), JSON.stringify(data));
}

// ─── id generator ─────────────────────────────────────────────────────────────
let _seq = 0;
function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${++_seq}`;
}

// ─── color palette for member avatars ─────────────────────────────────────────
const MEMBER_COLORS = [
  '#7c4a1e','#5a6e3a','#9e6c2a','#6b4f35','#3d5420',
  '#9b2c2c','#1a4a6e','#4a1e6e','#1e6e4a','#6e4a1e',
];

function colorFor(index) { return MEMBER_COLORS[index % MEMBER_COLORS.length]; }

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Balance engine ───────────────────────────────────────────────────────────
/**
 * For a group, compute each member's net balance across all expenses
 * and settlements.
 * Positive  → they are owed money (others owe them)
 * Negative  → they owe money (to others)
 */
export function computeBalances(expenses, settlements, members, groupId) {
  const bal = {};
  members.forEach(m => { bal[m.id] = 0; });

  expenses
    .filter(e => e.groupId === groupId)
    .forEach(e => {
      // Payer "paid" the full amount → +amount to their balance
      if (bal[e.payerId] !== undefined) bal[e.payerId] += e.amount;
      // Each split member "owes" their share → -share from their balance
      e.splits.forEach(s => {
        if (bal[s.memberId] !== undefined) bal[s.memberId] -= s.share;
      });
    });

  // Settlements cancel debts
  settlements
    .filter(s => s.groupId === groupId)
    .forEach(s => {
      if (bal[s.fromId] !== undefined) bal[s.fromId] += s.amount; // paid off
      if (bal[s.toId]   !== undefined) bal[s.toId]   -= s.amount; // received
    });

  return bal;
}

/**
 * Greedy min-cash-flow simplification.
 * Returns the minimum set of directed payments to settle all debts.
 */
export function simplifyDebts(balances) {
  // Round to 2 decimal places to avoid floating-point noise
  const net = {};
  Object.entries(balances).forEach(([id, v]) => {
    net[id] = Math.round(v * 100) / 100;
  });

  const creditors = Object.entries(net).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const debtors   = Object.entries(net).filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]);

  const result = [];
  let ci = 0, di = 0;
  const cAmts = creditors.map(([, v]) => v);
  const dAmts  = debtors.map(([, v])  => Math.abs(v));

  while (ci < creditors.length && di < debtors.length) {
    const pay = Math.min(cAmts[ci], dAmts[di]);
    if (pay > 0.005) {
      result.push({ fromId: debtors[di][0], toId: creditors[ci][0], amount: Math.round(pay * 100) / 100 });
    }
    cAmts[ci] -= pay;
    dAmts[di]  -= pay;
    if (cAmts[ci] < 0.005) ci++;
    if (dAmts[di]  < 0.005) di++;
  }
  return result;
}

/**
 * Build the splits array from a splitType + raw input.
 * @param {'equal'|'exact'|'percent'} splitType
 * @param {string[]} memberIds  — which members share the expense
 * @param {number}   total      — full expense amount
 * @param {object}   rawInputs  — { [memberId]: value } for exact/percent modes
 * @returns {{ memberId, share }[]}
 */
export function buildSplits(splitType, memberIds, total, rawInputs = {}) {
  if (splitType === 'equal') {
    const share = total / memberIds.length;
    return memberIds.map(id => ({ memberId: id, share: Math.round(share * 100) / 100 }));
  }
  if (splitType === 'exact') {
    return memberIds.map(id => ({ memberId: id, share: Number(rawInputs[id] ?? 0) }));
  }
  if (splitType === 'percent') {
    return memberIds.map(id => {
      const pct = Number(rawInputs[id] ?? 0);
      return { memberId: id, share: Math.round(total * pct / 100 * 100) / 100 };
    });
  }
  return [];
}

// ─── Default seed group (shown on first use) ──────────────────────────────────
function buildDefaults(currentUser) {
  const meId = currentUser?.id ?? 'me';
  const meName = currentUser?.name ?? 'You';
  const members = [
    { id: meId,        name: meName,    initials: initials(meName), color: MEMBER_COLORS[0] },
    { id: 'mbr_demo1', name: 'Rahul',   initials: 'RA',             color: MEMBER_COLORS[1] },
    { id: 'mbr_demo2', name: 'Priya',   initials: 'PR',             color: MEMBER_COLORS[2] },
  ];
  const groupId = 'grp_demo';
  const exp1Id  = 'exp_demo1';
  const exp2Id  = 'exp_demo2';
  const splits1 = buildSplits('equal', [meId, 'mbr_demo1', 'mbr_demo2'], 2400);
  const splits2 = buildSplits('equal', [meId, 'mbr_demo2'], 900);
  return {
    groups: [
      { id: groupId, name: 'Goa Trip 🏖️', emoji: '🏖️', createdAt: new Date().toISOString(), memberIds: members.map(m => m.id) },
    ],
    members,
    expenses: [
      { id: exp1Id, groupId, description: 'Hotel Booking', amount: 2400, date: '2024-09-14', payerId: meId,        splitType: 'equal', splits: splits1, category: 'Accommodation', notes: '', createdAt: new Date().toISOString() },
      { id: exp2Id, groupId, description: 'Beach Dinner',  amount: 900,  date: '2024-09-15', payerId: 'mbr_demo1', splitType: 'equal', splits: splits2, category: 'Food',          notes: '', createdAt: new Date().toISOString() },
    ],
    settlements: [],
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SplitProvider({ children }) {
  const { currentUser } = useAuth();

  const init = () => {
    if (!currentUser) return { groups: [], members: [], expenses: [], settlements: [] };
    const saved = loadSplitData(currentUser.id);
    return saved ?? buildDefaults(currentUser);
  };

  const [groups,      setGroups]      = useState(() => init().groups);
  const [members,     setMembers]     = useState(() => init().members);
  const [expenses,    setExpenses]    = useState(() => init().expenses);
  const [settlements, setSettlements] = useState(() => init().settlements);

  // Re-init when user changes (login / logout)
  useEffect(() => {
    if (!currentUser) return;
    const saved = loadSplitData(currentUser.id) ?? buildDefaults(currentUser);
    setGroups(saved.groups);
    setMembers(saved.members);
    setExpenses(saved.expenses);
    setSettlements(saved.settlements);
  }, [currentUser?.id]); // eslint-disable-line

  // Auto-persist
  useEffect(() => {
    if (!currentUser) return;
    saveSplitData(currentUser.id, { groups, members, expenses, settlements });
  }, [currentUser?.id, groups, members, expenses, settlements]); // eslint-disable-line

  // ── Group mutations ────────────────────────────────────────────────────────
  const createGroup = useCallback(({ name, emoji = '👥', memberNames = [] }) => {
    const meId    = currentUser?.id ?? 'me';
    const meName  = currentUser?.name ?? 'You';

    // Always add "me" as first member
    const newMembers = [];
    if (!members.find(m => m.id === meId)) {
      newMembers.push({ id: meId, name: meName, initials: initials(meName), color: colorFor(0) });
    }
    memberNames.forEach((n, i) => {
      const id = uid('mbr');
      newMembers.push({ id, name: n.trim(), initials: initials(n), color: colorFor(i + 1) });
    });

    const allMemberIds = [
      meId,
      ...newMembers.filter(m => m.id !== meId).map(m => m.id),
    ];

    const group = { id: uid('grp'), name: name.trim(), emoji, createdAt: new Date().toISOString(), memberIds: allMemberIds };

    setMembers(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      return [...prev, ...newMembers.filter(m => !existingIds.has(m.id))];
    });
    setGroups(prev => [...prev, group]);
    return group.id;
  }, [currentUser, members]);

  const deleteGroup = useCallback((groupId) => {
    setGroups(prev      => prev.filter(g      => g.id !== groupId));
    setExpenses(prev    => prev.filter(e      => e.groupId !== groupId));
    setSettlements(prev => prev.filter(s      => s.groupId !== groupId));
  }, []);

  const addMemberToGroup = useCallback((groupId, memberName) => {
    const id = uid('mbr');
    const colorIdx = members.filter(m => {
      const g = groups.find(g => g.id === groupId);
      return g?.memberIds.includes(m.id);
    }).length;
    const newMember = { id, name: memberName.trim(), initials: initials(memberName), color: colorFor(colorIdx) };
    setMembers(prev => [...prev, newMember]);
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, memberIds: [...g.memberIds, id] } : g));
    return id;
  }, [members, groups]);

  // ── Expense mutations ──────────────────────────────────────────────────────
  const addExpense = useCallback(({ groupId, description, amount, date, payerId, splitType, splitMemberIds, rawInputs, category = 'General', notes = '' }) => {
    const numAmount = Number(amount) || 0;
    const splits    = buildSplits(splitType, splitMemberIds, numAmount, rawInputs);
    const expense   = {
      id: uid('exp'),
      groupId, description: description.trim(),
      amount: numAmount,
      date: date || new Date().toISOString().slice(0, 10),
      payerId, splitType, splits, category, notes,
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [expense, ...prev]);
    return expense.id;
  }, []);

  const editExpense = useCallback((expId, updates) => {
    setExpenses(prev => prev.map(e => {
      if (e.id !== expId) return e;
      const merged = { ...e, ...updates };
      if (updates.amount || updates.splitType || updates.splitMemberIds || updates.rawInputs) {
        merged.splits = buildSplits(
          merged.splitType,
          updates.splitMemberIds ?? merged.splits.map(s => s.memberId),
          Number(merged.amount),
          updates.rawInputs ?? {}
        );
      }
      return merged;
    }));
  }, []);

  const deleteExpense = useCallback((expId) => {
    setExpenses(prev => prev.filter(e => e.id !== expId));
  }, []);

  // ── Settlement mutations ───────────────────────────────────────────────────
  const addSettlement = useCallback(({ groupId, fromId, toId, amount, note = '' }) => {
    const s = { id: uid('stl'), groupId, fromId, toId, amount: Number(amount), date: new Date().toISOString().slice(0, 10), note, createdAt: new Date().toISOString() };
    setSettlements(prev => [s, ...prev]);
    return s.id;
  }, []);

  const deleteSettlement = useCallback((sId) => {
    setSettlements(prev => prev.filter(s => s.id !== sId));
  }, []);

  // ── Derived helpers (memoised) ────────────────────────────────────────────
  const getGroupMembers = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    return members.filter(m => group.memberIds.includes(m.id));
  }, [groups, members]);

  const getGroupExpenses = useCallback((groupId) =>
    expenses.filter(e => e.groupId === groupId), [expenses]);

  const getGroupSettlements = useCallback((groupId) =>
    settlements.filter(s => s.groupId === groupId), [settlements]);

  const getBalances = useCallback((groupId) => {
    const grpMembers = getGroupMembers(groupId);
    return computeBalances(expenses, settlements, grpMembers, groupId);
  }, [expenses, settlements, getGroupMembers]);

  const getSimplifiedDebts = useCallback((groupId) => {
    const balances = getBalances(groupId);
    return simplifyDebts(balances);
  }, [getBalances]);

  /** Net position of the logged-in user across ALL groups */
  const getMyNetBalance = useCallback(() => {
    const meId = currentUser?.id;
    if (!meId) return { youOwe: 0, youAreOwed: 0, net: 0 };
    let youOwe = 0, youAreOwed = 0;
    groups.forEach(g => {
      const bal = getBalances(g.id);
      const myBal = bal[meId] ?? 0;
      if (myBal < 0) youOwe     += Math.abs(myBal);
      else           youAreOwed += myBal;
    });
    return { youOwe, youAreOwed, net: youAreOwed - youOwe };
  }, [groups, getBalances, currentUser]);

  /** Used by FinAgent AI to get a summary */
  const getAISummary = useCallback(() => {
    const meId   = currentUser?.id;
    const { youOwe, youAreOwed, net } = getMyNetBalance();
    const debts  = [];
    groups.forEach(g => {
      const simplified = getSimplifiedDebts(g.id);
      simplified.forEach(d => {
        const from = members.find(m => m.id === d.fromId);
        const to   = members.find(m => m.id === d.toId);
        if (d.fromId === meId) debts.push({ type: 'owe',  person: to?.name   ?? 'someone', amount: d.amount, group: g.name });
        if (d.toId   === meId) debts.push({ type: 'owed', person: from?.name ?? 'someone', amount: d.amount, group: g.name });
      });
    });
    return { youOwe, youAreOwed, net, debts, groupCount: groups.length, expenseCount: expenses.length };
  }, [groups, members, getSimplifiedDebts, getMyNetBalance, currentUser, expenses]);

  return (
    <SplitContext.Provider value={{
      groups, members, expenses, settlements,
      createGroup, deleteGroup, addMemberToGroup,
      addExpense, editExpense, deleteExpense,
      addSettlement, deleteSettlement,
      getGroupMembers, getGroupExpenses, getGroupSettlements,
      getBalances, getSimplifiedDebts, getMyNetBalance, getAISummary,
      currentUserId: currentUser?.id,
    }}>
      {children}
    </SplitContext.Provider>
  );
}

export function useSplit() {
  const ctx = useContext(SplitContext);
  if (!ctx) throw new Error('useSplit must be used inside <SplitProvider>');
  return ctx;
}
