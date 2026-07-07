import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateVibeCompatibility } from '@/lib/vibeEngine';

const toNumber = (value: unknown, fallback: number) => {
  const parsed = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      name,
      age,
      bio,
      gender,
      preferences,
      interests,
      survey // communication, lifePace, conflictRes, socialBattery, humorType, valuesScale
    } = body;

    if (!email || !name || !age || !survey) {
      return NextResponse.json({ error: "Missing required fields: email, name, age, or survey" }, { status: 400 });
    }

    const profileCreateData = {
      age: toNumber(age, 24),
      bio: bio || "",
      avatar: "linear-gradient(135deg, #FF5D8F 0%, #E8E4FF 100%)",
      interests: JSON.stringify(interests || []),
      gender: gender || "Other",
      preferences: JSON.stringify(preferences || { gender: "All", ageMin: 18, ageMax: 99, relationshipPreference: "open" })
    };

    const profileUpdateData = {
      age: toNumber(age, 24),
      ...(bio !== undefined ? { bio } : {}),
      ...(gender !== undefined ? { gender } : {}),
      ...(interests !== undefined ? { interests: JSON.stringify(interests) } : {}),
      ...(preferences !== undefined ? { preferences: JSON.stringify(preferences) } : {})
    };

    const surveyData = {
      communication: toNumber(survey.communication, 3),
      lifePace: toNumber(survey.lifePace, 3),
      conflictRes: toNumber(survey.conflictRes, 3),
      socialBattery: toNumber(survey.socialBattery, 3),
      humorType: toNumber(survey.humorType, 3),
      valuesScale: toNumber(survey.valuesScale, 3),
      curiosity: toNumber(survey.curiosity, 3),
      adventure: toNumber(survey.adventure, 3),
      openness: toNumber(survey.openness, 3),
      spontaneity: toNumber(survey.spontaneity, 3)
    };

    // 1. Create or update user, profile, and survey. This keeps demo fast-login
    // and repeated onboarding submissions from failing on duplicate emails.
    const newUser = await db.user.upsert({
      where: { email },
      create: {
        email,
        name,
        profile: { create: profileCreateData },
        survey: { create: surveyData }
      },
      update: {
        name,
        profile: {
          upsert: {
            create: profileCreateData,
            update: profileUpdateData
          }
        },
        survey: {
          upsert: {
            create: surveyData,
            update: surveyData
          }
        }
      },
      include: {
        profile: true,
        survey: true
      }
    });

    // 2. Compute matching records with all existing users
    const otherUsers = await db.user.findMany({
      where: {
        id: { not: newUser.id }
      },
      include: {
        survey: true,
        answers: true
      }
    });

    let relPref = 'open';
    if (preferences && preferences.relationshipPreference) {
      relPref = preferences.relationshipPreference;
    }

    const matchCreations = [];
    for (const other of otherUsers) {
      const existingMatch = await db.match.findFirst({
        where: {
          OR: [
            { user1Id: newUser.id, user2Id: other.id },
            { user1Id: other.id, user2Id: newUser.id }
          ]
        }
      });

      if (existingMatch) {
        continue;
      }

      const vibe = calculateVibeCompatibility(
        newUser.survey,
        other.survey,
        [], // New user hasn't answered scenario games yet
        other.answers,
        relPref
      );

      matchCreations.push({
        user1Id: newUser.id,
        user2Id: other.id,
        score: vibe.score,
        status: "PENDING"
      });
    }

    if (matchCreations.length > 0) {
      await db.match.createMany({
        data: matchCreations
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        profile: newUser.profile,
        survey: newUser.survey
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
