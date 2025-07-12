import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("sessions")
      .order("desc")
      .collect();
    
    return await Promise.all(
      sessions.map(async (session) => {
        const players = await Promise.all(
          session.playerIds.map((id) => ctx.db.get(id))
        );
        return {
          ...session,
          players: players.filter(Boolean),
        };
      })
    );
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    
    if (!session) return null;
    
    const players = await Promise.all(
      session.playerIds.map((id) => ctx.db.get(id))
    );
    
    return {
      ...session,
      players: players.filter(Boolean),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    playerIds: v.array(v.id("players"))
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

    // Get player names for historical preservation
    const players = await Promise.all(
      args.playerIds.map((id) => ctx.db.get(id))
    );
    const playerNames: Record<string, string> = {};
    for (const player of players) {
      if (player) {
        playerNames[player._id] = player.name;
      }
    }

    return await ctx.db.insert("sessions", {
      name: args.name.trim(),
      playerIds: args.playerIds,
      playerNames,
      isActive: true,
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

    // Get all players for this session, preserving historical data
    const players = await Promise.all(
      session.playerIds.map(async (id) => {
        const player = await ctx.db.get(id);
        if (player) {
          return player;
        }

        // Player was deleted - use stored historical name
        const historicalName = session.playerNames?.[id] || `Deleted Player (${id.slice(-4)})`;
        return {
          _id: id,
          name: historicalName,
          _creationTime: 0, // Placeholder
          isDeleted: true, // Mark as deleted for UI handling
        };
      })
    );

    // Calculate totals for each player (including deleted ones)
    const totals: Record<string, number> = {};
    for (const playerId of session.playerIds) {
      totals[playerId] = 0;
    }

    for (const game of games) {
      for (const [playerId, points] of Object.entries(game.points)) {
        if (totals[playerId] !== undefined) {
          totals[playerId] += points;
        }
      }
    }

    // Create final results sorted by points (lowest first) - include ALL players
    const results = players
      .map((player) => ({
        player,
        total: totals[player._id] || 0,
      }))
      .sort((a, b) => a.total - b.total);

    return {
      session: {
        ...session,
        players: players,
      },
      games,
      results,
      totalGames: games.length,
    };
  },
});
