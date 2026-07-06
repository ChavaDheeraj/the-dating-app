import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, bio, avatar } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedProfile = await db.profile.update({
      where: { userId },
      data: updateData
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (e: any) {
    console.error("Profile update error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
