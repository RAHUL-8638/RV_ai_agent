import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Send,
  Languages,
  BookOpen,
  CheckSquare,
  HelpCircle,
  Copy,
  Check,
  ShieldAlert,
  Loader2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { safeFetch } from '../utils/api';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AgentPage: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'te'>('en');
  const [mode, setMode] = useState<'chat' | 'notes' | 'quiz' | 'lab'>('chat');
  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Hello, security researcher. I am **RVCYBER AGENT**, your cybersecurity intelligence and technical mentor.

I can assist you with:
- **Foundational Concepts**: Networking protocols, Linux, HTTP/S, and TCP/IP handshakes.
- **Web Defense & OWASP**: SQL Injection, XSS, CSRF, IDOR, SSRF, and secure coding patterns.
- **Tool Workflows**: Kali Linux, Burp Suite, Wireshark, nmap, and Metasploit in authorized labs.
- **SOC & Incident Response**: Telemetry triage, PowerShell logs, and digital forensics.
- **Bilingual Mastery**: Switch between **English** and **Telugu (తెలుగు)** anytime.

Select a mode above or enter your question below to begin.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    { label: 'SQLi Defense Guide', prompt: 'Explain SQL Injection vulnerabilities and provide concrete defense code with parameterized queries in Node.js and Python.' },
    { label: 'Burp Suite Setup', prompt: 'Provide a step-by-step authorized lab walkthrough for configuring Burp Suite proxy with Firefox to inspect HTTPS traffic.' },
    { label: 'Linux auth.log Analysis', prompt: 'How do SOC analysts inspect /var/log/auth.log for brute-force SSH attempts and suspicious sudo privilege escalations?' },
    { label: 'OWASP Top 10 API Security', prompt: 'Break down the top 3 modern API vulnerabilities according to OWASP and explain how developers prevent Broken Object Level Authorization (BOLA).' },
    { label: 'తెలుగులో సైబర్ సెక్యూరిటీ వివరణ', prompt: 'తెలుగులో సైబర్ సెక్యూరిటీ ప్రాథమిక అంశాలు మరియు ఫిషింగ్ దాడుల నుండి రక్షణ పొందే పద్ధతులను వివరించండి.' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const result = await safeFetch('/api/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          language,
          mode,
          history: historyPayload,
        }),
      });

      if (!result.ok || !result.data) {
        throw new Error(result.error || 'Agent server error');
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: result.data.text,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `[AGENT_COMMUNICATION_ERROR]: ${err.message || 'Unable to contact AI security agent. Please verify server connection.'}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header and Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400">
              <Terminal className="h-4 w-4" />
            </div>
            <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
              AI CYBERSECURITY AGENT
            </h1>
          </div>
          <p className="text-xs text-zinc-400 font-sans">
            Bilingual security intelligence mentor. Defensive methodologies, OWASP analysis, and lab execution.
          </p>
        </div>

        {/* Toolbar: Language & Mode Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Toggle */}
          <div className="flex items-center rounded border border-zinc-800 bg-zinc-950 p-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                language === 'en'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('te')}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                language === 'te'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              తెలుగు (Telugu)
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center rounded border border-zinc-800 bg-zinc-950 p-1">
            <button
              onClick={() => setMode('chat')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                mode === 'chat' ? 'bg-zinc-800 text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Standard conversational Q&A"
            >
              Chat
            </button>
            <button
              onClick={() => setMode('notes')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                mode === 'notes' ? 'bg-zinc-800 text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Generate Structured Study Guide"
            >
              Study Notes
            </button>
            <button
              onClick={() => setMode('quiz')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                mode === 'quiz' ? 'bg-zinc-800 text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Generate Scenario Practice Quiz"
            >
              Quiz Me
            </button>
            <button
              onClick={() => setMode('lab')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                mode === 'lab' ? 'bg-zinc-800 text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Generate Safe Hands-on Lab Checklist"
            >
              Lab Guide
            </button>
          </div>

          <button
            onClick={() => setMessages(messages.slice(0, 1))}
            title="Clear Chat History"
            className="rounded border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 hover:text-red-400 hover:border-red-900 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Strip */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <span className="text-xs font-mono text-zinc-500 whitespace-nowrap">Suggested:</span>
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(item.prompt)}
            className="whitespace-nowrap rounded border border-zinc-800 bg-zinc-950/80 px-3 py-1 text-xs font-mono text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300 hover:bg-emerald-950/20 transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Terminal Window */}
      <div className="rounded-lg border border-emerald-950/90 bg-zinc-950 shadow-[0_0_25px_rgba(0,255,102,0.05)] overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-black/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-xs text-zinc-400">
              agent://session/rvcyber-v1 · mode: {mode.toUpperCase()} · lang: {language.toUpperCase()}
            </span>
          </div>
          <div className="text-xs font-mono text-emerald-400">
            ENCRYPTED TELEMETRY
          </div>
        </div>

        {/* Messages Stream */}
        <div className="h-[520px] overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-zinc-500">
                <span className={msg.role === 'user' ? 'text-zinc-300' : 'text-emerald-400'}>
                  {msg.role === 'user' ? '[RESEARCHER]' : '[RVCYBER_AGENT]'}
                </span>
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`group relative max-w-3xl rounded-lg p-4 font-sans text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'border border-emerald-500/30 bg-emerald-950/20 text-emerald-100 font-mono text-xs'
                    : 'border border-zinc-800 bg-black/80 text-zinc-200'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                {msg.role === 'model' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="absolute top-3 right-3 rounded border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-emerald-400 transition-opacity"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs font-mono text-emerald-400 p-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Analyzing cyber telemetry & synthesizing response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-zinc-800/80 bg-black/80 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={
                  language === 'te'
                    ? 'సైబర్ సెక్యూరిటీ ప్రశ్నను ఇక్కడ అడగండి (ఉదా: SQL Injection నివారణ ఎలా?)...'
                    : 'Ask about OWASP, Kali Linux, SQLi, forensics, or request study notes...'
                }
                className="w-full rounded border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="flex items-center gap-1.5 rounded border border-emerald-500 bg-emerald-600 px-4 py-2.5 font-mono text-xs font-bold text-black shadow-[0_0_12px_rgba(0,255,102,0.25)] hover:bg-emerald-400 disabled:opacity-50 transition-all"
            >
              <span>Transmit</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
