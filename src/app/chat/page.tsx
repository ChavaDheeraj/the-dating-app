'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, Heart, Mic, Play } from 'lucide-react';

interface MatchItem {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  score: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

interface MatchRecommendation {
  id: string;
  name: string;
  profile: {
    avatar: string;
    bio: string;
  };
  vibe: {
    score: number;
  };
}

export default function Chat() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] font-mono text-xs text-gray-400">
        [ INITIALIZING MESSENGER CHANNELS... ]
      </div>
    }>
      <ChatContent />
    </React.Suspense>
  );
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Chat Directory Tab Filter
  const [inboxTab, setInboxTab] = useState<'active' | 'new'>('active');

  // Sub-features inside Thread state triggers
  const [showMemories, setShowMemories] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceTimer, setVoiceTimer] = useState(0);

  const getAvatarStyle = (avatarStr: string) => {
    if (!avatarStr) return {};
    if (avatarStr.startsWith('linear-gradient')) {
      return { background: avatarStr };
    }
    return { 
      backgroundImage: `url(${avatarStr})`, 
      backgroundPosition: 'center 15%', 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat' 
    };
  };

  const suggestedIcebreakers = useMemo(() => {
    const activeMatch = matches.find(m => m.id === activeMatchId);
    if (activeMatch) {
      if (activeMatch.name.includes("Maya")) {
        return [
          "Hey Maya, I loved your art studio photo! What color theme are you working on today?",
          "Are you more of an itinerary vacation planner, or do you prefer spontaneous cafes?"
        ];
      } else if (activeMatch.name.includes("Liam")) {
        return [
          "Liam, how do you tamp your espresso grounds? Got any advice for a clean double shot?",
          "Let's play a round of Uno or Tic Tac Toe to test our conflict resolution styles!"
        ];
      } else {
        return [
          "Hey! Would you rather plan a quiet weekend board game dinner or a big outdoor trail hike?",
          "If our conversation hits a dry spot, do you prefer deep questions or jokes?"
        ];
      }
    }
    return [];
  }, [activeMatchId, matches]);

  const fetchChatHistory = useCallback(async (senderId: string, receiverId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat?senderId=${senderId}&receiverId=${receiverId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMatches = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/matches?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        const mappedMatches = data.recommendations.map((rec: MatchRecommendation) => ({
          id: rec.id,
          name: rec.name,
          avatar: rec.profile.avatar,
          bio: rec.profile.bio,
          score: rec.vibe.score
        }));
        setMatches(mappedMatches);

        // If no match was loaded from query params, pick the first active one as default
        const paramMatchId = searchParams.get('matchId');
        if (!paramMatchId && mappedMatches.length > 0) {
          const firstId = mappedMatches[0].id;
          setActiveMatchId(firstId);
          fetchChatHistory(userId, firstId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [fetchChatHistory, searchParams]);

  useEffect(() => {
    const userString = localStorage.getItem('vibe_user');
    if (!userString) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(userString);
    setCurrentUser(parsedUser);
    fetchMatches(parsedUser.id);
  }, [fetchMatches, router]);

  useEffect(() => {
    // Scroll to bottom of message thread
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Read preselected matchId from URL parameter
  useEffect(() => {
    const paramMatchId = searchParams.get('matchId');
    if (paramMatchId) {
      setActiveMatchId(paramMatchId);
      if (currentUser) {
        fetchChatHistory(currentUser.id, paramMatchId);
      }
    }
  }, [currentUser, fetchChatHistory, searchParams]);

  useEffect(() => {
    if (!voiceRecording) {
      setVoiceTimer(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setVoiceTimer(prev => prev + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [voiceRecording]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !activeMatchId) return;

    const messageText = inputText;
    setInputText('');

    // Append mock immediate message to local state
    const tempMsg: Message = {
      id: Math.random().toString(),
      senderId: currentUser.id,
      receiverId: activeMatchId,
      content: messageText,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: activeMatchId,
          content: messageText
        })
      });
      const data = await res.json();

      if (data.success) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          fetchChatHistory(currentUser.id, activeMatchId);
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendVoiceNote = () => {
    if (voiceRecording) {
      setVoiceRecording(false);
      const voiceText = `[ 🎤 Voice Note Memo - ${voiceTimer}s ]`;
      setInputText(voiceText);
    } else {
      setVoiceRecording(true);
    }
  };

  const handleSelectConversant = (matchId: string) => {
    setActiveMatchId(matchId);
    setShowMemories(false);
    setShowPlanner(false);
    if (currentUser) {
      fetchChatHistory(currentUser.id, matchId);
    }
  };

  const activeMatches = matches.filter(m => m.name.includes("Maya") || m.name.includes("Liam"));
  const newMatches = matches.filter(m => !m.name.includes("Maya") && !m.name.includes("Liam"));

  const displayMatches = inboxTab === 'active' ? activeMatches : newMatches;
  const activeMatch = matches.find(m => m.id === activeMatchId);

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#FAF9F5] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header (Boutique Monospaced Typewriter Ledger style) */}
        <header className="flex justify-between items-center bg-white p-6 border border-hairline">
          <div>
            <h1 className="text-lg font-black text-dark uppercase tracking-widest font-mono">
              [ VIBE_MESSENGER.LOG ]
            </h1>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 font-mono">
              ROS active interaction channels • light editorial theme
            </p>
          </div>
          <MessageSquare className="w-5 h-5 text-gray-400" />
        </header>

        {/* Messenger Double Pane Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch h-[calc(100vh-240px)] min-h-[500px]">
          
          {/* Sidebar Conversations directory (1/3 width) */}
          <div className="bg-white border border-hairline p-4 overflow-y-auto flex flex-col gap-4">
            
            {/* Split active vs new tabs (Typewriter minimal selectors) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-50 border border-hairline font-mono">
              <button 
                onClick={() => setInboxTab('active')}
                className={`py-1.5 text-[9px] font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                  inboxTab === 'active' ? 'bg-white border border-hairline text-dark' : 'text-gray-400'
                }`}
              >
                [ ACTIVE ]
              </button>
              <button 
                onClick={() => setInboxTab('new')}
                className={`py-1.5 text-[9px] font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                  inboxTab === 'new' ? 'bg-white border border-hairline text-dark' : 'text-gray-400'
                }`}
              >
                [ NEW ({newMatches.length}) ]
              </button>
            </div>

            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 font-mono">
              LOG_INDEX ({displayMatches.length})
            </span>

            <div className="space-y-1.5 flex-1">
              {displayMatches.map((item) => {
                const isActive = item.id === activeMatchId;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectConversant(item.id)}
                    className={`w-full text-left p-3.5 border transition-all flex items-center gap-3.5 cursor-pointer ${
                      isActive
                        ? 'bg-gray-50 border-gray-400 text-dark'
                        : 'bg-white border-hairline hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 flex items-center justify-center text-white text-xs font-black border border-hairline flex-none overflow-hidden"
                      style={getAvatarStyle(item.avatar)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-dark truncate uppercase tracking-tight">{item.name.split(' ')[0]}</span>
                        <span className={`text-[8px] font-mono font-black uppercase ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                          [{item.score}%]
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5 leading-none">{item.bio}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Conversation Pane (2/3 width) */}
          <div className="md:col-span-2 bg-white border border-hairline overflow-hidden flex h-full relative">
            
            <div className="flex-1 flex flex-col justify-between h-full border-r border-hairline">
              
              {/* Header info bar */}
              {activeMatch ? (
              <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-white flex-none">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 flex items-center justify-center text-white text-sm font-black border border-hairline overflow-hidden"
                    style={getAvatarStyle(activeMatch.avatar)}
                  />
                  <div>
                    <h3 className="text-xs font-black text-dark uppercase tracking-wider font-mono">{activeMatch.name}</h3>
                    <span className="text-[8px] text-gray-400 font-mono uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-[#7C7AE6] rounded-none animate-pulse" />
                      ROS_TUNNEL_ESTABLISHED
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1.5 font-mono">
                  <button
                    onClick={() => { setShowMemories(!showMemories); setShowPlanner(false); }}
                    className={`px-2.5 py-1.5 border font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                      showMemories 
                        ? 'bg-dark border-dark text-white' 
                        : 'border-hairline text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    [ MEMORIES ]
                  </button>
                  <button
                    onClick={() => { setShowPlanner(!showPlanner); setShowMemories(false); }}
                    className={`px-2.5 py-1.5 border font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                      showPlanner 
                        ? 'bg-dark border-dark text-white' 
                        : 'border-hairline text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    [ DatePlan ]
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 border-b border-hairline flex items-center gap-3 flex-none bg-white font-mono text-xs text-gray-400">
                [ CHOOSE_A_MATCH_CONVERSANT ]
              </div>
            )}

            {/* Chat message bubbles scroll container */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-[#FAF9F5]/40">
              {loading ? (
                <div className="flex flex-col justify-center items-center h-full">
                  <div className="px-4 py-2 border border-hairline bg-white font-mono text-[9px] uppercase tracking-widest animate-pulse text-gray-400">
                    [ FETCHING SECURE LOGS... ]
                  </div>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isSentByMe = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Hairline Editorial border outline bubbles */}
                      <div
                        className={`max-w-[75%] px-4 py-2.5 border text-xs font-medium leading-relaxed ${
                          isSentByMe
                            ? 'bg-[#7C7AE6]/5 text-dark border-[#7C7AE6]'
                            : 'bg-white text-dark border-hairline'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-center p-6 font-mono">
                  <Heart className="w-8 h-8 text-gray-300 animate-pulse mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-dark mb-1">[ LOBBY CHAT OPENED ]</p>
                  <p className="text-[9px] text-gray-400 leading-normal max-w-[220px] uppercase font-semibold">
                    Send a monospaced memo or launch one of the Quick AI Icebreakers below.
                  </p>
                </div>
              )}

              {/* Typing indicator bubble */}
              {isTyping && activeMatch && (
                <div className="flex justify-start items-center gap-2 animate-fadeIn font-mono">
                  <div className="px-3 py-1 bg-white border border-hairline text-gray-400 text-[9px] uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <span>{activeMatch.name.split(' ')[0]} is writing</span>
                    <span className="w-1 h-1 bg-gray-400" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area + floating AI Icebreaker pills */}
            <div className="p-4 border-t border-hairline flex-none bg-white space-y-3">
              
              {/* AI Icebreaker suggestions pill list (typewriter minimalist) */}
              {activeMatch && suggestedIcebreakers.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none animate-fadeIn font-mono">
                  <span className="text-[8px] font-black text-secondary uppercase tracking-widest flex items-center gap-1 bg-[#7C7AE6]/10 border border-[#7C7AE6]/20 px-2 py-0.5 flex-none">
                    [ AI_ASSIST ]
                  </span>
                  {suggestedIcebreakers.map((text, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(text)}
                      className="flex-none px-3 py-1 border border-hairline bg-white hover:bg-gray-50 text-dark font-semibold text-[9px] cursor-pointer"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}

              {/* Message text input box */}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center font-mono">
                <button
                  type="button"
                  onClick={handleSendVoiceNote}
                  className={`p-3 border text-dark font-bold cursor-pointer transition-all ${
                    voiceRecording ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-hairline hover:bg-gray-50'
                  }`}
                  title="Send voice note"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={
                    voiceRecording 
                      ? `[ Audio memo recording: click Mic to compile ]` 
                      : activeMatch 
                      ? `Write memo to ${activeMatch.name.split(' ')[0]}...` 
                      : "[ Select channel conversant ]"
                  }
                  disabled={!activeMatchId}
                  className="flex-1 px-4 py-3 border border-hairline focus:outline-none focus:border-dark text-xs font-semibold text-dark transition-all bg-gray-50 focus:bg-white"
                />
                
                <button
                  type="button"
                  onClick={() => router.push(`/games?matchId=${activeMatchId}`)}
                  disabled={!activeMatchId}
                  className="p-3 bg-white border border-hairline text-dark font-bold cursor-pointer hover:bg-gray-50"
                  title="Play games"
                >
                  <Play className="w-3.5 h-3.5 text-secondary" />
                </button>

                <button
                  type="submit"
                  disabled={!activeMatchId || !inputText.trim()}
                  className="p-3 bg-dark border border-dark text-white font-black disabled:opacity-30 cursor-pointer uppercase text-[10px] tracking-wider"
                >
                  [ Send ]
                </button>
              </form>
            </div>

            </div>

            {/* Panel: Shared Memories ledger timeline */}
            {showMemories && activeMatch && (
              <div className="w-72 bg-[#FDFDFB] p-6 overflow-y-auto hidden lg:flex flex-col gap-5 h-full border-l border-hairline animate-fadeIn font-mono">
                <div>
                  <h3 className="text-xs font-black text-dark uppercase tracking-widest">[ SHARED_MEMORIES.LOG ]</h3>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">Timeline milestones</p>
                </div>

                <div className="space-y-4 flex-1 pt-2 text-left">
                  {[
                    { title: 'Connection Initiated', desc: 'Weighted compatibility calculated.', date: 'DAY_01' },
                    { title: 'Dilemmas Compared', desc: 'Scenario game responses aligned.', date: 'DAY_01' },
                    { title: 'Memo Log Opened', desc: 'Message tunnel activated.', date: 'TODAY' },
                  ].map((m, idx) => (
                    <div key={idx} className="border border-hairline p-3.5 bg-white">
                      <div className="flex justify-between items-baseline gap-1">
                        <h4 className="text-[10px] font-black text-dark uppercase tracking-tight">{m.title}</h4>
                        <span className="text-[8px] text-gray-400">{m.date}</span>
                      </div>
                      <p className="text-[9px] text-gray-500 mt-1 leading-normal">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panel: Mini Date Planner ledger drawer */}
            {showPlanner && activeMatch && (
              <div className="w-72 bg-[#FDFDFB] p-6 overflow-y-auto hidden lg:flex flex-col gap-5 h-full border-l border-hairline animate-fadeIn font-mono">
                <div>
                  <h3 className="text-xs font-black text-dark uppercase tracking-widest">[ DATE_PLANNER.LOG ]</h3>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">Setup real experiences</p>
                </div>

                <div className="space-y-3 flex-1 pt-2 text-left">
                  <p className="text-[9px] text-gray-500 leading-normal uppercase">
                    Suggested date templates from ROS compatibility keys:
                  </p>
                  
                  {[
                    { title: 'Cozy Bookstore Stroll', venue: 'Indie Books & Coffee' },
                    { title: 'Nature Forest Hike', venue: 'Local Green Trail' },
                    { title: 'Abstract Art Gallery Walk', venue: 'Downtown Museum' }
                  ].map((date, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(`Hey, are you free for a date experience: "${date.title}" at ${date.venue}?`)}
                      className="w-full text-left p-3.5 border border-hairline bg-white hover:bg-gray-50 transition-all cursor-pointer text-xs"
                    >
                      <h4 className="font-bold text-dark uppercase text-[10px] tracking-tight">{date.title}</h4>
                      <p className="text-[9px] text-gray-400 mt-1 uppercase font-semibold font-mono">{date.venue}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
