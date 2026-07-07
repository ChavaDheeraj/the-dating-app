import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateVibeCompatibility, getAICoachInsights } from '@/lib/vibeEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const matchId = searchParams.get('matchId');

    if (!userId || !matchId) {
      return NextResponse.json({ error: "Missing userId or matchId parameters" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { survey: true, answers: true }
    });

    const matchUser = await db.user.findUnique({
      where: { id: matchId },
      include: { survey: true, answers: true, profile: true }
    });

    if (!user || !matchUser) {
      return NextResponse.json({ error: "User or match not found" }, { status: 404 });
    }

    const vibe = calculateVibeCompatibility(
      user.survey,
      matchUser.survey,
      user.answers,
      matchUser.answers
    );

    let interests: string[] = [];
    if (matchUser.profile?.interests) {
      try {
        interests = JSON.parse(matchUser.profile.interests);
      } catch {
        interests = [];
      }
    }

    const insights = await getAICoachInsights(
      user.name,
      matchUser.name,
      vibe,
      interests
    );

    return NextResponse.json({
      success: true,
      compatibility: vibe,
      insights: insights.insights,
      icebreakers: insights.icebreakers
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate coach insights";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
