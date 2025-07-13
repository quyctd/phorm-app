import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateShareToken, generatePlayerId } from "./utils";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Get all sessions (no auth required for now)
    return await ctx.db
      .query("sessions")
      .order("desc")
      .collect();
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    // Get any active session (no auth required for now)
    return await ctx.db
      .query("sessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    playerNames: v.array(v.string()),
    isPublic: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // End any active session first
    const activeSession = await ctx.db
      .query("sessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (activeSession) {
      await ctx.db.patch(activeSession._id, {
        isActive: false,
        endedAt: Date.now(),
      });
    }

    // Create players with unique IDs
    const players = args.playerNames.map(name => ({
      id: generatePlayerId(),
      name: name.trim(),
    }));

    const shareToken = args.isPublic ? generateShareToken() : undefined;

    return await ctx.db.insert("sessions", {
      name: args.name.trim(),
      players,
      isActive: true,
      isPublic: args.isPublic || false,
      shareToken,
    });
  },
});

export const end = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      isActive: false,
      endedAt: Date.now(),
    });
  },
});

export const getResults = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    // Get all games for this session
    const games = await ctx.db
      .query("games")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    // Calculate totals for each player - handle both new and legacy formats
    const totals: Record<string, number> = {};
    let players: Array<{ id: string; name: string; }> = [];

    if (session.players) {
      // New format: session-scoped players
      players = session.players;
      for (const player of session.players) {
        totals[player.id] = 0;
      }
    }

    for (const game of games) {
      for (const [playerId, points] of Object.entries(game.points)) {
        if (totals[playerId] !== undefined) {
          totals[playerId] += points;
        }
      }
    }

    // Create final results sorted by points (lowest first)
    const results = players
      .map((player) => ({
        player,
        total: totals[player.id] || 0,
      }))
      .sort((a, b) => a.total - b.total);

    // Return session with normalized format
    const normalizedSession = {
      ...session,
      players,
      isPublic: session.isPublic || false,
    };

    return {
      session: normalizedSession,
      games,
      results,
      totalGames: games.length,
    };
  },
});

// Session sharing functionality will be added later when authentication is implemented
