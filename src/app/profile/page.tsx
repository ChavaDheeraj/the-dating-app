'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ShieldAlert, Award, LogOut, Save, Milestone, Camera, X } from 'lucide-react';
import { VibeGraph, VibeDimensions } from '@/components/ui/VibeGraph';

interface ProfileData {
  age: number;
  bio: string;
  avatar: string;
  interests: string[];
  gender: string;
}

interface SurveyData {
  communication: number;
  lifePace: number; // lifestyle
  conflictRes: number; // conflict
  socialBattery: number; // energy
  humorType: number; // humor
  valuesScale: number; // values
  curiosity: number;
  adventure: number;
  openness: number;
  spontaneity: number;
}

interface ProfileApiResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  profile?: {
    age: number;
    bio: string;
    avatar: string;
    interests: string;
    gender: string;
  } | null;
  survey?: Partial<SurveyData> | null;
}

export default function Profile() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [bioText, setBioText] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [saving, setSaving] = useState(false);

  // Philosophy Preference
  const [relationshipPreference, setRelationshipPreference] = useState('open');

  // PRD State Attributes
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  // Interactive Dimension Explainer State
  const [selectedDimension, setSelectedDimension] = useState<string>('communication');

  // Avatar Upload States
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const brandPresets = [
    "linear-gradient(135deg, #D6336C 0%, #7C7AE6 100%)", // Primary brand blend
    "linear-gradient(135deg, #7C7AE6 0%, #1C1C1E 100%)", // Lavender to charcoal
    "linear-gradient(135deg, #D6336C 0%, #FAF9F5 100%)", // Pink-red to warm paper
    "linear-gradient(135deg, #FF9F43 0%, #FF5252 100%)"  // Sunrise glow
  ];

  const dimensionExplainer: Record<string, string> = {
    communication: "You prefer structured daily templates but value witty situational humor check-ins.",
    humor: "You lean heavily towards situational sarcasm, dry punchlines, and clever wordplay.",
    curiosity: "You display high curiosity, favoring deep philosophical debates and technology research.",
    adventure: "You love exploring nature trails, cycling, and taking outdoor treks on weekends.",
    openness: "You are highly open about sharing personal feelings once trust is established.",
    lifestyle: "You balance structured daily schedules with occasional lazy cafes and sleep-in routines.",
    values: "You invest strictly in long-term goals but save room for high-yield splurges.",
    energy: "You recharge with intimate board game dinners rather than large concert venues.",
    conflict: "You prefer cooling off first, then approaching the friction gently and calmly.",
    spontaneity: "You occasionally splurge on a sudden cash windfall or weekend road trip dare."
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

  const parseInterests = (interests: string | undefined) => {
    if (!interests) return ["books", "coding", "espresso", "travel"];
    try {
      const parsed = JSON.parse(interests);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return ["books", "coding", "espresso", "travel"];
    }
  };

  const fetchUserProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const res = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json() as ProfileApiResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Profile could not be loaded.');
      }

      if (data.user) {
        const user = { id: data.user.id, name: data.user.name };
        setCurrentUser(user);
        localStorage.setItem('vibe_user', JSON.stringify(user));
      }

      const dbProfile = data.profile;
      const mockProfile: ProfileData = {
        age: dbProfile?.age || 24,
        bio: localStorage.getItem('vibe_bio') || dbProfile?.bio || "Passionate prototype reviewer exploring relationship matching algorithms. Let's talk tech!",
        avatar: localStorage.getItem('vibe_avatar') || dbProfile?.avatar || "linear-gradient(135deg, #D6336C 0%, #7C7AE6 100%)",
        interests: parseInterests(dbProfile?.interests),
        gender: dbProfile?.gender || "Non-binary"
      };

      const dbSurvey = data.survey;
      const mockSurvey: SurveyData = {
        communication: dbSurvey?.communication || 3,
        lifePace: dbSurvey?.lifePace || 4,
        conflictRes: dbSurvey?.conflictRes || 3,
        socialBattery: dbSurvey?.socialBattery || 4,
        humorType: dbSurvey?.humorType || 3,
        valuesScale: dbSurvey?.valuesScale || 4,
        curiosity: dbSurvey?.curiosity || 4,
        adventure: dbSurvey?.adventure || 3,
        openness: dbSurvey?.openness || 4,
        spontaneity: dbSurvey?.spontaneity || 3
      };

      setProfile(mockProfile);
      setSurvey(mockSurvey);
      setBioText(mockProfile.bio);
    } catch (e) {
      console.error(e);
      setProfile(null);
      setSurvey(null);
      setProfileError(e instanceof Error ? e.message : 'Profile could not be loaded.');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const userString = localStorage.getItem('vibe_user');
    if (!userString) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(userString);
    setCurrentUser(parsed);
    fetchUserProfile(parsed.id);

    // Persist mock states
    const savedPremium = localStorage.getItem('vibe_premium') === 'true';
    setIsPremium(savedPremium);
    const savedPublic = localStorage.getItem('vibe_public') !== 'false';
    setIsProfilePublic(savedPublic);

    const savedPref = localStorage.getItem('vibe_pref') || 'open';
    setRelationshipPreference(savedPref);
  }, [fetchUserProfile, router]);

  const handleSaveBio = async () => {
    if (!currentUser) return;
    setSaving(true);
    localStorage.setItem('vibe_bio', bioText);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, bio: bioText })
      });
      const data = await res.json();
      if (data.success) {
        alert("Bio updated successfully!");
      }
    } catch (e) {
      console.error("Error saving bio:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Str = reader.result as string;
      saveNewAvatar(base64Str);
    };
    reader.readAsDataURL(file);
  };

  const saveNewAvatar = async (avatarStr: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, avatar: avatarStr })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('vibe_avatar', avatarStr);
        if (profile) {
          setProfile({ ...profile, avatar: avatarStr });
        }
        setIsEditingAvatar(false);
        alert("Profile picture updated successfully!");
      }
    } catch (e) {
      console.error("Error updating avatar:", e);
    }
  };

  const handleSavePreference = (pref: string) => {
    setRelationshipPreference(pref);
    localStorage.setItem('vibe_pref', pref);
  };

  const toggleVisibility = () => {
    const nextVal = !isProfilePublic;
    setIsProfilePublic(nextVal);
    localStorage.setItem('vibe_public', String(nextVal));
  };

  const handleActivatePremium = () => {
    setIsPremium(true);
    localStorage.setItem('vibe_premium', 'true');
    setShowPaywallModal(false);
  };

  const handleDeactivatePremium = () => {
    setIsPremium(false);
    localStorage.setItem('vibe_premium', 'false');
  };

  const handleResetSession = () => {
    if (confirm("Are you sure you want to reset your local session and restart onboarding?")) {
      localStorage.clear();
      router.push('/');
    }
  };

  const mapSurveyToVibeDimensions = (survey: SurveyData): VibeDimensions => {
    return {
      communication: survey.communication,
      humor: survey.humorType,
      curiosity: survey.curiosity,
      adventure: survey.adventure,
      openness: survey.openness,
      lifestyle: survey.lifePace,
      values: survey.valuesScale,
      energy: survey.socialBattery,
      conflict: survey.conflictRes,
      spontaneity: survey.spontaneity
    };
  };

  const profileReady = currentUser && profile && survey;

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-bg-light py-8 px-4 sm:px-6 lg:px-8 flex justify-center animate-fadeIn font-sans">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Profile Bio, Picture selector, Settings */}
        <div className="space-y-6">
          
          {/* Header */}
          <header className="flex justify-between items-center bg-white p-6 border border-hairline">
            <div>
              <h1 className="text-xl font-black text-dark uppercase tracking-wide" style={{ fontFamily: 'var(--font-headline)' }}>Vibe Center</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Control Panel & Identity</p>
            </div>
            <User className="w-6 h-6 text-primary" />
          </header>

          {profileLoading && (
            <div className="bg-white border border-hairline p-6">
              <div className="px-4 py-3 border border-hairline bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">
                Loading saved profile...
              </div>
            </div>
          )}

          {!profileLoading && profileError && (
            <div className="bg-white border border-red-200 p-6 space-y-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-red-500">Profile could not load</h2>
                <p className="text-xs text-gray-500 font-semibold mt-2 leading-relaxed">{profileError}</p>
              </div>
              <button
                onClick={handleResetSession}
                className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-500 font-black uppercase text-[10px] tracking-wider cursor-pointer"
              >
                Restart onboarding
              </button>
            </div>
          )}

          {profileReady && (
            <div className="space-y-6">
              
              {/* Profile details & image frame */}
              <div className="bg-white border border-hairline p-6 text-center space-y-5">
                <div className="flex flex-col items-center gap-3">
                  <div 
                    className="w-20 h-20 border border-hairline flex items-center justify-center text-white text-3xl font-black relative overflow-hidden group"
                    style={getAvatarStyle(profile.avatar)}
                  >
                    {!profile.avatar.startsWith('linear-gradient') ? null : currentUser.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Toggle Image Editor Button */}
                  {!isEditingAvatar ? (
                    <button
                      onClick={() => setIsEditingAvatar(true)}
                      className="px-3 py-1 bg-gray-50 border border-hairline text-dark font-black uppercase text-[8px] tracking-wider cursor-pointer hover:bg-gray-150 flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Change Picture</span>
                    </button>
                  ) : (
                    <div className="bg-gray-50 border border-hairline p-4 w-full text-left space-y-4 animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-hairline pb-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Profile Photo Editor</span>
                        <button onClick={() => setIsEditingAvatar(false)} className="text-gray-400 hover:text-dark">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* File upload input */}
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Upload Custom Photo</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="w-full text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-hairline file:bg-white file:text-[9px] file:font-black file:uppercase file:cursor-pointer"
                        />
                      </div>

                      {/* Preset gradients */}
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Or Select Presets</span>
                        <div className="flex gap-2">
                          {brandPresets.map((preset, idx) => (
                            <button
                              key={idx}
                              onClick={() => saveNewAvatar(preset)}
                              className="w-7 h-7 border border-hairline cursor-pointer"
                              style={{ background: preset }}
                              title="Preset colors"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold uppercase text-dark tracking-tight">{currentUser.name}</h2>
                  <span className="text-[10px] text-primary font-black uppercase tracking-widest">{profile.gender} • Age {profile.age}</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                  {profile.interests.map(tag => (
                    <span key={tag} className="px-2.5 py-0.5 bg-gray-50 border border-hairline text-[9px] font-black uppercase tracking-wider text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Profile Visibility */}
                <div className="flex justify-between items-center bg-gray-50 border border-hairline p-4 mt-4 text-left">
                  <div>
                    <span className="text-xs font-bold text-dark uppercase tracking-wider block">Profile Status</span>
                    <span className="text-[9px] text-gray-400 font-semibold leading-none uppercase">Matches browse you in real time</span>
                  </div>
                  <button
                    onClick={toggleVisibility}
                    className={`px-4 py-2 border text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                      isProfilePublic ? 'bg-primary border-primary text-white' : 'bg-white border-hairline text-dark'
                    }`}
                  >
                    {isProfilePublic ? "ACTIVE" : "PAUSED"}
                  </button>
                </div>
              </div>

              {/* Bio Box */}
              <div className="bg-white border border-hairline p-6 space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  Edit Personal Bio
                </span>
                <textarea 
                  value={bioText}
                  onChange={e => setBioText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-hairline text-xs font-semibold text-dark resize-none h-20 bg-gray-50 focus:bg-white focus:outline-none focus:border-primary"
                />
                <div className="flex justify-end">
                  <button 
                    disabled={saving}
                    onClick={handleSaveBio}
                    className="px-4 py-2 bg-primary border border-primary text-white font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? "Saving..." : "Save Bio"}</span>
                  </button>
                </div>
              </div>

              {/* Connection Channels Ledger */}
              <div className="bg-white border border-hairline p-6 space-y-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pb-2 border-b border-hairline text-left">
                  Connection Requests Registry
                </span>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="border border-hairline p-3 bg-gray-50/50">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest block">Received</span>
                    <span className="text-lg font-black text-secondary">2</span>
                  </div>
                  <div className="border border-hairline p-3 bg-gray-50/50">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest block">Sent</span>
                    <span className="text-lg font-black text-primary">3</span>
                  </div>
                  <div className="border border-hairline p-3 bg-gray-50/50">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest block">Pending</span>
                    <span className="text-lg font-black text-dark">1</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1.5 text-left">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-gray-600">
                    <span className="uppercase">Incoming Requests</span>
                    <span className="text-[8px] text-[#7C7AE6] bg-[#7C7AE6]/10 px-2 py-0.5 border border-[#7C7AE6]/20 font-bold font-mono">2 NEW</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-gray-600">
                    <span className="uppercase">Sent Pending Response</span>
                    <span className="text-[8px] text-gray-400 bg-gray-50 px-2 py-0.5 border border-hairline font-bold font-mono">1 OUTSTANDING</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Vibe Graph, timeline and settings */}
        <div className="space-y-6">
          
          {profileReady && (
            <div className="space-y-6">
              
              {/* Radar Chart & Dimension Explainer */}
              <div className="bg-white border border-hairline p-6 flex flex-col items-center justify-center space-y-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pb-2 border-b border-hairline w-full text-center">
                  My Personality Vibe Graph
                </span>

                <VibeGraph 
                  scores={mapSurveyToVibeDimensions(survey)}
                  userName="You"
                  size={240}
                />

                {/* Interactive Vibe Dimension Details */}
                <div className="w-full space-y-3 pt-3 border-t border-hairline text-left">
                  <span className="text-[9px] font-black text-[#7C7AE6] uppercase tracking-widest block">Interactive Dimension Explainer</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none font-mono">
                    {Object.keys(dimensionExplainer).map(dim => (
                      <button
                        key={dim}
                        onClick={() => setSelectedDimension(dim)}
                        className={`px-2.5 py-1 border text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                          selectedDimension === dim ? 'bg-[#7C7AE6] border-[#7C7AE6] text-white' : 'bg-gray-50 border-hairline text-gray-400 hover:text-dark'
                        }`}
                      >
                        {dim}
                      </button>
                    ))}
                  </div>
                  
                  <div className="bg-gray-50 border border-hairline p-3.5 text-xs text-gray-600 font-semibold italic">
                    "{dimensionExplainer[selectedDimension]}"
                  </div>
                </div>

                <p className="text-[9px] text-gray-400 font-semibold uppercase leading-relaxed text-center max-w-xs mt-1">
                  Your decagon map represents active communication, humor, values, conflict, and lifestyle tempos.
                </p>
              </div>

              {/* ROS Journey Timeline Roadmap */}
              <div className="bg-white border border-hairline p-6 space-y-4">
                <div className="border-b border-hairline pb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    My ROS Relationship Journey
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold uppercase block mt-0.5">
                    Your active milestones in the Relationship Operating System
                  </span>
                </div>

                <div className="space-y-3.5 relative pl-4 border-l border-hairline ml-2 pt-2 text-left">
                  {[
                    { id: 'discovery', label: 'Self Discovery', desc: '10 behavioral dimensions mapped', active: true },
                    { id: 'personality', label: 'Personality Graph', desc: 'Active communication, humor, values profiles', active: true },
                    { id: 'compatibility', label: 'Compatibility Search', desc: 'Filtering via weighted similarity/complementarity', active: true },
                    { id: 'introduction', label: 'AI Introduction', desc: 'Browse picks unlocked and matching keys revealed', active: true },
                    { id: 'conversation', label: 'Vibe Messenger Chats', desc: 'Active conversation channel logs', active: true },
                    { id: 'experiences', label: 'Shared Experiences', desc: 'Playing interactive game challenges together', active: false },
                    { id: 'realdate', label: 'Real Life Date', desc: 'Milestone: setting up dates via planner templates', active: false },
                    { id: 'growth', label: 'Relationship Growth', desc: 'End Goal: long-term compatibility insights', active: false },
                  ].map((step, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[21px] top-1.5 w-2 h-2 border transition-all ${
                        step.active ? 'bg-[#7C7AE6] border-[#7C7AE6] ring-4 ring-[#7C7AE6]/10' : 'bg-white border-gray-300'
                      }`} />
                      
                      <div className="space-y-0.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider block ${step.active ? 'text-dark font-bold' : 'text-gray-400 font-semibold'}`}>
                          {step.label}
                        </span>
                        <p className={`text-[9px] font-semibold leading-normal ${step.active ? 'text-gray-500' : 'text-gray-400/70'}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logs / Compatibility History */}
              <div className="bg-white border border-hairline p-6 space-y-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pb-2 border-b border-hairline">
                  Match Compatibility History
                </span>

                <div className="space-y-3.5">
                  {[
                    { name: 'Maya Lin', score: 82, status: 'Active Channel' },
                    { name: 'Liam O\'Connor', score: 78, status: 'Active Channel' },
                    { name: 'Chloe Vance', score: 88, status: 'New Introduction' },
                  ].map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <Milestone className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-dark">{log.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-bold">{log.score}%</span>
                        <span className="text-[9px] text-gray-400 bg-gray-50 border border-hairline px-2 py-0.5 uppercase">{log.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Philosophy Preferences selectors */}
              <div className="bg-white border border-hairline p-6 space-y-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pb-2 border-b border-hairline">
                  Match Weights Strategy
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'like-minded', title: 'Similar' },
                    { id: 'opposites', title: 'Opposite' },
                    { id: 'open', title: 'Balanced' }
                  ].map(pref => (
                    <button
                      key={pref.id}
                      onClick={() => handleSavePreference(pref.id)}
                      className={`py-2 text-[10px] border font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                        relationshipPreference === pref.id
                          ? 'bg-secondary/15 border-secondary text-secondary font-black'
                          : 'bg-white border-hairline text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pref.title}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 font-semibold leading-relaxed uppercase text-left">
                  This instructs the Relationship Operating System how to weigh similarity vs complementarity in your curated feed.
                </p>
              </div>

              {/* VIP Metallic Gradient Card & Developer Settings */}
              <div className="bg-white border border-hairline p-6 space-y-4">
                {isPremium ? (
                  <div className="bg-gradient-to-br from-[#D6336C] via-[#9F56A9] to-[#7C7AE6] p-5 text-white space-y-4 text-left">
                    <div className="flex items-center gap-3">
                      <Award className="w-8 h-8 text-white flex-none drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Vibe VIP Premium Tier Active</h4>
                        <p className="text-[9px] text-white/80 leading-normal mt-0.5 uppercase">Premium overlay analytics and AI wingman logic unlocked.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDeactivatePremium}
                      className="w-full py-2 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[9px] tracking-wider cursor-pointer transition-all"
                    >
                      Deactivate VIP Status
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-[#D6336C] via-[#9F56A9] to-[#7C7AE6] p-5 text-white space-y-4 text-left">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Get Vibe VIP Premium</h4>
                      <p className="text-[9px] text-white/80 leading-normal mt-0.5 uppercase">Unlock comprehensive dimension breakdowns and custom date ideas.</p>
                    </div>
                    <button
                      onClick={() => setShowPaywallModal(true)}
                      className="w-full py-2.5 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[9px] tracking-wider cursor-pointer transition-all"
                    >
                      Unlock Premium ($9.99/mo)
                    </button>
                  </div>
                )}

                <div className="border-t border-hairline pt-4 space-y-3.5">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Developer Actions Console
                  </span>
                  <button 
                    onClick={handleResetSession}
                    className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-500 font-black uppercase text-[10px] tracking-wider cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Reset session & restart onboarding</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Paywall Overlay Dialog */}
      {showPaywallModal && (
        <div className="fixed inset-0 bg-dark/60 flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-white border border-hairline p-8 max-w-sm w-full space-y-6 animate-scaleUp text-center">
            <div className="space-y-2">
              <Award className="w-10 h-10 text-primary mx-auto animate-bounce" />
              <h2 className="text-lg font-bold text-dark uppercase tracking-wide" style={{ fontFamily: 'var(--font-headline)' }}>Get Vibe Premium</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Deep Matchmaking upgrade tier</p>
            </div>

            <div className="space-y-2.5 text-left">
              {[
                "🔓 Complete Similarity & Complementarity breakdowns",
                "🔓 Custom AI wingman advice prompts",
                "🔓 Unlimited lobby card game slots",
                "🔓 Serendipity daily wildcard picks",
                "🔓 Verification profiling metrics"
              ].map((feat, idx) => (
                <div key={idx} className="text-[9px] font-black uppercase tracking-wider text-dark bg-white p-2.5 border border-hairline">
                  {feat}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleActivatePremium}
                className="flex-1 py-3 bg-primary border border-primary text-white font-black text-[10px] tracking-wider cursor-pointer"
              >
                Subscribe Now ($9.99/mo)
              </button>
              <button 
                onClick={() => setShowPaywallModal(false)}
                className="px-5 py-3 bg-white border border-hairline text-dark hover:bg-gray-100 font-black text-[10px] tracking-wider cursor-pointer"
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
