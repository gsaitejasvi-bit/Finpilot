import React, { useRef, useEffect, useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

const QUICK_PROMPTS = [
  { label: '💰 My balance',        query: 'What is my current balance and net worth?'                },
  { label: '📊 All budgets',       query: 'Show me all my budget categories'                         },
  { label: '🎯 Goal progress',     query: 'How are my savings goals going?'                          },
  { label: '✅ Afford ₹5k?',       query: 'Can I afford to spend ₹5,000 right now?'                 },
  { label: '📈 TCS stock',         query: 'How is TCS stock doing?'                                  },
  { label: '🚀 IPO tracker',       query: 'Show me all upcoming IPOs with verdicts'                  },
  { label: '⛽ Log fuel ₹500',     query: 'I spent ₹500 on fuel today'                              },
  { label: '☕ Log coffee ₹120',   query: 'Paid ₹120 for coffee at Blue Tokai'                      },
  { label: '💡 Save more tips',    query: 'Give me personalised tips to save more money'             },
  { label: '🛡 Emergency fund',    query: 'Is my emergency fund healthy?'                            },
  { label: '📅 My runway',         query: 'How long is my financial runway?'                         },
  { label: '📉 Top spending',      query: 'Where am I spending the most this month?'                 },
  { label: '👥 Split expenses',    query: 'How does Split Expenses work?'                            },
  { label: '💸 Who do I owe?',     query: 'How much do I owe everyone?'                              },
];

/* ─── Markdown-lite renderer ───────────────────────────────────────
   Handles **bold**, • bullet lines, numbered 1. lines, \n breaks   */
function RenderText({ text, color = '#2c1f0e' }) {
  const lines = text.split('\n');
  return (
    <div className="flex flex-col gap-0.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;

        const isBullet   = /^[•\-*]\s/.test(trimmed);
        const isNumbered = /^\d+\.\s/.test(trimmed);
        const content    = isBullet ? trimmed.slice(2) : isNumbered ? trimmed.replace(/^\d+\.\s/, '') : trimmed;

        const parts = content.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          /^\*\*[^*]+\*\*$/.test(p)
            ? <strong key={j} style={{ color: '#2c1f0e', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
            : p
        );

        if (isBullet || isNumbered) return (
          <div key={i} className="flex items-start gap-1.5 pl-1">
            <span style={{ color: '#7c4a1e', marginTop: 3, fontSize: '0.55rem', flexShrink: 0 }}>
              {isNumbered ? trimmed.match(/^\d+/)?.[0] + '.' : '◆'}
            </span>
            <span style={{ color }}>{parts}</span>
          </div>
        );

        return <div key={i} style={{ color }}>{parts}</div>;
      })}
    </div>
  );
}

/* ─── Confidence bar ──────────────────────────────────────────────── */
function ConfBar({ pct }) {
  const c = pct >= 70 ? '#5a6e3a' : pct >= 50 ? '#9e6c2a' : '#9b2c2c';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 rounded-full" style={{ background: '#ede0d0' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ color: c, fontSize: '0.6rem', fontFamily: 'JetBrains Mono', flexShrink: 0 }}>{pct}%</span>
    </div>
  );
}

