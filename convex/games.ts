import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return [];
    
    return await ctx.db
      .query("games")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

export const getTotals = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return {};
    
    const games = await ctx.db
      .query("games")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    
    const totals: Record<string, number> = {};
    
    // Initialize totals for all players
    session.playerIds.forEach((playerId) => {
      totals[playerId] = 0;
    });
    
    // Sum up points from all games
    games.forEach((game) => {
      Object.entries(game.points).forEach(([playerId, points]) => {
        if (totals[playerId] !== undefined) {
          totals[playerId] += points;
        }
      });
    });
    
    return totals;
  },
});

export const addGame = mutation({
  args: { 
    sessionId: v.id("sessions"),
    points: v.record(v.id("players"), v.number()),
    autoCalculated: v.boolean()
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Get the next game number
    const lastGame = await ctx.db
      .query("games")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .first();
    
    const gameNumber = lastGame ? lastGame.gameNumber + 1 : 1;
    
    return await ctx.db.insert("games", {
      sessionId: args.sessionId,
      gameNumber,
      points: args.points,
      autoCalculated: args.autoCalculated,
    });
  },
});

export const updateGame = mutation({
  args: { 
    gameId: v.id("games"),
    points: v.record(v.id("players"), v.number()),
    autoCalculated: v.boolean()
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    
    await ctx.db.patch(args.gameId, {
      points: args.points,
      autoCalculated: args.autoCalculated,
    });
  },
});

export const removeGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    
    await ctx.db.delete(args.gameId);
  },
});
