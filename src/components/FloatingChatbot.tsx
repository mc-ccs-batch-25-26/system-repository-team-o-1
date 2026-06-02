import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
  FaPaperPlane, FaTimes, FaMoon, FaSun,
  FaTrash, FaCopy, FaHistory, FaPlus, FaChevronLeft,
} from 'react-icons/fa';
import { getProgressStats } from '../firebase/progressService';
import { getCategoryPerformanceData, categorizePerformance } from '../firebase/analyticsService';
import { getUserData } from '../firebase/userService';
import { supabase } from '../supabase/supabaseClient';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getTier, getXpToNextTier, getXpToNextLevel } from '../utils/rankService';

/* ─── Types (unchanged) ───────────────────────────────────────── */
interface FloatingChatbotProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}
interface Message {
  content: string;
  sender: 'user' | 'ai';
  isTyping?: boolean;
  id?: string;
  timestamp?: number;
}
interface ChatSession {
  id: string;
  label: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

/* ─── Constants (unchanged) ───────────────────────────────────── */
const CHAT_HISTORY_KEY = 'civiquest-chat-history';
const MAX_SESSIONS = 10;
const DEFAULT_MESSAGE: Message = {
  content: 'Hello! Ask anything about the Civil Service Examination!',
  sender: 'ai',
  id: 'welcome',
  timestamp: Date.now(),
};

const loadSessions = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};
const saveSessions = (sessions: ChatSession[]) => {
  try { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions)); }
  catch (e) { console.error('Failed to save chat history:', e); }
};
const formatSessionLabel = (timestamp: number) =>
  new Date(timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
const formatMessageTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

/* ─── Shared markdown component map ──────────────────────────── */
const markdownComponents = (darkMode: boolean) => ({
  p: ({ children }: any) => <p style={{ margin: '0 0 4px', lineHeight: 1.55 }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px' }}>{children}</h2>,
  ul: ({ children }: any) => <ul style={{ paddingLeft: 16, margin: '0 0 4px' }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ paddingLeft: 16, margin: '0 0 4px' }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ marginBottom: 2 }}>{children}</li>,
  a: ({ href, children }: any) => <a href={href} style={{ color: '#60a5fa', textDecoration: 'underline' }}>{children}</a>,
  strong: ({ children }: any) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  code: ({ children }: any) => (
    <code style={{
      padding: '1px 5px', borderRadius: 4, fontSize: 11,
      background: darkMode ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.07)',
      color: darkMode ? '#e2e8f0' : '#374151',
    }}>{children}</code>
  ),
});

/* ─── Typing effect (unchanged logic, restyled) ───────────────── */
const TypingEffect: React.FC<{ text: string; darkMode: boolean; onComplete: () => void }> = ({ text, darkMode, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, 8);
      return () => clearTimeout(timer);
    } else { onComplete(); }
  }, [currentIndex, text, onComplete]);

  return (
    <div style={{ fontSize: 13, lineHeight: 1.55 }}>
      <ReactMarkdown components={markdownComponents(darkMode)}>{displayedText}</ReactMarkdown>
      <span style={{
        display: 'inline-block', width: 6, height: 13, marginLeft: 2,
        borderRadius: 1,
        background: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
        animation: 'cq-blink 1s steps(1) infinite',
      }} />
    </div>
  );
};

