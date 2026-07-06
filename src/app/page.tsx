'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Sparkles, Compass, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [existingUser, setExistingUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem('vibe_user');
    if (userString) {
      try {
        setExistingUser(JSON.parse(userString));
      } catch (e) {
        localStorage.removeItem('vibe_user');
      }
    }
  }, []);

  const handleFastLogin = async (email: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/seed`); // Ensure db is seeded
      await response.json();

      // Retrieve all matches to get this user's ID
      const matchesResponse = await fetch(`/api/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0], // placeholder
          age: 25,
          survey: { communication: 3, lifePace: 3, conflictRes: 3, socialBattery: 3, humorType: 3, valuesScale: 3 }
        })
      });
      // But wait! Since they are already in the DB, let's query a user list.
      // Let's call onboarding with their real details, but let's make it easy:
      // We will fetch users from our database to find their actual ID.
      // Or we can query our custom api endpoint /api/matches with a seed check.
      // Wait, let's write a simple dev login route or fetch user directly.
      // Let's create an api route `/api/users` that returns all users so we can select them.
      // Even simpler: we can fetch the user by email during local fast login!
    } catch (e) {
      console.error(e);
    }
  };

  // Direct fast login using seed user database check
  const loginAsMockUser = async (name: string, email: string) => {
    setLoading(true);
    try {
      // Fetch user list from matches or a lightweight user endpoint
      const res = await fetch(`/api/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          age: name === 'Maya Lin' ? 27 : name === 'Liam O\'Connor' ? 29 : name === 'Chloe Vance' ? 25 : 32,
          survey: {
            communication: 3,
            lifePace: 3,
            conflictRes: 3,
            socialBattery: 3,
            humorType: 3,
            valuesScale: 3
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('vibe_user', JSON.stringify({ id: data.user.id, name: data.user.name }));
        router.push('/feed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = () => {
    router.push('/feed');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-bg-light px-6 py-12 md:py-20 relative overflow-hidden font-sans">
      
      {/* Brutalist Grid Background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(18,18,18,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(18,18,18,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center gap-2 bg-white border-2 border-dark px-6 py-3.5 shadow-[4px_4px_0px_0px_#121212] z-10">
        <Heart className="w-6 h-6 text-primary fill-primary animate-pulse" />
        <span className="text-lg font-black text-dark uppercase tracking-wider">
          Find Your <span className="text-primary font-black">Vibe</span>
        </span>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-xl text-center z-10 mt-8 md:mt-12">
        <div className="inline-block bg-secondary border border-dark text-dark px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-6">
          Behavioral Relationship Discovery
        </div>

        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-dark leading-[1.05] mb-6">
          Matching by <span className="text-primary">actions</span>, <br />
          not photos.
        </h1>
        
        <p className="text-sm md:text-base text-gray-500 font-semibold leading-relaxed mb-10 max-w-md">
          Forget superficial profiles. Match on lifestyle tempos, conflict styles, and behavioral vibes surfaced through casual games.
        </p>

        {/* Action CTAs */}
        <div className="w-full flex flex-col gap-4 mb-12">
          {existingUser ? (
            <button
              onClick={handleResume}
              className="w-full py-4 border-2 border-dark bg-secondary text-dark font-black uppercase text-sm shadow-[4px_4px_0px_0px_#121212] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#121212] transition-all cursor-pointer"
            >
              Resume as {existingUser.name}
            </button>
          ) : null}

          <button
            onClick={() => router.push('/onboarding')}
            className={`w-full py-4 border-2 border-dark text-sm font-black uppercase transition-all cursor-pointer shadow-[4px_4px_0px_0px_#121212] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#121212] ${
              existingUser 
                ? 'bg-white text-dark hover:bg-gray-50'
                : 'bg-primary text-white'
            }`}
          >
            Create Your Vibe Profile
          </button>
        </div>

        {/* Demo Fast Login Panel */}
        <div className="w-full bg-white border-2 border-dark p-6 shadow-[6px_6px_0px_0px_#121212]">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center justify-center gap-1">
            <span>⚡</span> Prototype Access (Pre-seeded Candidate accounts)
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Maya Lin", desc: "Artist • Creative Vibe", email: "maya@vibe.app" },
              { name: "Liam O'Connor", desc: "Engineer • Logical Vibe", email: "liam@vibe.app" },
              { name: "Chloe Vance", desc: "Novelist • Quiet Vibe", email: "chloe@vibe.app" },
              { name: "Marcus Aurelius", desc: "Founder • Action Vibe", email: "marcus@vibe.app" }
            ].map(testUser => (
              <button
                key={testUser.name}
                disabled={loading}
                onClick={() => loginAsMockUser(testUser.name, testUser.email)}
                className="p-3 border-2 border-dark bg-white hover:bg-secondary text-left transition-all cursor-pointer"
              >
                <span className="text-xs font-black text-dark block truncate">{testUser.name}</span>
                <span className="text-[9px] text-gray-400 font-bold block mt-0.5">{testUser.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-4">
        <span>© 2026 Find Your Vibe</span>
        <span>•</span>
        <span>Brutalist Web Platform Mockup</span>
      </footer>
    </div>
  );
}
