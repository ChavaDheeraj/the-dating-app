import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateVibeCompatibility } from '@/lib/vibeEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    // 1. Get current user's survey and game answers
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        survey: true,
        answers: true,
        profile: true,
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch all other users with profiles and surveys
    const otherUsers = await db.user.findMany({
      where: {
        id: { not: userId }
      },
      include: {
        profile: true,
        survey: true,
        answers: true,
      }
    });

    // Parse relationship philosophy preference from profile preferences
    let relPref = 'open';
    if (currentUser.profile?.preferences) {
      try {
        const prefs = JSON.parse(currentUser.profile.preferences);
        if (prefs.relationshipPreference) {
          relPref = prefs.relationshipPreference;
        }
      } catch (e) {}
    }

    // 3. Compute compatibility for each other user
    const recommendations = otherUsers.map((other) => {
      const vibe = calculateVibeCompatibility(
        currentUser.survey,
        other.survey,
        currentUser.answers,
        other.answers,
        relPref
      );

      return {
        id: other.id,
        name: other.name,
        profile: other.profile,
        vibe,
      };
    });

    // 4. Sort matches by score in descending order
    recommendations.sort((a, b) => b.vibe.score - a.vibe.score);

    return NextResponse.json({ success: true, recommendations, currentUserSurvey: currentUser.survey });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
