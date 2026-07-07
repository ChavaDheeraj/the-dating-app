import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Simple mock messages based on user personalities
const mockReplies: Record<string, string[]> = {
  "Maya Lin": [
    "Hey! I was actually just working on a new painting. Jazz is playing in the background. What are you up to?",
    "That is so interesting! We should definitely grab a coffee sometime. Do you know that quiet cafe downtown?",
    "Oh, I love that! Creativity is everything. What's your favorite creative outlet?",
    "Haha, totally! That vibes so well with my energy right now."
  ],
  "Liam O'Connor": [
    "Hey there. Just finished a long cycle ride. Sipping some espresso now. How's your day going?",
    "That sounds logical! I've been reading a new sci-fi book that touches on exactly that. Have you read Dune?",
    "Nice! I like working on things that have a clear system or challenge. Let's see how our vibe pans out.",
    "Interesting point. From an engineering perspective, that makes a lot of sense!"
  ],
  "Chloe Vance": [
    "Hello! I was just sitting in my garden with a hot cup of tea. It's so peaceful today. What are you reading lately?",
    "I really appreciate that thought. Books have always been my escape. Do you have a favorite bookstore?",
    "That's beautiful. I think taking things slow is really important. Life gets too busy.",
    "Aww, thank you! That made me smile. Tell me more about what you're passionate about."
  ],
  "Marcus Aurelius": [
    "What's up! Just got back from a solid run. Ready to conquer the rest of the day. What are your main goals this week?",
    "Action is key! I'm currently scaling my startup, but always make time for deep connections.",
    "Nice, I like that mindset. If you aren't growing, you're standing still. What's the next big milestone for you?",
    "Hustle and alignment. That's what it's all about. Let's keep this conversation going!"
  ]
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user1Id = searchParams.get('user1Id') ?? searchParams.get('senderId');
    const user2Id = searchParams.get('user2Id') ?? searchParams.get('receiverId');

    if (!user1Id || !user2Id) {
      return NextResponse.json({ error: "Missing user1Id or user2Id parameters" }, { status: 400 });
    }

    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load chat messages";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, receiverId, content } = body;

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Save user's message
    const newMessage = await db.message.create({
      data: {
        senderId,
        receiverId,
        content
      }
    });

    // 2. Simulate AI response if receiver is a seed profile
    const receiver = await db.user.findUnique({
      where: { id: receiverId }
    });

    if (receiver && mockReplies[receiver.name]) {
      // Retrieve conversation history length to select response index
      const conversationCount = await db.message.count({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId }
          ]
        }
      });

      // Get reply text
      const replies = mockReplies[receiver.name];
      const replyIndex = Math.floor(conversationCount / 2) % replies.length;
      const replyContent = replies[replyIndex];

      // We simulate a slight delay for the response. In standard HTTP, we can write it
      // directly to the database. The frontend will fetch it on reload or simple polling.
      // We will do a small timeout or save it directly.
      await db.message.create({
        data: {
          senderId: receiverId,
          receiverId: senderId,
          content: replyContent
        }
      });
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send chat message";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
