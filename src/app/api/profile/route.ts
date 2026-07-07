import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        survey: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Profile user not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      profile: user.profile,
      survey: user.survey,
    });
  } catch (error: unknown) {
    console.error("Profile load error:", error);
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, bio, avatar } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const updateData: Prisma.ProfileUpdateInput = {};
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedProfile = await db.profile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        age: 24,
        bio: typeof bio === 'string' ? bio : "",
        avatar: typeof avatar === 'string' ? avatar : "linear-gradient(135deg, #D6336C 0%, #7C7AE6 100%)",
        interests: JSON.stringify(["books", "coding", "espresso", "travel"]),
        gender: "Other",
        preferences: JSON.stringify({ gender: "All", ageMin: 18, ageMax: 99, relationshipPreference: "open" }),
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: unknown) {
    console.error("Profile update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
