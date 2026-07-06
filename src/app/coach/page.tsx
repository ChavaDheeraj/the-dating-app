'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, BarChart3, MessageSquare, Copy, Check, Info } from 'lucide-react';

interface MatchUser {
  id: string;
  name: string;
  avatar: string;
}

interface CoachReport {
  compatibility: {
    score: number;
    vibeAnalysis: string;
  };
  insights: string[];
  icebreakers: string[];
}

export default function Coach() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col justify-center items-center bg-bg-light font-sans">
        <div className="px-6 py-4 border-2 border-dark bg-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#121212] animate-pulse">
          Formulating recommendations...
        </div>
      </div>
    }>
      <CoachContent />
    </Suspense>
  );
}

function CoachContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [report, setReport] = useState<CoachReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Interactive Coach Chat States
  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachChat, setCoachChat] = useState<{ sender: 'user' | 'coach'; text: string }[]>([
    { sender: 'coach', text: "Hi! Ask me anything about your vibe overlap. E.g., 'What's the best date idea for us?' or 'How do we handle disagreements?'" }
  ]);
  const [coachTyping, setCoachTyping] = useState(false);

  const handleSendCoachQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachQuestion.trim()) return;

    const userText = coachQuestion;
    setCoachChat(prev => [...prev, { sender: 'user', text: userText }]);
    setCoachQuestion('');
    setCoachTyping(true);

    setTimeout(() => {
      setCoachTyping(false);
      
      const match = matches.find(m => m.id === selectedMatchId);
      const name = match ? match.name.split(' ')[0] : 'your partner';
      const score = report?.compatibility.score || 70;

      let reply = `Based on your vibe overlap with ${name} (${score}% compatibility), `;
      
      const query = userText.toLowerCase();
      if (query.includes('date') || query.includes('hang') || query.includes('meet') || query.includes('activity')) {
        if (report && report.compatibility.score > 85) {
          reply += `you both share high pacing and values, so an expansive weekend gallery walk followed by dinner at a trendy spot will feel extremely natural!`;
        } else {
          reply += `since you have complementary pacing, I recommend a low-pressure active stroll in a park followed by a cozy tea spot to let your different rhythms balance out.`;
        }
      } else if (query.includes('conflict') || query.includes('fight') || query.includes('argue') || query.includes('disagree')) {
        reply += `give each other time to think. One of you prefers instant discussions, while the other recharges alone. Agree to cool down for 2 hours before talking.`;
      } else if (query.includes('communicate') || query.includes('talk')) {
        reply += `aim to balance your conversations. Try matching their directness but keep your phrasing supportive to prevent misunderstandings.`;
      } else {
        reply += `focus on your shared tags. Bonding over mutual interests like hobbies is the absolute fastest route to deepen your cognitive vibe.`;
      }

      setCoachChat(prev => [...prev, { sender: 'coach', text: reply }]);
    }, 1200);
  };

  useEffect(() => {
    const userString = localStorage.getItem('vibe_user');
    if (!userString) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(userString);
    setCurrentUser(parsedUser);
    fetchMatches(parsedUser.id);
  }, [router]);

  const fetchMatches = async (userId: string) => {
    try {
      const res = await fetch(`/api/matches?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.recommendations.length > 0) {
        const list = data.recommendations.map((r: any) => ({
          id: r.id,
          name: r.name,
          avatar: r.profile.avatar
        }));
        setMatches(list);
        
        const urlMatchId = searchParams.get('matchId');
        if (urlMatchId && list.some((m: any) => m.id === urlMatchId)) {
          setSelectedMatchId(urlMatchId);
          fetchCoachReport(userId, urlMatchId);
        } else {
          setSelectedMatchId(list[0].id);
          fetchCoachReport(userId, list[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCoachReport = async (userId: string, matchId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/coach?userId=${userId}&matchId=${matchId}`);
      const data = await res.json();
      if (data.success) {
        setReport({
          compatibility: data.compatibility,
          insights: data.insights,
          icebreakers: data.icebreakers
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchChange = (matchId: string) => {
    setSelectedMatchId(matchId);
    if (currentUser) {
      fetchCoachReport(currentUser.id, matchId);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleOpenChat = (icebreakerText: string) => {
    router.push(`/chat?matchId=${selectedMatchId}&prefill=${encodeURIComponent(icebreakerText)}`);
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-bg-light py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-white p-6 border-2 border-dark shadow-[4px_4px_0px_0px_#121212]">
          <div>
            <h1 className="text-2xl font-black text-dark uppercase tracking-wide">AI Vibe Coach</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Relationship & conversation insights</p>
          </div>
          <Sparkles className="w-8 h-8 text-primary fill-primary animate-pulse" />
        </header>

        {/* Website Double Pane grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Left Column (Selector + Compatibility Index Card) */}
          <div className="space-y-4">
            
            {/* Selector */}
            {matches.length > 0 && (
              <div className="bg-white border-2 border-dark p-6 shadow-[4px_4px_0px_0px_#121212] space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Choose Vibe Partner</label>
                <select
                  value={selectedMatchId}
                  onChange={e => handleMatchChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-dark text-dark font-black bg-white focus:outline-none focus:border-primary/50"
                >
                  {matches.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Score Ring Summary Card */}
            {report && (
              <div className="bg-white border-2 border-dark p-6 shadow-[4px_4px_0px_0px_#121212] text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-secondary border-2 border-dark px-3 py-1.5 text-[10px] font-black text-dark uppercase tracking-widest">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Synergy Score</span>
                </div>
                <h2 className="text-5xl font-black text-dark tracking-tight">
                  {report.compatibility.score}%
                </h2>
                <p className="text-xs font-bold text-gray-700 leading-relaxed italic bg-secondary border-2 border-dark p-4 shadow-[2px_2px_0px_0px_#121212]">
                  "{report.compatibility.vibeAnalysis}"
                </p>
              </div>
            )}

          </div>

          {/* Right Column (Insights + Icebreakers dashboard panels) */}
          <div className="md:col-span-2 space-y-6">
            {loading ? (
              <div className="bg-white border-2 border-dark shadow-[4px_4px_0px_0px_#121212] p-12 flex flex-col justify-center items-center min-h-[300px]">
                <div className="px-6 py-4 border-2 border-dark bg-white font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#121212] animate-pulse">
                  Consulting vibe charts...
                </div>
              </div>
            ) : report ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* AI Insights Card */}
                  <div className="bg-white border-2 border-dark p-6 shadow-[4px_4px_0px_0px_#121212] space-y-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-b-2 border-dark pb-2">
                      🧠 Behavioral Overlaps
                    </span>
                    <div className="space-y-4">
                      {report.insights.map((insight, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <div className="w-5 h-5 border-2 border-dark bg-secondary flex items-center justify-center text-dark text-[10px] flex-none mt-0.5 font-black">
                            {idx + 1}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                            {insight}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Conversation starters Card */}
                  <div className="bg-white border-2 border-dark p-6 shadow-[4px_4px_0px_0px_#121212] space-y-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-b-2 border-dark pb-2">
                      💬 AI Icebreakers
                    </span>
                    <div className="space-y-3">
                      {report.icebreakers.map((ice, idx) => (
                        <div key={idx} className="group p-3 bg-white border-2 border-dark shadow-[2px_2px_0px_0px_#121212] hover:bg-secondary/40 transition-all space-y-2.5">
                          <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                            "{ice}"
                          </p>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => copyToClipboard(ice, idx)}
                              className="p-2 bg-white border-2 border-dark text-dark hover:bg-gray-50 transition-all cursor-pointer shadow-[1px_1px_0px_0px_#121212]"
                              title="Copy to clipboard"
                            >
                              {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-success font-black" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleOpenChat(ice)}
                              className="px-3 py-1.5 bg-primary border-2 border-dark text-white font-black text-[10px] shadow-[2px_2px_0px_0px_#121212] flex items-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Prefill Chat</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Ask Sparky — Live AI Relationship Consultant */}
                <div className="bg-white border-2 border-dark p-6 shadow-[4px_4px_0px_0px_#121212] space-y-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-b-2 border-dark pb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary fill-primary animate-pulse" />
                    Ask Sparky — Live AI Relationship Consultant
                  </span>
                  
                  <div className="bg-gray-50 border-2 border-dark p-4 h-48 overflow-y-auto space-y-3">
                    {coachChat.map((m, idx) => (
                      <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 border-2 border-dark text-xs font-bold leading-relaxed shadow-[2px_2px_0px_0px_#121212] ${
                          m.sender === 'user' 
                            ? 'bg-primary text-white' 
                            : 'bg-white text-dark'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {coachTyping && (
                      <div className="flex justify-start items-center gap-2">
                        <div className="px-4 py-3 bg-white border-2 border-dark shadow-[2px_2px_0px_0px_#121212] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-gray-400 animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendCoachQuestion} className="flex gap-2">
                    <input 
                      type="text" 
                      value={coachQuestion}
                      onChange={e => setCoachQuestion(e.target.value)}
                      placeholder={`Ask Sparky about your connection...`}
                      className="flex-1 px-4 py-2.5 border-2 border-dark text-xs font-semibold focus:outline-none focus:border-primary/50 text-dark bg-gray-50 focus:bg-white"
                    />
                    <button 
                      type="submit"
                      disabled={!coachQuestion.trim()}
                      className="px-4 py-2.5 bg-primary border-2 border-dark text-white font-black text-xs shadow-[2px_2px_0px_0px_#121212] disabled:opacity-40 cursor-pointer"
                    >
                      Ask
                    </button>
                  </form>
                </div>

              </div>
            ) : (
              <div className="text-center py-16 px-6 bg-white border-2 border-dark shadow-[4px_4px_0px_0px_#121212] flex flex-col items-center">
                <Info className="w-12 h-12 text-gray-300 mb-4 animate-bounce" />
                <h3 className="text-base font-black uppercase text-dark mb-1">Coach Room Empty</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Please generate Matches first to load Wingman insights.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
