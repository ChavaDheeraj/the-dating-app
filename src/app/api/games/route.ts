import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const scenarios = await db.systemScenario.findMany();
    const userAnswers = await db.gameAnswer.findMany({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      scenarios,
      userAnswers
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load game data";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a custom scenario creation request
    if (body.question && body.optionA && body.optionB && body.category) {
      const newScenario = await db.systemScenario.create({
        data: {
          question: body.question,
          optionA: body.optionA,
          optionB: body.optionB,
          optionC: body.optionC || "Unsure / Need more info",
          optionD: body.optionD || "None of the above",
          category: body.category
        }
      });
      return NextResponse.json({ success: true, scenario: newScenario });
    }

    const { userId, scenarioId, optionChoice, comment } = body;

    if (!userId || !scenarioId || !optionChoice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already answered this scenario
    const existing = await db.gameAnswer.findFirst({
      where: { userId, scenarioId }
    });

    let answer;
    if (existing) {
      answer = await db.gameAnswer.update({
        where: { id: existing.id },
        data: { optionChoice, comment }
      });
    } else {
      answer = await db.gameAnswer.create({
        data: { userId, scenarioId, optionChoice, comment }
      });
    }

    // Now recalculate match scores for all matches the user has
    // (This ensures that answering games dynamically changes their matches list!)
    const userMatches = await db.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    for (const match of userMatches) {
      const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;
      
      const userSurvey = await db.vibeSurvey.findUnique({ where: { userId } });
      const otherSurvey = await db.vibeSurvey.findUnique({ where: { userId: otherId } });
      
      const userAnswers = await db.gameAnswer.findMany({ where: { userId } });
      const otherAnswers = await db.gameAnswer.findMany({ where: { userId: otherId } });
      
      const { calculateVibeCompatibility } = await import('@/lib/vibeEngine');
      const vibe = calculateVibeCompatibility(userSurvey, otherSurvey, userAnswers, otherAnswers);

      await db.match.update({
        where: { id: match.id },
        data: { score: vibe.score }
      });
    }

    return NextResponse.json({ success: true, answer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save game answer";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
