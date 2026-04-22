import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bot, Send, User, Sparkles, RefreshCw } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const QUICK_COMMANDS = [
  'List patients',
  'My tasks',
  'Analytics',
  'Insurance claims',
  'Help',
];

const formatResponse = (text) => {
  // Convert **bold** markdown to JSX spans
  const parts = text.split(/(\*\*[^*]+\*\*|•)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-zinc-100">{part.slice(2, -2)}</strong>;
    }
    if (part === '•') return <span key={i} className="text-blue-400 mr-1">•</span>;
    return <span key={i}>{part}</span>;
  });
};

const ChatbotView = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm DischargeFlow AI, your clinical assistant. I can help you list patients, check your tasks, view analytics, and query insurance claims. Type a message or use a quick command below!",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMessage = text || input.trim();
    if (!userMessage) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/chatbot/message`, { message: userMessage }, { withCredentials: true });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        data: res.data.data,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting to the backend. Please check your connection and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
            🤖 AI Assistant
          </h2>
          <p className="text-zinc-400 text-sm">Clinical command interface — all actions are HIPAA-audited</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-emerald-400 text-xs font-medium">Online</span>
        </div>
      </div>

      {/* Quick command chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_COMMANDS.map(cmd => (
          <button
            key={cmd}
            onClick={() => sendMessage(cmd)}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-700 hover:text-zinc-100 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            {cmd}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-blue-600 to-violet-600'
                : 'bg-zinc-700'
            }`}>
              {msg.role === 'assistant'
                ? <Bot className="w-4 h-4 text-white" />
                : <User className="w-4 h-4 text-zinc-300" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-tl-sm'
              }`}>
                {msg.role === 'assistant' ? formatResponse(msg.content) : msg.content}
              </div>

              {/* Data preview */}
              {msg.data?.patients && msg.data.patients.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs space-y-1 w-full">
                  <p className="text-zinc-500 mb-2">Showing first {msg.data.patients.length} patients:</p>
                  {msg.data.patients.map(p => (
                    <div key={p.patient_id} className="flex justify-between items-center text-zinc-300">
                      <span>{p.name}</span>
                      <span className="text-zinc-500">{p.room_number} — {p.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {msg.data?.tasks && msg.data.tasks.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs space-y-1 w-full">
                  <p className="text-zinc-500 mb-2">Your tasks:</p>
                  {msg.data.tasks.map(t => (
                    <div key={t.task_id} className="flex justify-between items-center text-zinc-300">
                      <span>{t.title}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{t.status}</span>
                    </div>
                  ))}
                </div>
              )}

              <span className="text-zinc-600 text-xs">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3 items-end">
        <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl focus-within:border-blue-500 transition-colors">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything — 'List patients', 'My tasks', 'Help'…"
            rows={1}
            className="w-full bg-transparent px-4 py-3 text-zinc-100 text-sm focus:outline-none resize-none placeholder-zinc-500"
          />
        </div>
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <p className="text-zinc-600 text-xs mt-2 text-center">All interactions are logged per HIPAA audit requirements</p>
    </div>
  );
};

export default ChatbotView;
