import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { sendAIQuestion, AIAnalyzeResponse, BackendMarketData, getBackendSymbol } from '../lib/api/marketApi';

interface AIAnalystProps {
  activeAsset: string;
  activeAssetName: string;
  marketData?: BackendMarketData | null;
  timeframe?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isDemo?: boolean;
  model?: string;
}

const SUGGESTED_QUESTIONS = [
  'Why did Bitcoin outperform Gold?',
  'Which asset had the highest volatility?',
  'Compare Gold, Bitcoin and NVIDIA.',
  'Explain the current market performance.',
  'Explain the current drawdown.',
  'What happened during the selected period?',
  'Explain the selected asset.',
];

export const AIAnalyst: React.FC<AIAnalystProps> = ({
  activeAsset,
  activeAssetName,
  marketData,
  timeframe = '1Y',
}) => {
  const backendSymbol = getBackendSymbol(activeAsset);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'initial',
      sender: 'assistant',
      content: `**QUANTORA AI Analyst initialized.**\n\nI am connected to the Python quantitative analytics engine. Focus asset is **${activeAssetName}** (\`${backendSymbol}\`).\n\nAsk any question about risk-adjusted returns, historical drawdown, volatility dispersion, or cross-asset correlation.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDemo: true,
      model: 'quantora-engine-v2',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInputQuery('');
    setLoading(true);

    try {
      const response: AIAnalyzeResponse = await sendAIQuestion(
        q,
        backendSymbol,
        timeframe,
        marketData ? { latest_price: marketData.latest_price, vol: marketData.annualized_volatility } : undefined
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDemo: response.is_demo,
        model: response.model,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content:
          '**AI Analyst temporarily unavailable.**\n\nUnable to reach backend service. Please verify that the FastAPI server is running on `http://127.0.0.1:8000`. Quantitative calculations on charts remain fully functional.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDemo: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#080d1a] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="px-4 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-wide">QUANTORA AI ANALYST</span>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ready
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
              <span>Focus:</span>
              <span className="text-cyan-400 font-semibold">{activeAssetName}</span>
              <span className="text-slate-600">•</span>
              <span>{backendSymbol}</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
            Featherless Cloud AI
          </span>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="p-2.5 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 shrink-0 px-1">
          <HelpCircle className="w-3 h-3 text-cyan-400" /> Suggestions:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="shrink-0 text-xs text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 px-2.5 py-1 rounded-full transition-all duration-150 shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[320px] max-h-[500px]">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-800/80 text-[10px] text-slate-400">
                    <span className="font-mono text-cyan-400 font-semibold flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      {msg.model || 'QUANTORA Research Agent'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-white transition-colors"
                      title="Copy Answer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}

                {/* Content with basic formatting */}
                <div className="space-y-2 whitespace-pre-wrap">
                  {msg.content.split('\n\n').map((para, i) => (
                    <p key={i}>
                      {para.split('**').map((part, pIdx) =>
                        pIdx % 2 === 1 ? (
                          <strong key={pIdx} className="text-white font-semibold">
                            {part}
                          </strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  ))}
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-500 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 w-fit animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Consulting Python quantitative calculations & Featherless AI...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            disabled={loading}
            placeholder="Ask QUANTORA anything about the selected market..."
            className="flex-1 bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-500/20 shrink-0 font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
          <span>Python calculations are the source of truth</span>
          <span>Featherless AI Engine</span>
        </div>
      </div>
    </div>
  );
};
