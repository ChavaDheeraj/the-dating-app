'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

const INTEREST_OPTIONS = [
  "cooking", "jazz", "yoga", "painting", "cycling", "espresso", 
  "coding", "sci-fi", "books", "plants", "tea", "museums",
  "running", "travel", "gym", "investing", "hiking", "photography"
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('24');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('Female');
  const [interests, setInterests] = useState<string[]>([]);
  const [relationshipPreference, setRelationshipPreference] = useState('open'); // 'like-minded' | 'opposites' | 'open'

  // Scenario Quiz Index State
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

  // Survey State (1-5 scales, calculated dynamically from quiz)
  const [survey, setSurvey] = useState({
    communication: 3,
    lifePace: 3,
    conflictRes: 3,
    socialBattery: 3,
    humorType: 3,
    valuesScale: 3,
    curiosity: 3,
    adventure: 3,
    openness: 3,
    spontaneity: 3
  });

  const scenarioQuestions = [
    {
      id: "scen1",
      question: "Your partner asks if you like their new outfit, but you don't.",
      options: [
        { label: "Tell them straight: 'Honestly, not your best look!'", val: { communication: 5 } },
        { label: "Say it looks nice to preserve their feelings", val: { communication: 1 } },
        { label: "Suggest a different outfit option instead", val: { communication: 3 } },
        { label: "Deflect with a dry/witty joke to keep it light", val: { communication: 2 } }
      ]
    },
    {
      id: "scen2",
      question: "What style of humor makes you laugh the loudest?",
      options: [
        { label: "Dry wit, sarcasm, and deadpan satire", val: { humorType: 1 } },
        { label: "Playful banter, physical comedy, and funny voices", val: { humorType: 5 } },
        { label: "Relatable everyday anecdotes and storytelling", val: { humorType: 3 } },
        { label: "Puns, riddle jokes, and intellectual wordplay", val: { humorType: 2 } }
      ]
    },
    {
      id: "scen3",
      question: "You have a completely free Saturday afternoon. You prefer to:",
      options: [
        { label: "Deep dive into a new topic, research a documentary, or read", val: { curiosity: 5 } },
        { label: "Catch up on sleep or watch a mindless TV series", val: { curiosity: 1 } },
        { label: "Work on a practical craft project or organize your desk", val: { curiosity: 3 } },
        { label: "Go out for a walk without thinking about anything educational", val: { curiosity: 2 } }
      ]
    },
    {
      id: "scen4",
      question: "For your next holiday, your absolute dream is to:",
      options: [
        { label: "Backpack through remote wilderness or camp off the grid", val: { adventure: 5 } },
        { label: "Book a peaceful luxury beach resort spa", val: { adventure: 1 } },
        { label: "Explore museums and historical walking routes in a capital", val: { adventure: 3 } },
        { label: "Visit family and friends in a familiar neighborhood", val: { adventure: 2 } }
      ]
    },
    {
      id: "scen5",
      question: "When you are going through a highly stressful period, you typically:",
      options: [
        { label: "Immediately share all details and express frustration to your partner", val: { openness: 5 } },
        { label: "Keep it entirely to yourself to avoid burdened reactions", val: { openness: 1 } },
        { label: "Bring it up casually only after you have resolved it", val: { openness: 3 } },
        { label: "Write it down in a journal but don't discuss it aloud", val: { openness: 2 } }
      ]
    },
    {
      id: "scen6",
      question: "Your typical sleep/work schedule is:",
      options: [
        { label: "Highly structured: strictly 8 hours sleep, wake at same hour daily", val: { lifePace: 5 } },
        { label: "Fluid: sleep and wake hours change depending on how tired you feel", val: { lifePace: 1 } },
        { label: "Somewhat regular: early wake-up during week, sleep in on weekends", val: { lifePace: 3 } },
        { label: "Night owl: most productive and active after midnight", val: { lifePace: 2 } }
      ]
    },
    {
      id: "scen7",
      question: "You unexpectedly receive a $5,000 cash windfall. You primarily:",
      options: [
        { label: "Deposit it straight into long-term investments or retirement", val: { valuesScale: 5 } },
        { label: "Book a premium weekend escape or buy that item you've eyed", val: { valuesScale: 1 } },
        { label: "Pay off any credit card balances or utility bills", val: { valuesScale: 3 } },
        { label: "Allocate 50% to high-yield savings and splurge the rest", val: { valuesScale: 4 } }
      ]
    },
    {
      id: "scen8",
      question: "On a Friday night after an exhausting workweek, you prefer to:",
      options: [
        { label: "Order takeout, turn off your phone, and stream a series", val: { socialBattery: 1 } },
        { label: "Go on a quiet, intimate one-on-one dinner date", val: { socialBattery: 2 } },
        { label: "Host a small group dinner or board game night at your place", val: { socialBattery: 4 } },
        { label: "Get dressed up and go to a concert or lively dance venue", val: { socialBattery: 5 } }
      ]
    },
    {
      id: "scen9",
      question: "Your partner is visibly upset about household chores. Your reaction is to:",
      options: [
        { label: "Sit down immediately and co-create a detailed chore chart", val: { conflictRes: 5 } },
        { label: "Give them space to cool off, then address it gently later", val: { conflictRes: 1 } },
        { label: "Quietly do all the outstanding chores to restore peace", val: { conflictRes: 2 } },
        { label: "Suggest hiring a cleaning service to eliminate the friction", val: { conflictRes: 3 } }
      ]
    },
    {
      id: "scen10",
      question: "A cheap flight deal pops up for a trip leaving tomorrow morning.",
      options: [
        { label: "Book it instantly and pack a single backpack!", val: { spontaneity: 5 } },
        { label: "Spend hours researching budgets and itineraries first", val: { spontaneity: 2 } },
        { label: "Pass on it. Spontaneous travel stresses me out", val: { spontaneity: 1 } },
        { label: "Text friends first to coordinate group bookings", val: { spontaneity: 4 } }
      ]
    }
  ];

  const handleInterestToggle = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter(i => i !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  const handleAnswerScenario = (values: Record<string, number>) => {
    setSurvey(prev => ({
      ...prev,
      ...values
    }));

    if (currentScenarioIndex < scenarioQuestions.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
    } else {
      // Completed scenario quiz, move to step 4 (Interests)
      setStep(4);
    }
  };

  const handleNext = () => {
    if (step === 1 && (!name || !email)) {
      alert("Please fill in your name and email.");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      if (step === 3 && currentScenarioIndex > 0) {
        setCurrentScenarioIndex(prev => prev - 1);
      } else {
        setStep(step - 1);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          age,
          bio,
          gender,
          interests,
          preferences: { relationshipPreference },
          survey
        })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('vibe_user', JSON.stringify({ id: data.user.id, name: data.user.name }));
        router.push('/feed');
      } else {
        alert("Onboarding failed: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong during onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex flex-col justify-between py-12 px-6 relative font-sans">
      {/* Progress header */}
      <div className="max-w-md mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {step === 3 ? `Scenario Quiz: ${currentScenarioIndex + 1} of 10` : `Step ${step} of 4`}
          </span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1.5 w-8 transition-all border ${
                  s <= step ? 'bg-primary border-primary' : 'bg-gray-200 border-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form Content Wrapper */}
      <main className="max-w-md mx-auto w-full bg-white border border-hairline p-8 flex-1 flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-dark mb-1 uppercase tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>Tell us about yourself</h2>
              <p className="text-sm text-gray-500 font-medium">Let's set up the foundations of your profile.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sam"
                  className="w-full px-4 py-2.5 border border-hairline text-dark font-medium bg-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. sam@gmail.com"
                  className="w-full px-4 py-2.5 border border-hairline text-dark font-medium bg-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full px-4 py-2.5 border border-hairline text-dark font-medium bg-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 border border-hairline text-dark font-medium bg-white focus:outline-none focus:border-primary"
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Bio (Optional)</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="What makes your vibe unique?"
                  className="w-full px-4 py-2.5 border border-hairline text-dark font-medium bg-white focus:outline-none focus:border-primary h-20 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-dark mb-1 uppercase tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>Relationship Philosophy</h2>
              <p className="text-sm text-gray-500 font-medium">How should the matching engine weight personality similarities?</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'like-minded',
                  title: 'Like-minded',
                  desc: 'Prioritizes similarity across survey dynamics, values, and lifestyle tempos.'
                },
                {
                  id: 'opposites',
                  title: 'Opposites Attract',
                  desc: 'Searches for complementary traits (spontaneous ↔ structured, introvert ↔ extrovert).'
                },
                {
                  id: 'open',
                  title: 'Open to both',
                  desc: 'We weight both equally and let our machine learning engine adapt based on chat feedback.'
                }
              ].map(pref => (
                <button
                  key={pref.id}
                  onClick={() => setRelationshipPreference(pref.id)}
                  className={`w-full text-left p-4 border transition-all cursor-pointer ${
                    relationshipPreference === pref.id
                      ? 'bg-secondary/15 border-secondary text-dark'
                      : 'bg-white border-hairline hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <h3 className="text-sm font-bold text-dark uppercase tracking-wider">{pref.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 font-semibold leading-relaxed">{pref.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn font-sans">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-primary border border-primary bg-primary/10 px-3 py-1">
                Scenario {currentScenarioIndex + 1} of 10
              </span>
              <h2 className="text-lg font-bold text-dark leading-snug pt-2">
                {scenarioQuestions[currentScenarioIndex].question}
              </h2>
            </div>

            <div className="space-y-3">
              {scenarioQuestions[currentScenarioIndex].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerScenario(opt.val as Record<string, number>)}
                  className="w-full text-left p-4 border border-hairline bg-white hover:bg-secondary/15 transition-all text-xs font-semibold text-dark cursor-pointer flex gap-3"
                >
                  <span className="w-5 h-5 flex items-center justify-center border border-hairline bg-gray-100 flex-none font-bold text-[10px]">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-dark mb-1 uppercase tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>Select interests</h2>
              <p className="text-sm text-gray-500 font-medium">Select tags you love to calculate shared hobbies.</p>
            </div>

            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-1">
              {INTEREST_OPTIONS.map(interest => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-hairline text-dark hover:bg-gray-50'
                    }`}
                  >
                    #{interest}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Navigation Buttons */}
      <div className="max-w-md mx-auto w-full flex justify-between items-center mt-6">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-3 border border-hairline bg-white text-dark font-black uppercase text-xs cursor-pointer hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div /> // spacer
        )}

        {step < 3 || (step === 3 && currentScenarioIndex < 9) ? (
          // In quiz (step 3), answers auto-advance, but step 1 and 2 need the Continue button.
          step !== 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 border border-hairline bg-primary text-white font-black uppercase text-xs cursor-pointer transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : null
        ) : step === 4 ? (
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 border border-hairline bg-primary text-white font-black uppercase text-xs cursor-pointer transition-all"
          >
            <span>{loading ? 'Analyzing...' : 'Unlock matches'}</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
