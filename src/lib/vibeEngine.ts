export interface VibeSurveyData {
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

export interface GameAnswerData {
  scenarioId: string;
  optionChoice: string;
}

export interface VibeCompatibilityResult {
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
}

/**
 * Calculates behavioral and personality compatibility between two users.
 */
export function calculateVibeCompatibility(
  s1: VibeSurveyData | null,
  s2: VibeSurveyData | null,
  answers1: GameAnswerData[] = [],
  answers2: GameAnswerData[] = [],
  relPreference: string = 'open' // 'like-minded', 'opposites', 'open'
): VibeCompatibilityResult {
  // If either survey is missing, provide a baseline compatibility score of 60%
  if (!s1 || !s2) {
    return {
      score: 60.0,
      similarity: 60.0,
      complementarity: 60.0,
      breakdown: {
        communication: 60,
        humor: 60,
        curiosity: 60,
        adventure: 60,
        openness: 60,
        lifestyle: 60,
        values: 60,
        energy: 60,
        conflict: 60,
        spontaneity: 60,
        gamesMatch: 50,
      },
      sharedScenariosCount: 0,
      vibeAnalysis: "Set up both personality profiles to calculate a tailored Vibe breakdown.",
    };
  }

  // Helper to calculate similarity percent on a 1-5 scale (max difference is 4)
  const axisScore = (val1: number, val2: number) => {
    const diff = Math.abs((val1 || 3) - (val2 || 3));
    return Math.round(100 - diff * 20); // 0 diff = 100%, 4 diff = 20%
  };

  const communication = axisScore(s1.communication, s2.communication);
  const humor = axisScore(s1.humorType, s2.humorType);
  const curiosity = axisScore(s1.curiosity, s2.curiosity);
  const adventure = axisScore(s1.adventure, s2.adventure);
  const openness = axisScore(s1.openness, s2.openness);
  const lifestyle = axisScore(s1.lifePace, s2.lifePace);
  const values = axisScore(s1.valuesScale, s2.valuesScale);
  const energy = axisScore(s1.socialBattery, s2.socialBattery);
  const conflict = axisScore(s1.conflictRes, s2.conflictRes);
  const spontaneity = axisScore(s1.spontaneity, s2.spontaneity);

  // Compare Game scenario answers
  let gamesMatch = 70; // baseline if no games played yet
  let sharedScenariosCount = 0;
  let matchingAnswersCount = 0;

  const a2Map = new Map(answers2.map((a) => [a.scenarioId, a.optionChoice]));
  
  answers1.forEach((a1) => {
    if (a2Map.has(a1.scenarioId)) {
      sharedScenariosCount++;
      if (a1.optionChoice === a2Map.get(a1.scenarioId)) {
        matchingAnswersCount++;
      }
    }
  });

  if (sharedScenariosCount > 0) {
    gamesMatch = Math.round((matchingAnswersCount / sharedScenariosCount) * 100);
  }

  // Similarity Score
  const similarity = Math.round(
    (communication + humor + curiosity + adventure + openness + lifestyle + values + energy + conflict + spontaneity) / 10
  );

  // Complementarity Score (opposite traits on lifestyle/energy/communication balance, but similar on values/conflict)
  const oppositePace = 100 - lifestyle;
  const oppositeBattery = 100 - energy;
  const oppositeComm = 100 - communication;
  const oppositeSpontaneity = 100 - spontaneity;
  
  const complementarity = Math.round(
    (oppositePace + oppositeBattery + oppositeComm + oppositeSpontaneity + conflict + values + curiosity + adventure + openness + humor) / 10
  );

  // Blended Score based on user's relationship philosophy preference
  let score = 70;
  if (relPreference === 'like-minded') {
    score = Math.round(similarity * 0.8 + complementarity * 0.2);
  } else if (relPreference === 'opposites') {
    score = Math.round(complementarity * 0.8 + similarity * 0.2);
  } else {
    score = Math.round(similarity * 0.5 + complementarity * 0.5);
  }

  // Include game answers factor
  score = Math.round(score * 0.75 + gamesMatch * 0.25);

  // Dynamic analysis text generation
  let vibeAnalysis = "";
  if (score >= 85) {
    vibeAnalysis = "An exceptional match! You share highly synchronous lifestyle tempos and values, meaning daily life will feel fluid and supportive.";
  } else if (score >= 70) {
    vibeAnalysis = "A solid connection. While you have distinct communication or humor traits, your core values are well-aligned, promising great growth potential.";
  } else {
    vibeAnalysis = "Complementary chemistry. You see the world differently in some areas, which can serve as a catalyst for sparking fresh perspectives.";
  }

  return {
    score,
    similarity,
    complementarity,
    breakdown: {
      communication,
      humor,
      curiosity,
      adventure,
      openness,
      lifestyle,
      values,
      energy,
      conflict,
      spontaneity,
      gamesMatch,
    },
    sharedScenariosCount,
    vibeAnalysis,
  };
}

/**
 * Generates custom AI Coach suggestions and icebreakers for two matching profiles.
 */
export async function getAICoachInsights(
  user1Name: string,
  user2Name: string,
  result: VibeCompatibilityResult,
  user2Interests: string[] = []
): Promise<{ insights: string[]; icebreakers: string[] }> {
  const lowercaseInterests = user2Interests.map(i => i.toLowerCase());
  
  // Custom interactive icebreakers
  const icebreakers: string[] = [];
  if (lowercaseInterests.length > 0) {
    const topic = lowercaseInterests[0];
    icebreakers.push(`Hey ${user2Name}, I saw you're into ${topic}. What's your absolute favorite spot or way to experience that?`);
  }
  
  if (result.breakdown.energy > 80) {
    icebreakers.push(`Since both of you have active social batteries, what's your go-to weekend escape—hosting a group dinner or exploring new venues?`);
  } else if (result.breakdown.energy < 50) {
    icebreakers.push(`Both of you recharge in quiet spaces. What's the best book or hobby you've spent hours hyperfocused on recently?`);
  } else {
    icebreakers.push(`If you had to spend a whole Saturday together doing either an active city crawl or a cozy film marathon, which way do we lean?`);
  }

  // Interactive insights
  const insights: string[] = [];
  
  if (result.breakdown.communication >= 85) {
    insights.push(`Your communication styles are highly synchronized (${result.breakdown.communication}%). You both appreciate matching levels of directness, leading to fewer misunderstandings.`);
  } else {
    insights.push(`${user1Name} prefers reflective/considered conversations while ${user2Name} leans direct. Give each other extra breathing room to process thoughts.`);
  }

  if (result.breakdown.lifestyle >= 80) {
    insights.push(`You operate at similar daily speeds (${result.breakdown.lifestyle}%). Planning dates and coordination will feel effortless.`);
  } else {
    insights.push(`One of you has a high-octane tempo, while the other values slower, deliberate downtime. Balance your schedules so neither feels overwhelmed.`);
  }

  if (result.sharedScenariosCount > 0) {
    insights.push(`You've compared ${result.sharedScenariosCount} scenario games together! You aligned on ${Math.round(result.breakdown.gamesMatch / 100 * result.sharedScenariosCount)} of them.`);
  }

  return {
    insights,
    icebreakers: icebreakers.slice(0, 3)
  };
}
