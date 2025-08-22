import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  sessions: defineTable({
    name: v.string(),
    players: v.array(v.object({
      id: v.string(), // Local player ID within session (UUID)
      name: v.string(),
    })),
    isActive: v.boolean(),
    endedAt: v.optional(v.number()),
    passcode: v.string(), // 6-digit passcode for joining
    createdBy: v.optional(v.id("users")), // Track session creator
    participants: v.optional(v.array(v.id("users"))), // Track who joined the session
  }).index("by_active", ["isActive"])
    .index("by_passcode", ["passcode"])
    .index("by_creator", ["createdBy"]),

  games: defineTable({
    sessionId: v.id("sessions"),
    gameNumber: v.number(),
    points: v.record(v.string(), v.number()), // Now uses local player IDs
    autoCalculated: v.boolean(),
  }).index("by_session", ["sessionId"])
    .index("by_session_and_game", ["sessionId", "gameNumber"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