/* ─── Theme tokens ─────────────────────────────────────────────── */
const getTheme = (dark: boolean) => ({
  panelBg:      dark ? '#0c0e14'                    : '#ffffff',
  headerBg:     dark ? '#13161f'                    : '#0f172a',
  headerBorder: dark ? 'rgba(255,255,255,0.07)'     : 'rgba(255,255,255,0.08)',
  msgBg:        dark ? '#13161f'                    : '#f7f8fc',
  msgBorder:    dark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.06)',
  aiBubbleBg:   dark ? '#1e2230'                    : '#f0f2f9',
  aiBubbleText: dark ? '#e2e8f0'                    : '#1e293b',
  userBubbleBg: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  userBubbleText: '#ffffff',
  inputBg:      dark ? '#1e2230'                    : '#f7f8fc',
  inputBorder:  dark ? 'rgba(255,255,255,0.08)'     : 'rgba(0,0,0,0.08)',
  inputText:    dark ? '#f0f1f5'                    : '#111318',
  inputPlaceholder: dark ? '#4b5563'                : '#9ca3af',
  panelBorder:  dark ? 'rgba(255,255,255,0.08)'     : 'rgba(0,0,0,0.08)',
  textPri:      dark ? '#f0f1f5'                    : '#111318',
  textSec:      dark ? '#6b7280'                    : '#6b7280',
  textTer:      dark ? '#374151'                    : '#d1d5db',
  divider:      dark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.06)',
  hoverBg:      dark ? 'rgba(255,255,255,0.04)'     : 'rgba(0,0,0,0.03)',
  deleteBtnHov: dark ? 'rgba(239,68,68,0.15)'       : 'rgba(239,68,68,0.10)',
  timeText:     dark ? 'rgba(255,255,255,0.25)'     : 'rgba(0,0,0,0.25)',
  shadow:       dark
    ? '0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)'
    : '0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
});

