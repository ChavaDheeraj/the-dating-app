'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gamepad2, CheckCircle2, ChevronRight, User, Play, X, MailCheck, Trophy } from 'lucide-react';

interface Scenario {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  category: string;
}

interface UserAnswer {
  id: string;
  scenarioId: string;
  optionChoice: string;
  comment: string | null;
}

interface MatchPlayer {
  id: string;
  name: string;
  avatar: string;
  gender: string;
  age: number;
}

interface MatchRecommendation {
  id: string;
  name: string;
  profile: {
    avatar: string;
    gender: string;
    age: number;
  };
}

type LobbyGame = 'tictactoe' | 'drawing' | 'uno' | 'never-ever' | 'would-rather';

const lobbyGames: { id: LobbyGame; name: string; desc: string; tag: string }[] = [
  { id: 'tictactoe', name: 'Tic Tac Toe', desc: 'Classic grid alignment strategy game.', tag: '🧠 Logic Duel' },
  { id: 'drawing', name: 'Guess the Drawing', desc: 'Draw a creative prompt on the tablet canvas.', tag: '🎨 Creative Sketch' },
  { id: 'uno', name: 'Vibe Uno Cards', desc: 'Shed cards on the active color discard pile.', tag: '🎲 Card Clash' },
  { id: 'never-ever', name: 'Never Have I Ever', desc: 'Reveal values through vulnerability prompts.', tag: '🗣️ Conversation' },
  { id: 'would-rather', name: 'Would You Rather', desc: 'Compare lifestyle choices and preferences.', tag: '⚖️ Value Align' }
];

const seedChoices: Record<string, Record<string, string>> = {
  "Conflict Resolution": { A: "Liam O'Connor", B: "Maya Lin, Chloe Vance", C: "", D: "Marcus Aurelius" },
  "Life Pace": { A: "Marcus Aurelius", B: "Maya Lin, Chloe Vance", C: "Liam O'Connor", D: "" },
  "Values": { A: "Liam O'Connor", B: "Marcus Aurelius", C: "", D: "Maya Lin, Chloe Vance" },
  "Social Battery": { A: "Chloe Vance", B: "Marcus Aurelius", C: "Liam O'Connor", D: "Maya Lin" }
};

export default function Games() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex flex-col justify-center items-center bg-bg-light font-sans">
        <div className="px-6 py-4 border border-hairline bg-white font-black text-xs uppercase tracking-widest animate-pulse">
          Loading scenario playroom...
        </div>
      </div>
    }>
      <PlayroomContent />
    </React.Suspense>
  );
}

function PlayroomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  
  // Matches list & chosen opponent state
  const [matches, setMatches] = useState<MatchPlayer[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string>('');
  
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Invite states to track invitations per opponent
  const [invitedMatches, setInvitedMatches] = useState<Record<string, 'ready' | 'invited' | 'offline' | 'playing'>>({
    'maya': 'ready',
    'liam': 'ready',
    'chloe': 'offline',
    'marcus': 'playing'
  });
  const [inviteLog, setInviteLog] = useState<string | null>(null);

  // Custom Scenario States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCat, setNewCat] = useState('Communication');
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptA, setNewOptA] = useState('Answer choice A');
  const [newOptB, setNewOptB] = useState('Answer choice B');
  const [newOptC, setNewOptC] = useState('Answer choice C');
  const [newOptD, setNewOptD] = useState('Answer choice D');

  // Lobby Tab States: 'dilemmas' vs 'lobby'
  const [activeTab, setActiveTab] = useState<'dilemmas' | 'lobby'>('lobby');
  const [activeLobbyGame, setActiveLobbyGame] = useState<LobbyGame | null>(null);

  // Game 1: Tic Tac Toe state
  const [tttBoard, setTttBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<'X' | 'O'>('X');
  const [tttWinner, setTttWinner] = useState<string | null>(null);
  const [tttWins, setTttWins] = useState({ player: 2, opponent: 1 });

  // Game 2: Guess the Drawing state
  const [drawingPrompt] = useState('A cozy coffee mug');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [opponentGuess, setOpponentGuess] = useState<string | null>(null);
  const [submittingDrawing, setSubmittingDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<number>(4);

  // Game 3: Uno state
  const [unoHand, setUnoHand] = useState([
    { id: '1', color: '#D6336C', val: '7' },
    { id: '2', color: '#7C7AE6', val: 'Draw Two' },
    { id: '3', color: '#1C1C1E', val: 'Skip' },
    { id: '4', color: '#7C7AE6', val: '3' }
  ]);
  const [unoDiscard, setUnoDiscard] = useState({ color: '#D6336C', val: '5' });
  const [unoLog, setUnoLog] = useState('Select a matching color or value card from your hand deck.');

  // Game 4: Never Have I Ever state
  const [nhieIndex, setNhieIndex] = useState(0);
  const nhiePrompts = [
    "Never have I ever got a tattoo on a spontaneous road trip dare.",
    "Never have I ever ordered dessert first at a quiet candlelit dinner.",
    "Never have I ever read the last page of a fiction novel first."
  ];
  const [nhieAnswered, setNhieAnswered] = useState<string | null>(null);

  // Game 5: Would You Rather state
  const [wyrIndex, setWyrIndex] = useState(0);
  const wyrPrompts = [
    { q: "Would you rather...", a: "Always plan a weekend itinerary down to the hour", b: "Wander around a completely new city with zero agenda" },
    { q: "Would you rather...", a: "Spend a Friday night hosting a cozy board game dinner", b: "Go out to a high-intensity concert and dance venue" }
  ];
  const [wyrAnswered, setWyrAnswered] = useState<'A' | 'B' | null>(null);

  const fetchGamesData = useCallback(async (userId: string) => {
    try {
      const matchesRes = await fetch(`/api/matches?userId=${userId}`);
      const matchesData = await matchesRes.json();
      if (matchesData.success) {
        const mappedMatches = matchesData.recommendations.map((rec: MatchRecommendation) => ({
          id: rec.id,
          name: rec.name,
          avatar: rec.profile.avatar,
          gender: rec.profile.gender,
          age: rec.profile.age
        }));
        setMatches(mappedMatches);
        
        const paramMatchId = searchParams.get('matchId');
        if (!paramMatchId && mappedMatches.length > 0) {
          setActiveMatchId(mappedMatches[0].id);
        }
      }

      const res = await fetch(`/api/games?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setScenarios(data.scenarios);
        setUserAnswers(data.userAnswers);
        if (data.scenarios.length > 0) {
          setActiveScenarioId(data.scenarios[0].id);
        }
      }
    } catch (e) {
      console.error("Games Room retrieval error:", e);
    }
  }, [searchParams]);

  useEffect(() => {
    const userString = localStorage.getItem('vibe_user');
    if (!userString) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(userString);
    setCurrentUser(parsedUser);
    
    const paramMatchId = searchParams.get('matchId');
    if (paramMatchId) {
      setActiveMatchId(paramMatchId);
    }
    
    fetchGamesData(parsedUser.id);
  }, [fetchGamesData, router, searchParams]);

  const handleSendInvite = (opponentName: string, id: string) => {
    const shortKey = id.includes('maya') ? 'maya' : id.includes('liam') ? 'liam' : id.includes('chloe') ? 'chloe' : 'marcus';
    setInvitedMatches(prev => ({ ...prev, [shortKey]: 'invited' }));
    setInviteLog(`[ SIMULATION: Play invitation successfully dispatched to ${opponentName.split(' ')[0]}! ]`);
    setTimeout(() => {
      setInviteLog(null);
    }, 4000);
  };

  const getOpponentStatusLabel = (name: string, id: string) => {
    const shortKey = id.includes('maya') ? 'maya' : id.includes('liam') ? 'liam' : id.includes('chloe') ? 'chloe' : 'marcus';
    const status = invitedMatches[shortKey] || 'ready';
    if (status === 'invited') return 'INVITED';
    if (status === 'playing') return 'IN PLAY';
    if (status === 'offline') return 'OFFLINE';
    return 'ONLINE';
  };

  const handleCreateScenario = async () => {
    if (!newQuestion.trim()) {
      alert("Please enter a question.");
      return;
    }
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          optionA: newOptA,
          optionB: newOptB,
          optionC: newOptC,
          optionD: newOptD,
          category: newCat
        })
      });
      const data = await res.json();
      if (data.success) {
        setScenarios([...scenarios, data.scenario]);
        setActiveScenarioId(data.scenario.id);
        setShowCreateModal(false);
        setNewQuestion('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectOption = async (scenarioId: string, choice: string) => {
    if (!currentUser || submitting) return;
    setSubmitting(scenarioId);

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          scenarioId,
          optionChoice: choice
        })
      });
      const data = await res.json();
      if (data.success) {
        const updatedAnswers = [...userAnswers.filter(a => a.scenarioId !== scenarioId), data.answer];
        setUserAnswers(updatedAnswers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(null);
    }
  };

  const getChoiceDistribution = (category: string) => {
    const base = seedChoices[category];
    if (base) return base;
    return {
      A: "Liam O'Connor",
      B: "Maya Lin",
      C: "Chloe Vance",
      D: "Marcus Aurelius"
    };
  };

  // Game 1: Tic Tac Toe handlers
  const handlePlayCell = (idx: number) => {
    if (tttBoard[idx] || tttWinner || tttTurn === 'O') return;
    const newBoard = [...tttBoard];
    newBoard[idx] = 'X';
    setTttBoard(newBoard);
    
    const win = checkTttWinner(newBoard);
    if (win) {
      setTttWinner(win);
      if (win === 'X') setTttWins(prev => ({ ...prev, player: prev.player + 1 }));
      return;
    }

    setTttTurn('O');
    setTimeout(() => {
      const emptyIndices = newBoard.map((val, index) => val === null ? index : null).filter(val => val !== null) as number[];
      if (emptyIndices.length > 0) {
        const randomCell = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        const opponentBoard = newBoard.map((cell, cellIndex) => cellIndex === randomCell ? 'O' : cell);
        setTttBoard(opponentBoard);
        const nextWin = checkTttWinner(opponentBoard);
        if (nextWin) {
          setTttWinner(nextWin);
          if (nextWin === 'O') setTttWins(prev => ({ ...prev, opponent: prev.opponent + 1 }));
        }
      }
      setTttTurn('X');
    }, 800);
  };

  const checkTttWinner = (board: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every(cell => cell !== null)) return 'Draw';
    return null;
  };

  // Game 2: Guess the Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#D6336C'; // Primary red ink brush
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const submitDrawing = () => {
    setSubmittingDrawing(true);
    setTimeout(() => {
      setSubmittingDrawing(false);
      const activeMatchName = activeOpponent ? activeOpponent.name.split(' ')[0] : 'Opponent';
      setOpponentGuess(`Is that a cozy coffee mug by ${activeMatchName}?`);
    }, 1500);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setOpponentGuess(null);
  };

  // Game 3: Uno handlers
  const playUnoCard = (id: string, color: string, val: string) => {
    if (color !== unoDiscard.color && val !== unoDiscard.val) {
      setUnoLog('Invalid card! Discard pile must match color or value.');
      return;
    }
    setUnoDiscard({ color, val });
    setUnoHand(prev => prev.filter(c => c.id !== id));
    
    const opponentName = activeOpponent ? activeOpponent.name.split(' ')[0] : 'Partner';
    setUnoLog(`You discarded ${val}. ${opponentName} is thinking...`);
    
    setTimeout(() => {
      setUnoLog(`${opponentName} played skip card. Discard stack matches.`);
      setUnoDiscard({ color: '#7C7AE6', val: 'Skip' });
    }, 1200);
  };

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

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);
  const currentAnswer = userAnswers.find(a => a.scenarioId === activeScenarioId);
  const activeOpponent = matches.find(m => m.id === activeMatchId);

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-bg-light py-8 px-4 sm:px-6 lg:px-8 text-dark font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Playroom Header */}
        {!activeLobbyGame && (
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 border border-hairline">
            <div>
              <h1 className="text-xl font-black text-dark uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-headline)' }}>
                <Gamepad2 className="w-6 h-6 text-primary" />
                Scenario Playroom
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ROS Arena Lounge • {activeTab === 'lobby' ? 'Interactive Games' : 'Daily Dilemmas'}</p>
            </div>
            
            <div className="flex gap-2 bg-bg-light p-1 border border-hairline self-start">
              <button
                onClick={() => setActiveTab('dilemmas')}
                className={`px-4 py-2 text-[10px] font-black uppercase transition-all cursor-pointer ${
                  activeTab === 'dilemmas' 
                    ? 'bg-primary text-white border border-primary' 
                    : 'text-gray-500 hover:text-dark'
                }`}
              >
                Daily Dilemmas
              </button>
              <button
                onClick={() => { setActiveTab('lobby'); setActiveLobbyGame(null); }}
                className={`px-4 py-2 text-[10px] font-black uppercase transition-all cursor-pointer ${
                  activeTab === 'lobby' 
                    ? 'bg-primary text-white border border-primary' 
                    : 'text-gray-500 hover:text-dark'
                }`}
              >
                Interactive Games
              </button>
            </div>
          </header>
        )}

        {/* OPPONENT SELECTOR BANNER & INVITE (Connects play with matched users) */}
        {!activeLobbyGame && matches.length > 0 && (
          <div className="bg-white p-4 border border-hairline flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-1.5 flex-none">
                <User className="w-4 h-4 text-secondary" />
                Play Opponent:
              </span>
              
              {/* Invite button */}
              {activeOpponent && (
                <button
                  onClick={() => handleSendInvite(activeOpponent.name, activeOpponent.id)}
                  className="px-2.5 py-1 bg-[#FAF9F5] border border-hairline hover:bg-gray-100 text-dark font-black uppercase text-[8px] tracking-wider cursor-pointer flex items-center gap-1 font-mono"
                >
                  <MailCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Invite to Play</span>
                </button>
              )}
            </div>

            <div className="flex gap-2.5 overflow-x-auto w-full justify-start sm:justify-end pb-1 sm:pb-0 scrollbar-none">
              {matches.map(m => {
                const statusLabel = getOpponentStatusLabel(m.name, m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveMatchId(m.id)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 border transition-all cursor-pointer ${
                      activeMatchId === m.id 
                        ? 'bg-secondary/10 border-secondary text-secondary font-black' 
                        : 'bg-white border-hairline text-gray-400 hover:text-dark hover:border-gray-400'
                    }`}
                  >
                    <div className="w-5 h-5 border border-hairline flex-none overflow-hidden" style={getAvatarStyle(m.avatar)} />
                    <div className="text-left flex flex-col">
                      <span className="text-[9px] uppercase font-bold leading-tight">{m.name.split(' ')[0]}</span>
                      <span className="text-[6.5px] font-mono font-black text-gray-400 leading-none">[{statusLabel}]</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live invitation simulator status notification */}
        {inviteLog && (
          <div className="bg-secondary/15 border border-secondary/20 p-3.5 text-center text-xs font-mono font-bold text-secondary animate-fadeIn">
            {inviteLog}
          </div>
        )}

        {/* TAB 1: DAILY DILEMMAS */}
        {activeTab === 'dilemmas' && !activeLobbyGame && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Dilemmas list sidebar */}
            <div className="bg-white border border-hairline p-5 space-y-4 lg:col-span-1">
              <div className="flex justify-between items-center pb-2 border-b border-hairline">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Dilemma List ({scenarios.length})
                </span>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="text-[9px] font-black uppercase text-primary tracking-wider hover:underline cursor-pointer border border-primary px-2 py-0.5 bg-primary/5"
                >
                  + Custom
                </button>
              </div>

              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {scenarios.map((item) => {
                  const answered = userAnswers.some(a => a.scenarioId === item.id);
                  const isActive = item.id === activeScenarioId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveScenarioId(item.id)}
                      className={`w-full text-left p-3 border transition-all flex justify-between items-center cursor-pointer ${
                        isActive
                          ? 'bg-secondary/10 border-secondary text-dark font-bold'
                          : 'bg-white border-hairline hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isActive ? 'text-dark font-black' : 'text-gray-700'}`}>{item.question}</p>
                        <span className="text-[8px] text-[#7C7AE6] font-black uppercase tracking-wider block mt-0.5">#{item.category}</span>
                      </div>
                      {answered && (
                        <CheckCircle2 className="w-4 h-4 text-success flex-none ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dilemma detail card */}
            <div className="lg:col-span-2 bg-white border border-hairline p-6 min-h-[440px] flex flex-col justify-between">
              {activeScenario ? (
                <div className="space-y-6 text-left">
                  
                  {/* Dilemma card header */}
                  <div className="space-y-2 pb-4 border-b border-hairline">
                    <span className="text-[10px] font-black uppercase text-[#7C7AE6] bg-[#7C7AE6]/10 border border-[#7C7AE6]/20 px-2.5 py-0.5 inline-block font-mono">
                      [ Dilemma quiz • Category: {activeScenario.category} ]
                    </span>
                    <h2 className="text-base font-bold text-dark leading-snug">
                      {activeScenario.question}
                    </h2>
                  </div>

                  {/* Dilemma Option list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {[
                      { key: 'A', text: activeScenario.optionA },
                      { key: 'B', text: activeScenario.optionB },
                      { key: 'C', text: activeScenario.optionC },
                      { key: 'D', text: activeScenario.optionD }
                    ].map((opt) => {
                      const isSelected = currentAnswer?.optionChoice === opt.key;
                      return (
                        <button
                          key={opt.key}
                          disabled={!!currentAnswer}
                          onClick={() => handleSelectOption(activeScenario.id, opt.key)}
                          className={`w-full text-left p-4 border transition-all flex gap-3 cursor-pointer items-center ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-sm font-black'
                              : currentAnswer
                              ? 'bg-gray-50 border-hairline opacity-50 cursor-not-allowed text-gray-400'
                              : 'bg-white border-hairline hover:border-secondary text-dark'
                          }`}
                        >
                          <span className={`w-5 h-5 flex items-center justify-center border text-[9px] font-bold ${
                            isSelected ? 'bg-white/20 border-white text-white' : 'bg-gray-100 border-hairline text-dark'
                          }`}>
                            {opt.key}
                          </span>
                          <span className="text-xs font-semibold leading-tight">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Comparison distribution block */}
                  {currentAnswer && (
                    <div className="bg-gray-50 border border-hairline p-4 space-y-3 animate-fadeIn">
                      <span className="text-[9px] font-black text-[#7C7AE6] uppercase tracking-widest block">
                        Match Alignment Distribution
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-semibold text-gray-500">
                        {Object.entries(getChoiceDistribution(activeScenario.category)).map(([choice, matches]) => (
                          <div key={choice} className="bg-white border border-hairline p-3">
                            <span className="font-bold text-dark uppercase block">Option {choice}</span>
                            <span className="text-[9px] text-[#7C7AE6] mt-1 block truncate">
                              {matches || "Nobody yet"}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-right">
                        ⚡ Shared responses boost your compatibility by up to 25%!
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Gamepad2 className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-xs text-gray-400 font-black uppercase">No Scenario Selected</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: INTERACTIVE GAMES LOBBY */}
        {activeTab === 'lobby' && (
          <div className="space-y-6">
            
            {/* LOBBY VIEW (When no game is active): 3-column Visual Grid Dashboard */}
            {!activeLobbyGame && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                {lobbyGames.map(game => (
                  <div 
                    key={game.id}
                    className="bg-white border border-hairline p-6 flex flex-col justify-between space-y-4 hover:border-primary transition-all group"
                  >
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5">
                          {game.tag}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-dark uppercase group-hover:text-primary transition-all tracking-wide">{game.name}</h3>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">{game.desc}</p>
                    </div>

                    <button
                      onClick={() => setActiveLobbyGame(game.id)}
                      className="w-full py-2 border border-gray-200 bg-transparent hover:bg-primary hover:border-primary hover:text-white text-dark text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5 font-mono"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>[ BOOT GAME CONSOLE ]</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* IMMERSIVE CENTERED GAME CONSOLE (Hides sidebar and lists when game is active) */}
            {activeLobbyGame && (
              <div className="max-w-xl mx-auto bg-white border border-hairline flex flex-col min-h-[480px] animate-scaleUp overflow-hidden shadow-sm relative">
                
                {/* HUD Top Bar showing opposing players */}
                <div className="bg-gray-50 px-6 py-4 border-b border-hairline flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    {/* User HUD Block */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border border-hairline bg-primary text-white flex items-center justify-center text-[10px] font-black font-mono">
                        P1
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-dark font-mono">You</span>
                    </div>

                    {/* LIVE SCOREBOARD */}
                    <div className="flex items-center gap-1.5 bg-white border border-hairline px-3 py-1 font-mono text-[9px] font-black text-secondary">
                      <Trophy className="w-3.5 h-3.5 text-secondary flex-none" />
                      {activeLobbyGame === 'tictactoe' && (
                        <span>YOU {tttWins.player} - {tttWins.opponent} {activeOpponent ? activeOpponent.name.split(' ')[0].toUpperCase() : 'PARTNER'}</span>
                      )}
                      {activeLobbyGame !== 'tictactoe' && (
                        <span>ACTIVE GAMES MATCH</span>
                      )}
                    </div>

                    {/* Opponent HUD Block */}
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 border border-hairline flex items-center justify-center overflow-hidden flex-none" 
                        style={getAvatarStyle(activeOpponent ? activeOpponent.avatar : '')} 
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary truncate max-w-[80px] font-mono">
                        {activeOpponent ? activeOpponent.name.split(' ')[0].toUpperCase() : 'PARTNER'}
                      </span>
                    </div>
                  </div>

                  {/* Back to lobby exit button */}
                  <button
                    onClick={() => setActiveLobbyGame(null)}
                    className="p-1 border border-hairline bg-white hover:bg-gray-50 text-gray-400 hover:text-dark cursor-pointer rounded-none"
                    title="Exit Game"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* GAME 1: TIC TAC TOE CONSOLE */}
                {activeLobbyGame === 'tictactoe' && (
                  <div className="p-8 flex flex-col items-center justify-center space-y-6 flex-1">
                    <div className="text-center space-y-1">
                      <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">Tic Tac Toe Arena</span>
                      <p className="text-xs font-bold text-[#7C7AE6] uppercase font-mono tracking-wider">
                        {tttWinner ? `GAME OVER` : tttTurn === 'X' ? 'YOUR TURN (X)' : 'OPPONENT THINKING (O)...'}
                      </p>
                    </div>

                    {/* Board Grid */}
                    <div className="grid grid-cols-3 gap-2 w-48 h-48 my-4 bg-gray-50 p-2 border border-hairline">
                      {tttBoard.map((cell, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePlayCell(idx)}
                          disabled={!!cell || !!tttWinner || tttTurn === 'O'}
                          className="w-full h-full border border-hairline bg-white hover:bg-secondary/5 flex items-center justify-center text-lg font-mono font-black disabled:bg-opacity-50 cursor-pointer transition-all"
                        >
                          {cell === 'X' && (
                            <span className="text-[#D6336C] drop-shadow-[0_0_8px_rgba(214,51,108,0.2)]">X</span>
                          )}
                          {cell === 'O' && (
                            <span className="text-[#7C7AE6] drop-shadow-[0_0_8px_rgba(124,122,230,0.2)]">O</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Console HUD status / Reset */}
                    <div className="text-center space-y-4 w-full">
                      {tttWinner && (
                        <div className="border border-primary/20 bg-primary/5 px-6 py-2 text-xs font-black uppercase tracking-wider text-primary animate-fadeIn">
                          {tttWinner === 'Draw' ? 'Match Tied!' : `Winner: ${tttWinner === 'X' ? 'You' : (activeOpponent ? activeOpponent.name.split(' ')[0] : 'Partner')}`}
                        </div>
                      )}
                      
                      <button
                        onClick={() => { setTttBoard(Array(9).fill(null)); setTttWinner(null); setTttTurn('X'); }}
                        className="px-6 py-2.5 bg-primary border border-primary text-white font-black uppercase text-[10px] tracking-wider cursor-pointer"
                      >
                        Reset Board
                      </button>
                    </div>
                  </div>
                )}

                {/* GAME 2: GUESS THE DRAWING CONSOLE */}
                {activeLobbyGame === 'drawing' && (
                  <div className="p-6 flex flex-col items-center justify-center space-y-5 flex-1">
                    <div className="text-center space-y-1">
                      <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">Digital Canvas Crayon</span>
                      <p className="text-xs font-bold text-dark uppercase tracking-wide">Prompt: Draw "{drawingPrompt}"</p>
                    </div>

                    {/* Canvas Panel */}
                    <div className="my-2 border border-hairline bg-gray-50 p-1 flex items-center justify-center">
                      <canvas
                        ref={canvasRef}
                        width={280}
                        height={200}
                        className="bg-white cursor-crosshair border border-hairline shadow-inner"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={() => setIsDrawing(false)}
                        onMouseLeave={() => setIsDrawing(false)}
                      />
                    </div>

                    {/* Brush Size Selectors */}
                    <div className="flex gap-2 items-center font-mono text-[9px] font-black uppercase text-gray-400">
                      <span>Brush size:</span>
                      {[2, 4, 7, 10].map(sz => (
                        <button
                          key={sz}
                          onClick={() => setBrushSize(sz)}
                          className={`w-5 h-5 border cursor-pointer flex items-center justify-center text-[8px] ${
                            brushSize === sz ? 'bg-primary border-primary text-white font-bold' : 'bg-white border-hairline text-gray-400'
                          }`}
                        >
                          {sz}px
                        </button>
                      ))}
                    </div>

                    <div className="w-full max-w-sm space-y-4">
                      {opponentGuess && (
                        <div className="bg-[#7C7AE6]/10 border border-[#7C7AE6]/20 p-3.5 text-xs font-semibold text-secondary animate-fadeIn text-center italic">
                          "{opponentGuess}"
                        </div>
                      )}

                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={clearCanvas}
                          className="px-5 py-2.5 border border-hairline bg-white hover:bg-gray-50 text-dark font-black uppercase text-[10px] tracking-wider cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          onClick={submitDrawing}
                          disabled={submittingDrawing}
                          className="px-6 py-2.5 bg-primary border border-primary text-white font-black uppercase text-[10px] tracking-wider cursor-pointer"
                        >
                          {submittingDrawing ? 'Sending...' : 'Send Drawing'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* GAME 3: UNO CONSOLE */}
                {activeLobbyGame === 'uno' && (
                  <div className="p-6 flex flex-col items-center justify-center space-y-6 flex-1 text-center">
                    <div className="text-center space-y-1">
                      <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">Discard Pile Match</span>
                    </div>

                    {/* Table discard deck */}
                    <div className="flex gap-6 items-center my-2 justify-center bg-gray-50 p-6 border border-hairline w-full max-w-xs">
                      <div>
                        <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest block mb-1.5">Discard Deck</span>
                        <div 
                          className="w-16 h-24 border border-white/10 flex flex-col justify-center items-center font-mono font-bold text-white uppercase text-xs shadow-sm"
                          style={{ backgroundColor: unoDiscard.color }}
                        >
                          <span>{unoDiscard.val}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full space-y-4 max-w-md">
                      <div className="bg-gray-50 border border-hairline p-3 text-[10px] font-mono text-gray-400">
                        STATUS: {unoLog}
                      </div>

                      {/* User Deck Hand */}
                      <div className="space-y-2">
                        <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest block">Your Card Hand</span>
                        <div className="flex gap-2.5 justify-center">
                          {unoHand.map(card => (
                            <button
                              key={card.id}
                              onClick={() => playUnoCard(card.id, card.color, card.val)}
                              className="w-12 h-20 border border-white/10 hover:-translate-y-1.5 transition-all flex flex-col justify-between p-2 font-mono text-[9px] text-white uppercase font-bold cursor-pointer shadow-sm"
                              style={{ backgroundColor: card.color }}
                            >
                              <span>{card.val}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GAME 4: NEVER HAVE I EVER CONSOLE */}
                {activeLobbyGame === 'never-ever' && (
                  <div className="p-8 flex flex-col justify-between items-center flex-1 text-center min-h-[380px]">
                    <div className="space-y-1 w-full border-b border-hairline pb-2">
                      <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">Never Have I Ever Lounge</span>
                      <p className="text-xs text-[#7C7AE6] font-bold font-mono">Topic {nhieIndex + 1} of {nhiePrompts.length}</p>
                    </div>

                    <div className="my-6 px-4 max-w-sm">
                      <p className="text-sm font-bold text-dark leading-relaxed italic">
                        "{nhiePrompts[nhieIndex]}"
                      </p>
                    </div>

                    <div className="w-full space-y-4">
                      {nhieAnswered && (
                        <div className="bg-[#7C7AE6]/10 border border-[#7C7AE6]/20 p-3.5 text-xs font-semibold text-secondary animate-fadeIn text-center">
                          You answered: {nhieAnswered}! Opponent answered: NO.
                        </div>
                      )}

                      <div className="flex gap-2.5 justify-center">
                        <button
                          onClick={() => setNhieAnswered('I have')}
                          className="px-6 py-2.5 bg-primary border border-primary text-white font-black uppercase text-[10px] tracking-wider cursor-pointer"
                        >
                          I have done this
                        </button>
                        <button
                          onClick={() => setNhieAnswered('Never')}
                          className="px-6 py-2.5 border border-hairline bg-white hover:bg-gray-50 text-dark font-black uppercase text-[10px] tracking-wider cursor-pointer"
                        >
                          Never
                        </button>
                      </div>

                      <div className="text-center pt-2">
                        <button
                          onClick={() => {
                            setNhieAnswered(null);
                            setNhieIndex(prev => (prev < nhiePrompts.length - 1 ? prev + 1 : 0));
                          }}
                          className="text-[9px] font-black text-[#7C7AE6] hover:underline uppercase tracking-widest flex items-center gap-1 mx-auto justify-center"
                        >
                          <span>Next Prompt</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* GAME 5: WOULD YOU RATHER CONSOLE */}
                {activeLobbyGame === 'would-rather' && (
                  <div className="p-8 flex flex-col justify-between items-center flex-1 text-center min-h-[380px]">
                    <div className="space-y-1 w-full border-b border-hairline pb-2">
                      <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">Would You Rather Compare</span>
                      <p className="text-xs text-[#7C7AE6] font-bold font-mono">Choice {wyrIndex + 1} of {wyrPrompts.length}</p>
                    </div>

                    <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <button
                        onClick={() => setWyrAnswered('A')}
                        className={`p-6 border text-xs font-bold text-center cursor-pointer transition-all ${
                          wyrAnswered === 'A'
                            ? 'bg-primary text-white border-primary shadow-sm font-black'
                            : 'bg-white border-hairline hover:bg-gray-50 text-dark'
                        }`}
                      >
                        {wyrPrompts[wyrIndex].a}
                      </button>
                      <button
                        onClick={() => setWyrAnswered('B')}
                        className={`p-6 border text-xs font-bold text-center cursor-pointer transition-all ${
                          wyrAnswered === 'B'
                            ? 'bg-primary text-white border-primary shadow-sm font-black'
                            : 'bg-white border-hairline hover:bg-gray-50 text-dark'
                        }`}
                      >
                        {wyrPrompts[wyrIndex].b}
                      </button>
                    </div>

                    <div className="w-full space-y-4">
                      {wyrAnswered && (
                        <div className="bg-gray-50 border border-hairline p-3 text-[10px] font-semibold text-gray-500 animate-fadeIn">
                          Answer registered! You share this selection with 74% of compatible players.
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setWyrAnswered(null);
                          setWyrIndex(prev => (prev < wyrPrompts.length - 1 ? prev + 1 : 0));
                        }}
                        className="text-[9px] font-black text-[#7C7AE6] hover:underline uppercase tracking-widest flex items-center gap-1 mx-auto justify-center"
                      >
                        <span>Next Choice</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}
      </div>

      {/* Custom Scenario Creation Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-dark/60 flex items-center justify-center p-6 z-50 animate-fadeIn font-sans">
          <div className="bg-white border border-hairline p-8 max-w-md w-full space-y-6 animate-scaleUp">
            <div>
              <h2 className="text-base font-bold text-dark uppercase tracking-wider" style={{ fontFamily: 'var(--font-headline)' }}>Create Custom Scenario</h2>
              <p className="text-[9px] text-[#7C7AE6] font-bold uppercase tracking-widest mt-1">Add a behavioral dilemma to the playroom</p>
            </div>
            
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Category</label>
                <select 
                  value={newCat} 
                  onChange={e => setNewCat(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-hairline bg-white text-xs font-semibold text-dark focus:outline-none focus:border-primary"
                >
                  <option>Communication</option>
                  <option>Life Pace</option>
                  <option>Conflict Resolution</option>
                  <option>Values</option>
                  <option>Social Battery</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Dilemma Question</label>
                <textarea 
                  value={newQuestion} 
                  onChange={e => setNewQuestion(e.target.value)} 
                  placeholder="e.g. How do you behave if you are unexpectedly late to see your match?"
                  className="w-full px-4 py-2.5 border border-hairline bg-gray-50 text-xs font-semibold text-dark focus:outline-none focus:border-primary resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Option A</label>
                  <input type="text" value={newOptA} onChange={e => setNewOptA(e.target.value)} className="w-full px-3 py-1.5 border border-hairline bg-white text-xs text-dark" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Option B</label>
                  <input type="text" value={newOptB} onChange={e => setNewOptB(e.target.value)} className="w-full px-3 py-1.5 border border-hairline bg-white text-xs text-dark" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Option C</label>
                  <input type="text" value={newOptC} onChange={e => setNewOptC(e.target.value)} className="w-full px-3 py-1.5 border border-hairline bg-white text-xs text-dark" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Option D</label>
                  <input type="text" value={newOptD} onChange={e => setNewOptD(e.target.value)} className="w-full px-3 py-1.5 border border-hairline bg-white text-xs text-dark" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleCreateScenario}
                className="flex-1 py-3 bg-primary border border-primary text-white font-black uppercase text-[10px] tracking-wider cursor-pointer"
              >
                Save Scenario
              </button>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-3 bg-white border border-hairline text-dark hover:bg-gray-100 font-black uppercase text-[10px] tracking-wider cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
