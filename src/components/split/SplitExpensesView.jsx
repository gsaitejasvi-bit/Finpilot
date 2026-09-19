/**
 * SplitExpensesView.jsx
 * Full Splitwise-style split expenses UI.
 * Uses SplitContext for all state — no mock data.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useSplit } from '../../context/SplitContext';

// ─── Design tokens (match existing parchment theme) ───────────────────────────
const C = {
  bg:         '#fdf8f2',
  card:       '#fffdf9',
  cardBorder: '#d9c9b0',
  surface:    '#f7f0e6',
  surfaceDeep:'#ede0d0',
  primary:    '#7c4a1e',
  primaryHov: '#a0632e',
  primaryLight:'#f3dcc0',
  secondary:  '#9e6c2a',
  tertiary:   '#5a6e3a',
  tertiaryLight:'#deedc8',
  tertiaryBorder:'#c4db9e',
  error:      '#9b2c2c',
  errorLight: '#f5d5d5',
  errorBorder:'#f0b8b8',
  text:       '#2c1f0e',
  textMid:    '#6b4f35',
  textMuted:  '#a0846a',
  warning:    '#9e6c2a',
  warningLight:'#faecd3',
  warningBorder:'#e8c99a',
};

const fmt = n => `₹${Math.abs(Number(n)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Tiny shared components ───────────────────────────────────────────────────
function Avatar({ member, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: member.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      fontFamily: 'Geist, sans-serif', letterSpacing: '0.02em',
    }}>
      {member.initials}
    </div>
  );
}

function Badge({ label, bg = C.surface, color = C.textMid, border = C.cardBorder }) {
  return (
    <span style={{
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 999, padding: '2px 10px',
      fontSize: '0.65rem', fontWeight: 700,
      fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 16px', borderRadius: 999, fontSize: '0.75rem',
      fontWeight: active ? 700 : 500, cursor: 'pointer',
      border: `1px solid ${active ? C.primary : C.cardBorder}`,
      background: active ? C.primary : C.surface,
      color: active ? C.primaryLight : C.textMid,
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  );
}

function IconBtn({ icon, onClick, title, color = C.textMid, bg = C.surface }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 28, height: 28, borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${C.cardBorder}`, background: bg,
      cursor: 'pointer', color, flexShrink: 0,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 15, color }}>{icon}</span>
    </button>
  );
}

function SectionHead({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.text, fontFamily: "'Playfair Display', serif" }}>{title}</div>
        {sub && <div style={{ fontSize: '0.68rem', color: C.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div className="widget" style={{
      background: C.card, border: `1px solid ${C.cardBorder}`,
      borderRadius: '1.25rem', padding: '1.25rem', ...style,
    }}>
      {children}
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: C.textMuted, display: 'block', marginBottom: 8 }}>{icon}</span>
      <div style={{ fontWeight: 600, color: C.text, fontSize: '0.9rem' }}>{title}</div>
      {sub && <div style={{ color: C.textMuted, fontSize: '0.75rem', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Input helpers ────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMid, marginBottom: 4 }}>
      {children}
    </label>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 12,
  border: `1px solid ${C.cardBorder}`, background: C.surface,
  color: C.text, fontSize: '0.875rem', outline: 'none',
  fontFamily: 'Geist, sans-serif', boxSizing: 'border-box',
};

function Input({ label, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input style={inputStyle} {...props} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select style={inputStyle} {...props}>
        {options.map(o => (
          typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, icon, onClose, children, wide }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(44,31,14,0.45)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}
      onClick={onClose}
    >
      <div style={{
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: '1.25rem', boxShadow: '0 16px 48px rgba(80,40,10,0.22)',
        width: '100%', maxWidth: wide ? 640 : 500,
        maxHeight: '90vh', overflowY: 'auto',
      }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.25rem 0.75rem', borderBottom: `1px solid ${C.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: C.primary }}>{icon}</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: C.text, fontFamily: "'Playfair Display', serif" }}>{title}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, confirmLabel = 'Confirm', confirmColor = C.primary, disabled }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: `1px solid ${C.cardBorder}`, marginTop: 12 }}>
      {onCancel && (
        <button onClick={onCancel} style={{ padding: '7px 18px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, background: C.surface, color: C.textMid, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
      )}
      <button onClick={onConfirm} disabled={disabled} style={{
        padding: '7px 20px', borderRadius: 12, border: 'none',
        background: disabled ? C.surfaceDeep : confirmColor,
        color: disabled ? C.textMuted : '#fffdf9', fontWeight: 700,
        fontSize: '0.8rem', cursor: disabled ? 'not-allowed' : 'pointer',
      }}>{confirmLabel}</button>
    </div>
  );
}

// ─── Create Group Modal ───────────────────────────────────────────────────────
const EMOJIS = ['👥','🏖️','🍕','✈️','🏠','🎉','🎓','💼','🏋️','🎮','🎵','🌿'];

function CreateGroupModal({ onClose }) {
  const { createGroup } = useSplit();
  const [name,    setName]    = useState('');
  const [emoji,   setEmoji]   = useState('👥');
  const [newName, setNewName] = useState('');
  const [members, setMembers] = useState([]);

  const addMember = () => {
    if (!newName.trim()) return;
    setMembers(p => [...p, newName.trim()]);
    setNewName('');
  };

  const submit = () => {
    if (!name.trim()) return;
    createGroup({ name, emoji, memberNames: members });
    onClose();
  };

  return (
    <Modal title="Create Group" icon="group_add" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Emoji picker */}
        <div>
          <Label>Group Emoji</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} style={{
                width: 36, height: 36, borderRadius: 10, fontSize: '1.2rem',
                cursor: 'pointer', border: `2px solid ${emoji === e ? C.primary : C.cardBorder}`,
                background: emoji === e ? C.primaryLight : C.surface,
              }}>{e}</button>
            ))}
          </div>
        </div>

        <Input label="Group Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Goa Trip, Office Lunch…" autoFocus />

        {/* Add members */}
        <div>
          <Label>Add Members (besides yourself)</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Member name" onKeyDown={e => e.key === 'Enter' && addMember()} />
            <button onClick={addMember} style={{ padding: '8px 14px', borderRadius: 12, background: C.primary, color: C.primaryLight, border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {members.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: C.primaryLight, border: `1px solid ${C.warningBorder}` }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: C.primary }}>{m}</span>
                <button onClick={() => setMembers(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ))}
          </div>
        </div>

        <ModalFooter onCancel={onClose} onConfirm={submit} confirmLabel="Create Group" disabled={!name.trim()} />
      </div>
    </Modal>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ groupId, onClose }) {
  const { addMemberToGroup } = useSplit();
  const [name, setName] = useState('');
  return (
    <Modal title="Add Member" icon="person_add" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Member Name" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" autoFocus />
        <ModalFooter onCancel={onClose} onConfirm={() => { if (name.trim()) { addMemberToGroup(groupId, name); onClose(); } }} confirmLabel="Add Member" disabled={!name.trim()} />
      </div>
    </Modal>
  );
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
const EXPENSE_CATS = ['Food','Travel','Accommodation','Entertainment','Shopping','Utilities','Transport','Health','General'];

function AddExpenseModal({ groupId, editingExpense, onClose }) {
  const { addExpense, editExpense, getGroupMembers } = useSplit();
  const grpMembers = getGroupMembers(groupId);

  const isEdit = Boolean(editingExpense);
  const e      = editingExpense;

  const [desc,       setDesc]       = useState(e?.description ?? '');
  const [amount,     setAmount]     = useState(e ? String(e.amount) : '');
  const [date,       setDate]       = useState(e?.date ?? new Date().toISOString().slice(0,10));
  const [payerId,    setPayerId]    = useState(e?.payerId ?? grpMembers[0]?.id ?? '');
  const [splitType,  setSplitType]  = useState(e?.splitType ?? 'equal');
  const [splitIds,   setSplitIds]   = useState(() => e ? e.splits.map(s => s.memberId) : grpMembers.map(m => m.id));
  const [rawInputs,  setRawInputs]  = useState(() => {
    if (!e || e.splitType === 'equal') return {};
    return Object.fromEntries(e.splits.map(s => [s.memberId, s.share]));
  });
  const [category,   setCategory]   = useState(e?.category ?? 'General');
  const [notes,      setNotes]      = useState(e?.notes ?? '');

  const totalNum = Number(amount) || 0;

  const toggleMember = id => setSplitIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // Validation: exact splits must sum to total; percent must sum to 100
  const splitValid = useMemo(() => {
    if (splitType === 'equal') return splitIds.length > 0;
    if (splitType === 'exact') {
      const sum = splitIds.reduce((a, id) => a + Number(rawInputs[id] ?? 0), 0);
      return Math.abs(sum - totalNum) < 0.01 && splitIds.length > 0;
    }
    if (splitType === 'percent') {
      const sum = splitIds.reduce((a, id) => a + Number(rawInputs[id] ?? 0), 0);
      return Math.abs(sum - 100) < 0.01 && splitIds.length > 0;
    }
    return false;
  }, [splitType, splitIds, rawInputs, totalNum]);

  const equalShare = splitIds.length > 0 ? totalNum / splitIds.length : 0;

  const submit = () => {
    if (!desc.trim() || !totalNum || !payerId || !splitIds.length || !splitValid) return;
    const payload = { groupId, description: desc, amount: totalNum, date, payerId, splitType, splitMemberIds: splitIds, rawInputs, category, notes };
    if (isEdit) editExpense(editingExpense.id, payload);
    else        addExpense(payload);
    onClose();
  };

  return (
    <Modal title={isEdit ? 'Edit Expense' : 'Add Expense'} icon={isEdit ? 'edit' : 'receipt_long'} onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Description" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Hotel Booking, Petrol…" autoFocus />
          </div>
          <Input label="Amount (₹)" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Select label="Paid by" value={payerId} onChange={e => setPayerId(e.target.value)}
            options={grpMembers.map(m => ({ value: m.id, label: m.name }))} />
          <Select label="Category" value={category} onChange={e => setCategory(e.target.value)} options={EXPENSE_CATS} />
        </div>

        {/* Split type */}
        <div>
          <Label>Split Method</Label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['equal','exact','percent'].map(t => (
              <Pill key={t} active={splitType === t} onClick={() => setSplitType(t)}>
                {t === 'equal' ? '⚖ Equal' : t === 'exact' ? '₹ Exact' : '% Percent'}
              </Pill>
            ))}
          </div>
        </div>

        {/* Member splits */}
        <div>
          <Label>Split Between</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {grpMembers.map(m => {
              const selected = splitIds.includes(m.id);
              return (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 12,
                  border: `1px solid ${selected ? C.primary : C.cardBorder}`,
                  background: selected ? C.primaryLight : C.surface,
                  cursor: 'pointer',
                }} onClick={() => toggleMember(m.id)}>
                  <Avatar member={m} size={28} />
                  <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: C.text }}>{m.name}</span>

                  {splitType === 'equal' && selected && (
                    <span style={{ fontSize: '0.75rem', color: C.primary, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                      {fmt(equalShare)}
                    </span>
                  )}

                  {(splitType === 'exact' || splitType === 'percent') && selected && (
                    <input type="number" min="0" value={rawInputs[m.id] ?? ''}
                      onChange={ev => { ev.stopPropagation(); setRawInputs(p => ({ ...p, [m.id]: ev.target.value })); }}
                      onClick={ev => ev.stopPropagation()}
                      style={{ width: 80, padding: '4px 8px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: '#fffdf9', fontSize: '0.8rem', textAlign: 'right', color: C.primary, fontFamily: 'JetBrains Mono' }}
                      placeholder={splitType === 'percent' ? '%' : '₹'}
                    />
                  )}

                  <div style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${selected ? C.primary : C.cardBorder}`, background: selected ? C.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selected && <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#fff' }}>check</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation hints */}
          {splitType === 'exact' && totalNum > 0 && (
            <div style={{ marginTop: 6, fontSize: '0.7rem', color: splitValid ? C.tertiary : C.error }}>
              Sum: {fmt(splitIds.reduce((a, id) => a + Number(rawInputs[id] ?? 0), 0))} / {fmt(totalNum)}
              {!splitValid && ' — must equal total'}
            </div>
          )}
          {splitType === 'percent' && (
            <div style={{ marginTop: 6, fontSize: '0.7rem', color: splitValid ? C.tertiary : C.error }}>
              Total: {splitIds.reduce((a, id) => a + Number(rawInputs[id] ?? 0), 0).toFixed(1)}% {!splitValid && '— must equal 100%'}
            </div>
          )}
        </div>

        <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any extra details…" />

        <ModalFooter onCancel={onClose} onConfirm={submit} confirmLabel={isEdit ? 'Save Changes' : 'Add Expense'}
          disabled={!desc.trim() || !totalNum || !splitValid} />
      </div>
    </Modal>
  );
}

// ─── Settle Up Modal ──────────────────────────────────────────────────────────
function SettleUpModal({ groupId, prefill, onClose }) {
  const { addSettlement, getGroupMembers, getSimplifiedDebts } = useSplit();
  const members   = getGroupMembers(groupId);
  const debts     = getSimplifiedDebts(groupId);

  const [fromId,  setFromId]  = useState(prefill?.fromId ?? members[0]?.id ?? '');
  const [toId,    setToId]    = useState(prefill?.toId   ?? members[1]?.id ?? '');
  const [amount,  setAmount]  = useState(prefill ? String(prefill.amount) : '');
  const [note,    setNote]    = useState('');

  const submit = () => {
    if (!fromId || !toId || !Number(amount)) return;
    addSettlement({ groupId, fromId, toId, amount: Number(amount), note });
    onClose();
  };

  return (
    <Modal title="Settle Up" icon="payments" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Suggested payments */}
        {debts.length > 0 && (
          <div>
            <Label>Suggested Payments</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {debts.map((d, i) => {
                const from = members.find(m => m.id === d.fromId);
                const to   = members.find(m => m.id === d.toId);
                return (
                  <button key={i} onClick={() => { setFromId(d.fromId); setToId(d.toId); setAmount(String(d.amount)); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      borderRadius: 12, border: `1px solid ${C.cardBorder}`,
                      background: fromId === d.fromId && toId === d.toId ? C.primaryLight : C.surface,
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                    <Avatar member={from || { initials: '?', color: C.textMuted }} size={26} />
                    <span style={{ fontSize: '0.78rem', color: C.text, fontWeight: 600 }}>{from?.name}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.textMuted }}>arrow_forward</span>
                    <Avatar member={to || { initials: '?', color: C.textMuted }} size={26} />
                    <span style={{ fontSize: '0.78rem', color: C.text, fontWeight: 600 }}>{to?.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700, color: C.primary, fontFamily: 'JetBrains Mono' }}>{fmt(d.amount)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Who paid" value={fromId} onChange={e => setFromId(e.target.value)}
            options={members.map(m => ({ value: m.id, label: m.name }))} />
          <Select label="Paid to" value={toId} onChange={e => setToId(e.target.value)}
            options={members.map(m => ({ value: m.id, label: m.name }))} />
        </div>
        <Input label="Amount (₹)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
        <Input label="Note (optional)" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Google Pay, Cash…" />

        <ModalFooter onCancel={onClose} onConfirm={submit} confirmLabel="Record Settlement"
          confirmColor={C.tertiary} disabled={!fromId || !toId || fromId === toId || !Number(amount)} />
      </div>
    </Modal>
  );
}

// ─── Group Detail view ────────────────────────────────────────────────────────
function GroupDetail({ groupId, onBack }) {
  const {
    groups, deleteGroup,
    getGroupMembers, getGroupExpenses, getGroupSettlements,
    getBalances, getSimplifiedDebts,
    deleteExpense, deleteSettlement,
    currentUserId,
  } = useSplit();

  const group       = groups.find(g => g.id === groupId);
  const members     = getGroupMembers(groupId);
  const expenses    = getGroupExpenses(groupId);
  const settlements = getGroupSettlements(groupId);
  const balances    = getBalances(groupId);
  const debts       = getSimplifiedDebts(groupId);

  const [tab,          setTab]          = useState('expenses'); // expenses | balances | history | members
  const [showAddExp,   setShowAddExp]   = useState(false);
  const [showSettle,   setShowSettle]   = useState(false);
  const [settlePrefill,setSettlePrefill]= useState(null);
  const [editExp,      setEditExp]      = useState(null);
  const [showAddMember,setShowAddMember]= useState(false);

  if (!group) return null;

  const totalSpend  = expenses.reduce((a, e) => a + e.amount, 0);
  const myBalance   = balances[currentUserId] ?? 0;

  const memberMap = Object.fromEntries(members.map(m => [m.id, m]));

  const handleDeleteGroup = () => {
    if (!window.confirm(`Delete "${group.name}" and all its expenses?`)) return;
    deleteGroup(groupId);
    onBack();
  };

  const TABS = [
    { id: 'expenses',  icon: 'receipt_long',   label: 'Expenses'  },
    { id: 'balances',  icon: 'balance',         label: 'Balances'  },
    { id: 'history',   icon: 'history',         label: 'History'   },
    { id: 'members',   icon: 'group',           label: 'Members'   },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Modals */}
      {showAddExp   && <AddExpenseModal groupId={groupId} editingExpense={null}   onClose={() => setShowAddExp(false)} />}
      {editExp      && <AddExpenseModal groupId={groupId} editingExpense={editExp} onClose={() => setEditExp(null)} />}
      {showSettle   && <SettleUpModal   groupId={groupId} prefill={settlePrefill} onClose={() => { setShowSettle(false); setSettlePrefill(null); }} />}
      {showAddMember && <AddMemberModal groupId={groupId} onClose={() => setShowAddMember(false)} />}

      {/* Back + Group header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.textMid, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, marginTop: 2, padding: '4px 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> All Groups
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.8rem' }}>{group.emoji}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: C.text, fontFamily: "'Playfair Display', serif" }}>{group.name}</h2>
              <span style={{ fontSize: '0.7rem', color: C.textMuted }}>{members.length} members · {expenses.length} expenses</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowAddExp(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12,
            background: C.primary, color: C.primaryLight, border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> Add Expense
          </button>
          <button onClick={() => setShowSettle(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12,
            background: C.tertiaryLight, color: C.tertiary, border: `1px solid ${C.tertiaryBorder}`, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>payments</span> Settle Up
          </button>
          <button onClick={handleDeleteGroup} title="Delete group" style={{
            padding: '8px', borderRadius: 12, background: C.errorLight, border: `1px solid ${C.errorBorder}`,
            color: C.error, cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Spend',  value: fmt(totalSpend),         color: C.primary },
          { label: 'Members',      value: members.length,           color: C.secondary },
          { label: 'My Balance',   value: (myBalance >= 0 ? '+' : '-') + fmt(myBalance), color: myBalance >= 0 ? C.tertiary : C.error },
          { label: 'Open Debts',   value: debts.length,             color: C.warning },
        ].map(s => (
          <Card key={s.label} style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono' }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', color: C.textMuted, marginTop: 2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px',
            border: 'none', borderBottom: `2px solid ${tab === t.id ? C.primary : 'transparent'}`,
            background: 'none', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400,
            fontSize: '0.78rem', color: tab === t.id ? C.primary : C.textMuted,
            transition: 'all 0.15s',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Expenses ─────────────────────────────────────────────────── */}
      {tab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {expenses.length === 0
            ? <Card><EmptyState icon="receipt_long" title="No expenses yet" sub="Click 'Add Expense' to log your first shared cost" /></Card>
            : expenses.map(exp => {
              const payer     = memberMap[exp.payerId];
              const myShare   = exp.splits.find(s => s.memberId === currentUserId)?.share ?? 0;
              const iPayedFull= exp.payerId === currentUserId;
              return (
                <Card key={exp.id} style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Category icon */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.primary }}>
                        {exp.category === 'Food' ? 'restaurant' : exp.category === 'Travel' ? 'flight' : exp.category === 'Accommodation' ? 'hotel' : exp.category === 'Transport' ? 'directions_car' : 'receipt_long'}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: C.text }}>{exp.description}</span>
                        <Badge label={exp.category} />
                        <Badge label={exp.splitType === 'equal' ? '⚖ Equal' : exp.splitType === 'exact' ? '₹ Exact' : '% Percent'} bg={C.primaryLight} color={C.primary} border={C.warningBorder} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: C.textMuted, marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span>{exp.date}</span>
                        <span>Paid by <strong style={{ color: C.text }}>{payer?.name ?? 'Unknown'}</strong></span>
                        {exp.notes && <span>· {exp.notes}</span>}
                      </div>

                      {/* Splits mini-list */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {exp.splits.map(s => {
                          const m = memberMap[s.memberId];
                          if (!m) return null;
                          return (
                            <div key={s.memberId} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: C.surface, border: `1px solid ${C.cardBorder}` }}>
                              <Avatar member={m} size={16} />
                              <span style={{ fontSize: '0.65rem', color: C.textMid }}>{m.name}</span>
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: C.primary, fontFamily: 'JetBrains Mono' }}>{fmt(s.share)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right column */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: C.text, fontFamily: 'JetBrains Mono' }}>{fmt(exp.amount)}</span>
                      {iPayedFull
                        ? <Badge label={`You paid · lent ${fmt(exp.amount - myShare)}`} bg={C.tertiaryLight} color={C.tertiary} border={C.tertiaryBorder} />
                        : myShare > 0
                          ? <Badge label={`Your share: ${fmt(myShare)}`} bg={C.warningLight} color={C.warning} border={C.warningBorder} />
                          : null
                      }
                      <div style={{ display: 'flex', gap: 4 }}>
                        <IconBtn icon="edit" onClick={() => setEditExp(exp)} title="Edit" />
                        <IconBtn icon="delete" onClick={() => { if (window.confirm('Delete this expense?')) deleteExpense(exp.id); }} title="Delete" color={C.error} bg={C.errorLight} />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          }
        </div>
      )}

      {/* ── Tab: Balances ─────────────────────────────────────────────────── */}
      {tab === 'balances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Per-member balance */}
          <Card>
            <SectionHead title="Member Balances" sub="Positive = owed money · Negative = owes money" />
            {members.length === 0
              ? <EmptyState icon="balance" title="No members" sub="Add members to see balances" />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {members.map(m => {
                    const bal    = balances[m.id] ?? 0;
                    const isOwe  = bal < 0;
                    const pct    = totalSpend > 0 ? Math.abs(bal) / totalSpend * 100 : 0;
                    return (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar member={m} size={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: C.text }}>{m.name}{m.id === currentUserId ? ' (you)' : ''}</div>
                          <div style={{ height: 5, borderRadius: 999, background: C.surfaceDeep, marginTop: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 999, background: isOwe ? C.error : C.tertiary, transition: 'width 0.5s' }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'JetBrains Mono', color: isOwe ? C.error : C.tertiary }}>
                            {bal >= 0 ? '+' : ''}{fmt(bal)}
                          </span>
                          <div style={{ fontSize: '0.65rem', color: C.textMuted }}>{isOwe ? 'owes' : 'is owed'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </Card>

          {/* Simplified debts */}
          <Card>
            <SectionHead title="Simplified Payments" sub="Minimum transactions to settle all debts" />
            {debts.length === 0
              ? <div style={{ textAlign: 'center', padding: '1.5rem', color: C.textMuted, fontSize: '0.85rem' }}>🎉 All settled up!</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {debts.map((d, i) => {
                    const from = memberMap[d.fromId];
                    const to   = memberMap[d.toId];
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: C.surface, border: `1px solid ${C.cardBorder}` }}>
                        <Avatar member={from || { initials: '?', color: C.textMuted }} size={30} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: C.text }}>{from?.name ?? 'Unknown'}</span>
                          <span style={{ color: C.textMuted, margin: '0 6px', fontSize: '0.8rem' }}>pays</span>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: C.text }}>{to?.name ?? 'Unknown'}</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: C.primary, fontFamily: 'JetBrains Mono' }}>{fmt(d.amount)}</span>
                        <button onClick={() => { setSettlePrefill(d); setShowSettle(true); }} style={{
                          padding: '5px 12px', borderRadius: 10, background: C.tertiaryLight,
                          border: `1px solid ${C.tertiaryBorder}`, color: C.tertiary,
                          fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                        }}>Settle</button>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </Card>
        </div>
      )}

      {/* ── Tab: History ──────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <Card>
          <SectionHead title="Settlement History" sub={`${settlements.length} settlement${settlements.length !== 1 ? 's' : ''}`} />
          {settlements.length === 0
            ? <EmptyState icon="history" title="No settlements yet" sub="Use 'Settle Up' to record payments" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {settlements.map(s => {
                  const from = memberMap[s.fromId];
                  const to   = memberMap[s.toId];
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: C.surface, border: `1px solid ${C.cardBorder}` }}>
                      <Avatar member={from || { initials: '?', color: C.textMuted }} size={28} />
                      <div style={{ flex: 1, fontSize: '0.8rem', color: C.text }}>
                        <strong>{from?.name}</strong> paid <strong>{to?.name}</strong>
                        {s.note && <span style={{ color: C.textMuted }}> · {s.note}</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'JetBrains Mono', color: C.tertiary }}>{fmt(s.amount)}</span>
                        <div style={{ fontSize: '0.65rem', color: C.textMuted }}>{s.date}</div>
                      </div>
                      <IconBtn icon="delete" onClick={() => { if (window.confirm('Remove this settlement?')) deleteSettlement(s.id); }} title="Delete" color={C.error} bg={C.errorLight} />
                    </div>
                  );
                })}
              </div>
            )
          }
        </Card>
      )}

      {/* ── Tab: Members ──────────────────────────────────────────────────── */}
      {tab === 'members' && (
        <Card>
          <SectionHead
            title="Group Members"
            sub={`${members.length} members`}
            action={
              <button onClick={() => setShowAddMember(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 10, background: C.primary, color: C.primaryLight, border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person_add</span> Add
              </button>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(m => {
              const bal = balances[m.id] ?? 0;
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: C.surface, border: `1px solid ${C.cardBorder}` }}>
                  <Avatar member={m} size={36} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: C.text }}>
                      {m.name}{m.id === currentUserId ? <span style={{ color: C.textMuted, fontWeight: 400 }}> (you)</span> : ''}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: bal >= 0 ? C.tertiary : C.error }}>
                      {bal >= 0 ? '+' : ''}{fmt(bal)}
                    </span>
                    <div style={{ fontSize: '0.65rem', color: C.textMuted }}>{bal >= 0 ? 'is owed' : 'owes'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Groups list (root view) ──────────────────────────────────────────────────
function GroupsList({ onSelect }) {
  const { groups, getGroupMembers, getGroupExpenses, getBalances, getMyNetBalance, currentUserId } = useSplit();
  const [showCreate, setShowCreate] = useState(false);
  const { youOwe, youAreOwed, net } = getMyNetBalance();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}

      {/* Global balance strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'You Are Owed',  value: fmt(youAreOwed), color: C.tertiary,   bg: C.tertiaryLight,  border: C.tertiaryBorder, icon: 'arrow_downward' },
          { label: 'You Owe',       value: fmt(youOwe),     color: C.error,      bg: C.errorLight,     border: C.errorBorder,    icon: 'arrow_upward'   },
          { label: 'Net Balance',   value: (net >= 0 ? '+' : '') + fmt(net), color: net >= 0 ? C.tertiary : C.error, bg: net >= 0 ? C.tertiaryLight : C.errorLight, border: net >= 0 ? C.tertiaryBorder : C.errorBorder, icon: 'account_balance_wallet' },
          { label: 'Active Groups', value: groups.length,   color: C.primary,    bg: C.primaryLight,   border: C.warningBorder,  icon: 'group' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '1.25rem', padding: '14px 16px', display: 'flex', align: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: C.textMuted, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <SectionHead
          title="Your Groups"
          sub={`${groups.length} group${groups.length !== 1 ? 's' : ''}`}
          action={
            <button onClick={() => setShowCreate(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 12, background: C.primary, color: C.primaryLight,
              border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> New Group
            </button>
          }
        />

        {groups.length === 0 ? (
          <Card>
            <EmptyState icon="group_add" title="No groups yet" sub="Create a group to start splitting expenses with friends, family, or colleagues" />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {groups.map(g => {
              const members  = getGroupMembers(g.id);
              const expenses = getGroupExpenses(g.id);
              const balances = getBalances(g.id);
              const myBal    = balances[currentUserId] ?? 0;
              const total    = expenses.reduce((a, e) => a + e.amount, 0);

              return (
                <button key={g.id} onClick={() => onSelect(g.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '1.25rem',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 4px 24px rgba(100,60,20,0.08)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(100,60,20,0.13)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(100,60,20,0.08)'; }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                    {g.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.text }}>{g.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: -6 }}>
                        {members.slice(0, 4).map((m, i) => (
                          <div key={m.id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i, position: 'relative' }}>
                            <Avatar member={m} size={22} />
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: C.textMuted }}>{members.length} members</span>
                      <span style={{ fontSize: '0.7rem', color: C.textMuted }}>{expenses.length} expenses</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.78rem', color: C.textMuted }}>Total</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'JetBrains Mono', color: C.text }}>{fmt(total)}</div>
                    {myBal !== 0 && (
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: myBal >= 0 ? C.tertiary : C.error, marginTop: 2 }}>
                        {myBal >= 0 ? '+' : ''}{fmt(myBal)}
                      </div>
                    )}
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.textMuted }}>chevron_right</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div style={{ borderRadius: 12, padding: '12px 14px', background: C.primaryLight, border: `1px solid ${C.warningBorder}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.primary, marginTop: 1, flexShrink: 0 }}>info</span>
        <p style={{ margin: 0, fontSize: '0.72rem', color: C.textMid, lineHeight: 1.6 }}>
          You can also ask the <strong>FinAgent AI</strong>: <em>"I spent ₹2,000 on dinner with friends"</em> — it will ask whether to split it. Or try <em>"How much do I owe everyone?"</em>
        </p>
      </div>
    </div>
  );
}

// ─── Root view ────────────────────────────────────────────────────────────────
export default function SplitExpensesView() {
  const [activeGroup, setActiveGroup] = useState(null);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem 5rem' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24, borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: 16 }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, display: 'block' }}>
          Collaborative Finance
        </span>
        <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 700, color: C.text, fontFamily: "'Playfair Display', serif" }}>
          Split Expenses
        </h1>
      </div>

      {activeGroup
        ? <GroupDetail groupId={activeGroup} onBack={() => setActiveGroup(null)} />
        : <GroupsList onSelect={setActiveGroup} />
      }
    </div>
  );
}
