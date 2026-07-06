'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Next.js standard router import
import { Heart, X, Check, BarChart3, AlertCircle, Sparkles, Compass, Shuffle, MapPin, MessageCircle, User } from 'lucide-react';
import { VibeGraph, VibeDimensions } from '@/components/ui/VibeGraph';

interface MatchItem {
  id: string;
  name: string;
  profile: {
    age: number;
    bio: string;
    avatar: string;
    interests: string; // JSON string array
    gender: string;
  };
  vibe: {
    score: number;
    similarity: number;
    complementarity: number;
    breakdown: {
      communication: number;
      humor: number;
      curiosity: number;
      adventure: number;
      openness: number;
      lifestyle: number;
      values: number;
      energy: number;
      conflict: number;
      spontaneity: number;
      gamesMatch: number;
    };
    sharedScenariosCount: number;
    vibeAnalysis: string;
  };
}

export default function Feed() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [currentUserSurvey, setCurrentUserSurvey] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeMode, setHomeMode] = useState<'curated' | 'browse' | 'surprise'>('curated');
  const [browseFilter, setBrowseFilter] = useState<'all' | 'similar' | 'opposite'>('all');
  const [showMatchModal, setShowMatchModal] = useState<MatchItem | null>(null);

  // Profile Details Overlay States
  const [selectedProfileDetail, setSelectedProfileDetail] = useState<MatchItem | null>(null);
  const [activePhoto, setActivePhoto] = useState<string>('');

  // Active indices for curated swiper
  const [curatedIndex, setCuratedIndex] = useState(0);

  useEffect(() => {
    const userString = localStorage.getItem('vibe_user');
    if (!userString) {
      router.push('/');
      return;
    }
    
    const parsedUser = JSON.parse(userString);
    setCurrentUser(parsedUser);
    fetchRecommendations(parsedUser.id);
  }, []);

  useEffect(() => {
    if (selectedProfileDetail) {
      setActivePhoto(selectedProfileDetail.profile.avatar);
    } else {
      setActivePhoto('');
    }
  }, [selectedProfileDetail]);

  const fetchRecommendations = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations);
        setCurrentUserSurvey(data.currentUserSurvey);
      }
    } catch (e) {
      console.error("Error fetching matches:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: 'like' | 'pass', matchItem: MatchItem) => {
    if (action === 'like') {
      setShowMatchModal(matchItem);
    } else {
      if (homeMode === 'curated') {
        goToNextCurated();
      }
    }
  };

  const goToNextCurated = () => {
    if (curatedIndex < recommendations.slice(0, 3).length - 1) {
      setCuratedIndex(prev => prev + 1);
    } else {
      setCuratedIndex(0);
    }
  };

  const closeMatchModal = () => {
    setShowMatchModal(null);
    if (homeMode === 'curated') {
      goToNextCurated();
    }
  };

  const startChatting = (matchId: string) => {
    router.push(`/chat?matchId=${matchId}`);
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

  const getProfilePhotosList = (name: string, mainAvatar: string) => {
    const list = [mainAvatar];
    if (name.includes('Maya')) list.push('/maya_1.png', '/maya_2.png');
    else if (name.includes('Liam')) list.push('/liam_1.png', '/liam_2.png');
    else if (name.includes('Chloe')) list.push('/chloe_1.png', '/chloe_2.png');
    else if (name.includes('Marcus')) list.push('/marcus_1.png', '/marcus_2.png');
    return list;
  };

  const mapSurveyToVibeDimensions = (survey: any): VibeDimensions => {
    return {
      communication: survey?.communication || 3,
      humor: survey?.humorType || 3,
      curiosity: survey?.curiosity || 3,
      adventure: survey?.adventure || 3,
      openness: survey?.openness || 3,
      lifestyle: survey?.lifePace || 3,
      values: survey?.valuesScale || 3,
      energy: survey?.socialBattery || 3,
      conflict: survey?.conflictRes || 3,
      spontaneity: survey?.spontaneity || 3,
    };
  };

  const mapBreakdownToVibeDimensions = (breakdown: any): VibeDimensions => {
    return {
      communication: Math.round(breakdown?.communication / 20) || 3,
      humor: Math.round(breakdown?.humor / 20) || 3,
      curiosity: Math.round(breakdown?.curiosity / 20) || 3,
      adventure: Math.round(breakdown?.adventure / 20) || 3,
      openness: Math.round(breakdown?.openness / 20) || 3,
      lifestyle: Math.round(breakdown?.lifestyle / 20) || 3,
      values: Math.round(breakdown?.values / 20) || 3,
      energy: Math.round(breakdown?.energy / 20) || 3,
      conflict: Math.round(breakdown?.conflict / 20) || 3,
      spontaneity: Math.round(breakdown?.spontaneity / 20) || 3,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-bg-light font-sans">
        <div className="px-6 py-4 border border-hairline bg-white font-black text-xs uppercase tracking-widest animate-pulse">
          Calculating compatibilities...
        </div>
      </div>
    );
  }

  // Curated Picks
  const curatedPicks = recommendations.slice(0, 3);
  const currentCuratedMatch = curatedPicks[curatedIndex];

  // Wildcard Surprise Match
  const surpriseMatch = recommendations.length > 3 ? recommendations[recommendations.length - 1] : null;

  // Browse Directory Filtering
  const browsePicks = recommendations.filter(rec => {
    if (browseFilter === 'similar') return rec.vibe.similarity >= 70;
    if (browseFilter === 'opposite') return rec.vibe.complementarity >= 70;
    return true;
  });

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-bg-light py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ROS Header switcher */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 border border-hairline">
          <div>
            <h1 className="text-xl font-black text-dark uppercase tracking-wide" style={{ fontFamily: 'var(--font-headline)' }}>Discovery Desk</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">ROS Discovery Mode: {homeMode}</p>
          </div>
          
          <div className="flex gap-2 bg-bg-light p-1 border border-hairline self-start">
            {[
              { id: 'curated', label: 'Today\'s AI Picks' },
              { id: 'browse', label: 'People Nearby' },
              { id: 'surprise', label: 'Surprise Me' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setHomeMode(tab.id as any)}
                className={`px-4 py-2 text-[10px] font-black uppercase transition-all cursor-pointer ${
                  homeMode === tab.id 
                    ? 'bg-primary text-white border border-primary' 
                    : 'text-gray-500 hover:text-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* 1. Curated AI Picks View */}
        {homeMode === 'curated' && (
          <div className="space-y-6 animate-fadeIn">
            {currentCuratedMatch ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                
                {/* Left Card: Match details */}
                <div className="bg-white border border-hairline p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-4 flex-1">
                    
                    {/* Visual Card Header */}
                    <div 
                      className="w-full h-64 border border-hairline relative overflow-hidden bg-gray-50 flex items-center justify-center"
                      style={getAvatarStyle(currentCuratedMatch.profile.avatar)}
                    />

                    {/* View Images Overlay Button */}
                    <button
                      onClick={() => setSelectedProfileDetail(currentCuratedMatch)}
                      className="w-full py-2.5 border border-hairline bg-white hover:bg-gray-50 text-dark font-black uppercase text-[10px] tracking-wider cursor-pointer text-center"
                    >
                      View Images
                    </button>

                    <div className="flex justify-between items-baseline pt-1">
                      <h2 className="text-xl font-black uppercase text-dark tracking-tight">
                        {currentCuratedMatch.name} <span className="text-xs font-normal text-gray-400">({currentCuratedMatch.profile.age} Y/O)</span>
                      </h2>
                      <span className="text-[10px] font-black uppercase text-secondary tracking-widest bg-secondary/10 px-2 py-0.5 border border-secondary/20 flex-none">
                        {currentCuratedMatch.profile.gender}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      {currentCuratedMatch.profile.bio}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {JSON.parse(currentCuratedMatch.profile.interests).map((tag: string) => (
                        <span key={tag} className="text-[9px] font-black uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 border border-hairline">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Card: The Vibe Graph visualizer + Scores + Actions */}
                <div className="bg-white border border-hairline p-6 flex flex-col items-center justify-between space-y-6">
                  
                  {/* Radar Graph Title */}
                  <div className="w-full text-center pb-2 border-b border-hairline">
                    <span className="text-[10px] font-black uppercase text-dark tracking-widest block">
                      Compatibility Radar map
                    </span>
                  </div>

                  {/* Fluid Radar Graph */}
                  {currentUserSurvey && (
                    <div className="py-2 flex justify-center w-full max-w-[220px]">
                      <VibeGraph 
                        scores={mapSurveyToVibeDimensions(currentUserSurvey)}
                        comparisonScores={mapBreakdownToVibeDimensions(currentCuratedMatch.vibe.breakdown)}
                        userName="You"
                        comparisonName={currentCuratedMatch.name.split(' ')[0]}
                        size={200}
                      />
                    </div>
                  )}

                  {/* Compatibility percentages located under radar graph */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="border border-hairline p-3 bg-gray-50/50 text-center">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Similarity</span>
                      <span className="text-lg font-black text-secondary">{currentCuratedMatch.vibe.score}%</span>
                    </div>
                    <div className="border border-hairline p-3 bg-gray-50/50 text-center">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Complementary</span>
                      <span className="text-lg font-black text-primary">{currentCuratedMatch.vibe.complementarity}%</span>
                    </div>
                  </div>

                  {/* Match Analysis Paragraph */}
                  <div className="w-full bg-secondary/5 border border-secondary/15 p-3.5 text-left flex-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-secondary flex items-center gap-1 mb-1">
                      <Sparkles className="w-3.5 h-3.5 fill-secondary text-secondary" />
                      AI Match Analysis
                    </span>
                    <p className="text-xs text-gray-600 font-semibold italic leading-relaxed">
                      "{currentCuratedMatch.vibe.vibeAnalysis}"
                    </p>
                  </div>

                  {/* Curated picks actions moved under compatibility panel */}
                  <div className="flex gap-2.5 w-full pt-4 border-t border-hairline flex-none">
                    <button
                      onClick={() => handleAction('pass', currentCuratedMatch)}
                      className="flex-1 py-3 border border-hairline bg-white hover:bg-gray-50 text-dark font-black uppercase text-[10px] tracking-wider cursor-pointer"
                    >
                      Skip pick
                    </button>
                    <button
                      onClick={() => handleAction('like', currentCuratedMatch)}
                      className="flex-1 py-3 border border-primary bg-primary text-white font-black uppercase text-[10px] tracking-wider cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white border border-hairline p-12 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-secondary mx-auto" />
                <h3 className="text-sm font-black uppercase text-dark">No Curated Picks left</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto uppercase">
                  Our discovery engine updates daily recommendations. Browse nearby users or test wildcard compatibility routes!
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. Browse Directory View */}
        {homeMode === 'browse' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Filter tags header */}
            <div className="flex justify-between items-center bg-white p-4 border border-hairline">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Browse Nearby ({browsePicks.length})
              </span>
              <div className="flex gap-2 bg-bg-light p-1 border border-hairline text-[9px] font-black uppercase tracking-wider">
                {[
                  { id: 'all', label: 'All Users' },
                  { id: 'similar', label: 'Similar Vibe' },
                  { id: 'opposite', label: 'Opposite Vibe' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setBrowseFilter(f.id as any)}
                    className={`px-3 py-1 cursor-pointer ${
                      browseFilter === f.id ? 'bg-white border border-hairline font-black text-dark' : 'text-gray-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid list */}
            {browsePicks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {browsePicks.map(rec => (
                  <div key={rec.id} className="bg-white border border-hairline p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex gap-3 items-center">
                        <div 
                          className="w-10 h-10 border border-hairline flex items-center justify-center text-white text-sm font-black flex-none overflow-hidden"
                          style={getAvatarStyle(rec.profile.avatar)}
                        />
                        <div>
                          <h3 className="text-sm font-black uppercase text-dark">{rec.name}</h3>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{rec.profile.gender} • Age {rec.profile.age}</span>
                        </div>
                        <div className="ml-auto bg-secondary/10 border border-secondary/20 px-2 py-0.5 text-[9px] font-black text-secondary">
                          {rec.vibe.score}% VIBE
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {rec.profile.bio}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-hairline justify-between items-center">
                      <button
                        onClick={() => setSelectedProfileDetail(rec)}
                        className="text-[9px] font-black text-secondary uppercase tracking-wider hover:underline cursor-pointer"
                      >
                        View images
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction('like', rec)}
                          className="px-3.5 py-1.5 bg-primary text-white border border-primary text-[9px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Play First
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-hairline p-12 text-center">
                <AlertCircle className="w-10 h-10 text-secondary mx-auto mb-3" />
                <p className="text-xs text-gray-400 uppercase font-black tracking-wider">No matching profiles found for this filter.</p>
              </div>
            )}

          </div>
        )}

        {/* 3. Surprise Me Wildcard View */}
        {homeMode === 'surprise' && (
          <div className="space-y-6 animate-fadeIn">
            {surpriseMatch ? (
              <div className="bg-white border border-hairline p-8 text-center max-w-md mx-auto space-y-6">
                <div className="inline-flex items-center gap-1 bg-accent/10 border border-accent/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-accent mx-auto">
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Today's Wildcard Pick</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold uppercase tracking-tight text-dark" style={{ fontFamily: 'var(--font-headline)' }}>Wildcard Scenario</h2>
                  <p className="text-xs text-gray-400 leading-relaxed uppercase">
                    This match lies outside your stated search parameters. We mask photos and names until you compare a dilemma scenario together!
                  </p>
                </div>

                {/* Covered Avatar block */}
                <div className="w-24 h-24 bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-gray-300" />
                </div>

                <div className="bg-gray-50 border border-hairline p-4 text-left space-y-2">
                  <span className="text-[9px] font-black uppercase text-secondary tracking-widest block">Compatibility Hint</span>
                  <p className="text-xs text-gray-600 font-semibold italic">
                    "This person has highly structured daily lifestyle tempos, but they prefer playful, dry humor languages just like you."
                  </p>
                </div>

                <button 
                  onClick={() => handleAction('like', surpriseMatch)}
                  className="w-full py-3.5 bg-primary border border-primary text-white font-black uppercase text-xs tracking-wider cursor-pointer"
                >
                  Reveal Wildcard Profile
                </button>
              </div>
            ) : (
              <div className="bg-white border border-hairline p-12 text-center">
                <AlertCircle className="w-10 h-10 text-secondary mx-auto mb-3" />
                <p className="text-xs text-gray-400 uppercase font-black tracking-wider">No wildcard picks available for today.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Match modal overlay */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-dark/60 flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-white border border-hairline p-8 max-w-sm w-full text-center space-y-6 animate-scaleUp">
            <div className="flex justify-center">
              <Heart className="w-12 h-12 text-primary fill-primary animate-pulse" />
            </div>

            <div>
              <h2 className="text-xl font-bold uppercase text-dark tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>Match Established!</h2>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1.5 leading-relaxed tracking-wider">
                You and {showMatchModal.name} are compatible with {showMatchModal.vibe.score}% confidence!
              </p>
            </div>

            <div className="flex justify-center gap-1.5 items-center">
              <div className="w-10 h-10 border border-hairline bg-primary text-white text-xs font-black flex items-center justify-center">
                You
              </div>
              <div 
                className="w-10 h-10 border border-hairline text-xs font-black flex items-center justify-center text-white -ml-3 overflow-hidden"
                style={getAvatarStyle(showMatchModal.profile.avatar)}
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => startChatting(showMatchModal.id)}
                className="w-full py-3.5 border border-primary bg-primary text-white font-black uppercase text-xs tracking-wider cursor-pointer"
              >
                Open Message Channel
              </button>
              <button
                onClick={closeMatchModal}
                className="w-full py-3 border border-hairline bg-white text-dark hover:bg-gray-50 font-black uppercase text-xs cursor-pointer"
              >
                Keep Browsing
              </button>
            </div>

          </div>
        </div>
      )}

      {/* View Images Modal Only (No details content) */}
      {selectedProfileDetail && (
        <div className="fixed inset-0 bg-dark/60 z-50 flex items-center justify-center p-6 animate-fadeIn font-sans">
          <div className="bg-white border border-hairline max-w-md w-full flex flex-col p-6 rounded-none animate-scaleUp relative shadow-lg">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedProfileDetail(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white border border-hairline text-dark cursor-pointer font-bold text-[10px] uppercase tracking-wider hover:bg-gray-50"
            >
              Close
            </button>

            {/* Header info */}
            <div className="pb-3 border-b border-hairline mb-4">
              <h2 className="text-sm font-black uppercase text-dark tracking-wide">
                Photos • {selectedProfileDetail.name}
              </h2>
            </div>

            {/* Main Picture box */}
            <div className="w-full h-80 relative overflow-hidden border border-hairline bg-gray-50">
              {activePhoto && (
                <img 
                  src={activePhoto} 
                  alt={selectedProfileDetail.name} 
                  className="w-full h-full object-cover object-[center_15%]"
                />
              )}
            </div>

            {/* Gallery thumbnails */}
            <div className="flex gap-2.5 mt-4 justify-center">
              {getProfilePhotosList(selectedProfileDetail.name, selectedProfileDetail.profile.avatar).map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhoto(photo)}
                  className={`w-14 h-14 border cursor-pointer transition-all ${
                    activePhoto === photo ? 'border-primary' : 'border-hairline hover:border-gray-400'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover object-center" />
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
