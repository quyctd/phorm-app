import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  players: defineTable({
    name: v.string(),
  }),

  sessions: defineTable({
    name: v.string(),
    playerIds: v.array(v.id("players")),
    isActive: v.boolean(),
    endedAt: v.optional(v.number()),
  }).index("by_active", ["isActive"]),

  games: defineTable({
    sessionId: v.id("sessions"),
    gameNumber: v.number(),
    points: v.record(v.id("players"), v.number()),
    autoCalculated: v.boolean(),
  }).index("by_session", ["sessionId"])
    .index("by_session_and_game", ["sessionId", "gameNumber"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