/* ─── Verdict mini-card ─────────────────────────────────────────── */
function VerdictCard({ data }) {
  if (!data) return null;
  const isOk  = data.verdict.includes('APPROVED') || data.verdict.includes('OPTIMIZED') || data.verdict.includes('BUY');
  const isNo  = data.verdict.includes('REJECTED') || data.verdict.includes('SKIP') || data.verdict.includes('INSUFFICIENT');
  const chip  = isOk
    ? { bg: '#deedc8', text: '#1a2900', border: '#c4db9e', dot: '#5a6e3a' }
    : isNo
    ? { bg: '#f5d5d5', text: '#5c0e0e', border: '#f0b8b8', dot: '#9b2c2c' }
    : { bg: '#faecd3', text: '#3d2800', border: '#f0d5a8', dot: '#9e6c2a' };

  const confNum = parseInt((data.comfortScore || '0').replace('%', ''), 10);

  return (
    <div className="mt-1.5 rounded-xl overflow-hidden" style={{ border: '1px solid #d9c9b0' }}>
      {/* Badge row */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: chip.bg, borderBottom: '1px solid #d9c9b0' }}>
        <div className="w-2 h-2 rounded-full" style={{ background: chip.dot }} />
        <span className="font-semibold" style={{ color: chip.text, fontSize: '0.68rem' }}>{data.verdict}</span>
        <span className="ml-auto font-label-sm" style={{ color: chip.dot, fontSize: '0.62rem' }}>
          Confidence: {data.comfortScore}
        </span>
      </div>
      {/* Confidence bar */}
      <div className="px-3 pt-1.5 pb-0.5" style={{ background: '#f7f0e6' }}>
        <ConfBar pct={confNum} />
      </div>
      {/* Metrics */}
      <div className="grid grid-cols-3 divide-x" style={{ background: '#f7f0e6', borderTop: '1px solid #ede0d0', borderColor: '#d9c9b0' }}>
        {[
          { label:'Before', value: data.liquidBefore },
          { label:'Calc',   value: data.calculation  },
          { label:'After',  value: data.liquidAfter  },
        ].map(m => (
          <div key={m.label} className="px-2.5 py-2 flex flex-col gap-0.5" style={{ borderColor: '#d9c9b0' }}>
            <span style={{ color: '#a0846a', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
            <span style={{ color: '#2c1f0e', fontFamily: 'JetBrains Mono', fontSize: '0.68rem', fontWeight: 600, wordBreak: 'break-all' }}>{m.value}</span>
          </div>
        ))}
      </div>
      {/* Steps */}
      <div className="flex flex-col divide-y" style={{ borderColor: '#ede0d0' }}>
        {data.steps.map((s, i) => {
          const err  = s.icon === 'error' || s.icon === 'block';
          const done = s.icon === 'verified' || s.icon === 'check_circle';
          return (
            <div key={i} className="flex items-start gap-2 px-3 py-2"
              style={{ background: i % 2 === 0 ? '#fffdf9' : '#fdf8f2', borderColor: '#ede0d0' }}>
              <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: err ? '#f5d5d5' : done ? '#deedc8' : '#f3dcc0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 11, color: err ? '#9b2c2c' : done ? '#3d5420' : '#7c4a1e' }}>
                  {s.icon}
                </span>
              </div>
              <div className="min-w-0">
                <span className="font-semibold block" style={{ color: err ? '#9b2c2c' : '#2c1f0e', fontSize: '0.65rem' }}>{s.title}</span>
                <span style={{ color: '#6b4f35', fontSize: '0.62rem', lineHeight: 1.4 }}>{s.detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Single chat bubble ────────────────────────────────────────── */
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  const { setActiveTab } = useFinancial();

  const isSplitPrompt = msg.type === 'split_prompt';

  const bubbleBg = isUser ? '#7c4a1e'
    : msg.type === 'expense_logged' ? '#deedc8'
    : isSplitPrompt               ? '#f3dcc0'
    : msg.type === 'market'         ? '#fdf8f2'
    : '#fffdf9';
  const bubbleColor  = isUser ? '#f3dcc0'
    : msg.type === 'expense_logged' ? '#1a2900'
    : '#2c1f0e';
  const bubbleBorder = isUser ? 'none'
    : msg.type === 'expense_logged' ? '1px solid #c4db9e'
    : isSplitPrompt               ? '1px solid #e8c99a'
    : '1px solid #d9c9b0';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mb-0.5"
          style={{ background: 'linear-gradient(135deg,#2c1f0e,#4a3318)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#f3dcc0' }}>smart_toy</span>
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[86%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="px-3.5 py-2.5 rounded-2xl"
          style={{
            background: bubbleBg,
            color:      bubbleColor,
            border:     bubbleBorder,
            borderBottomRightRadius: isUser ? 4 : undefined,
            borderBottomLeftRadius:  !isUser ? 4 : undefined,
            fontSize:   '0.8rem',
            lineHeight: 1.5,
            boxShadow:  isUser ? '0 2px 8px rgba(124,74,30,0.22)' : '0 2px 6px rgba(100,60,20,0.06)',
          }}>
          {isUser
            ? <span style={{ color: bubbleColor }}>{msg.text}</span>
            : <RenderText text={msg.text} color={bubbleColor} />
          }
        </div>

        {/* Split prompt CTA */}
        {isSplitPrompt && msg.action?.type === 'navigate' && (
          <button
            onClick={() => setActiveTab(msg.action.tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 10,
              background: '#7c4a1e', color: '#f3dcc0',
              border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.75rem',
              boxShadow: '0 2px 8px rgba(124,74,30,0.22)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>group</span>
            Open Split Expenses →
          </button>
        )}

        {/* Navigate CTA for regular text messages that have an action */}
        {!isSplitPrompt && !isUser && msg.action?.type === 'navigate' && (
          <button
            onClick={() => setActiveTab(msg.action.tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 9,
              background: '#f3dcc0', color: '#7c4a1e',
              border: '1px solid #e8c99a', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.7rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
            Go to {msg.action.tab === 'split' ? 'Split Expenses' : msg.action.tab}
          </button>
        )}

        {!isUser && msg.type === 'verdict' && msg.data && <VerdictCard data={msg.data} />}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mb-0.5"
          style={{ background: '#f3dcc0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#7c4a1e' }}>person</span>
        </div>
      )}
    </div>
  );
}

/* ─── Typing indicator ──────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#2c1f0e,#4a3318)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#f3dcc0' }}>smart_toy</span>
      </div>
      <div className="px-4 py-3 rounded-2xl" style={{ background: '#fffdf9', border: '1px solid #d9c9b0', borderBottomLeftRadius: 4 }}>
        <div className="flex items-center gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#a0846a', animation: `bob 1.2s ${i*0.2}s infinite ease-in-out` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */
export default function ReasoningCore() {
  const {
    reasoningQuery, setReasoningQuery,
    isSynthesizing, pipelineState,
    chatMessages, setChatMessages,
    executeReasoningQuery,
  } = useFinancial();

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const [localInput, setLocalInput] = useState('');

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSynthesizing]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSend() {
    const q = localInput.trim();
    if (!q) return;
    setLocalInput('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
    executeReasoningQuery(q);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickPrompt(query) {
    setLocalInput('');
    executeReasoningQuery(query);
  }

  function clearChat() {
    setChatMessages([{
      id:   'welcome_' + Date.now(),
      role: 'bot',
      type: 'text',
      text: "Chat cleared! I'm FinPilot AI.\n\nAsk me anything — type your own question below or pick a quick chip. Examples:\n• \"I spent ₹800 on groceries\" — logs instantly\n• \"Can I afford a ₹25,000 camera?\" — BUY/WAIT/SKIP\n• \"How is Reliance stock?\"\n• \"When will I fund my Goa trip?\"",
    }]);
  }

  return (
    <div className="widget flex flex-col animate-float-up" style={{ height: 600, maxHeight: '78vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid #d9c9b0' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#2c1f0e,#4a3318)' }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#f3dcc0' }}>smart_toy</span>
          </div>
          <div>
            <span className="font-semibold block" style={{ color: '#2c1f0e', fontFamily: "'Playfair Display',serif", fontSize: '0.95rem' }}>
              FinPilot AI
            </span>
            <span style={{ color: isSynthesizing ? '#5a6e3a' : '#a0846a', fontSize: '0.6rem' }}>
              {isSynthesizing ? '● Thinking…' : `● ${pipelineState}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: isSynthesizing ? 'rgba(90,110,58,0.1)' : '#f7f0e6', border: '1px solid #d9c9b0' }}>
            <div className={`w-1.5 h-1.5 rounded-full ${isSynthesizing ? 'animate-pulse' : ''}`}
              style={{ background: isSynthesizing ? '#5a6e3a' : '#a0846a' }} />
            <span style={{ color: isSynthesizing ? '#5a6e3a' : '#a0846a', fontSize: '0.6rem' }}>
              {isSynthesizing ? 'Thinking' : 'Ready'}
            </span>
          </div>
          <button onClick={clearChat} title="Clear chat"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: '#a0846a', background: '#f7f0e6', border: '1px solid #d9c9b0' }}
            onMouseEnter={e => e.currentTarget.style.background = '#ede0d0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f7f0e6'}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete_sweep</span>
          </button>
        </div>
      </div>

      {/* Quick chips */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto shrink-0"
        style={{ borderBottom: '1px solid #ede0d0' }}>
        {QUICK_PROMPTS.map(p => (
          <button key={p.label}
            onClick={() => handleQuickPrompt(p.query)}
            className="px-2.5 py-1 rounded-full whitespace-nowrap font-label-sm shrink-0 transition-all"
            style={{ background: '#f7f0e6', color: '#6b4f35', border: '1px solid #d9c9b0', fontSize: '0.66rem' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3dcc0'; e.currentTarget.style.borderColor = '#7c4a1e'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f7f0e6'; e.currentTarget.style.borderColor = '#d9c9b0'; }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        style={{ background: '#fdf8f2' }}>
        {chatMessages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
        {isSynthesizing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar — ALWAYS editable, never disabled */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid #d9c9b0', background: '#fffdf9' }}>
        {/* hint when bot is typing */}
        {isSynthesizing && (
          <p className="text-center mb-1.5 font-label-sm" style={{ color: '#9e6c2a', fontSize: '0.62rem' }}>
            FinPilot is responding — your message will send when it's done ✦
          </p>
        )}
        <div className="flex items-end gap-2">
          {/* Text wrapper */}
          <div
            className="flex-1 flex items-start gap-2 px-3 pt-2.5 pb-2 rounded-2xl transition-all"
            style={{ background: '#f7f0e6', border: '1px solid #d9c9b0', minHeight: 46 }}
            onClick={() => inputRef.current?.focus()}
          >
            <span className="material-symbols-outlined mt-0.5 shrink-0" style={{ fontSize: 16, color: '#a0846a' }}>
              edit
            </span>
            <textarea
              ref={inputRef}
              rows={1}
              value={localInput}
              onChange={e => {
                setLocalInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              onKeyDown={handleKey}
              onFocus={e  => e.currentTarget.parentElement.style.borderColor = '#7c4a1e'}
              onBlur={e   => e.currentTarget.parentElement.style.borderColor = '#d9c9b0'}
              placeholder="Type your own question or concern here… (Enter to send)"
              className="flex-1 bg-transparent font-body-sm outline-none resize-none placeholder:opacity-40"
              style={{ color: '#2c1f0e', fontSize: '0.82rem', lineHeight: 1.55, maxHeight: 100 }}
            />
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!localInput.trim() || isSynthesizing}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all disabled:opacity-35"
            style={{ background: '#7c4a1e', color: '#f3dcc0', boxShadow: '0 3px 12px rgba(124,74,30,0.28)' }}
            onMouseEnter={e => { if (!isSynthesizing && localInput.trim()) e.currentTarget.style.background = '#a0632e'; }}
            onMouseLeave={e => e.currentTarget.style.background = '#7c4a1e'}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {isSynthesizing ? 'hourglass_top' : 'send'}
            </span>
          </button>
        </div>
        <p className="mt-1.5 text-center" style={{ color: '#c9b49a', fontSize: '0.56rem' }}>
          Enter to send · Shift+Enter for new line · You can type freely at any time
        </p>
      </div>
    </div>
  );
}
