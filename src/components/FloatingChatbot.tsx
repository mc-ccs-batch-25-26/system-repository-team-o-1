import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { FaPaperPlane, FaTimes, FaMoon, FaSun, FaTrash, FaCopy, FaHistory, FaPlus, FaChevronLeft } from 'react-icons/fa';
import { getProgressStats } from '../firebase/progressService';
import { getCategoryPerformanceData } from '../firebase/analyticsService';
import { getUserData } from '../firebase/userService';
import { supabase } from '../supabase/supabaseClient';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

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
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions));
  } catch (e) { console.error('Failed to save chat history:', e); }
};

const formatSessionLabel = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });
};

const formatMessageTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });
};

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
    } else {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <div className={darkMode ? 'markdown-dark' : 'markdown'}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
          h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          a: ({ href, children }) => <a href={href} className="text-blue-400 underline">{children}</a>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          code: ({ children }) => <code className={`px-1 rounded text-xs ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>{children}</code>,
        }}
      >
        {displayedText}
      </ReactMarkdown>
      <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-gray-500 animate-pulse" />
    </div>
  );
};

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

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const location = useLocation();

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    if (isOpen) fetchUserData();
  }, [isOpen]);

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
        updatedAt: now
      };
      if (existingIdx >= 0) sessions[existingIdx] = session;
      else sessions.unshift(session);
      if (sessions.length > MAX_SESSIONS) sessions.length = MAX_SESSIONS;
      saveSessions(sessions);
      setSessions(sessions);
    }
  }, [messages, activeSessionId]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const userData = await getUserData(user.id);
      const progressStats = await getProgressStats();
      const categoryData = await getCategoryPerformanceData();
      setUserStats({ userData, progressStats });
      setUserProgressData(categoryData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const startNewChat = () => {
    const sessions = loadSessions();
    const now = Date.now();
    const newId = now.toString();
    const newSession: ChatSession = {
      id: newId,
      label: formatSessionLabel(now),
      messages: [{ ...DEFAULT_MESSAGE, id: 'welcome-' + now, timestamp: now }],
      createdAt: now,
      updatedAt: now
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
    if (session) {
      setActiveSessionId(sessionId);
      setMessages(session.messages);
      setShowHistory(false);
    }
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
        id: newId,
        label: formatSessionLabel(now),
        messages: [{ ...DEFAULT_MESSAGE, id: 'welcome-' + now, timestamp: now }],
        createdAt: now,
        updatedAt: now
      };
      sessions.unshift(newSession);
      saveSessions(sessions);
      setSessions(sessions);
      setActiveSessionId(newId);
      setMessages(newSession.messages);
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleChat = () => setIsOpen(!isOpen);

  const analyzeUserProgress = () => {
    if (!userStats || !userProgressData || userProgressData.length === 0) {
      return "I don't have enough data about your progress yet. Please complete some quizzes first.";
    }
    const { progressStats } = userStats;
    const { accuracy, readiness, quizzesTaken } = progressStats;
    const sortedCategories = [...userProgressData].sort((a, b) => a.accuracy - b.accuracy);
    const weakestCategories = sortedCategories.slice(0, 2);
    let analysis = `📊 **Your Progress**:\n- Accuracy: ${accuracy}%\n- Quizzes: ${quizzesTaken}\n- Readiness: ${readiness}%\n\n`;
    if (weakestCategories.length > 0) {
      analysis += `🔍 **Weak Areas**:\n`;
      weakestCategories.forEach(cat => { analysis += `- ${cat.categoryName}: ${cat.accuracy}%\n`; });
      analysis += '\n';
    }
    analysis += `💡 **Tip**: Focus on ${weakestCategories[0]?.categoryName || 'your weakest area'} to improve your readiness score.`;
    return analysis;
  };

  const completeTyping = (index: number) => {
    setMessages(prev => prev.map((msg, i) => i === index ? { ...msg, isTyping: false } : msg));
  };

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
      const progressKeywords = ['progress', 'performance', 'score', 'how am i doing', 'my results', 'stats', 'improve', 'tips', 'weak areas'];
      const isAskingAboutProgress = progressKeywords.some(k => text.toLowerCase().includes(k));

      if (isAskingAboutProgress) {
        await fetchUserData();
        const analysis = analyzeUserProgress();
        setMessages(prev => [...prev, { content: analysis, sender: 'ai', id: (Date.now() + 1).toString(), timestamp: Date.now() }]);
        setIsLoading(false);
        return;
      }

      const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterApiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CiviQuest'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: 'You are CiviQuest Buddy. Only answer Civil Service Exam topics. Keep responses direct, concise and helpful. Refuse off-topic questions politely.' },
            ...messages.slice(-6).map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content })),
            { role: 'user', content: text }
          ]
        })
      });

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        setMessages(prev => [...prev, { content: data.choices[0].message.content, sender: 'ai', id: (Date.now() + 1).toString(), timestamp: Date.now() }]);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('AI API error:', error);
      setMessages(prev => [...prev, { content: 'Sorry, I encountered an error. Please try again.', sender: 'ai', id: Date.now().toString(), timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => sendMessageWithText(input);

  const positionClasses: Record<string, string> = {
    'bottom-right': 'bottom-7 right-7',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const allSessions = loadSessions();

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            drag dragMomentum={false}
            style={{ x, y }}
            className={`absolute ${position.includes('bottom') ? 'bottom-16' : 'top-16'} ${position.includes('right') ? 'right-0' : 'left-0'} w-96 sm:w-[440px] h-[540px] rounded-xl shadow-xl flex flex-col overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-zinc-300'} cursor-move`}
          >
            <div className={`p-3 flex justify-between items-center ${darkMode ? 'bg-gray-900' : 'bg-blue-900'} text-white border-b ${darkMode ? 'border-gray-700' : 'border-blue-800'}`}>
              {showHistory ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowHistory(false)} className="text-white hover:text-gray-300">
                    <FaChevronLeft size={14} />
                  </button>
                  <h3 className="font-medium text-sm">Chat History</h3>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <img src="/robot.png" alt="CiviQuest" className="w-7 h-7 object-contain brightness-100 invert rounded" />
                    <h3 className="font-medium text-sm">CiviQuest Buddy</h3>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => setShowHistory(!showHistory)} className="text-white p-1.5 rounded hover:bg-white/20 transition-colors" title="Chat History">
                      <FaHistory size={14} />
                    </button>
                    <button onClick={startNewChat} className="text-white p-1.5 rounded hover:bg-white/20 transition-colors" title="New Chat">
                      <FaPlus size={14} />
                    </button>
                    <button onClick={toggleDarkMode} className="text-white p-1.5 rounded hover:bg-white/20 transition-colors" title="Toggle theme">
                      {darkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
                    </button>
                    <button onClick={toggleChat} className="text-white p-1.5 rounded hover:bg-white/20 transition-colors" title="Close">
                      <FaTimes size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {showHistory ? (
              <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {allSessions.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">No chat history yet.</div>
                ) : (
                  allSessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-zinc-300 hover:bg-gray-50'}`}
                    >
                      <div>
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{session.label}</div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{session.messages.length} messages</div>
                      </div>
                      <button onClick={(e) => deleteSession(e, session.id)} className={`p-1 rounded hover:bg-red-500/20 ${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}>
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                <div className={`flex-1 p-4 overflow-y-auto ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} cursor-default`} onMouseDown={e => e.stopPropagation()}>
                  {messages.map((message, index) => (
                    <div key={message.id || index} className={`mb-3 ${message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                      <div className="relative group max-w-[85%]">
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-sm inline-block ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : darkMode ? 'bg-gray-700 text-gray-100 rounded-bl-md' : 'bg-zinc-300 text-gray-800 rounded-bl-md'
                          }`}
                          style={{ wordBreak: 'break-word' }}
                        >
                          {message.sender === 'ai' ? (
                            message.isTyping ? (
                              <TypingEffect text={message.content} darkMode={darkMode} onComplete={() => completeTyping(index)} />
                            ) : (
                              <div className={darkMode ? 'markdown-dark' : 'markdown'}>
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                    h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
                                    li: ({ children }) => <li className="mb-0.5">{children}</li>,
                                    a: ({ href, children }) => <a href={href} className="text-blue-400 underline">{children}</a>,
                                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                    code: ({ children }) => <code className={`px-1 rounded text-xs ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>{children}</code>,
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )
                          ) : (message.content)}
                          {message.timestamp && (
                            <div className={`text-[10px] mt-1 ${message.sender === 'user' ? 'text-blue-200' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatMessageTime(message.timestamp)}
                            </div>
                          )}
                        </div>
                        <div className={`hidden group-hover:flex space-x-1 mt-0.5 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <motion.button onClick={() => message.id && copyToClipboard(message.content, message.id)} className={`p-1 rounded-full ${message.sender === 'user' ? 'bg-blue-700 hover:bg-blue-800' : darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'} transition-colors relative`} whileTap={{ scale: 0.9 }}>
                            <FaCopy size={9} className="text-white" />
                            <AnimatePresence>
                              {copiedMessageId === message.id && (
                                <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -25 }} exit={{ opacity: 0 }} className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">Copied!</motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                          <button onClick={() => message.id && deleteMessage(message.id)} className={`p-1 rounded-full ${message.sender === 'user' ? 'bg-blue-700 hover:bg-blue-800' : darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'} transition-colors`}>
                            <FaTrash size={9} className="text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start mb-3">
                      <div className={`px-4 py-3 rounded-2xl rounded-bl-md ${darkMode ? 'bg-gray-700' : 'bg-zinc-300'}`}>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className={`border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-zinc-300 bg-white'} p-2 cursor-default`} onMouseDown={e => e.stopPropagation()}>
                  <div className={`flex items-center rounded-xl overflow-hidden border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                    <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className={`flex-1 p-3 bg-transparent focus:outline-none text-sm ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800'}`} />
                    <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="text-blue-500 hover:text-blue-600 p-3 transition-colors disabled:opacity-50">
                      <FaPaperPlane size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1}}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
        className="bg-green-600 hover:bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl transition-colors"
        aria-label="Open AI Chat"
      >
        <img src="/robot.png" alt="Chat" className="w-18 h-12 object-contain brightness-100 invert" />
      </motion.button>
    </div>
  );
};

export default FloatingChatbot;