import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateVibeCompatibility } from '@/lib/vibeEngine';

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

    // 1. Create user, profile, and survey in a transaction
    const newUser = await db.user.create({
      data: {
        email,
        name,
        profile: {
          create: {
            age: parseInt(age),
            bio: bio || "",
            avatar: "linear-gradient(135deg, #FF5D8F 0%, #E8E4FF 100%)", // Premium Light Red to Lavender theme gradient
            interests: JSON.stringify(interests || []),
            gender: gender || "Other",
            preferences: JSON.stringify(preferences || { gender: "All", ageMin: 18, ageMax: 99 })
          }
        },
        survey: {
          create: {
            communication: parseInt(survey.communication) || 3,
            lifePace: parseInt(survey.lifePace) || 3,
            conflictRes: parseInt(survey.conflictRes) || 3,
            socialBattery: parseInt(survey.socialBattery) || 3,
            humorType: parseInt(survey.humorType) || 3,
            valuesScale: parseInt(survey.valuesScale) || 3,
            curiosity: parseInt(survey.curiosity) || 3,
            adventure: parseInt(survey.adventure) || 3,
            openness: parseInt(survey.openness) || 3,
            spontaneity: parseInt(survey.spontaneity) || 3
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