/* ─── Main Component ───────────────────────────────────────────── */
const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ ...DEFAULT_MESSAGE, id: 'welcome' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [userProgressData, setUserProgressData] = useState<any[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>('current');
  const [showHistory, setShowHistory] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [fabHovered, setFabHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const t = getTheme(darkMode);

  /* ── All logic hooks (unchanged) ── */
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

 useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Ignore clicks on the FAB button itself
      if (target.closest('[aria-label="Open AI Chat"]')) return;
      if (chatRef.current && !chatRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleAIReview = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      if (customEvent.detail?.message) {
        setIsOpen(true);
        setTimeout(() => {
          if (inputRef.current) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            nativeInputValueSetter?.call(inputRef.current, customEvent.detail.message);
            inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
            setInput(customEvent.detail.message);
            setTimeout(() => sendMessageWithText(customEvent.detail.message), 300);
          }
        }, 400);
      }
    };
    window.addEventListener('civiquest-ai-review', handleAIReview);
    return () => window.removeEventListener('civiquest-ai-review', handleAIReview);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches); }, []);
  useEffect(() => { if (isOpen) fetchUserData(); }, [isOpen]);

  useEffect(() => {
    if (messages.length > 1) {
      const now = Date.now();
      const sessions = loadSessions();
      const existingIdx = sessions.findIndex(s => s.id === activeSessionId);
      const session: ChatSession = {
        id: activeSessionId,
        label: formatSessionLabel(now),
        messages,
        createdAt: existingIdx >= 0 ? sessions[existingIdx].createdAt : now,
        updatedAt: now,
      };
      if (existingIdx >= 0) sessions[existingIdx] = session;
      else sessions.unshift(session);
      if (sessions.length > MAX_SESSIONS) sessions.length = MAX_SESSIONS;
      saveSessions(sessions);
      setSessions(sessions);
    }
  }, [messages, activeSessionId]);

  /* ── All handlers (unchanged logic) ── */
  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const userData = await getUserData(user.id);
      const progressStats = await getProgressStats();
      const categoryData = await getCategoryPerformanceData();
      setUserStats({ userData, progressStats });
      setUserProgressData(categoryData);
    } catch (error) { console.error('Error fetching user data:', error); }
  };

  const startNewChat = () => {
    const sessions = loadSessions();
    const now = Date.now();
    const newId = now.toString();
    const newSession: ChatSession = {
      id: newId, label: formatSessionLabel(now),
      messages: [{ ...DEFAULT_MESSAGE, id: 'welcome-' + now, timestamp: now }],
      createdAt: now, updatedAt: now,
    };
    sessions.unshift(newSession);
    if (sessions.length > MAX_SESSIONS) sessions.length = MAX_SESSIONS;
    saveSessions(sessions);
    setSessions(sessions);
    setActiveSessionId(newId);
    setMessages(newSession.messages);
    setShowHistory(false);
  };

  const loadSession = (sessionId: string) => {
    const sessions = loadSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) { setActiveSessionId(sessionId); setMessages(session.messages); setShowHistory(false); }
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const sessions = loadSessions().filter(s => s.id !== sessionId);
    saveSessions(sessions);
    setSessions(sessions);
    if (activeSessionId === sessionId) {
      const now = Date.now();
      const newId = now.toString();
      const newSession: ChatSession = {
        id: newId, label: formatSessionLabel(now),
        messages: [{ ...DEFAULT_MESSAGE, id: 'welcome-' + now, timestamp: now }],
        createdAt: now, updatedAt: now,
      };
      sessions.unshift(newSession);
      saveSessions(sessions);
      setSessions(sessions);
      setActiveSessionId(newId);
      setMessages(newSession.messages);
    }
  };

  const analyzeUserProgress = () => {
    if (!userStats || !userProgressData || userProgressData.length === 0) {
      return "I don't have enough data about your progress yet. Please complete some quizzes first so I can analyze your performance.";
    }
    
    const { progressStats } = userStats;
    const accuracy = progressStats?.accuracy || 0;
    const quizzesTaken = progressStats?.quizzesTaken || 0;
    const readiness = progressStats?.readiness || 0;
    
    const sortedCategories = [...userProgressData]
      .filter((c: any) => (c.regularAnswered || 0) > 0)
      .sort((a: any, b: any) => (a.regularAccuracy || 0) - (b.regularAccuracy || 0));
    
    const weakestCategories = sortedCategories.slice(0, 2);
    
    let analysis = `**Your Progress**\n`;
    analysis += `- Accuracy: ${accuracy}%\n`;
    analysis += `- Quizzes taken: ${quizzesTaken}\n`;
    analysis += `- Readiness: ${readiness}%\n\n`;
    
    if (weakestCategories.length > 0) {
      analysis += `**Weak Areas**:\n`;
      weakestCategories.forEach((cat: any) => {
        analysis += `- ${cat.categoryName}: ${cat.regularAccuracy}% (${cat.regularCorrect}/${cat.regularAnswered} correct)\n`;
      });
      analysis += `\n**Tip**: Focus on **${weakestCategories[0]?.categoryName || 'your weakest area'}** to improve your score. Practice with targeted quizzes in that subject.`;
    } else {
      analysis += `**Tip**: Take more quizzes so I can identify your weak areas and give personalized recommendations.`;
    }
    
    return analysis;
  };

  const completeTyping = (index: number) =>
    setMessages(prev => prev.map((msg, i) => i === index ? { ...msg, isTyping: false } : msg));

  const deleteMessage = (id: string) => {
    if (!id) return;
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 1500);
    }).catch(err => console.error('Failed to copy:', err));
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = { content: text, sender: 'user', id: Date.now().toString(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      await fetchUserData();

      // Deterministic Service Fallbacks (Data Safe Handling)
      const xp = userStats?.userData?.xp || 0;
      const level = userStats?.userData?.level || 1;
      const streak = userStats?.userData?.streakCount || 0;
      const quizzesTaken = userStats?.progressStats?.quizzesTaken || 0;
      const readiness = userStats?.progressStats?.readiness || 0;

      // Deterministic Calculations (Removed from Prompt Layer)
      const xpToNextLevel = getXpToNextLevel(level, xp);
      const userTier = getTier(xp).name;
      const xpToNextTier = getXpToNextTier(xp);
      const rankStatusStr = xpToNextTier > 0
        ? `XP needed to rank up to next tier: ${xpToNextTier}` 
        : `Maximum Rank Achieved!`;

      // Deterministic Categorization (Removed Boolean Math from LLM)
      const { weakAreas, averageAreas, strongAreas, hasData } = categorizePerformance(userProgressData || []);

      const categoryContext = hasData
        ? `Explicit Subject Categorization:
- WEAK AREAS: ${weakAreas.length > 0 ? weakAreas.join(', ') : 'None! Great job!'}
- STRONG AREAS: ${strongAreas.length > 0 ? strongAreas.join(', ') : 'None yet.'}
- AVERAGE AREAS: ${averageAreas.length > 0 ? averageAreas.join(', ') : 'None.'}`
        : "No subject data available. User hasn't completed quizzes yet.";

      // Zero-Trust Prompt (No AI Arithmetic Instructions)
      const systemPrompt = `You are a "Personal Learning Coach" for the CiviQuest Civil Service Exam app. Answer politely, directly, and concisely. Use the strictly calculated, deterministic stats below to provide recommendations. Do not invent data and DO NOT perform arithmetic calculations yourself. Rely exclusively on the provided 'needed' values.

**User's Live Stats:**
- Current Level: ${level} 
- XP To Next Level: ${xpToNextLevel} XP
- Current Total XP: ${xp} 
- Leaderboard Rank: ${userTier}
- Promove to Next Rank: ${rankStatusStr}
- Current Streak: ${streak} days
- Quizzes Completed: ${quizzesTaken}
- App Readiness Score: ${readiness}%

${categoryContext}

Your Capabilities & Explanations:
1. Explain Rank/Progression: Read the exact "XP To Next Level" and "Promove to Next Rank" stats provided. DO NOT calculate distances yourself.
2. Explain Weak Areas: Advise exactly the subjects listed under WEAK AREAS. Provide general tips to improve them.
3. Explain Strong Areas: Praise them for specific subjects listed under STRONG AREAS.
4. Motivate Streaks: Praise their active ${streak} day streak.
5. Why Daily Quiz: If asked why they got certain questions, explain that Daily Quizzes target their WEAK AREAS to help them master missing concepts.
6. Refuse completely off-topic logic outside the app or exams. DO NOT dump raw system data lists unless asked.`;

      const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterApiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CiviQuest',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-6).map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content })),
            { role: 'user', content: text },
          ],
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        setMessages(prev => [...prev, { content: data.choices[0].message.content, sender: 'ai', id: (Date.now() + 1).toString(), timestamp: Date.now() }]);
      } else { throw new Error('Invalid API response'); }
    } catch (error) {
      console.error('AI API error:', error);
      setMessages(prev => [...prev, { content: 'Sorry, I encountered an error. Please try again.', sender: 'ai', id: Date.now().toString(), timestamp: Date.now() }]);
    } finally { setIsLoading(false); }
  };

  const sendMessage = () => sendMessageWithText(input);

  const positionStyle: Record<string, React.CSSProperties> = {
    'bottom-right': { bottom: 28, right: 28 },
    'bottom-left':  { bottom: 24, left: 24 },
    'top-right':    { top: 24, right: 24 },
    'top-left':     { top: 24, left: 24 },
  };

  const panelOffsetStyle: React.CSSProperties = {
    position: 'absolute',
    ...(position.includes('bottom') ? { bottom: 68 } : { top: 68 }),
    ...(position.includes('right')  ? { right: 0 }   : { left: 0 }),
  };

  const allSessions = loadSessions();

  /* ── Inline styles for blink animation ── */
  const blinkKeyframes = `@keyframes cq-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;

  return (
    <div style={{ position: 'fixed', zIndex: 50, ...positionStyle[position] }}>
      <style>{blinkKeyframes}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            drag
            dragMomentum={false}
            style={{
              x, y,
              ...panelOffsetStyle,
              width: 400,
              height: 560,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 20,
              overflow: 'hidden',
              background: t.panelBg,
              border: `1px solid ${t.panelBorder}`,
              boxShadow: t.shadow,
              cursor: 'move',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: t.headerBg,
              borderBottom: `1px solid ${t.headerBorder}`,
              flexShrink: 0,
            }}>
              {showHistory ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setShowHistory(false)}
                    style={{
                      background: 'rgba(255,255,255,0.10)', border: 'none',
                      borderRadius: 7, width: 26, height: 26,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    <FaChevronLeft size={11} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Chat History</span>
                </div>
              ) : (
                <>
                  {/* Brand */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.45)',
                      flexShrink: 0,
                    }}>
                     <img src="/robot.png" alt="CiviQuest Buddy" style={{ width: 25, height: 40, objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
                        CiviQuest Buddy
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>Online</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[
                      { icon: FaHistory,  title: 'Chat History',   onClick: () => setShowHistory(true) },
                      { icon: FaPlus,     title: 'New Chat',        onClick: startNewChat },
                      { icon: darkMode ? FaSun : FaMoon, title: 'Toggle theme', onClick: () => setDarkMode(!darkMode) },
                      { icon: FaTimes,    title: 'Close',           onClick: () => setIsOpen(false) },
                    ].map(({ icon: Icon, title, onClick }, i) => (
                      <HeaderButton key={i} title={title} onClick={onClick}>
                        <Icon size={12} />
                      </HeaderButton>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── History panel ── */}
            {showHistory ? (
              <div style={{ flex: 1, overflowY: 'auto', background: t.panelBg }}>
                {allSessions.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', height: '100%', gap: 10,
                  }}>
                    <div style={{ fontSize: 28, opacity: 0.2 }}>🕐</div>
                    <p style={{ fontSize: 12, color: t.textSec, margin: 0 }}>No chat history yet</p>
                  </div>
                ) : (
                  allSessions.map((session, i) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      isActive={session.id === activeSessionId}
                      darkMode={darkMode}
                      t={t}
                      onLoad={() => loadSession(session.id)}
                      onDelete={(e) => deleteSession(e, session.id)}
                      isLast={i === allSessions.length - 1}
                    />
                  ))
                )}
              </div>
            ) : (
              <>
                {/* ── Messages ── */}
                <div
                  style={{
                    flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
                    background: t.msgBg,
                    cursor: 'default',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  {messages.map((message, index) => (
                    <MessageBubble
                      key={message.id || index}
                      message={message}
                      index={index}
                      darkMode={darkMode}
                      t={t}
                      copiedMessageId={copiedMessageId}
                      onCopy={copyToClipboard}
                      onDelete={deleteMessage}
                      onTypingComplete={completeTyping}
                    />
                  ))}

                  {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
                      <div style={{
                        padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                        background: t.aiBubbleBg,
                        border: `1px solid ${t.msgBorder}`,
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        {[0, 0.18, 0.36].map((delay, i) => (
                          <span key={i} style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#6b7280',
                            display: 'inline-block',
                            animation: `cq-blink 1.1s ${delay}s infinite`,
                          }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* ── Input bar ── */}
                <div
                  style={{
                    padding: '10px 12px 12px',
                    borderTop: `1px solid ${t.divider}`,
                    background: t.panelBg,
                    flexShrink: 0,
                    cursor: 'default',
                  }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    borderRadius: 14,
                    padding: '4px 6px 4px 14px',
                    transition: 'border-color 0.15s',
                  }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Ask about Civil Service Exam…"
                      style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        fontSize: 13, color: t.inputText, padding: '7px 0',
                      }}
                    />
                    <motion.button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      whileTap={{ scale: 0.88 }}
                      style={{
                        width: 34, height: 34, borderRadius: 10, border: 'none',
                        background: input.trim() && !isLoading
                          ? 'linear-gradient(135deg,#3b82f6,#6366f1)'
                          : 'transparent',
                        cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                        boxShadow: input.trim() && !isLoading ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
                      }}
                      aria-label="Send message"
                    >
                      <FaPaperPlane
                        size={13}
                        color={input.trim() && !isLoading ? '#fff' : '#4b5563'}
                        style={{ transform: 'translateX(-1px)' }}
                      />
                    </motion.button>
                  </div>
                  
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB ── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        onHoverStart={() => setFabHovered(true)}
        onHoverEnd={() => setFabHovered(false)}
        style={{
          width: 54, height: 54, borderRadius: '50%',
          background: isOpen
            ? 'linear-gradient(135deg,#374151,#1f2937)'
            : 'linear-gradient(135deg,#3b82f6,#6366f1)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isOpen
            ? '0 4px 20px rgba(0,0,0,0.35)'
            : '0 4px 20px rgba(99,102,241,0.5), 0 0 0 4px rgba(99,102,241,0.12)',
          transition: 'background 0.2s, box-shadow 0.2s',
          position: 'relative',
        }}
        aria-label="Open AI Chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <FaTimes size={18} color="#fff" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
             <img src="/robot.png" alt="Chat" style={{ width: 40, height: 50, objectFit: 'contain' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring (idle) */}
        {!isOpen && (
          <span style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: '2px solid rgba(99,102,241,0.3)',
            animation: 'cq-blink 2s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}
      </motion.button>
    </div>
  );
};

/* ─── Sub-components ──────────────────────────────────────────── */
function HeaderButton({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
        background: hov ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)',
        color: hov ? '#fff' : 'rgba(255,255,255,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function SessionRow({ session, isActive, darkMode, t, onLoad, onDelete, isLast }: {
  session: ChatSession; isActive: boolean; darkMode: boolean; t: any;
  onLoad: () => void; onDelete: (e: React.MouseEvent) => void; isLast: boolean;
}) {
  const [hov, setHov] = useState(false);
  const [delHov, setDelHov] = useState(false);
  return (
    <div
      onClick={onLoad}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px', cursor: 'pointer',
        background: isActive
          ? darkMode ? 'rgba(99,102,241,0.12)' : 'rgba(59,130,246,0.07)'
          : hov ? t.hoverBg : 'transparent',
        borderBottom: isLast ? 'none' : `1px solid ${t.divider}`,
        borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.textPri, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.label}
        </div>
        <div style={{ fontSize: 10, color: t.textSec }}>
          {session.messages.length} messages
        </div>
      </div>
      <button
        onClick={onDelete}
        onMouseEnter={() => setDelHov(true)}
        onMouseLeave={() => setDelHov(false)}
        style={{
          width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer',
          background: delHov ? t.deleteBtnHov : 'transparent',
          color: delHov ? '#f87171' : t.textSec,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginLeft: 8, transition: 'all 0.15s',
        }}
      >
        <FaTrash size={10} />
      </button>
    </div>
  );
}

function MessageBubble({ message, index, darkMode, t, copiedMessageId, onCopy, onDelete, onTypingComplete }: {
  message: Message; index: number; darkMode: boolean; t: any;
  copiedMessageId: string | null;
  onCopy: (content: string, id: string) => void;
  onDelete: (id: string) => void;
  onTypingComplete: (index: number) => void;
}) {
  const isUser = message.sender === 'user';
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 8,
      }}
    >
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ maxWidth: '82%', position: 'relative' }}
      >
        {/* Bubble */}
        <div style={{
          padding: '10px 13px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? t.userBubbleBg : t.aiBubbleBg,
          border: isUser ? 'none' : `1px solid ${t.msgBorder}`,
          boxShadow: isUser ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
          wordBreak: 'break-word',
          fontSize: 13,
          color: isUser ? t.userBubbleText : t.aiBubbleText,
          lineHeight: 1.55,
        }}>
          {message.sender === 'ai' ? (
            message.isTyping ? (
              <TypingEffect text={message.content} darkMode={darkMode} onComplete={() => onTypingComplete(index)} />
            ) : (
              <ReactMarkdown components={markdownComponents(darkMode)}>{message.content}</ReactMarkdown>
            )
          ) : message.content}

          {message.timestamp && (
            <div style={{ fontSize: 10, marginTop: 5, color: isUser ? 'rgba(255,255,255,0.45)' : t.timeText, textAlign: isUser ? 'right' : 'left' }}>
              {formatMessageTime(message.timestamp)}
            </div>
          )}
        </div>

        {/* Action row on hover */}
        <AnimatePresence>
          {hov && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              style={{
                display: 'flex', gap: 4, marginTop: 4,
                justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Copy */}
              <ActionChip
                onClick={() => message.id && onCopy(message.content, message.id)}
                darkMode={darkMode}
                t={t}
              >
                <FaCopy size={9} />
                {copiedMessageId === message.id ? (
                  <span style={{ fontSize: 9, color: '#34d399' }}>Copied!</span>
                ) : (
                  <span style={{ fontSize: 9 }}>Copy</span>
                )}
              </ActionChip>
              {/* Delete */}
              <ActionChip onClick={() => message.id && onDelete(message.id)} darkMode={darkMode} t={t} danger>
                <FaTrash size={9} />
              </ActionChip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ActionChip({ children, onClick, darkMode, t, danger }: {
  children: React.ReactNode; onClick: () => void;
  darkMode: boolean; t: any; danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 6, border: `1px solid ${t.divider}`,
        background: hov
          ? danger ? t.deleteBtnHov : t.hoverBg
          : darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        color: hov && danger ? '#f87171' : t.textSec,
        cursor: 'pointer', fontSize: 10, transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  );
}

export default FloatingChatbot;