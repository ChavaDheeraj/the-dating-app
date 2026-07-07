import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 1. Seed System Scenarios if empty
    const scenarioCount = await db.systemScenario.count();
    if (scenarioCount === 0) {
      await db.systemScenario.createMany({
        data: [
          {
            question: "Your partner is visibly upset about household chores. Your immediate reaction is to:",
            optionA: "Sit down immediately and co-create a detailed chore chart.",
            optionB: "Give them space to cool off, then address it gently later.",
            optionC: "Quietly do all the outstanding chores to restore peace.",
            optionD: "Suggest hiring a cleaning service to eliminate the friction.",
            category: "Conflict Resolution"
          },
          {
            question: "Your ideal vacation day consists of which lifestyle pacing:",
            optionA: "A packed 8 AM to 11 PM itinerary of museums, sights, and events.",
            optionB: "Sleeping in, wandering local side streets with zero agenda.",
            optionC: "High-intensity outdoor adventure: hiking, climbing, or surfing.",
            optionD: "Unwinding entirely at a resort spa with a good book.",
            category: "Life Pace"
          },
          {
            question: "You unexpectedly receive a $5,000 cash windfall. You primarily:",
            optionA: "Deposit it straight into long-term investments or retirement.",
            optionB: "Book a premium weekend escape or buy that item you've eyed.",
            optionC: "Pay off any credit card balances or utility bills.",
            optionD: "Allocate 50% to high-yield savings and splurge the rest.",
            category: "Values"
          },
          {
            question: "On a Friday night after an exhausting workweek, you prefer to:",
            optionA: "Host a small group dinner or board game night at your place.",
            optionB: "Get dressed up and go to a concert or lively dance venue.",
            optionC: "Order takeout, turn off your phone, and stream a series.",
            optionD: "Go on a quiet, intimate one-on-one dinner date.",
            category: "Social Battery"
          },
          {
            question: "If a conversation hits an awkward silence, you usually:",
            optionA: "Make a self-deprecating or dry joke to break the ice.",
            optionB: "Ask a deep, open-ended question about their childhood or goals.",
            optionC: "Enjoy the quiet moment; silences don't feel awkward to you.",
            optionD: "Bring up a recent interesting news item or pop-culture debate.",
            category: "Communication"
          }
        ]
      });
    }

    // 2. Create standard mock users if empty
    const userCount = await db.user.count();

    // We expect at least the test user + 4 mock profiles.
    if (userCount < 3) {
      // Maya (Artist)
      const maya = await db.user.create({
        data: {
          email: "maya@vibe.app",
          name: "Maya Lin",
          profile: {
            create: {
              age: 27,
              bio: "Multimedia artist, vinyl record collector, and local coffee shop connoisseur. Let's find some cozy spots.",
              avatar: "linear-gradient(135deg, #FF5D8F 0%, #E8E4FF 100%)", // Light Red to Lavender
              interests: JSON.stringify(["painting", "jazz", "yoga", "cooking"]),
              gender: "Female",
              preferences: JSON.stringify({ gender: "All", ageMin: 22, ageMax: 35 })
            }
          },
          survey: {
            create: {
              communication: 4,
              lifePace: 2,
              conflictRes: 4,
              socialBattery: 3,
              humorType: 5,
              valuesScale: 2,
              curiosity: 4,
              adventure: 3,
              openness: 4,
              spontaneity: 2
            }
          }
        }
      });

      // Liam (Engineer)
      const liam = await db.user.create({
        data: {
          email: "liam@vibe.app",
          name: "Liam O'Connor",
          profile: {
            create: {
              age: 29,
              bio: "Robotics engineer. Weekend cyclist, espresso maker, and sci-fi nerd. I like structures that make sense.",
              avatar: "linear-gradient(135deg, #121212 0%, #E8E4FF 100%)", // Black to Lavender
              interests: JSON.stringify(["cycling", "espresso", "coding", "sci-fi"]),
              gender: "Male",
              preferences: JSON.stringify({ gender: "Female", ageMin: 24, ageMax: 32 })
            }
          },
          survey: {
            create: {
              communication: 2,
              lifePace: 4,
              conflictRes: 3,
              socialBattery: 5,
              humorType: 2,
              valuesScale: 5,
              curiosity: 5,
              adventure: 4,
              openness: 2,
              spontaneity: 4
            }
          }
        }
      });

      // Chloe (Writer)
      const chloe = await db.user.create({
        data: {
          email: "chloe@vibe.app",
          name: "Chloe Vance",
          profile: {
            create: {
              age: 25,
              bio: "Novelist and plant enthusiast. Can show you the best quiet bookstores. Leans introverted but loves long walks.",
              avatar: "linear-gradient(135deg, #FF5D8F 0%, #121212 100%)", // Light Red to Black
              interests: JSON.stringify(["books", "plants", "tea", "museums"]),
              gender: "Female",
              preferences: JSON.stringify({ gender: "Male", ageMin: 23, ageMax: 30 })
            }
          },
          survey: {
            create: {
              communication: 5,
              lifePace: 1,
              conflictRes: 5,
              socialBattery: 2,
              humorType: 4,
              valuesScale: 1,
              curiosity: 5,
              adventure: 2,
              openness: 5,
              spontaneity: 1
            }
          }
        }
      });

      // Marcus (Entrepreneur)
      const marcus = await db.user.create({
        data: {
          email: "marcus@vibe.app",
          name: "Marcus Aurelius",
          profile: {
            create: {
              age: 32,
              bio: "Building a fintech startup. Runner, travel junkie, and self-improvement student. Always moving forward.",
              avatar: "linear-gradient(135deg, #E8E4FF 0%, #FFFFFF 100%)", // Lavender to White
              interests: JSON.stringify(["running", "travel", "gym", "investing"]),
              gender: "Male",
              preferences: JSON.stringify({ gender: "Female", ageMin: 25, ageMax: 35 })
            }
          },
          survey: {
            create: {
              communication: 3,
              lifePace: 5,
              conflictRes: 2,
              socialBattery: 4,
              humorType: 3,
              valuesScale: 4,
              curiosity: 3,
              adventure: 5,
              openness: 3,
              spontaneity: 5
            }
          }
        }
      });

      // Answer some scenarios for the seed users to generate instant game matches
      const scenarios = await db.systemScenario.findMany();
      if (scenarios.length >= 3) {
        // Maya answers
        await db.gameAnswer.createMany({
          data: [
            { userId: maya.id, scenarioId: scenarios[0].id, optionChoice: "B" },
            { userId: maya.id, scenarioId: scenarios[1].id, optionChoice: "B" },
            { userId: maya.id, scenarioId: scenarios[2].id, optionChoice: "D" }
          ]
        });

        // Liam answers
        await db.gameAnswer.createMany({
          data: [
            { userId: liam.id, scenarioId: scenarios[0].id, optionChoice: "A" },
            { userId: liam.id, scenarioId: scenarios[1].id, optionChoice: "C" },
            { userId: liam.id, scenarioId: scenarios[2].id, optionChoice: "A" }
          ]
        });

        // Chloe answers
        await db.gameAnswer.createMany({
          data: [
            { userId: chloe.id, scenarioId: scenarios[0].id, optionChoice: "B" },
            { userId: chloe.id, scenarioId: scenarios[1].id, optionChoice: "B" },
            { userId: chloe.id, scenarioId: scenarios[2].id, optionChoice: "D" }
          ]
        });

        // Marcus answers
        await db.gameAnswer.createMany({
          data: [
            { userId: marcus.id, scenarioId: scenarios[0].id, optionChoice: "D" },
            { userId: marcus.id, scenarioId: scenarios[1].id, optionChoice: "A" },
            { userId: marcus.id, scenarioId: scenarios[2].id, optionChoice: "B" }
          ]
        });
      }
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully!" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to seed database";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
